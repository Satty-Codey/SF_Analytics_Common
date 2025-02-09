// @flow
import ReactDOM from 'react-dom';

import {getCookie, setCookie, clearCookie} from 'Common/src/util/Cookies.js';
import {getQueryParams} from 'Common/src/url/UrlUtil.js';

// Cookie names where we store the override info for communication with the Node server.
const SID_COOKIE = 'devOverrideSid';
const HOST_COOKIE = 'devOverrideHost';
const CSRF_TOKEN_COOKIE = 'devOverrideCsrfToken';
const LOGGED_IN_USER_ID_COOKIE = 'devOverrideUserId';

// Saved state related to the OAuth2 single page app flow (https://www.oauth.com/oauth2-servers/single-page-apps/).
const OAUTH_STATE_STORAGE_KEY = 'oauth2.state';
const OAUTH_ACCESS_TOKEN_STORAGE_KEY = 'oauth2.accessToken';
const OAUTH_INSTANCE_URL_STORAGE_KEY = 'oauth2.instanceUrl';

// Hash and query params used by the OAuth2 device flow.
const CODE_URL_PARAM = 'code';
const ERROR_URL_PARAM = 'error';
const ERROR_DESCRIPTION_URL_PARAM = 'error_description';
const STATE_URL_PARAM = 'state';

// Client ID of our OAuth Connected App.
const CLIENT_ID = '3MVG9SemV5D80oBcUNeBOF6f8401uEl.6281nJhQtYn75HQ4wFbjIpJ9Pa0JK1lv51OptcpiyEicKzjHHCqeD';

type Override = {
	host: string | null,
	sid: string | null,
	csrfToken: string | null,
	userId: string | null
};

/**
 * Util to handle dealing with the local dev proxy.
 *
 * @author gkiel
 */

/**
 * Check whether an override exists.
 */
export function hasOverride(): boolean {
	return [HOST_COOKIE, SID_COOKIE, CSRF_TOKEN_COOKIE, LOGGED_IN_USER_ID_COOKIE].every(
		(name) => getCookie(name) != null
	);
}

/**
 * Get the current override.
 */
export function getOverride(): Override {
	return {
		host: getCookie(HOST_COOKIE),
		sid: getCookie(SID_COOKIE),
		csrfToken: getCookie(CSRF_TOKEN_COOKIE),
		userId: getCookie(LOGGED_IN_USER_ID_COOKIE)
	};
}

/**
 * Set a new override.
 */
export function setOverride(host: string, sid: string, csrfToken: string, userId: string): Override {
	setCookie(HOST_COOKIE, host);
	setCookie(SID_COOKIE, sid);
	setCookie(CSRF_TOKEN_COOKIE, csrfToken);
	setCookie(LOGGED_IN_USER_ID_COOKIE, userId);

	return getOverride();
}

/**
 * Clear the current override.
 */
export function clearOverride(): void {
	clearCookie(HOST_COOKIE);
	clearCookie(SID_COOKIE);
	clearCookie(CSRF_TOKEN_COOKIE);
	clearCookie(LOGGED_IN_USER_ID_COOKIE);
}

/**
 * Initialize the OAuth device flow by either redirecting to the OAuth login screen or initializing the cookies
 * required by the proxy after redirecting back from login.
 */
