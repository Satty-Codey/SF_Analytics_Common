// @flow

/**
 * Encode/decode between multi-byte Unicode characters and UTF-8 multiple single-byte character encoding
 * (c) Chris Veness 2002-2010
 */

/**
 * Encode.
 */
export function encodeUtf8(strUni: string): string {
	const strUtf = strUni.replace(/[\u0080-\u07ff]/g, function (c) {
		const cc = c.charCodeAt(0);
		return String.fromCharCode(0xc0 | (cc >> 6), 0x80 | (cc & 0x3f));
	});

	return strUtf.replace(/[\u0800-\uffff]/g, function (c) {
		const cc = c.charCodeAt(0);
		return String.fromCharCode(0xe0 | (cc >> 12), 0x80 | ((cc >> 6) & 0x3f), 0x80 | (cc & 0x3f));
	});
}

/**
 * Decode.
 */
export function decodeUtf8(strUtf: string): string {
	const strUni = strUtf.replace(/[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g, function (c) {
		const cc = ((c.charCodeAt(0) & 0x0f) << 12) | ((c.charCodeAt(1) & 0x3f) << 6) | (c.charCodeAt(2) & 0x3f);
		return String.fromCharCode(cc);
	});

	return strUni.replace(/[\u00c0-\u00df][\u0080-\u00bf]/g, function (c) {
		const cc = ((c.charCodeAt(0) & 0x1f) << 6) | (c.charCodeAt(1) & 0x3f);
		return String.fromCharCode(cc);
	});
}
