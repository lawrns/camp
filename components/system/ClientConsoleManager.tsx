"use client";

import { ConsoleManager } from './ConsoleManager';

/**
 * Client-side wrapper for ConsoleManager to ensure it only runs on the client
 * This prevents React hooks errors during SSR
 */
export function ClientConsoleManager() {
  return <ConsoleManager />;
}