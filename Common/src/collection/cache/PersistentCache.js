// @flow
import Cache from 'Common/src/collection/Cache.js';
import Gater from 'Common/src/core/gater/Gater.js';
import type {AsyncCache, RequestOptions} from 'Common/src/collection/cache/AsyncCache.js';
import type {PersistentStorage} from 'Common/src/storage/PersistentStorage.js';

/**
 * A version of AsyncCache that provides data persistency
 */
export default class PersistentCache<T> implements AsyncCache<T> {
	#storage: PersistentStorage<T>;
	#cache: Cache<Promise<T>>;
	#allowBypassStorage: boolean;

	constructor(storage: PersistentStorage<T>, cache: Cache<Promise<T>> = new Cache(1000)) {
		this.#storage = storage;
		this.#cache = cache;
		this.#allowBypassStorage = Gater.isOpen('einstein.analytics.persistentCache.allowBypassStorage');
	}

	get(key: string, options: RequestOptions = {}): Promise<T | void> {
		if (this.#cache.has(key)) {
			// $FlowIgnore[incompatible-return]
			return this.#cache.get(key);
		}

		if (options.bypassStorage && this.#allowBypassStorage) {
			return Promise.resolve();
		}

		const promise = this.#storage.get(key, options);
		promise.catch((error) => this.#cache.delete(key));

		// $FlowIgnore[incompatible-call]
		return this.#cache.put(key, promise);
	}

	/**
	 * Inserts the specified value using the specified key.
	 *
	 * @param {ttlSeconds} - An optional parameter to specify the time, in seconds, that the value remains valid in the cache.
	 * If no value is provided, the default expiration time will be used. It can be either a number or a function that returns a number.
	 * Additionally, if a non-positive value is provided for ttlSeconds, the value will not be persisted.
	 * @param {options} - optional parameter where you can pass additional options for this operation
	 * @return a promise which resolves when the value is inserted into the cache successfully.
	 */
	put(key: string, value: T, ttlSeconds: (() => number | number) | void, options: RequestOptions = {}): Promise<T> {
		if (options.bypassStorage && this.#allowBypassStorage) {
			return this.#cache.put(key, Promise.resolve(value));
		}

		const ttl = typeof ttlSeconds === 'function' ? ttlSeconds() : ttlSeconds;

		if (ttl != null && ttl <= 0) {
			// if non-positive value is set as TTL, skip storing this value in storage.
			return this.#cache.put(key, Promise.resolve(value));
		}

		const promise = this.#storage.set(key, value, ttl, options);
		promise.catch((error) => this.#cache.delete(key));

		return this.#cache.put(key, promise);
	}

	/**
	 * If the value for the specified key is not found, compute a new value using the given function and inserts it
	 * into the cache
	 *
	 * @param {getValue} - the function to compute a value
	 * @param {ttlSeconds} - An optional parameter to specify the time, in seconds, that the value remains valid in the cache.
	 * If no value is provided, the default expiration time will be used. It can be either a number or a function that returns a number.
	 * Additionally, if a non-positive value is provided for ttlSeconds, the value will not be persisted.
	 * @param {options} - optional parameter where you can pass additional options for this operation
	 * @return a promise that resolves the value.
	 */
	getOrPut(
		key: string,
		getValue: () => Promise<T>,
		ttlSeconds: (() => number | number) | void,
		options: RequestOptions = {}
	): Promise<T> {
		const promise = this.get(key, options);

		// putting the chained promise in the cache to ensure we use the same promise in next call with the same key
		return this.#cache.put(
			key,
			promise
				.then(async (existing) => {
					if (existing != null) {
						return existing;
					}

					const startTime = performance.now();

					const value = await getValue();

					if (options.bypassStorage && this.#allowBypassStorage) {
						return value;
					}

					// capture the time taken to retrieve this value
					options.valueFetchTime = performance.now() - startTime;

					const ttl = typeof ttlSeconds === 'function' ? ttlSeconds() : ttlSeconds;

					if (ttl != null && ttl <= 0) {
						// if non-positive value is set as TTL, skip storing this value in storage.
						return value;
					}

					// $FlowIgnore[unused-promise]
					this.#storage.set(key, value, ttl, options);

					return value;
				})
				.catch((error) => {
					this.#cache.delete(key);
					throw error;
				})
		);
	}

	delete(key: string): void {
		// $FlowIgnore[unused-promise]
		this.#storage.remove(key);
		this.#cache.delete(key);
	}

	flush(): void {
		// $FlowIgnore[unused-promise]
		this.#storage.clear();
		this.#cache.flush();
	}
}
