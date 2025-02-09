// @flow
import Option from 'Common/src/functional/Option.js';

/**
 * Mutable map that returns Options and more functional patterns.
 *
 * @author zuye.zheng
 */
export default class OptionMap<A, B> {
	_map: Map<A, B>;

	constructor(entries?: Array<[A, B]>) {
		this._map = new Map(entries);
	}

	has(key: A): boolean {
		return this._map.has(key);
	}

	get(key: A): Option<B> {
		if (this._map.has(key)) {
			// $FlowFixMe[incompatible-return]
			return Option.some(this._map.get(key));
		} else {
			// $FlowFixMe[incompatible-return] Added when enabling local type inference.
			return Option.none();
		}
	}

	getOrSet(key: A, valueF: () => B): B {
		return this.get(key).getOrElse(() => {
			const value = valueF();
			this._map.set(key, value);
			return value;
		});
	}

	set(key: A, value: B): OptionMap<A, B> {
		this._map.set(key, value);

		return this;
	}

	/**
	 * Perform a computation with the existing value and update it or set it to the thunk if no existing value.
	 */
	computeOrSet(key: A, compute: (B) => B, valueThunk: () => B): B {
		const existingValue = this._map.get(key);

		if (existingValue != null) {
			const value = compute(existingValue);
			this._map.set(key, value);
			return value;
		} else {
			const value = valueThunk();
			this._map.set(key, value);
			return value;
		}
	}

	delete(key: A): Option<B> {
		return this.get(key).map((v) => {
			this._map.delete(key);
			return v;
		});
	}

	forEach(f: (A, B) => void) {
		for (const item of this._map) {
			f(item[0], item[1]);
		}
	}

	map<C>(f: (A, B) => C): OptionMap<A, C> {
		const newMap: OptionMap<A, C> = new OptionMap();
		for (const item of this._map) {
			newMap.set(item[0], f(item[0], item[1]));
		}

		return newMap;
	}

	get size(): number {
		return this._map.size;
	}

	entries(): Array<[A, B]> {
		const entries: Array<[A, B]> = [];
		this.forEach((key, value) => {
			entries.push([key, value]);
		});

		return entries;
	}

	// $FlowFixMe[unsupported-syntax]
	[Symbol.iterator](): Iterator<[A, B]> {
		return this._map[Symbol.iterator]();
	}

	keys(): Iterator<A> {
		return this._map.keys();
	}

	values(): Iterator<B> {
		return this._map.values();
	}
}
