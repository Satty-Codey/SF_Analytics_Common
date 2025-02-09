// @flow

// See http://www.salesforce.com/us/developer/docs/chatterapi/ Response body encoding
const HTML_ENTITY_MAP = {
	decodeMap: {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#39;': "'",
		'&#92;': '\\'
	},
	encodeMap: {}
};

for (const key of Object.keys(HTML_ENTITY_MAP.decodeMap)) {
	const value = HTML_ENTITY_MAP.decodeMap[key];

	if (value !== '\\') {
		// $FlowFixMe[prop-missing] Added when making empty objects exact by default.
		HTML_ENTITY_MAP.encodeMap[value] = key;
	} else {
		// $FlowFixMe[prop-missing] Added when upgrading to Flow 0.190.1
		HTML_ENTITY_MAP.encodeMap[`\\${value}`] = key;
	}
}

/**
 * Utils for various string methods.
 *
 * @author gkiel, zuye.zheng
 */

/**
 * Return true if the value string contains the given string.
 */
export function contains(haystack: string, needle: string): boolean {
	return haystack.indexOf(needle) >= 0;
}

/**
 * Return true if the value string begins with the given string.
 */
export function startsWith(haystack: string, needle: string): boolean {
	return haystack.indexOf(needle) === 0;
}

/**
 * Return true if the value string ends with the given string.
 */
export function endsWith(haystack: string, needle: string): boolean {
	const indexOf = haystack.lastIndexOf(needle);
	if (indexOf < 0) {
		return false;
	} else {
		return haystack.length - needle.length === indexOf;
	}
}

/**
 * Return the string with leading white space characters removed from the given string.
 */
export function leftTrim(value: string): string {
	return value.replace(/^\s+/, '');
}

/**
 * Compares two string values and treats undefined, null, and empty string as all equal.
 */
export function isEqual(first: ?string, second: ?string): boolean {
	return (!first && !second) || first === second;
}

/**
 * Capitalize the first character of the input. Optionally lower case the rest of the string.
 */
export function capitalizeFirst(input: string, lowerCaseRest: boolean = false): string {
	let rest = input.substr(1);
	if (lowerCaseRest) {
		rest = rest.toLowerCase();
	}
	return input.charAt(0).toUpperCase() + rest;
}

/**
 * Return a string with the first N characters as upper case. If the string is shorter than N, all will be upper case.
 */
export function toUpperCaseFirstN(value: string, firstN: number = 1): string {
	return value.substr(0, firstN).toUpperCase() + value.substr(firstN);
}

/**
 * Lower camel case's a hyphenated string: http://stackoverflow.com/a/10425344/598052.
 */
export function camelCase(input: string, delimeter: string = '-'): string {
	const regex = new RegExp(delimeter + '(.)', 'g');

	return input.toLowerCase().replace(regex, (match, group1) => group1.toUpperCase());
}

/**
 * Left pad a string with the desired character.
 */
export function leftPad(value: string, minLength: number, char: string): string {
	let result = value.toString();
	while (result.length < minLength) {
		result = char + result;
	}

	return result;
}

/**
 * Return a string which is comprised of str repeated n times.
 */
export function repeat(str: string, n: number): string {
	return new Array<mixed>(n + 1).join(str);
}

/**
 * Return a reversed version of the string.
 */
export function reverse(value: string): string {
	let i = value.length;
	let result = '';
	if (i > 0) {
		while (i--) {
			result += value.charAt(i);
		}
	}

	return result;
}

/**
 * Return a new string with the replacement spliced in at the given position.
 */
export function splice(str: string, pos: number, replacement: string): string {
	if (pos > str.length) {
		throw new Error(`Invalid position (${pos}) and replacement ("${replacement}") for string "${str}".)`);
	}

	return str.slice(0, pos) + replacement + str.slice(pos + replacement.length);
}

/**
 * Escape quotes from a string:
 *
 * hello -> hello
 * hello "didier", false -> hello \"didier\"
 * hello 'didier", true -> hello \'didier"
 */
export function escapeQuotes(s: string, single: boolean = false): string {
	if (single) {
		return s.replace(/'/g, "\\'");
	} else {
		return s.replace(/"/g, '\\"');
	}
}

/**
 * Escape all ocurrences of backslash from a string
 *
 * hello\ "didier" -> hello\\ "didier"
 */
export function escapeBackslash(s: string): string {
	return s.replace(/\\/g, '\\\\');
}

/**
 * Escape both quotes and backslash from a string.
 */
export function escapeQuotesAndBackslash(s: string, single: boolean = false): string {
	return escapeQuotes(escapeBackslash(s), single);
}

/**
 * Format a single filter value and return the appropriate string to use in the query.
 */
export function quoteValue(value: string, single: boolean = false): string {
	if (typeof value !== 'string') {
		return value;
	}

	if (single) {
		return `'${escapeQuotesAndBackslash(value, single)}'`;
	} else {
		return `"${escapeQuotesAndBackslash(value, single)}"`;
	}
}

/**
 * Decodes HTML encoded string back to plain string.
 */
export function decodeHTMLString(str: string): string {
	if (!str) {
		return str;
	}

	const keys = Object.keys(HTML_ENTITY_MAP.decodeMap);

	return str.replace(new RegExp(`(${keys.join('|')})`, 'g'), (match) => {
		return HTML_ENTITY_MAP.decodeMap[match];
	});
}

/**
 * Encodes String for use in HTML.
 */
export function encodeHTMLString(str: string): string {
	if (!str) {
		return str;
	}

	const keys = Object.keys(HTML_ENTITY_MAP.encodeMap);

	return str.replace(new RegExp(`(${keys.join('|')})`, 'g'), (match) => {
		if (match !== '\\') {
			return HTML_ENTITY_MAP.encodeMap[match];
		} else {
			// $FlowFixMe[prop-missing] Added when making empty objects exact by default.
			return HTML_ENTITY_MAP.encodeMap['\\\\'];
		}
	});
}

/**
 * Removes whitespace from both sides of a string and return it. Also
 * it return empty string if undefined or null is given as input
 */
export function trim(value: ?string): string {
	if (!value) {
		return '';
	}
	return value.trim();
}

/**
 * Removes whitespace from right sides of a string and return it. Also
 * it return empty string if undefined or null is given as input
 */
export function trimEnd(value: ?string): string {
	if (!value) {
		return '';
	}
	return value.trimEnd();
}
