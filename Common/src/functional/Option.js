// @flow
import CaseClass from 'Common/src/functional/CaseClass.js';
import Pattern from 'Common/src/functional/Pattern.js';

/**
 * Optional value that should get rid of any explicit null handling. See BinaryTree.add() for an example.
 *
 * @author zuye.zheng
 */
export default class Option<A> extends CaseClass {
	/* eslint-disable-next-line no-use-before-define */
	static some(v: A): Some<A> {
		return new Some(v);
	}

	/* eslint-disable-next-line no-use-before-define */
	static none(): None<A> {
		return new None();
	}

	get(): A {
		return (
			Pattern.case(Some.u('v'), ({v}) => v)
				// $FlowFixMe[method-unbinding] Added when upgrading to Flow 0.154.0
				.case(Pattern._, () => {
					throw new Error('Cannot force get an empty option.');
				})
				// $FlowFixMe[class-object-subtyping] Added when upgrading to Flow 0.153.0
				.match(this)
		);
	}

	getOrElse(other: () => A): A {
		return (
			Pattern.case(Some.u('v'), ({v}) => v)
				// $FlowFixMe[method-unbinding] Added when upgrading to Flow 0.154.0
				.case(Pattern._, () => other())
				// $FlowFixMe[class-object-subtyping] Added when upgrading to Flow 0.153.0
				.match(this)
		);
	}

	orElse(other: () => Option<A>): Option<A> {
		return (
			Pattern.case(Some.u('v'), () => this)
				// $FlowFixMe[method-unbinding] Added when upgrading to Flow 0.154.0
				// $FlowFixMe[incompatible-call] Added when enabling local type inference.
				.case(Pattern._, () => other())
				// $FlowFixMe[class-object-subtyping] Added when upgrading to Flow 0.153.0
				.match(this)
		);
	}

	every(f: (A) => boolean): boolean {
		return this.map(f).getOrElse(() => false);
	}

	forEach(f: (A) => void): void {
		Pattern.case(Some.u('v'), ({v}) => {
			f(v);
			return true;
		})
			// $FlowFixMe[method-unbinding] Added when upgrading to Flow 0.154.0
			.case(Pattern._, () => false)
			// $FlowFixMe[class-object-subtyping] Added when upgrading to Flow 0.153.0
			.match(this);
	}

	flatMap<B>(f: (A) => Option<B>): Option<B> {
		return (
			Pattern.case(Some.u('v'), ({v}) => f(v))
				// $FlowFixMe[method-unbinding] Added when upgrading to Flow 0.154.0
				.case(Pattern._, () => new None())
				// $FlowFixMe[class-object-subtyping] Added when upgrading to Flow 0.153.0
				.match(this)
		);
	}

	map<B>(f: (A) => B): Option<B> {
		return (
			Pattern.case(Some.u('v'), ({v}) => new Some(f(v)))
				// $FlowFixMe[method-unbinding] Added when upgrading to Flow 0.154.0
				// $FlowFixMe[incompatible-call] Added when enabling local type inference.
				.case(Pattern._, () => new None())
				// $FlowFixMe[class-object-subtyping] Added when upgrading to Flow 0.153.0
				.match(this)
		);
	}

	filter(f: (A) => boolean): Option<A> {
		return (
			// $FlowFixMe[incompatible-return] Added when enabling local type inference.
			Pattern.case(Some.u('v'), ({v}) => (f(v) ? this : new None()))
				// $FlowFixMe[method-unbinding] Added when upgrading to Flow 0.154.0
				.case(Pattern._, () => new None())
				// $FlowFixMe[class-object-subtyping] Added when upgrading to Flow 0.153.0
				.match(this)
		);
	}

	/**
	 * Execute the first provided function if present or the second if not.
	 */
	ifPresentOrElse(f: (A) => mixed, other: () => mixed): void {
		Pattern
			// prettier-ignore
			.case(Some.u('v'), ({v}) => {
				f(v);
				return true;
			})
			// $FlowFixMe[method-unbinding] Added when upgrading to Flow 0.154.0
			.case(Pattern._, () => {
				other();
				return false;
			})
			// $FlowFixMe[class-object-subtyping] Added when upgrading to Flow 0.153.0
			.match(this);
	}

	isEmpty(): boolean {
		return (
			Pattern.case(None.u(), () => true)
				// $FlowFixMe[method-unbinding] Added when upgrading to Flow 0.154.0
				.case(Pattern._, () => false)
				// $FlowFixMe[class-object-subtyping] Added when upgrading to Flow 0.153.0
				.match(this)
		);
	}
}

/**
 * No value.
 */
export class None<A> extends Option<A> {
	static C_ARGS: Array<string> = [];
}

/**
 * Has a value.
 */
export class Some<A> extends Option<A> {
	static C_ARGS: Array<string> = ['value'];

	+value: A;

	constructor(value: A) {
		super();
		this.value = value;
	}
}
