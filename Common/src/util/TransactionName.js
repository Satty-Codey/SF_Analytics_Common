//@flow
import Codeable from 'Common/src/lang/Codeable.coffee';

/**
 * Codeable for metric service transaction names
 * @author g.gong
 * @since 210
 */
export default class TransactionName extends Codeable {
	getCode(): string {
		return this._value;
	}
}

TransactionName.build(TransactionName, {
	EDIT_REPORT: 'Edit-Report',
	RUN_REPORT: 'Run-Report',
	CREATE_NEW_REPORT: 'Create-New-Report',
	SAVE_REPORT: 'Save-Report',
	SELECT_REPORT_TYPE: 'Select-Report-Type',
	REPORT_TYPE_FIELD_PANEL: 'Report-Type-Field-Panel',
	REPORT_TYPE_RECENTLY_USED: 'Report-Type-Recently-Used',
	SAVE_AND_RUN_REPORT: 'Save-And-Run-Report',
	SWITCH_TO_RUN_MODE: 'Switch-to-Run-Report',
	SWITCH_TO_EDIT_MODE: 'Swich-to-Edit-Report',
	INLINE_EDIT_REPORT: 'Inline-Edit-Report',
	USE_EINSTEIN_FORMULA_GENERATOR: 'Use-Einstein-Formula-Generator',
	ASK_EINSTEIN_FORMULA_GENERATOR: 'Ask-Einstein-Formula-Generator',
	SUBMIT_POSITIVE_FEEDBACK_EINSTEIN_FORMULA_GENERATOR: 'Submit-Positive-Feedback-Einstein-Formula-Generator',
	SUBMIT_NEGATIVE_FEEDBACK_EINSTEIN_FORMULA_GENERATOR: 'Submit-Negative-Feedback-Einstein-Formula-Generator',
	USE_EINSTEIN_REPORT_GENERATOR: 'Use-Einstein-Report-Generator',
	USE_EINSTEIN_REPORT_GENERATOR_ASK_QUESTION: 'Use-Einstein-Report-Generator-Ask-Question',
	USE_EINSTEIN_REPORT_GENERATOR_WITH_SUGGESTED_TYPE: 'Use-Einstein-Report-Generator-with-Suggested-Type',
	SUBMIT_POSITIVE_FEEDBACK_EINSTEIN_REPORT_GENERATOR: 'Submit-Positive-Feedback-Einstein-Report-Generator',
	SUBMIT_NEGATIVE_FEEDBACK_EINSTEIN_REPORT_GENERATOR: 'Submit-Negative-Feedback-Einstein-Report-Generator',
	REFRESH_REPORT: 'Refresh-Report'
});
