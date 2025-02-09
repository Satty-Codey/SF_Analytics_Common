// @flow
import type {BaseLabel} from 'Common/src/localization/BaseLabel.js';
import type AbstractDateRange from 'Common/src/date/AbstractDateRange.js';
import type {AbstractDate} from 'Common/src/date/AbstractDate.js';

/**
 * A pre-defined date range
 *
 * @since 214
 * @author dixie.kee
 */
export default class DateRangePreset {
	+_label: BaseLabel;
	+_dateRange: AbstractDateRange<AbstractDate>;
	+_code: string;

	constructor(label: BaseLabel, dateRange: AbstractDateRange<AbstractDate>, code: string) {
		this._label = label;
		this._dateRange = dateRange;
		this._code = code;
	}

	getLabel(): string {
		return this._label.toString();
	}

	getCode(): string {
		return this._code.toString();
	}

	getDateRange(): AbstractDateRange<AbstractDate> {
		return this._dateRange;
	}

	getHash(): string {
		return this._dateRange.getHash();
	}
}
