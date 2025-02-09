// @flow
import type {StorageConfig} from 'Common/src/storage/StorageService.js';
import type {Storable} from 'Common/src/storage/adapters/StorageAdapter.js';
import IndexedDBAdapter from 'Common/src/storage/adapters/IndexedDBAdapter.js';

/**
 * The crypto adapter for StorageService.
 *
 * This adapter provides AES-CBC encryption, using the browser Web Cryptography API
 * (https://dvcs.w3.org/hg/webcrypto-api/raw-file/tip/spec/Overview.html#dfn-GlobalCrypto)
 * with a server-provided key, persisting into the IndexedDB adapter.
 *
 * Please note:
 * - A cryptographic key must be provided using CryptoAdapter.setKey;. Until a key is
 *   provided the adapter remains in an initialization state.
 * - If an invalid cryptographic key is provided, initialization completes in the error
 *   state, causing Storage to fallback to the memory adapter.
 */
export default class CryptoAdapter {
	// Name of adapter
	static NAME: string = 'crypto';

	// Encryption algorithm
	static ALGO: string = 'AES-CBC';

	// Initialization vector length (bytes)
	static IV_LENGTH: number = 16;

	// A sentinel value to verify the key against pre-existing data
	static SENTINEL: string = 'cryptoadapter';

	// Web Cryptography API
	static engine: SubtleCrypto = window.crypto.subtle;

	// Key used to encrypt/decrypt data before storing in IndexedDB
	static key: CryptoKey;

	// Promise that resolves with the per-application encryption key
	static keyPromise: Promise<CryptoKey>;

	#config: StorageConfig;
	#adapter: IndexedDBAdapter;

	// Utils to convert to/from Uint8Array and Object
	#encoder: TextEncoder;
	#decoder: TextDecoder;

	// Promise that is fulfilled when this adapter has completed initialization
	#initializePromise: Promise<void> | void;
	// Promise that is fulfilled when the underlying IndexedDBAdapter has completed initialization
	#adapterInitializePromise: Promise<void>;

	// Constructor accepts optional adapter arg for unit test mocking
	constructor(config: StorageConfig, adapter?: IndexedDBAdapter) {
		this.#config = config;

		// underlying adapter; must wait for it to be initialized before performing most operations
		this.#adapter = adapter || new IndexedDBAdapter(this.#config);
	}

	/**
	 * Sets the per-application encryption key.
	 * @param {ArrayBuffer} rawKey The raw bytes of the encryption key
	 */
	static setKey(rawKey: ArrayBuffer): void {
		// Single encryption key will be shared between multiple CryptoAdapter instances if needed
		if (CryptoAdapter.keyPromise) {
			return;
		}

		CryptoAdapter.keyPromise = new Promise((resolve, reject) => {
			CryptoAdapter.engine
				.importKey(
					'raw', // format
					rawKey, // raw key as an ArrayBuffer
					CryptoAdapter.ALGO, // algorithm of key
					false, // don't allow key export
					['encrypt', 'decrypt'] // allowed operations
				)
				.then(
					(key) => {
						// it's possible for key import to fail, which we treat as a fatal error
						// move to reject state, all pending and future operations will fail
						if (!key) {
							reject(new Error('CryptoAdapter engine.importKey() returned no key, rejecting'));
							return;
						}

						resolve(key);
					},
					(e) => {
						reject(new Error('CryptoAdapter engine.importKey() failed, rejecting: ' + e));
					}
				);
		});
	}

	/**
	 * Returns the name of the adapter.
	 *
	 * @returns {String} name of adapter
	 */
	getName(): string {
		return CryptoAdapter.NAME;
	}

	/**
	 * Starts the initialization process.
	 *
	 * @return {Promise} a promise that resolves when initialization has completed, or rejects if initialization has failed.
	 */
	async initialize(): Promise<void> {
		if (this.#initializePromise) {
			return this.#initializePromise;
		}

		// Promises tracking initialization state
		this.#adapterInitializePromise = this.#adapter.initialize();
		this.#initializePromise = this._initializeInternal();

		return this.#initializePromise;
	}

