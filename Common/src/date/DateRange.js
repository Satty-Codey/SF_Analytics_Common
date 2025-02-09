// @flow
import AbstractDateRange from 'Common/src/date/AbstractDateRange.js';
import DateOnly from 'Common/src/date/DateOnly.js';

/**
 * Representation of a range of absolute dates.
 */
export default class DateRange extends AbstractDateRange<DateOnly> {
	constructor(fromDate: DateOnly | null, toDate: DateOnly | null) {
		super(fromDate, toDate);
	}

	_getLocalizedStringLabelName(): string {
		return 'startDashEnd';
	}
}
