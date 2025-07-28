/**
 * UI Feature Flags and Configuration
 * Centralized UI feature management
 */

export interface UIFeatureFlags {
  // Component System Flags
  useFlameUI: boolean;
  usePhoenixUI: boolean;
  useShadcnUI: boolean;
  useGlassMorphism: boolean;

  // Layout Flags
  useModernLayout: boolean;
  useResponsiveDesign: boolean;
  useAccessibleComponents: boolean;
  enhancedLayout: boolean;
  responsiveDesign: boolean;
  standardizedEmptyStates: boolean;

  // Animation Flags
  useAnimations: boolean;
  useTransitions: boolean;
  useGestures: boolean;
  enhancedAnimations: boolean;

  // Performance Flags
  useLazyLoading: boolean;
  useVirtualization: boolean;
  useOptimization: boolean;

  // Theme Flags
  useDarkMode: boolean;
  useCustomThemes: boolean;
  useSystemTheme: boolean;

  // Experimental Flags
  useExperimentalComponents: boolean;
  useBetaFeatures: boolean;

  // Realtime Features
  realtimePilot: boolean;
  enhancedRealtimeFeatures: boolean;
  seamlessAgentHandover: boolean;
  enhancedMessageDelivery: boolean;
  enhancedTypingIndicators: boolean;

  // User Experience
  onboardingEnabled: boolean;
  accessibilityFeatures: boolean;

  // Channel Features
  emailChannel: boolean;

  // AI Features
  ragProfiles: boolean;
}

export const defaultUIFeatures: UIFeatureFlags = {
  // Component System Flags
  useFlameUI: true,
  usePhoenixUI: false,
  useShadcnUI: true,
  useGlassMorphism: false,

  // Layout Flags
  useModernLayout: true,
  useResponsiveDesign: true,
  useAccessibleComponents: true,
  enhancedLayout: true,
  responsiveDesign: true,
  standardizedEmptyStates: true,

  // Animation Flags
  useAnimations: true,
  useTransitions: true,
  useGestures: false,
  enhancedAnimations: true,

  // Performance Flags
  useLazyLoading: true,
  useVirtualization: true,
  useOptimization: true,

  // Theme Flags
  useDarkMode: false,
  useCustomThemes: true,
  useSystemTheme: true,

  // Experimental Flags
  useExperimentalComponents: false,
  useBetaFeatures: false,

  // Realtime Features
  realtimePilot: false,
  enhancedRealtimeFeatures: false,
  seamlessAgentHandover: false,
  enhancedMessageDelivery: true,
  enhancedTypingIndicators: true,

  // User Experience
  onboardingEnabled: true,
  accessibilityFeatures: true,

  // Channel Features
  emailChannel: true,

  // AI Features
  ragProfiles: true,
};

/**
 * UI Configuration
 */
export interface UIConfig {
  theme: "light" | "dark" | "system";
  componentLibrary: "flame" | "phoenix" | "shadcn";
  animationLevel: "none" | "reduced" | "full";
  density: "compact" | "comfortable" | "spacious";
  colorScheme: "blue" | "purple" | "green" | "custom";
}

export const defaultUIConfig: UIConfig = {
  theme: "system",
  componentLibrary: "flame",
  animationLevel: "full",
  density: "comfortable",
  colorScheme: "blue",
};

/**
 * Component Registry
 */
export interface ComponentInfo {
  name: string;
  library: "flame" | "phoenix" | "shadcn" | "custom";
  version: string;
  stable: boolean;
  deprecated?: boolean;
  replacement?: string;
}

export const componentRegistry: Record<string, ComponentInfo> = {
  Button: {
    name: "Button",
    library: "flame",
    version: "1.0.0",
    stable: true,
  },
  Input: {
    name: "Input",
    library: "flame",
    version: "1.0.0",
    stable: true,
  },
  Card: {
    name: "Card",
    library: "flame",
    version: "1.0.0",
    stable: true,
  },
  Avatar: {
    name: "Avatar",
    library: "flame",
    version: "1.0.0",
    stable: true,
  },
  AvatarGroup: {
    name: "AvatarGroup",
    library: "flame",
    version: "1.0.0",
    stable: true,
  },
  Badge: {
    name: "Badge",
    library: "flame",
    version: "1.0.0",
    stable: true,
  },
  Progress: {
    name: "Progress",
    library: "flame",
    version: "1.0.0",
    stable: true,
  },
  Tabs: {
    name: "Tabs",
    library: "flame",
    version: "1.0.0",
    stable: true,
  },
  Toast: {
    name: "Toast",
    library: "flame",
    version: "1.0.0",
    stable: true,
  },
  Skeleton: {
    name: "Skeleton",
    library: "flame",
    version: "1.0.0",
    stable: true,
  },
  ScrollArea: {
    name: "ScrollArea",
    library: "flame",
    version: "1.0.0",
    stable: true,
  },
  Separator: {
    name: "Separator",
    library: "flame",
    version: "1.0.0",
    stable: true,
  },
  Alert: {
    name: "Alert",
    library: "flame",
    version: "1.0.0",
    stable: true,
  },
};

