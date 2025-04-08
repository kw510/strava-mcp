interface DetailedAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile_medium: string;
  profile: string;
  city: string;
  state: string;
  country: string;
  sex: 'M' | 'F';
  summit: boolean;
  created_at: string;
  updated_at: string;
  follower_count: number;
  friend_count: number;
  measurement_preference: 'feet' | 'meters';
  ftp?: number;
  weight?: number;
  clubs: any[];
  bikes: any[];
  shoes: any[];
}

interface CreateActivityParams {
  name: string;
  sport_type: string;
  start_date_local: string;
  elapsed_time: number;
  type?: string;
  description?: string;
  distance?: number;
  trainer?: number;
  commute?: number;
}

// Add new interfaces
interface ActivityZone {
  score: number;
  distribution_buckets: any[];
  type: string;
  resource_state: number;
  sensor_based: boolean;
}

interface ActivityStats {
  biggest_ride_distance: number;
  biggest_climb_elevation_gain: number;
  recent_ride_totals: any;
  recent_run_totals: any;
  recent_swim_totals: any;
  ytd_ride_totals: any;
  ytd_run_totals: any;
  ytd_swim_totals: any;
  all_ride_totals: any;
  all_run_totals: any;
  all_swim_totals: any;
}

export class StravaClient {
  private baseUrl = 'https://www.strava.com/api/v3';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private buildQueryString(params: Record<string, number | undefined>): string {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // Athletes
  async getLoggedInAthlete(): Promise<DetailedAthlete> {
    return this.request<DetailedAthlete>('/athlete');
  }

  async updateLoggedInAthlete(weight: number): Promise<DetailedAthlete> {
    return this.request('/athlete', {
      method: 'PUT',
      body: JSON.stringify({ weight }),
    });
  }

  async getAthleteKoms(id: number, params?: {
    page?: number;
    per_page?: number;
  }): Promise<any[]> {
    return this.request(`/athletes/${id}/koms${this.buildQueryString(params || {})}`);
  }

  // Activities
  async createActivity(params: CreateActivityParams): Promise<any> {
    return this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getActivity(id: number): Promise<any> {
    return this.request(`/activities/${id}`);
  }

  async listAthleteActivities(params?: {
    before?: number;
    after?: number;
    page?: number;
    per_page?: number;
  }): Promise<any[]> {
    return this.request(`/athlete/activities${this.buildQueryString(params || {})}`);
  }

  async updateActivity(id: number, params: {
    name?: string;
    type?: string;
    sport_type?: string;
    description?: string;
    gear_id?: string;
    commute?: boolean;
    trainer?: boolean;
  }): Promise<any> {
    return this.request(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  }

  async deleteActivity(id: number): Promise<void> {
    return this.request(`/activities/${id}`, {
      method: 'DELETE',
    });
  }

  async getActivityPhotos(id: number): Promise<any[]> {
    return this.request(`/activities/${id}/photos`);
  }

  async getRelatedActivities(id: number): Promise<any[]> {
    return this.request(`/activities/${id}/related`);
  }

  // Clubs
  async getClub(id: number): Promise<any> {
    return this.request(`/clubs/${id}`);
  }

  async listAthleteClubs(params?: {
    page?: number;
    per_page?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    const queryString = queryParams.toString();
    return this.request(`/athlete/clubs${queryString ? `?${queryString}` : ''}`);
  }

  async getClubAnnouncements(id: number): Promise<any[]> {
    return this.request(`/clubs/${id}/announcements`);
  }

  async getClubAdmins(id: number): Promise<any[]> {
    return this.request(`/clubs/${id}/admins`);
  }

  // Routes
  async getRoute(id: number): Promise<any> {
    return this.request(`/routes/${id}`);
  }

  async listAthleteRoutes(params: {
    athleteId: string;
    page?: number;
    per_page?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    const queryString = queryParams.toString();
    return this.request(`/athletes/${params.athleteId}/routes${queryString ? `?${queryString}` : ''}`);
  }

  async listClubActivities(clubId: number, params?: {
    page?: number;
    per_page?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    const queryString = queryParams.toString();
    return this.request(`/clubs/${clubId}/activities${queryString ? `?${queryString}` : ''}`);
  }

  async listClubMembers(clubId: number, params?: {
    page?: number;
    per_page?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    const queryString = queryParams.toString();
    return this.request(`/clubs/${clubId}/members${queryString ? `?${queryString}` : ''}`);
  }

  async getRouteStreams(id: number): Promise<any> {
    return this.request(`/routes/${id}/streams`);
  }

  async createRoute(params: {
    name: string;
    description?: string;
    type?: string;
    private?: boolean;
    timestamp?: number;
    segments?: number[];
  }): Promise<any> {
    return this.request('/routes', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async exportRouteGPX(id: number): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/routes/${id}/export_gpx`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });
    return response.blob();
  }

  async exportRouteTCX(id: number): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/routes/${id}/export_tcx`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });
    return response.blob();
  }

  // Segments
  async getSegment(id: number): Promise<any> {
    return this.request(`/segments/${id}`);
  }

  async getSegmentEfforts(segmentId: number, params?: {
    start_date_local?: string;
    end_date_local?: string;
    per_page?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.start_date_local) queryParams.append('start_date_local', params.start_date_local);
    if (params?.end_date_local) queryParams.append('end_date_local', params.end_date_local);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/segments/${segmentId}/all_efforts${queryString ? `?${queryString}` : ''}`);
  }

  async starSegment(segmentId: number, starred: boolean): Promise<any> {
    return this.request(`/segments/${segmentId}/starred`, {
      method: 'PUT',
      body: JSON.stringify({ starred }),
    });
  }

  async exploreSegments(params: {
    bounds: {
      sw_lat: number;
      sw_lng: number;
      ne_lat: number;
      ne_lng: number;
    };
    activity_type?: string;
    min_cat?: number;
    max_cat?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('bounds', [params.bounds.sw_lat, params.bounds.sw_lng, params.bounds.ne_lat, params.bounds.ne_lng].join(','));
    if (params.activity_type) queryParams.append('activity_type', params.activity_type);
    if (params.min_cat) queryParams.append('min_cat', params.min_cat.toString());
    if (params.max_cat) queryParams.append('max_cat', params.max_cat.toString());
    
    return this.request(`/segments/explore?${queryParams.toString()}`);
  }

  async getStarredSegments(params?: {
    page?: number;
    per_page?: number;
  }): Promise<any[]> {
    return this.request(`/segments/starred${this.buildQueryString(params || {})}`);
  }

  async getSegmentLeaderboard(id: number, params?: {
    gender?: string;
    age_group?: string;
    weight_class?: string;
    following?: boolean;
    club_id?: number;
    date_range?: string;
    context_entries?: number;
    page?: number;
    per_page?: number;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.gender) queryParams.append('gender', params.gender);
    if (params?.age_group) queryParams.append('age_group', params.age_group);
    if (params?.weight_class) queryParams.append('weight_class', params.weight_class);
    if (params?.following) queryParams.append('following', params.following.toString());
    if (params?.club_id) queryParams.append('club_id', params.club_id.toString());
    if (params?.date_range) queryParams.append('date_range', params.date_range);
    if (params?.context_entries) queryParams.append('context_entries', params.context_entries.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    
    return this.request(`/segments/${id}/leaderboard?${queryParams.toString()}`);
  }

  // Activities
  async getActivityZones(id: number): Promise<ActivityZone[]> {
    return this.request(`/activities/${id}/zones`);
  }

  async getActivityLaps(id: number): Promise<any[]> {
    return this.request(`/activities/${id}/laps`);
  }

  async getActivityKudoers(id: number, params?: {
    page?: number;
    per_page?: number;
  }): Promise<any[]> {
    return this.request(`/activities/${id}/kudos${this.buildQueryString(params || {})}`);
  }

  async getActivityComments(id: number, params?: {
    page?: number;
    per_page?: number;
  }): Promise<any[]> {
    return this.request(`/activities/${id}/comments${this.buildQueryString(params || {})}`);
  }

  // Athletes
  async getAthleteStats(id: number): Promise<ActivityStats> {
    return this.request(`/athletes/${id}/stats`);
  }

  async getAthleteZones(): Promise<any> {
    return this.request('/athlete/zones');
  }

  // Uploads
  async createUpload(params: {
    file: Blob;
    name?: string;
    description?: string;
    trainer?: boolean;
    commute?: boolean;
    data_type?: string;
    external_id?: string;
  }): Promise<any> {
    const formData = new FormData();
    formData.append('file', params.file);
    if (params.name) formData.append('name', params.name);
    if (params.description) formData.append('description', params.description);
    if (params.trainer) formData.append('trainer', params.trainer.toString());
    if (params.commute) formData.append('commute', params.commute.toString());
    if (params.data_type) formData.append('data_type', params.data_type);
    if (params.external_id) formData.append('external_id', params.external_id);

    return this.request('/uploads', {
      method: 'POST',
      body: formData,
    });
  }

  async getUploadStatus(uploadId: number): Promise<any> {
    return this.request(`/uploads/${uploadId}`);
  }

  // Streams
  async getActivityStreams(id: number, keys: string[]): Promise<any> {
    return this.request(`/activities/${id}/streams?keys=${keys.join(',')}`);
  }

  async getSegmentStreams(id: number, keys: string[]): Promise<any> {
    return this.request(`/segments/${id}/streams?keys=${keys.join(',')}`);
  }

  async getSegmentEffortStreams(id: number, keys: string[]): Promise<any> {
    return this.request(`/segment_efforts/${id}/streams?keys=${keys.join(',')}`);
  }
}

// Example usage:
/*
const stravaClient = new StravaClient('your-access-token-here');

// Get logged in athlete
const athlete = await stravaClient.getLoggedInAthlete();

// Create an activity
const activity = await stravaClient.createActivity({
  name: 'Morning Run',
  sport_type: 'Run',
  start_date_local: '2024-03-14T08:00:00Z',
  elapsed_time: 3600,
  distance: 10000 // 10km in meters
});

// Get athlete activities
const activities = await stravaClient.listAthleteActivities({
  page: 1,
  per_page: 30
});
*/
