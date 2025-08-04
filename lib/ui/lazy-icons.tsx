import { Spinner, type IconProps } from "@phosphor-icons/react";
import dynamic from "next/dynamic";

// LoadingIcon
const LoadingIcon = ({ className, ...props }: IconProps) => (
  <Spinner className={`animate-spin ${className}`} {...props} />
);

// Helper to create lazy-loaded Phosphor icons
export function lazyPhosphorIcon(importFn: () => Promise<{ default: React.ComponentType<IconProps> }>) {
  return dynamic(importFn, {
    loading: () => <LoadingIcon className="h-4 w-4" />,
    ssr: false,
  });
}

// Pre-defined lazy icons for common use cases
export const LazyIcons = {
  // Navigation icons (load immediately)
  Menu: dynamic(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.List })), { ssr: true }),
  X: dynamic(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.X })), { ssr: true }),
  ChevronLeft: dynamic(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.CaretLeft })), {
    ssr: true,
  }),
  ChevronRight: dynamic(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.CaretRight })), {
    ssr: true,
  }),

  // Common action icons (lazy load)
  Search: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.MagnifyingGlass }))),
  Filter: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Funnel }))),
  Settings: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Gear }))),
  Plus: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Plus }))),
  Edit: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.PencilSimple }))),
  Trash: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Trash }))),

  // Status icons (lazy load)
  Check: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Check }))),
  AlertCircle: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.WarningCircle }))),
  Info: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Info }))),

  // AI/Feature icons (lazy load)
  Brain: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Brain }))),
  Sparkles: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Sparkle }))),
  Zap: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Lightning }))),
  Bot: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Robot }))),
};

// Icon bundle helper for related icons
export function createIconBundle<T extends Record<string, () => Promise<any>>>(
  icons: T
): { [K in keyof T]: ReturnType<typeof lazyPhosphorIcon> } {
  const bundle = {} as unknown;
  for (const [key, importFn] of Object.entries(icons)) {
    bundle[key] = lazyPhosphorIcon(importFn as unknown);
  }
  return bundle;
}

// Example usage:
// const ChatIcons = createIconBundle({
//   Send: () => import('phosphor-react').then(mod => ({ default: mod.PaperPlaneTilt })),
//   Paperclip: () => import('phosphor-react').then(mod => ({ default: mod.Paperclip })),
//   Smile: () => import('phosphor-react').then(mod => ({ default: mod.Smiley })),
// });
