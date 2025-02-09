// @flow
import Codeable from 'Common/src/lang/Codeable.js';

/**
 * Codeable representing the sort order used in API
 */
export default class ApiSortOrder extends Codeable<ApiSortOrder> {
	static MRU: ApiSortOrder;
	static NAME: ApiSortOrder;
	static LAST_MODIFIED: ApiSortOrder;
	static LAST_MODIFIED_BY: ApiSortOrder;
	static OWNER: ApiSortOrder;
	static CREATED_BY: ApiSortOrder;
	static CREATED_DATE: ApiSortOrder;
	static TYPE: ApiSortOrder;
	static APP: ApiSortOrder;
	static FOLDER: ApiSortOrder;
	static LOCATION: ApiSortOrder;
	static STATUS: ApiSortOrder;
	static OUTCOME: ApiSortOrder;
	static RUNDATE: ApiSortOrder;
	static REFRESHDATE: ApiSortOrder;
}

ApiSortOrder.add('MRU', 'mru', new ApiSortOrder())
	.add('NAME', 'name', new ApiSortOrder())
	.add('LAST_MODIFIED', 'lastmodified', new ApiSortOrder())
	.add('LAST_MODIFIED_BY', 'lastmodifiedby', new ApiSortOrder())
	// Additional sort orders for column header sorting, currently only supported by SOSL
	.add('OWNER', 'owner', new ApiSortOrder())
	.add('CREATED_BY', 'createdby', new ApiSortOrder())
	.add('CREATED_DATE', 'createddate', new ApiSortOrder())
	.add('TYPE', 'type', new ApiSortOrder())
	.add('APP', 'app', new ApiSortOrder())
	.add('FOLDER', 'folder', new ApiSortOrder())
	.add('LOCATION', 'location', new ApiSortOrder())
	.add('STATUS', 'status', new ApiSortOrder())
	.add('OUTCOME', 'outcome', new ApiSortOrder())
	.add('REFRESHDATE', 'refreshdate', new ApiSortOrder())
	.add('RUNDATE', 'rundate', new ApiSortOrder())
	.finish();

export const DEFAULT_API_SORT_ORDER = ApiSortOrder.MRU;
