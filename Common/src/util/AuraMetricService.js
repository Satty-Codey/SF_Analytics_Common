// @flow
import ServiceInjector from 'Common/src/core/di/ServiceInjector.js';
// eslint-disable-next-line no-restricted-imports
import AuraService from 'Common/src/util/AuraService.coffee';

/**
 * Wrapper for Aura Metrics Service
 * @author g.gong
 * @since 210
 * @flow
 */
export default class AuraMetricService {
	// Start a transaction with a given key identifier, attributes and reportId
	static transactionStart(key: string, attributes: ?mixed, reportId: ?string) {
		const message = this.createMessage('transactionStart', 'performance', {
			context: {
				eventSource: `synthetic-${key}`,
				eventType: 'performance',
				attributes: attributes,
				page: {
					location: 'reports:reportApp',
					recordId: reportId,
					sobjectType: 'Report',
					url: window.parent.location.href
				}
			}
		});
		ServiceInjector.get(AuraService).postReportBuilderAppMessage(message);
	}

	static transactionEnd(key: string, attributes: mixed) {
		// transactionEnd is paired with a similar transactionStart. The attributes being passed to should be identical to transactionStart
		const context = {
			...{
				eventSource: `synthetic-${key}`,
				eventType: 'performance'
			},
			...attributes
		};

		const message = this.createMessage('transactionEnd', 'performance', {
			context: context
		});
		ServiceInjector.get(AuraService).postReportBuilderAppMessage(message);
	}

	static markEnd(key: string, attributes: mixed) {
		// markEnd is used to mark different events that might occur between a transactionStart and transactionEnd
		const payload = {
			...{
				eventType: 'performance'
			},
			...attributes
		};
		const message = this.createMessage('markEnd', `synthetic-${key}`, payload);
		ServiceInjector.get(AuraService).postReportBuilderAppMessage(message);
	}

	static crudTransaction(reportId: string, eventSource: string, target: string) {
		const interaction = {
			context: {
				eventType: 'crud',
				eventSource: eventSource,
				locator: {
					target: target,
					scope: 'sfxReportApp'
				},
				attributes: {
					recordId: reportId,
					recordType: 'Report'
				},
				page: {
					entityType: 'Report'
				}
			}
		};

		const message = this.createMessage('transaction', 'interaction', interaction);

		ServiceInjector.get(AuraService).postReportBuilderAppMessage(message);
	}

	static createMessage(
		name: string,
		action: string,
		payload: mixed
	): {
		action: string,
		metricService: boolean,
		name: string,
		payload: mixed,
		srcApp: string
	} {
		return {
			srcApp: 'reportBuilderApp',
			metricService: true,
			name: name,
			action: action,
			payload: payload
		};
	}
}
