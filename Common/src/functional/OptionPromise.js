// @flow

import Either from 'Common/src/functional/Either.js';

/**
 * Promise.then is nice, handling nulls (or "NONE"s) in them is not so nice. This blends the concepts with optional to
 * handle them a little more elegantly (hopefully).
 *
 * This also allows for a more functional approach to exception/rejection handling without throwing exceptions. With a
 * normal promise you need to explicitly handle the reject case at every then or there is a chance of an uncaught
 * exception being thrown. This allows you to handle them all at the end without throwing exceptions. They can be
 * silently ignored with getOrElse() or explicitly handled with either().
 *
 * @author zuye.zheng
 */
export default class OptionPromise<A> {
	static NO_VALUE: symbol = Symbol('no value');
	static FILTERED: symbol = Symbol('filtered');

	static VAL_NONE: () => boolean = () => false;
	// $FlowFixMe[incompatible-use]
	static SIZED_NONE: (a: mixed) => boolean = (a: mixed) => a.length <= 0 || a.size <= 0;
	static NaN_NONE: (a: mixed) => boolean = (a: mixed) => isNaN(a);

	static sized(p: Promise<A>): OptionPromise<A> {
		return new OptionPromise(p, OptionPromise.SIZED_NONE);
	}

	_p: Promise<A | null>;
	_isNone: (mixed) => boolean;

	constructor(p: Promise<A | null>, isNone: ?(mixed) => boolean) {
		this._p = p;
		this._isNone = isNone ? isNone : OptionPromise.VAL_NONE;
	}

	/**
	 * Get the promised value or a default if null or rejections along the way, other will be called with the rejection.
	 */
	getOrElse(other: (mixed) => $NonMaybeType<A> | Promise<$NonMaybeType<A>>): Promise<$NonMaybeType<A>> {
		// $FlowFixMe[incompatible-call] Added when enabling local type inference.
		return this._p.then(
			(a) => {
				if (this._isReallyNone(a)) {
					return other(OptionPromise.NO_VALUE);
				} else {
					return a;
				}
			},
			(reason) => other(reason)
		);
	}

	/**
	 * Like getOrElse but if you want to really handle the rejection and as a different generic type.
	 */
	either<B>(reject: (mixed) => B): Promise<Either<B, $NonMaybeType<A>>> {
		// $FlowFixMe[incompatible-call] Added when enabling local type inference.
		return this._p.then(
			(a) => {
				if (this._isReallyNone(a)) {
					return Either.left(reject(OptionPromise.NO_VALUE));
				} else {
					return Either.right(a);
				}
			},
			(reason) => Either.left(reject(reason))
		);
	}

	map<B>(f: ($NonMaybeType<A>) => B | Promise<B>, isNone: (mixed) => boolean = this._isNone): OptionPromise<B> {
		return new OptionPromise(
			this._p.then((a) => {
				if (this._isReallyNone(a)) {
					return Promise.reject(OptionPromise.NO_VALUE);
				} else {
					// $FlowFixMe[incompatible-call]
					return f(a);
				}
			}),
			isNone
		);
	}

	filter(f: ($NonMaybeType<A>) => boolean): OptionPromise<$NonMaybeType<A>> {
		return new OptionPromise(
			this._p.then((a) => {
				// $FlowFixMe[incompatible-call]
				if (!this._isReallyNone(a) && f(a)) {
					return a;
				} else {
					return Promise.reject(OptionPromise.FILTERED);
				}
			}),
			this._isNone
		);
	}

	isEmpty(): Promise<boolean> {
		return this._p.then((a) => this._isReallyNone(a));
	}

	_isReallyNone(a: A | null): boolean {
		return a == null || this._isNone(a);
	}
}
