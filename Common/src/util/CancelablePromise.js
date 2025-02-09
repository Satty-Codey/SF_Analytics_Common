// @flow

/**
 * Cancelable wrapper for promises. Particularly useful for preventing setting state in React components that are no
 * longer mounted.
 *
 * @DEPRECATED: Use AbortController and AbortSignal for this purpose nowadays.
 */
export default class CancelablePromise<T> {
	_isCanceled: boolean = false;
	_promise: Promise<T>;

	constructor(originalPromise: Promise<T>) {
		this._promise = new Promise((resolve, reject) => {
			// if canceled, reject the Promise with a token that can be used to avoid error handling
			return originalPromise.then(
				(result) => (this._isCanceled ? reject({isCanceled: true}) : resolve(result)),
				(error) => (this._isCanceled ? reject({isCanceled: true}) : reject(error))
			);
		});
	}

	/* Get the promise. */
	getPromise(): Promise<T> {
		return this._promise;
	}

	/* Cancel the promise. */
	cancel(): void {
		if (__DEBUG__ && this._isCanceled) {
			// eslint-disable-next-line no-console
			console.warn(`Can't cancel promise that is already canceled.`);
		}

		this._isCanceled = true;
	}
}
