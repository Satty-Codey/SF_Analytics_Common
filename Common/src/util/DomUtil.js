// @flow

/**
 * DOM utility methods.
 */

/**
 * Get width of the element. Intended to help with testing by allowing mocking in Jest + JSDOM which does not implement
 * a layout system.
 */
export function getWidth(element: HTMLElement): number {
	return element.getBoundingClientRect().width;
}

/**
 * Get client height. Intended to help with testing by allowing mocking in Jest + JSDOM which does not implement a
 * layout system.
 */
export function getClientHeight(element: HTMLElement): number {
	return element.clientHeight;
}

/**
 * Is the element visible? Borrowed from jQuery.
 */
export function isVisible(element: HTMLElement): boolean {
	return element.offsetWidth > 0 || element.offsetHeight > 0 || element.getClientRects().length > 0;
}
