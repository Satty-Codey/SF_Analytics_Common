// @flow

/**
 * Range tuple that supports infinity.
 *
 */
export default class Range {
	+_lower: number;
	+_upper: number;
	+_inclusive: boolean;

	/**
	 * Construct with a lower and upper number boundary, if not provided, infinity will be used. Optionally specify
	 * the bounds to be exclusive.
	 */
	constructor(lower: number | void, upper: number | void, inclusive: boolean = true) {
		this._lower = lower ?? -Infinity;
		this._upper = upper ?? Infinity;
		this._inclusive = inclusive;
	}

	getLower(): number {
		return this._lower;
	}

	getUpper(): number {
		return this._upper;
	}

	/**
	 * Is the range boundless like dda's heart and vijay's dreams?
	 */
	isBoundless(): boolean {
		return this._lower === -Infinity && this._upper === Infinity;
	}

	/**
	 * Is the value within the bounds?
	 */
	inBounds(value: number): boolean {
		return this._aboveLowerBound(value) && this._belowUpperBound(value);
	}

	/**
	 * Restrict value to being within the bounds.
	 */
	toValueInBounds(value: number): number {
		if (!this._aboveLowerBound(value)) {
			return this._lower;
		} else if (!this._belowUpperBound(value)) {
			return this._upper;
		} else {
			return value;
		}
	}

	/**
	 * Does the given other range overlap this one?
	 */
	doesOverlap(otherRange: Range): boolean {
		return this._aboveLowerBound(otherRange.getUpper()) && this._belowUpperBound(otherRange.getLower());
	}

	_aboveLowerBound(value: number): boolean {
		if (this._inclusive) {
			return value >= this._lower;
		} else {
			return value > this._lower;
		}
	}

	_belowUpperBound(value: number): boolean {
		if (this._inclusive) {
			return value <= this._upper;
		} else {
			return value < this._upper;
		}
	}
}
