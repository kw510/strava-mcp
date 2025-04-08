import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type Props, StravaHandler } from "./strava-handler";
import { StravaClient } from "./strava-api";

// To restrict access to specific users only, add their Strava userIDs to this Set.
// Leave it empty to allow access to all authenticated users.
const ALLOWED_USERIDS = new Set([
	// For example: '1234567890',
]);

const ActivityType = [
	'AlpineSki', 'BackcountrySki', 'Canoeing', 'Crossfit', 'EBikeRide',
	'Elliptical', 'Golf', 'Handcycle', 'Hike', 'IceSkate', 'InlineSkate',
	'Kayaking', 'Kitesurf', 'NordicSki', 'Ride', 'RockClimbing', 'RollerSki',
	'Rowing', 'Run', 'Sail', 'Skateboard', 'Snowboard', 'Snowshoe', 'Soccer',
	'StairStepper', 'StandUpPaddling', 'Surfing', 'Swim', 'Velomobile',
	'VirtualRide', 'VirtualRun', 'Walk', 'WeightTraining', 'Wheelchair',
	'Windsurf', 'Workout', 'Yoga'
] as const;

type ActivityType = typeof ActivityType[number];

export class StravaMCP extends McpAgent<unknown, unknown, Props> {
	server = new McpServer({
		name: "Strava MCP",
		version: "1.0.0",
	});

