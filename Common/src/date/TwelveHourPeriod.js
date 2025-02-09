// @flow
import Enum from 'Common/src/lang/Enum.js';
import LC from 'Common/src/localization/LC.js';

/**
 * AM or PM.
 */
export default class TwelveHourPeriod extends Enum<TwelveHourPeriod> {
	static AM: TwelveHourPeriod;
	static PM: TwelveHourPeriod;

	/**
	 * Get enum by hour on the 24-hour clock.
	 */
	static fromHour(hour: number): TwelveHourPeriod {
		if (hour <= 11) {
			return TwelveHourPeriod.AM;
		} else {
			return TwelveHourPeriod.PM;
		}
	}

	getLabel(): string {
		return LC.getLabel('TwelveHourPeriod', this.name.toLowerCase());
	}
}

TwelveHourPeriod
	// prettier-ignore
	.add('AM', new TwelveHourPeriod())
	.add('PM', new TwelveHourPeriod())
	.finish();
