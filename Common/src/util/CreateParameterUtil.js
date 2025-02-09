//@flow
// eslint-disable-next-line no-restricted-imports
import type DashboardMetadata from 'WaveCommon/src/metadata/DashboardMetadata.js';

const PARAMETER_ID = 'parameter';
/**
 * Util for generating parameter ID
 */
export function generateParameterId(dashboardMetadata: DashboardMetadata): string {
	const existingParamIds = dashboardMetadata.getParameterIds();
	return generateId(existingParamIds, PARAMETER_ID);
}

/**
 * Util for generating parameter label given param ID
 * @param {*} paramId
 * @returns
 */
export function generateParameterLabel(paramId: string): string {
	return paramId.split('_').join(' ');
}

/**
 * Util for generating id for specific widget and parameter type
 */
export function generateParameterIdByType(
	dashboardMetadata: DashboardMetadata,
	type: string,
	widgetId: string
): string {
	const dynamicAttributes = dashboardMetadata.getWidget(widgetId).getParameter('dynamicAttributes') || {};

	const existingParamIds = Object.keys(dynamicAttributes);
	return generateId(existingParamIds, `${type}_${PARAMETER_ID}`);
}

/**
 * Private method to generate new id given existing ids
 */
function generateId(existingParamIds: Array<string>, identifier: string): string {
	let counter = 1;
	let newId = `${identifier}_${counter}`;
	while (existingParamIds.includes(newId)) {
		counter++;
		newId = `${PARAMETER_ID}_${counter}`;
	}
	return newId;
}
