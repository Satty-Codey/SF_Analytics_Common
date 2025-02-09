// @flow
import ServiceInjector from 'Common/src/core/di/ServiceInjector.js';
import AppConfig from 'Common/src/core/AppConfig.coffee';
import Permission from 'Common/src/core/Permission.js';

/**
 * Util for deciding whether SLDS+ is enabled or not
 *
 * @author mbararia
 */

const REPORT_CLASSLIST = ['reportsLightningReportApp'];
const DASHBOARD_CLASSLIST = ['dashboard', 'dashboardAppModal'];
const GATE_FOR_KONDO = 'com.salesforce.kondo.enableCharts';

/**
 * Check whether SLDS2 Theme is active.
 */
function isKondoEnabled(eleClassList: Array<string>): boolean {
	// document is not available on mobile and kondo is not supported on mobile anyway
	if (typeof document === 'undefined') {
		return false;
	}

	let baseElement = null;
	for (const className of eleClassList) {
		const elements = document.getElementsByClassName(className);
		if (elements.length > 0) {
			baseElement = elements[0]; // Get the first element with the class name
			break; // Stop iterating once we find the first valid element
		}
	}

	const computedStyle = baseElement && parent ? parent.getComputedStyle(baseElement) : null;
	const isSldsV2 = computedStyle ? computedStyle.getPropertyValue('--slds-g-radius-border-1') === '0.25rem' : false;
	return isSldsV2;
}

/**
 * for reports we are using gates to confirm whether to use SLDS+
 */
export function isKondoChartEnabledForReports(): boolean {
	// check if gate is open
	const appConfig = ServiceInjector.get(AppConfig);
	const isGateOpen = appConfig && (appConfig.getGates() ? appConfig.getGates()[GATE_FOR_KONDO] : false);
	const isSldsV2 = isKondoEnabled(REPORT_CLASSLIST);
	return isGateOpen && isSldsV2;
}

/**
 * for dashboards we are using perms to confirm whether to use SLDS+
 */
export function isKondoChartEnabledForDashboard(): boolean {
	// check if perm is active
	const isGateOpen = Permission.has(Permission.IS_KONDO_CHARTS_ENABLED);
	const isSldsV2 = isKondoEnabled(DASHBOARD_CLASSLIST);
	return isGateOpen && isSldsV2;
}
