// @flow
import Option from 'Common/src/functional/Option.js';

/**
 * Mutable set that returns Options and more functional patterns.
 *
 * @author zuye.zheng
 */
export default class OptionSet<A> {
	_set: Set<A>;

	constructor() {
		this._set = new Set();
	}

	has(key: A): Option<A> {
		if (this._set.has(key)) {
			return Option.some(key);
		} else {
			// $FlowFixMe[incompatible-return] Added when enabling local type inference.
			return Option.none();
		}
	}

	hasOrAdd(key: A, keyF: ?() => A): A {
		return this.has(key).getOrElse(() => {
			const keyToAdd = keyF ? keyF() : key;
			this._set.add(keyToAdd);

			return keyToAdd;
		});
	}

	add(value: A): OptionSet<A> {
		this._set.add(value);

		return this;
	}

	delete(key: A): Option<A> {
		return this.has(key).map((v) => {
			this._set.delete(key);
			return v;
		});
	}

	forEach(f: (A) => void) {
		this._set.forEach(f);
	}

	map<B>(f: (A) => B): OptionSet<B> {
		const newSet: OptionSet<B> = new OptionSet();
		for (const value of this._set) {
			newSet.add(f(value));
		}

		return newSet;
	}
}
