"use client";

import React from "react";
import { X } from "@phosphor-icons/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/unified-ui/components/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import type { Conversation, ConversationWithRelations } from "@/types/entities/conversation";
import { AssistantTab } from "./AIDrawerTabs/AssistantTab";
import { CustomerTab } from "./AIDrawerTabs/CustomerTab";
import { InsightsTab } from "./AIDrawerTabs/InsightsTab";
import { SnippetsTab } from "./AIDrawerTabs/SnippetsTab";

export type AIDrawerTab = "assistant" | "snippets" | "customer" | "insights";

interface AIDrawerProps {
  isOpen: boolean;
  activeTab: AIDrawerTab;
  conversation: ConversationWithRelations | null;
  onClose: () => void;
  onSuggestionSelect: (suggestion: string) => void;
  onTabChange?: (tab: AIDrawerTab) => void;
}

const tabConfig = {
  assistant: {
    label: "Assistant",
    icon: "🤖",
    description: "AI-generated responses",
  },
  snippets: {
    label: "Snippets",
    icon: "📚",
    description: "Knowledge base context",
  },
  customer: {
    label: "Customer",
    icon: "👤",
    description: "Profile & history",
  },
  insights: {
    label: "Insights",
    icon: "💡",
    description: "Suggestions & analytics",
  },
};

export const AIDrawer: React.FC<AIDrawerProps> = ({
  isOpen,
  activeTab,
  conversation,
  onClose,
  onSuggestionSelect,
  onTabChange,
}) => {
  if (!conversation) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-[400px] flex-col p-0 sm:w-[540px]">
        {/* Header */}
        <SheetHeader className="border-b bg-[var(--fl-color-background-subtle)] px-6 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold">AI Assistant</SheetTitle>
            <button
              onClick={onClose}
              className="rounded-ds-md spacing-1 transition-colors hover:bg-gray-200"
              aria-label="Close AI panel"
            >
              <Icon icon={X} className="h-4 w-4" />
            </button>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value: string) => onTabChange?.(value as AIDrawerTab)}
          className="flex flex-1 flex-col"
        >
          <TabsList className="bg-background grid w-full grid-cols-4 spacing-1">
            {Object.entries(tabConfig).map(([key, config]) => (
              <TabsTrigger
                key={key}
                value={key}
                className={cn(
                  "text-typography-sm flex items-center gap-1.5 font-medium",
                  "data-[state=active]:bg-white data-[state=active]:shadow-sm"
                )}
              >
                <span className="text-base">{config.icon}</span>
                <span className="hidden sm:inline">{config.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="assistant" className="m-0 h-full">
              <AssistantTab conversation={conversation} onSuggestionSelect={onSuggestionSelect} />
            </TabsContent>

            <TabsContent value="snippets" className="m-0 h-full">
              <SnippetsTab conversation={conversation} />
            </TabsContent>

            <TabsContent value="customer" className="m-0 h-full">
              <CustomerTab conversation={conversation} />
            </TabsContent>

            <TabsContent value="insights" className="m-0 h-full">
              <InsightsTab conversation={conversation} onActionSelect={onSuggestionSelect} />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default AIDrawer;
