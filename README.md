# Model Context Protocol (MCP) Server + Strava OAuth

This is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) server that supports remote MCP connections, with Strava OAuth built-in. It allows users to connect to your MCP server by signing in with their Strava account.

## Overview

The MCP server (powered by [Cloudflare Workers](https://developers.cloudflare.com/workers/)) serves two roles:
- Acts as an OAuth Server for your MCP clients
- Acts as an OAuth Client for Strava's OAuth services

This project serves as a reference example for integrating OAuth providers with an MCP server deployed to Cloudflare, using the [`workers-oauth-provider` library](https://github.com/cloudflare/workers-oauth-provider).

## Prerequisites

- A Strava account
- A Cloudflare account
- Node.js and npm installed
- Wrangler CLI installed (`npm install -g wrangler`)

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/kw510/strava-mcp.git
   cd strava-mcp
   npm install
   ```

2. Set up your Strava API credentials (see [Setting Up Strava API Credentials](#setting-up-strava-api-credentials))

3. Set up your Cloudflare KV namespace:
   ```bash
   wrangler kv:namespace create "OAUTH_KV"
   ```
   Update the `wrangler.toml` file with the generated KV ID.

4. Deploy to Cloudflare:
   ```bash
   wrangler deploy
   ```

## Setting Up Strava API Credentials

### For Production
1. Go to [Strava's API Settings](https://www.strava.com/settings/api) and create a new application
2. Configure your application:
   - Application Name: Choose a name for your application
   - Category: Select an appropriate category
   - Website: Your website URL
   - Application Description: Brief description of your application
   - Authorization Callback Domain: `mcp-strava-oauth.<your-subdomain>.workers.dev`
   - Authorization Callback URL: `https://mcp-strava-oauth.<your-subdomain>.workers.dev/callback`

3. Set your production environment variables:
   ```bash
   wrangler secret put STRAVA_CLIENT_ID
   wrangler secret put STRAVA_CLIENT_SECRET
   ```

### For Development
1. Create a separate Strava API application for development
2. Configure your development application:
   - Authorization Callback Domain: `localhost`
   - Authorization Callback URL: `http://localhost:8788/callback`

3. Create a `.dev.vars` file in your project root:
   ```
   STRAVA_CLIENT_ID=your_development_strava_client_id
   STRAVA_CLIENT_SECRET=your_development_strava_client_secret
   ```

## Testing Your MCP Server

### Using Inspector
1. Install the Inspector tool:
   ```bash
   npx @modelcontextprotocol/inspector@latest
   ```

2. Connect to your server:
   - For production: `https://mcp-strava-oauth.<your-subdomain>.workers.dev/sse`
   - For development: `http://localhost:8788/sse`

### Using Claude Desktop
1. Open Claude Desktop and go to Settings -> Developer -> Edit Config
2. Add your MCP server configuration:
   ```json
   {
     "mcpServers": {
       "strava": {
         "command": "npx",
         "args": [
           "mcp-remote",
           "https://mcp-strava-oauth.<your-subdomain>.workers.dev/sse"
         ]
       }
     }
   }
   ```
3. Restart Claude Desktop and complete the OAuth flow

## Development

### Local Development
1. Start the development server:
   ```bash
   wrangler dev
   ```

2. The server will be available at `http://localhost:8788`

### API Rate Limits
The Strava API has the following rate limits:
- 200 requests every 15 minutes
- 2,000 requests per day

## How It Works

### OAuth Provider
The OAuth Provider library handles:
- OAuth 2.1 server implementation
- Token issuance and validation
- Secure token storage in KV
- Strava OAuth integration

### Durable MCP
Provides:
- Persistent state management
- Secure authentication context storage
- User information access via `this.props`
- Conditional tool availability

### MCP Remote
Enables:
- Client-server communication
- Tool definition and management
- Request/response serialization
- SSE connection maintenance

## Troubleshooting

- If you see error messages in Claude Desktop, verify the connection by hovering over the 🔨 icon
- For Cursor integration, use the "Command" type and combine command and args into one string
- Ensure your callback URLs match exactly with what's configured in your Strava application
