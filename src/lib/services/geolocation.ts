import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface GeolocationData {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  timezone: string;
  latitude: number;
  longitude: number;
  isp?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Cache geolocation data to avoid hitting rate limits
const geoCache = new Map<string, { data: GeolocationData; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get geolocation data for an IP address
 * Uses ip-api.com free tier (45 requests per minute)
 */
export async function getGeolocation(ip: string): Promise<GeolocationData | null> {
  // Skip localhost and private IPs
  if (ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
    return {
      ip,
      country: "Local",
      countryCode: "XX",
      city: "Localhost",
      region: "Local",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      latitude: 0,
      longitude: 0,
      coordinates: {
        lat: 0,
        lng: 0,
      },
    };
  }

  // Check cache
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Use ip-api.com free tier with HTTPS
    const response = await fetch(
      `https://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`,
      {
        headers: {
          "User-Agent": "Campfire/1.0",
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status !== "success") {
      return null;
    }

    const geoData: GeolocationData = {
      ip: data.query,
      country: data.country,
      countryCode: data.countryCode,
      city: data.city,
      region: data.regionName,
      timezone: data.timezone,
      latitude: data.lat,
      longitude: data.lon,
      isp: data.isp,
      coordinates: {
        lat: data.lat,
        lng: data.lon,
      },
    };

    // Cache the result
    geoCache.set(ip, { data: geoData, timestamp: Date.now() });

    return geoData;
  } catch (error) {
    // Return a reasonable fallback instead of null
    return {
      ip,
      country: "Unknown",
      countryCode: "XX",
      city: "Unknown",
      region: "Unknown",
      timezone: "UTC",
      latitude: 0,
      longitude: 0,
      isp: "Unknown ISP",
      coordinates: {
        lat: 0,
        lng: 0,
      },
    };
  }
}

/**
 * Update conversation with geolocation data
 */
export async function updateConversationLocation(conversationId: string, ip: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const geoData = await getGeolocation(ip);
  if (!geoData) return;

  const { error } = await supabase
    .from("conversations")
    .update({
      customer_ip: ip,
      customer_location: {
        country: geoData.country,
        countryCode: geoData.countryCode,
        city: geoData.city,
        region: geoData.region,
        timezone: geoData.timezone,
        coordinates: {
          lat: geoData.latitude,
          lng: geoData.longitude,
        },
      },
    })
    .eq("id", conversationId);

  if (error) {
  }
}

/**
 * Format location for display
 */
export function formatLocation(location: any): string {
  if (!location) return "Unknown";

  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.region && location.region !== location.city) parts.push(location.region);
  if (location.country) parts.push(location.country);

  return parts.join(", ") || "Unknown";
}

/**
 * Get local time for a timezone
 */
export function getLocalTime(timezone: string): string {
  try {
    return new Date().toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
