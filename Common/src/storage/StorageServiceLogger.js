// @flow
import Buoy from 'Common/src/core/buoy/Buoy.js';
import StorageServiceRipple from 'Common/src/core/buoy/storage/StorageServiceRipple.js';
import Enum from 'Common/src/lang/Enum.js';
import Codeable from 'Common/src/lang/Codeable.js';

/**
 * Type of storage service operation.
 */
export class StorageServiceOperation extends Enum<StorageServiceOperation> {
	static INIT: StorageServiceOperation;
	static GET: StorageServiceOperation;
	static GET_TTL_EXPIRED: StorageServiceOperation;
	static SET: StorageServiceOperation;
	static REMOVE: StorageServiceOperation;
	static SWEEP: StorageServiceOperation;
	static CLEAR: StorageServiceOperation;
}

StorageServiceOperation
	// prettier-ignore
	.add('INIT', new StorageServiceOperation())
	.add('GET', new StorageServiceOperation())
	.add('GET_TTL_EXPIRED', new StorageServiceOperation())
	.add('SET', new StorageServiceOperation())
	.add('REMOVE', new StorageServiceOperation())
	.add('SWEEP', new StorageServiceOperation())
	.add('CLEAR', new StorageServiceOperation());

/**
 * Logging mode to configure which set of logs to publish.
 */
export class StorageServiceLoggingMode extends Enum<StorageServiceLoggingMode> {
	// Create maximum set of log lines
	static ALL: StorageServiceLoggingMode;
	// Only create init-related log lines
	static INIT_ONLY: StorageServiceLoggingMode;
	static GET_SET_ONLY: StorageServiceLoggingMode;

	+supportedOperations: Set<StorageServiceOperation>;

	constructor(supportedOperations: Array<StorageServiceOperation> = []) {
		super();
		this.supportedOperations = new Set(supportedOperations);
	}
}

StorageServiceLoggingMode
	// prettier-ignore
	.add('ALL', new StorageServiceLoggingMode(StorageServiceOperation.enums()))
	.add('INIT_ONLY', new StorageServiceLoggingMode([StorageServiceOperation.INIT]))
	.add(
		'GET_SET_ONLY',
		new StorageServiceLoggingMode([
			// Always include INIT operation for logging
			StorageServiceOperation.INIT,
			StorageServiceOperation.GET,
			StorageServiceOperation.GET_TTL_EXPIRED,
			StorageServiceOperation.SET
		])
	);

/**
 * Type of storage service used for persisting values
 */
export class StorageType extends Codeable<StorageType> {
	// Aura storage
	static AURA_STORAGE: StorageType;
	// This is the ported version of Aura Storage (ie., StorageService)
	static WAVEUI_STORAGE_SERVICE: StorageType;
}

StorageType
	// prettier-ignore
	.add('AURA_STORAGE', 'aura', new StorageType())
	.add('WAVEUI_STORAGE_SERVICE', 'waveui', new StorageType());

/**
 * Logger for StorageService metrics
 */
export default class StorageServiceLogger {
	#buoy: Buoy;
	#name: string;
	#mode: StorageServiceLoggingMode;
	#browserName: string;
	#browserVersion: number | void;
	#storageType: StorageType;

	constructor(
		buoy: Buoy,
		name: string,
		mode: StorageServiceLoggingMode,
		storageType: StorageType,
		browserName: string,
		browserVersion: number | void
	) {
		this.#buoy = buoy;
		this.#name = name;
		this.#mode = mode;
		this.#storageType = storageType;
		this.#browserName = browserName;
		this.#browserVersion = browserVersion;
	}

	/**
	 * Logs a StorageService action along with its duration in milliseconds.
	 * The payload size will be 0 in the event of a cache miss or when an error occurs during request processing
	 */
	log({
		appInstanceId,
		cacheKey,
		operationType,
		runtime,
		payloadSize,
		error,
		details,
		valueFetchTime,
		valueLocator
	}: {
		appInstanceId?: string,
		cacheKey?: string,
		operationType: StorageServiceOperation,
		runtime: number,
		payloadSize?: number,
		error?: Error,
		details?: string,
		valueFetchTime?: number,
		valueLocator?: string
	}): void {
		if (!this.#mode.supportedOperations.has(operationType)) {
			return;
		}

		this.#buoy.trigger(
			new StorageServiceRipple({
				appInstanceId: appInstanceId,
				storageType: this.#storageType,
				storageName: this.#name,
				cacheKey: cacheKey,
				operationType: operationType,
				runtime: runtime,
				payloadSize: payloadSize,
				error: error?.message,
				details: details,
				valueFetchTime: valueFetchTime,
				valueLocator: valueLocator,
				browserName: this.#browserName,
				browserVersion: this.#browserVersion
			})
		);
	}
}
