"use client";

import React from "react";
import { HandoffDialog as RefactoredHandoffDialog, type HandoffDialogProps } from "./handoff/HandoffDialog";

/**
 * Legacy wrapper for HandoffDialog - redirects to the refactored version
 * This maintains backward compatibility while the codebase transitions
 */
export function HandoffDialog(props: HandoffDialogProps) {
  return <RefactoredHandoffDialog {...props} />;
}

// Export types for backward compatibility
export type {
  HandoffDialogProps,
  HandoffType,
  UrgencyLevel,
  UIMode,
  AgentStatus,
  HandoffReason,
  HandoffData,
  HandoffConfig,
} from "./handoff/types";

export default HandoffDialog;
