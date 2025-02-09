// @flow
import LinkedMap from 'Common/src/collection/LinkedMap.js';
import DirectedGraphEdge from 'Common/src/collection/graph/DirectedGraphEdge.js';

/**
 * Node in a directed graph.
 *
 */
export default class DirectedGraphNode<T, V = void> {
	_id: string;
	_value: T;

	// internally stored as a doubly linked graph, sources and destinations are all stored as DirectedGraphEdges
	_sources: LinkedMap<string, DirectedGraphEdge<T, V>> = new LinkedMap(true);
	_destinations: LinkedMap<string, DirectedGraphEdge<T, V>> = new LinkedMap(true);

	/* Construct with an id unique to the graph and optional value. */
	constructor(id: string, value: T) {
		this._id = id;
		this._value = value;
	}

	getId(): string {
		return this._id;
	}

	getValue(): T {
		return this._value;
	}

	isRoot(): boolean {
		return this.getNumSources() === 0;
	}

	isLeaf(): boolean {
		return this.getNumDestinations() === 0;
	}

	getNumSources(): number {
		return this._sources.size();
	}

	/* Return true if the node or node id is a source. */
	hasSource(node: DirectedGraphNode<T, V> | string | void): boolean {
		if (node) {
			return this._sources.containsKey(node instanceof DirectedGraphNode ? node.getId() : node);
		} else {
			return !this._sources.isEmpty();
		}
	}

	/* Get the edge for the given source if it exists. */
	getSourceEdge(id: string): ?DirectedGraphEdge<T, V> {
		return this._sources.get(id);
	}

	/* Get all source edges as an array. */
	getSourceEdges(): Array<DirectedGraphEdge<T, V>> {
		return this._sources.getValues();
	}

	getNumDestinations(): number {
		return this._destinations.size();
	}

	hasDestinations(): boolean {
		return !this._destinations.isEmpty();
	}

	/* Return true if the node or node id is a destination. */
	hasDestination(node: DirectedGraphNode<T, V> | string): boolean {
		return this._destinations.containsKey(node instanceof DirectedGraphNode ? node.getId() : node);
	}

	/* Get the edge for the given destination if it exists. */
	getDestinationEdge(id: string): ?DirectedGraphEdge<T, V> {
		return this._destinations.get(id);
	}

	/* Get all destination edges as an array. */
	getDestinationEdges(): Array<DirectedGraphEdge<T, V>> {
		return this._destinations.getValues();
	}

	/* Add and return an edge between the given source node to this node. */
	addSource(sourceNode: DirectedGraphNode<T, V>, value: V, throwIfExists: boolean = true): DirectedGraphEdge<T, V> {
		const sourceEdge = this.getSourceEdge(sourceNode.getId());

		// make sure the source doesn't already exist
		if (sourceEdge) {
			if (throwIfExists) {
				throw new Error('Source already exists.');
			} else {
				return sourceEdge;
			}
		}

		// doubly link the source node and this node
		const edge = new DirectedGraphEdge(sourceNode, this, value);
		this._sources.put(sourceNode.getId(), edge);
		sourceNode._destinations.put(this.getId(), edge);

		return edge;
	}

	/**
	 * Remove and return the edge between the source node to this node. Optionally throw an error if the edge does not
	 * exist otherwise return true if edge was removed.
	 */
	unlinkSource(sourceNode: DirectedGraphNode<T, V>, throwIfNone: boolean = false): ?DirectedGraphEdge<T, V> {
		// see if the edge exists
		if (!this._sources.containsKey(sourceNode.getId())) {
			if (throwIfNone) {
				throw new Error(`Unknown source ${sourceNode.getId()}.`);
			}
			return;
		}

		// remove the references
		const edge = this._sources.get(sourceNode.getId());
		this._sources.remove(sourceNode.getId());
		sourceNode._destinations.remove(this.getId());

		return edge;
	}

	/* Add an edge between this node to the destination node. See addSource. */
	addDestination(
		destinationNode: DirectedGraphNode<T, V>,
		value: V,
		throwIfExists: boolean = true
	): DirectedGraphEdge<T, V> {
		return destinationNode.addSource(this, value, throwIfExists);
	}

	/* Remove the edge between this node to the destination node. See unlinkSource. */
	unlinkDestination(destinationNode: DirectedGraphNode<T, V>): ?DirectedGraphEdge<T, V> {
		return destinationNode.unlinkSource(this);
	}

	/* Unlink from all sources and destinations. */
	unlinkAll(): void {
		this.getSourceEdges().forEach((sourceEdge) => {
			this.unlinkSource(sourceEdge.getSource());
		});
		this.getDestinationEdges().forEach((destinationEdge) => {
			this.unlinkDestination(destinationEdge.getDestination());
		});
	}

	/* Return true if a node doesn't have a destination or source. */
	isIsolated(): boolean {
		return !(this.hasDestinations() || this.hasSource());
	}
}
