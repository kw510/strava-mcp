import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "octokit";
import { type Props, StravaHandler } from "./strava-handler";


// To restrict access to specific users only, add their Strava userIDs to this Set.
// Leave it empty to allow access to all authenticated users.
const ALLOWED_USERIDS = new Set([
	// For example: '1234567890',
]);

export class StravaMCP extends McpAgent<Env, unknown, Props> {
	server = new McpServer({
		name: "Strava MCP",
		version: "1.0.0",
	});

	async init() {
		// Hello, world!
		this.server.tool(
			"add",
			"Add two numbers the way only MCP can",
			{ a: z.number(), b: z.number() },
			async ({ a, b }) => ({
				content: [{ type: "text", text: String(a + b) }],
			}),
		);

		// Use the upstream access token to facilitate tools
		this.server.tool(
			"userInfoOctokit",
			"Get user info from GitHub, via Octokit",
			{},
			async () => {
				const octokit = new Octokit({ auth: this.props.accessToken });
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(await octokit.rest.users.getAuthenticated()),
						},
					],
				};
			},
		);
	}
}

export default new OAuthProvider({
	apiRoute: "/sse",
	apiHandler: StravaMCP.mount("/sse"),
	defaultHandler: StravaHandler,
	authorizeEndpoint: "/authorize",
	tokenEndpoint: "/token",
	clientRegistrationEndpoint: "/register",
});
