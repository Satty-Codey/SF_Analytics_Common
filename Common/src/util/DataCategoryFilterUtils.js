//@flow
import _ from 'lodash';

import LC from 'Common/src/localization/LC.js';

export type DataCategoryFilterOption = {
	value: string,
	label: string,
	id: string,
	depth?: number,
	hasChildNodes?: boolean,
	highlight?: boolean,
	...
};

type Category = {
	categoryId: string,
	categoryName: string,
	childNodes?: Array<Category>
};
/**
 * Util for data category filters
 * @author b.yan
 * @since 226
 */
export default class DataCategoryFilterUtils {
	static MAX_ACTIVE_GROUPS: number = 6;
	static MAX_CATEGORIES_PER_GROUP: number = 500;
	static FILTER_LIMIT: number =
		DataCategoryFilterUtils.MAX_ACTIVE_GROUPS * DataCategoryFilterUtils.MAX_CATEGORIES_PER_GROUP;

	/**
	 * Filters the options available to select. Search will simply highlight the options, not filter them out.
	 * Limit takes precendece. For example, if I have a "All, Tucson, California, San Francisco" with limit of 1 and search
	 * value of 'c', only 'All' is returned and displayed even though 'c' is not present.
	 */
	static filterOptions({
		inputValue,
		limit = 10,
		options
	}: {
		inputValue: string,
		limit?: number,
		options: Array<DataCategoryFilterOption>
	}): Array<DataCategoryFilterOption> {
		const inputValueRegExp = new RegExp(_.escapeRegExp(inputValue), 'ig');
		options.forEach((option) => {
			const searchTermFound = option.label ? option.label.match(inputValueRegExp) : false;
			if (searchTermFound && inputValue !== '') {
				option.highlight = true;
			} else {
				option.highlight = false;
			}
		});
		return options.slice(0, limit);
	}

	/**
	 * Returns all the operators for data category filters
	 */
	static getDataCategoryOperators(): Array<{id: string, label: string, value: string}> {
		const reportBuilder = 'reportBuilder';
		const atLabel = LC.getLabel(reportBuilder, 'at');
		const aboveLabel = LC.getLabel(reportBuilder, 'above');
		const belowLabel = LC.getLabel(reportBuilder, 'below');
		const aboveOrBelowLabel = LC.getLabel(reportBuilder, 'aboveOrBelow');
		const DATA_CATEGORY_OPERATORS = [
			{label: atLabel, value: 'at', id: 'at'},
			{label: aboveLabel, value: 'av', id: 'av'},
			{label: belowLabel, value: 'be', id: 'be'},
			{label: aboveOrBelowLabel, value: 'ab', id: 'ab'}
		];
		return DATA_CATEGORY_OPERATORS;
	}

	/**
	 * Modifies the passed in categoryValues array and adds information about the
	 * data cateory used for rendering.
	 */
	static getCategoryValuesDFS(
		categoryValues: Array<DataCategoryFilterOption>,
		categories: Array<Category>,
		depth: number
	) {
		for (let i = 0; i < categories.length; i++) {
			const hasChildNodes = !!categories[i].childNodes;
			categoryValues.push({
				label: categories[i].categoryName,
				value: categories[i].categoryId,
				id: categories[i].categoryId,
				depth: depth,
				hasChildNodes: hasChildNodes
			});
			if (hasChildNodes) {
				// $FlowFixMe[incompatible-call]
				DataCategoryFilterUtils.getCategoryValuesDFS(categoryValues, categories[i].childNodes, depth + 1);
			}
		}
	}

	/**
	 * Returns which operators are valid for the currnt filter depending on the other filters
	 * for that category on thh report.
	 */
	static getCategoryGroupOperators(
		filter: {operator?: string, categoryGroupId?: string, categoryValueId?: string, ...},
		existingDataCategoryFilters: {
			[key: string]: Array<{categoryGroupId: string, categoryId: string, operation: string}>,
			...
		},
		currentCategory: string
	): string {
		const existingFilters = existingDataCategoryFilters[currentCategory];
		// No other filters for that category group
		if (!existingFilters) {
			return 'ALL';
		}
		// Since all filters of the same category must use the same operator, doesn't matter which one we pick,
		// so just pick the first one
		const existingFilter = existingFilters[0];
		// Only one filter for that category group
		if (existingFilters.length === 1) {
			// If it is the filter we are modifying, allow all operators
			if (
				filter.categoryGroupId === existingFilter.categoryGroupId &&
				filter.categoryValueId === existingFilter.categoryId &&
				filter.operator === existingFilter.operation
			) {
				return 'ALL';
			} else {
				// If we're creating a new filter, restrict the operators
				return existingFilter.operation;
			}
		} else {
			// Filters of the same category now restrict operators for each other
			return existingFilter.operation;
		}
	}
}
