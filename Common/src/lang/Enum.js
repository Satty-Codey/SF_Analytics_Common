// @flow
import BaseEnum from 'Common/src/lang/BaseEnum.js';

/* eslint-disable no-use-before-define */
// $FlowFixMe[unclear-type]
type AnyEnum = Enum<any>;
/* eslint-enable no-use-before-define */

/**
 * Flow typed implementation of Java-esque enum.
 *
 * class E1 extends Enum<E1> {
 *     static A: E1;
 *     static B: E1;
 *     static C: E1;
 * }
 * E1
 *     // prettier-ignore
 *     .add('A', new E1())
 *     .add('B', new E1())
 *     .add('C', new E1())
 *     .finish();
 *
 * @author zuye.zheng
 */
export default class Enum<A: AnyEnum> extends BaseEnum<A> {
	static add(name: string, e: A): Class<this> {
		if (!this._NAME_TO_ENUM) {
			this._NAME_TO_ENUM = new Map();
		}

		this._NAME_TO_ENUM.set(name, e);

		Object.defineProperty(this, name, {
			value: e,
			writable: false
		});
		Object.defineProperties(this[name], {
			name: {
				value: name,
				enumerable: true,
				writable: false
			},
			ordinal: {
				value: this._NAME_TO_ENUM.size - 1,
				enumerable: true,
				writable: false
			}
		});

		return this;
	}
}
