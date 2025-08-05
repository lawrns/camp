"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { OptimizedAnimatePresence, OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { Icon } from "@/lib/ui/Icon";
import { BookOpen, CaretRight as ChevronRight, Eye, Search as Search, Sparkles as Sparkles, Tag, ThumbsDown, ThumbsUp } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface FAQCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  article_count: number;
}

interface FAQResult {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  category_name: string | null;
  category_color: string | null;
  tags: string[];
  keywords: string[];
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  relevance_score: number;
}

interface FAQSearchProps {
  organizationId: string;
  onArticleSelect?: (article: FAQResult) => void;
  compact?: boolean;
  maxResults?: number;
}

export default function FAQSearch({
  organizationId,
  onArticleSelect,
  compact = false,
  maxResults = 20,
}: FAQSearchProps) {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [results, setResults] = useState<FAQResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchMethod, setSearchMethod] = useState<"hybrid" | "text" | "semantic">("hybrid");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [organizationId]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim() || selectedCategory !== "all" || selectedTags.length > 0) {
        performSearch();
      } else {
        loadFeaturedArticles();
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, selectedCategory, selectedTags, searchMethod]);

  const loadCategories = async () => {
    try {
      const response = await fetch(`/api/faq/categories?organization_id=${organizationId}`);

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadFeaturedArticles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/faq/search?organization_id=${organizationId}&limit=${maxResults}`);

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        organization_id: organizationId,
        q: query,
        method: searchMethod,
        limit: maxResults.toString(),
      });

      if (selectedCategory !== "all") {
        params.append("category_id", selectedCategory);
      }

      if (selectedTags.length > 0) {
        params.append("tags", selectedTags.join(","));
      }

      const response = await fetch(`/api/faq/search?${params}`);

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (articleId: string, helpful: boolean) => {
    try {
      await fetch("/api/faq/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: articleId,
          organization_id: organizationId,
          helpful,
        }),
      });

      // Update local state
      setResults((prev) =>
        prev.map((result: unknown) => {
          if (result.id === articleId) {
            return {
              ...result,
              helpful_count: helpful ? result.helpful_count + 1 : result.helpful_count,
              not_helpful_count: !helpful ? result.not_helpful_count + 1 : result.not_helpful_count,
            };
          }
          return result;
        })
      );
    } catch (error) { }
  };

  const toggleExpanded = (articleId: string) => {
    setExpandedResult(expandedResult === articleId ? null : articleId);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.split(" ").join("|")})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="rounded bg-yellow-200 px-1 text-yellow-900">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const allTags = Array.from(new Set(results.flatMap((result) => result.tags))).slice(0, 20);

  return (
    <div className={`space-y-6 ${compact ? "max-w-2xl" : "max-w-4xl"} mx-auto`}>
      {/* Search Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-ds-2">
          <Icon icon={BookOpen} className="h-6 w-6 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-900">{compact ? "Quick Help" : "Knowledge Base"}</h2>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Icon icon={Search} className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          <Input
            type="text"
            placeholder="Search for answers..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            className="border-2 py-3 pl-10 pr-4 text-base transition-colors focus:border-[var(--fl-color-brand)]"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
              <div className="h-5 w-5 animate-spin rounded-ds-full border-2 border-[var(--fl-color-brand)] border-t-transparent" />
            </div>
          )}
        </div>

        {/* Filters */}
        {!compact && (
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: unknown) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-ds-2">
                      <div className={`h-3 w-3 rounded-ds-full bg-[${category.color}]`} />
                      {category.name} ({category.article_count})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={searchMethod} onValueChange={(value: unknown) => setSearchMethod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hybrid">
                  <div className="flex items-center gap-ds-2">
                    <Icon icon={Sparkles} className="h-4 w-4" />
                    Smart
                  </div>
                </SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="semantic">Semantic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tag filters */}
        {allTags.length > 0 && !compact && (
          <div className="flex flex-wrap gap-ds-2">
            {allTags.map((tag: unknown) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer transition-colors hover:bg-[var(--fl-color-info-subtle)]"
                onClick={() => {
                  setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t: unknown) => t !== tag) : [...prev, tag]));
                }}
              >
                <Icon icon={Tag} className="mr-1 h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Categories Grid */}
      {!query && selectedCategory === "all" && selectedTags.length === 0 && !compact && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category: unknown) => (
            <OptimizedMotion.div key={category.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card
                className="cursor-pointer border-l-4 transition-shadow hover:shadow-card-deep"
                className={`border-l-4 border-l-[${category.color}]`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <CardContent className="spacing-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-foreground mt-1 text-sm">{category.description}</p>
                      <div className="mt-2 flex items-center gap-1 text-tiny text-[var(--fl-color-text-muted)]">
                        <Icon icon={BookOpen} className="h-3 w-3" />
                        {category.article_count} articles
                      </div>
                    </div>
                    <Icon icon={ChevronRight} className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </OptimizedMotion.div>
          ))}
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-3">
        {results.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-foreground text-sm">
              {results.length} result{results.length !== 1 ? "s" : ""} found
              {query && ` for "${query}"`}
            </p>
            {!compact && (
              <div className="text-tiny text-[var(--fl-color-text-muted)]">Search method: {searchMethod}</div>
            )}
          </div>
        )}

        <OptimizedAnimatePresence mode="wait">
          {results.map((result, index) => (
            <OptimizedMotion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="transition-shadow hover:shadow-card-hover">
                <CardContent className="spacing-3">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-ds-2">
                          {result.category_name && (
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: result.category_color || "#6366f1",
                                color: result.category_color || "#6366f1",
                              }}
                            >
                              {result.category_name}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 text-tiny text-[var(--fl-color-text-muted)]">
                            <Icon icon={Eye} className="h-3 w-3" />
                            {result.view_count}
                          </div>
                        </div>

                        <h3
                          className="cursor-pointer text-base font-semibold text-gray-900 transition-colors hover:text-blue-600"
                          onClick={() => (onArticleSelect ? onArticleSelect(result) : toggleExpanded(result.id))}
                        >
                          {highlightText(result.title, query)}
                        </h3>

                        <p className="text-foreground mt-1">
                          {highlightText(result.summary || result.content.slice(0, 150) + "...", query)}
                        </p>
                      </div>

                      <Button variant="ghost" size="sm" onClick={() => toggleExpanded(result.id)} className="ml-2">
                        <Icon
                          icon={ChevronRight}
                          className={`h-4 w-4 transition-transform ${expandedResult === result.id ? "rotate-90" : ""}`}
                        />
                      </Button>
                    </div>

                    {/* Tags */}
                    {result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {result.tags.slice(0, compact ? 3 : 5).map((tag: unknown) => (
                          <Badge key={tag} variant="secondary" className="text-tiny">
                            {tag}
                          </Badge>
                        ))}
                        {result.tags.length > (compact ? 3 : 5) && (
                          <Badge variant="secondary" className="text-tiny">
                            +{result.tags.length - (compact ? 3 : 5)} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Expanded Content */}
                    <OptimizedAnimatePresence>
                      {expandedResult === result.id && (
                        <OptimizedMotion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 border-t pt-3"
                        >
                          <div className="text-foreground prose prose-sm max-w-none">
                            {highlightText(result.content, query)}
                          </div>

                          {/* Feedback */}
                          <div className="mt-4 flex items-center justify-between border-t pt-3">
                            <div className="text-tiny text-[var(--fl-color-text-muted)]">Was this helpful?</div>
                            <div className="flex items-center gap-ds-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFeedback(result.id, true)}
                                className="text-semantic-success-dark hover:text-green-600-dark hover:bg-[var(--fl-color-success-subtle)]"
                              >
                                <Icon icon={ThumbsUp} className="mr-1 h-4 w-4" />
                                {result.helpful_count}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFeedback(result.id, false)}
                                className="text-status-error hover:text-red-600-dark hover:bg-[var(--fl-color-danger-subtle)]"
                              >
                                <Icon icon={ThumbsDown} className="mr-1 h-4 w-4" />
                                {result.not_helpful_count}
                              </Button>
                            </div>
                          </div>
                        </OptimizedMotion.div>
                      )}
                    </OptimizedAnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </OptimizedMotion.div>
          ))}
        </OptimizedAnimatePresence>

        {/* Empty State */}
        {!isLoading && results.length === 0 && query && (
          <OptimizedMotion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
            <Icon icon={BookOpen} className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-base font-medium text-gray-900">No results found</h3>
            <p className="text-foreground mb-4">Try adjusting your search terms or browse categories above.</p>
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setSelectedCategory("all");
                setSelectedTags([]);
              }}
            >
              Clear filters
            </Button>
          </OptimizedMotion.div>
        )}
      </div>
    </div>
  );
}
