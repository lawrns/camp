import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import type { LucideProps } from "lucide-react";

// LoadingIcon
const LoadingIcon = ({ className, ...props }: LucideProps) => (
  <Loader2 className={`animate-spin ${className}`} {...props} />
);

// Helper to create lazy-loaded Lucide icons
export function lazyLucideIcon(importFn: () => Promise<{ default: React.ComponentType<LucideProps> }>) {
  return dynamic(importFn, {
    loading: () => <LoadingIcon className="h-4 w-4" />,
    ssr: false,
  });
}

// Pre-defined lazy icons for common use cases
export const LazyIcons = {
  // Navigation icons (load immediately)
  Menu: dynamic(() => import("lucide-react").then((mod) => ({ default: mod.Menu })), { ssr: true }),
  X: dynamic(() => import("lucide-react").then((mod) => ({ default: mod.X })), { ssr: true }),
  ChevronLeft: dynamic(() => import("lucide-react").then((mod) => ({ default: mod.ChevronLeft })), {
    ssr: true,
  }),
  ChevronRight: dynamic(() => import("lucide-react").then((mod) => ({ default: mod.ChevronRight })), {
    ssr: true,
  }),

  // Common action icons (lazy load)
  Search: lazyLucideIcon(() => import("lucide-react").then((mod) => ({ default: mod.Search }))),
  Filter: lazyLucideIcon(() => import("lucide-react").then((mod) => ({ default: mod.Filter }))),
  Settings: lazyLucideIcon(() => import("lucide-react").then((mod) => ({ default: mod.Settings }))),
  Plus: lazyLucideIcon(() => import("lucide-react").then((mod) => ({ default: mod.Plus }))),
  Edit: lazyLucideIcon(() => import("lucide-react").then((mod) => ({ default: mod.Edit }))),
  Trash: lazyLucideIcon(() => import("lucide-react").then((mod) => ({ default: mod.Trash2 }))),

  // Status icons (lazy load)
  Check: lazyLucideIcon(() => import("lucide-react").then((mod) => ({ default: mod.Check }))),
  AlertCircle: lazyLucideIcon(() => import("lucide-react").then((mod) => ({ default: mod.AlertCircle }))),
  Info: lazyLucideIcon(() => import("lucide-react").then((mod) => ({ default: mod.Info }))),

  // AI/Feature icons (lazy load)
  Brain: lazyLucideIcon(() => import("lucide-react").then((mod) => ({ default: mod.Brain }))),
  Sparkles: lazyLucideIcon(() => import("lucide-react").then((mod) => ({ default: mod.Sparkles }))),
  Zap: lazyLucideIcon(() => import("lucide-react").then((mod) => ({ default: mod.Zap }))),
  Bot: lazyLucideIcon(() => import("lucide-react").then((mod) => ({ default: mod.Bot }))),
};

// Icon bundle helper for related icons
export function createIconBundle<T extends Record<string, () => Promise<any>>>(
  icons: T
): { [K in keyof T]: ReturnType<typeof lazyLucideIcon> } {
  const bundle = {} as any;
  for (const [key, importFn] of Object.entries(icons)) {
    bundle[key] = lazyLucideIcon(importFn as any);
  }
  return bundle;
}

// Example usage:
// const ChatIcons = createIconBundle({
//   Send: () => import('phosphor-react').then(mod => ({ default: mod.PaperPlaneTilt })),
//   Paperclip: () => import('phosphor-react').then(mod => ({ default: mod.Paperclip })),
//   Smile: () => import('phosphor-react').then(mod => ({ default: mod.Smiley })),
// });
