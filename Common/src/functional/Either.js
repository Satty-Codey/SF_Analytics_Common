// @flow
import CaseClass from 'Common/src/functional/CaseClass.js';
import Pattern from 'Common/src/functional/Pattern.js';

/**
 * Useful data structure that lets you return either a strongly typed Left or Right from a single function. Makes
 * error handling a lot simpler especially with regards to thrown exceptions and "sentinel" values. See
 * Either.unit-test.js.
 *
 * @author zuye.zheng
 */
export default class Either<A, B> extends CaseClass {
	static C_ARGS: Array<string> = ['value'];

	// $FlowFixMe[unclear-type]
	static left(v: A): Either<A, any> {
		return new Left(v);
	}

	// $FlowFixMe[unclear-type]
	static right(v: B): Either<any, B> {
		return new Right(v);
	}

	fold<C>(fA: (A) => C, fB: (B) => C): C {
		return (
			Pattern.case(Left.u('v'), ({v}) => fA(v))
				.case(Right.u('v'), ({v}) => fB(v))
				// $FlowFixMe[class-object-subtyping] Added when upgrading to Flow 0.153.0
				.match(this)
		);
	}

	swap(): Either<B, A> {
		return (
			Pattern.case(Left.u('v'), ({v}) => new Right(v))
				// $FlowFixMe[incompatible-call] Added when enabling local type inference.
				.case(Right.u('v'), ({v}) => new Left(v))
				// $FlowFixMe[class-object-subtyping] Added when upgrading to Flow 0.153.0
				.match(this)
		);
	}

	map<C>(f: (B) => C): Either<A, C> {
		return (
			Pattern.case(Right.u('v'), ({v}) => new Right(f(v)))
				// $FlowFixMe[incompatible-call] Added when enabling local type inference.
				.case(Left.u('v'), ({v}) => new Left(v))
				// $FlowFixMe[class-object-subtyping] Added when upgrading to Flow 0.153.0
				.match(this)
		);
	}

	flatMap<C>(f: (B) => Either<A, C>): Either<A, C> {
		return (
			Pattern.case(Right.u('v'), ({v}) => f(v))
				.case(Left.u('v'), ({v}) => new Left(v))
				// $FlowFixMe[class-object-subtyping] Added when upgrading to Flow 0.153.0
				.match(this)
		);
	}

	getOrElse(f: () => B): B {
		return (
			Pattern.case(Right.u('v'), ({v}) => v)
				// $FlowFixMe[method-unbinding] Added when upgrading to Flow 0.154.0
				.case(Pattern._, () => f())
				// $FlowFixMe[class-object-subtyping] Added when upgrading to Flow 0.153.0
				.match(this)
		);
	}
}

/**
 * Left is the error/edge case.
 */
export class Left<A> extends Either<
	A,
	// $FlowFixMe[unclear-type]
	any
> {
	+value: A;

	constructor(value: A) {
		super();

		this.value = value;
	}
}

/**
 * Right is the normal/success case that works with map, etc.
 */
export class Right<B> extends Either<
	// $FlowFixMe[unclear-type]
	any,
	B
> {
	+value: B;

	constructor(value: B) {
		super();

		this.value = value;
	}
}
