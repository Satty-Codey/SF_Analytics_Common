// @flow
import {size, partial, isEqual} from 'lodash';

/**
 * Utils for manipulating data structures.
 *
 * @author zuye.zheng
 */

/**
 * Turn an array of values into a set (i.e. map to booleans). Optionally check for uniqueness and throw an error,
 * otherwise dupes will be skipped. Also, optionally provide a function that takes the current value and returns
 * the hash that should be used.
 *
 * @DEPRECATED: We should be using ES6 Sets, see toES6Set.
 */
export function toSet<T>(
	array: Array<T>,
	checkUniqueness: boolean = false,
	buildHash: (T) => string = (value: T) => String(value)
): {[string]: boolean, ...} {
	const set = {};
	for (const curValue of array) {
		const curHash = buildHash(curValue);
		if (checkUniqueness && set[curHash]) {
			throw new Error('Duplicate value in set.');
		}
		// $FlowFixMe[prop-missing] Added when upgrading to Flow 0.190.1
		set[curHash] = true;
	}

	return set;
}

/**
 * Turn an array of values into an ES6 Set where the value is determined using a provided hashing function, which
 * should take the current value and return the hash to use.
 */
export function toES6Set<T, V>(array: Array<T>, buildValue: (T) => V): Set<V> {
	const set = new Set<V>();
	array.forEach((originalValue) => {
		const value = buildValue(originalValue);
		if (set.has(value)) {
			throw new Error('Attempted to add duplicate value to set.');
		} else {
			return set.add(value);
		}
	});

	return set;
}

/**
 * Turn an array of values into a map where the key is determined using a provided hashing function, which should
 * take the current value and return the hash to use.
 *
 * @DEPRECATED: We should be using ES6 Maps, see toES6Map.
 */
export function toMap<T>(array: Array<T>, buildHash: (T) => string): {[string]: T, ...} {
	const map = {};
	for (const curValue of array) {
		const curHash = buildHash(curValue);
		if (map[curHash] != null) {
			throw new Error('Duplicate value in set.');
		}
		// $FlowFixMe[prop-missing] Added when upgrading to Flow 0.190.1
		map[curHash] = curValue;
	}

	return map;
}

/**
 * Turn an array of values into an ES6 Map where the key is determined using a provided hashing function, which
 * should take the current value and return the hash to use.
 */
export function toES6Map<V, H>(array: Array<V>, buildHash: (V) => H): Map<H, V> {
	const map = new Map<H, V>();
	array.forEach((value) => {
		const hash = buildHash(value);
		if (map.has(hash)) {
			throw new Error('Attempted to add value with duplicate hash to map.');
		} else {
			return map.set(hash, value);
		}
	});

	return map;
}

/**
 * Turn an array of values into a map where the value is the key. Optionally check for uniqueness.
 *
 * @DEPRECATED: This is essentially a Set.
 */
export function toIdentityMap(array: Array<string>, checkUniqueness: boolean = false): {string: string, ...} {
	const map = {};
	for (const curValue of array) {
		if (checkUniqueness && map[curValue] != null) {
			throw new Error('Duplicate value in set.');
		}
		// $FlowFixMe[prop-missing] Added when upgrading to Flow 0.190.1
		map[curValue] = curValue;
	}

	// $FlowFixMe[prop-missing] Added when making empty objects exact by default.
	return map;
}

/**
 * Count up occurrences of each value in the array.
 */
export function toHistogram(array: $ReadOnlyArray<mixed>): {[string]: number, ...} {
	const histogram = {};
	for (const curValue of array) {
		const curKey = String(curValue);

		// $FlowFixMe[prop-missing] Added when upgrading to Flow 0.190.1
		histogram[curKey] = (histogram[curKey] || 0) + 1;
	}

	return histogram;
}

/**
 * Create a simple key-value pair.
 *
 * @DEPRECATED: This can be easily achieved with {[key]: value} in ES6.
 */
export function toKeyValuePair<V>(key: string, value: V): {[string]: V, ...} {
	return {[key]: value};
}

/**
 * Remove the value from the array and return the array of removed values, undefined otherwise.
 */
export function removeFromArray<T>(array: Array<T>, value: T): Array<T> | void {
	const valueIndex = array.indexOf(value);
	if (valueIndex < 0) {
		return undefined;
	} else {
		return array.splice(valueIndex, 1);
	}
}

/**
 * Check that the 2 arrays have the same elements ignoring order.
 */
export function sameElements(arr1: $ReadOnlyArray<mixed>, arr2: $ReadOnlyArray<mixed>): boolean {
	if (arr1.length !== arr2.length) {
		return false;
	}

	// convert one array into a histogram for efficient comparison that handles dupes
	const histogram1 = toHistogram(arr1);

	// decrement histogram1 with arr2
	for (const curValue of arr2) {
		const curKey = String(curValue);

		if (histogram1[curKey] == null) {
			return false;
		}
		const newValue = --histogram1[curKey];
		if (newValue === 0) {
			delete histogram1[curKey];
		}
	}

	// no elements should be unaccounted for
	return size(histogram1) === 0;
}

