// @flow

type Entry<K, V> = {
	key: K,
	value: V
};

/**
 * Although JS objects/map have stable key iteration order over most browsers because of historical behaviour, it is
 * undocumented and bothers me, so linked map just to be safe, bonus of some common utils and support of null and
 * undefined values and uniqueness.
 *
 * TODO ZZ: will be a little better with a linked list vs an array
 *
 * @author zuye.zheng
 */
export default class LinkedMap<K, V> {
	_ensureUnique: boolean;
	_list: Array<Entry<K, V>> = [];
	_map: Map<K, Entry<K, V>> = new Map();

	/* Optionally ensure keys are unique and throw and error if not. */
	constructor(ensureUnique: boolean = false) {
		this._ensureUnique = ensureUnique;
	}

	put(key: K, value: V, shouldReplace: boolean = false): ?V {
		/* Put and return the old value. */
		const oldEntry = this._map.get(key);
		if (this._ensureUnique && oldEntry != null && !shouldReplace) {
			throw new Error('Existing value with key.');
		}

		// bundle the key and value and store that so you can lookup either
		const entry = {key, value};

		this._map.set(key, entry);
		if (oldEntry != null) {
			// replace the value at its current position in the list
			this._list.splice(this._list.indexOf(oldEntry), 1, entry);
		} else {
			// add the value to the list
			this._list.push(entry);
		}

		return oldEntry ? oldEntry.value : undefined;
	}

	/* Get the value of the given key. */
	get(key: K): ?V {
		const entry = this._map.get(key);

		return entry ? entry.value : undefined;
	}

	getStrict(key: K): V {
		const entry = this._map.get(key);
		if (!entry) {
			throw new Error(`No value found for key.`);
		}

		return entry.value;
	}

	/* Get the value at the given index. */
	getValueAt(index: number): V {
		return this._getEntryAt(index).value;
	}

	/* Get the key at the given index. */
	getKeyAt(index: number): K {
		return this._getEntryAt(index).key;
	}

	/* Get all values in insertion order. */
	getValues(): Array<V> {
		return this._list.map((entry) => entry.value);
	}

	/**
	 * Iterate through each value with iteratee and optional context, iteratee can return false to prevent further iteration.
	 */
	eachValue(iteratee: (V, K, mixed) => ?boolean, context: mixed) {
		for (const curEntry of this._list) {
			if (!iteratee(curEntry.value, curEntry.key, context)) {
				break;
			}
		}
	}

	/* Get all keys in insertion order, iteration results will be returned in a list. */
	getKeys(): Array<K> {
		return this._list.map((entry) => entry.key);
	}

	/**
	 * Iterate through each key with iteratee and optional context, iteratee can return false to prevent further iteration.
	 */
	eachKey(iteratee: (K, mixed) => boolean, context: mixed) {
		for (const curEntry of this._list) {
			if (!iteratee(curEntry.key, context)) {
				break;
			}
		}
	}

	/* Get the index of the given value. */
	getIndex(value: V): number {
		let i = 0;
		let index = -1;
		for (const curEntry of this._list) {
			if (curEntry.value === value) {
				index = i;
				break;
			}
			i++;
		}

		return index;
	}

	/* Remove the last element and return it. */
	pop(): ?V {
		const entry = this._list.pop();
		if (!entry) {
			return;
		}

		this._map.delete(entry.key);

		return entry.value;
	}

	/* Remove value by key. */
	remove(key: K): ?V {
		// make sure it's there
		const entry = this._map.get(key);
		if (!entry) {
			return;
		}

		// remove from map and list
		this._map.delete(key);
		this._list.splice(this._list.indexOf(entry), 1);

		// return removed value
		return entry.value;
	}

	containsKey(key: K): boolean {
		return this._map.has(key);
	}

	containsValue(value: V): boolean {
		return this.getIndex(value) !== -1;
	}

	size(): number {
		return this._list.length;
	}

	isEmpty(): boolean {
		return !this._list.length;
	}

	/* Get the value at the given index. */
	_getEntryAt(index: number): Entry<K, V> {
		const entry = this._list[index];

		if (!entry) {
			throw new Error(`No entry found at index ${index}.`);
		}

		return entry;
	}
}
