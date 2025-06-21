export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  location?: string;
}

export interface GeocodedLocation {
  lat: number;
  lng: number;
  displayName: string;
  timestamp: number;
}

export interface Repository {
  owner: string;
  name: string;
}

export interface ProcessingProgress {
  status: 'idle' | 'fetching' | 'geocoding' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
}

export interface AppError {
  type: 'network' | 'rate_limit' | 'not_found' | 'invalid_url' | 'unknown';
  message: string;
  details?: unknown;
}
