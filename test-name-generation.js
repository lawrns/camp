// Test name generation functionality
const { adjectives, colors, animals } = require('unique-names-generator');

function generateUniqueVisitorName(seed) {
  // Create a simple hash from the seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use the hash to select colors and animals
  const color = colors[Math.abs(hash) % colors.length];
  const animal = animals[Math.abs(hash >> 8) % animals.length];
  
  // Capitalize the first letter of each word
  const capitalizedColor = color.charAt(0).toUpperCase() + color.slice(1);
  const capitalizedAnimal = animal.charAt(0).toUpperCase() + animal.slice(1);
  
  return `${capitalizedColor} ${capitalizedAnimal}`;
}

// Test with different seeds
const testSeeds = [
  "visitor@widget.com",
  "e08016a0-e759-408b-bdc1-8cec3630794d",
  "c3ba1140-9c26-450d-961e-a7303f0136ee",
  "0f5a5d29-a248-4a8e-bac1-608a7a4aea0a",
  "Website Visitor",
  "anonymous"
];

console.log("Testing name generation with different seeds:");
testSeeds.forEach(seed => {
  const generatedName = generateUniqueVisitorName(seed);
  console.log(`Seed: "${seed}" -> Name: "${generatedName}"`);
});

// Test consistency
console.log("\nTesting consistency (same seed should produce same name):");
const testSeed = "e08016a0-e759-408b-bdc1-8cec3630794d";
for (let i = 0; i < 3; i++) {
  const name = generateUniqueVisitorName(testSeed);
  console.log(`Run ${i + 1}: "${name}"`);
} 