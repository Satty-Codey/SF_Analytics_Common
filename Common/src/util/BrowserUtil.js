// @flow

/**
 * Browser identification util.
 *
 * Feature detection is the preferred approach for many things here.
 */

/**
 * Check if the given string is in the user agent. This is pretty hoaky given no word boundaries.
 */
function isInUserAgent(string: string): boolean {
	return navigator.userAgent.toLowerCase().indexOf(string) > -1;
}

/**
 * Returns true if the browser is running on a Mac.
 */
export function isMac(): boolean {
	return isInUserAgent('macintosh');
}

/**
 * Returns true if the browser is running on an iPhone.
 */
export function isIOS(): boolean {
	return isInUserAgent('iphone');
}

/**
 * Returns true if the browser is Chrome.
 */
export function isChrome(): boolean {
	return isInUserAgent('chrome');
}

/**
 * Returns true if the browser is Firefox.
 */
export function isFirefox(): boolean {
	return isInUserAgent('firefox');
}

/**
 * https://stackoverflow.com/a/23522755
 * Returns true if the browser is Safari.
 */
export function isSafari(): boolean {
	return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

/**
 * Returns true if the browser is Edge Chromium.
 * NOTE: Edge Chromium user agent is just 'edg' while Edge Legacy user agent is 'edge'.
 */
export function isEdgeChromium(): boolean {
	return isInUserAgent('edg') && !isInUserAgent('edge');
}
