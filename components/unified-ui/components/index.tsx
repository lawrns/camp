import React from "react";

export * from "./Avatar";
export * from "./AvatarGroup";
export * from "./Button";
export * from "./Card";
export * from "./Conversation/List";
export * from "./Conversation/Row";
export * from "./Icon";
export * from "./SlaTimerChip";
export * from "./Alert";
export * from "./Badge";
export * from "./Progress";
export * from "./ScrollArea";
export * from "./Separator";
export * from "./Skeleton";
export * from "./Tabs";
export * from "./Toast";
// Comprehensive Composer (NEW - Consolidated with all sophisticated features)
export { CompactComposer, Composer, MessageComposer, UnifiedMessageComposer, WidgetComposer } from "./Composer"; // Main comprehensive composer with all features

// ButtonGroup component
export const ButtonGroup: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  return React.createElement("div", { className: `flex gap-2 ${className}` }, children);
};

// BadgeGroup component
export const BadgeGroup: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  return React.createElement("div", { className: `flex gap-2 ${className}` }, children);
};
export * from "./Composer/types";
export * from "./Sidebar/VisitorPanel";

// NEW FLAME UI COMPONENTS - Replace all legacy CSS
// export * from "./Inbox/InboxContainer"; // Component doesn't exist

// Real-time Collaboration System (NEW - Sprint 7)
export * from "./Realtime/LiveCollaboration";
export * from "./Realtime/PresenceIndicator";
export * from "./Realtime/TypingIndicator";
