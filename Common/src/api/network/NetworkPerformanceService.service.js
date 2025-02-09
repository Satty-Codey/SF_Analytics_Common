// @flow

/**
 * Network Json to store speed and size
 */
export type NetworkJson = {
	speed?: number,
	duration?: number
};

/**
 * Network Service APIs.
 */
export interface NetworkPerformanceService {
	getDownloadSpeed(size: number): Promise<NetworkJson>;
}

// Declare export type for Flow.
declare export default NetworkPerformanceService;
