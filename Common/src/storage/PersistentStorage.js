// @flow
import type RequestLoggingContext from 'Common/src/core/buoy/request/RequestLoggingContext.js';

export type RequestOptions = {
	loggingContext?: RequestLoggingContext,
	valueFetchTime?: number,
	details?: string,
	...
};

/**
 * Interface for persistent storage
 */
export interface PersistentStorage<T> {
	/**
	 * Inserts a value into the storage using the given key
	 */
	set(key: string, value: T, ttlSeconds: number | void, options: RequestOptions | void): Promise<T>;

	/**
	 * Reads a value from the storage using the given key
	 */
	get(key: string, options: RequestOptions | void): Promise<T | void>;

	/**
	 * Remove the value associated with the specified key from the storage
	 */
	remove(key: string): Promise<void>;

	/**
	 * Removes all the entries for this storage
	 */
	clear(): Promise<void>;
}
