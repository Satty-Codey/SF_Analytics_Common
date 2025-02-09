// @flow
import type RequestLoggingContext from 'Common/src/core/buoy/request/RequestLoggingContext.js';

export type AjaxOptions = {
	// Request body.
	body?: ?BodyInit,
	// Caching settings for this request.
	cache?: CacheType,
	// HTTP verb
	method?: string,
	// One format for headers versus the multiple supported to simplify things.
	headers?: {[string]: string, ...},
	// Should the connection remain open after the page has unloaded?
	keepalive?: boolean,
	// Context for logging.
	loggingContext?: RequestLoggingContext,
	// Signal for cancelling requests.
	signal?: AbortSignal,
	// Request is eligible for high concurrency
	isHighConcurrencyEligible?: boolean
};

// $FlowFixMe[unclear-type]
export type FetchRequestResult = any;

/**
 * Service to handle making Ajax calls in production code.
 */
export interface AjaxService {
	/**
	 * Request the specified url path and return response body as per the options.
	 * @returns undefined on 204 No Content status, otherwise the text or json object.
	 */
	fetch(path: string, options?: AjaxOptions): Promise<FetchRequestResult>;

	/**
	 * Request the specified url path and return the Response object on success.
	 */
	fetchResponse(path: string, options?: AjaxOptions): Promise<Response>;
}

// Declare export type for Flow.
declare export default AjaxService;
