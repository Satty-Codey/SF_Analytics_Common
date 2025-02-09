// @flow
import Enum from 'Common/src/lang/Enum.js';
import LC from 'Common/src/localization/LC.js';

/**
 * DateRangeSelectorOperator is an enum representing date range operators in the date picker.
 *
 * @author dixie.kee
 */
export default class DateRangeSelectorOperator extends Enum<DateRangeSelectorOperator> {
	static BETWEEN: DateRangeSelectorOperator;
	static LESS_OR_EQUALS: DateRangeSelectorOperator;
	static GREATER_OR_EQUALS: DateRangeSelectorOperator;
	static IS_NULL: DateRangeSelectorOperator;
	static IS_NOT_NULL: DateRangeSelectorOperator;

	_labelName: string;
	_needsInput: boolean;

	constructor({labelName, needsInput}: {labelName: string, needsInput: boolean, ...}) {
		super();
		this._labelName = labelName;
		this._needsInput = needsInput;
	}

	getLabel(): string {
		return LC.getLabel('DateRangeSelector', this._labelName);
	}

	needsInput(): boolean {
		return this._needsInput;
	}
}

DateRangeSelectorOperator.add(
	'BETWEEN',
	new DateRangeSelectorOperator({
		labelName: 'operatorBetween',
		needsInput: true
	})
)
	.add(
		'LESS_OR_EQUALS',
		new DateRangeSelectorOperator({
			labelName: 'operatorLessEqual',
			needsInput: true
		})
	)
	.add(
		'GREATER_OR_EQUALS',
		new DateRangeSelectorOperator({
			labelName: 'operatorGreaterEqual',
			needsInput: true
		})
	)
	.add(
		'IS_NULL',
		new DateRangeSelectorOperator({
			labelName: 'operatorIsNull',
			needsInput: false
		})
	)
	.add(
		'IS_NOT_NULL',
		new DateRangeSelectorOperator({
			labelName: 'operatorIsNotNull',
			needsInput: false
		})
	)
	.finish();
