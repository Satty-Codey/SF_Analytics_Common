// @flow

/* eslint-disable no-use-before-define */
// $FlowFixMe[unclear-type]
type AnyEnum = BaseEnum<any>;
/* eslint-enable no-use-before-define */

/**
 * Abstract base class for enums and codeables.
 */
export default class BaseEnum<A: AnyEnum> {
	static _NAME_TO_ENUM: Map<string, A>;

	static finish(): Class<this> {
		return Object.freeze(this);
	}

	static fromName(name: string): A {
		const value = this._NAME_TO_ENUM.get(name);
		if (!value) {
			throw new Error(`Cannot find enum for name '${name}'.`);
		}

		return value;
	}

	static hasName(name: string): boolean {
		return this._NAME_TO_ENUM.has(name);
	}

	static fromOrdinal(index: number): A {
		const e = Array.from(this._NAME_TO_ENUM.values())[index];
		if (!e) {
			throw new Error(`No enum found at ordinal ${index}.`);
		}

		return e;
	}

	// $FlowFixMe[unsupported-syntax]
	static [Symbol.iterator](): Iterator<A> {
		return this._NAME_TO_ENUM.values();
	}

	static enums(): Array<A> {
		return Array.from(this._NAME_TO_ENUM.values());
	}

	+name: string;
	+ordinal: number;
}
