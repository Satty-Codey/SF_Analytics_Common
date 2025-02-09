// @flow
import Enum from 'Common/src/lang/Enum.js';
import LC from 'Common/src/localization/LC.js';
import type {DurationUnit} from 'Common/src/localization/Localizer.js';

/**
 * Enumeration of the different temporal grains that we care about.
 */
export default class DateTimeGrain extends Enum<DateTimeGrain> {
	static YEAR: DateTimeGrain;
	static QUARTER: DateTimeGrain;
	static MONTH: DateTimeGrain;
	static WEEK: DateTimeGrain;
	static DAY: DateTimeGrain;
	static HOUR: DateTimeGrain;
	static MINUTE: DateTimeGrain;
	static SECOND: DateTimeGrain;

	+_singularLabelName: string;
	+_pluralLabelName: string;
	+_relativeToLabelName: string | void;
	+_fiscalRelativeToLabelName: string | void;

	constructor({
		singularLabelName,
		pluralLabelName,
		relativeToLabelName,
		fiscalRelativeToLabelName
	}: {
		singularLabelName: string,
		pluralLabelName: string,
		relativeToLabelName?: string,
		fiscalRelativeToLabelName?: string
	}) {
		super();

		this._singularLabelName = singularLabelName;
		this._pluralLabelName = pluralLabelName;
		this._relativeToLabelName = relativeToLabelName;
		this._fiscalRelativeToLabelName = fiscalRelativeToLabelName;
	}

	/**
	 * Get the string key used by moment.js for manipulating dates at this granularity.
	 */
	getMomentKey(): DurationUnit {
		// $FlowFixMe[incompatible-return] - Flow can't know this to be true.
		return this.name.toLowerCase();
	}

	/**
	 * Get the string key used by EclairNG for this granularity.
	 */
	getEclairNgKey(): string {
		return this.getMomentKey();
	}

	getLabel(isSingular: boolean, isCapitalized: boolean): string {
		const grainLabelName = isSingular ? this._singularLabelName : this._pluralLabelName;

		if (isCapitalized) {
			return LC.getLabel('DateGrainUpperCase', grainLabelName);
		} else {
			return LC.getLabel('DateGrain', grainLabelName);
		}
	}

	getRelativeToLabel(inFiscalMode: boolean, isUpperCase: boolean): string {
		const labelSection = isUpperCase ? 'RelativeToDateUpperCase' : 'RelativeToDateLowerCase';

		return this._getRelativeToLabel(labelSection, inFiscalMode);
	}

	getRelativeToAcronymLabel(inFiscalMode: boolean): string {
		return this._getRelativeToLabel('RelativeToDateAcronym', inFiscalMode);
	}

	getDateLabel(isPast: boolean, isSingular: boolean): string {
		const relativeLabelName = isPast ? 'grainAgo' : 'grainAhead';

		return LC.getLabel('RelativeDate', relativeLabelName, this.getLabel(isSingular, false));
	}

	_getRelativeToLabel(labelSection: string, inFiscalMode: boolean): string {
		const labelName = inFiscalMode ? this._fiscalRelativeToLabelName : this._relativeToLabelName;

		// If we add support for relative times, we should add the missing labels and make these required.
		if (labelName == null) {
			throw new Error('Missing relative to label for grain.');
		}

		return LC.getLabel(labelSection, labelName);
	}
}

DateTimeGrain
	// prettier-ignore
	.add(
		'YEAR',
		new DateTimeGrain({
			singularLabelName: 'year',
			pluralLabelName: 'years',
			relativeToLabelName: 'currentYear',
			fiscalRelativeToLabelName: 'currentFiscalYear'
		})
	)
	.add(
		'QUARTER',
		new DateTimeGrain({
			singularLabelName: 'quarter',
			pluralLabelName: 'quarters',
			relativeToLabelName: 'currentQuarter',
			fiscalRelativeToLabelName: 'currentFiscalQuarter'
		})
	)
	.add(
		'MONTH',
		new DateTimeGrain({
			singularLabelName: 'month',
			pluralLabelName: 'months',
			relativeToLabelName: 'currentMonth',
			fiscalRelativeToLabelName: 'currentFiscalMonth'
		})
	)
	.add(
		'WEEK',
		new DateTimeGrain({
			singularLabelName: 'week',
			pluralLabelName: 'weeks',
			relativeToLabelName: 'currentWeek',
			fiscalRelativeToLabelName: 'currentFiscalWeek'
		})
	)
	.add(
		'DAY',
		new DateTimeGrain({
			singularLabelName: 'day',
			pluralLabelName: 'days',
			relativeToLabelName: 'today'
		})
	)
	.add(
		'HOUR',
		new DateTimeGrain({
			singularLabelName: 'hour',
			pluralLabelName: 'hours'
		})
	)
	.add(
		'MINUTE',
		new DateTimeGrain({
			singularLabelName: 'minute',
			pluralLabelName: 'minutes'
		})
	)
	.add(
		'SECOND',
		new DateTimeGrain({
			singularLabelName: 'second',
			pluralLabelName: 'seconds'
		})
	)
	.finish();
