import type { AuthRequest, OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import { Hono } from "hono";
import { fetchUpstreamAuthToken, getUpstreamAuthorizeUrl } from "./utils";
import { getLoggedInAthlete } from "./strava-api";

const app = new Hono<{ Bindings: Env & { OAUTH_PROVIDER: OAuthHelpers } }>();

// Context from the auth process, encrypted & stored in the auth token
// and provided to the DurableMCP as this.props
export type Props = {
	userId: string;
	firstName: string;
	lastName: string;
	accessToken: string;
};

/**
 * OAuth Authorization Endpoint
 *
 * This route initiates the Strava OAuth flow when a user wants to log in.
 * It creates a random state parameter to prevent CSRF attacks and stores the
 * original OAuth request information in KV storage for later retrieval.
 * Then it redirects the user to Strava's authorization page with the appropriate
 * parameters so the user can authenticate and grant permissions.
 */
app.get("/authorize", async (c) => {
	const oauthReqInfo = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw);
	if (!oauthReqInfo.clientId) {
		return c.text("Invalid request", 400);
	}

	return Response.redirect(
		getUpstreamAuthorizeUrl({
			upstream_url: "https://www.strava.com/api/v3/oauth/authorize",
			scope: "read,read_all,profile:read_all,profile:write,activity:read,activity:read_all,activity:write",
			client_id: c.env.STRAVA_CLIENT_ID,
			redirect_uri: new URL("/callback", c.req.url).href,
			state: btoa(JSON.stringify(oauthReqInfo)),
		}),
	);
});

/**
 * OAuth Callback Endpoint
 *
 * This route handles the callback from Strava after user authentication.
 * It exchanges the temporary code for an access token, then stores some
 * user metadata & the auth token as part of the 'props' on the token passed
 * down to the client. It ends by redirecting the client back to _its_ callback URL
 */
app.get("/callback", async (c) => {
	// Get the oathReqInfo out of KV
	const oauthReqInfo = JSON.parse(atob(c.req.query("state") as string)) as AuthRequest;
	if (!oauthReqInfo.clientId) {
		return c.text("Invalid state", 400);
	}

	// Exchange the code for an access token
	const [accessToken, errResponse] = await fetchUpstreamAuthToken({
		upstream_url: "https://www.strava.com/api/v3/oauth/token",
		client_id: c.env.STRAVA_CLIENT_ID,
		client_secret: c.env.STRAVA_CLIENT_SECRET,
		code: c.req.query("code"),
		redirect_uri: new URL("/callback", c.req.url).href,
	});
	if (errResponse) return errResponse;

	// Fetch the user info from GitHub
	const user = await getLoggedInAthlete(accessToken);
	const { id, firstname, lastname } = user;

	// Return back to the MCP client a new token
	const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
		request: oauthReqInfo,
		userId: id.toString(),
		metadata: {
			label: `${firstname} ${lastname}`,
		},
		scope: oauthReqInfo.scope,
		// This will be available on this.props inside MyMCP
		props: {
			userId: id.toString(),
			firstName: firstname,
			lastName: lastname,
			accessToken,
		} as Props,
	});

	return Response.redirect(redirectTo);
});

export const StravaHandler = app;
