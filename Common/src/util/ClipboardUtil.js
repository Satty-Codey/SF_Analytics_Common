// @flow
// eslint-disable-next-line no-restricted-imports
import $ from 'jquery';

/**
 * Utilities for interacting with the user's clipboard.
 */

/**
 * Copy the passed value to clipboard. Returns if the copy was successful or not.
 */
export function copyToClipboard(val: string): boolean {
	// Input element must be in the DOM and can't have display none as the document.execCommand("copy")
	// won't work if the element is hidden.
	const clipboardEl$ = $('<input>').val(val).css({
		position: 'absolute',
		left: 999999999
	});

	$('body').append(clipboardEl$);
	clipboardEl$.select();
	const successful = document.execCommand('copy');

	clipboardEl$.remove();

	return successful;
}

/**
 * Copy the dom element with the passed css selector to clipboard. Returns if the copy was successful or not.
 */
export function copyDomElementToClipboard(elSelector: string): boolean {
	// Input element must be in the DOM and can't have display none as the document.execCommand("copy")
	// won't work if the element is hidden.
	const nodeEl$ = $(elSelector).get(0);
	if (!nodeEl$) {
		return false;
	}

	const range = document.createRange();
	range.selectNode(nodeEl$);
	const select = window.getSelection();
	select.removeAllRanges();
	select.addRange(range);
	try {
		return document.execCommand('copy');
	} catch (error) {
		return false;
	} finally {
		select.removeAllRanges();
	}
}
