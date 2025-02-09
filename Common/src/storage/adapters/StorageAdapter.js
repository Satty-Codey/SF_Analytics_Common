// @flow
import StorageServiceLogger, {StorageServiceOperation} from 'Common/src/storage/StorageServiceLogger.js';
import estimateStorageSize from 'Common/src/storage/estimateStorageSize.js';
import type {StorageAdapter, StorageValue, Storable} from 'Common/src/storage/adapters/StorageAdapter.js';
import type {PersistentStorage, RequestOptions} from 'Common/src/storage/PersistentStorage.js';

export type StorageConfig = {
	name: string,
	maxSize: number,
	expiration: number,
	clearOnInit?: boolean,
	version?: string,
	isolationKey?: string,
	partitionName?: string
};

export type ResolveFunc = (StorageValue) => void;

export type RejectFunc = (Error) => void;

type ExecuteFunc<T> = (ResolveFunc, RejectFunc) => Promise<T>;

type QueuedRequest = {
	execute: ExecuteFunc<StorageValue>,
	resolve: ResolveFunc,
	reject: RejectFunc
};

/**
 * StorageService key delimiter, separating isolation and version key from
 * the user-provided key.
 */
const KEY_DELIMITER = ':';

/**
 * Sweep intervals (milliseconds).
 */
const MIN_SWEEP_INTERVAL = 60000; // 1 min
const MAX_SWEEP_INTERVAL = 300000; // 5 min

/**
 * The storage service implementation.
 */
export default class StorageService implements PersistentStorage<StorageValue> {
	#adapter: StorageAdapter;

	#serialize: (StorageValue) => string;
	#deserialize: (string) => StorageValue;
	#getValueLocatorForLogging: (StorageValue) => string | void;

	#config: StorageConfig;
	#name: string;
	#maxSize: number;
	#expiration: number;
	#keyPrefix: string;

	#ready: boolean | void;
	#queue: Array<QueuedRequest>;
	#initStartTime: number;
	#initializedPromise: Promise<void>;

