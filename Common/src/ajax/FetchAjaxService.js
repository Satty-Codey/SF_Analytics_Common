// @flow
import FetchError from 'Common/src/ajax/FetchError.js';
import NetworkError from 'Common/src/ajax/NetworkError.js';
import AbortError from 'Common/src/ajax/AbortError.js';
import RequestPermitPool from 'Common/src/ajax/RequestPermitPool.js';
import RoundRobinRequestPermitPool from 'Common/src/ajax/RoundRobinRequestPermitPool.js';
import Permission from 'Common/src/core/Permission.js';
import type {AjaxService, AjaxOptions, FetchRequestResult} from 'Common/src/ajax/AjaxService.service.js';
import type {RequestFilter} from 'Common/src/ajax/filter/RequestFilter.js';
import type {FilterContext} from 'Common/src/ajax/filter/LoggingRequestFilter.js';
import type {Permit} from 'Common/src/async/PermitPool.js';

// $FlowFixMe[unclear-type]
type Filter = RequestFilter<any>;

/**
 * Helper for making Ajax calls through fetch. Supports additional processing of requests through filters and throttling
 * of parallel requests to limit potential impact on server with HTTP/2.
 */
export class FetchAjaxService implements AjaxService {
	_requestFilters: Array<Filter> = [];
	_requestPermitPool: RequestPermitPool | void;
	_useLockBasedRateLimiting: boolean;
	_logLockName: boolean;

	setRequestFilters(filters: Array<Filter>): this {
		this._requestFilters = filters;
		return this;
	}

	setLockBasedRateLimiting(setLockBasedRateLimiting: boolean): this {
		// Check the Locks API is supported by the browser before enabling lock-based concurrency control
		this._useLockBasedRateLimiting = 'locks' in window.navigator && setLockBasedRateLimiting;
		return this;
	}

	setMaxParallelRequests(maxParallelRequests: number, maxParallelRequestsForHighConcurrency: number): this {
		this._requestPermitPool = this._useLockBasedRateLimiting
			? new RoundRobinRequestPermitPool(maxParallelRequests, maxParallelRequestsForHighConcurrency)
			: new RequestPermitPool(maxParallelRequests, maxParallelRequestsForHighConcurrency);
		return this;
	}

	setLogLockName(logLockName: boolean): this {
		this._logLockName = logLockName;
		return this;
	}

	/**
	 * @inheritdoc
	 * The impl here calls {@link #fetchResponse} and converts the response by on the options.
	 */
	async fetch(path: string, options: AjaxOptions = {}): Promise<FetchRequestResult> {
		const response = await this.fetchResponse(path, options);

		if (response.status === 204) {
			// Return nothing for no-content responses.
			return;
		}

		if (response.headers.get('Content-Type')?.includes('application/json')) {
			return response.json();
		} else {
			return response.text();
		}
	}

	async fetchResponse(path: string, options: AjaxOptions = {}): Promise<Response> {
		const contexts = this._requestFilters.map((filter) => filter.pre(path, options.loggingContext));

		// Wait for a permit to become available as we throttle the number of concurrent network requests from the UI.
		const isHighConcurrencyEligible =
			!!options.isHighConcurrencyEligible && Permission.has(Permission.ORG_HAS_HIGH_UI_REQUEST_CONCURRENCY);

		const permit =
			this._requestPermitPool != null ? await this._requestPermitPool.getPermit(isHighConcurrencyEligible) : undefined;

		if (permit != null && this._useLockBasedRateLimiting) {
			return window.navigator.locks.request(`fetch_lock_${permit.id}`, async (lock) => {
				const loggingContext = options.loggingContext;
				if (loggingContext && this._logLockName) {
					// Add the lock name to the request tags so that it gets logged in a request logline (iebrq).
					loggingContext.tags.push(lock.name);
				}

				return this._fetchResponse(path, options, permit, contexts);
			});
		}

		return this._fetchResponse(path, options, permit, contexts);
	}

	async _fetchResponse(
		path: string,
		options: AjaxOptions,
		permit: Permit | void,
		contexts: Array<FilterContext>
	): Promise<Response> {
		// Need a default here to satisfy Flow, this should never be used.
		let requestId;
		let statusCode = -1;
		let errorCode;

		try {
			let response;

			try {
				response = await this._fetchRawResponse(path, options);

				requestId = response.headers.get('X-SFDC-Request-Id') ?? undefined;
				statusCode = response.status;
			} catch (error) {
				if (error.name === 'AbortError') {
					throw new AbortError(error.message);
				} else {
					throw new NetworkError(error.message);
				}
			}

			// Handle success and Not-Modified statuses.
			if (response.ok || response.status === 304) {
				return response;
			} else {
				throw new FetchError(response, await response.json());
			}
		} catch (error) {
			errorCode = error.errorCode;

			throw error;
		} finally {
			permit?.release();

			// Iterate through the filters in reverse, calling them with the context they originally produced.
			for (let i = this._requestFilters.length - 1; i >= 0; i--) {
				this._requestFilters[i].post(requestId, statusCode, errorCode, contexts[i]);
			}
		}
	}

	async _fetchRawResponse(
		path: string,
		{
			method,
			body,
			headers = {},
			// Unintuitively, this prevents the browser from caching resources based purely on time in the cache but still
			// allows using a previously-cached response if an ETag or last modified date was sent on the prior response and
			// the server validates that the resource hasn't changed.
			cache = 'no-cache',
			keepalive,
			signal
		}: AjaxOptions = {}
	): Promise<Response> {
		return fetch(path, {
			method,
			body,
			headers,
			cache,
			keepalive,
			signal
		});
	}
}

export default (new FetchAjaxService(): FetchAjaxService);
