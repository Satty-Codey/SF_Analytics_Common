// @flow
import type RequestLoggingContext from 'Common/src/core/buoy/request/RequestLoggingContext.js';

export type RequestOptions = {
	loggingContext?: RequestLoggingContext,
	valueFetchTime?: number,
	details?: string,
	bypassStorage?: boolean
};

/**
 * Interface for Async Cache
 */
export interface AsyncCache<T> {
	/**
	 * Looks up for a value specified by the given key.
	 *
	 * @param {options} - optional parameter where you can pass additional options for this operation
	 * @return a promise that resolves the value using the specified key if it exists.
	 */
	get(key: string, options: RequestOptions): Promise<T | void>;

	/**
	 * Inserts the specified value using the specified key.
	 *
	 * @param {ttlSeconds} - An optional parameter to specify the time, in seconds, that the value remains valid in the cache.
	 * If no value is provided, the default expiration time will be used. It can be either a number or a function that returns a number.
	 * @param {options} - optional parameter where you can pass additional options for this operation
	 * @return a promise which resolves when the value is inserted into the cache successfully.
	 */
	put(key: string, value: T, ttlSeconds: (() => number | number) | void, options: RequestOptions): Promise<T>;

	/**
	 * If the value for the specified key is not found, compute a new value using the given function and inserts it
	 * into the cache
	 *
	 * @param {getValue} - the function to compute a value
	 * @param {ttlSeconds} - An optional parameter to specify the time, in seconds, that the value remains valid in the cache.
	 * If no value is provided, the default expiration time will be used. It can be either a number or a function that returns a number.
	 * @param {options} - optional parameter where you can pass additional options for this operation
	 * @return a promise that resolves the value.
	 */
	getOrPut(
		key: string,
		getValue: () => Promise<T>,
		ttlSeconds: (() => number | number) | void,
		options: RequestOptions
	): Promise<T>;

	/**
	 * Deletes the cache entry using the specified key.
	 */
	delete(key: string): void;

	/**
	 * Removes all cache entries.
	 */
	flush(): void;
}
