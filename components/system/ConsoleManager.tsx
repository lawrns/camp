"use client";

import { useEffect, useState } from 'react';

/**
 * ConsoleManager - PHASE -1 FIX: Removed all error suppression
 * This component now provides proper error reporting without masking issues
 * CRITICAL FIX: No more console.error = () => {} anti-patterns
 */
export function ConsoleManager() {
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only running on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // PHASE 0 CRITICAL FIX: Complete removal of console suppression
    console.log('🔧 [ConsoleManager] All console suppression removed - errors now visible for debugging');

    // No console overrides - all errors and warnings will show naturally
    // This allows proper debugging without masking issues
  }, [isMounted]);

  // This component doesn't render anything
  return null;
}
