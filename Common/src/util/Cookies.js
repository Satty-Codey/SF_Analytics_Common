// @flow
import {startsWith} from 'Common/src/util/StringUtil.js';

const MILLIS_PER_HOUR = 60 * 60 * 1000;

/**
 * The cookie jar.
 *
 */

/**
 * Get the first cookie by the given name. There may be multiple cookies from subpaths but the closest subpath
 * should be first.
 */
export function getCookie(name: string): string | null {
	for (let curCookie of document.cookie.split(';')) {
		curCookie = curCookie.trim();
		if (startsWith(curCookie, name + '=')) {
			return curCookie.substring(name.length + 1);
		}
	}

	return null;
}

/**
 * Set the value for the cookie of the given name. Provide optional path and expiration in hours from now. The default
 * path will be the root and the default expiration will be the browser session. IE11 does not support blank cookie
 * params, they must be omitted if not being specified. max-age should take priority over expires (unless browser
 * does not support max-age)
 */
export function setCookie(name: string, value: string | null, path: ?string, expiresHours?: number): void {
	let date, time;
	// $FlowFixMe[sketchy-null-number]
	if (expiresHours) {
		time = expiresHours * MILLIS_PER_HOUR;
	}
	// $FlowFixMe[sketchy-null-number]
	if (expiresHours) {
		// $FlowFixMe[unsafe-addition]
		date = new Date(new Date().getTime() + time);
	}

	document.cookie =
		`${name}=${value != null ? value : ''}; ` +
		// $FlowFixMe[sketchy-null-number]
		`${time ? `max-age=${time};` : ''} ` +
		`${date ? `expires=${date.toUTCString()};` : ''}` +
		`path=${path != null ? path : '/'}`;
}

/**
 * Clear the cookie by setting its value to null and expiration in past.
 */
export function clearCookie(name: string, path: ?string): void {
	setCookie(name, null, path, -1);
}