	async init() {
		this.server.tool(
			"getLoggedInAthlete",
			"Get user info from Strava",
			{},
			async () => {
				console.log("getLoggedInAthlete", this.props.accessToken);
				const athlete = await new StravaClient(this.props.accessToken).getLoggedInAthlete();
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(athlete),
						},
					],
				};
			},
		);

		// Activities
		this.server.tool(
			"createActivity",
			"Create a new activity on Strava",
			{
				name: z.string({ description: "The name of the activity" }),
				sport_type: z.enum(ActivityType, { description: "Sport type of the activity" }),
				start_date_local: z.string({ description: "ISO 8601 formatted date time" }),
				elapsed_time: z.number({ description: "Activity duration in seconds" }),
				distance: z.number({ description: "Distance in meters (optional)" }).optional(),
				description: z.string({ description: "Activity description (optional)" }).optional(),
			},
			async ({ name, sport_type, start_date_local, elapsed_time, distance, description }) => {
				const activity = await new StravaClient(this.props.accessToken).createActivity({
					name,
					sport_type,
					start_date_local,
					elapsed_time,
					distance,
					description,
				});
				return {
					content: [{
						type: "text",
						text: JSON.stringify(activity),
					}],
				};
			},
		);

		this.server.tool(
			"getActivity",
			"Get details of a specific activity",
			{
				id: z.number({ description: "Activity ID" }),
			},
			async ({ id }) => {
				const activity = await new StravaClient(this.props.accessToken).getActivity(id);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(activity),
					}],
				};
			},
		);

		this.server.tool(
			"listAthleteActivities",
			"List authenticated athlete's activities",
			{
				page: z.number({ description: "Page number (optional)" }).optional(),
				per_page: z.number({ description: "Items per page (optional)" }).optional(),
				before: z.number({ description: "Unix timestamp (optional)" }).optional(),
				after: z.number({ description: "Unix timestamp (optional)" }).optional(),
			},
			async ({ page, per_page, before, after }) => {
				const activities = await new StravaClient(this.props.accessToken).listAthleteActivities({
					page,
					per_page,
					before,
					after,
				});
				return {
					content: [{
						type: "text",
						text: JSON.stringify(activities),
					}],
				};
			},
		);

		// Clubs
		this.server.tool(
			"getClub",
			"Get details about a specific club",
			{
				id: z.number({ description: "Club ID" }),
			},
			async ({ id }) => {
				const club = await new StravaClient(this.props.accessToken).getClub(id);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(club),
					}],
				};
			},
		);

		this.server.tool(
			"listAthleteClubs",
			"List clubs for authenticated athlete",
			{},
			async () => {
				const clubs = await new StravaClient(this.props.accessToken).listAthleteClubs();
				return {
					content: [{
						type: "text",
						text: JSON.stringify(clubs),
					}],
				};
			},
		);

		// Routes
		this.server.tool(
			"getRoute",
			"Get details about a specific route",
			{
				id: z.number({ description: "Route ID" }),
			},
			async ({ id }) => {
				const route = await new StravaClient(this.props.accessToken).getRoute(id);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(route),
					}],
				};
			},
		);

		this.server.tool(
			"listAthleteRoutes",
			"List routes for authenticated athlete",
			{
				page: z.number({ description: "Page number (optional)" }).optional(),
				per_page: z.number({ description: "Items per page (optional)" }).optional(),
			},
			async ({ page, per_page }) => {
				const routes = await new StravaClient(this.props.accessToken).listAthleteRoutes({ athleteId: this.props.userId, page, per_page });
				return {
					content: [{
						type: "text",
						text: JSON.stringify(routes),
					}],
				};
			},
		);

		// Activity Details
		this.server.tool(
			"getActivityZones",
			"Get zones for a specific activity",
			{
				id: z.number({ description: "Activity ID" }),
			},
			async ({ id }) => {
				const zones = await new StravaClient(this.props.accessToken).getActivityZones(id);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(zones),
					}],
				};
			},
		);

		this.server.tool(
			"getActivityLaps",
			"Get laps for a specific activity",
			{
				id: z.number({ description: "Activity ID" }),
			},
			async ({ id }) => {
				const laps = await new StravaClient(this.props.accessToken).getActivityLaps(id);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(laps),
					}],
				};
			},
		);

		this.server.tool(
			"getActivityKudoers",
			"Get kudoers for a specific activity",
			{
				id: z.number({ description: "Activity ID" }),
				page: z.number({ description: "Page number (optional)" }).optional(),
				per_page: z.number({ description: "Items per page (optional)" }).optional(),
			},
			async ({ id, page, per_page }) => {
				const kudoers = await new StravaClient(this.props.accessToken).getActivityKudoers(id, { page, per_page });
				return {
					content: [{
						type: "text",
						text: JSON.stringify(kudoers),
					}],
				};
			},
		);

		this.server.tool(
			"getActivityComments",
			"Get comments for a specific activity",
			{
				id: z.number({ description: "Activity ID" }),
				page: z.number({ description: "Page number (optional)" }).optional(),
				per_page: z.number({ description: "Items per page (optional)" }).optional(),
			},
			async ({ id, page, per_page }) => {
				const comments = await new StravaClient(this.props.accessToken).getActivityComments(id, { page, per_page });
				return {
					content: [{
						type: "text",
						text: JSON.stringify(comments),
					}],
				};
			},
		);

		// Additional Athlete Endpoints
		this.server.tool(
			"getAthleteStats",
			"Get statistics for a specific athlete",
			{
				id: z.number({ description: "Athlete ID" }),
			},
			async ({ id }) => {
				const stats = await new StravaClient(this.props.accessToken).getAthleteStats(id);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(stats),
					}],
				};
			},
		);

		this.server.tool(
			"getAthleteZones",
			"Get heart rate and power zones for authenticated athlete",
			{},
			async () => {
				const zones = await new StravaClient(this.props.accessToken).getAthleteZones();
				return {
					content: [{
						type: "text",
						text: JSON.stringify(zones),
					}],
				};
			},
		);

		// Segments
		this.server.tool(
			"getSegment",
			"Get details about a specific segment",
			{
				id: z.number({ description: "Segment ID" }),
			},
			async ({ id }) => {
				const segment = await new StravaClient(this.props.accessToken).getSegment(id);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(segment),
					}],
				};
			},
		);

		this.server.tool(
			"getSegmentEfforts",
			"Get efforts for a specific segment",
			{
				segmentId: z.number({ description: "Segment ID" }),
				start_date_local: z.string({ description: "ISO 8601 formatted date time (optional)" }).optional(),
				end_date_local: z.string({ description: "ISO 8601 formatted date time (optional)" }).optional(),
				per_page: z.number({ description: "Items per page (optional)" }).optional(),
			},
			async ({ segmentId, start_date_local, end_date_local, per_page }) => {
				const efforts = await new StravaClient(this.props.accessToken).getSegmentEfforts(segmentId, {
					start_date_local,
					end_date_local,
					per_page,
				});
				return {
					content: [{
						type: "text",
						text: JSON.stringify(efforts),
					}],
				};
			},
		);

		this.server.tool(
			"starSegment",
			"Star or unstar a segment",
			{
				segmentId: z.number({ description: "Segment ID" }),
				starred: z.boolean({ description: "Whether to star or unstar the segment" }),
			},
			async ({ segmentId, starred }) => {
				const result = await new StravaClient(this.props.accessToken).starSegment(segmentId, starred);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(result),
					}],
				};
			},
		);

		// Streams
		this.server.tool(
			"getActivityStreams",
			"Get streams for a specific activity",
			{
				id: z.number({ description: "Activity ID" }),
				keys: z.array(z.string(), { description: "Array of stream types to return" }),
			},
			async ({ id, keys }) => {
				const streams = await new StravaClient(this.props.accessToken).getActivityStreams(id, keys);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(streams),
					}],
				};
			},
		);

		this.server.tool(
			"getSegmentStreams",
			"Get streams for a specific segment",
			{
				id: z.number({ description: "Segment ID" }),
				keys: z.array(z.string(), { description: "Array of stream types to return" }),
			},
			async ({ id, keys }) => {
				const streams = await new StravaClient(this.props.accessToken).getSegmentStreams(id, keys);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(streams),
					}],
				};
			},
		);

		this.server.tool(
			"getSegmentEffortStreams",
			"Get streams for a specific segment effort",
			{
				id: z.number({ description: "Segment Effort ID" }),
				keys: z.array(z.string(), { description: "Array of stream types to return" }),
			},
			async ({ id, keys }) => {
				const streams = await new StravaClient(this.props.accessToken).getSegmentEffortStreams(id, keys);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(streams),
					}],
				};
			},
		);

		// Additional Athlete Endpoints
		this.server.tool(
			"updateLoggedInAthlete",
			"Update the currently authenticated athlete",
			{
				weight: z.number({ description: "The weight of the athlete in kilograms" }),
			},
			async ({ weight }) => {
				const athlete = await new StravaClient(this.props.accessToken).updateLoggedInAthlete(weight);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(athlete),
					}],
				};
			},
		);

		this.server.tool(
			"getAthleteKoms",
			"Get athlete's KOMs/QOMs/CRs",
			{
				id: z.number({ description: "Athlete ID" }),
				page: z.number({ description: "Page number (optional)" }).optional(),
				per_page: z.number({ description: "Items per page (optional)" }).optional(),
			},
			async ({ id, page, per_page }) => {
				const koms = await new StravaClient(this.props.accessToken).getAthleteKoms(id, { page, per_page });
				return {
					content: [{
						type: "text",
						text: JSON.stringify(koms),
					}],
				};
			},
		);

		// Additional Activity Endpoints
		this.server.tool(
			"updateActivity",
			"Update an activity",
			{
				id: z.number({ description: "Activity ID" }),
				name: z.string({ description: "Activity name (optional)" }).optional(),
				type: z.string({ description: "Activity type (optional)" }).optional(),
				sport_type: z.string({ description: "Sport type (optional)" }).optional(),
				description: z.string({ description: "Activity description (optional)" }).optional(),
				gear_id: z.string({ description: "Gear ID (optional)" }).optional(),
				commute: z.boolean({ description: "Whether this is a commute (optional)" }).optional(),
				trainer: z.boolean({ description: "Whether this is a trainer activity (optional)" }).optional(),
			},
			async ({ id, ...params }) => {
				const activity = await new StravaClient(this.props.accessToken).updateActivity(id, params);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(activity),
					}],
				};
			},
		);

		this.server.tool(
			"deleteActivity",
			"Delete an activity",
			{
				id: z.number({ description: "Activity ID" }),
			},
			async ({ id }) => {
				await new StravaClient(this.props.accessToken).deleteActivity(id);
				return {
					content: [{
						type: "text",
						text: "Activity deleted successfully",
					}],
				};
			},
		);

		this.server.tool(
			"getActivityPhotos",
			"Get photos from an activity",
			{
				id: z.number({ description: "Activity ID" }),
			},
			async ({ id }) => {
				const photos = await new StravaClient(this.props.accessToken).getActivityPhotos(id);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(photos),
					}],
				};
			},
		);

		this.server.tool(
			"getRelatedActivities",
			"Get related activities",
			{
				id: z.number({ description: "Activity ID" }),
			},
			async ({ id }) => {
				const activities = await new StravaClient(this.props.accessToken).getRelatedActivities(id);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(activities),
					}],
				};
			},
		);

		// Additional Club Endpoints
		this.server.tool(
			"getClubAnnouncements",
			"Get club announcements",
			{
				id: z.number({ description: "Club ID" }),
			},
			async ({ id }) => {
				const announcements = await new StravaClient(this.props.accessToken).getClubAnnouncements(id);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(announcements),
					}],
				};
			},
		);

		this.server.tool(
			"getClubAdmins",
			"Get club administrators",
			{
				id: z.number({ description: "Club ID" }),
			},
			async ({ id }) => {
				const admins = await new StravaClient(this.props.accessToken).getClubAdmins(id);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(admins),
					}],
				};
			},
		);

		// Additional Route Endpoints
		this.server.tool(
			"getRouteStreams",
			"Get route streams",
			{
				id: z.number({ description: "Route ID" }),
			},
			async ({ id }) => {
				const streams = await new StravaClient(this.props.accessToken).getRouteStreams(id);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(streams),
					}],
				};
			},
		);

		this.server.tool(
			"createRoute",
			"Create a route",
			{
				name: z.string({ description: "Route name" }),
				description: z.string({ description: "Route description (optional)" }).optional(),
				type: z.string({ description: "Route type (optional)" }).optional(),
				private: z.boolean({ description: "Whether the route is private (optional)" }).optional(),
				timestamp: z.number({ description: "Timestamp (optional)" }).optional(),
				segments: z.array(z.number(), { description: "Segment IDs (optional)" }).optional(),
			},
			async (params) => {
				const route = await new StravaClient(this.props.accessToken).createRoute(params);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(route),
					}],
				};
			},
		);

		this.server.tool(
			"exportRouteGPX",
			"Export route as GPX",
			{
				id: z.number({ description: "Route ID" }),
			},
			async ({ id }) => {
				const gpx = await new StravaClient(this.props.accessToken).exportRouteGPX(id);
				return {
					content: [{
						type: "text",
						text: await gpx.text(),
					}],
				};
			},
		);

		this.server.tool(
			"exportRouteTCX",
			"Export route as TCX",
			{
				id: z.number({ description: "Route ID" }),
			},
			async ({ id }) => {
				const tcx = await new StravaClient(this.props.accessToken).exportRouteTCX(id);
				return {
					content: [{
						type: "text",
						text: await tcx.text(),
					}],
				};
			},
		);

		// Additional Segment Endpoints
		this.server.tool(
			"exploreSegments",
			"Explore segments",
			{
				bounds: z.object({
					sw_lat: z.number({ description: "Southwest latitude" }),
					sw_lng: z.number({ description: "Southwest longitude" }),
					ne_lat: z.number({ description: "Northeast latitude" }),
					ne_lng: z.number({ description: "Northeast longitude" })
				}, { description: "Bounding box coordinates" }),
				activity_type: z.string({ description: "Activity type (optional)" }).optional(),
				min_cat: z.number({ description: "Minimum category (optional)" }).optional(),
				max_cat: z.number({ description: "Maximum category (optional)" }).optional(),
			},
			async (params) => {
				const segments = await new StravaClient(this.props.accessToken).exploreSegments({
					...params,
					bounds: params.bounds
				});
				return {
					content: [{
						type: "text",
						text: JSON.stringify(segments),
					}],
				};
			},
		);

		this.server.tool(
			"getStarredSegments",
			"List starred segments",
			{
				page: z.number({ description: "Page number (optional)" }).optional(),
				per_page: z.number({ description: "Items per page (optional)" }).optional(),
			},
			async ({ page, per_page }) => {
				const segments = await new StravaClient(this.props.accessToken).getStarredSegments({ page, per_page });
				return {
					content: [{
						type: "text",
						text: JSON.stringify(segments),
					}],
				};
			},
		);

		this.server.tool(
			"getSegmentLeaderboard",
			"Get segment leaderboard",
			{
				id: z.number({ description: "Segment ID" }),
				gender: z.string({ description: "Gender filter (optional)" }).optional(),
				age_group: z.string({ description: "Age group filter (optional)" }).optional(),
				weight_class: z.string({ description: "Weight class filter (optional)" }).optional(),
				following: z.boolean({ description: "Filter by following (optional)" }).optional(),
				club_id: z.number({ description: "Club ID filter (optional)" }).optional(),
				date_range: z.string({ description: "Date range filter (optional)" }).optional(),
				context_entries: z.number({ description: "Number of context entries (optional)" }).optional(),
				page: z.number({ description: "Page number (optional)" }).optional(),
				per_page: z.number({ description: "Items per page (optional)" }).optional(),
			},
			async ({ id, ...params }) => {
				const leaderboard = await new StravaClient(this.props.accessToken).getSegmentLeaderboard(id, params);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(leaderboard),
					}],
				};
			},
		);

		// Upload Endpoints
		this.server.tool(
			"createUpload",
			"Upload an activity",
			{
				file: z.string({ description: "Base64 encoded file data" }),
				name: z.string({ description: "Activity name (optional)" }).optional(),
				description: z.string({ description: "Activity description (optional)" }).optional(),
				trainer: z.boolean({ description: "Whether this is a trainer activity (optional)" }).optional(),
				commute: z.boolean({ description: "Whether this is a commute (optional)" }).optional(),
				data_type: z.string({ description: "Data type (optional)" }).optional(),
				external_id: z.string({ description: "External ID (optional)" }).optional(),
			},
			async (params) => {
				const file = new Blob([Uint8Array.from(atob(params.file).split('').map(c => c.charCodeAt(0)))]);
				const upload = await new StravaClient(this.props.accessToken).createUpload({ ...params, file });
				return {
					content: [{
						type: "text",
						text: JSON.stringify(upload),
					}],
				};
			},
		);

		this.server.tool(
			"getUploadStatus",
			"Get upload status",
			{
				uploadId: z.number({ description: "Upload ID" }),
			},
			async ({ uploadId }) => {
				const status = await new StravaClient(this.props.accessToken).getUploadStatus(uploadId);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(status),
					}],
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
	tokenExchangeCallback: async (options) => {
		return {
			...options.props
		}
	}
});
