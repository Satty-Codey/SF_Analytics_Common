// @flow
import type {PipeableOperator} from 'Common/src/async/observable/Operators.js';

/**
 * Generic subscriber which handles completion, errors, and potentially other events.
 */
export interface Subscriber<T> {
	value(value: T): mixed;
	complete(): mixed;
	error(error: Error): mixed;
}

/**
 * Result of suscribing to an Observable.
 */
export interface Subscription {
	unsubscribe: () => void;
}

type UnsubscribeFn = () => mixed;
type PerformResult = UnsubscribeFn | void;

/**
 * Allow subscribing to (potentially multiple) results from an asynchronous operation.
 */
export default class Observable<T> {
	/**
	 * Helper for creating an Observable from a Promise for a single value that is available asynchronously.
	 */
	static wrap<A>(callback: () => Promise<A>): Observable<A> {
		return new Observable(async (subscriber) => {
			try {
				subscriber.value(await callback());
			} catch (error) {
				subscriber.error(error);
			}

			subscriber.complete();
		});
	}

	/**
	 * Create an Observable when the value is synchronously available. Avoids yielding the main thread when not necessary.
	 */
	static wrapSync<A>(value: A): Observable<A> {
		return new Observable((subscriber) => {
			subscriber.value(value);
			subscriber.complete();
		});
	}

	static merge<A>(observables: Array<Observable<A>>): Observable<A> {
		return new Observable((subscriber) => {
			const subscriptions = [];

			// $FlowFixMe[unused-promise] Added when enabling Flow lint for unused promises.
			Promise.all(
				observables.map((observable) => {
					return new Promise((resolve) => {
						subscriptions.push(
							observable.subscribe({
								// $FlowFixMe[method-unbinding] Added when upgrading to Flow 0.153.0
								value: subscriber.value.bind(subscriber),
								complete: resolve,
								// $FlowFixMe[method-unbinding] Added when upgrading to Flow 0.153.0
								error: subscriber.error.bind(subscriber)
							})
						);
					});
				})
			).then(() => {
				subscriber.complete();
			});

			return () => {
				subscriptions.forEach((subscription) => {
					subscription.unsubscribe();
				});
			};
		});
	}

	/**
	 * Return an Observable with no values.
	 */
	static empty<A>(): Observable<A> {
		return new Observable((subscriber) => {
			subscriber.complete();
		});
	}

	_perform: (Subscriber<T>) => PerformResult | Promise<PerformResult>;

	constructor(perform: (subscriber: Subscriber<T>) => PerformResult | Promise<PerformResult>) {
		this._perform = perform;
	}

	/**
	 * Start the execution of the Observable's work and subscribe to events.
	 */
	subscribe(subscriber: Subscriber<T>): Subscription {
		const result = this._perform(subscriber);

		let didUnsubscribe = false;

		return {
			unsubscribe() {
				// In many cases, unsubscribing multiple times probably indicates a bug. However, in cases where Observables
				// are cached, this can create a burden on consumers to need to know when it's safe to unsubscribe. For
				// this reason, we bail out silently here.
				if (didUnsubscribe) {
					return;
				}

				didUnsubscribe = true;

				// Handle perform returning either an unsubscribe callback, void, or a Promise for either of the above.
				if (result instanceof Promise) {
					// $FlowFixMe[unused-promise] Added when enabling Flow lint for unused promises.
					result.then((asyncResult) => asyncResult?.());
				} else {
					result?.();
				}
			}
		};
	}

	/**
	 * Pipe the current Observable's results through one or more pipeable operators and return the resulting Observable.
	 */
	pipe(...operators: Array<PipeableOperator<T>>): Observable<T> {
		// $FlowFixMe[incompatible-call] Added when enabling local type inference.
		return operators.reduce((observable, operator) => operator(observable), this);
	}
}