/**
 * Theme Configuration
 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  warning: string;
  success: string;
}

export const lightTheme: ThemeColors = {
  primary: "hsl(222.2 84% 4.9%)",
  secondary: "hsl(210 40% 96%)",
  accent: "hsl(210 40% 96%)",
  background: "hsl(0 0% 100%)",
  foreground: "hsl(222.2 84% 4.9%)",
  muted: "hsl(210 40% 96%)",
  border: "hsl(214.3 31.8% 91.4%)",
  input: "hsl(214.3 31.8% 91.4%)",
  ring: "hsl(222.2 84% 4.9%)",
  destructive: "hsl(0 84.2% 60.2%)",
  warning: "hsl(38 92% 50%)",
  success: "hsl(142 76% 36%)",
};

export const darkTheme: ThemeColors = {
  primary: "hsl(210 40% 98%)",
  secondary: "hsl(217.2 32.6% 17.5%)",
  accent: "hsl(217.2 32.6% 17.5%)",
  background: "hsl(222.2 84% 4.9%)",
  foreground: "hsl(210 40% 98%)",
  muted: "hsl(217.2 32.6% 17.5%)",
  border: "hsl(217.2 32.6% 17.5%)",
  input: "hsl(217.2 32.6% 17.5%)",
  ring: "hsl(212.7 26.8% 83.9%)",
  destructive: "hsl(0 62.8% 30.6%)",
  warning: "hsl(38 92% 50%)",
  success: "hsl(142 71% 45%)",
};

/**
 * Utility functions
 */
export function getComponentInfo(componentName: string): ComponentInfo | null {
  return componentRegistry[componentName] || null;
}

export function isComponentStable(componentName: string): boolean {
  const info = getComponentInfo(componentName);
  return info?.stable ?? false;
}

export function isComponentDeprecated(componentName: string): boolean {
  const info = getComponentInfo(componentName);
  return info?.deprecated ?? false;
}

export function getComponentReplacement(componentName: string): string | null {
  const info = getComponentInfo(componentName);
  return info?.replacement || null;
}

/**
 * Feature flag utilities
 */
export function isUIFeatureEnabled<K extends keyof UIFeatureFlags>(
  feature: K,
  flags: UIFeatureFlags = defaultUIFeatures
): UIFeatureFlags[K] {
  return flags[feature];
}

export function getUIFeatures(overrides: Partial<UIFeatureFlags> = {}): UIFeatureFlags {
  return { ...defaultUIFeatures, ...overrides };
}

/**
 * Theme utilities
 */
export function getThemeColors(theme: "light" | "dark" = "light"): ThemeColors {
  return theme === "dark" ? darkTheme : lightTheme;
}

export function applyTheme(theme: "light" | "dark", element: HTMLElement = document.documentElement): void {
  const colors = getThemeColors(theme);

  Object.entries(colors).forEach(([key, value]) => {
    element.style.setProperty(`--${key}`, value);
  });

  element.setAttribute("data-theme", theme);
  element.classList.toggle("dark", theme === "dark");
}

/**
 * Component loading utilities
 */
export async function loadComponent(componentName: string): Promise<any> {
  const info = getComponentInfo(componentName);

  if (!info) {
    throw new Error(`Component ${componentName} not found in registry`);
  }

  if (info.deprecated) {
  }

  // Dynamic import based on library
  switch (info.library) {
    case "flame":
      return import(`@/components/flame-ui/${componentName}`);
    case "phoenix":
      return import(`@/components/phoenix-ui/${componentName}`);
    case "shadcn":
      return import(`@/components/ui/${componentName.toLowerCase()}`);
    default:
      throw new Error(`Unknown component library: ${info.library}`);
  }
}

/**
 * Performance monitoring
 */
export interface UIMetrics {
  componentLoadTime: number;
  renderTime: number;
  memoryUsage: number;
  errorCount: number;
}

export function trackUIMetric(metricName: string, value: number): void {
  if (typeof window !== "undefined" && "performance" in window) {
    performance.mark(`ui-${metricName}-${value}`);
  }
}

export function getUIMetrics(): UIMetrics {
  return {
    componentLoadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    errorCount: 0,
  };
}

// Export all utilities
export const UILibrary = {
  features: {
    default: defaultUIFeatures,
    isEnabled: isUIFeatureEnabled,
    get: getUIFeatures,
  },
  components: {
    registry: componentRegistry,
    getInfo: getComponentInfo,
    isStable: isComponentStable,
    isDeprecated: isComponentDeprecated,
    getReplacement: getComponentReplacement,
    load: loadComponent,
  },
  theme: {
    colors: { light: lightTheme, dark: darkTheme },
    get: getThemeColors,
    apply: applyTheme,
  },
  metrics: {
    track: trackUIMetric,
    get: getUIMetrics,
  },
};
