// @flow
import {sortBy, castArray} from 'lodash';

import LinkedMap from 'Common/src/collection/LinkedMap.js';
import type DirectedGraphNode from 'Common/src/collection/graph/DirectedGraphNode.js';
import type DirectedGraphEdge from 'Common/src/collection/graph/DirectedGraphEdge.js';

export type NodeMap<T, V> = LinkedMap<string, DirectedGraphNode<T, V>>;

type FilterEdges<T, V> = (Array<DirectedGraphEdge<T, V>>) => Array<DirectedGraphEdge<T, V>>;

export type TraversalOptions<T, V> = {
	filterEdges?: FilterEdges<T, V>
};

/**
 * Immutable bag of directed graph nodes with some common graph stuff.
 *
 */
export default class BaseDirectedGraph<T, V = void> {
	_nodes: NodeMap<T, V>;

	constructor(nodes: NodeMap<T, V> = new LinkedMap(true)) {
		this._nodes = nodes;
	}

	getNode(id: string): DirectedGraphNode<T, V> {
		const node = this._nodes.get(id);

		if (!node) {
			throw new Error(`No node found with id "${id}".`);
		}

		return node;
	}

	hasNode(id: string): boolean {
		return this._nodes.containsKey(id);
	}

	getNodes(): Array<DirectedGraphNode<T, V>> {
		return this._nodes.getValues();
	}

	getNumNodes(): number {
		return this._nodes.size();
	}

	/* Get all root nodes. */
	getRootNodes(): Array<DirectedGraphNode<T, V>> {
		return this.getNodes().filter((node) => node.isRoot());
	}

	/* Get all leaf nodes. */
	getLeafNodes(): Array<DirectedGraphNode<T, V>> {
		return this.getNodes().filter((node) => node.isLeaf());
	}

	/**
	 * Find the node with the least number of sources, if multiple with same number of sources, this will return the first.
	 */
	getNodeWithLeastSources(): ?DirectedGraphNode<T, V> {
		let leastNode;
		for (const curNode of this.getNodes()) {
			if (!leastNode || curNode.getNumSources() < leastNode.getNumSources()) {
				leastNode = curNode;
			}
		}

		return leastNode;
	}

	/* Return the nodes in sorted ascending order by number of sources. */
	getNodesByNumSources(): Array<DirectedGraphNode<T, V>> {
		return sortBy(this.getNodes(), (node) => node.getNumSources());
	}

	/* Return the ancestor nodes for a single or list of node ids. */
	getAncestors(ids: string | Array<string>, options: TraversalOptions<T, V> = {}): Array<DirectedGraphNode<T, V>> {
		return this._getAncestorsOrDescendants(ids, options, true);
	}

	/* Return the descendant nodes for a single or list of node ids. */
	getDescendants(ids: string | Array<string>, options: TraversalOptions<T, V> = {}): Array<DirectedGraphNode<T, V>> {
		return this._getAncestorsOrDescendants(ids, options, false);
	}

	/* Return all edges in the graph. */
	getEdges(): Array<DirectedGraphNode<T, V>> {
		const edges: Array<DirectedGraphNode<T, V>> = [];
		for (const curNode of this.getNodes()) {
			// $FlowFixMe[method-unbinding] Added when upgrading to Flow 0.153.0
			edges.push.apply(edges, curNode.getDestinationEdges());
		}

		return edges;
	}

	/* Get ancestors or descendants since same code. */
	_getAncestorsOrDescendants(
		idOrIds: string | Array<string>,
		{filterEdges = (edges: Array<DirectedGraphEdge<T, V>>) => edges}: TraversalOptions<T, V>,
		isAncestors: boolean
	): Array<DirectedGraphNode<T, V>> {
		const ids = castArray(idOrIds);

		// Ignore ids we start traversals from as well as any extras specified.
		const ignoreNodes = new Set(ids);
		const resultNodes = new Map<string, DirectedGraphNode<T, V>>();

		// Go through all the ids and find descendants or ancestors, making sure we never traverse the same node twice.
		for (const curNodeId of ids) {
			const curNode = this.getNode(curNodeId);

			for (const [nodeId, node] of this._traverseGraph(curNode, isAncestors, filterEdges, ignoreNodes)) {
				ignoreNodes.add(nodeId);
				resultNodes.set(nodeId, node);
			}
		}

		return Array.from(resultNodes.values());
	}

	/**
	 * Traverse the graph starting with the given node, providing a getter prefix which will be used to get the right
	 * edges and nodes to define the traversal direction. Optionally start with a map of nodes to ignore and a set of
	 * nodes already seen, ignored nodes will not be returned as results. Also optionally filter out the list of edges to
	 * traverse at each step.
	 */
	_traverseGraph(
		node: DirectedGraphNode<T, V>,
		isAncestors: boolean,
		filterEdges: FilterEdges<T, V>,
		ignoreNodes: Set<string> = new Set(),
		seenNodes: Map<string, DirectedGraphNode<T, V>> = new Map()
	): Map<string, DirectedGraphNode<T, V>> {
		const edges = filterEdges(isAncestors ? node.getSourceEdges() : node.getDestinationEdges());

		for (const curEdge of edges) {
			// Get the node and skip it if we should ignore it or already seen.
			const curNode = isAncestors ? curEdge.getSource() : curEdge.getDestination();

			if (ignoreNodes.has(curNode.getId()) || seenNodes.has(curNode.getId())) {
				continue;
			}

			seenNodes.set(curNode.getId(), curNode);
			this._traverseGraph(curNode, isAncestors, filterEdges, ignoreNodes, seenNodes);
		}

		return seenNodes;
	}
}
