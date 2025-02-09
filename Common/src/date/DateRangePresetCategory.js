// @flow
import type {BaseLabel} from 'Common/src/localization/BaseLabel.js';
import type DateRangePreset from 'Common/src/date/DateRangePreset.js';

/**
 * DateRangePresets grouped by category
 *
 * @since 214
 * @author dixie.kee
 */
export default class DateRangePresetCategory {
	+_label: BaseLabel;
	+_presets: Array<DateRangePreset>;

	constructor(label: BaseLabel, presets: Array<DateRangePreset>) {
		this._label = label;
		this._presets = presets;
	}

	getLabel(): string {
		return this._label.toString();
	}

	getPresets(): Array<DateRangePreset> {
		return this._presets;
	}
}
