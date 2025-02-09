// @flow
import AbstractDateRange from 'Common/src/date/AbstractDateRange.js';
import RelativeDate from 'Common/src/date/RelativeDate.js';
import DateTimeGrain from 'Common/src/date/DateTimeGrain.js';

/**
 * Representation of a range of relative dates.
 */
export default class RelativeDateRange extends AbstractDateRange<RelativeDate> {
	constructor(fromDate: RelativeDate | null, toDate: RelativeDate | null) {
		super(fromDate, toDate);
	}

	/**
	 * Get the grain of a relative date range, handling open-ended date ranges and mixed-grain ranges (e.g. 1 year ago
	 * to current day). This currently makes the assumption that all mixed-grain ranges will have DateTimeGrain.DAY as
	 * one of the two grains.
	 */
	getGrain(): DateTimeGrain {
		if (this._fromDate != null && this._toDate != null) {
			if (this._fromDate.getGrain() === DateTimeGrain.DAY) {
				// $FlowFixMe[incompatible-use] - Flow should know this cannot be null here.
				return this._toDate.getGrain();
			} else {
				// $FlowFixMe[incompatible-use] - Flow should know this cannot be null here.
				return this._fromDate.getGrain();
			}
		} else if (this._fromDate != null) {
			return this._fromDate.getGrain();
		} else if (this._toDate != null) {
			return this._toDate.getGrain();
		} else {
			throw new Error('Invalid date range.');
		}
	}

	/**
	 * Is this a fiscal range? This will be true if either date is fiscal to handle ranges like "1 fiscal year ago to
	 * current day".
	 */
	isFiscal(): boolean {
		return Boolean(this._fromDate?.isFiscal() || this._toDate?.isFiscal());
	}

	_getLocalizedStringLabelName(): string {
		return 'startToEnd';
	}
}
