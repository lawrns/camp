"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { AlertTriangle as AlertCircle, Bot as Bot, Calendar as CalendarIcon, Clock, Funnel as Filter, MessageCircle as MessageSquare, Search as Search, Star, Tag, TrendUp as TrendingUp, User, X,  } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Calendar } from "@/components/unified-ui/components/calendar";
import { Checkbox } from "@/components/unified-ui/components/checkbox";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/unified-ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Separator } from "@/components/unified-ui/components/Separator";
import { Slider } from "@/components/unified-ui/components/slider";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

export interface FilterConfig {
  id: string;
  label: string;
  type: "select" | "multiselect" | "date" | "daterange" | "number" | "text" | "boolean";
  options?: { value: string; label: string; icon?: React.ReactNode }[];
  icon?: React.ReactNode;
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface FilterValue {
  [key: string]: unknown;
}

interface AdvancedFiltersProps {
  filters: FilterConfig[];
  values: FilterValue;
  onChange: (values: FilterValue) => void;
  onReset?: () => void;
  className?: string;
  presets?: {
    label: string;
    values: FilterValue;
    icon?: React.ReactNode;
  }[];
}

export function AdvancedFilters({ filters, values, onChange, onReset, className, presets }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localValues, setLocalValues] = useState<FilterValue>(values);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const activeFiltersCount = Object.keys(localValues).filter(
    (key) =>
      localValues[key] !== undefined &&
      localValues[key] !== null &&
      localValues[key] !== "" &&
      (Array.isArray(localValues[key]) ? localValues[key].length > 0 : true)
  ).length;

  const handleFilterChange = (filterId: string, value: unknown) => {
    const newValues = { ...localValues, [filterId]: value };
    setLocalValues(newValues);
  };

  const handleApply = () => {
    onChange(localValues);
    setIsOpen(false);
  };

  const handleReset = () => {
    const emptyValues: FilterValue = {};
    filters.forEach((filter: unknown) => {
      emptyValues[filter.id] = filter.type === "multiselect" ? [] : undefined;
    });
    setLocalValues(emptyValues);
    if (onReset) {
      onReset();
    } else {
      onChange(emptyValues);
    }
  };

  const handlePreset = (presetValues: FilterValue) => {
    setLocalValues(presetValues);
    onChange(presetValues);
    setIsOpen(false);
  };

