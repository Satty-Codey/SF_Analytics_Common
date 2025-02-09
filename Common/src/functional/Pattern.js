// @flow
import type {Check, CheckableValue, CheckReturn} from 'Common/src/functional/CaseClass.js';

// $FlowFixMe[unclear-type]
type CaseBranch<A> = (Object) => A;

/**
 * Scala-esque pattern matcher, see Pattern.unit-test.js for use.
 *
 * Also see https://docs.scala-lang.org/tour/pattern-matching.html especially part on "Matching on case classes".
 *
 * @author zuye.zheng
 */
export default class Pattern<A> {
	static v(value: mixed): Check {
		return (v: CheckableValue) => value === v;
	}

	/**
	 * Wildcard.
	 */
	static _(): CheckReturn {
		return true;
	}

	/**
	 * Null value.
	 */
	static n(v: CheckableValue): boolean {
		return v == null;
	}

	static case(matcher: Check, f: CaseBranch<A>): Pattern<A> {
		return new Pattern<A>().case(matcher, f);
	}

	_cases: Array<[Check, CaseBranch<A>]>;

	constructor() {
		this._cases = [];
	}

	case(matcher: Check, f: CaseBranch<A>): Pattern<A> {
		this._cases.push([matcher, f]);

		return this;
	}

	match(value: CheckableValue): A {
		let executed = null;
		this._cases.find((curCase) => {
			const matched = curCase[0](value);
			if (typeof matched === 'boolean') {
				if (matched) executed = curCase[1]({});
				return matched;
			} else {
				executed = curCase[1](matched);
				return true;
			}
		});

		if (executed == null) throw new Error('Inexhaustive match.');
		return executed;
	}
}
