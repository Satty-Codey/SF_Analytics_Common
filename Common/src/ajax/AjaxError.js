// @flow
import LC from 'Common/src/localization/LC.js';

/**
 * Ajax error, contains the response for additional info.
 */
export default class AjaxError extends Error {
	+errorCode: string;
	+statusCode: number;
	static DEFAULT_ERROR_CODE: string = 'DEFAULT_ERROR_CODE';

	constructor(message: ?string, errorCode: string | void, statusCode: number) {
		super(message || LC.getLabel('ErrorMsg', 'internalServerError'));

		this.errorCode = errorCode || AjaxError.DEFAULT_ERROR_CODE;
		this.statusCode = statusCode;
	}

	/**
	 * Create a new error with the same codes but a different message.
	 */
	shard(message: string): AjaxError {
		const sharded = new AjaxError(message, this.errorCode, this.statusCode);
		sharded.stack = this.stack;

		return sharded;
	}
}
