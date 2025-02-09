// @flow
import type {StorageValue} from 'Common/src/storage/adapters/StorageAdapter.js';

/*
 * Note on sizing.  The following values are taken from the ECMAScript specification, where available.
 * Other values are guessed.
 *
 * Source: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf
 */
const CHARACTER_SIZE = 2;
const NUMBER_SIZE = 8;
const BOOLEAN_SIZE = 4; // This value is not defined by the spec
const POINTER_SIZE = 8;

/**
 * Estimates the size of a value.
 *
 * @param {*} value the item to estimate
 * @return {Number} the estimated size of the item in bytes.
 */
export default function estimateStorageSize(value: StorageValue | string): number {
	if (value === null || value === undefined) {
		return 0;
	}
	const type = typeof value;

	if (type === 'object') {
		try {
			return JSON.stringify(value).length;
		} catch (e) {
			return 0;
		}
	}

	switch (type) {
		case 'string':
			return value.length * CHARACTER_SIZE;
		case 'number':
			return NUMBER_SIZE;
		case 'boolean':
			return BOOLEAN_SIZE;
		default:
			return POINTER_SIZE;
	}
}
