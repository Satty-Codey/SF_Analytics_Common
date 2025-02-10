// @flow
import {useEffect, useRef} from 'react';

/**
 * Tracks the previous value of a prop or state variable.
 */
export default function usePrevious<T>(value: T): T | void {
	const ref = useRef<T | void>();
	useEffect(() => {
		ref.current = value;
	}, [value]);

	return ref.current;
}
