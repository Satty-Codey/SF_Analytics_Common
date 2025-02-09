// @flow
import {range} from 'lodash';

import RequestPermitPool from 'Common/src/ajax/RequestPermitPool.js';

/**
 * Manages access to a limited number of fixed permits, issuing permit IDs in a round-robin fashion.
 */
export default class RoundRobinRequestPermitPool extends RequestPermitPool {
	_permitPoolSize: number;

	constructor(lowConcurrencySize: number, highConcurrencySize: number) {
		super(lowConcurrencySize, highConcurrencySize);

		this._permitPoolSize = Math.max(lowConcurrencySize, highConcurrencySize);
	}

	/**
	 * Returns the next permit ID. If round-robin mode is enabled, retrieves the next available permit ID
	 * from the fixed set of permits or returns -1 if no IDs are available.
	 */
	_getNextPermitId(): number {
		const issuedPermitIds = new Set(this._issuedPermits.keys());
		const availablePermitIds = range(this._permitPoolSize).filter((id) => !issuedPermitIds.has(id));

		return availablePermitIds.length > 0 ? availablePermitIds[0] : -1;
	}
}
