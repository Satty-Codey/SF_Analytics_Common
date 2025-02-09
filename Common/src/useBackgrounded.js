// @flow
import {useState, useCallback, useEffect} from 'react';

import * as DomUtil from 'Common/src/util/DomUtil.js';

/**
 * Hook to properly handle changes in page visibility. Considers both browser tab visibility and DOM visibility, the latter
 * of which applies when in e.g. background application tabs.
 */
export default function useBackgrounded(callback: (newIsInBackground: boolean) => mixed): boolean {
	const [isBackgrounded, setBackgrounded] = useState(
		document.hidden ||
			!DomUtil.isVisible(
				// $FlowFixMe[incompatible-cast]
				(document.body: HTMLElement)
			)
	);

	const onBackgroundedChange = useCallback(
		(isVisible: boolean) => {
			setBackgrounded(!isVisible);
			callback(!isVisible);
		},
		[callback]
	);

	// Handle changes in browser tab visibility.
	useEffect(() => {
		const onVisibilityChange = () => {
			onBackgroundedChange(!document.hidden);
		};

		document.addEventListener('visibilitychange', onVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	}, [onBackgroundedChange]);

	// Handle changes in DOM visibility.
	useEffect(() => {
		const observer = new IntersectionObserver((entries) => {
			onBackgroundedChange(entries.some((entry) => entry.isIntersecting));
		});

		observer.observe(
			// $FlowFixMe[incompatible-cast]
			(document.body: HTMLElement)
		);

		return () => {
			observer.disconnect();
		};
	}, [onBackgroundedChange]);

	return isBackgrounded;
}
