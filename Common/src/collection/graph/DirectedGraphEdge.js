// @flow
import type DirectedGraphNode from 'Common/src/collection/graph/DirectedGraphNode.js';

/**
 * Edge in a graph.
 *
 */
export default class DirectedGraphEdge<T, V = void> {
	_source: DirectedGraphNode<T, V>;
	_destination: DirectedGraphNode<T, V>;
	_value: V;

	/**
	 * Connection is represented by a vector from source to destination node and an optional value associated to the edge.
	 */
	constructor(source: DirectedGraphNode<T, V>, destination: DirectedGraphNode<T, V>, value: V) {
		this._source = source;
		this._destination = destination;
		this._value = value;
	}

	getSource(): DirectedGraphNode<T, V> {
		return this._source;
	}

	getDestination(): DirectedGraphNode<T, V> {
		return this._destination;
	}

	getValue(): V {
		return this._value;
	}
}
