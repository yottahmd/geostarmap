import { GeocodedLocation } from '../types';

const CACHE_PREFIX = 'geostarmap_cache_';
const CACHE_EXPIRY_DAYS = 30;
const CACHE_EXPIRY_MS = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export class CacheService {
  private normalizeLocation(location: string): string {
    return location.toLowerCase().trim().replace(/\s+/g, '_');
  }

  private getCacheKey(location: string): string {
    return `${CACHE_PREFIX}${this.normalizeLocation(location)}`;
  }

  get(location: string): GeocodedLocation | null {
    try {
      const key = this.getCacheKey(location);
      const cached = localStorage.getItem(key);

      if (!cached) {
        return null;
      }

      const data: GeocodedLocation = JSON.parse(cached);

      // Check if cache is expired
      if (Date.now() - data.timestamp > CACHE_EXPIRY_MS) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  set(location: string, data: GeocodedLocation): void {
    try {
      const key = this.getCacheKey(location);
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Cache write error:', error);
      // If localStorage is full, try to clean up old entries
      if (
        error instanceof DOMException &&
        error.name === 'QuotaExceededError'
      ) {
        this.cleanup();
        try {
          const key = this.getCacheKey(location);
          localStorage.setItem(key, JSON.stringify(data));
        } catch {
          // Still failed, ignore
        }
      }
    }
  }

  cleanup(): void {
    const keysToRemove: string[] = [];
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const data: GeocodedLocation = JSON.parse(cached);
            if (now - data.timestamp > CACHE_EXPIRY_MS) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // Invalid data, remove it
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  clear(): void {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  getCacheSize(): number {
    let count = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        count++;
      }
    }

    return count;
  }
}
