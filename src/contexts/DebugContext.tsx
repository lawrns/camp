"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type LogEntry = {
  id: string;
  type: "log" | "info" | "warn" | "error" | "debug";
  message: string;
  timestamp: number;
  data?: unknown;
};

type DebugContextType = {
  logs: LogEntry[];
  addLog: (type: LogEntry["type"], message: string, data?: unknown) => void;
  clearLogs: () => void;
};

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((type: LogEntry["type"], message: string, data?: unknown) => {
    setLogs((prevLogs: LogEntry[]) =>
      [
        ...prevLogs,
        {
          id: Math.random().toString(36).substr(2, 9),
          type,
          message,
          timestamp: Date.now(),
          data,
        },
      ].slice(-200)
    ); // Keep only the last 200 logs
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const value = useMemo(
    () => ({
      logs,
      addLog,
      clearLogs,
    }),
    [logs, addLog, clearLogs]
  );

  return <DebugContext.Provider value={value}>{children}</DebugContext.Provider>;
}

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error("useDebug must be used within a DebugProvider");
  }
  return context;
};
