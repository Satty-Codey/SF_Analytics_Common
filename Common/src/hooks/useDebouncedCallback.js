// @flow
import {useEffect, useCallback} from 'react';
import {debounce} from 'lodash';

// $FlowFixMe[unclear-type]
type AnyCallback = (...Array<any>) => mixed;

/**
 * Enhanced useCallback with debounce functionality.
 */
export default function useDebouncedCallback<T: AnyCallback>(
	callback: T,
	time: number,
	dependencies: $ReadOnlyArray<mixed>
): T {
	// ESLint complains because it can't statically know the dependencies of the provided callback. We rely on the
	// developer to provide the correct dependencies as an argument to the hook.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const debounced = useCallback(debounce(callback, time), dependencies);

	useEffect(() => {
		return () => debounced.cancel();
	}, [debounced]);

	return debounced;
}
