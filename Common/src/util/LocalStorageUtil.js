// @flow

// $FlowFixMe[unclear-type]
type Item = any;

/**
 * Utils for manipulating local storage
 *
 * @author vaibhav.garg
 */

const keysForCurrentPrefix = new Set<string>();

let keyPrefix = '';

/**
 * Update the prefix used to store stuff in local storage. Useful to sandbox tests from affecting each other.
 */
export function setLocalStorageKeyPrefix(prefix: string): void {
	// First, clear out any items from the previous prefix if there were any.
	clearStorageForCurrentPrefix();

	keyPrefix = `${prefix} | ${Date.now()}`;
}

/**
 * Check for the item from the local storage with the given key.
 */
export function hasInLocalStorage(key: string): boolean {
	return localStorage.getItem(getLocalStorageKey(key)) != null;
}

/**
 * Get the item from the local storage with the given key.
 */
export function getFromLocalStorage(key: string): Item | null {
	const item = localStorage.getItem(getLocalStorageKey(key));

	return item != null ? JSON.parse(item) : null;
}

/**
 * Add value to the item in local storage with the given key.
 */
export function setInLocalStorage(key: string, value: Item): void {
	keysForCurrentPrefix.add(key);

	localStorage.setItem(getLocalStorageKey(key), JSON.stringify(value));
}

/**
 * Remove item from local storage with the given key.
 */
export function removeFromLocalStorage(key: string): void {
	localStorage.removeItem(getLocalStorageKey(key));
}

/**
 * Clear everything in storage with the current prefix.
 */
export function clearStorageForCurrentPrefix(): void {
	if (!keyPrefix) {
		return;
	}

	keysForCurrentPrefix.forEach((key) => {
		removeFromLocalStorage(getLocalStorageKey(key));
	});
}

/**
 * Generate a key to be used with local storage to avoid colisions.
 */
function getLocalStorageKey(key: string): string {
	return `"${keyPrefix}" | ${key}`;
}
