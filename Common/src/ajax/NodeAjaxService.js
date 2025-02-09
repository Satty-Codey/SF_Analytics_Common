// @flow
/* eslint-env node */

import type {AjaxService, AjaxOptions, FetchRequestResult} from 'Common/src/ajax/AjaxService.service.js';

/**
 * Version of the Ajax service for making requests in Node.
 */
export class NodeAjaxService implements AjaxService {
	async fetch(path: string, options: AjaxOptions = {}): Promise<FetchRequestResult> {
		// Attempt to load from the local file system. This allows our local APIs which make HTTP requests to work in tests.

		// $FlowFixMe[unsupported-syntax]
		return require(path.substring(1));
	}

	async fetchResponse(path: string, options: AjaxOptions = {}): empty {
		throw new Error('Not implemented.');
	}
}

export default (new NodeAjaxService(): NodeAjaxService);
