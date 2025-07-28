export type HandoffType = "visitor-to-agent" | "agent-to-agent" | "ai-to-human";
export type UrgencyLevel = "low" | "medium" | "high" | "critical";
export type UIMode = "wizard" | "single-page";
export type AgentStatus = "online" | "busy" | "away" | "offline";

export interface HandoffReason {
  id: string;
  label: string;
  description: string;
  urgency: UrgencyLevel;
  category: string;
}

export interface HandoffData {
  type: HandoffType;
  conversationId: string;
  fromType: "visitor" | "agent";
  toType: "agent" | "ai";
  reason?: HandoffReason | undefined;
  urgency: UrgencyLevel;
  context: string;
  customNote: string;
  assignTo?: string | undefined;
  aiPersona?: string | undefined;
  metadata: Record<string, any>;
}

export interface HandoffConfig {
  enableReasons?: boolean;
  enableAgentSelection?: boolean;
  enablePersonaSelection?: boolean;
  availableTypes?: HandoffType[];
}

export const DEFAULT_REASONS: HandoffReason[] = [
  {
    id: "technical-issue",
    label: "Technical Issue",
    description: "Customer needs technical assistance",
    urgency: "high",
    category: "technical",
  },
  {
    id: "billing-inquiry",
    label: "Billing Inquiry",
    description: "Questions about billing or payments",
    urgency: "medium",
    category: "billing",
  },
  {
    id: "sales-opportunity",
    label: "Sales Opportunity",
    description: "Potential sales lead or upgrade",
    urgency: "high",
    category: "sales",
  },
  {
    id: "complex-question",
    label: "Complex Question",
    description: "Question requires human expertise",
    urgency: "medium",
    category: "general",
  },
  {
    id: "complaint",
    label: "Customer Complaint",
    description: "Customer has a complaint or issue",
    urgency: "critical",
    category: "support",
  },
  {
    id: "escalation",
    label: "Escalation Request",
    description: "Customer requested to speak to someone else",
    urgency: "high",
    category: "escalation",
  },
];

export const URGENCY_CONFIG = {
  low: {
    label: "Low",
    color: "text-green-600",
    bgColor: "bg-[var(--fl-color-success-subtle)]",
    borderColor: "border-[var(--fl-color-success-muted)]",
  },
  medium: {
    label: "Medium",
    color: "text-yellow-600",
    bgColor: "bg-[var(--fl-color-warning-subtle)]",
    borderColor: "border-[var(--fl-color-warning-muted)]",
  },
  high: {
    label: "High",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  critical: {
    label: "Critical",
    color: "text-red-600",
    bgColor: "bg-[var(--fl-color-danger-subtle)]",
    borderColor: "border-[var(--fl-color-danger-muted)]",
  },
};

export const STATUS_CONFIG = {
  online: {
    label: "Online",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  busy: {
    label: "Busy",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  away: {
    label: "Away",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  offline: {
    label: "Offline",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
};

// Re-export HandoffDialogProps from HandoffDialog
export type { HandoffDialogProps } from "./HandoffDialog";
