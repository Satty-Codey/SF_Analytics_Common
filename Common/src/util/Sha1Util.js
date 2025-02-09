// @flow
import {encodeUtf8} from 'Common/src/util/Utf8Util.js';

/**
 * Borrowed from:
 *  SHA-1 implementation in JavaScript | (c) Chris Veness 2002-2010 | www.movable-type.co.uk
 *   - see http://csrc.nist.gov/groups/ST/toolkit/secure_hashing.html
 *         http://csrc.nist.gov/groups/ST/toolkit/examples.html
 */

/**
 * Takes three 32 bit words and produces a single 32 bit word.
 */
function to32BitWord(s: number, x: number, y: number, z: number): number {
	switch (s) {
		case 0:
			return (x & y) ^ (~x & z);
		case 1:
		case 3:
			return x ^ y ^ z;
		case 2:
			return (x & y) ^ (x & z) ^ (y & z);
		default:
			throw new Error('Invalid input');
	}
}

/**
 * Rotate left (circular left shift).
 */
function rotateLeft(x: number, n: number): number {
	return (x << n) | (x >>> (32 - n));
}

/**
 * Convert number to hexadecimal string.
 */
function toHexStr(n: number): string {
	let s = '';
	let i = 8;
	while (--i) {
		const v = (n >>> (i * 4)) & 0xf;
		s += v.toString(16);
	}
	return s;
}

/**
 * SHA1 hash the given string.
 */
export function hashSha1(data: string, shouldUtf8encode: boolean = true): string {
	// convert string to UTF-8 if necessary
	let msg = shouldUtf8encode ? encodeUtf8(data) : data;

	// constants
	const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
	// preprocess
	msg += String.fromCharCode(0x80);
	// convert string into 512-bit/16-integer block arrays of ints
	const l = msg.length / 4 + 2;
	const N = Math.ceil(l / 16);
	const M = new Array<Array<number>>(N);
	let i = -1;
	while (++i < N) {
		M[i] = new Array(16);
		let j = -1;
		while (++j < 16) {
			M[i][j] =
				(msg.charCodeAt(i * 64 + j * 4) << 24) |
				(msg.charCodeAt(i * 64 + j * 4 + 1) << 16) |
				(msg.charCodeAt(i * 64 + j * 4 + 2) << 8) |
				msg.charCodeAt(i * 64 + j * 4 + 3);
		}
	}
	M[N - 1][14] = Math.floor(((msg.length - 1) * 8) / Math.pow(2, 32));
	M[N - 1][15] = ((msg.length - 1) * 8) & 0xffffffff;

	let H0 = 0x67452301;
	let H1 = 0xefcdab89;
	let H2 = 0x98badcfe;
	let H3 = 0x10325476;
	let H4 = 0xc3d2e1f0;

	const W = new Array<number>(80);
	i = -1;
	while (++i < N) {
		let t = -1;
		while (++t < 16) {
			W[t] = M[i][t];
		}
		t = 15;
		while (++t < 80) {
			W[t] = rotateLeft(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
		}

		let a = H0;
		let b = H1;
		let c = H2;
		let d = H3;
		let e = H4;
		t = -1;
		while (++t < 80) {
			const s = Math.floor(t / 20);
			const T = (rotateLeft(a, 5) + to32BitWord(s, b, c, d) + e + K[s] + W[t]) & 0xffffffff;
			e = d;
			d = c;
			c = rotateLeft(b, 30);
			b = a;
			a = T;
		}
		H0 = (H0 + a) & 0xffffffff;
		H1 = (H1 + b) & 0xffffffff;
		H2 = (H2 + c) & 0xffffffff;
		H3 = (H3 + d) & 0xffffffff;
		H4 = (H4 + e) & 0xffffffff;
	}
	return toHexStr(H0) + toHexStr(H1) + toHexStr(H2) + toHexStr(H3) + toHexStr(H4);
}
