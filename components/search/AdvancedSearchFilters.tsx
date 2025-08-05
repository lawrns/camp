"use client";

import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/unified-ui/components/Badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, X } from "lucide-react";
import type { SearchFilters } from "@/hooks/useCampfireSearch";

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  className?: string;
}

export function AdvancedSearchFilters({ filters, onFiltersChange, className }: AdvancedSearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const handleDateRangeChange = (field: "start" | "end", date: Date | undefined) => {
    if (!date) return;

    setLocalFilters((prev) => ({
      ...prev,
      dateRange: {
        start: field === "start" ? date : prev.dateRange?.start || new Date(),
        end: field === "end" ? date : prev.dateRange?.end || new Date(),
      },
    }));
  };

  const handleSenderTypeToggle = (type: "customer" | "agent" | "ai") => {
    setLocalFilters((prev) => {
      const current = prev.senderTypes || [];
      const updated = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];

      return {
        ...prev,
        senderTypes: updated.length > 0 ? updated : undefined,
      };
    });
  };

  const handleMessageTypeToggle = (type: "text" | "attachments" | "links" | "system") => {
    setLocalFilters((prev) => {
      const current = prev.messageTypes || [];
      const updated = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];

      return {
        ...prev,
        messageTypes: updated.length > 0 ? updated : undefined,
      };
    });
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    setLocalFilters({});
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.dateRange ||
    (filters.senderTypes && filters.senderTypes.length > 0) ||
    (filters.messageTypes && filters.messageTypes.length > 0);

  const activeFilterCount =
    (filters.dateRange ? 1 : 0) + (filters.senderTypes?.length || 0) + (filters.messageTypes?.length || 0);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant={hasActiveFilters ? "default" : "outline"} size="sm" className="gap-ds-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 spacing-3" align="end">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Advanced Filters</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-tiny">
                  Clear all
                </Button>
              )}
            </div>

            {/* Date Range */}
            <div>
              <label className="mb-2 block text-sm font-medium">Date Range</label>
              <div className="grid grid-cols-2 gap-ds-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateRange?.start ? format(localFilters.dateRange.start, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateRange?.start}
                      onSelect={(date) => handleDateRangeChange("start", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateRange?.end ? format(localFilters.dateRange.end, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateRange?.end}
                      onSelect={(date) => handleDateRangeChange("end", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Sender Types */}
            <div>
              <label className="mb-2 block text-sm font-medium">Sender Type</label>
              <div className="space-y-spacing-sm">
                <label className="flex items-center space-x-spacing-sm">
                  <Checkbox
                    checked={localFilters.senderTypes?.includes("customer") || false}
                    onCheckedChange={() => handleSenderTypeToggle("customer")}
                  />
                  <span className="text-sm">Customer</span>
                </label>
                <label className="flex items-center space-x-spacing-sm">
                  <Checkbox
                    checked={localFilters.senderTypes?.includes("agent") || false}
                    onCheckedChange={() => handleSenderTypeToggle("agent")}
                  />
                  <span className="text-sm">Agent</span>
                </label>
                <label className="flex items-center space-x-spacing-sm">
                  <Checkbox
                    checked={localFilters.senderTypes?.includes("ai") || false}
                    onCheckedChange={() => handleSenderTypeToggle("ai")}
                  />
                  <span className="text-sm">AI</span>
                </label>
              </div>
            </div>

            {/* Message Types */}
            <div>
              <label className="mb-2 block text-sm font-medium">Message Type</label>
              <div className="space-y-spacing-sm">
                <label className="flex items-center space-x-spacing-sm">
                  <Checkbox
                    checked={localFilters.messageTypes?.includes("text") || false}
                    onCheckedChange={() => handleMessageTypeToggle("text")}
                  />
                  <span className="text-sm">Text</span>
                </label>
                <label className="flex items-center space-x-spacing-sm">
                  <Checkbox
                    checked={localFilters.messageTypes?.includes("attachments") || false}
                    onCheckedChange={() => handleMessageTypeToggle("attachments")}
                  />
                  <span className="text-sm">Attachments</span>
                </label>
                <label className="flex items-center space-x-spacing-sm">
                  <Checkbox
                    checked={localFilters.messageTypes?.includes("links") || false}
                    onCheckedChange={() => handleMessageTypeToggle("links")}
                  />
                  <span className="text-sm">Links</span>
                </label>
                <label className="flex items-center space-x-spacing-sm">
                  <Checkbox
                    checked={localFilters.messageTypes?.includes("system") || false}
                    onCheckedChange={() => handleMessageTypeToggle("system")}
                  />
                  <span className="text-sm">System Messages</span>
                </label>
              </div>
            </div>

            {/* Apply Button */}
            <div className="flex justify-end gap-ds-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-ds-2">
          {filters.dateRange && (
            <Badge variant="secondary" className="gap-1">
              {format(filters.dateRange.start, "MMM d")} - {format(filters.dateRange.end, "MMM d")}
              <button
                onClick={() => {
                  const newFilters = { ...filters };
                  delete newFilters.dateRange;
                  onFiltersChange(newFilters);
                }}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.senderTypes?.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1">
              {type}
              <button
                onClick={() => {
                  const newTypes = filters.senderTypes?.filter((t) => t !== type);
                  onFiltersChange({
                    ...filters,
                    senderTypes: newTypes?.length ? newTypes : undefined,
                  });
                }}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters.messageTypes?.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1">
              {type}
              <button
                onClick={() => {
                  const newTypes = filters.messageTypes?.filter((t) => t !== type);
                  onFiltersChange({
                    ...filters,
                    messageTypes: newTypes?.length ? newTypes : undefined,
                  });
                }}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
