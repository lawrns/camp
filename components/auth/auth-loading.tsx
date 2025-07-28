import React from "react";
import { Spinner as Loader2 } from "@phosphor-icons/react";
import { Icon } from "@/lib/ui/Icon";

export function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-3 text-center">
        <Icon icon={Loader2} className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading authentication...</p>
      </div>
    </div>
  );
}

export function InlineAuthLoading() {
  return (
    <div className="flex items-center justify-center spacing-3">
      <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
      <span className="text-sm">Authenticating...</span>
    </div>
  );
}

export function AuthLoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="space-y-3 rounded-ds-lg bg-card p-spacing-md shadow-card-deep">
        <Icon icon={Loader2} className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Processing authentication...</p>
      </div>
    </div>
  );
}
