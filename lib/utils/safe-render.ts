/**
 * Utility functions to safely render values in React components
 * Prevents "Objects are not valid as a React child" errors
 */

/**
 * Safely renders a value, converting objects to strings
 * @param value - The value to render
 * @returns A safe string representation
 */
export function safeRender(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (typeof value === 'object') {
    // If it's an object with value, change, trend properties, extract the value
    if (value.value !== undefined) {
      return safeRender(value.value);
    }
    
    // For other objects, return a safe string representation
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  
  return String(value);
}

/**
 * Safely extracts a value from a metric object
 * @param metric - The metric object that might have {value, change, trend} structure
 * @returns The extracted value or the original value if it's not an object
 */
export function extractMetricValue(metric: unknown): unknown {
  if (metric && typeof metric === 'object' && metric.value !== undefined) {
    return metric.value;
  }
  return metric;
}

/**
 * Safely extracts change from a metric object
 * @param metric - The metric object that might have {value, change, trend} structure
 * @returns The extracted change or empty string
 */
export function extractMetricChange(metric: unknown): string {
  if (metric && typeof metric === 'object' && metric.change !== undefined) {
    return String(metric.change);
  }
  return '';
}

/**
 * Safely extracts trend from a metric object
 * @param metric - The metric object that might have {value, change, trend} structure
 * @returns The extracted trend or 'neutral'
 */
export function extractMetricTrend(metric: unknown): 'up' | 'down' | 'neutral' {
  if (metric && typeof metric === 'object' && metric.trend !== undefined) {
    return metric.trend;
  }
  return 'neutral';
}

/**
 * Validates that a value is safe to render in React
 * @param value - The value to validate
 * @returns True if safe to render, false otherwise
 */
export function isSafeToRender(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

/**
 * Converts any value to a React-safe format
 * @param value - The value to convert
 * @returns A React-safe value
 */
export function toReactSafe(value: unknown): string | number | boolean | null {
  if (isSafeToRender(value)) {
    return value;
  }
  
  return safeRender(value);
}
