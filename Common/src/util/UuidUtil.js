// @flow
// UUID should be of this form, use an array for easier iteration
const UUID_TEMPLATE = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.split('');

/**
 * Generate a UUID to RFC4122 spec.
 */
export function generateUUID(): string {
	// Just in case random seed is the same, we also use the current time to offset the random number to make
	// collisions less likely.
	let now = new Date().getTime();
	let uuid = '';
	for (const curChar of UUID_TEMPLATE) {
		if (curChar !== 'x' && curChar !== 'y') {
			// only need to replace x and y's from the template
			uuid += curChar;
			continue;
		}

		// random hex digit with offset by the epoch
		let curDigit = ((now + Math.random()) * 16) % 16 | 0;
		now = Math.floor(now / 16);

		// y should only be {8, 9, a, or b}
		if (curChar === 'y') {
			curDigit = (curDigit & 0x3) | 0x8;
		}

		// encode value as hex and add to UUID
		uuid += curDigit.toString(16);
	}

	return uuid;
}
