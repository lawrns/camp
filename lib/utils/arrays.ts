/**
 * Array utility functions
 */

/**
 * Takes a single element from an array, throwing if the array is empty or contains multiple elements
 * @param array - The array to extract from
 * @returns The single element in the array
 * @throws {Error} If array is empty or contains multiple elements
 * @example
 * const result = takeUniqueOrThrow([42]); // returns 42
 * takeUniqueOrThrow([]); // throws "Array is empty"
 * takeUniqueOrThrow([1, 2]); // throws "Array contains multiple elements, expected exactly one"
 */
export function takeUniqueOrThrow<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error("Array is empty");
  }
  if (array.length > 1) {
    throw new Error("Array contains multiple elements, expected exactly one");
  }
  return array[0]!;
}

/**
 * Groups an array of items by a key selector function
 * @param array - The array to group
 * @param keySelector - Function that returns the grouping key for each item
 * @returns An object with keys from keySelector and arrays of grouped items as values
 * @example
 * const users = [
 *   { name: 'Alice', role: 'admin' },
 *   { name: 'Bob', role: 'user' },
 *   { name: 'Charlie', role: 'admin' }
 * ];
 * const grouped = groupBy(users, user => user.role);
 * // Result: { admin: [Alice, Charlie], user: [Bob] }
 */
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keySelector: (item: T) => K
): Record<K, T[]> {
  return array.reduce(
    (groups, item) => {
      const key = keySelector(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {} as Record<K, T[]>
  );
}
