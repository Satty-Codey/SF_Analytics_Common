// @flow

/**
 * Util for AirGap
 * @author mary.wong
 */

/**
 * Generate an AirGap compliant URL from a given URL
 * @param url
 * @returns {string}
 */
export function createAirgapLink(url: string): string {
	const airgapRedirect = '/HelpAndTrainingDoor?version=2&resource=';
	return airgapRedirect + encodeURIComponent(url);
}
