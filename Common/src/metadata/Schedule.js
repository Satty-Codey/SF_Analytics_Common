// @flow
import LC from 'Common/src/localization/LC.js';
import type {ScheduleJson} from 'Common/src/api/sfdc/analytics/AnalyticsNotificationJson.js';

/**
 * Schedule Metadata
 */
export default class Schedule {
	_json: ScheduleJson;

	constructor(json: ScheduleJson) {
		this._json = json;
	}

	getFrequency(): string {
		return this._json.frequency;
	}

	getFrequencyLabel(): string {
		return `${LC.getLabel('Frequency', 'updates')} ${this._json.frequency}`;
	}

	getDaysOfWeek(): Array<string> | void {
		return this._json.details.daysOfWeek;
	}

	getTime(): number {
		return this._json.details.time;
	}

	getJson(): ScheduleJson {
		return this._json;
	}
}
