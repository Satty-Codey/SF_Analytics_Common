// @flow
import type RequestLoggingContext from 'Common/src/core/buoy/request/RequestLoggingContext.js';

/**
 * Filter for doing stuff before and after a request runs.
 */
export interface RequestFilter<T> {
	/**
	 * Do something right before the request is initiated. Optionally create some context which will be provided to the
	 * post method when the request has finished.
	 */
	pre(path: string, loggingContext: RequestLoggingContext | void): T;

	/**
	 * Do something right after the request finishes. The context created in pre will be passed in here.
	 */
	post(requestId: string | void, statusCode: number, errorCode: string | void, context: T): void;
}
