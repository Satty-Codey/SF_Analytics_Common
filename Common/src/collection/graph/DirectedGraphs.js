// @flow
import LinkedMap from 'Common/src/collection/LinkedMap.js';
import BaseDirectedGraph from 'Common/src/collection/graph/BaseDirectedGraph.js';
import DirectedGraphNode from 'Common/src/collection/graph/DirectedGraphNode.js';
import DirectedGraph from 'Common/src/collection/graph/DirectedGraph.js';
import type DirectedGraphEdge from 'Common/src/collection/graph/DirectedGraphEdge.js';

/**
 * Mutable bag of nodes representing a single or multiple directed graphs with the ability to cluster into directed graphs.
 *
 */
export default class DirectedGraphs<T, V = void> extends BaseDirectedGraph<T, V> {
	_respectEdgeOrder: boolean;
	_mutation: number;
	_graphs: ?Array<DirectedGraph<T, V>>;

	constructor(respectEdgeOrder: boolean = false) {
		// Construct with no nodes, use addNode and edge to mutate.
		super();

		this._respectEdgeOrder = respectEdgeOrder;
		this._mutation = 0;
	}

	/* Return the mutation count. */
	getMutation(): number {
		return this._mutation;
	}

	/* Create and return a new node with the given id. */
	addNode(id: string, value: T): DirectedGraphNode<T, V> {
		const node = new DirectedGraphNode(id, value);
		// $FlowFixMe[incompatible-call] Added when enabling local type inference.
		this._nodes.put(node.getId(), node);

		this._didMutate();
		// $FlowFixMe[incompatible-return] Added when enabling local type inference.
		return node;
	}

	/**
	 * Remove the node and all edges to the node with the given id. The node will be returned but all edges will have
	 * been removed.
	 */
	deleteNode(id: string): DirectedGraphNode<T, V> {
		const node = this.getNode(id);

		// unlink all sources and destinations and delete
		node.unlinkAll();
		this._nodes.remove(id);
		this._didMutate();
		return node;
	}

	/**
	 * Create and return an edge between an existing source and destination node by ids with an optional edge value.
	 */
	addEdge(
		sourceId: string,
		destinationId: string,
		edgeValue: V,
		throwIfExists: boolean = false
	): DirectedGraphEdge<T, V> {
		const source = this._nodes.get(sourceId);
		if (!source) {
			throw new Error("Can't find source node.");
		}
		const destination = this._nodes.get(destinationId);
		if (!destination) {
			throw new Error("Can't find destination node.");
		}

		this._didMutate();
		return destination.addSource(source, edgeValue, throwIfExists);
	}

	/* If there is an edge between the source and destination node. */
	hasEdge(sourceId: string, destinationId: string): boolean {
		const source = this._nodes.get(sourceId);

		return !!source && source.hasDestination(destinationId);
	}

	/* Delete the edge between the source and destination nodes. */
	deleteEdge(sourceId: string, destinationId: string): DirectedGraphEdge<T, V> {
		const source = this._nodes.get(sourceId);
		if (source == null) {
			throw new Error("Can't find source node.");
		}
		const destination = this._nodes.get(destinationId);
		if (destination == null) {
			throw new Error("Can't find destination node.");
		}

		this._didMutate();

		const edge = destination.unlinkSource(source);
		if (!edge) {
			throw new Error(`No edge found between ${sourceId} and ${destinationId}.`);
		}

		return edge;
	}

	/* Get an array of directed graphs in this graph. These graphs will be cached if not changed. */
	getGraphs(): Array<DirectedGraph<T, V>> {
		if (!this._graphs) {
			// track unvisted nodes since the graph may be disjoint
			const unvistedNodes = new Set<DirectedGraphNode<T, V>>();
			for (const curNode of this.getNodes()) {
				unvistedNodes.add(curNode);
			}

			// group nodes into their graphs
			const graphsNodes = [];
			for (const curNode of unvistedNodes) {
				graphsNodes.push(this._traverse(curNode, unvistedNodes));
			}

			// build directed graphs from each group of graphs
			this._graphs = graphsNodes.map((graphNodes) => new DirectedGraph(graphNodes, this._respectEdgeOrder));
		}

		return this._graphs;
	}

	/* Return an entirely new copy of the this graph and its nodes. Node values are not copied. */
	copy(): DirectedGraphs<T, V> {
		const graphCopy = new DirectedGraphs<T, _>(this._respectEdgeOrder);

		const nodes = this.getNodes();
		for (const curNode of nodes) {
			graphCopy.addNode(curNode.getId(), curNode.getValue());
		}
		for (const curNode of nodes) {
			for (const curEdge of curNode.getDestinationEdges()) {
				// $FlowFixMe[incompatible-call] Added when enabling local type inference.
				graphCopy.addEdge(curNode.getId(), curEdge.getDestination().getId(), curEdge.getValue());
			}
		}

		// $FlowFixMe[incompatible-return] Added when enabling local type inference.
		return graphCopy;
	}

	_didMutate(): void {
		delete this._graphs;
		this._mutation++;
	}

	/**
	 * Traverse the graph starting from the given node. This will traverse the graph in both directions to get all nodes
	 * in the directed graph since it might have multiple roots. Provide a set of unvisitedNodes to unmark once visited.
	 */
	_traverse(
		node: DirectedGraphNode<T, V>,
		unvisitedNodes: Set<DirectedGraphNode<T, V>>,
		graphNodes: LinkedMap<string, DirectedGraphNode<T, V>> = new LinkedMap(true)
	): LinkedMap<string, DirectedGraphNode<T, V>> {
		// already visited node, back out
		if (graphNodes.containsKey(node.getId())) {
			return graphNodes;
		}

		// remove from unvisited nodes
		unvisitedNodes.delete(node);

		// mark current node as visited
		graphNodes.put(node.getId(), node);

		// spider sources and destinations
		for (const curEdge of node.getSourceEdges()) {
			this._traverse(curEdge.getSource(), unvisitedNodes, graphNodes);
		}
		for (const curEdge of node.getDestinationEdges()) {
			this._traverse(curEdge.getDestination(), unvisitedNodes, graphNodes);
		}

		return graphNodes;
	}
}
