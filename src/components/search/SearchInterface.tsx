"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Clock, RefreshCw as RefreshCw, Search as Search } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { Icon } from "@/lib/ui/Icon";

interface SearchInterfaceProps {
  query: string;
  onQueryChange: (query: string) => void;
  loading: boolean;
  recentSearches: string[];
  popularSearches: Array<{ query: string; count: number }>;
}

export function SearchInterface({
  query,
  onQueryChange,
  loading,
  recentSearches,
  popularSearches,
}: SearchInterfaceProps) {
  return (
    <Card>
      <CardContent className="p-spacing-md">
        <div className="relative">
          <Icon icon={Search} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search knowledge base, conversations, users..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onQueryChange(e.target.value)}
            className="h-12 pl-10 text-base"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Icon icon={RefreshCw} className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        {/* Quick Suggestions */}
        {!query && (
          <div className="mt-4 space-y-3">
            <div>
              <h3 className="text-foreground mb-2 text-sm font-medium">Recent Searches</h3>
              <div className="flex flex-wrap gap-ds-2">
                {recentSearches.map((search, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => onQueryChange(search)}
                    className="text-tiny"
                  >
                    <Icon icon={Clock} className="mr-1 h-3 w-3" />
                    {search}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-foreground mb-2 text-sm font-medium">Popular Searches</h3>
              <div className="space-y-spacing-sm">
                {popularSearches.map((search, index) => (
                  <div
                    key={index}
                    className="flex cursor-pointer items-center justify-between rounded p-spacing-sm hover:bg-[var(--fl-color-background-subtle)]"
                    onClick={() => onQueryChange(search.query)}
                  >
                    <span className="text-sm">{search.query}</span>
                    <Badge variant="secondary" className="text-tiny">
                      {search.count} searches
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
