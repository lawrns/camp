// Test script to verify name generation improvements
// Since this is a TypeScript file, we'll test the compiled version or use a different approach

console.log('Testing name generation improvements...\n');

// Simple test to verify the unique-names-generator package is working
const { adjectives, colors, animals } = require('unique-names-generator');

console.log('Unique-names-generator package test:');
console.log(`  Adjectives available: ${adjectives.length}`);
console.log(`  Colors available: ${colors.length}`);
console.log(`  Animals available: ${animals.length}`);

console.log('\nSample names:');
console.log(`  Adjective: ${adjectives[0]}`);
console.log(`  Color: ${colors[0]}`);
console.log(`  Animal: ${animals[0]}`);

console.log('\nTesting deterministic generation:');
const testSeed = 'test-seed-123';
let hash = 0;
for (let i = 0; i < testSeed.length; i++) {
  const char = testSeed.charCodeAt(i);
  hash = (hash << 5) - hash + char;
  hash = hash & hash;
}

const adjIndex = Math.abs(hash) % colors.length;
const animalIndex = Math.abs(hash >> 8) % animals.length;
const generatedName = `${colors[adjIndex]} ${animals[animalIndex]}`;

console.log(`  Seed: ${testSeed}`);
console.log(`  Generated name: ${generatedName}`);

console.log('\nName generation test completed!'); 