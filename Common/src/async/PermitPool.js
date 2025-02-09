// @flow
import Queue from 'Common/src/collection/Queue.js';
import ES6PromiseDeferred from 'Common/src/util/ES6PromiseDeferred.coffee';

/**
 * Once granted by the permit pool, represents access to one of a limited number of async slots. Permit should be released
 * once done using the slot.
 */
export type Permit = {
	+id: number,
	+release: () => mixed
};

/**
 * Manage async access to a limited number of slots.
 *
 * In the future, we might be able to replace this with https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API.
 */
export default class PermitPool {
	_size: number;
	_nextPermitId: number = 0;
	_issuedPermits: Map<number, Permit> = new Map();
	_requestedPermits: Queue<typeof ES6PromiseDeferred> = new Queue();

	constructor(size: number) {
		this._size = size;
	}

	async getPermit(): Promise<Permit> {
		// If we're already issued the max number of permits, add the request to the queue and wait for it to be fulfilled.
		if (this._issuedPermits.size >= this._size) {
			const deferred = new ES6PromiseDeferred();
			this._requestedPermits.add(deferred);

			await deferred.promise();
		}

		const permitId = this._nextPermitId++;

		// Once the permit is released, remove it from the list of issued permits and release the next requested
		// permit if any requests are pending.
		const permit = {
			id: permitId,
			release: () => {
				this._issuedPermits.delete(permitId);
				this._requestedPermits.poll()?.resolve();
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
				const nextRequest = this._requestedPermits.peek()[0];

				// Release the current permit.
				curPermit.release();

				// If a permit was waiting on that slot, wait for it to be issued before continuing so that we flush it
				// as well.
				if (nextRequest != null) {
					await nextRequest.promise();
				}
			}
		}
	}
}
