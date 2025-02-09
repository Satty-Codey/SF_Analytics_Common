// @flow
import type {StorageConfig, ResolveFunc, RejectFunc} from 'Common/src/storage/StorageService.js';
import type {Storable} from 'Common/src/storage/adapters/StorageAdapter.js';

/**
 * The IndexedDB adapter for StorageService.
 *
 * Implementation notes:
 *
 * Each store name gets its own DB. Each app gets its own ObjectStore (aka table). If the same
 * store name is used across apps (eg actions ) then a single DB contains multiple ObjectStores.
 * TODO - it'd be better scoped to have one DB per app with all its tables within.
 *
 * Sizing is approximate and updates to sizes are very approximate. We recalculate when our error bars get
 * too big or after a certain number of updates. This is locked to happen no more than once every 15 minutes
 * if our size is not over the limit.
 * TODO - revamp size calculations to be more understandable while still supporting multiple browser tabs
 *
 * Entire table scans are performed for:
 * (1) getAll(undefined), since we have to.
 * (2) size or error bar over the limit.
 * (3) getSize, with an old size guess.
 * (4) sweep, since we're already scanning the table.
 */
export default class IndexedDBAdapter {
	// Name of the adapter
	static NAME: string = 'indexeddb';

	// Max time for initialize to complete
	static INITIALIZE_TIMEOUT: number = 30 * 1000;

	// Threshold of time elapsed getting items from object store before a metric is logged
	static OBJECTSTORE__TRANSACTION_THRESHOLD: number = 500;

	initializePromise: Promise<void>;
	initializePromiseResolve: ResolveFunc;
	initializePromiseReject: RejectFunc;

	#config: StorageConfig;
	#tableName: string;
	#ready: boolean | void;

	#db: IDBDatabase;
	#transaction: IDBTransaction;

	#sizeLastReal: number;
	#sizeGuess: number;
	#sizeErrorBar: number;
	#sizeAge: number;
	#sizeAvg: number;

	#sizeMistake: number;
	#sizeMistakeMax: number;
	#sizeMistakeCount: number;
	#sizeOutsideErrorBar: number;

	#sweepingSuspended: boolean;
	#lastSweep: number;
	#sweepInterval: number;
	#expiresFudge: number;
	#limitSweepHigh: number;
	#limitSweepLow: number;
	#limitError: number;

	// initialize()'s timer id
	#initializeTimeoutId: TimeoutID | void;

	constructor(config: StorageConfig) {
		this.#config = config;

		this.#tableName = config.partitionName || 'store';

		// whether the adapter is ready to service operations
		// - undefined = being setup (requests are queued)
		// - true = ready (requests are immediately run)
		// - false = permanent error (requests are immediately rejected)
		this.#ready = undefined;

		// FIXME: fix size calculation
		this.#sizeLastReal = 0;
		this.#sizeGuess = 0;
		this.#sizeErrorBar = 0;
		this.#sizeAge = 1000000;
		this.#sizeAvg = 100;

		this.#sizeMistake = 0;
		this.#sizeMistakeMax = 0;
		this.#sizeMistakeCount = 0;
		this.#sizeOutsideErrorBar = 0;

		this.#sweepingSuspended = false;
		this.#lastSweep = 0;
		this.#sweepInterval = 15 * 60 * 1000; // 15 minutes
		this.#expiresFudge = 10000; // 10 seconds
		this.#limitSweepHigh = 0.9 * config.maxSize; // 90%
		this.#limitSweepLow = 0.7 * config.maxSize; // 70%
		this.#limitError = 0.5 * config.maxSize; // 50% for the error bar

		// initialize()'s timer id
		this.#initializeTimeoutId = undefined;
	}

	/**
	 * Returns the name of the adapter.
	 *
	 * @returns {String} name of adapter
	 */
	getName(): string {
		return IndexedDBAdapter.NAME;
	}

