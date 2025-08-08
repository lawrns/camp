import dynamic from "next/dynamic";
import { Icon } from "./Icon";
import type { IconProps } from "./Icon";

// LoadingIcon
const LoadingIcon = ({ className, ...props }: IconProps) => (
  <Icon icon={() => <svg viewBox="0 0 24 24" className={`h-4 w-4 animate-spin ${className}`} {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none" />
  </svg>} />
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
  Search: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Search }))),
  Filter: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Funnel }))),
  Settings: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Settings }))),
  Plus: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Plus }))),
  Edit: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.PencilSimple }))),
  Trash: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Trash }))),

  // Status icons (lazy load)
  Check: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Check }))),
  AlertCircle: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.AlertCircle }))),
  Info: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Info }))),

  // AI/Feature icons (lazy load)
  Brain: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Brain }))),
  Sparkles: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Sparkles }))),
  Zap: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Zap }))),
  Bot: lazyPhosphorIcon(() => import("@phosphor-icons/react").then((mod) => ({ default: mod.Bot }))),
};

// Icon bundle helper for related icons
type LazyIconLoader = () => Promise<{ default: React.ComponentType<IconProps> }>;

export function createIconBundle<T extends Record<string, LazyIconLoader>>(
  icons: T
): { [K in keyof T]: ReturnType<typeof lazyPhosphorIcon> } {
  const bundle = {} as { [K in keyof T]: ReturnType<typeof lazyPhosphorIcon> };
  (Object.keys(icons) as Array<keyof T>).forEach((key) => {
    const importFn = icons[key];
    (bundle as unknown as Record<keyof T, ReturnType<typeof lazyPhosphorIcon>>)[key] = lazyPhosphorIcon(
      importFn
    );
  });
  return bundle;
}

// Example usage:
// const ChatIcons = createIconBundle({
//   Send: () => import('phosphor-react').then(mod => ({ default: mod.Send })),
//   Paperclip: () => import('phosphor-react').then(mod => ({ default: mod.Paperclip })),
//   Smile: () => import('phosphor-react').then(mod => ({ default: mod.Smile })),
// });
