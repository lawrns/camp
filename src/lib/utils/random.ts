/**
 * Generates a random number between min and max (inclusive)
 * @param min Minimum value (inclusive)
 * @param max Maximum value (inclusive)
 * @returns A random number between min and max
 */
export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generates a random integer between min and max (inclusive)
 * @param min Minimum integer value (inclusive)
 * @param max Maximum integer value (inclusive)
 * @returns A random integer between min and max
 */
export function randomIntInRange(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a random boolean value
 * @param probability Probability of returning true (0-1)
 * @returns A random boolean value
 */
export function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}
