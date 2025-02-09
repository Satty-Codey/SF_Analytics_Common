//@flow
import AjaxService from 'Common/src/ajax/AjaxService.service.js';
import type {NetworkJson, NetworkPerformanceService} from 'Common/src/api/network/NetworkPerformanceService.service.js';

/**
 * REST version of the API for Network Details.
 * Upload speed, download speed, latency, octane score

 *  @author anunay.aatipamula
 *  @since 244
 */
export class LocalNetworkPerformanceService implements NetworkPerformanceService {
	async getDownloadSpeed(size: number): Promise<NetworkJson> {
		const startTime = performance.now();
		return Promise.resolve(AjaxService.fetch('/WaveCommon/repo/dashboards/DashboardInspector_NetworkAsset.json')).then(
			() => {
				const duration = performance.now() - startTime;
				return {
					speed: Number.parseFloat(((size * 8) / duration).toFixed(2)),
					duration
				};
			}
		);
	}
}

export default (new LocalNetworkPerformanceService(): LocalNetworkPerformanceService);
