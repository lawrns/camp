/**
 * Returns a promise that resolves after the specified number of milliseconds
 * @param ms Number of milliseconds to sleep
 * @returns A promise that resolves after the specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns a promise that resolves after a random duration within the specified range
 * @param minMs Minimum milliseconds to sleep
 * @param maxMs Maximum milliseconds to sleep
 * @returns A promise that resolves after a random duration within the range
 */
export function sleepRandom(minMs: number, maxMs: number): Promise<void> {
  const duration = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return sleep(duration);
}
