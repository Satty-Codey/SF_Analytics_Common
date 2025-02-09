// @flow
import type {AbstractDate} from 'Common/src/date/AbstractDate.js';
import DateTimeGrain from 'Common/src/date/DateTimeGrain.js';
import * as Localizer from 'Common/src/localization/Localizer.js';
import LC from 'Common/src/localization/LC.js';
import type {DurationFromObjectOptions} from 'Common/src/localization/Localizer.js';

/**
 * A date that changes based on the current time. Just a DateTimeGrain, integer offset, and fiscal year boolean for now.
 * Could be expanded in the future to understand date math (e.g. 2 months - 1 week).
 *
 * TODO: This is currently tied to UTC – should optionally work in the current zone.
 */
export default class RelativeDate implements AbstractDate {
	+_grain: DateTimeGrain;
	+_offset: number;
	+_isFiscal: boolean;

	constructor(grain: DateTimeGrain, offset: number, isFiscal: boolean) {
		this._grain = grain;
		this._offset = offset;
		this._isFiscal = isFiscal;
	}

	getGrain(): DateTimeGrain {
		return this._grain;
	}

	getOffset(): number {
		return this._offset;
	}

	isFiscal(): boolean {
		return this._isFiscal;
	}

	getEpochMillis(atStart: boolean): number {
		const now = new Date();
		const momentKey = this.getGrain().getMomentKey();

		const startingPoint = atStart
			? Localizer.startOfInZone(now, momentKey, 'UTC')
			: Localizer.endOfInZone(now, momentKey, 'UTC');

		const duration: DurationFromObjectOptions = {
			// $FlowFixMe[invalid-computed-prop]
			[momentKey]: this.getOffset()
		};

		return Localizer.plusInZone(startingPoint, duration, 'UTC').valueOf();
	}

	isEqual(otherDate: AbstractDate, isDateOnly: boolean = false): boolean {
		return (
			otherDate instanceof RelativeDate &&
			this.getGrain() === otherDate.getGrain() &&
			this.getOffset() === otherDate.getOffset() &&
			this.isFiscal() === otherDate.isFiscal()
		);
	}

	toLocalizedString(): string {
		const shownOffset = Math.abs(this._offset);

		if (this._offset === 0) {
			if (this._grain === DateTimeGrain.DAY) {
				return LC.getLabel('RelativeToDateLowerCase', 'today');
			} else {
				return this._grain.getRelativeToLabel(this.isFiscal(), false);
			}
		} else {
			return shownOffset + ' ' + this._grain.getDateLabel(this._offset < 0, shownOffset === 1);
		}
	}

	getHash(): string {
		return this.getGrain().name + '-' + this.getOffset() + '-' + String(this.isFiscal());
	}
}
