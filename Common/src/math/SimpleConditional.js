// @flow
import Codeable from 'Common/src/lang/Codeable.js';

type CheckFn = (number, number) => boolean;

/**
 * Simple conditional enums with checking. Check probably should take a numeric left and right value but actually any
 * values can be compared, JS rules apply.
 *
 * @author zuye.zheng
 */
export default class SimpleConditional extends Codeable<SimpleConditional> {
	static EQUALS: SimpleConditional;
	static NOT_EQUAL: SimpleConditional;
	static LESS_THAN: SimpleConditional;
	static LESS_THAN_OR_EQUALS: SimpleConditional;
	static GREATER_THAN: SimpleConditional;
	static GREATER_THAN_OR_EQUALS: SimpleConditional;

	+_labelCode: string;
	+_displayOperator: string;
	+_check: CheckFn;

	constructor(labelCode: string, displayOperator: string, check: CheckFn) {
		super();

		this._labelCode = labelCode;
		this._displayOperator = displayOperator;
		this._check = check;
	}

	getLabelCode(): string {
		return this._labelCode;
	}

	getDisplayOperator(): string {
		return this._displayOperator;
	}

	/**
	 * Run the conditional check for the 2 given values.
	 */
	check(leftValue: number, rightValue: number): boolean {
		return this._check(leftValue, rightValue);
	}
}

SimpleConditional
	// prettier-ignore
	.add('EQUALS', '==', new SimpleConditional('equals', '=', (leftValue, rightValue) => leftValue === rightValue))
	.add('NOT_EQUAL', '!=', new SimpleConditional('notEqual', '!=', (leftValue, rightValue) => leftValue !== rightValue))
	.add('LESS_THAN', '<', new SimpleConditional('lessThan', '<', (leftValue, rightValue) => leftValue < rightValue))
	.add(
		'LESS_THAN_OR_EQUALS',
		'<=',
		new SimpleConditional('lessThanOrEquals', '<=', (leftValue, rightValue) => leftValue <= rightValue)
	)
	.add(
		'GREATER_THAN',
		'>',
		new SimpleConditional('greaterThan', '>', (leftValue, rightValue) => leftValue > rightValue)
	)
	.add(
		'GREATER_THAN_OR_EQUALS',
		'>=',
		new SimpleConditional('greaterThanOrEquals', '>=', (leftValue, rightValue) => leftValue >= rightValue)
	)
	.finish();
