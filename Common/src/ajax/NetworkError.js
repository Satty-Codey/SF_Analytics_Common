// @flow
import AjaxError from 'Common/src/ajax/AjaxError.js';

/**
 * An error thrown because of an error in the network layer.
 */
export default class NetworkError extends AjaxError {
	constructor(message: string) {
		super(message, 'NETWORK_ERROR', -1);
	}
}
