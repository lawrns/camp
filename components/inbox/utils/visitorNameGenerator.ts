// Generate unique, friendly visitor names like "Friendly Panda #1234"

const adjectives = [
  "Friendly",
  "Happy",
  "Curious",
  "Bright",
  "Clever",
  "Swift",
  "Gentle",
  "Brave",
  "Kind",
  "Wise",
  "Eager",
  "Jolly",
  "Merry",
  "Noble",
  "Quick",
  "Smart",
  "Witty",
  "Zesty",
  "Calm",
  "Dynamic",
];

const animals = [
  "Panda",
  "Dolphin",
  "Eagle",
  "Fox",
  "Koala",
  "Lion",
  "Otter",
  "Penguin",
  "Rabbit",
  "Tiger",
  "Whale",
  "Zebra",
  "Bear",
  "Crane",
  "Deer",
  "Hawk",
  "Lynx",
  "Owl",
  "Seal",
  "Wolf",
];

const colors = [
  { from: "from-blue-400", to: "to-blue-600" },
  { from: "from-green-400", to: "to-green-600" },
  { from: "from-purple-400", to: "to-purple-600" },
  { from: "from-pink-400", to: "to-pink-600" },
  { from: "from-yellow-400", to: "to-yellow-600" },
  { from: "from-indigo-400", to: "to-indigo-600" },
  { from: "from-red-400", to: "to-red-600" },
  { from: "from-teal-400", to: "to-teal-600" },
];

// Simple hash function to generate consistent values from visitor ID
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function generateVisitorName(visitorId: string): {
  name: string;
  adjective: string;
  animal: string;
  number: string;
  color: { from: string; to: string };
} {
  // Use visitor ID to generate consistent but pseudorandom values
  const hash = hashCode(visitorId);

  const adjectiveIndex = hash % adjectives.length;
  const animalIndex = (hash >> 8) % animals.length;
  const colorIndex = (hash >> 16) % colors.length;
  const number = ((hash >> 24) % 9000) + 1000; // 4-digit number between 1000-9999

  const adjective = adjectives[adjectiveIndex] || "Unknown";
  const animal = animals[animalIndex] || "Visitor";
  const name = `${adjective} ${animal} #${number}`;
  const color = colors[colorIndex] || { from: "#6B7280", to: "#9CA3AF" };

  return {
    name,
    adjective,
    animal,
    number: number.toString(),
    color,
  };
}

export function getVisitorInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2 && parts[0] && parts[1]) {
    // Take first letter of adjective and animal
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  // Fallback for non-generated names
  return name.slice(0, 2).toUpperCase();
}
