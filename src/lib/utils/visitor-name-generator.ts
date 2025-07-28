// Unique visitor name generator
// Generates fun, memorable names for anonymous visitors

const adjectives = [
  "Happy",
  "Clever",
  "Bright",
  "Swift",
  "Gentle",
  "Bold",
  "Wise",
  "Kind",
  "Brave",
  "Calm",
  "Eager",
  "Fair",
  "Jolly",
  "Keen",
  "Lively",
  "Merry",
  "Noble",
  "Proud",
  "Quick",
  "Sharp",
  "Witty",
  "Zesty",
  "Daring",
  "Fearless",
  "Graceful",
  "Humble",
  "Inspired",
  "Joyful",
  "Lucky",
  "Mighty",
  "Nimble",
  "Polite",
  "Quiet",
  "Radiant",
  "Sincere",
  "Thoughtful",
  "Upbeat",
  "Vibrant",
  "Warm",
  "Cheerful",
  "Friendly",
  "Helpful",
  "Honest",
  "Peaceful",
  "Playful",
  "Curious",
  "Dynamic",
  "Energetic",
  "Brilliant",
  "Charming",
  "Creative",
];

const nouns = [
  "Panda",
  "Eagle",
  "Tiger",
  "Lion",
  "Bear",
  "Wolf",
  "Fox",
  "Hawk",
  "Dove",
  "Swan",
  "Owl",
  "Raven",
  "Phoenix",
  "Dragon",
  "Falcon",
  "Leopard",
  "Panther",
  "Jaguar",
  "Lynx",
  "Otter",
  "Dolphin",
  "Whale",
  "Shark",
  "Ray",
  "Turtle",
  "Penguin",
  "Koala",
  "Kangaroo",
  "Zebra",
  "Giraffe",
  "Elephant",
  "Rhino",
  "Hippo",
  "Monkey",
  "Gorilla",
  "Lemur",
  "Sloth",
  "Raccoon",
  "Badger",
  "Beaver",
  "Moose",
  "Deer",
  "Elk",
  "Bison",
  "Horse",
  "Unicorn",
  "Griffin",
  "Sphinx",
  "Pegasus",
  "Kraken",
  "Yeti",
  "Sasquatch",
];

const colors = [
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Purple",
  "Orange",
  "Pink",
  "Cyan",
  "Magenta",
  "Turquoise",
  "Violet",
  "Indigo",
  "Crimson",
  "Scarlet",
  "Azure",
  "Emerald",
  "Jade",
  "Ruby",
  "Sapphire",
  "Amber",
  "Coral",
  "Pearl",
  "Silver",
  "Gold",
  "Bronze",
  "Copper",
  "Platinum",
  "Diamond",
  "Crystal",
  "Rainbow",
  "Sunset",
  "Dawn",
  "Dusk",
  "Midnight",
  "Sky",
  "Ocean",
  "Forest",
];

/**
 * Generates a unique visitor name in the format: "Adjective Color Noun"
 * Example: "Happy Blue Panda" or "Swift Golden Eagle"
 */
export function generateVisitorName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adjective} ${color} ${noun}`;
}

/**
 * Generates a shorter visitor name in the format: "Adjective Noun"
 * Example: "Happy Panda" or "Swift Eagle"
 */
export function generateShortVisitorName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adjective} ${noun}`;
}

/**
 * Gets a random avatar URL from the available avatars
 * @param baseUrl - The base URL of the application (optional)
 * @returns The URL to a random avatar image
 */
export function getRandomAvatarUrl(baseUrl?: string): string {
  const avatarCount = 7; // We have 7 avatar images
  const avatarNumber = Math.floor(Math.random() * avatarCount) + 1;
  const path = `/images/avatars/${avatarNumber}.png`;

  return baseUrl ? `${baseUrl}${path}` : path;
}

/**
 * Generates a visitor identity with name and avatar
 */
export interface VisitorIdentity {
  name: string;
  email: string;
  avatar: string;
}

/**
 * Generates a complete visitor identity
 * @param useShortName - Whether to use short name format (default: false)
 * @param baseUrl - The base URL for avatar images (optional)
 */
export function generateVisitorIdentity(useShortName = false, baseUrl?: string): VisitorIdentity {
  const name = useShortName ? generateShortVisitorName() : generateVisitorName();
  const email = `${name.toLowerCase().replace(/\s+/g, ".")}@visitor.campfire.com`;
  const avatar = getRandomAvatarUrl(baseUrl);

  return {
    name,
    email,
    avatar,
  };
}

/**
 * Generates a deterministic visitor identity based on a session ID
 * This ensures the same visitor gets the same identity across page reloads
 * @param sessionId - A unique session identifier
 * @param useShortName - Whether to use short name format (default: false)
 * @param baseUrl - The base URL for avatar images (optional)
 */
export function generateDeterministicVisitorIdentity(
  sessionId: string,
  useShortName = false,
  baseUrl?: string
): VisitorIdentity {
  // Simple hash function to convert sessionId to indices
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    const char = sessionId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use absolute value to ensure positive indices
  hash = Math.abs(hash);

  const adjIndex = hash % adjectives.length;
  const colorIndex = (hash >> 8) % colors.length;
  const nounIndex = (hash >> 16) % nouns.length;
  const avatarIndex = (hash >> 24) % 7;

  const name = useShortName
    ? `${adjectives[adjIndex]} ${nouns[nounIndex]}`
    : `${adjectives[adjIndex]} ${colors[colorIndex]} ${nouns[nounIndex]}`;

  const email = `${name.toLowerCase().replace(/\s+/g, ".")}@visitor.campfire.com`;
  const avatar = `${baseUrl || ""}/images/avatars/${avatarIndex + 1}.png`;

  return {
    name,
    email,
    avatar,
  };
}
