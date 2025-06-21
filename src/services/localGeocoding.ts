import type { GeocodedLocation } from '../types';

interface CityData {
  city: string;
  city_ascii: string;
  lat: number;
  lng: number;
  country: string;
  iso2: string;
  iso3: string;
  admin_name: string;
  capital: string;
  population: number;
  id: string;
}

export class LocalGeocodingService {
  private cityDatabase: Map<string, CityData[]> = new Map();
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.loadCityDatabase();
    await this.initPromise;
    this.initialized = true;
  }

  private async loadCityDatabase(): Promise<void> {
    try {
      const response = await fetch('/data/worldcities.csv');
      if (!response.ok) {
        throw new Error('Failed to load city database');
      }

      const text = await response.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = this.parseCSVLine(line);
        if (values.length !== headers.length) continue;

        const cityData: CityData = {
          city: values[0].replace(/"/g, ''),
          city_ascii: values[1].replace(/"/g, ''),
          lat: parseFloat(values[2].replace(/"/g, '')),
          lng: parseFloat(values[3].replace(/"/g, '')),
          country: values[4].replace(/"/g, ''),
          iso2: values[5].replace(/"/g, ''),
          iso3: values[6].replace(/"/g, ''),
          admin_name: values[7].replace(/"/g, ''),
          capital: values[8].replace(/"/g, ''),
          population: parseInt(values[9].replace(/"/g, '')) || 0,
          id: values[10].replace(/"/g, ''),
        };

        // Index by various formats
        this.addToIndex(cityData.city.toLowerCase(), cityData);
        this.addToIndex(cityData.city_ascii.toLowerCase(), cityData);
        this.addToIndex(`${cityData.city}, ${cityData.country}`.toLowerCase(), cityData);
        this.addToIndex(`${cityData.city}, ${cityData.iso2}`.toLowerCase(), cityData);
        this.addToIndex(`${cityData.city}, ${cityData.admin_name}`.toLowerCase(), cityData);
        
        // Also index common variations
        if (cityData.iso2 === 'US') {
          // US state abbreviations
          const stateAbbr = this.getUSStateAbbreviation(cityData.admin_name);
          if (stateAbbr) {
            this.addToIndex(`${cityData.city}, ${stateAbbr}`.toLowerCase(), cityData);
          }
        }
      }

      console.log(`Loaded ${this.cityDatabase.size} unique location keys from city database`);
    } catch (error) {
      console.error('Failed to load city database:', error);
      // Don't throw - we'll fall back to Nominatim
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  private addToIndex(key: string, city: CityData): void {
    if (!this.cityDatabase.has(key)) {
      this.cityDatabase.set(key, []);
    }
    this.cityDatabase.get(key)!.push(city);
  }

  private getUSStateAbbreviation(stateName: string): string | null {
    const stateAbbreviations: Record<string, string> = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
      'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
      'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
      'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
      'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
      'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
      'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
      'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
      'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
      'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
      'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
    };

    return stateAbbreviations[stateName] || null;
  }

  async geocodeLocation(location: string): Promise<GeocodedLocation | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    const searchKey = location.toLowerCase().trim();
    const cities = this.cityDatabase.get(searchKey);

    if (cities && cities.length > 0) {
      // If multiple matches, prefer the one with highest population
      const bestMatch = cities.reduce((prev, current) => 
        (current.population > prev.population) ? current : prev
      );

      return {
        lat: bestMatch.lat,
        lng: bestMatch.lng,
        displayName: `${bestMatch.city}, ${bestMatch.country}`,
        timestamp: Date.now(),
      };
    }

    // Try partial matches for common patterns
    const partialMatches = this.findPartialMatches(searchKey);
    if (partialMatches.length > 0) {
      const bestMatch = partialMatches[0];
      return {
        lat: bestMatch.lat,
        lng: bestMatch.lng,
        displayName: `${bestMatch.city}, ${bestMatch.country}`,
        timestamp: Date.now(),
      };
    }

    return null;
  }

  private findPartialMatches(searchKey: string): CityData[] {
    const matches: CityData[] = [];
    
    // Common patterns to try
    const patterns = [
      // "San Francisco Bay Area" -> "San Francisco"
      searchKey.replace(/\s*(bay\s*area|area|region|metro|metropolitan)\s*/gi, '').trim(),
      // "NYC" -> "New York"
      searchKey === 'nyc' ? 'new york' : null,
      // "SF" -> "San Francisco"
      searchKey === 'sf' ? 'san francisco' : null,
      // Extract city from "City, State/Country"
      searchKey.includes(',') ? searchKey.split(',')[0].trim() : null,
    ].filter(Boolean) as string[];

    for (const pattern of patterns) {
      const cities = this.cityDatabase.get(pattern);
      if (cities) {
        matches.push(...cities);
      }
    }

    // Sort by population
    return matches.sort((a, b) => b.population - a.population);
  }
}