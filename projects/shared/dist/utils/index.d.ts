/**
 * Shared Utilities
 *
 * Common utility functions used across all Campfire V2 projects
 */
import { type ClassValue } from 'clsx';
/**
 * Combines class names with Tailwind CSS merge
 */
export declare function cn(...inputs: ClassValue[]): string;
/**
 * Capitalizes the first letter of a string
 */
export declare function capitalize(str: string): string;
/**
 * Converts string to title case
 */
export declare function toTitleCase(str: string): string;
/**
 * Truncates text to specified length with ellipsis
 */
export declare function truncate(text: string, length: number): string;
/**
 * Generates initials from a name
 */
export declare function getInitials(name: string): string;
/**
 * Slugifies a string for URLs
 */
export declare function slugify(text: string): string;
/**
 * Formats a date to relative time (e.g., "2 hours ago")
 */
export declare function formatRelativeTime(date: Date | string): string;
/**
 * Formats a date to a readable string
 */
export declare function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string;
/**
 * Formats a date to include time
 */
export declare function formatDateTime(date: Date | string): string;
/**
 * Validates an email address
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validates a UUID
 */
export declare function isValidUUID(uuid: string): boolean;
/**
 * Validates a URL
 */
export declare function isValidUrl(url: string): boolean;
/**
 * Removes duplicates from an array
 */
export declare function unique<T>(array: T[]): T[];
/**
 * Groups array items by a key function
 */
export declare function groupBy<T, K extends string | number>(array: T[], keyFn: (item: T) => K): Record<K, T[]>;
/**
 * Chunks an array into smaller arrays of specified size
 */
export declare function chunk<T>(array: T[], size: number): T[][];
/**
 * Deep clones an object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Picks specified keys from an object
 */
export declare function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
/**
 * Omits specified keys from an object
 */
export declare function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
/**
 * Creates a delay promise
 */
export declare function delay(ms: number): Promise<void>;
/**
 * Debounces a function
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * Throttles a function
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
/**
 * Generates a random ID
 */
export declare function generateId(length?: number): string;
/**
 * Generates a random color
 */
export declare function generateRandomColor(): string;
/**
 * Formats file size in human readable format
 */
export declare function formatFileSize(bytes: number): string;
/**
 * Gets file extension from filename
 */
export declare function getFileExtension(filename: string): string;
/**
 * Checks if file is an image
 */
export declare function isImageFile(filename: string): boolean;
/**
 * Safe JSON parse with fallback
 */
export declare function safeJsonParse<T>(json: string, fallback: T): T;
/**
 * Gets error message from unknown error
 */
export declare function getErrorMessage(error: unknown): string;
//# sourceMappingURL=index.d.ts.map