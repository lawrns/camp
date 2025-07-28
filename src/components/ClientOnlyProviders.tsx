/**
 * Client-only providers to fix SSR dynamic import issues
 */
import dynamic from "next/dynamic";

// Dynamically load auth provider to avoid bundling client-only code in server build
export const DynamicAuthProvider = dynamic(
  () => import("@/lib/core/auth").then((mod) => ({ default: mod.AuthProvider })),
  { ssr: false }
);

// REMOVED: Widget component deleted during cleanup
// export const DynamicCampfireWidget = dynamic(
//   () => import("@/components/widget/CampfireWidget").then((mod) => ({ default: mod.default })),
//   { ssr: false }
// );
