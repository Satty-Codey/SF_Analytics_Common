// @flow
import LC from 'Common/src/localization/LC.js';
import type {AbstractDate} from 'Common/src/date/AbstractDate.js';

/**
 * Representation of a range of dates. Dates should be subclasses of AbstractDate.
 */
export default class AbstractDateRange<+T: AbstractDate> {
	+_fromDate: T | null;
	+_toDate: T | null;

	/**
	 * Construct with "from" and "to" date representations. Either the "from" or "to" date can not be specified for
	 * an open-ended range. If both are specified, both should be of the same type.
	 */
	constructor(fromDate: T | null, toDate: T | null) {
		this._fromDate = fromDate;
		this._toDate = toDate;
	}

	/**
	 * Is there no "from" date?
	 */
	isOpenEndedFrom(): boolean {
		return this._fromDate == null;
	}

	/**
	 * Is there no "to" date?
	 */
	isOpenEndedTo(): boolean {
		return this._toDate == null;
	}

	getFromDate(): T | null {
		return this._fromDate;
	}

	getToDate(): T | null {
		return this._toDate;
	}

	/**
	 * Is this date range equal to the given one? For both the "from" and "to" dates, both ranges must either be open-
	 * ended or both must have equal endpoints defined.
	 */
	isEqual(otherDateRange: AbstractDateRange<AbstractDate>, isDateOnly?: boolean): boolean {
		const otherFromDate = otherDateRange.getFromDate();
		const isFromEqual =
			(this._fromDate == null && otherFromDate == null) ||
			(this._fromDate != null && otherFromDate != null && this._fromDate.isEqual(otherFromDate, isDateOnly));

		const otherToDate = otherDateRange.getToDate();
		const isToEqual =
			(this._toDate == null && otherToDate == null) ||
			(this._toDate != null && otherToDate != null && this._toDate.isEqual(otherToDate, isDateOnly));

		return isFromEqual && isToEqual;
	}

	/**
	 * A hash function to return a unique identifier for the date range.
	 */
	getHash(): string {
		const fromHash = this._fromDate != null ? this._fromDate.getHash() : '';
		const toHash = this._toDate != null ? this._toDate.getHash() : '';

		return fromHash + '-' + toHash;
	}

	/**
	 * Return a string representation of the date range in the user's locale.
	 */
	toLocalizedString(): string {
		if (this._fromDate != null && this._toDate != null) {
			return LC.getLabel(
				'Range',
				this._getLocalizedStringLabelName(),
				// $FlowFixMe[incompatible-use] - Flow should know this cannot be null here.
				this._fromDate.toLocalizedString(),
				// $FlowFixMe[incompatible-use] - Flow should know this cannot be null here.
				this._toDate.toLocalizedString()
			);
		} else if (this._fromDate != null) {
			return LC.getLabel(
				'FilterOperatorValueDisplayLabel',
				'dateOperatorGreaterOrEqual',
				this._fromDate.toLocalizedString()
			);
		} else if (this._toDate != null) {
			return LC.getLabel(
				'FilterOperatorValueDisplayLabel',
				'dateOperatorLessOrEqual',
				this._toDate.toLocalizedString()
			);
		} else {
			throw new Error('Invalid date range.');
		}
	}

	/**
	 * Return the label name to use to create the localized string.
	 */
	_getLocalizedStringLabelName(): string {
		throw new Error('Not implemented.');
	}
}
