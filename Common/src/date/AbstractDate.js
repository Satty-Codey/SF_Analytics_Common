// @flow

/**
 * Abstract date. Extended by absolute and relative date types.
 */
export interface AbstractDate {
	/**
	 * Get the number of epoch milliseconds.
	 */
	getEpochMillis(atStart: boolean): number;

	/**
	 * Is this date equal to the other date?
	 */
	isEqual(otherDate: AbstractDate, isDateOnly?: boolean): boolean;

	/**
	 * Return a string representation of the date in the user's locale.
	 */
	toLocalizedString(): string;

	/**
	 * A hash function to return a unique identifier for the date.
	 */
	getHash(): string;
}
