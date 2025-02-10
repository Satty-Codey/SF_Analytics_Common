// @flow
import {useRef} from 'react';

const SENTINEL = Symbol('lazy-ref-sentinel');

/**
 * Wrapper around useRef that avoids constructing new object instances for the default value every time the function is
 * invoked. Helpful when the default value is expensive to construct.
 */
export default function useLazyRef<T>(init: () => T): {current: T} {
	const ref = useRef<T | typeof SENTINEL>(SENTINEL);
	if (ref.current === SENTINEL) {
		ref.current = init();
	}

	// $FlowFixMe[incompatible-return]
	return ref;
}