	/**
	 * Initializes the adapter by waiting for the app-wide crypto key to be set,
	 * then validates the key works for items already in persistent storage. Several
	 * error scenarios to detect:
	 * - invalid key provided -> fallback to memory storage
	 * - valid key is provided but can't fetch what's in storage -> clear then use crypto with new key
	 * - valid key is provided but doesn't match what's in storage -> clear then use crypto with new key
	 */
	async _initializeInternal(): Promise<void> {
		await Promise.all([CryptoAdapter.keyPromise, this.#adapterInitializePromise])
			.then(
				([key]) => {
					// it's possible for key generation to fail, which we treat as a fatal error
					if (!key) {
						// move to reject state, all pending and future operations will fail
						throw new Error('CryptoAdapter.key resolved with no key');
					}
					CryptoAdapter.key = key;
				}
				// reject: no key received or indexeddb adapter failed. leave in reject state
				// so crypto adapter initialize() rejects
			)
			.then(() => {
				// decryption failed so clear the store
				const handleInvalidSentinel = () => this.clear();

				// check if existing data can be decrypted
				return this.getItems([CryptoAdapter.SENTINEL], true).then((values: Map<string, Storable>) => {
					// if sentinel value is incorrect then clear the store. crypto will operate with new key.
					if (
						!values.get(CryptoAdapter.SENTINEL) ||
						values.get(CryptoAdapter.SENTINEL)?.value !== CryptoAdapter.SENTINEL
					) {
						// TODO avoid double clear() when config[clearOnInit] is also true
						return handleInvalidSentinel();
					}

					// new key matches key used in store. existing values remain.
				}, handleInvalidSentinel);
			})
			.then(() => {
				// underlying store is setup, either as crypto or memory fallback. this store
				// is now ready for use.
				return this._setSentinelItem();
			});
	}

	/**
	 * Returns adapter size.
	 *
	 * @returns {Promise} a promise that resolves with the size in bytes
	 */
	async getSize(): Promise<number> {
		return this.#adapter.getSize();
	}

	/**
	 * Retrieves keys from storage.
	 * @returns {Promise<Array>} A promise that resolves to an array of keys.
	 */
	getKeys(): Promise<Array<string>> {
		return this.#adapter.getKeys();
	}

	/**
	 * Retrieves items from storage and decrypts.
	 * @param {String[]} [keys] The set of keys to retrieve. Undefined to retrieve all items.
	 * @param {Boolean} [includeInternalKeys] True to return internal entries, i.e. the sentinel value
	 * @returns {Promise} A promise that resolves with an object that contains key-value pairs.
	 */
	async getItems(keys: Array<string>, includeInternalKeys?: boolean = false): Promise<Map<string, Storable>> {
		return this.#adapter.getItems(keys).then((values: Map<string, Storable>) => {
			const decrypted = new Map<string, Storable>();
			const promises = [];
			values.forEach((value, key) => {
				if (!value) {
					// should never get back a non-crypto payload. treat is as though
					// the underlying adapter doesn't have it.
				} else {
					const promise = this._decrypt(key, value).then(
						(decryptedValue) => {
							// do not return the sentinel. note that we did verify it decrypts correctly.
							if (key !== CryptoAdapter.SENTINEL || includeInternalKeys) {
								decrypted.set(key, decryptedValue);
							}
						},
						() => {
							// decryption failed. do not add the key to decrypted to indicate we
							// do not have the key. do not rethrow to return the promise to resolve state.
						}
					);

					promises.push(promise);
				}
			});
			return Promise.all(promises).then(() => {
				return decrypted;
			});
		});
	}

	/**
	 * Encrypts items and stores them in storage.
	 * @param {Array} payloads An array of StoragePayloads to be stored
	 *
	 * @returns {Promise} A promise that resolves when the items are stored.
	 */
	async setItems(payloads: Array<Storable>): Promise<void> {
		const promises = [];
		for (const payload of payloads) {
			promises.push(this._encrypt(payload));
		}

		return Promise.all(promises).then((encryptedPayloads) => {
			return this.#adapter.setItems(encryptedPayloads);
		});
	}

	/**
	 * Removes items from storage.
	 * @param {String[]} keys The keys of the items to remove.
	 *
	 * @returns {Promise} A promise that resolves when all items are removed.
	 */
	async removeItems(keys: Array<string>): Promise<void> {
		// note: rely on StorageInstance key prefixing to avoid clashing with sentinel key
		return this.#adapter.removeItems(keys);
	}