async function initializeOAuthDeviceFlow(): Promise<boolean> {
	const queryParams = getQueryParams(window.location.href);
	const code = queryParams.get(CODE_URL_PARAM);
	const errorCode = queryParams.get(ERROR_URL_PARAM);
	const errorDescription = queryParams.get(ERROR_DESCRIPTION_URL_PARAM);

	// These need to be explicitly allowed in the connected app.
	const redirectUri = window.location.origin.includes('localhost')
		? 'http://localhost:8080/Client/ui/wave.html'
		: 'https://autonomousanalytics.sfdc.sh/Client/ui/wave.html';

	if (errorCode != null) {
		// If an error occurred, it's likely due to our connected app being blocked for some reason. Reloading in a
		// fresh tab seems to generally resolve these.
		handleOAuthError(errorCode, errorDescription);

		return true;
	} else if (code == null) {
		// If an OAuth authorization code isn't present, redirect to the OAuth login page if authentication is required.
		if (__REQUIRE_OAUTH__ && !hasOverride()) {
			// Generate a random nonce which we will expect to be present after the redirect.
			const state = Math.random().toString(36).substring(2, 15);

			// Store it in local storage to validate on the way back in.
			sessionStorage.setItem(OAUTH_STATE_STORAGE_KEY, state);

			window.location.replace(
				`https://login.salesforce.com/services/oauth2/authorize` +
					`?client_id=${CLIENT_ID}` +
					`&redirect_uri=${redirectUri}` +
					`&state=${state}` +
					`&response_type=code` +
					`&prompt=login`
			);

			return true;
		}

		return false;
	}

	try {
		let instanceUrl = sessionStorage.getItem(OAUTH_INSTANCE_URL_STORAGE_KEY);
		let accessToken = sessionStorage.getItem(OAUTH_ACCESS_TOKEN_STORAGE_KEY);

		if (accessToken == null || instanceUrl == null) {
			// If we don't have a saved access token, we need to fetch one.
			const savedState = sessionStorage.getItem(OAUTH_STATE_STORAGE_KEY);
			const state = queryParams.get(STATE_URL_PARAM);
			// Validate the OAuth state parameter to prevent CSRF attacks.
			if (savedState == null || state == null || state !== savedState) {
				throw new Error('Invalid state parameter.');
			}

			const accessTokenResponse = await fetch(`/accessToken`, {
				method: 'POST',
				body: JSON.stringify({
					code,
					redirectUri,
					clientId: CLIENT_ID
				}),
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!accessTokenResponse.ok) {
				throw new Error(`Error fetching access token: "${accessTokenResponse.statusText}".`);
			}

			const responseJson = await accessTokenResponse.json();

			instanceUrl = responseJson.instanceUrl;
			accessToken = responseJson.accessToken;

			sessionStorage.setItem(OAUTH_INSTANCE_URL_STORAGE_KEY, instanceUrl);
			sessionStorage.setItem(OAUTH_ACCESS_TOKEN_STORAGE_KEY, accessToken);
		}

		const csrfTokenResponse = await fetch(`/csrfToken`, {
			method: 'POST',
			body: JSON.stringify({
				instanceUrl,
				accessToken
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!csrfTokenResponse.ok) {
			throw new Error(`Error fetching CSRF token for use with proxy: "${csrfTokenResponse.statusText}".`);
		}

		const {csrfToken, userId} = await csrfTokenResponse.json();

		setOverride(instanceUrl, accessToken, csrfToken, userId);
	} catch (error) {
		// If an error occurs, it could be due to a session timeout. Clear credentials and prompt a new login.
		handleOAuthError(error.message);

		return true;
	}

	return false;
}

/**
 * Revoke the current access token.
 */
export async function revokeToken() {
	const instanceUrl = sessionStorage.getItem(OAUTH_INSTANCE_URL_STORAGE_KEY);
	const accessToken = sessionStorage.getItem(OAUTH_ACCESS_TOKEN_STORAGE_KEY);

	// Clear local state.
	sessionStorage.removeItem(OAUTH_STATE_STORAGE_KEY);
	sessionStorage.removeItem(OAUTH_INSTANCE_URL_STORAGE_KEY);
	sessionStorage.removeItem(OAUTH_ACCESS_TOKEN_STORAGE_KEY);
	clearOverride();

	if (instanceUrl == null || accessToken == null) {
		return;
	}

	const response = await fetch(`/revokeToken`, {
		method: 'POST',
		body: JSON.stringify({
			instanceUrl,
			accessToken
		}),
		headers: {
			'Content-Type': 'application/json'
		},
		keepalive: true
	});

	if (!response.ok) {
		throw new Error(`Error revoking access token: "${response.statusText}".`);
	}
}

/**
 * Validate that the OAuth proxy is configured as expected on the initialiation of an app. Takes a container element into
 * which fallback content will be rendered if settings are invalid. Throws if configuration is invalid.
 */
export async function validateProxySettings(): Promise<void> {
	if (__REQUIRE_OAUTH__) {
		// OAuth is required.
		await initializeOAuthDeviceFlow();
	} else if (__DEV_PROXY__ && !hasOverride()) {
		// Proxy build but OAuth Override is not configured, warn.
		ReactDOM.render(
			<p>
				This is a proxy build but the OAuth Override proxy is not configured. After building the OAuth Override app with{' '}
				<code>npm run build oauth</code>, configure the proxy on{' '}
				<a href="/OAuthOverride/gen/index.html">the OAuth Override page</a>.
			</p>,
			document.body
		);

		throw new Error('This is a proxy build but the OAuth Override proxy is not configured.');
	} else if (!__DEV_PROXY__ && hasOverride()) {
		// Not a proxy build but OAuth Override is configured, warn.
		ReactDOM.render(
			<div>
				<p>
					The OAuth Override proxy is configured but this is not a proxy build. Either clear the override and refresh or
					rebuild the app in proxy mode via <code>npm start &lt;project&gt; -- --mode=proxy</code>.
				</p>
				<button onClick={clearOverride}>Clear Override</button>
			</div>,
			document.body
		);

		throw new Error('This is a proxy build but the OAuth Override proxy is not configured.');
	}
}

/**
 * Deal with an error during OAuth device flow.
 */
function handleOAuthError(errorMessage: string, errorDescription: string = ''): void {
	alert(
		`Authentication failed. Please close the window and try again.\n\n` +
			`Message: "${errorMessage}"\n` +
			`Description: "${errorDescription}"`
	);

	clearOverride();
}
