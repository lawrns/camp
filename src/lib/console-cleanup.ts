// Console cleanup utility - intercepts and filters console output

interface ConsoleCleanupConfig {
  suppressPatterns: RegExp[];
  allowPatterns: RegExp[];
  suppressMethods: string[];
  enableInDevelopment: boolean;
  logToFile: boolean;
}

class ConsoleCleanup {
  private originalConsole: any = {};
  private config: ConsoleCleanupConfig;
  private suppressedLogs: any[] = [];

  constructor(config: Partial<ConsoleCleanupConfig> = {}) {
    this.config = {
      suppressPatterns: [
        /Webpack|webpack/i,
        /React Router/i,
        /DevTools/i,
        /\[HMR\]/i,
        /\[WDS\]/i,
        /SourceMap/i,
        /Download the React DevTools/i,
        /WebSocket connection/i,
        /Firebase.*initialized/i,
        /Supabase.*initialized/i,
        /Widget.*config/i,
        /\[vite\]/i,
        /\[next\.js\]/i,
        /\[Fast Refresh\]/i,
        /\[EventBus\]/i,
        /Sentry Logger/i,
        /SDK already initialized/i,
        /rebuilding/i,
        /done in \d+ms/i,
      ],
      allowPatterns: [/CRITICAL/i, /ERROR.*Failed/i, /Security.*Warning/i],
      suppressMethods: ["log", "info", "debug", "trace"],
      enableInDevelopment: false,
      logToFile: false,
      ...config,
    };

    // Store original console methods
    ["log", "info", "warn", "error", "debug", "trace", "group", "groupEnd"].forEach((method: any) => {
      this.originalConsole[method] = (console as any)[method];
    });
  }

  intercept() {
    const isDev = process.env.NODE_ENV === "development";

    if (isDev && !this.config.enableInDevelopment) {
      return; // Don't intercept in development unless explicitly enabled
    }

    // Intercept console methods
    this.config.suppressMethods.forEach((method: any) => {
      (console as any)[method] = (...args: any[]) => {
        if (this.shouldSuppress(args)) {
          if (this.config.logToFile) {
            this.suppressedLogs.push({ method, args, timestamp: new Date() });
          }
          return;
        }
        this.originalConsole[method](...args);
      };
    });

    // Always intercept but conditionally suppress warn and error
    ["warn", "error"].forEach((method: any) => {
      (console as any)[method] = (...args: any[]) => {
        if (this.shouldSuppress(args) && !this.isAllowed(args)) {
          if (this.config.logToFile) {
            this.suppressedLogs.push({ method, args, timestamp: new Date() });
          }
          return;
        }
        this.originalConsole[method](...args);
      };
    });
  }

  private shouldSuppress(args: any[]): boolean {
    const message = args.map((arg: any) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ");

    return this.config.suppressPatterns.some((pattern: any) => pattern.test(message));
  }

  private isAllowed(args: any[]): boolean {
    const message = args.map((arg: any) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ");

    return this.config.allowPatterns.some((pattern: any) => pattern.test(message));
  }

  restore() {
    Object.keys(this.originalConsole).forEach((method: any) => {
      (console as any)[method] = this.originalConsole[method];
    });
  }

  getSuppressedLogs() {
    return this.suppressedLogs;
  }

  clearSuppressedLogs() {
    this.suppressedLogs = [];
  }
}

// Production console silencer
export const silenceConsole = () => {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    const cleanup = new ConsoleCleanup({
      suppressMethods: ["log", "info", "debug", "trace", "warn"],
      enableInDevelopment: false,
      suppressPatterns: [
        /.*/, // Suppress everything in production
      ],
      allowPatterns: [/CRITICAL/i, /Payment.*Error/i, /Security.*Breach/i, /Authentication.*Failed/i],
    });

    cleanup.intercept();

    // Also suppress common noisy global errors
    window.addEventListener("error", (e: any) => {
      if (e.message?.includes("ResizeObserver") || e.message?.includes("Non-Error promise rejection")) {
        e.preventDefault();
      }
    });

    window.addEventListener("unhandledrejection", (e: any) => {
      if (e.reason?.message?.includes("Firebase") || e.reason?.message?.includes("Supabase")) {
        e.preventDefault();
      }
    });
  }
};

// Development console cleaner (less aggressive)
export const cleanConsole = () => {
  if (typeof window !== "undefined") {
    const cleanup = new ConsoleCleanup({
      enableInDevelopment: true,
      suppressPatterns: [
        /Download the React DevTools/i,
        /React DevTools for a better development experience/i,
        /WebSocket connection to/i,
        /\[HMR\] Waiting for update/i,
        /\[vite\] connecting\.\.\./i,
        /\[vite\] connected\./i,
        /Firebase: Firebase App/i,
        /Supabase client initialized/i,
        /\[Fast Refresh\] rebuilding/i,
        /\[Fast Refresh\] done in/i,
        /\[EventBus\] Development mode/i,
        /Sentry Logger.*Initializing SDK/i,
        /SDK already initialized/i,
        /hot-reloader-client/i,
        /report-hmr-latency/i,
        /There are multiple modules with names that only differ in casing/i,
        /This can lead to unexpected behavior/i,
      ],
    });

    cleanup.intercept();
  }
};

// Nuclear option - disable console entirely
export const disableConsoleCompletely = () => {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    window.console = {
      ...window.console,
      log: () => { },
      debug: () => { },
      info: () => { },
      warn: () => { },
      error: () => { },
      trace: () => { },
      group: () => { },
      groupEnd: () => { },
      time: () => { },
      timeEnd: () => { },
      assert: () => { },
      clear: () => { },
      count: () => { },
      countReset: () => { },
      dir: () => { },
      dirxml: () => { },
      groupCollapsed: () => { },
      profile: () => { },
      profileEnd: () => { },
      table: () => { },
      timeLog: () => { },
      timeStamp: () => { },
    } as Console;
  }
};
