// @flow

/**
 * Simple stack that can be bounded.
 *
 * @author zuye.zheng
 */
export default class Stack<T> {
	_max: number;
	_stack: Array<T>;

	/**
	 * Create a stack with an optional max size, if max size is set and reached, value at the bottom of the stack will
	 * be removed and returned.
	 */
	constructor(max: number = Infinity) {
		this._max = max;
		this._stack = [];
	}

	/* Push the value, if max size is reached, bottom value will be removed and returned. */
	push(value: T): ?T {
		this._stack.push(value);
		if (this._stack.length > this._max) {
			return this._stack.shift();
		}
	}

	/* Pop and return the last pushed element if the stack is not empty. */
	pop(): ?T {
		return this._stack.pop();
	}

	/**
	 * Drain the stack and return an array with the most recently pushed values first. Resulting stack will be empty.
	 */
	drain(): Array<T> {
		const drained = this._stack;
		drained.reverse();
		this._stack = [];

		return drained;
	}

	/**
	 * Peek the last N value without popping.
	 */
	peek(n: number = 1): Array<T> {
		const peeked = this._stack.slice(-n);
		peeked.reverse();

		return peeked;
	}

	/* Returns the number of elements in the stack. */
	size(): number {
		return this._stack.length;
	}

	/* If the stack is empty. */
	isEmpty(): boolean {
		return this.size() === 0;
	}

	/* Return a copy of this Stack. */
	copy(): Stack<T> {
		const copy = new Stack<T>(this._max);
		const items = this.peek(this._max);

		// Push the items onto to the copy in reverse.
		for (let i = items.length - 1; i >= 0; i--) {
			copy.push(items[i]);
		}

		return copy;
	}
}
