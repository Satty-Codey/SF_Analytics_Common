// @flow

/**
 * Produces SHA-256 hashed data using Web Crypto API
 * Referenced from: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
 */

/**
 * Generates the SHA-256 hash in ArrayBuffer format
 */
async function createSha256Digest(data: string): Promise<ArrayBuffer> {
	const encodedData = new TextEncoder().encode(data);
	// $FlowFixMe[cannot-resolve-name] - crypto is not recognized
	return crypto.subtle.digest('SHA-256', encodedData);
}

/**
 * SHA-256 hash the given string
 */
export async function hashSha256(data: string): Promise<string> {
	const hashBuffer = await createSha256Digest(data);
	const hashedArray = Array.from(new Uint8Array(hashBuffer));
	const hashedHexString = hashedArray.map((hash) => hash.toString(16).padStart(2, '0')).join('');
	return hashedHexString;
}