  const renderFilterControl = (filter: FilterConfig) => {
    const value = localValues[filter.id];

    switch (filter.type) {
      case "select":
        return (
          <Select value={value} onValueChange={(val: string) => handleFilterChange(filter.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option: unknown) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-ds-2">
                    {option.icon}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        return (
          <div className="space-y-spacing-sm">
            {filter.options?.map((option: unknown) => (
              <div key={option.value} className="flex items-center space-x-spacing-sm">
                <Checkbox
                  id={`${filter.id}-${option.value}`}
                  checked={(value || []).includes(option.value)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const checked = e.target.checked;
                    const currentValues = value || [];
                    const newValues = checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: string) => v !== option.value);
                    handleFilterChange(filter.id, newValues);
                  }}
                />
                <Label htmlFor={`${filter.id}-${option.value}`} className="flex cursor-pointer items-center gap-ds-2">
                  {option.icon}
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : <span>{filter.placeholder || "Pick a date"}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                {...(value && { selected: new Date(value) })}
                onSelect={(date) => handleFilterChange(filter.id, date?.toISOString())}
              />
            </PopoverContent>
          </Popover>
        );

      case "daterange":
        return (
          <div className="space-y-spacing-sm">
            <Popover>
              <PopoverTrigger>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !value?.from && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value?.from ? (
                    value?.to ? (
                      <>
                        {format(new Date(value.from), "LLL dd, y")} - {format(new Date(value.to), "LLL dd, y")}
                      </>
                    ) : (
                      format(new Date(value.from), "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="range"
                  {...(value?.from && { defaultMonth: new Date(value.from) })}
                  {...(value?.from &&
                    value?.to && {
                      selected: {
                        from: new Date(value.from),
                        to: new Date(value.to),
                      },
                    })}
                  onSelect={(range: { from?: Date; to?: Date } | undefined) =>
                    handleFilterChange(filter.id, {
                      from: range?.from?.toISOString(),
                      to: range?.to?.toISOString(),
                    })
                  }
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      case "number":
        return filter.min !== undefined && filter.max !== undefined ? (
          <div className="space-y-spacing-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{value?.[0] || filter.min}</span>
              <span className="text-sm text-muted-foreground">{value?.[1] || filter.max}</span>
            </div>
            <Slider
              value={value || [filter.min, filter.max]}
              onValueChange={(val: number[]) => handleFilterChange(filter.id, val)}
              min={filter.min}
              max={filter.max}
              step={1}
              className="w-full"
            />
          </div>
        ) : (
          <Input
            type="number"
            value={value || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleFilterChange(filter.id, e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder={filter.placeholder}
            min={filter.min}
            max={filter.max}
          />
        );

      case "text":
        return (
          <Input
            value={value || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange(filter.id, e.target.value)}
            placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}`}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-spacing-sm">
            <Checkbox
              id={filter.id}
              checked={value || false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange(filter.id, e.target.checked)}
            />
            <Label htmlFor={filter.id} className="cursor-pointer">
              {filter.label}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  const filteredFilters = filters.filter((filter: unknown) =>
    filter.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <Button variant="outline" className={cn("gap-2", className)}>
          <Icon icon={Filter} className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0">
        <div className="border-b spacing-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">Advanced Filters</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <Icon icon={X} className="h-4 w-4" />
            </Button>
          </div>

          {/* Search filters */}
          <div className="relative">
            <Icon
              icon={Search}
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground"
            />
            <Input
              placeholder="Search filters..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Presets */}
        {presets && presets.length > 0 && (
          <>
            <div className="spacing-3">
              <Label className="text-tiny uppercase text-muted-foreground">Presets</Label>
              <div className="mt-2 flex flex-wrap gap-ds-2">
                {presets.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreset(preset.values)}
                    className="gap-ds-2"
                  >
                    {preset.icon}
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Filters */}
        <div className="max-h-[400px] space-y-3 overflow-y-auto spacing-3">
          {filteredFilters.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No filters found</p>
          ) : (
            filteredFilters.map((filter: unknown) => (
              <div key={filter.id} className="space-y-spacing-sm">
                <Label className="flex items-center gap-ds-2">
                  {filter.icon}
                  {filter.label}
                </Label>
                {renderFilterControl(filter)}
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t spacing-3">
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={activeFiltersCount === 0}>
            Reset
          </Button>
          <div className="flex gap-ds-2">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Example usage configurations for different pages
export const conversationFilters: FilterConfig[] = [
  {
    id: "status",
    label: "Status",
    type: "multiselect",
    icon: <Icon icon={MessageSquare} className="h-4 w-4" />,
    options: [
      { value: "open", label: "Open", icon: <div className="bg-semantic-success h-2 w-2 rounded-ds-full" /> },
      { value: "pending", label: "Pending", icon: <div className="bg-semantic-warning h-2 w-2 rounded-ds-full" /> },
      { value: "resolved", label: "Resolved", icon: <div className="h-2 w-2 rounded-ds-full bg-brand-blue-500" /> },
      { value: "closed", label: "Closed", icon: <div className="h-2 w-2 rounded-ds-full bg-neutral-500" /> },
    ],
  },
  {
    id: "priority",
    label: "Priority",
    type: "multiselect",
    icon: <Icon icon={AlertCircle} className="h-4 w-4" />,
    options: [
      { value: "urgent", label: "Urgent", icon: <div className="bg-brand-mahogany-500 h-2 w-2 rounded-ds-full" /> },
      { value: "high", label: "High", icon: <div className="bg-semantic-warning h-2 w-2 rounded-ds-full" /> },
      { value: "medium", label: "Medium", icon: <div className="bg-semantic-warning h-2 w-2 rounded-ds-full" /> },
      { value: "low", label: "Low", icon: <div className="h-2 w-2 rounded-ds-full bg-neutral-500" /> },
    ],
  },
  {
    id: "assignee",
    label: "Assigned To",
    type: "select",
    icon: <Icon icon={User} className="h-4 w-4" />,
    placeholder: "Any agent",
    options: [
      { value: "me", label: "Me" },
      { value: "unassigned", label: "Unassigned" },
      { value: "ai", label: "AI Assistant", icon: <Icon icon={Bot} className="h-3 w-3" /> },
    ],
  },
  {
    id: "dateRange",
    label: "Date Range",
    type: "daterange",
    icon: <CalendarIcon className="h-4 w-4" />,
  },
  {
    id: "tags",
    label: "Tags",
    type: "multiselect",
    icon: <Icon icon={Tag} className="h-4 w-4" />,
    options: [
      { value: "vip", label: "VIP", icon: <Icon icon={Star} className="h-3 w-3" /> },
      { value: "billing", label: "Billing" },
      { value: "technical", label: "Technical" },
      { value: "feedback", label: "Feedback" },
    ],
  },
  {
    id: "responseTime",
    label: "Response Time (minutes)",
    type: "number",
    icon: <Icon icon={Clock} className="h-4 w-4" />,
    min: 0,
    max: 120,
  },
  {
    id: "hasAttachments",
    label: "Has Attachments",
    type: "boolean",
  },
];

export const conversationPresets = [
  {
    label: "Urgent & Open",
    icon: <Icon icon={AlertCircle} className="h-3 w-3" />,
    values: {
      status: ["open"],
      priority: ["urgent", "high"],
    },
  },
  {
    label: "My Conversations",
    icon: <Icon icon={User} className="h-3 w-3" />,
    values: {
      assignee: "me",
      status: ["open", "pending"],
    },
  },
  {
    label: "AI Handled",
    icon: <Icon icon={Bot} className="h-3 w-3" />,
    values: {
      assignee: "ai",
    },
  },
  {
    label: "Today's",
    icon: <Icon icon={Clock} className="h-3 w-3" />,
    values: {
      dateRange: {
        from: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        to: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
      },
    },
  },
];
