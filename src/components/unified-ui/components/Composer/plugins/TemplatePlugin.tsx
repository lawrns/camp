"use client";

import React, { useState } from "react";
import { X, Lightning as Zap } from "@phosphor-icons/react";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import type { ComposerPluginProps, Template } from "../types";

const SAMPLE_TEMPLATES: Template[] = [
  {
    id: "1",
    title: "Thank you",
    content: "Thank you for contacting us! How can I help you today?",
    category: "greeting",
  },
  {
    id: "2",
    title: "Looking into it",
    content: "I'm looking into this for you right now. Give me just a moment.",
    category: "response",
  },
  {
    id: "3",
    title: "Follow up",
    content: "I'll follow up with you shortly with more information.",
    category: "response",
  },
  {
    id: "4",
    title: "Escalation",
    content: "Let me connect you with a specialist who can better assist you.",
    category: "escalation",
  },
  {
    id: "5",
    title: "Closing",
    content: "Is there anything else I can help you with today?",
    category: "closing",
  },
];

export function TemplatePlugin({ pluginId, content, onContentChange, onAction, disabled }: ComposerPluginProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  const handleTemplateSelect = (template: Template) => {
    onContentChange(template.content);
    onAction(pluginId, "template-selected", template);
    setShowTemplates(false);
  };

  // Show templates when content is empty
  const shouldShowTemplates = content.trim().length === 0 && showTemplates;

  return (
    <>
      {/* Templates Section */}
      {shouldShowTemplates && (
        <div className="bg-[--bg-subtle]/30 border-b border-[--border-subtle] px-3 py-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-ds-2">
              <Icon icon={Zap} className="h-4 w-4 text-[--color-primary]" />
              <span className="text-sm font-medium text-[--text-primary]">Quick Replies</span>
            </div>
            <button
              onClick={() => setShowTemplates(false)}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded",
                "text-[--text-muted] hover:bg-[--bg-subtle] hover:text-[--text-primary]",
                "transition-colors duration-200"
              )}
              title="Hide templates"
            >
              <Icon icon={X} className="h-3 w-3" />
            </button>
          </div>

          <div className="flex flex-wrap gap-ds-2">
            {SAMPLE_TEMPLATES.map((template: unknown) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                disabled={disabled}
                className={cn(
                  "text-typography-sm rounded-ds-md border border-[--border-subtle] px-3 py-1.5",
                  "bg-white transition-colors duration-200 hover:bg-[--bg-subtle]",
                  "hover:border-[--color-primary]/30 text-[--text-primary]",
                  disabled && "cursor-not-allowed opacity-50"
                )}
                title={template.content}
              >
                {template.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Show Templates Button (when hidden and content is empty) */}
      {content.trim().length === 0 && !showTemplates && (
        <div className="bg-[--bg-subtle]/10 border-b border-[--border-subtle] px-3 py-2">
          <button
            onClick={() => setShowTemplates(true)}
            disabled={disabled}
            className={cn(
              "text-typography-sm flex items-center gap-2 rounded-ds-md px-3 py-1.5",
              "text-[--text-muted] hover:text-[--color-primary]",
              "transition-colors duration-200 hover:bg-[--bg-subtle]",
              disabled && "cursor-not-allowed opacity-50"
            )}
            title="Show quick replies"
          >
            <Icon icon={Zap} className="h-4 w-4" />
            <span>Quick Replies</span>
          </button>
        </div>
      )}
    </>
  );
}
