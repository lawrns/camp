import { useMemo } from 'react';

/**
 * Hook to get time-based greeting
 * @returns {string} Greeting based on current time of day
 */
export function useGreeting(): string {
  return useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);
}

/**
 * Hook to get user display name
 * @param user - User object from auth
 * @returns {string} Display name for the user
 */
export function useUserName(user: any): string {
  return useMemo(() => {
    if (user?.name) {
      return user.name.split(" ")[0] || "there";
    } else if (user?.email) {
      return user.email.split("@")[0] || "there";
    }
    return "there";
  }, [user?.name, user?.email]);
} 