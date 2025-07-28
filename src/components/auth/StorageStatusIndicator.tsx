/**
 * Storage Status Indicator Component
 *
 * Shows a clean, non-alarming indicator of authentication storage status
 */

"use client";

import React, { useEffect, useState } from "react";
import { Warning as AlertCircle, CheckCircle, Info } from "@phosphor-icons/react";
import { storageAdapter } from "@/lib/auth/seamless-storage-adapter";
import { Icon } from "@/lib/ui/Icon";

// Storage adapter temporarily disabled

interface StorageStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function StorageStatusIndicator({ className = "", showDetails = false }: StorageStatusIndicatorProps) {
  const [status, setStatus] = useState<{
    status: string;
    message: string;
    reliable: boolean;
  } | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const checkStatus = () => {
      const storageStatus = storageAdapter.getStorageStatus();
      const debug = storageAdapter.getDebugInfo();

      setStatus({
        status: storageStatus.status,
        message: storageStatus.status === "limited" ? "Storage is limited to memory only" : "Storage is available",
        reliable: storageStatus.reliable,
      });
      setDebugInfo(debug);
    };

    checkStatus();

    // Check again after a short delay to ensure storage is initialized
    const timeout = setTimeout(checkStatus, 100);
    return () => clearTimeout(timeout);
  }, []);

  if (!status) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
        <div className="h-2 w-2 animate-pulse rounded-ds-full bg-neutral-400" />
        <span>Checking authentication storage...</span>
      </div>
    );
  }

  const getIcon = () => {
    switch (status.status) {
      case "optimal":
        return <Icon icon={CheckCircle} className="text-semantic-success h-4 w-4" />;
      case "good":
        return <Icon icon={CheckCircle} className="h-4 w-4 text-[var(--fl-color-info)]" />;
      case "limited":
        return <Icon icon={AlertCircle} className="text-semantic-warning h-4 w-4" />;
      default:
        return <Icon icon={Info} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case "optimal":
        return "text-green-700";
      case "good":
        return "text-blue-700";
      case "limited":
        return "text-orange-700";
      default:
        return "text-gray-700";
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case "optimal":
        return "Optimal";
      case "good":
        return "Good";
      case "limited":
        return "Limited";
      default:
        return "Unknown";
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-ds-2 text-sm">
        {getIcon()}
        <span className={`font-medium ${getStatusColor()}`}>Authentication Storage: {getStatusText()}</span>
      </div>

      <p className="text-foreground text-tiny">{status.message}</p>

      {showDetails && debugInfo && (
        <div className="space-y-1 text-tiny text-[var(--fl-color-text-muted)]">
          <div>Storage Type: {debugInfo.type}</div>
          <div>Reliable: {status.reliable ? "Yes" : "No"}</div>
          {debugInfo.type === "memory" && (
            <div className="text-orange-600">⚠️ Memory storage only - sessions won't persist across page reloads</div>
          )}
        </div>
      )}
    </div>
  );
}

export default StorageStatusIndicator;
