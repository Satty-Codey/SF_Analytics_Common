// @flow
import {useEffect, useState} from 'react';

export type Rectangle = {
	+bottom: number,
	+height: number,
	+left: number,
	+right: number,
	+top: number,
	+width: number,
	+x: number,
	+y: number,
	...
};
/**
 * Takes a reference to a dom element. If that dom element resizes its new
 * rect dimensions are returned.
 */
export default function useResizeObserver(ref: {current: HTMLElement | null}): Rectangle {
	const [sizes, setSizes] = useState<Rectangle>({
		bottom: 0,
		height: 0,
		left: 0,
		right: 0,
		top: 0,
		width: 0,
		x: 0,
		y: 0
	});

	const [observer] = useState(
		() =>
			new ResizeObserver((entries) => {
				if (entries.length === 0) {
					return;
				}

				const [entry] = entries;
				// $FlowFixMe[incompatible-call] Added when upgrading to Flow 0.153.0
				setSizes(entry.contentRect);
			})
	);

	useEffect(() => {
		if (ref.current) {
			observer.observe(ref.current);
		}
		// This is like a component unmount so the observer doesn't leak.
		return () => observer.disconnect();
	}, [ref, observer]);

	return sizes;
}
