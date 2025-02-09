// @flow
import type {NetworkJson, NetworkPerformanceService} from 'Common/src/api/network/NetworkPerformanceService.service.js';
import RequestMethod from 'Common/src/api/RequestMethod.js';
import SfdcRestApi from 'Common/src/api/sfdc/SfdcRestApi.js';

const NETWORK_API: string = '/services/network';

/**
 * REST version of the API for Network Details.
 * Upload speed, download speed, latency, octane score

 *  @author anunay.aatipamula
 *  @since 244
 */
export class RestNetworkPerformanceService
	extends SfdcRestApi<NetworkPerformanceService>
	implements NetworkPerformanceService
{
	async getDownloadSpeed(size: number): Promise<NetworkJson> {
		const startTime = performance.now();
		const networkJson = await this._makeRequest(`${NETWORK_API}/speedTest?type=download&s=${size}&t=${startTime}`, {
			method: RequestMethod.GET
		}).then(() => {
			const duration = performance.now() - startTime;
			return {
				speed: Number.parseFloat(((size * 8) / duration).toFixed(2)),
				duration
			};
		});
		return networkJson;
	}
}
export default (new RestNetworkPerformanceService(): RestNetworkPerformanceService);
