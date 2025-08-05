// TemplatePanel component for quick message templates

import * as React from "react";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { messageTemplates } from "../constants/messageTemplates";
import type { MessageTemplate } from "../types";

interface TemplatePanelProps {
  onSelectTemplate: (template: MessageTemplate) => void;
  onClose: () => void;
}

/**
 * Template panel component for quick responses
 */
export const TemplatePanel: React.FC<TemplatePanelProps> = ({ onSelectTemplate, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(messageTemplates.map((t) => t.category)))];

  // Filter templates
  const filteredTemplates = messageTemplates.filter((template) => {
    const matchesSearch =
      !searchQuery ||
      template.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group templates by category
  const groupedTemplates = filteredTemplates.reduce(
    (acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    },
    {} as Record<string, MessageTemplate[]>
  );

  return (
    <div className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-96 overflow-hidden rounded-ds-lg border border-[var(--fl-color-border)] bg-white shadow-card-deep">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--fl-color-border-subtle)] spacing-3">
        <h3 className="flex items-center text-sm font-medium text-gray-900">📝 Quick Templates</h3>
        <button onClick={onClose} className="hover:text-foreground text-gray-400" aria-label="Close templates">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search and filters */}
      <div className="space-y-3 border-b border-[var(--fl-color-border-subtle)] spacing-3">
        {/* Search */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-ds-border-strong block w-full rounded-ds-md border py-2 pl-10 pr-3 text-sm focus:border-[var(--fl-color-brand)] focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-ds-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {category === "all" ? "All" : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Templates list */}
      <div className="max-h-64 overflow-y-auto">
        {filteredTemplates.length === 0 ? (
          <div className="spacing-4 text-center text-[var(--fl-color-text-muted)]">
            <div className="mb-2 text-4xl">📝</div>
            <p className="text-sm">No templates found</p>
            <p className="mt-1 text-tiny text-gray-400">Try adjusting your search or category filter</p>
          </div>
        ) : selectedCategory === "all" ? (
          // Show grouped by category
          <div className="space-y-3 spacing-3">
            {Object.entries(groupedTemplates).map(([category, templates]) => (
              <div key={category}>
                <h4 className="text-foreground mb-2 text-tiny font-medium uppercase tracking-wide">{category}</h4>
                <div className="space-y-1">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => onSelectTemplate(template)}
                      className="w-full rounded-ds-lg border border-transparent spacing-3 text-left transition-colors hover:border-[var(--fl-color-border)] hover:bg-background"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h5 className="mb-1 text-sm font-medium text-gray-900">{template.label}</h5>
                          <p className="text-foreground line-clamp-2 text-tiny">{template.content}</p>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <span className="bg-background inline-flex items-center rounded-ds-full px-2 py-1 text-tiny font-medium text-gray-800">
                            {template.category}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Show flat list for specific category
          <div className="space-y-1 spacing-3">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className="w-full rounded-ds-lg border border-transparent spacing-3 text-left transition-colors hover:border-[var(--fl-color-border)] hover:bg-background"
              >
                <h5 className="mb-1 text-sm font-medium text-gray-900">{template.label}</h5>
                <p className="text-foreground line-clamp-2 text-tiny">{template.content}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--fl-color-border-subtle)] bg-gray-50 spacing-3">
        <p className="text-center text-tiny text-[var(--fl-color-text-muted)]">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} available
        </p>
      </div>
    </div>
  );
};

export default TemplatePanel;
