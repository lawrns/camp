/**
 * Avatar Generation Utilities
 *
 * Provides comprehensive avatar generation and fallback logic
 * for customer conversations when no avatar is available.
 */

// Avatar service providers
const AVATAR_SERVICES = [
  "https://api.dicebear.com/7.x/initials/svg",
  "https://ui-avatars.com/api",
  "https://avatars.dicebear.com/api/initials",
] as const;

// Color schemes for avatar generation
const AVATAR_COLORS = [
  { bg: "3B82F6", color: "FFFFFF" }, // Blue
  { bg: "8B5CF6", color: "FFFFFF" }, // Purple
  { bg: "10B981", color: "FFFFFF" }, // Green
  { bg: "F59E0B", color: "FFFFFF" }, // Yellow
  { bg: "EF4444", color: "FFFFFF" }, // Red
  { bg: "6B7280", color: "FFFFFF" }, // Gray
  { bg: "EC4899", color: "FFFFFF" }, // Pink
  { bg: "8B5A2B", color: "FFFFFF" }, // Brown
] as const;

interface AvatarGenerationOptions {
  name?: string;
  email?: string;
  id?: string;
  size?: number;
  preferredService?: number;
  fallbackToInitials?: boolean;
}

/**
 * Generate a deterministic color based on a string input
 */
function generateColorFromString(input: string): (typeof AVATAR_COLORS)[number] {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index] || AVATAR_COLORS[0];
}

/**
 * Extract initials from a name
 */
function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .map((word: unknown) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2) || "CU"
  );
}

/**
 * Get customer name from various possible fields
 */
function getCustomerName(options: AvatarGenerationOptions): string {
  if (options.name && options.name.trim()) {
    return options.name.trim();
  }

  if (options.email && options.email.includes("@")) {
    return options.email.split("@")[0]?.replace(/[._-]/g, " ") || "Customer";
  }

  return "Customer";
}

/**
 * Generate avatar URL using ui-avatars.com service
 */
function generateUIAvatarsUrl(name: string, options: { size: number; colors: (typeof AVATAR_COLORS)[number] }): string {
  const initials = getInitials(name);
  const colors = options.colors || AVATAR_COLORS[0];
  const params = new URLSearchParams({
    name: initials,
    size: options.size.toString(),
    background: colors.bg,
    color: colors.color,
    bold: "true",
    format: "svg",
  });

  return `https://ui-avatars.com/api/?${params.toString()}`;
}

/**
 * Generate avatar URL using DiceBear service
 */
function generateDiceBearUrl(name: string, options: { size: number; colors: (typeof AVATAR_COLORS)[number] }): string {
  const initials = getInitials(name);
  const params = new URLSearchParams({
    seed: initials,
    size: options.size.toString(),
    backgroundColor: options.colors.bg,
    textColor: options.colors.color,
    fontSize: "60",
    fontFamily: "Arial",
    fontWeight: "600",
  });

  return `https://api.dicebear.com/7.x/initials/svg?${params.toString()}`;
}

/**
 * Generate an SVG data URL for avatar
 */
function generateSVGDataUrl(name: string, colors: (typeof AVATAR_COLORS)[number], size: number = 40): string {
  const initials = getInitials(name);
  const fontSize = Math.max(12, size * 0.4);

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#${colors.bg}" rx="${size * 0.125}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            fill="#${colors.color}" font-family="system-ui, -apple-system, sans-serif" 
            font-size="${fontSize}" font-weight="600">${initials}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Main avatar generation function
 */
export function generateAvatar(options: AvatarGenerationOptions): {
  url: string;
  initials: string;
  name: string;
  colors: (typeof AVATAR_COLORS)[number];
  fallback: string;
} {
  const name = getCustomerName(options);
  const initials = getInitials(name);
  const size = options.size || 40;

  // Use customer ID or email as seed for consistent colors
  const seed = options.id || options.email || name;
  const colors = generateColorFromString(seed);

  // Generate fallback SVG data URL (always works)
  const fallback = generateSVGDataUrl(name, colors, size);

  // Determine which service to use
  let url: string;
  const serviceIndex = options.preferredService || 0;

  try {
    switch (serviceIndex) {
      case 1:
        url = generateUIAvatarsUrl(name, { size, colors });
        break;
      case 2:
        url = generateDiceBearUrl(name, { size, colors });
        break;
      default:
        // Use DiceBear as default (most reliable)
        url = generateDiceBearUrl(name, { size, colors });
        break;
    }
  } catch (error) {
    url = fallback;
  }

  return {
    url,
    initials,
    name,
    colors,
    fallback,
  };
}

/**
 * Improved getUserAvatar function with better fallbacks
 */
export function getUserAvatar(options: AvatarGenerationOptions): string {
  return generateAvatar(options).url;
}

/**
 * Get customer initials for fallback display
 */
export function getCustomerInitials(options: AvatarGenerationOptions): string {
  const name = getCustomerName(options);
  return getInitials(name);
}

/**
 * Generate multiple avatar options for testing/selection
 */
export function generateAvatarOptions(options: AvatarGenerationOptions): Array<{
  service: string;
  url: string;
  description: string;
}> {
  const name = getCustomerName(options);
  const size = options.size || 40;
  const colors = generateColorFromString(options.id || options.email || name);

  return [
    {
      service: "DiceBear",
      url: generateDiceBearUrl(name, { size, colors }),
      description: "Vector initials with modern design",
    },
    {
      service: "UI Avatars",
      url: generateUIAvatarsUrl(name, { size, colors }),
      description: "Simple text-based avatars",
    },
    {
      service: "SVG Fallback",
      url: generateSVGDataUrl(name, colors, size),
      description: "Local SVG generation (always works)",
    },
  ];
}

/**
 * Validate if an avatar URL is accessible
 */
export async function validateAvatarUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD", mode: "no-cors" });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get the best avatar with fallback chain
 */
export async function getBestAvatar(options: AvatarGenerationOptions): Promise<string> {
  const avatar = generateAvatar(options);

  // Try the generated URL first
  const isValid = await validateAvatarUrl(avatar.url);

  if (isValid) {
    return avatar.url;
  }

  // If that fails, return the SVG fallback
  return avatar.fallback;
}
