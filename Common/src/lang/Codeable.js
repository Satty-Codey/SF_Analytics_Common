// @flow
import BaseEnum from 'Common/src/lang/BaseEnum.js';

/* eslint-disable no-use-before-define */
// $FlowFixMe[unclear-type]
type AnyCodeable = Codeable<any>;
/* eslint-enable no-use-before-define */

/**
 * Flow typed implementation of Java-esque enum.
 *
 * class C1 extends Codeable<C1> {
 *     static A: C1;
 *     static B: C1;
 *     static C: C1;
 * }
 * C1
 *     // prettier-ignore
 *     .add('Name1', 'Code1', new C1())
 *     .add('Name2', 'Code2', new C1())
 *     .add('Name3', 'Code3', new C1())
 *     .finish();
 */
export default class Codeable<A: AnyCodeable> extends BaseEnum<A> {
	static _CODE_TO_ENUM: Map<string, A>;

	static add(name: string, code: string, c: A): Class<this> {
		if (!this._NAME_TO_ENUM || !this._CODE_TO_ENUM) {
			this._NAME_TO_ENUM = new Map();
			this._CODE_TO_ENUM = new Map();
		}

		this._NAME_TO_ENUM.set(name, c);

		Object.defineProperty(this, name, {
			value: c,
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

		this._CODE_TO_ENUM.set(code, c);
		Object.defineProperty(this[name], 'code', {value: code});

		return this;
	}

	static getDefaultValue(): A {
		throw new Error(`Not implemented.`);
	}

	static fromCode(code: string): A {
		const value = this._CODE_TO_ENUM.get(code);
		if (!value) {
			try {
				return this.getDefaultValue();
			} catch {
				throw new Error(`Cannot find enum for code '${code}'.`);
			}
		}

		return value;
	}

	static hasCode(code: string): boolean {
		return this._CODE_TO_ENUM.has(code);
	}

	+code: string;
}
