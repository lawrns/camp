// Server Component (no "use client" directive)

import { Icon } from "@/lib/ui/Icon";
import { Fire as Flame } from "@phosphor-icons/react";
import { Suspense } from "react";
import { EmbedWidgetClient } from "./EmbedWidgetClient";

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex animate-pulse flex-col items-center">
        <Icon icon={Flame} className="mb-2 h-8 w-8 text-indigo-600" />
        <p className="text-[var(--fl-color-text-muted)]">Loading Campfire...</p>
      </div>
    </div>
  );
}

// Main page component that receives searchParams from Next.js
export default async function EmbedWidget({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Make sure search params are properly resolved before passing to client
  // By adding 'await' we ensure the search params are fully resolved
  const resolvedParams = await searchParams;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <EmbedWidgetClient searchParamsObj={resolvedParams} />
    </Suspense>
  );
}
