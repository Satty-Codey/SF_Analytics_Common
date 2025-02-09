// @flow

/**
 * Simple utils for waiting for something.
 */
export default class Wait {
	/* Return a Promise that will be resolved after the number of milliseconds specified timeout is complete. */
	static forDuration(timeout: number): Promise<void> {
		return new Promise((resolve) => {
			setTimeout(resolve, timeout);
		});
	}
}
