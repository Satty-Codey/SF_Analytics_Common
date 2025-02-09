// @flow
import OptionMap from 'Common/src/functional/OptionMap.js';
import Option from 'Common/src/functional/Option.js';

/**
 * Simple bidirectional map, allows look-ups from value to key in addition to the other way around. Keys and values must
 * both be unique within their respective sets.
 */
export default class BiMap<K, V> {
	_valuesByKey: OptionMap<K, V> = new OptionMap();
	_keysByValue: OptionMap<V, K> = new OptionMap();

	constructor(pairs?: Array<[K, V]>) {
		pairs?.forEach(([key, value]) => this.put(key, value));
	}

	hasKey(key: K): boolean {
		return this._valuesByKey.has(key);
	}

	hasValue(value: V): boolean {
		return this._keysByValue.has(value);
	}

	put(key: K, value: V): void {
		if (this.hasKey(key)) {
			throw new Error(`Key "${String(key)}" already exists.`);
		} else if (this.hasValue(value)) {
			throw new Error(`Value "${String(value)}" already exists.`);
		}

		this._valuesByKey.set(key, value);
		this._keysByValue.set(value, key);
	}

	get(key: K): Option<V> {
		return this._valuesByKey.get(key);
	}

	getByValue(value: V): Option<K> {
		return this._keysByValue.get(value);
	}
}
