/**
 * Constructs an authorization URL for an upstream service.
 *
 * @param {Object} options
 * @param {string} options.upstream_url - The base URL of the upstream service.
 * @param {string} options.client_id - The client ID of the application.
 * @param {string} options.redirect_uri - The redirect URI of the application.
 * @param {string} [options.state] - The state parameter.
 *
 * @returns {string} The authorization URL.
 */
export function getUpstreamAuthorizeUrl({
	upstream_url,
	client_id,
	scope,
	redirect_uri,
	state,
}: {
	upstream_url: string;
	client_id: string;
	scope: string;
	redirect_uri: string;
	state?: string;
}) {
	const upstream = new URL(upstream_url);
	upstream.searchParams.set("client_id", client_id);
	upstream.searchParams.set("redirect_uri", redirect_uri);
	upstream.searchParams.set("scope", scope);
	if (state) upstream.searchParams.set("state", state);
	upstream.searchParams.set("response_type", "code");
	return upstream.href;
}

/**
 * Fetches an authorization token from an upstream service.
 *
 * @param {Object} options
 * @param {string} options.client_id - The client ID of the application.
 * @param {string} options.client_secret - The client secret of the application.
 * @param {string} options.code - The authorization code.
 * @param {string} options.redirect_uri - The redirect URI of the application.
 * @param {string} options.upstream_url - The token endpoint URL of the upstream service.
 *
 * @returns {Promise<[string, null] | [null, Response]>} A promise that resolves to an array containing the access token or an error response.
 */

export interface StravaAuthResponse {
	token_type: string;
	expires_at: number;
	expires_in: number;
	refresh_token: string;
	access_token: string;
	athlete: {
		id: number;
		username: string;
		resource_state: number;
		firstname: string;
		lastname: string;
		bio: string | null;
		city: string;
		state: string;
		country: string;
		sex: string | null;
		premium: boolean;
		summit: boolean;
		created_at: string;
		updated_at: string;
		badge_type_id: number;
		weight: number | null;
		profile_medium: string;
		profile: string;
		friend: boolean | null;
		follower: boolean | null;
	};
}


export async function fetchUpstreamAuthToken({
	client_id,
	client_secret,
	code,
	redirect_uri,
	upstream_url,
}: {
	code: string | undefined;
	upstream_url: string;
	client_secret: string;
	redirect_uri: string;
	client_id: string;
}): Promise<[StravaAuthResponse, null] | [null, Response]> {
	if (!code) {
		return [null, new Response("Missing code", { status: 400 })];
	}

	const resp = await fetch(upstream_url, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({ client_id, client_secret, code, redirect_uri }).toString(),
	});
	if (!resp.ok) {
		console.log(await resp.text());
		return [null, new Response("Failed to fetch access token", { status: 500 })];
	}
	const body = (await resp.json()) as StravaAuthResponse;
	const accessToken = body.access_token;
	if (!accessToken) {
		return [null, new Response("Missing access token", { status: 400 })];
	}
	return [body, null];
}