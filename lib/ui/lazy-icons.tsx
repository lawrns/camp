import { Loader2 } from "lucide-react";
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
//   Send: () => import('phosphor-react').then(mod => ({ default: mod.Send })),
//   Paperclip: () => import('phosphor-react').then(mod => ({ default: mod.Paperclip })),
//   Smile: () => import('phosphor-react').then(mod => ({ default: mod.Smile })),
// });
