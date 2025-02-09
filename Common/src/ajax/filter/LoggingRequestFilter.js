// @flow
import RequestStartRipple from 'Common/src/core/buoy/request/RequestStartRipple.js';
import RequestEndRipple from 'Common/src/core/buoy/request/RequestEndRipple.js';
import RequestTagRipple from 'Common/src/core/buoy/request/RequestTagRipple.js';
import type {RequestFilter} from 'Common/src/ajax/filter/RequestFilter.js';
import type RequestLoggingContext from 'Common/src/core/buoy/request/RequestLoggingContext.js';
import type Buoy from 'Common/src/core/buoy/Buoy.js';

export type FilterContext = {
	requestCounter: number,
	path: string,
	loggingContext: RequestLoggingContext | void
};

/**
 * Filter used to track requests.
 */
export default class LoggingRequestFilter implements RequestFilter<FilterContext> {
	_buoy: Buoy;
	_requestCounter: number = 0;

	constructor(buoy: Buoy) {
		this._buoy = buoy;
	}

	pre(path: string, loggingContext: RequestLoggingContext | void): FilterContext {
		const requestCounter = this._requestCounter++;

		// If a logging context was provided, create a unique request ID and log a start ripple.
		if (loggingContext != null) {
			this._buoy.trigger(new RequestStartRipple(requestCounter, path, loggingContext));

			if (loggingContext.tags?.length > 0) {
				this._buoy.trigger(
					new RequestTagRipple(loggingContext.appContext.appInstanceId, loggingContext.requestName, loggingContext.tags)
				);
			}
		}

		return {
			requestCounter,
			path,
			loggingContext
		};
	}

	post(requestId: string | void, statusCode: number, errorCode: string | void, context: FilterContext): void {
		if (context.loggingContext != null) {
			this._buoy.trigger(
				new RequestEndRipple(
					context.loggingContext.appContext.appInstanceId,
					context.requestCounter,
					requestId,
					statusCode,
					errorCode
				)
			);
		}
	}
}
