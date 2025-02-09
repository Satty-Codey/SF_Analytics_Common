// @flow
import {get} from 'lodash';

import AjaxError from 'Common/src/ajax/AjaxError.js';

/**
 * Errors thrown by our Connect APIs.
 */
type ConnectApiResponseError = {
	errorCode: string,
	message: string,
	description?: string
};

/**
 * Type of errors returned by the private Insights APIs. Should eventually be deprecated.
 */
type InsightsApiResponseError =
	| {
			errorCode: string,
			errorMsg: string,
			errorDescription?: string
	  }
	| {
			errorCode: string,
			message: string
	  };

type ResponseJson = Array<ConnectApiResponseError> | InsightsApiResponseError;

/**
 * Error thrown when a request via fetch fails. Pretty specific to Connect API errors at the moment.
 */
export default class FetchError extends AjaxError {
	+responseJson: ResponseJson | void;

	constructor(response: Response, responseJson: ResponseJson | void) {
		let errorCode;
		let errorMessage;
		let errorDescription;

		if (Array.isArray(responseJson)) {
			// Connect API errors
			errorCode = get(responseJson, ['0', 'errorCode']);
			errorMessage = get(responseJson, ['0', 'message']);
			errorDescription = get(responseJson, ['0', 'description']);
		} else {
			// Private Insights API & local query engine API errors
			errorCode = get(responseJson, ['errorCode']);
			errorMessage = get(responseJson, ['errorMsg']) || get(responseJson, ['message']);
			errorDescription = get(responseJson, ['errorDescription']);
		}

		if (errorMessage && errorDescription) {
			errorMessage += ` ${errorDescription}`;
		}

		super(errorMessage || response.statusText, errorCode, response.status);
		this.responseJson = responseJson;
	}
}