	/**
	 * Return the IndexedDB being used. Exposed for testing.
	 */
	getDb(): IDBDatabase {
		return this.#db;
	}

	/**
	 * Starts the initialization process.
	 * @return {Promise} a promise that resolves when initialization has completed, or rejects if initialization has failed.
	 */
	async initialize(): Promise<void> {
		if (this.initializePromise) {
			return this.initializePromise;
		}

		this.initializePromise = new Promise((resolve, reject) => {
			this.initializePromiseResolve = resolve;
			this.initializePromiseReject = reject;
		});

		this._initializeInternal();
		return this.initializePromise;
	}

	/**
	 * Initializes the adapter by setting up the DB and ObjectStore.
	 * @param {Number} version Optional version value for IndexedDB.open(). Set to a new value if schema
	 * needs to change (eg new table, new index).
	 */
	_initializeInternal(version?: number): void {
		// it's been observed that indexedDB.open() does not trigger any event when it is under significant
		// load (eg multiple frames concurrently calling open()). this hangs this adapter's init so apply
		// a maximum wait time before moving to a permanent error state.
		if (!this.#initializeTimeoutId) {
			this.#initializeTimeoutId = setTimeout(() => {
				// setup hasn't completed so move to permanenet error state
				const message = 'initialization: timed out setting up DB';
				this._initializeComplete(false, message);
			}, IndexedDBAdapter.INITIALIZE_TIMEOUT);
		}

		// version is dynamic because it needs to be incremented when we need to create an objectStore
		// for the current app or cmp. IndexedDB only allows modifications to db or objectStore during
		// version change. Hence, we check for the existence of the table and increment the version
		// if it needs to be created in _setupDB().
		const dbRequest = window.indexedDB.open(this.#config.name, version);

		dbRequest.onupgradeneeded = (e: IDBVersionChangeEvent) => {
			// this is fired if there's a version mismatch. if createTable() doesn't throw
			// then onsuccess() is fired, else onerror() is fired.
			this._createTables(e);
		};

		dbRequest.onsuccess = (e) => {
			this._setupDB(e);
		};

		dbRequest.onerror = (e) => {
			// this means we have no storage.
			let message = 'initialization: error opening DB';
			message += e.target.error && e.target.error.message ? ': ' + e.target.error.message : '';

			// reject all pending operations
			this._initializeComplete(false, message);

			// prevent uncatchable InvalidStateError in FF private mode
			e.preventDefault && e.preventDefault();
		};
	}

	/**
	 * Marks initialization of the adapter as completed successfully or not.
	 * @param {Boolean} ready True if the adapter is ready; false if the adapter is in permanent error state.
	 * @param {String} errorMessage If ready is false, the error message describing cause of the initialization failure.
	 */
	_initializeComplete(ready: boolean, errorMessage?: string): void {
		if (this.#ready !== undefined) {
			return;
		}

		this.#ready = ready;

		clearTimeout(this.#initializeTimeoutId);

		if (this.#ready) {
			this.initializePromiseResolve();
		} else {
			this.initializePromiseReject(new Error(errorMessage));
		}
	}

	/**
	 * Returns adapter size.
	 * @returns {Promise} a promise that resolves with the size in bytes
	 */
	async getSize(): Promise<number> {
		if (this.#sizeAge < 50) {
			return Promise.resolve(this.#sizeGuess);
		} else {
			return new Promise((resolve, reject) => {
				this._walkInternal(resolve, reject, false);
			});
		}
	}

	/**
	 * Retrieves keys from storage.
	 * @returns {Promise<Array<string>>} A promise that resolves to an array of keys.
	 */
	getKeys(): Promise<Array<string>> {
		return new Promise((resolve, reject) => {
			this.#transaction = this._getTransaction('readonly');
			const objectStore = this._getObjectStore();

			// $FlowFixMe[prop-missing]
			const dbRequest = objectStore.getAllKeys();

			dbRequest.onsuccess = (event) => resolve(dbRequest.result);

			dbRequest.onerror = (event) => {
				reject(new Error('IndexedDBAdapter.getAllKeys: error retrieving keys: ' + event.error));
			};

			dbRequest.onabort = (event) => {
				reject(new Error('IndexedDBAdapter.getAllKeys: transaction aborted: ' + event.error));
			};
		});
	}

	/**
	 * Retrieves items from storage.
	 * @param {String[]} [keys] The set of keys to retrieve. Undefined to retrieve all items.
	 * @returns {Promise} A promise that resolves with an object that contains key-value pairs.
	 */
	async getItems(keys: Array<string>): Promise<Map<string, Storable>> {
		// TODO - optimize by respecting includeExpired
		return new Promise((resolve, reject) => {
			if (!Array.isArray(keys) || keys.length === 0) {
				this._walkInternal(resolve, reject, true);
			} else {
				this._getItemsInternal(keys, resolve, reject);
			}
		});
	}

	/**
	 * Retrieves items from storage.
	 * @param {String[]} keys The keys of the items to retrieve.
	 * @param {Function} resolve Promise resolve function.
	 * @param {Function} reject Promise resolve function.
	 */
	_getItemsInternal(keys: Array<string>, resolve: ResolveFunc, reject: RejectFunc): void {
		this.#transaction = this._getTransaction('readonly');
		const objectStore = this._getObjectStore();

		const results = new Map<string, Storable>();
		let collected = 0;

		const collector = (event: Event) => {
			// $FlowIgnore[prop-missing]
			const request: IDBRequest = event.target;
			// $FlowIgnore[incompatible-exact]
			const stored: Storable = request.result || {};
			const key = stored.key;

			if (key) {
				results.set(key, stored);
			}

			collected++;
			if (collected === keys.length) {
				resolve(results);
			}
		};

		this.#transaction.onabort = () => {
			// $FlowIgnore[unsafe-addition]
			const message = '_getItemsInternal(): transaction aborted for keys [' + keys + ']: ' + this.#transaction.error;
			reject(new Error('IndexedDBAdapter.' + message));
		};

		this.#transaction.onerror = () => {
			// $FlowIgnore[unsafe-addition]
			const message = '_getItemsInternal(): transaction error for keys [' + keys + ']: ' + this.#transaction.error;
			reject(new Error('IndexedDBAdapter.' + message));
		};

		let objectStoreRequest;
		for (const key of keys) {
			objectStoreRequest = objectStore.get(key);
			objectStoreRequest.onsuccess = collector;
		}
	}

	/**
	 * Walks everything in the DB (read only).
	 * @param {Function} resolve Promise resolve function
	 * @param {Function} reject Promise reject function
	 * @param {Boolean} sendResult True to resolve the promise with the full set of results; false to resolve with the size.
	 */
	_walkInternal(resolve: ResolveFunc, reject: RejectFunc, sendResult: boolean): void {
		this.#transaction = this._getTransaction('readonly');

		const objectStore = this._getObjectStore();
		const cursorRequest = objectStore.openCursor();
		const result = new Map<string, Storable>();

		let count = 0;
		let size = 0;

		cursorRequest.onsuccess = (event) => {
			const cursor = event.target.result;
			if (cursor) {
				const stored = cursor.value;

				if (stored) {
					size += stored.size;
					count += 1;

					if (sendResult) {
						result.set(stored.key, stored);
					}
				}
				cursor.continue();
			} else {
				this._refreshSize(size, count);

				// async sweep
				if (this.#sizeGuess > this.#limitSweepHigh) {
					this._expireCache(0);
				}

				if (sendResult) {
					resolve(result);
				} else {
					resolve(this.#sizeGuess);
				}
			}
		};

		cursorRequest.onerror = (event) => {
			reject(new Error('IndexedDBAdapter._walkInternal: Transaction failed: ' + event.error));
		};
	}

	/**
	 * Stores items in storage.
	 * @param {Array} payloads An array of StoragePayloads to be stored.
	 * @returns {Promise} A promise that resolves when the items are stored.
	 */
	async setItems(storables: Array<Storable>): Promise<void> {
		return new Promise((resolve, reject) => {
			const sizes = storables.reduce((curSize, storable) => curSize + storable.size, 0);

			// async expire if believed to be necessary
			if (
				sizes + this.#sizeGuess + this.#sizeErrorBar > this.#limitSweepHigh ||
				this.#sizeErrorBar > this.#limitError
			) {
				this._expireCache(sizes);
			}

			this.#transaction = this._getTransaction('readwrite');
			const objectStore = this._getObjectStore();

			let collected = 0;
			const collector = () => {
				collected++;
				if (collected === storables.length) {
					// transaction is done so update size then resolve.
					this._updateSize(sizes / 2, sizes / 2);
					resolve();
				}
			};

			this.#transaction.onabort = () => {
				const keys = storables.map((payload) => {
					return payload.key;
				});

				// $FlowIgnore[unsafe-addition]
				const message = 'setItemsInternal(): transaction aborted for keys [' + keys + ']: ' + this.#transaction.error;
				reject(new Error('IndexedDBAdapter.' + message));
			};

			this.#transaction.onerror = () => {
				const keys = storables.map((payload) => payload.key);

				// $FlowIgnore[unsafe-addition]
				const message = 'setItemsInternal(): transaction error for keys [' + keys + ']: ' + this.#transaction.error;
				reject(new Error('IndexedDBAdapter.' + message));
			};

			let objectStoreRequest;
			for (let i = 0; i < storables.length; i++) {
				try {
					objectStoreRequest = objectStore.put(storables[i]);
					objectStoreRequest.onsuccess = collector;
				} catch (e) {
					reject(e);
					return;
				}
			}
		});
	}

	/**
	 * Removes items from storage.
	 * @param {String[]} keys The keys of the items to remove.
	 * @returns {Promise} A promise that resolves when all items are removed.
	 */
	async removeItems(keys: Array<string>): Promise<void> {
		return new Promise((resolve, reject) => {
			this.#transaction = this._getTransaction('readwrite');
			const objectStore = this._getObjectStore();

			const sizeAvg = this.#sizeAvg; // capture current sizeAvg

			let collected = 0;

			const collector = () => {
				collected++;
				if (collected === keys.length) {
					// transaction is done so update size then resolve
					this._updateSize(-sizeAvg, sizeAvg);
					resolve();
				}
			};

			this.#transaction.onabort = () => {
				const message =
					// $FlowIgnore[unsafe-addition]
					'removeItemsInternal(): transaction aborted for keys [' + keys + ']: ' + this.#transaction.error;
				reject(new Error('IndexedDBAdapter.' + message));
			};

			this.#transaction.onerror = () => {
				// $FlowIgnore[unsafe-addition]
				const message = 'removeItemsInternal(): transaction error for keys [' + keys + ']: ' + this.#transaction.error;
				reject(new Error('IndexedDBAdapter.' + message));
			};

			let objectStoreRequest;
			for (const key of keys) {
				try {
					objectStoreRequest = objectStore.delete(key);
					objectStoreRequest.onsuccess = collector;
				} catch (e) {
					reject(e);
					return;
				}
			}
		});
	}

	/**
	 * Clears storage.
	 * @returns {Promise} A promise that resolves when the store is cleared.
	 */
	clear(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.#transaction = this._getTransaction('readwrite');
			const objectStore = this._getObjectStore();

			try {
				objectStore.clear();
			} catch (e) {
				reject(e);
				return;
			}

			this._setSize(0, 0);

			this.#transaction.onabort = () => {
				// $FlowIgnore[unsafe-addition]
				reject(new Error('IndexedDBAdapter.clear(): Transaction aborted: ' + this.#transaction.error));
			};

			this.#transaction.oncomplete = () => {
				resolve();
			};

			this.#transaction.onerror = () => {
				// $FlowIgnore[unsafe-addition]
				reject(new Error('IndexedDBAdapter.clear(): Transaction failed: ' + this.#transaction.error));
			};
		});
	}

	/**
	 * Deletes the ENTIRE DB which may contain ObjectStores belonging to other app/cmp.
	 * TODO W-2691320 - change db vs store name to avoid this issue.
	 * @return {Promise} A promise that deletes the entire database
	 */
	async deleteStorage(): Promise<void> {
		return new Promise((resolve, reject) => {
			// IE and Safari need to be explicitly closed otherwise may end up stuck in a blocked state
			this.#db.close();

			const dbRequest = window.indexedDB.deleteDatabase(this.#config.name);

			dbRequest.onerror = () => {
				const message = 'deleteStorage(): delete database error';
				reject(new Error('IndexedDBAdapter.' + message));
			};

			dbRequest.onsuccess = () => {
				resolve();
			};
		});
	}

	/**
	 * Sweeps over the store to evict expired items.
	 * @returns {Promise} A promise that resolves when the sweep is complete.
	 */
	async sweep(): Promise<void> {
		return new Promise((resolve, reject) => {
			// 0 because we don't need any space freed. this causes expired items
			// to be evicted + brings the store size below max size.
			this._expireCache(0, resolve, reject);
		});
	}

	/**
	 * Resumes eviction.
	 */
	resumeSweeping(): void {
		this.#sweepingSuspended = false;
	}

	/**
	 * Suspends eviction.
	 */
	suspendSweeping(): void {
		this.#sweepingSuspended = true;
	}

	/**
	 * Creates tables in the DB.
	 * @param {Event} event IndexedDB event
	 */
	_createTables(event: IDBVersionChangeEvent): void {
		const db = event.target.result;
		const transaction = event.target.transaction;

		let objectStore;

		// these checks are required because IndexedDB will error on existing things
		if (!db.objectStoreNames.contains(this.#tableName)) {
			// non existent table
			objectStore = db.createObjectStore(this.#tableName, {keyPath: 'key'});
		} else if (transaction) {
			// existing table
			objectStore = transaction.objectStore(this.#tableName);
		}

		if (objectStore) {
			// check for existing index
			// $FlowIgnore[prop-missing]
			if (!objectStore.indexNames.contains('expires')) {
				objectStore.createIndex('expires', 'expires', {unique: false});
			}
		}
	}

	/**
	 * Initializes the structure with a new DB.
	 * @param {Event} event IndexedDB event.
	 */
	_setupDB(event: IDBEvent): void {
		const db = event.target.result;
		this.#db = db;
		this.#db.onversionchange = (e) => {
			e.target.close();
		};

		if (!db.objectStoreNames.contains(this.#tableName)) {
			// objectStore does not exist so increment version so we can create it
			const currentVersion = db.version;
			db.close();

			this._initializeInternal(currentVersion + 1);
		} else {
			this._initializeComplete(true);
		}
	}

	/**
	 * Gets the objectStore for the transaction, retries the transaction if there's a failure
	 */
	_getObjectStore(): IDBObjectStore {
		try {
			return this.#transaction.objectStore(this.#tableName);
		} catch (e) {
			// firefox 59 does not mix promises and indexeddb transactions, so we have to re-create the transaction
			this.#transaction = this.#db.transaction([this.#tableName], this.#transaction.mode);
			return this.#transaction.objectStore(this.#tableName);
		}
	}

	/**
	 * Returns a promise for the transaction
	 */
	_getTransaction(mode: IDBTransactionMode): IDBTransaction {
		return this.#db.transaction([this.#tableName], mode);
	}

	/**
	 * Evicts entries and updates the cached size of the store.
	 *
	 * Entries are evicted until requested size is freed. Algorithm evicts
	 * items based on age and not sharing the key prefix (aka isolation key). An
	 * LRU algorithm is not used which differentiates this adapter from others.
	 *
	 * The rest of the store is traversed to calculate the real size of the
	 * persisted data.
	 *
	 * @param {Number} requestedSize the size to free in bytes
	 * @param {Function} resolve promise resolve function
	 * @param {Function} reject promise reject function
	 */
	_expireCache(requestedSize: number, resolve?: ResolveFunc, reject?: RejectFunc): void {
		const now = new Date().getTime();

		if (
			this.#sweepingSuspended ||
			(this.#lastSweep + this.#sweepInterval > now && this.#sizeGuess < this.#limitSweepHigh)
		) {
			resolve && resolve();
			return;
		}

		this.#lastSweep = now;
		this.#transaction = this._getTransaction('readonly');
		const objectStore = this._getObjectStore();
		const index = objectStore.index('expires');
		const cursorRequest = index.openCursor();
		let count = 0;
		let size = 0;
		let expiredSize = 0;
		const expireDate = now + this.#expiresFudge;
		let removeSize = requestedSize || 0;
		const keysToDelete = [];

		// if we are above the low water mark, sweep down to it.
		if (this.#sizeGuess > this.#limitSweepLow) {
			removeSize += this.#sizeGuess - this.#limitSweepLow;
		}

		cursorRequest.onsuccess = (event) => {
			const cursor = event.target.result;
			if (cursor) {
				const stored = cursor.value;

				if (stored) {
					let shouldEvict = false;

					if (stored.expires < expireDate || expiredSize < removeSize) {
						shouldEvict = true;
					}

					if (shouldEvict) {
						keysToDelete.push(cursor.primaryKey);
						expiredSize += stored.size;
					} else {
						size += stored.size;
						count += 1;
					}
				}
				cursor.continue();
			} else {
				this._refreshSize(size, count);

				if (keysToDelete.length > 0) {
					// $FlowIgnore[unused-promise]
					this.removeItems(keysToDelete);
				}

				if (resolve) {
					// intentionally don't return: the sweep is done so resolve the promise
					// but then check if we need to do an async sweep due to size
					resolve();
				}

				if (size > this.#limitSweepHigh) {
					this._expireCache(0);
				}
			}
		};

		cursorRequest.onerror = (event) => {
			if (reject) {
				reject(new Error('IndexedDBAdapter.getAll: Transaction failed: ' + event.error));
			}
		};
	}

	/**
	 * Updates the guessed size of the store.
	 * @param {Number} sizeChange The amount to change the size of the store.
	 * @param {Number} error A really random guess of the size of the error.
	 */
	_updateSize(sizeChange: number, error: number): void {
		this.#sizeGuess += sizeChange;
		this.#sizeErrorBar += error;
		this.#sizeAge += 1;
	}

	/**
	 * Refreshes the cached size of the store from real data.
	 * @param {Number} size The actual calculated size.
	 * @param {Number} count The number of items in the store.
	 */
	_refreshSize(size: number, count: number): void {
		let mistake = this.#sizeGuess - size;
		if (mistake < 0) {
			mistake = -mistake;
		}

		if (mistake > this.#sizeMistakeMax) {
			this.#sizeMistakeMax = mistake;
		}

		this.#sizeMistake += mistake;
		this.#sizeMistakeCount += 1;

		if (mistake > this.#sizeErrorBar) {
			this.#sizeOutsideErrorBar += 1;
		}

		this._setSize(size, count);
	}

	/**
	 * Sets the cached size of the store. Callers must provide sizes based
	 * on real data, not estimates.
	 * @param {number} size The actual calculated size.
	 * @param {number} count The number of items in the store.
	 */
	_setSize(size: number, count: number): void {
		this.#sizeLastReal = size;
		this.#sizeGuess = size;
		this.#sizeErrorBar = 0;
		this.#sizeAge = 0;

		if (count > 0) {
			this.#sizeAvg = size / count;
		}
	}
}
