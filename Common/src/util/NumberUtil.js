// @flow
import {repeat} from 'Common/src/util/StringUtil.js';

// Used to detect binary string values
const REG_IS_BINARY = /^0b[01]+$/i;
// Used to detect octal string values
const REG_IS_OCTAL = /^0o[0-7]+$/i;

/**
 * Various number-related utils.
 */

/**
 * JavaScript modulo operator is more of a "remainder" in that it will return negative numbers. Handle that.
 */
export function modulo(value: number, modulus: number): number {
	const result = value % modulus;

	return result < 0 ? result + modulus : result;
}

/**
 * Format a number using a localized string. For now, this always uses the "en" locale but we should eventually use the
 * locale set for the user in Salesforce.
 */
export function toLocalizedString(number: number): string {
	return Number(number).toLocaleString();
}

/**
 * Round a number to the number of decimal places.
 */
export function round(number: number, numDecimalPlaces: number): number {
	const isNegative = number < 0;
	const absNumber = Math.abs(number);

	let rounded;
	if (numDecimalPlaces === 0) {
		rounded = Math.round(absNumber);
	} else {
		const multiplicand = Math.pow(10, numDecimalPlaces);

		rounded = Math.round(absNumber * multiplicand) / multiplicand;
	}

	// avoid converting 0 to -0
	if (isNegative && rounded !== 0) {
		return -rounded;
	} else {
		return rounded;
	}
}

/**
 * Convert a number into a string without using scientific notation (unlike the default toString method for very large
 * or small numbers).
 */
export function toStandardFormString(number: number): string {
	let str = number.toString();
	let n = number;

	const neg = str.charAt(0) === '-';
	if (neg) {
		str = str.substring(1);
		n = -n;
	}

	const eMinus = parseInt(str.split('e-')[1]);
	let ePlus = parseInt(str.split('e+')[1]);

	if (Math.abs(n) < 1.0 && eMinus) {
		n *= Math.pow(10, eMinus - 1);

		// avoid floating point errors (i.e. 0.0999... instead of 0.1)
		n = round(n, 15);

		str = `0.${repeat('0', eMinus - 1)}${n.toString().substring(2)}`;
	} else if (ePlus > 20) {
		ePlus -= 20;
		n /= Math.pow(10, ePlus);

		str = n + repeat('0', ePlus);
	}

	if (neg) {
		str = `-${str}`;
	}

	return str;
}

/**
 * Convert the given value to a number.
 *
 */
export function toNumber(input: mixed): number {
	let value = input;
	if (typeof value === 'number') {
		return value;
	}

	if (typeof value === 'symbol') {
		return NaN;
	}

	if (isObject(value)) {
		// $FlowFixMe[incompatible-type]
		value = typeof value.valueOf === 'function' ? value.valueOf() : value;
		// $FlowFixMe[unsafe-addition] Added when upgrading to Flow 0.198.2
		value = isObject(value) ? value + '' : value;
	}

	if (typeof value !== 'string') {
		return value === 0 ? value : +value;
	}

	value = value.trim();
	if (REG_IS_BINARY.test(value)) {
		return parseInt(value.slice(2), 2);
	} else if (REG_IS_OCTAL.test(value)) {
		return parseInt(value.slice(2), 8);
	} else {
		return +value;
	}
}

/**
 * Check if given value is an object
 */
export function isObject(value: mixed): boolean {
	const type = typeof value;
	return value != null && (type === 'object' || type === 'function');
}
