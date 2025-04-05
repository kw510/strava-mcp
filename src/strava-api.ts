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

export async function getLoggedInAthlete(accessToken: string): Promise<DetailedAthlete> {
  const response = await fetch('https://www.strava.com/api/v3/athlete', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch athlete data: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Example usage:
// const athlete = await getLoggedInAthlete('your-access-token-here');
// console.log(athlete.firstname, athlete.lastname);