/**
 * Return true if is subset. Subset and superset can be arrays or maps.
 */
export function isSubset(
	subset: Array<string> | {[string]: mixed, ...},
	superset: Array<string> | {[string]: mixed, ...}
): boolean {
	const subsetAsSet = Array.isArray(subset) ? toSet(subset) : subset;
	const supersetAsSet = Array.isArray(superset) ? toSet(superset) : superset;

	for (const curItem of Object.keys(subsetAsSet)) {
		if (supersetAsSet[curItem] == null) {
			return false;
		}
	}

	return true;
}

/**
 * Build and return a new object containing the same keys as obj but with values transformed by iteratee.
 */
export function mapObject<V, T>(
	obj: {[string]: V, ...} = {},
	iteratee: (V, string, {[string]: V, ...}) => T
): {[string]: T, ...} {
	const results = {};
	for (const key of Object.keys(obj)) {
		// $FlowFixMe[prop-missing] Added when upgrading to Flow 0.190.1
		results[key] = iteratee(obj[key], key, obj);
	}

	return results;
}

/**
 * Build and return a new object containing the same keys as obj but with values transformed by iteratee.
 */
export function mapES6Map<K, V, T>(map: Map<K, V>, iteratee: (V, K, Map<K, V>) => T): Map<K, T> {
	const results = new Map<K, T>();
	for (const [key, value] of map.entries()) {
		results.set(key, iteratee(value, key, map));
	}

	return results;
}

/**
 * Deep copy.
 */
export function deepCopy<T>(obj: T): T {
	if (obj == null) {
		return obj;
	}

	const stringified = JSON.stringify(obj);
	if (stringified == null) {
		throw new Error('Failed to deep copy.');
	}

	return JSON.parse(stringified);
}

/**
 * If a thing is a map, i.e. object, but not an array.
 */
export function isMap(thing: mixed): boolean {
	return thing !== null && typeof thing === 'object' && !Array.isArray(thing);
}

/**
 * Like extend, but instead of clobbering any nested objects or maps, extend them as well. The typing of the return
 * value isn't ideal so it's generally best to rely on the in-place behavior from a typing perspective. The return value
 * would ideally be represented as an intersection of the argumnent types but that's not possible with variadic arguments.
 */
export function deepExtend(
	obj: {[string]: mixed, ...},
	...objs: Array<$ReadOnly<{[string]: mixed, ...}> | void>
): {[string]: mixed, ...} {
	for (const curExtendObj of objs) {
		if (curExtendObj == null) {
			continue;
		}

		for (const curKey of Object.keys(curExtendObj)) {
			const curValue = curExtendObj[curKey];
			const objCurValue = obj[curKey];
			if (isMap(objCurValue) && isMap(curValue)) {
				// If both values are maps, recursively extend
				// $FlowFixMe[incompatible-call]
				deepExtend(objCurValue, curValue);
			} else {
				// otherwise clobber away
				obj[curKey] = curValue;
			}
		}
	}

	return obj;
}

/**
 * Deep version of _.defaults.
 */
export function deepDefaults(obj: {[string]: mixed, ...}, defaults: {[string]: mixed, ...}): void {
	for (const curKey of Object.keys(defaults)) {
		const defaultValue = defaults[curKey];
		const objCurValue = obj[curKey];
		if (objCurValue != null) {
			if (isMap(defaultValue) && isMap(objCurValue)) {
				// $FlowFixMe[incompatible-call]
				deepDefaults(objCurValue, defaultValue);
			}
		} else {
			obj[curKey] = defaultValue;
		}
	}
}

/**
 * Return true if array contains item. Uses _.isEqual intead of indexOf to allow searching for objects.
 */
export function deepContains<T>(array: Array<T>, item: T): boolean {
	return array.some(partial(isEqual, item));
}

/**
 * Like _.intersection but uses _.isEqual so that intersections of nested arrays can be calculated.
 */
export function deepIntersection<T>(array: Array<T>, ...otherArrays: Array<Array<T>>): Array<T> {
	const result = [];
	for (const item of array) {
		if (!deepContains(result, item)) {
			if (!otherArrays.some((otherArray) => !deepContains(otherArray, item))) {
				result.push(item);
			}
		}
	}

	return result;
}

/**
 * Delete keys with null values from an object recursively.
 */
export function deleteNullValues<T>(
	obj: {[string]: T, ...},
	lookInArrays: boolean = false
): {[string]: $NonMaybeType<T>, ...} {
	for (const curKey of Object.keys(obj)) {
		const curValue = obj[curKey];
		if (isMap(curValue)) {
			// $FlowFixMe[incompatible-call]
			deleteNullValues(curValue);
		} else if (Array.isArray(curValue) && lookInArrays) {
			for (const curArrayItem of curValue) {
				if (isMap(curArrayItem)) {
					// $FlowFixMe[incompatible-call]
					deleteNullValues(curArrayItem);
				}
			}
		} else if (curValue == null) {
			// null or undefined, bye bye
			delete obj[curKey];
		}
	}

	return obj;
}
