// @flow
import BaseDirectedGraph, {type NodeMap} from 'Common/src/collection/graph/BaseDirectedGraph.js';
import LinkedMap from 'Common/src/collection/LinkedMap.js';
import type DirectedGraphNode from 'Common/src/collection/graph/DirectedGraphNode.js';

// TODO: Ideally, this would have the same two generics as the graph instead of `any`s. Flow as of 0.130.0 doesn't like
// that and throws a very hard-to-suppress error so we just compromise on type safety here to avoid losing type safety
// on the entire class.

// $FlowFixMe[unclear-type]
type TopologicalOrdering = Array<DirectedGraphNode<any, any>>;

type NodeDistance<T, V> = {
	distance: number,
	node: DirectedGraphNode<T, V>,
	parentNodeDistance: NodeDistance<T, V> | void
};

/**
 * A single immutable directed graph. Build these with mutable DirectedGraphs. The parameter respectEdgeOrder affects the
 * traversal order of nodes within topological sort. It attempts to respect the implied sort order of edges, so
 * A->B, A->C will return the order A, B, C if true, but if false, A, C, B will be returned. Both are valid topological
 * sorts, but the first better respects the implied input edge ordering.
 *
 */
export default class DirectedGraph<T, V = void> extends BaseDirectedGraph<T, V> {
	_respectEdgeOrder: boolean;
	_isAcyclic: boolean;

	_topologicalOrder: TopologicalOrdering | void;

	/* Construct with an immutable set of nodes in a LinkedMap. */
	constructor(nodes: NodeMap<T, V>, respectEdgeOrder: boolean = false) {
		super(nodes);

		this._respectEdgeOrder = respectEdgeOrder;

		// analyze the graph starting with the root nodes
		const rootNodes = this.getRootNodes();
		this._isAcyclic = true;

		if (rootNodes.length === 0) {
			// no root nodes, graph is cyclical
			this._isAcyclic = false;
		} else {
			// else do a topological sort starting from each root node
			const topologicalOrder: Array<DirectedGraphNode<$FlowFixMe, $FlowFixMe>> = [];
			const visitedNodes = new Set<DirectedGraphNode<T, V>>();
			for (const curNode of rootNodes) {
				if (!this._topologicalSort(curNode, topologicalOrder, visitedNodes)) {
					// sort failed because of cycles in the graph
					this._isAcyclic = false;
					break;
				}
			}

			// store the topological order if is acyclic
			if (this._isAcyclic) {
				this._topologicalOrder = topologicalOrder;
			}
		}
	}

	isAcyclic(): boolean {
		return this._isAcyclic;
	}

	/* Return the topological order, undefined is not acyclic. */
	getTopologicalOrder(): TopologicalOrdering | void {
		return this._topologicalOrder;
	}

	getRespectEdgeOrder(): boolean {
		//Test only: Verify that this instance has been constructed with the expected edge ordering
		return this._respectEdgeOrder;
	}

	/* Return the longest path in the graph, undefined if there are cycles since it becomes NP-hard. */
	getLongestPath(): Array<DirectedGraphNode<T, V>> | void {
		let curNodeDistance: NodeDistance<T, V> | void;
		let furthestNodeDistance: NodeDistance<T, V> | void;
		let parentNodeDistance: NodeDistance<T, V> | void;

		if (!this._topologicalOrder) {
			return;
		}

		const nodeDistances = new Map<
			string,
			{
				distance: number,
				node: DirectedGraphNode<$FlowFixMe, $FlowFixMe>,
				parentNodeDistance:
					| void
					| NodeDistance<T, V>
					| {
							distance: number,
							node: DirectedGraphNode<$FlowFixMe, $FlowFixMe>,
							parentNodeDistance: $FlowFixMe
					  }
			}
		>();

		// go through the topogocial order to figure out the longest path
		// $FlowFixMe[incompatible-type] Added when upgrading to Flow 0.146.0
		for (const curNode of this._topologicalOrder) {
			let curDistance;
			if (curNode.isRoot()) {
				// root nodes have a distance of 0
				curDistance = 0;
			} else {
				// otherwise find the source with the longest distance
				let maxSourceNodeDistance;
				for (const curEdge of curNode.getSourceEdges()) {
					const curSourceNodeDistance = nodeDistances.get(curEdge.getSource().getId());
					if (!curSourceNodeDistance) {
						throw new Error('Expected source node distance to have been determined.');
					}

					if (!maxSourceNodeDistance || curSourceNodeDistance.distance > maxSourceNodeDistance.distance) {
						maxSourceNodeDistance = curSourceNodeDistance;
					}
				}

				if (!maxSourceNodeDistance) {
					throw new Error('Expected max source node distance to have been determined.');
				}

				// we are 1 more node away from the max
				curDistance = maxSourceNodeDistance.distance + 1;
				parentNodeDistance = maxSourceNodeDistance;
			}

			// add the distance of the current node
			curNodeDistance = {
				distance: curDistance,
				node: curNode,
				parentNodeDistance
			};
			nodeDistances.set(curNode.getId(), curNodeDistance);

			// track the furthest node
			if (furthestNodeDistance == null || curDistance > furthestNodeDistance.distance) {
				furthestNodeDistance = curNodeDistance;
			}
		}

		// backtrack to figure out the longest path
		const path: Array<DirectedGraphNode<T, V>> = [];
		curNodeDistance = furthestNodeDistance;
		while (curNodeDistance != null) {
			path.unshift(curNodeDistance.node);
			curNodeDistance = curNodeDistance.parentNodeDistance;
		}

		return path;
	}

	isLinear(): boolean {
		/* Return true if the graph is linear. */
		// linear implies acyclic
		if (!this.isAcyclic()) {
			return false;
		}

		// we know its connected and acyclic, we just need to make sure every node only has at most 1 parent and 1 child
		return this.getNodes().every((node) => {
			return node.getSourceEdges().length <= 1 && node.getDestinationEdges().length <= 1;
		});
	}

	/**
	 * Do a topological sort given the current node, existing order and all visited nodes. These are not carried over
	 * because of prior sorts since there could be multiple root nodes.
	 */
	_topologicalSort(
		node: DirectedGraphNode<T, V>,
		topologicalOrder: TopologicalOrdering,
		visitedNodes: Set<DirectedGraphNode<T, V>>,
		walk: LinkedMap<string, DirectedGraphNode<T, V>> = new LinkedMap(true)
	): boolean {
		// not acyclic since we already saw this node in the current walk
		if (walk.containsKey(node.getId())) {
			return false;
		}

		// make sure we haven't traversed this node yet
		if (visitedNodes.has(node)) {
			return true;
		}

		// update the walk
		walk.put(node.getId(), node);

		// dfs and fail fast if we find a cycle
		const destinationEdges = node.getDestinationEdges();
		if (this._respectEdgeOrder) {
			destinationEdges.reverse();
		}
		for (const curEdge of Array.from(destinationEdges)) {
			if (!this._topologicalSort(curEdge.getDestination(), topologicalOrder, visitedNodes, walk)) {
				return false;
			}
		}

		// we've visited and backing out of the recursion so pop this step out of the walk
		visitedNodes.add(node);
		walk.pop();

		// add to the toplogical order and return
		topologicalOrder.unshift(node);
		return true;
	}
}