	#stats: {
		size: number
	};

	#sweepInterval: number;
	#lastSweepTime: number;
	#sweepingSuspended: boolean;
	#sweepPromise: Promise<void> | void;

	#logger: StorageServiceLogger;

	// This index of storage keys will function like a bloom filter, allowing us to check if a value is available without performing a storage read.
	#keyFilter: Set<string>;

	/**
	 * @param {Object} config Config describing the characteristics of the storage to be created.
	 */
	constructor(
		config: StorageConfig,
		adapter: StorageAdapter,
		logger: StorageServiceLogger,
		serialize: (StorageValue) => string,
		deserialize: (string) => StorageValue,
		getValueLocatorForLogging: (StorageValue) => string | void = (value) => undefined
	) {
		// freeze to prevent mutation (config is reused if adapter fails initialization)
		this.#config = Object.freeze(config);

		this.#serialize = serialize;
		this.#deserialize = deserialize;

		// first generate key prefix so it may be passed to the adapter constructor
		this.#keyPrefix = this._generateKeyPrefix();

		// requests are queued until adapter indicates it is ready
		this.#ready = undefined;
		this.#queue = ([]: Array<QueuedRequest>);

		// extract values this class uses
		this.#name = config.name;

		this.#maxSize = config.maxSize;
		this.#expiration = config.expiration * 1000;

		// runtime stats
		this.#stats = {
			size: -1 // unknown, populated on first call to getSize()
		};

		// frequency guard for sweeping
		this.#sweepInterval = Math.min(Math.max(this.#expiration * 0.5, MIN_SWEEP_INTERVAL), MAX_SWEEP_INTERVAL);
		this.#lastSweepTime = performance.now();
		this.#sweepingSuspended = false;
		this.#sweepPromise = undefined;

		this.#logger = logger;
		this.#getValueLocatorForLogging = getValueLocatorForLogging;

		this.#keyFilter = new Set<string>();

		// initialize the adapter
		this.#adapter = adapter;
		this.#initStartTime = performance.now();
		this.#initializedPromise = this.#adapter
			.initialize()
			.then(async () => {
				try {
					// retrieve keys from storage
					const keys = await this.#adapter.getKeys();

					// populate key filter
					this.#keyFilter = new Set(
						keys.filter((key) => {
							// Use only the keys that have the defined keyPrefix if provided
							return this.#keyPrefix != null ? key.startsWith(this.#keyPrefix) : true;
						})
					);
				} catch (error) {
					// no-op to move promise to resolve state
				}
			})
			// $FlowIgnore[method-unbinding]
			.then(this._onAdapterInitialized.bind(this, true), this._onAdapterInitialized.bind(this, false));
	}

	/**
	 * Returns the name of the storage adapter. For example, "indexeddb" or "memory".
	 *
	 * @returns {String} The storage adapter's name.
	 */
	getName(): string {
		return this.#adapter.getName();
	}

	/**
	 * Gets the current storage size in KB.
	 *
	 * @returns {Promise} A promise that resolves to the current storage size in KB.
	 */
	async getSize(): Promise<number> {
		// $FlowIgnore[method-unbinding]
		return this._enqueue(this._getSizeInternal.bind(this));
	}

	_getSizeInternal(resolve: ResolveFunc, reject: RejectFunc): void {
		this.#adapter
			.getSize()
			.then((size: number) => {
				this.#stats.size = parseInt(size / 1024.0, 10);
				return size / 1024.0;
			})
			.then(resolve, reject);
	}

	/**
	 * Returns the maximum storage size in KB.
	 *
	 * @returns {number} The maximum storage size in KB.
	 */
	getMaxSize(): number {
		return this.#maxSize / 1024.0;
	}

	/**
	 * Enqueues a function to execute when the adapter is ready.
	 * @param {Function} execute the function to execute.
	 * @returns {Promise} a promise that resolves when the function is executed.
	 */
	async _enqueue<T>(execute: ExecuteFunc<T>): Promise<T> {
		// adapter is ready so execute immediately
		if (this.#ready === true) {
			return new Promise((resolve: ResolveFunc, reject: RejectFunc) => {
				// $FlowIgnore[unused-promise]
				execute(resolve, reject);
			});
		}
		// adapter is in permanent error state
		else if (this.#ready === false) {
			// already logged when permanent error state entered so do not re-log each operation
			return Promise.reject(new Error(this._getInitializationError()));
		}

		// adapter not yet initialized
		return new Promise((resolve: ResolveFunc, reject: RejectFunc) => {
			this.#queue.push({execute: execute, resolve: resolve, reject: reject});
			if (this.#ready !== undefined) {
				// rare race condition. intentionally do not pass a new ready state.
				this._executeQueue();
			}
		});
	}

	/**
	 * @returns {Promise} Promise that resolves once adapter initialization is complete.
	 */
	async initializationComplete(): Promise<void> {
		return this.#initializedPromise;
	}

	/**
	 * Callback function provided to adapters to indicate initialization is complete.
	 *
	 * @param {Boolean} readyState true if the adapter successfully completed initialization, false if initialization failed.
	 * @param {Error} error details if initialization failed, undefined otherwise.
	 */
	_onAdapterInitialized(readyState: boolean, error: Error): void {
		// if primary adapter failed then return immediately
		if (!readyState) {
			this.#logger.log({
				operationType: StorageServiceOperation.INIT,
				runtime: performance.now() - this.#initStartTime,
				error: error
			});
			this.#ready = false;
			return;
		}

		// adapter is ready (either success or permanent error state)
		let promise;
		// clear adapter prior to processing the queue
		if (readyState && this.#config.clearOnInit) {
			promise = new Promise((resolve, reject) => {
				this._clearInternal(resolve, reject);
			}).then(undefined, () => {
				// no-op to move promise to resolve state
			});
		} else {
			promise = Promise.resolve();
		}

		// $FlowIgnore[unused-promise]
		promise.then(() => {
			// flip the switch so subsequent requests are immediately processed
			this.#ready = !!readyState;
			this._executeQueue();
			this.#logger.log({
				operationType: StorageServiceOperation.INIT,
				runtime: performance.now() - this.#initStartTime
			});
		});
	}

	/**
	 * Runs the pending queue of requests.
	 */
	_executeQueue(): void {
		const queue = this.#queue;
		this.#queue = ([]: Array<QueuedRequest>);

		for (const request of queue) {
			if (!this.#ready) {
				// adapter is in permanent error state, reject all queued promises
				request.reject(new Error(this._getInitializationError()));
			} else {
				try {
					// run the queued logic, which will resolve the promises
					// $FlowIgnore[unused-promise]
					request.execute(request.resolve, request.reject);
				} catch (e) {
					request.reject(e);
				}
			}
		}
	}

	/**
	 * Gets the error message when the adapter fails to initialize.
	 */
	_getInitializationError(): string {
		return 'StorageService[' + this.#name + '] adapter failed to initialize';
	}

	/**
	 * Returns a promise that clears the storage.
	 *
	 * @returns {Promise} A promise that will clear storage.
	 */
	async clear(): Promise<void> {
		const start = performance.now();
		// $FlowIgnore[method-unbinding]
		return this._enqueue(this._clearInternal.bind(this)).then(
			() => {
				this.#logger.log({
					operationType: StorageServiceOperation.CLEAR,
					runtime: performance.now() - start
				});
			},
			(e) => {
				this.#logger.log({
					operationType: StorageServiceOperation.CLEAR,
					runtime: performance.now() - start,
					error: e
				});
				throw e;
			}
		);
	}

	_clearInternal(resolve: ResolveFunc, reject: RejectFunc): void {
		this.#adapter.clear().then(resolve, reject);
	}

	/**
	 * Asynchronously gets an item from storage corresponding to the specified key.
	 *
	 * @param {String} key The key of the item to retrieve.
	 * @param {Object} - optional parameter where you can pass additional options for this operation
	 * @param {Boolean} includeExpired True to return expired items, false to not return expired items.
	 * @returns {Promise} A promise that resolves to the stored item or undefined if the key is not found.
	 */
	get(key: string, options?: RequestOptions = {}, includeExpired: boolean = false): Promise<StorageValue | void> {
		return this.getAll([key], options, includeExpired).then((items: Map<string, StorageValue>) => {
			const item = items?.get(key);
			return item;
		});
	}

	/**
	 * Asynchronously gets multiple items from storage.
	 *
	 * @param {String[]} [keys] The set of keys to retrieve. Empty array or falsey to retrieve all items.
	 * @param {Object} - optional parameter where you can pass additional options for this operations
	 * @param {Boolean} [includeExpired] True to return expired items, falsey to not return expired items.
	 * @returns {Promise} A promise that resolves to an object that contains key-value pairs. {key: storedItem}
	 */
	async getAll(
		keys: Array<string>,
		options?: RequestOptions = {},
		includeExpired: boolean
	): Promise<Map<string, StorageValue>> {
		// $FlowIgnore[method-unbinding]
		return this._enqueue(this._getAllInternal.bind(this, keys, includeExpired, options));
	}

	_getAllInternal(
		keys: Array<string>,
		includeExpired: boolean,
		options: RequestOptions = {},
		resolve: ResolveFunc,
		reject: RejectFunc
	): void {
		const prefixedKeys: Array<string> = keys
			.map((key) => this.#keyPrefix + key)
			.filter((key) => this.#keyFilter.has(key));

		if (prefixedKeys.length === 0) {
			resolve(new Map());
			return;
		}

		const startTime = performance.now();
		this.#adapter
			.getItems(prefixedKeys, includeExpired)
			.then((items: Map<string, Storable>) => {
				const now = Date.now();

				const results = new Map<string, StorageValue>();
				items.forEach((item, k) => {
					if (item && k.indexOf(this.#keyPrefix) === 0) {
						const key = k.substring(this.#keyPrefix.length);

						let value;
						if (includeExpired || now < item.expires) {
							value = this.#deserialize(item.value);
							results.set(key, value);
						}

						this.#logger.log({
							appInstanceId: options.loggingContext?.appContext.appInstanceId,
							cacheKey: key,
							operationType: now < item.expires ? StorageServiceOperation.GET : StorageServiceOperation.GET_TTL_EXPIRED,
							runtime: performance.now() - startTime,
							// we always calculate the payload size from the serialized value
							payloadSize: estimateStorageSize(item.value),
							details: options.details,
							valueLocator: this._getValueLocator(value),
							valueFetchTime: item.valueFetchTime
						});
					}
					// wrong isolationKey/version or item is expired so ignore the entry
					// TODO - capture entries to be removed async
				});

				return results;
			})
			.catch((error) => {
				const key = keys.length === 1 ? keys[0] : undefined;
				this.#logger.log({
					appInstanceId: options.loggingContext?.appContext.appInstanceId,
					cacheKey: key,
					operationType: StorageServiceOperation.GET,
					runtime: performance.now() - startTime,
					error,
					payloadSize: 0,
					details: options.details
				});

				throw error;
			})
			.then(resolve, reject);
	}

	/**
	 * Builds the payload to store in the adapter.
	 *
	 * @param {String} key The key of the item to store.
	 * @param {*} value The value of the item to store.
	 * @param {Number} now The current time (milliseconds).
	 * @param {Number} ttlSeconds Optional. The Time-To-Live (TTL) value in seconds.
	 * @param {Number} valueFetchTime Optional field to track the time taken to retrieve the value in milliseconds.
	 * @returns {Storable} Storable to pass to the adapter's setItems.
	 */
	_buildPayload(
		key: string,
		value: StorageValue,
		now: number,
		ttlSeconds: number | void,
		valueFetchTime: number | void
	): Storable {
		// Apply the TTL time if it is provided. Otherwise, use the default expiration time.
		const ttl = ttlSeconds != null ? ttlSeconds * 1000 : this.#expiration;

		return {
			key: this.#keyPrefix + key,
			value: this.#serialize(value),
			created: now,
			expires: now + ttl,
			// For the size calculation, consider only the inputs to the storage layer: key and value.
			size: estimateStorageSize(key) + estimateStorageSize(value),
			valueFetchTime
		};
	}

	/**
	 * Asynchronously stores the value in storage using the specified key.
	 *
	 * @param {String} key The key of the item to store.
	 * @param {*} value The value of the item to store.
	 * @param {Number} ttlSeconds Optional. The Time-To-Live (TTL) value in seconds.
	 * @param {Object} options Optional. Additional settings for the request.
	 * @returns {Promise} A promise that resolves when are stored.
	 */
	async set(
		key: string,
		value: StorageValue,
		ttlSeconds: number | void,
		options: RequestOptions = {}
	): Promise<StorageValue> {
		const start = performance.now();
		const values = new Map<string, StorageValue>();
		values.set(key, value);

		let error;
		try {
			await this.setAll(values, ttlSeconds, options);
		} catch (err) {
			error = err;
			throw err;
		} finally {
			this.#logger.log({
				appInstanceId: options.loggingContext?.appContext.appInstanceId,
				cacheKey: key,
				operationType: StorageServiceOperation.SET,
				runtime: performance.now() - start,
				// we always calculate the payload size from the serialized value
				payloadSize: estimateStorageSize(this.#serialize(value)),
				error,
				details: options.details,
				valueFetchTime: options.valueFetchTime,
				valueLocator: this._getValueLocator(value)
			});
		}

		return value;
	}

	/**
	 * Asynchronously stores multiple values in storage. All or none of the values are stored.
	 *
	 * @param {Object} values The key-values to store. Eg <code>{key1: value1, key2: value2}</code>.
	 * @param {Number} ttlSeconds Optional. The Time-To-Live (TTL) value in seconds.
	 * @param {Object} options Optional. Additional settings for the request.
	 * @returns {Promise} A promise that resolves when all of the key-values are stored.
	 */
	async setAll(
		values: Map<string, StorageValue>,
		ttlSeconds: number | void,
		options: RequestOptions = {}
	): Promise<void> {
		// $FlowIgnore[method-unbinding]
		return this._enqueue(this._setAllInternal.bind(this, values, ttlSeconds, options));
	}

	_setAllInternal(
		values: Map<string, StorageValue>,
		ttlSeconds: number | void,
		options: RequestOptions = {},
		resolve: ResolveFunc,
		reject: RejectFunc
	): void {
		let storablesSize = 0;
		const storables = [];
		try {
			const now = Date.now();
			values.forEach((value, key) => {
				const storable = this._buildPayload(key, value, now, ttlSeconds, options.valueFetchTime);
				storables.push(storable);
				storablesSize += storable.size;
			});
		} catch (error) {
			reject(error);
			return;
		}

		if (storablesSize > this.#maxSize) {
			const err = new Error(
				'StorageService.set() cannot store ' +
					Object.keys(values).length +
					' items of total size ' +
					storablesSize +
					"b because it's over the max size of " +
					this.#maxSize +
					'b'
			);
			reject(err);
			return;
		}

		this.#adapter.setItems(storables).then(resolve, reject);

		// $FlowIgnore[unused-promise]
		this.sweep();
	}

	/**
	 * Asynchronously removes the value from storage corresponding to the specified key.
	 *
	 * @param {String} key The key of the value to remove.
	 * @returns {Promise} A promise that will remove the value from storage.
	 */
	async remove(key: string): Promise<void> {
		const start = performance.now();

		return this.removeAll([key]).then(
			() => {
				this.#logger.log({
					cacheKey: key,
					operationType: StorageServiceOperation.REMOVE,
					runtime: performance.now() - start
				});
			},
			(e: Error) => {
				this.#logger.log({
					cacheKey: key,
					operationType: StorageServiceOperation.REMOVE,
					runtime: performance.now() - start,
					error: e
				});
				throw e;
			}
		);
	}

	/**
	 * Asynchronously removes multiple values from storage. All or none of the values are removed.
	 *
	 * @param {String[]} keys The keys of the values to remove.
	 * @returns {Promise} A promise that resolves when all of the values are removed.
	 */
	async removeAll(keys: Array<string>): Promise<void> {
		// $FlowIgnore[method-unbinding]
		return this._enqueue(this._removeAllInternal.bind(this, keys));
	}

	_removeAllInternal(keys: string, resolve: ResolveFunc, reject: RejectFunc): void {
		const prefixedKeys = [];
		for (let i = 0; i < keys.length; i++) {
			prefixedKeys.push(this.#keyPrefix + keys[i]);
		}

		this.#adapter.removeItems(prefixedKeys).then(resolve, reject);
	}

	/**
	 * Asynchronously sweeps the store to remove expired items.
	 *
	 * @param {Boolean} ignoreInterval True to ignore minimum sweep intervals.
	 * @return {Promise} A promise that resolves when sweeping is completed.
	 */
	async sweep(ignoreInterval: boolean = false): Promise<void> {
		// sweeping guards:
		// 1. sweeping is in progress
		if (this.#sweepPromise) {
			return this.#sweepPromise;
		}

		// 2. adapter isn't ready
		if (!this.#ready) {
			return Promise.resolve();
		}

		// 3. frequency (yet respect ignoreInterval)
		const sweepInterval = performance.now() - this.#lastSweepTime;
		if (!ignoreInterval && sweepInterval < this.#sweepInterval) {
			return Promise.resolve();
		}

		// 4. sweeping has been suspended. often set when the client goes offline or the store's size is being manually managed.
		if (this.#sweepingSuspended) {
			return Promise.resolve();
		}

		const start = performance.now();

		/**
		 * Final thenable on sweep() promise chain.
		 * @param {Error} e the error if the promise was rejected
		 */
		const doneSweeping = (e: Error | void) => {
			this.#sweepPromise = undefined;
			this.#lastSweepTime = performance.now();

			this.#logger.log({
				operationType: StorageServiceOperation.SWEEP,
				runtime: this.#lastSweepTime - start,
				error: e
			});

			// do not re-throw any error
		};

		// start the sweep + prevent concurrent sweeps
		this.#sweepPromise = this.#adapter.sweep().then(doneSweeping, doneSweeping);

		return this.#sweepPromise;
	}

	/**
	 * Suspends sweeping.
	 *
	 * Expired storage entries are proactively removed by sweeping. Sweeping is often suspended
	 * when the connection goes offline so expired items remain accessible.
	 */
	suspendSweeping(): void {
		this.#sweepingSuspended = true;
		this.#adapter.suspendSweeping();
	}

	/**
	 * Resumes sweeping to remove expired storage entries.
	 */
	resumeSweeping(): void {
		this.#sweepingSuspended = false;
		this.#adapter.resumeSweeping();
		// $FlowIgnore[unused-promise]
		this.sweep();
	}

	/**
	 * Asynchronously deletes this storage.
	 */
	async deleteStorage(): Promise<void> {
		// $FlowIgnore[method-unbinding]
		return this._enqueue(this._deleteStorageInternal.bind(this));
	}

	_deleteStorageInternal(resolve: ResolveFunc, reject: RejectFunc): void {
		this.#adapter
			.deleteStorage()
			.then(undefined, (e: Error) => {
				throw e;
			})
			.then(resolve, reject);
	}

	/**
	 * Generates the key prefix for storage.
	 */
	_generateKeyPrefix(): string {
		const isolationKey = this.#config.isolationKey || '';
		const version = this.#config.version || '';
		return '' + isolationKey + version + KEY_DELIMITER;
	}

	_getValueLocator(value: StorageValue | void): string {
		try {
			return this.#getValueLocatorForLogging(value) ?? '';
		} catch (error) {
			// report an error in valueLocator if we encounter an issue while retrieving a value locator.
			return `Error: ${error.message}`;
		}
	}
}
