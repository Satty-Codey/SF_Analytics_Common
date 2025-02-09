// @flow
import Codeable from 'Common/src/lang/Codeable.js';

/**
 * Codeable representing the sort order direction used in API
 */
export default class ApiSortDirection extends Codeable<ApiSortDirection> {
	static ASC: ApiSortDirection;
	static DESC: ApiSortDirection;
}

ApiSortDirection.add('ASC', 'ascending', new ApiSortDirection())
	.add('DESC', 'descending', new ApiSortDirection())
	.finish();

export const DEFAULT_API_SORT_DIRECTION = ApiSortDirection.DESC;
