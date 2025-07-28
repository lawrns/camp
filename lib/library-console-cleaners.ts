// Library-specific console cleaners

// Supabase console cleaner
export const cleanSupabaseLogs = () => {
  if (typeof window !== "undefined") {
    const originalLog = console.log;
    const originalInfo = console.info;

    console.log = (...args) => {
      const message = args.join(" ");
      if (
        message.includes("Supabase") ||
        message.includes("GoTrueClient") ||
        message.includes("RealtimeClient") ||
        message.includes("PostgrestClient")
      ) {
        return;
      }
      originalLog(...args);
    };

    console.info = (...args) => {
      const message = args.join(" ");
      if (message.includes("Supabase")) {
        return;
      }
      originalInfo(...args);
    };
  }
};

// Firebase console cleaner
export const cleanFirebaseLogs = () => {
  if (typeof window !== "undefined") {
    const originalLog = console.log;
    const originalWarn = console.warn;

    console.log = (...args) => {
      const message = args.join(" ");
      if (
        message.includes("Firebase") ||
        message.includes("firebaseapp.com") ||
        message.includes("[firebase-") ||
        message.includes("Analytics")
      ) {
        return;
      }
      originalLog(...args);
    };

    console.warn = (...args) => {
      const message = args.join(" ");
      if (message.includes("Firebase") && !message.includes("error") && !message.includes("failed")) {
        return;
      }
      originalWarn(...args);
    };
  }
};

// Next.js console cleaner
export const cleanNextJsLogs = () => {
  if (typeof window !== "undefined") {
    const originalLog = console.log;
    const originalInfo = console.info;

    console.log = (...args) => {
      const message = args.join(" ");
      if (
        message.includes("[next]") ||
        message.includes("prefetch") ||
        message.includes("Fast Refresh") ||
        message.includes("ready -")
      ) {
        return;
      }
      originalLog(...args);
    };
  }
};

// React Query console cleaner
export const cleanReactQueryLogs = () => {
  if (typeof window !== "undefined") {
    const originalLog = console.log;

    console.log = (...args) => {
      const message = args.join(" ");
      if (message.includes("React Query") || message.includes("queryKey") || message.includes("mutation")) {
        return;
      }
      originalLog(...args);
    };
  }
};

// WebSocket console cleaner
export const cleanWebSocketLogs = () => {
  if (typeof window !== "undefined") {
    const originalLog = console.log;
    const originalInfo = console.info;

    console.log = (...args) => {
      const message = args.join(" ");
      if (
        message.includes("WebSocket") ||
        message.includes("ws://") ||
        message.includes("wss://") ||
        message.includes("connection")
      ) {
        return;
      }
      originalLog(...args);
    };
  }
};

// Combined cleaner for all libraries
export const cleanAllLibraryLogs = () => {
  cleanSupabaseLogs();
  cleanFirebaseLogs();
  cleanNextJsLogs();
  cleanReactQueryLogs();
  cleanWebSocketLogs();
};

// Widget-specific console cleaner
export const cleanWidgetLogs = () => {
  if (typeof window !== "undefined") {
    const originalLog = console.log;
    const originalInfo = console.info;

    console.log = (...args) => {
      const message = args.join(" ");
      if (
        message.includes("Widget") ||
        message.includes("widget") ||
        message.includes("CampfireWidget") ||
        message.includes("🔥") ||
        message.includes("🚀")
      ) {
        return;
      }
      originalLog(...args);
    };
  }
};
