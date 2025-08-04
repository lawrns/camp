import { Redis } from "@upstash/redis";

export interface LocationData {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  cached?: boolean;
}

export class LocationService {
  private static instance: LocationService;
  private redis: Redis | null = null;
  private cache = new Map<string, LocationData>();

  private constructor() {
    try {
      this.redis = Redis.fromEnv();
    } catch (error) {}
  }

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async detectLocation(ip: string): Promise<LocationData | null> {
    // Skip for localhost
    if (ip === "127.0.0.1" || ip === "::1") {
      return {
        ip,
        country: "Local",
        countryCode: "XX",
        region: "Local",
        city: "Localhost",
        latitude: 0,
        longitude: 0,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isp: "Local Network",
        cached: true,
      };
    }

    // Check memory cache first
    if (this.cache.has(ip)) {
      return { ...this.cache.get(ip)!, cached: true };
    }

    // Check Redis cache if available
    if (this.redis) {
      try {
        const cached = await this.redis.get<LocationData>(`location:${ip}`);
        if (cached) {
          this.cache.set(ip, cached);
          return { ...cached, cached: true };
        }
      } catch (error) {}
    }

    // Fetch from IP API service
    try {
      // Use ipapi.co free tier (no API key required for basic usage)
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        headers: {
          "User-Agent": "Campfire/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      // Check for error response
      if (data.error) {
        throw new Error(data.reason || "Location API error");
      }

      const location: LocationData = {
        ip,
        country: data.country_name || "Unknown",
        countryCode: data.country_code || "XX",
        region: data.region || "Unknown",
        city: data.city || "Unknown",
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        timezone: data.timezone || "UTC",
        isp: data.org || "Unknown ISP",
      };

      // Cache in memory
      this.cache.set(ip, location);

      // Cache in Redis for 24 hours if available
      if (this.redis) {
        try {
          await this.redis.setex(`location:${ip}`, 86400, location);
        } catch (error) {}
      }

      return location;
    } catch (error) {
      // Return basic fallback data
      return {
        ip,
        country: "Unknown",
        countryCode: "XX",
        region: "Unknown",
        city: "Unknown",
        latitude: 0,
        longitude: 0,
        timezone: "UTC",
        isp: "Unknown",
        cached: false,
      };
    }
  }

  // Batch location detection for multiple IPs
  async detectLocations(ips: string[]): Promise<Map<string, LocationData | null>> {
    const results = new Map<string, LocationData | null>();

    // Process in parallel with rate limiting
    const batchSize = 5;
    for (let i = 0; i < ips.length; i += batchSize) {
      const batch = ips.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map((ip: unknown) => this.detectLocation(ip)));

      batch.forEach((ip, index) => {
        const result = batchResults[index];
        results.set(ip, result !== undefined ? result : null);
      });

      // Rate limit: wait 200ms between batches
      if (i + batchSize < ips.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return results;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      memoryCacheSize: this.cache.size,
      redisAvailable: !!this.redis,
    };
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();
