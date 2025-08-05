"use client";

import React, { useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Input } from "@/components/unified-ui/components/Input";
import { cn } from "@/lib/utils";
import { Variable as VariableIcon, Search } from "lucide-react";
import { AVAILABLE_VARIABLES, type Variable } from "@/lib/cannedResponses/variableSubstitution";

interface VariablePickerProps {
  onVariableSelect: (variable: string) => void;
  className?: string;
  triggerClassName?: string;
}

export function VariablePicker({ onVariableSelect, className, triggerClassName }: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVariables = AVAILABLE_VARIABLES.filter(
    (variable) =>
      variable.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variable.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variable.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedVariables = filteredVariables.reduce(
    (acc, variable) => {
      if (!acc[variable.category]) {
        acc[variable.category] = [];
      }
      acc[variable.category].push(variable);
      return acc;
    },
    {} as Record<string, Variable[]>
  );

  const categoryLabels = {
    customer: "Customer Information",
    agent: "Agent Information",
    conversation: "Conversation Details",
    organization: "Organization Settings",
  };

  const categoryColors = {
    customer: "bg-blue-100 text-blue-800 border-[var(--fl-color-info-muted)]",
    agent: "bg-green-100 text-green-800 border-[var(--fl-color-success-muted)]",
    conversation: "bg-purple-100 text-purple-800 border-purple-200",
    organization: "bg-orange-100 text-orange-800 border-orange-200",
  };

  const handleVariableClick = (variable: Variable) => {
    onVariableSelect(`{${variable.key}}`);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-2", triggerClassName)}>
          <VariableIcon className="h-4 w-4" />
          Variables
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-96 p-0", className)} align="start" sideOffset={5}>
        <div className="border-b spacing-3">
          <div className="flex items-center gap-ds-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search variables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 border-0 p-0 text-sm focus:ring-0"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto spacing-3">
          {Object.entries(groupedVariables).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(groupedVariables).map(([category, variables]) => (
                <div key={category}>
                  <h3 className="mb-2 text-tiny font-semibold uppercase text-[var(--fl-color-text-muted)]">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h3>
                  <div className="space-y-1">
                    {variables.map((variable) => (
                      <OptimizedMotion.button
                        key={variable.key}
                        onClick={() => handleVariableClick(variable)}
                        className="group w-full rounded-ds-md p-spacing-sm text-left transition-colors hover:bg-[var(--fl-color-background-subtle)]"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-start justify-between gap-ds-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-ds-2">
                              <code className="bg-background text-foreground rounded px-1.5 py-0.5 text-tiny font-medium">
                                {`{${variable.key}}`}
                              </code>
                              <span className="text-sm font-medium text-gray-900">{variable.label}</span>
                            </div>
                            <p className="mt-1 text-tiny text-[var(--fl-color-text-muted)]">{variable.description}</p>
                            <p className="mt-1 text-tiny text-gray-400">Example: {variable.example}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", categoryColors[category as keyof typeof categoryColors])}
                          >
                            {category}
                          </Badge>
                        </div>
                      </OptimizedMotion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--fl-color-text-muted)]">No variables found</p>
              <p className="mt-1 text-tiny text-gray-400">Try adjusting your search query</p>
            </div>
          )}
        </div>

        <div className="border-t bg-[var(--fl-color-background-subtle)] spacing-3">
          <div className="rounded-ds-md bg-[var(--fl-color-info-subtle)] p-spacing-sm">
            <p className="text-tiny text-blue-700">
              <strong>Tip:</strong> Variables will be automatically replaced with actual values when you use the canned
              response. Unresolved variables will be highlighted for manual completion.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
