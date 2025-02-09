// @flow

type Entry<T> = {
	key: string,
	value: T,
	older?: Entry<T>,
	newer?: Entry<T>
};

/**
 * LRU cache that uses a doubly-linked list:
 *
 *         | newer| => | newer| => | newer| => null
 *         | head |    | a    |    | tail |
 * null <= |older | <= |older | <= |older |
 *
 * New objects are appended to the tail, and every get results in the object moving to the tail. The oldest time, at the
 * head, is pruned when the size of the cache reaches the limit.
 */
export default class Cache<T> {
	_cache: Map<string, Entry<T>>;
	_size: number;
	_hits: number;
	_misses: number;
	_limit: ?number;
	_tail: ?Entry<T>;
	_head: ?Entry<T>;

	constructor(limit: ?number) {
		this._cache = new Map();
		this._size = 0;
		this._hits = 0;
		this._misses = 0;

		// $FlowFixMe[sketchy-null-number]
		if (limit) {
			this.setLimit(limit);
		}
	}

	/* Removes any relevant entry for the key and inserts the value. */
	put(key: string, value: T): T {
		let entry = this._cache.get(key);
		if (entry) {
			entry.value = value;
			this._remove(entry);
		} else {
			entry = {key, value};
		}

		return this._insert(entry).value;
	}

	/* Removes the head and returns it. */
	shift(): ?Entry<T> {
		return this._remove(this._head);
	}

	/**
	 * See if the key exists without modifying order or recording a hit/miss.
	 */
	has(key: string): boolean {
		return this._cache.has(key);
	}

	/**
	 * Looks up a key and returns the value if it exists.
	 */
	get(key: string): T | void {
		const entry = this._cache.get(key);
		if (!entry) {
			this._misses++;
			return;
		}
		this._hits++;
		this._remove(entry);
		return this._insert(entry).value;
	}

	getOrPut(key: string, getValue: () => T): T {
		const existing = this.get(key);

		return existing != null ? existing : this._insert({key, value: getValue()}).value;
	}

	/* Invalidates the cache entry for the given key. */
	delete(key: string): ?Entry<T> {
		const entry = this._cache.get(key);
		if (entry) {
			return this._remove(entry);
		}
	}

	/* Resets this cache, moving the original into GC. */
	flush(): this {
		delete this._head;
		delete this._tail;
		this._size = 0;
		this._cache = new Map();
		return this;
	}

	/* Returns an array of all the keys in this cache. */
	keys(): Array<string> {
		let entry = this._head;

		const result = [];
		while (entry) {
			const {key} = entry;
			entry = entry.newer;
			result.push(key);
		}

		return result;
	}

	/* Sets the size limit for this cache, removing any extra objects. */
	setLimit(limit: number): this {
		this._limit = limit;

		let n = this._size - limit;
		if (n > 0) {
			while (--n) {
				this.shift();
			}
		}

		return this;
	}

	clone(): Cache<T> {
		const clone = new Cache<T>(this._limit);

		let entry = this._head;
		while (entry) {
			clone.put(entry.key, entry.value);
			entry = entry.newer;
		}

		return clone;
	}

	/* Removes the node from the cache. */
	_remove(node: ?Entry<T>): ?Entry<T> {
		if (!node) {
			return;
		}

		this._cache.delete(node.key);
		if (node.newer) {
			node.newer.older = node.older;
		} else {
			this._tail = node.older;
		}
		if (node.older) {
			node.older.newer = node.newer;
		} else {
			this._head = node.newer;
		}
		this._size--;

		return node;
	}

	/* Inserts a node into the cache. */
	_insert(node: Entry<T>): Entry<T> {
		this._cache.set(node.key, node);
		if (this._tail) {
			this._tail.newer = node;
			node.older = this._tail;
		} else {
			this._head = node;
		}
		delete node.newer;
		this._tail = node;
		if (this._size === this._limit) {
			this._remove(this._head);
		}
		this._size++;

		return node;
	}
}
