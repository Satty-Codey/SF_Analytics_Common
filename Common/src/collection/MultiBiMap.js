// @flow
import OptionMap from 'Common/src/functional/OptionMap.js';
import Option from 'Common/src/functional/Option.js';

/**
 * Many-to-many map.
 *
 * @author zuye.zheng, james.diefenderfer
 */
export default class MultiBiMap<F, T, V> {
	_tos: OptionMap<F, OptionMap<T, V>>;
	_froms: OptionMap<T, OptionMap<F, V>>;
	_defaultValue: ?V;

	static kv<FF, TT>(): MultiBiMap<FF, TT, boolean> {
		return new MultiBiMap<FF, TT, boolean>(true);
	}

	constructor(defaultValue: ?V) {
		// keyed by the from id to a map of values keyed by the to id
		this._tos = new OptionMap<F, OptionMap<T, V>>();
		// keyed by the to id to a map of values keyed by the from id
		this._froms = new OptionMap<T, OptionMap<F, V>>();
		// default value when using put
		this._defaultValue = defaultValue;
	}

	/**
	 * Put an optional value from 'from' to 'to' and throw an error if pair already exists. Return @ so puts can be
	 * chained.
	 */
	put(from: F, to: T, value: ?V): MultiBiMap<F, T, V> {
		if (this.has(from, to)) {
			throw new Error(`From '${String(from)}' to '${String(to)}' already exists.`);
		}

		let defaultedValue: V;

		if (value != null) {
			defaultedValue = value;
		} else {
			if (this._defaultValue == null) {
				throw new Error(`Can't set null value without a default value.`);
			} else {
				defaultedValue = this._defaultValue;
			}
		}

		this._tos.getOrSet(from, () => new OptionMap<T, V>()).set(to, defaultedValue);
		this._froms.getOrSet(to, () => new OptionMap<F, V>()).set(from, defaultedValue);

		return this;
	}

	getOptional(from: F, to: T): Option<V> {
		return this._tos.get(from).flatMap((tos) => tos.get(to));
	}

	/**
	 * Get the value for the pair.
	 *
	 * @deprecated - should use getOptional.
	 */
	get(from: F, to: T): V {
		return this.getOptional(from, to).get();
	}

	has(from: F, to: T): boolean {
		return this.getOptional(from, to)
			.map(() => true)
			.getOrElse(() => false);
	}

	hasFrom(from: F): boolean {
		return this._tos.has(from);
	}

	hasTo(to: T): boolean {
		return this._froms.has(to);
	}

	/**
	 * Remove the pair <from, to> and return the value. This will check and throw an error if the pair does not exists
	 * unless check is false.
	 */
	remove(from: F, to: T): V {
		if (!this.has(from, to)) {
			throw new Error(`From '${String(from)}' to '${String(to)}' does not exist.`);
		}

		// store the value to be deleted
		const removedValue = this.get(from, to);

		this._tos.get(from).forEach((tos) => {
			tos.delete(to);
		});
		this._froms.get(to).forEach((froms) => {
			froms.delete(from);
		});

		return removedValue;
	}

	/**
	 *  Remove all references to `to` returning a map of froms where the reference was removed.
	 */
	removeTo(to: T): Array<V> {
		return this._froms
			.get(to)
			.map((froms) => Array.from(froms.map((from, v) => this.remove(from, to)).values()))
			.getOrElse(() => []);
	}

	/**
	 *  Remove all references from `from` returning a map of tos where the reference was removed.
	 */
	removeFrom(from: F): Array<V> {
		return this._tos
			.get(from)
			.map((tos) => Array.from(tos.map((to, v) => this.remove(from, to)).values()))
			.getOrElse(() => []);
	}

	/**
	 *  Return a map of all values for the given from.
	 *
	 *  @deprecated - should not be necessary
	 */
	getToMap(from: F): {[T]: V, ...} {
		return this._tos
			.get(from)
			.map((tos) => {
				const tosMap = {};
				tos.forEach((k, v) => {
					// $FlowFixMe[invalid-computed-prop] Added when upgrading to Flow 0.192.0
					tosMap[k] = v;
				});
				return tosMap;
			})
			.getOrElse(() => {
				return {};
			});
	}

	/**
	 * Return all tos for the given from as an array.
	 */
	getTos(from: F): Array<T> {
		return this._tos
			.get(from)
			.map((tos) => Array.from(tos.keys()))
			.getOrElse(() => []);
	}

	/**
	 * Return tuple of to key and value.
	 */
	getTosWithValue(from: F): Array<[T, V]> {
		return this._tos
			.get(from)
			.map((tos) => Array.from(tos.entries()))
			.getOrElse(() => []);
	}

	/**
	 *  Get all tos as an array.
	 */
	getAllTos(): Array<T> {
		return Array.from(this._froms.keys());
	}

	/**
	 *  Return froms for the given to as an array.
	 */
	getFroms(to: T): Array<F> {
		return this._froms
			.get(to)
			.map((froms) => Array.from(froms.keys()))
			.getOrElse(() => []);
	}

	/**
	 * Return tuple of from and value.
	 */
	getFromsWithValue(to: T): Array<[F, V]> {
		return this._froms
			.get(to)
			.map((froms) => Array.from(froms.entries()))
			.getOrElse(() => []);
	}

	/**
	 *  Return all froms as an array.
	 */
	getAllFroms(): Array<F> {
		return Array.from(this._tos.keys());
	}

	/* Return all pairs of from -> to in an array. */
	getPairs(): Array<{from: F, to: T}> {
		const pairs = [];

		this._tos.forEach((from, tos) => {
			tos.forEach((to, value) => {
				pairs.push({
					from: from,
					to: to
				});
			});
		});

		return pairs;
	}

	reduceFroms<A>(reducer: (Array<[T, V]>) => A): OptionMap<F, A> {
		return this._tos.map((from, tos) => reducer(tos.entries()));
	}

	reduceTos<A>(reducer: (Array<[F, V]>) => A): OptionMap<T, A> {
		return this._froms.map((to, froms) => reducer(froms.entries()));
	}
}
