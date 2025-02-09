// @flow
import CaseClass from 'Common/src/functional/CaseClass.js';
import Pattern from 'Common/src/functional/Pattern.js';
import Option from 'Common/src/functional/Option.js';

/**
 * Simple immutable binary tree, more of an example of case classes and pattern matching as a more algebraic way of
 * defining data structures.
 *
 */
export default class BinaryTree<A> extends CaseClass {
	static C_ARGS: Array<string> = ['value'];

	/* eslint-disable-next-line no-use-before-define */
	static leaf(value: A): Leaf<A> {
		return new Leaf(value);
	}

	/* eslint-disable-next-line no-use-before-define */
	static branch(value: A, left: Option<BinaryTree<A>>, right: Option<BinaryTree<A>>): Branch<A> {
		return new Branch(value, left, right);
	}

	+value: A;

	constructor(value: A) {
		super();
		this.value = value;
	}

	fold<B>(fL: (A) => B, fB: (Option<B>, Option<B>, A) => B): B {
		return (
			Pattern.case(Leaf.u('v'), ({v}) => fL(v))
				.case(Branch.u('value', 'left', 'right'), ({value, left, right}) =>
					fB(
						left.map((t) => t.fold(fL, fB)),
						right.map((t) => t.fold(fL, fB)),
						value
					)
				)
				// $FlowFixMe[class-object-subtyping] Added when upgrading to Flow 0.153.0
				.match(this)
		);
	}

	depth(): number {
		return this.fold(
			() => 1,
			(left, right) =>
				Math.max(
					left.getOrElse(() => 0),
					right.getOrElse(() => 0)
				) + 1
		);
	}

	size(): number {
		return this.fold(
			() => 1,
			(left, right) => left.getOrElse(() => 0) + right.getOrElse(() => 0) + 1
		);
	}

	/**
	 * Add a new element given the comparator cF (0 if equal, positive if first is greater, negative otherwise) and
	 * assuming the tree is a BST.
	 */
	add(value: A, cF: (A, A) => number): BinaryTree<A> {
		return (
			Pattern.case(Leaf.u('v'), ({v}) =>
				cF(value, v) >= 0
					? // $FlowFixMe[incompatible-call] Added when enabling local type inference.
					  new Branch(value, Option.some(this), Option.none())
					: // $FlowFixMe[incompatible-call] Added when enabling local type inference.
					  new Branch(value, Option.none(), Option.some(this))
			)
				.case(Branch.u('v', 'left', 'right'), ({v, left, right}) =>
					cF(value, v) >= 0
						? new Branch(
								this.value,
								left,
								Option.some(
									right
										// if there is a node already there, add to it
										.map((t) => t.add(value, cF))
										// if no node, add as a leaf
										.getOrElse(() => new Leaf(value))
								)
						  )
						: new Branch(
								this.value,
								Option.some(
									left
										// if there is a node already there, add to it
										.map((t) => t.add(value, cF))
										// if no node, add as a leaf
										.getOrElse(() => new Leaf(value))
								),
								right
						  )
				)
				// $FlowFixMe[class-object-subtyping] Added when upgrading to Flow 0.153.0
				.match(this)
		);
	}

	/**
	 * Return sorted values assuming the nodes follow a BST.
	 */
	valuesSorted(): Array<A> {
		return this.fold(
			(v) => [v],
			(left, right, v) =>
				[].concat(
					left.getOrElse(() => []),
					[v],
					right.getOrElse(() => [])
				)
		);
	}
}

/**
 * Leaf node.
 */
class Leaf<A> extends BinaryTree<A> {}

/**
 * Branch node.
 */
class Branch<A> extends BinaryTree<A> {
	static C_ARGS: Array<string> = ['value', 'left', 'right'];

	+left: Option<BinaryTree<A>>;
	+right: Option<BinaryTree<A>>;

	constructor(value: A, left: Option<BinaryTree<A>>, right: Option<BinaryTree<A>>) {
		super(value);
		this.left = left;
		this.right = right;
	}
}
