// @flow
import {startsWith} from 'Common/src/util/StringUtil.js';

const WILDCARD_REG_EXP = new RegExp('[\\w~\\-]+');

/**
 * Validate URLs.
 */
export default class UrlValidator {
	/**
	 * Validates an absolute url against the set of valid origins. This is done by making sure the url is http or https
	 * and that the url origin is valid against the set of valid origins.
	 */
	validateUrl(url: string, validOrigins: Array<string>): boolean {
		if (!url) {
			return false;
		}

		// only accept http or https (no relative url)
		const isHttp = startsWith(url, 'http://');
		const isHttps = startsWith(url, 'https://');
		if (!isHttp && !isHttps) {
			return false;
		}

		// let's isolate the origin (http://<domain>/<rest> -> http://<domain>)
		const origin = url.split('/').slice(0, 3).join('/');

		// and only accept origins which are part of our cross domain list
		return this.validateOrigin(origin, validOrigins);
	}

	/**
	 * Validates an origin against the set of valid origins.
	 */
	validateOrigin(origin: string, validOrigins: Array<string>): boolean {
		const originDomain = this._stripProtocolAndPort(origin);

		for (let validOrigin of validOrigins) {
			if (!this._validateProtocol(validOrigin, origin)) {
				continue;
			}

			validOrigin = this._stripProtocolAndPort(validOrigin);

			if (validOrigin === originDomain) {
				return true;
			}

			const validOriginParts = validOrigin.split('.');
			const originDomainParts = originDomain.split('.');
			let i = validOriginParts.length - 1;
			let j = originDomainParts.length - 1;

			let isValid = true;
			while (i > -1 && j > -1) {
				if (validOriginParts[i] !== originDomainParts[j]) {
					if (validOriginParts[i] !== '*' || !originDomainParts[j].match(WILDCARD_REG_EXP)) {
						isValid = false;
						break;
					}
				}
				i--;
				j--;
			}

			if (!isValid) {
				continue;
			}

			if (j > i) {
				if (validOriginParts[0] === '*') {
					while (j > -1) {
						if (!originDomainParts[j].match(WILDCARD_REG_EXP)) {
							isValid = false;
							break;
						}
						j--;
					}
				} else {
					isValid = false;
				}
			}
			if (isValid && j === i) {
				return true;
			}
		}
		return false;
	}

	_validateProtocol(url1: string, url2: string): boolean {
		const index1 = url1.indexOf('://');
		const index2 = url2.indexOf('://');

		if (index1 !== index2) {
			return false;
		}

		if (index1 === -1) {
			return true;
		}

		const protocol1 = url1.substring(0, index1);
		const protocol2 = url2.substring(0, index2);

		return protocol1 === protocol2;
	}

	_stripProtocolAndPort(url: string): string {
		if (!url) {
			return url;
		}

		let rewrittenUrl = url;

		if (rewrittenUrl.indexOf('http://') === 0) {
			rewrittenUrl = rewrittenUrl.substring('http://'.length);
		} else {
			rewrittenUrl = rewrittenUrl.substring('https://'.length);
		}

		const index = rewrittenUrl.lastIndexOf(':');
		if (index > -1) {
			rewrittenUrl = rewrittenUrl.substring(0, index);
		}

		return rewrittenUrl.toLowerCase();
	}
}
