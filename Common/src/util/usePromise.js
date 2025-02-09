// @flow
import {useEffect, useState} from 'react';

import Enum from 'Common/src/lang/Enum.js';

/**
 * Enum for various promise states
 */
export class PromiseStatus extends Enum<PromiseStatus> {
	static IDLE: PromiseStatus;
	static PENDING: PromiseStatus;
	static FULFILLED: PromiseStatus;
	static REJECTED: PromiseStatus;

	#apiValue: string;

	constructor(apiValue: string) {
		super();
		this.#apiValue = apiValue;
	}
}

PromiseStatus
	// prettier-ignore
	.add('IDLE', new PromiseStatus('idle'))
	.add('PENDING', new PromiseStatus('pending'))
	.add('FULFILLED', new PromiseStatus('fulfilled'))
	.add('REJECTED', new PromiseStatus('rejected'))
	.finish();

type PromiseState<T> = {status: PromiseStatus, value: T | null, error: Error | null};

/**
 * Never can remember the syntax for using an async useEffect. This is much better in that it leads the consumer to
 * handle the proper Promise states.
 */
export default function usePromise<T>(promise: () => Promise<T>, deps: Array<mixed>): PromiseState<T> {
	const [state, setState] = useState<PromiseState<T>>({
		status: PromiseStatus.IDLE,
		value: null,
		error: null
	});

	useEffect(() => {
		let mounted = true;
		// $FlowFixMe[unused-promise] Added when enabling Flow lint for unused promises.
		(async () => {
			setState({status: PromiseStatus.PENDING, value: null, error: null});
			try {
				const value = await promise();
				if (mounted) {
					setState({status: PromiseStatus.FULFILLED, value, error: null});
				}
			} catch (err) {
				if (mounted) {
					setState({status: PromiseStatus.REJECTED, value: null, error: err});
				}
			}
		})();
		return () => {
			mounted = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);

	return state;
}
