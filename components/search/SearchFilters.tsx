"use client";

import React from "react";
import { Funnel as Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Checkbox } from "@/components/unified-ui/components/checkbox";
import { Label } from "@/components/unified-ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Slider } from "@/components/unified-ui/components/slider";
import { Icon } from "@/lib/ui/Icon";

export interface SearchFilters {
  categories: string[];
  dateRange: string;
  contentType: string[];
  minSimilarity: number;
  sortBy: string;
  sortOrder: string;
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  show: boolean;
}

export function SearchFiltersPanel({ filters, onFiltersChange, show }: SearchFiltersProps) {
  if (!show) return null;

  const updateFilter = (key: keyof SearchFilters, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleContentType = (type: string, checked: boolean) => {
    if (checked) {
      updateFilter("contentType", [...filters.contentType, type]);
    } else {
      updateFilter(
        "contentType",
        filters.contentType.filter((t: unknown) => t !== type)
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-ds-2">
          <Icon icon={Filter} className="h-5 w-5" />
          Search Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <Label>Content Type</Label>
            <div className="mt-2 space-y-spacing-sm">
              {["knowledge", "conversations", "users"].map((type: unknown) => (
                <div key={type} className="flex items-center space-x-spacing-sm">
                  <Checkbox
                    id={type}
                    checked={filters.contentType.includes(type)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => toggleContentType(type, !!e.target.checked)}
                  />
                  <Label htmlFor={type} className="capitalize">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Date Range</Label>
            <Select value={filters.dateRange} onValueChange={(value: string) => updateFilter("dateRange", value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Sort By</Label>
            <Select value={filters.sortBy} onValueChange={(value: string) => updateFilter("sortBy", value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="views">Views</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Min Similarity: {filters.minSimilarity}</Label>
            <Slider
              value={[filters.minSimilarity]}
              onValueChange={(values: number[]) => updateFilter("minSimilarity", values[0])}
              min={0.1}
              max={1}
              step={0.05}
              className="mt-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
