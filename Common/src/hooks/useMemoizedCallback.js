// @flow
import {useCallback} from 'react';
import {memoize} from 'lodash';

// $FlowFixMe[unclear-type]
type AnyCallback = (...Array<any>) => mixed;

/**
 * Like useCallback but the returned callback itself is also memoized.
 */
export default function useMemoizedCallback<T: AnyCallback>(callback: T, dependencies: $ReadOnlyArray<mixed>): T {
	// ESLint complains because it can't statically know the dependencies of the provided callback. We rely on the
	// developer to provide the correct dependencies as an argument to the hook.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	return useCallback(memoize(callback), dependencies);
}
