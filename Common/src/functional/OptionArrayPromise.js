// @flow

import OptionPromise from 'Common/src/functional/OptionPromise.js';

/**
 * Like OptionPromise but an array of them and fancier map and flatMap functions.
 *
 * @author zuye.zheng
 */
export default class OptionArrayPromise<A> extends OptionPromise<Array<A>> {
	constructor(p: Promise<Array<A> | null>) {
		super(p, OptionPromise.SIZED_NONE);
	}

	/**
	 * Map each non-null element in the array individually.
	 */
	mapEach<B>(f: (A) => B): OptionArrayPromise<B | null> {
		return new OptionArrayPromise(this.map((els) => els.map((el) => (el == null ? null : f(el))))._p);
	}

	/**
	 * Each element of the array is mapped to a promise, wait for all of them to return or the first to fail. This will
	 * remove null elements from the array.
	 */
	flatMapEach<B>(f: ($NonMaybeType<A>) => Promise<B>): OptionArrayPromise<B> {
		return new OptionArrayPromise(
			this._p.then((els) => {
				if (this._isReallyNone(els)) {
					return Promise.reject(OptionPromise.NO_VALUE);
				} else {
					// $FlowFixMe[incompatible-use]
					return Promise.all(els.filter((el) => el != null).map(f)).then((mappedEls) =>
						mappedEls.filter((el) => el != null)
					);
				}
			})
		);
	}
}
