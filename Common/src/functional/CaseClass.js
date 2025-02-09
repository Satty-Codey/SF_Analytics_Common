// @flow

// $FlowFixMe[unclear-type]
export type CheckReturn = boolean | Object;

export type CheckableValue = {[string]: CheckableValue, ...};

export type Check = (v: CheckableValue) => CheckReturn;

/**
 * Scala-esque case class that provides a static unapply (u for shorthand) for pattern matching. See Pattern.js and
 * Pattern.unit-test.js for use.
 *
 * Really just need to specify static C_ARGS to match your constructor arguments by order and named as the instance
 * variables they are matched with.
 *
 * @author zuye.zheng
 */
export default class CaseClass {
	static C_ARGS: Array<string>;

	/**
	 * Where the magic happens, but really it happens in u which saves on some typing.
	 */
	static unapply(...args: Array<string | Check>): Check {
		return this.u(...args);
	}

	/**
	 * Short hand for unapply, actually implemented here to save on some stack frames since recursive.
	 */
	static u(...args: Array<string | Check>): Check {
		const Clazz = this;
		if (Clazz.C_ARGS.length !== arguments.length) throw new Error('Mismatched argument lengths.');

		return (v: CheckableValue): CheckReturn => {
			if (!(v instanceof this)) return false;

			const extracted = {};
			const matched = args.every((expected, i) => {
				if (typeof expected === 'string') {
					// extraction
					// $FlowFixMe[prop-missing] Added when upgrading to Flow 0.190.1
					extracted[expected] = v[Clazz.C_ARGS[i]];
					return true;
				} else {
					// check
					const checked = expected(v[Clazz.C_ARGS[i]]);
					if (checked instanceof Object) Object.entries(checked).forEach((e) => (extracted[e[0]] = e[1]));
					return !!checked;
				}
			});
			return matched ? extracted : false;
		};
	}
}
