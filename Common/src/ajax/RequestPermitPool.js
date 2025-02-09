// @flow
import PermitPool from 'Common/src/async/PermitPool.js';
import type {Permit} from 'Common/src/async/PermitPool.js';
import Permission from 'Common/src/core/Permission.js';

/**
 * Manage async access to a limited number of slots for both high & low concurrency requests.
 */
export default class RequestPermitPool {
	_nextPermitId: number = 0;
	_issuedPermits: Map<number, Permit> = new Map();
	_lowConcurrencyPermitPool: PermitPool;
	_combinedPermitPool: PermitPool | void;

	constructor(lowConcurrencySize: number, highConcurrencySize: number) {
		this._lowConcurrencyPermitPool = new PermitPool(lowConcurrencySize);
		this._combinedPermitPool = Permission.has(Permission.ORG_HAS_HIGH_UI_REQUEST_CONCURRENCY)
			? new PermitPool(highConcurrencySize)
			: undefined;
	}

	async getPermit(isHighConcurrencyEligible?: boolean): Promise<Permit> {
		let lowConcurrencyPermit, highConcurrencyPermit;

		// lowConcurrencyPermitPool to enforce low concurrency limits & highConcurrencyPermit to enforce high concurrency limits
		if (!isHighConcurrencyEligible) {
			lowConcurrencyPermit = await this._lowConcurrencyPermitPool.getPermit();
		} else if (isHighConcurrencyEligible && this._combinedPermitPool == null) {
			// this was the case of W-13482641. shouldn't occur anymore, but just in case gater is acting up.
			lowConcurrencyPermit = await this._lowConcurrencyPermitPool.getPermit();
		}

		if (this._combinedPermitPool != null) {
			highConcurrencyPermit = await this._combinedPermitPool.getPermit();
		}

		// once we're done polling, we can issue a new permit that "wraps" the other permits
		const permitId = this._getNextPermitId();
		const permit = {
			id: permitId,
			release: () => {
				lowConcurrencyPermit?.release();
				highConcurrencyPermit?.release();
				this._issuedPermits.delete(permitId);
			}
		};

		this._issuedPermits.set(permitId, permit);

		return permit;
	}

	/**
	 * Flush all pending permit requests.
	 */
	async flush(): Promise<void> {
		while (this._issuedPermits.size > 0) {
			for (const curPermit of this._issuedPermits.values()) {
				// Release the current permit.
				curPermit.release();
			}
		}
	}

	_getNextPermitId(): number {
		return this._nextPermitId++;
	}
}
