// @flow

/**
 * Simple queue that can be bounded, follows Java Queue interface.
 *
 * @author zuye.zheng
 */
export default class Queue<T> {
	_max: number;
	_queue: Array<T>;

	/**
	 * Create a queue with an optional max size, if max size is set and reached, adding elements will throw an error.
	 */
	constructor(max: number = Infinity) {
		this._max = max;
		this._queue = [];
	}

	/* Add a value to the queue and return the queue, throw an error if max is reached. */
	add(value: T): this {
		if (!this.offer(value)) {
			throw new Error(`Queue max of ${this._max} reached.`);
		}
		return this;
	}

	/* Offer a value to the queue, return true if added, false if max is reached. */
	offer(value: T): boolean {
		if (this.size() >= this._max) {
			return false;
		}
		this._queue.push(value);

		return true;
	}

	/* Remove and return the head of the queue, undefined if the queue is empty. */
	poll(): ?T {
		return this._queue.splice(0, 1)[0];
	}

	/**
	 * Peek the first N value without removing.
	 */
	peek(n: number = 1): Array<T> {
		return this._queue.slice(0, n);
	}

	/* Returns the number of elements in the queue. */
	size(): number {
		return this._queue.length;
	}

	/**
	 * Find the index at which an element matching the predicate exists. -1 otherwise.
	 */
	findIndex(predicate: (T) => boolean): number {
		return this._queue.findIndex(predicate);
	}

	/**
	 * Remove the element at the given index.
	 */
	remove(index: number): T {
		if (index >= this.size()) {
			throw new Error(`Queue element at index ${index} does not exist.`);
		}

		return this._queue.splice(index, 1)[0];
	}

	/**
	 * Remove and return the elements matching the given predicate.
	 */
	removeMatching(predicate: (T) => boolean): Array<T> {
		const matched = [];

		for (let i = this._queue.length - 1; i >= 0; i--) {
			if (predicate(this._queue[i])) {
				matched.push(this._queue.splice(i, 1)[0]);
			}
		}

		return matched.reverse();
	}
}
