// @flow
import {startsWith, contains} from 'Common/src/util/StringUtil.js';

const VALID_URL_PROTOCOLS = ['http://', 'https://'];

const DATA_URL_PREFIX = 'data:image/png;base64,';

export type QueryParamValue = string | number | boolean | void | null;

/**
 * Utilities for dealing with URLs.
 */

/**
 * Append the given query string to the given URL, handling preexisting query strings.
 */
export function appendQueryString(source: string, queryString: string): string {
	if (!queryString) {
		return source;
	}

	return [source, queryString].join(contains(source, '?') ? '&' : '?');
}

/**
 * Appends or replaces the given parameter or value to the given URL and returns the new URL. Copies existing parameters
 * over to the new URL.
 */
export function appendParams(
	source: string,
	params: Map<string, QueryParamValue> | {[string]: QueryParamValue, ...}
): string {
	const pairs: Array<[string, QueryParamValue]> =
		params instanceof Map ? Array.from(params.entries()) : Object.keys(params).map((name) => [name, params[name]]);

	const queryParams = pairs.reduce((acc: Array<string>, [name, value]) => {
		if (value !== null && value !== undefined) {
			if (value !== '') {
				acc.push(`${name}=${encodeURIComponent(String(value))}`);
			} else {
				acc.push(name);
			}
		}

		return acc;
	}, []);

	return appendQueryString(source, queryParams.join('&'));
}

/**
 * Extract query params from the given URL.
 *
 * Note: We should make use of URL/URLSearchParam after dropping support for IE11.
 */
export function getQueryParams(url: string): Map<string, string> {
	// Handle relative URLs.
	if (url.startsWith('/')) {
		return getQueryParams(`http://localhost${url}`);
	}

	const queryParams = new Map<string, string>();

	let search = url.split('?')[1];
	if (!search) {
		return queryParams;
	}

	// ensure that the URL hash doesn't get considered
	search = search.split('#')[0];

	search.split('&').forEach((param) => {
		let [key, value] = param.split('=');

		// For query parameter value that has space encoded as '+' instead of '%20',
		// we need to pre-process before using decodeURIComponent as stated here:
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent
		value = value?.replace(/\+/g, ' ');

		return queryParams.set(key, value != null ? decodeURIComponent(value) : '');
	});

	return queryParams;
}

/**
 * Is the given URL absolute?
 */
export function isAbsoluteUrl(url: string): boolean {
	return VALID_URL_PROTOCOLS.some((prefix) => startsWith(url, prefix));
}

/**
 * Validate the given URL.
 */
export function isUrlValid(url: string, supportRelative: boolean): boolean {
	return Boolean(url) && ((startsWith(url, '/') && supportRelative) || isAbsoluteUrl(url));
}

/**
 * Extract the protocol + domain part of the URL.
 *
 * Example: "http://www.google.com?q=salesforce" => "http://www.google.com"
 *
 * Note: We should make use of URL to do this after dropping support for IE11.
 */
export function getBaseUrl(url: string): string {
	const startFrom = url.indexOf('//') + 2;

	let idx = url.indexOf('/', startFrom);
	if (idx === -1) {
		idx = url.indexOf('?', startFrom);
	}

	return idx !== -1 ? url.substring(0, idx) : url;
}

/**
 * Create a data URL from the given data.
 */
export function getDataUrlFromData(data: string): string {
	if (data) {
		return DATA_URL_PREFIX + data;
	} else {
		return data;
	}
}

/**
 * Extract the MIME type from the given data URL.
 */
export function getMimeTypeFromDataUrl(dataUrl: string): string {
	if (dataUrl) {
		const match = dataUrl.match(':(.*);');
		if (!match) {
			throw new Error('Expected to find MIME type in URL.');
		}

		return match[1];
	} else {
		return dataUrl;
	}
}

/**
 * Extract the data from the given data URL, dropping the prefix.
 */
export function getDataFromDataUrl(dataUrl: string): string {
	if (dataUrl) {
		return dataUrl.substring(DATA_URL_PREFIX.length);
	} else {
		return dataUrl;
	}
}

/**
 * Convert the given data URL to a Blob.
 */
export function convertDataURItoBlob(dataUrl: string, optionalMimeExtension?: string): Blob {
	const data = atob(getDataFromDataUrl(dataUrl));

	const arr8bit = new Uint8Array(data.length);
	for (let i = 0; i < data.length; i++) {
		arr8bit[i] = data.charCodeAt(i);
	}

	let mimeType = getMimeTypeFromDataUrl(dataUrl);
	if (optionalMimeExtension) {
		mimeType += optionalMimeExtension;
	}

	return new Blob([arr8bit], {encoding: 'ISO-8859-1', type: mimeType});
}
