import { useEffect, useState } from "react";

/**
 * Safe localStorage hook that handles SSR/SSG
 * Returns [value, setValue, isLoaded] where isLoaded indicates if localStorage is available
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
        setIsLoaded(true);
      }
    } catch (error) {
      setIsLoaded(true);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {}
  };

  return [storedValue, setValue, isLoaded];
}

/**
 * Safe localStorage getter that works during SSR/SSG
 */
export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safe localStorage setter that works during SSR/SSG
 */
export function setLocalStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {}
}

/**
 * Safe localStorage remover that works during SSR/SSG
 */
export function removeLocalStorageItem(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {}
}
