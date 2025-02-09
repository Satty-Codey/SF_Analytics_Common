// @flow
import {KEY_CODE_UP, KEY_CODE_DOWN, KEY_CODE_LEFT, KEY_CODE_RIGHT, KEY_CODE_TAB} from 'Common/src/util/KeyCodeUtil.js';
import EventUtil from 'Common/src/util/EventUtil.coffee';

/**
 * Util for navigating LongTableRC.
 */
export function onKeyDown(
	rowIndex: number,
	columnIndex: number,
	rowCount: number,
	columnCount: number,
	onFocusChanged: (rowIndex: number, columnIndex: number) => void,
	event: SyntheticKeyboardEvent<>
) {
	switch (event.keyCode) {
		case KEY_CODE_TAB: {
			EventUtil.trap(event);
			handleTabClickInReportTypeTable(event);
			break;
		}
		case KEY_CODE_LEFT: {
			if (columnIndex > 0) {
				//$FlowFixMe[prop-missing]
				const previousColumn = event.currentTarget?.previousElementSibling;
				EventUtil.trap(event);
				if (previousColumn) {
					onFocusChanged(rowIndex, columnIndex - 1);
				}
			}
			break;
		}

		case KEY_CODE_RIGHT: {
			if (columnIndex < columnCount - 1) {
				EventUtil.trap(event);
				onFocusChanged(rowIndex, columnIndex + 1);
			}

			break;
		}

		case KEY_CODE_DOWN:
			if (rowIndex < rowCount - 1) {
				EventUtil.trap(event);
				if (columnIndex !== 2) {
					onFocusChanged(rowIndex + 1, columnIndex);
				}
			}
			break;

		case KEY_CODE_UP:
			if (rowIndex > 0) {
				EventUtil.trap(event);
				onFocusChanged(rowIndex - 1, columnIndex);
			}
			break;
	}
}

/**
 * Handles Tab click inside report type table
 * Tab takes the focus either to Details Panel close button
 * or the modal close button
 * Shift+Tab takes the focus either to Filter report type button
 * or the main search box
 */
function handleTabClickInReportTypeTable(event: SyntheticKeyboardEvent<>) {
	if (event.shiftKey) {
		const filterBtn = document.querySelector('.report-type-scope-filter');
		if (filterBtn) filterBtn?.querySelector('button')?.focus();
		else document.querySelector('.slds-input')?.focus();
	} else {
		const showMoreBtn = document.querySelector('.scopeFilterShowMore');
		if (showMoreBtn && !showMoreBtn.hasAttribute('disabled')) showMoreBtn?.focus();
		else {
			const detailPanelCloseBtn = document.querySelector('#detail-panel-close-btn');
			if (detailPanelCloseBtn) detailPanelCloseBtn?.focus();
			else document.querySelector('.slds-modal__close')?.focus();
		}
	}
}
