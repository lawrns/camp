/**
 * Panel Header Component
 *
 * Split from Panel.tsx for HMR optimization
 * Handles header UI, status indicators, and close button
 */

import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import React from "react";
import { X } from "../icons/OptimizedIcons";

interface PanelHeaderProps {
  isConnected: boolean;
  onClose: () => void;
  organizationName?: string;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  isConnected,
  onClose,
  organizationName = "Campfire Chat",
}) => {
  return (
    <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-blue-600 to-purple-600 spacing-3 text-white">
      <div className="flex items-center space-x-3">
        {/* Connection status indicator */}
        <div className="relative">
          <div className={`h-3 w-3 rounded-ds-full ${isConnected ? "bg-green-400" : "bg-gray-400"}`} />
          {isConnected && (
            <div className="absolute inset-0 h-3 w-3 animate-pulse rounded-ds-full bg-green-400 opacity-75" />
          )}
        </div>

        <div>
          <h3 id="widget-title" className="text-sm font-semibold text-white">
            {organizationName}
          </h3>
          <OptimizedMotion.div
            id="widget-description"
            className="text-tiny text-white/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            aria-live="polite"
          >
            {isConnected ? "We're online" : "Connecting..."}
          </OptimizedMotion.div>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="hover:bg-background/10 rounded-ds-full spacing-1 transition-colors duration-200"
        aria-label="Close chat"
        type="button"
        data-testid="close-button"
      >
        <X size={18} weight="bold" className="text-white" />
      </button>
    </div>
  );
};

export default PanelHeader;