	/**
	 * Clears storage.
	 *
	 * @returns {Promise} a promise that resolves when the store is cleared
	 */
	async clear(): Promise<void> {
		return this.#adapter.clear().then(() => {
			return this._setSentinelItem();
		});
	}

	/**
	 * Deletes this storage.
	 *
	 * @returns {Promise} A promise that resolves when storage is deleted
	 */
	async deleteStorage(): Promise<void> {
		return this.#adapter.deleteStorage();
	}

	/**
	 * Sweeps over the store to evict expired items.
	 *
	 * @returns {Promise} A promise that resolves when the sweep is complete.
	 */
	async sweep(): Promise<void> {
		// underlying adapter may sweep the sentinel so always re-add it
		return this.#adapter.sweep().then(() => {
			return this._setSentinelItem();
		});
	}

	/**
	 * Resumes eviction.
	 */
	resumeSweeping(): void {
		this.#adapter.resumeSweeping();
	}

	/**
	 * Suspends eviction.
	 */
	suspendSweeping(): void {
		this.#adapter.suspendSweeping();
	}

	/**
	 * Stores entry used to determine whether encryption key provided can decrypt the store.
	 *
	 * @returns {Promise} Promise that resolves when the item is stored.
	 */
	async _setSentinelItem(): Promise<void> {
		const now = new Date().getTime();
		// shape must match StorageInstance#buildPayload
		const payload = {
			key: CryptoAdapter.SENTINEL,
			value: CryptoAdapter.SENTINEL,
			created: now,
			expires: now + 15768000000, // 1/2 year
			size: 0
		};

		return this.setItems([payload]);
	}

	/**
	 * Decrypts a stored cached entry.
	 *
	 * @param {String} key The key of the value to decrypt.
	 * @param {Object} value The cache entry to decrypt.
	 * @returns {Promise} Promise that resolves with the decrypted item.
	 */
	async _decrypt(key: string, value: Storable): Promise<Storable> {
		if (!value || !value.value) {
			return Promise.reject(new Error('CryptoAdapter._decrypt() value is malformed for key' + key));
		}

		return CryptoAdapter.engine
			.decrypt(
				{
					name: CryptoAdapter.ALGO,
					iv: value.value.iv
				},
				CryptoAdapter.key,
				value.value.cipher
			)
			.then((decrypted: ArrayBuffer) => {
				return {
					key: value.key,
					value: this._uint8ArrayToString(new Uint8Array(decrypted)),
					created: value.created,
					expires: value.expires,
					size: value.size,
					valueFetchTime: value.valueFetchTime
				};
			});
	}

	/**
	 * Encrypts the value of a Storable.
	 * @param {Storable} Payload to be encrypted.
	 *
	 * @returns {Promise} Promise that resolves to a Storable with encrypted value.
	 */
	async _encrypt(payload: Storable): Promise<Storable> {
		return new Promise((resolve, reject) => {
			let itemArrayBuffer;
			try {
				itemArrayBuffer = this._stringToUint8Array(payload.value);
			} catch (e) {
				// if json serialization errors then reject
				return reject(e);
			}

			// generate a new initialization vector for every item
			const iv = window.crypto.getRandomValues(new Uint8Array(CryptoAdapter.IV_LENGTH));
			CryptoAdapter.engine
				.encrypt(
					{
						name: CryptoAdapter.ALGO,
						iv: iv
					},
					CryptoAdapter.key,
					itemArrayBuffer
				)
				.then(
					(encrypted) => {
						resolve({
							key: payload.key,
							value: {iv: iv, cipher: encrypted},
							created: payload.created,
							expires: payload.expires,
							size: payload.size,
							valueFetchTime: payload.valueFetchTime
						});
					},
					(err) => {
						reject(err);
					}
				);
		});
	}

	/**
	 * Wrapper around TextEncoder.encode so we can mock that API in tests.
	 */
	_stringToUint8Array(s: string): Uint8Array {
		if (!this.#encoder) {
			// Lazily created since test code would fail trying to construct this class
			this.#encoder = new window.TextEncoder();
		}

		return this.#encoder.encode(s);
	}

	/**
	 * Wrapper around TextDecoder.decode so we can mock that API in tests.
	 */
	_uint8ArrayToString(a: Uint8Array): string {
		if (!this.#decoder) {
			// Lazily created since test code would fail trying to construct this class
			this.#decoder = new window.TextDecoder();
		}

		return this.#decoder.decode(a);
	}
}
