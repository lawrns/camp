// Provide backward compatibility: map @campfire/react to @campfire/react
declare module "@campfire/react" {
  export * from "@campfire/react";
  export { default } from "@campfire/react";
}

// Global type declarations for Campfire/Helper SDK compatibility
interface CampfireWidgetSDK {
  init: (config: unknown) => void;
  show: () => void;
  hide: () => void;
  toggle: () => void;
  sendPrompt: (prompt: string) => void;
}

// Extend Window interface
declare global {
  interface Window {
    // Original helper widget (for backwards compatibility)
    CampfireWidget?: unknown;

    // Widget accessed via window.Helper
    Helper?: CampfireWidgetSDK;

    // New rebranded widget accessed via window.Campfire
    Campfire?: CampfireWidgetSDK;
  }
}
