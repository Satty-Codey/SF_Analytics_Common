// @flow

/**
 * Utils for normalizing the full screen API across browsers.
 */

/**
 * Are we currently in full screen mode?
 */
export function isFullScreen(): boolean {
	const fullscreenElement =
		document.fullscreenElement ??
		// $FlowFixMe[prop-missing]
		document.mozFullScreenElement ??
		// $FlowFixMe[prop-missing]
		document.webkitFullscreenElement ??
		// $FlowFixMe[prop-missing]
		document.msFullscreenElement;

	return fullscreenElement != null;
}

/**
 * Is full screen mode supported by browser?
 */
export function isFullScreenEnabled(): boolean {
	return !!(
		document.fullscreenEnabled ||
		// $FlowFixMe[prop-missing]
		document.webkitFullscreenEnabled ||
		// $FlowFixMe[prop-missing]
		document.mozFullScreenEnabled ||
		// $FlowFixMe[prop-missing]
		document.msFullscreenEnabled
	);
}

/**
 * Enter full screen mode.
 */
export function enterFullScreen(): ?Promise<void> {
	if (isFullScreen() || document.documentElement === null || !isFullScreenEnabled()) {
		return;
	}

	// $FlowFixMe[method-unbinding] Added when upgrading to Flow 0.153.0
	if (document.documentElement.requestFullscreen != null) {
		return document.documentElement.requestFullscreen();
	} else if (
		// $FlowFixMe[prop-missing]
		document.documentElement.msRequestFullscreen != null
	) {
		// $FlowFixMe[not-a-function]
		return document.documentElement.msRequestFullscreen();
	} else if (
		// $FlowFixMe[prop-missing]
		document.documentElement.mozRequestFullScreen != null
	) {
		// $FlowFixMe[not-a-function]
		return document.documentElement.mozRequestFullScreen();
	} else if (
		// $FlowFixMe[prop-missing]
		document.documentElement.webkitRequestFullscreen != null
	) {
		// $FlowFixMe[not-a-function]
		return document.documentElement.webkitRequestFullscreen(
			// $FlowFixMe[prop-missing]
			Element.ALLOW_KEYBOARD_INPUT
		);
	}
}

/**
 * Exit full screen mode.
 */
export function exitFullScreen(): void {
	// $FlowFixMe[method-unbinding] Added when upgrading to Flow 0.153.0
	if (document.exitFullscreen) {
		// $FlowFixMe[unused-promise] Added when enabling Flow lint for unused promises.
		document.exitFullscreen();
	} else if (
		// $FlowFixMe[prop-missing]
		document.msExitFullscreen
	) {
		// $FlowFixMe[not-a-function]
		document.msExitFullscreen();
	} else if (
		// $FlowFixMe[prop-missing]
		document.mozCancelFullScreen
	) {
		// $FlowFixMe[not-a-function]
		document.mozCancelFullScreen();
	} else if (
		// $FlowFixMe[prop-missing]
		document.webkitExitFullscreen
	) {
		// $FlowFixMe[not-a-function]
		document.webkitExitFullscreen();
	}
}

/**
 * Add a listener for fullscreen changes.
 */
export function addFullScreenChangeListener(callback: () => mixed): void {
	if (document.fullscreenEnabled) {
		document.addEventListener('fullscreenchange', callback);
	} else if (
		// $FlowFixMe[prop-missing]
		document.msFullScreenEnabled
	) {
		document.addEventListener('MSFullscreenChange', callback);
	} else if (
		// $FlowFixMe[prop-missing]
		document.mozFullScreenEnabled
	) {
		document.addEventListener('mozfullscreenchange', callback);
	} else if (
		// $FlowFixMe[prop-missing]
		document.webkitFullscreenEnabled
	) {
		document.addEventListener('webkitfullscreenchange', callback);
	}
}

/**
 * Remove a listener for fullscreen changes.
 */
export function removeFullScreenChangeListener(callback: () => mixed): void {
	if (document.fullscreenEnabled) {
		document.removeEventListener('fullscreenchange', callback);
	} else if (
		// $FlowFixMe[prop-missing]
		document.msFullScreenEnabled
	) {
		document.removeEventListener('MSFullscreenChange', callback);
	} else if (
		// $FlowFixMe[prop-missing]
		document.mozFullScreenEnabled
	) {
		document.removeEventListener('mozfullscreenchange', callback);
	} else if (
		// $FlowFixMe[prop-missing]
		document.webkitFullscreenEnabled
	) {
		document.removeEventListener('webkitfullscreenchange', callback);
	}
}
