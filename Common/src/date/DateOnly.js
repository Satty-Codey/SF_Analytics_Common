// @flow
import type {AbstractDate} from 'Common/src/date/AbstractDate.js';
import * as Localizer from 'Common/src/localization/Localizer.js';
import * as StringUtil from 'Common/src/util/StringUtil.js';

/**
 * Simple representation of a date with no specific time.
 */
export default class DateOnly implements AbstractDate {
	+_date: Date;

	constructor(epochMillis: number) {
		this._date = new Date(epochMillis);
	}

	getYear(): number {
		return this._date.getUTCFullYear();
	}

	getMonth(): number {
		return this._date.getUTCMonth();
	}

	getDate(): number {
		return this._date.getUTCDate();
	}

	getEpochMillis(): number {
		return this._date.valueOf();
	}

	isEqual(otherDate: AbstractDate, isDateOnly: boolean = false): boolean {
		return (
			otherDate instanceof DateOnly &&
			(isDateOnly
				? this.toLocalizedString() === otherDate.toLocalizedString()
				: this.getEpochMillis() === otherDate.getEpochMillis())
		);
	}

	toLocalizedString(): string {
		return Localizer.formatDateInUtc(this._date, Localizer.DATE_SHORT);
	}

	/**
	 * Returns date in ISO date format ("YYYY-MM-DD").
	 */
	toDateString(): string {
		return `${this.getYear()}-${this._leftPadZero(this.getMonth() + 1, 2)}-${this._leftPadZero(this.getDate(), 2)}`;
	}

	getHash(): string {
		return this.getEpochMillis().toString();
	}

	_leftPadZero(n: number, minLength: number): string {
		return StringUtil.leftPad(String(n), minLength, '0');
	}
}
