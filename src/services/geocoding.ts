import type { GeocodedLocation } from '../types';
import { RateLimiter } from '../utils/rateLimit';
import { LocalGeocodingService } from './localGeocoding';

const NOMINATIM_API_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT =
  'GeoStarMap/1.0 (https://github.com/yourusername/geostarmap)';

export class GeocodingService {
  private rateLimiter: RateLimiter;
  private localGeocoding: LocalGeocodingService;

  constructor() {
    // Nominatim requires max 1 request per second
    this.rateLimiter = new RateLimiter(1000);
    this.localGeocoding = new LocalGeocodingService();
    // Initialize local geocoding in the background
    this.localGeocoding.initialize().catch(console.error);
  }

  async geocodeLocation(location: string): Promise<GeocodedLocation | null> {
    if (!location || location.trim() === '') {
      return null;
    }

    // Try local geocoding first
    const localResult = await this.localGeocoding.geocodeLocation(location);
    if (localResult) {
      return localResult;
    }

    // Fall back to Nominatim API
    return this.rateLimiter.execute(async () => {
      const url = new URL(`${NOMINATIM_API_BASE}/search`);
      url.searchParams.set('q', location);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');

      try {
        const response = await fetch(url.toString(), {
          headers: {
            'User-Agent': USER_AGENT,
          },
        });

        if (!response.ok) {
          throw new Error(`Geocoding failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.length === 0) {
          return null;
        }

        const result = data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          displayName: result.display_name,
          timestamp: Date.now(),
        };
      } catch (error) {
        console.error('Geocoding error:', error);
        return null;
      }
    });
  }

  async geocodeMultiple(
    locations: string[],
    onProgress?: (current: number, total: number) => void,
  ): Promise<Map<string, GeocodedLocation | null>> {
    const results = new Map<string, GeocodedLocation | null>();
    const uniqueLocations = [...new Set(locations.filter(Boolean))];

    for (let i = 0; i < uniqueLocations.length; i++) {
      const location = uniqueLocations[i];
      const result = await this.geocodeLocation(location);
      results.set(location, result);

      if (onProgress) {
        onProgress(i + 1, uniqueLocations.length);
      }
    }

    return results;
  }

  clearQueue() {
    this.rateLimiter.clear();
  }

  get queueLength() {
    return this.rateLimiter.queueLength;
  }
}
