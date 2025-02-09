// @flow
import Queue from 'Common/src/collection/Queue.js';

/**
 * Simple queue that can be bounded. If a max size is set and the queue is full, evicts the item from the head of the queue.
 */
export default class EvictingQueue<T> extends Queue<T> {
	/**
	 * Add an item to the queue. If the queue is full, remove the oldest item first.
	 */
	offer(value: T): boolean {
		if (this.size() === this._max) {
			this._queue.shift();
		}

		this._queue.push(value);
		return true;
	}
}
