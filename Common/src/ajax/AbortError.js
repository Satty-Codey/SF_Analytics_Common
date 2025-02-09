// @flow
import AjaxError from 'Common/src/ajax/AjaxError.js';

/**
 * An error thrown because a request was aborted.
 */
export default class AbortError extends AjaxError {
	static ERROR_CODE: string = 'ABORT_ERROR';

	constructor(message: string) {
		super(message, AbortError.ERROR_CODE, -1);
	}
}
