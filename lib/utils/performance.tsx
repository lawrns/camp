// Performance utility functions

/**
 * Image loading optimization utilities
 */

// Generates Next.js sizes prop for responsive images
export function getResponsiveSizes(
  options: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  } = {}
): string {
  const defaults = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    xxl: 1536,
  };

  const config = { ...defaults, ...options };

  return `
  (max-width: ${config.sm}px) 100vw,
  (max-width: ${config.md}px) 50vw,
  (max-width: ${config.lg}px) 33vw,
  (max-width: ${config.xl}px) 25vw,
  20vw
  `;
}

// Helper for lazy loading sections of the page
export function shouldLoadSection(elementRef: React.RefObject<HTMLElement>): boolean {
  if (typeof window === "undefined" || !elementRef.current) return false;

  const rect = elementRef.current.getBoundingClientRect();
  const windowHeight = window.innerHeight;

  // Pre-load when element is within 500px of viewport
  return rect.top <= windowHeight + 500;
}

/**
 * Font optimization utilities
 */

// Add font-display: swap to improve perceived load time
export const fontDisplaySwap = `
  @font-face {
  font-family: 'Sundry';
  font-display: swap;
  }
`;

/**
 * Resource hints for performance
 */

// Generate preload tags for critical resources
export function generatePreloadTags(
  resources: Array<{
    href: string;
    as: "style" | "script" | "image" | "font";
    type?: string;
    crossOrigin?: "anonymous";
  }>
): React.ReactNode[] {
  return resources.map((resource, index) => (
    <link
      key={`preload-${index}`}
      rel="preload"
      href={resource.href}
      as={resource.as}
      type={resource.type}
      crossOrigin={resource.crossOrigin}
    />
  ));
}

// Web Vitals reporting utility
export const reportWebVitals = (metric: unknown): void => {
  if (typeof window !== "undefined" && "gtag" in window) {
    const gtag = (window as unknown).gtag;
    gtag("event", metric.name, {
      event_category: "Web Vitals",
      event_label: metric.id,
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
};
