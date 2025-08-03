"use client";

import { useCallback, useEffect, useState } from "react";
import DOMPurify from "dompurify";
import {
  Calendar,
  Eye,
  Filter,
  Search,
  Sparkles,
  Star,
  Tag,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent } from "@/components/unified-ui/components/Card";
import { EmptyState, EmptyStateVariantsConfig } from "@/components/unified-ui/components/empty-state";
import { ImprovedInput } from "@/components/unified-ui/components/improved-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/unified-ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  content: string;
  description: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  author: string;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  rating: number;
  similarity?: number;
  highlights?: string[];
}

interface SearchFilters {
  category?: string;
  status?: string;
  author?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  minRating?: number;
  sortBy?: "relevance" | "date" | "views" | "rating";
  sortOrder?: "asc" | "desc";
}

interface KnowledgeSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  categories: string[];
  authors: string[];
  availableTags: string[];
  className?: string;
}

// Mock search results
const mockResults: SearchResult[] = [
  {
    id: "1",
    title: "API Authentication Best Practices",
    content: "Comprehensive guide to implementing secure API authentication...",
    description: "Learn how to implement OAuth 2.0, JWT tokens, and API key management",
    category: "Security",
    tags: ["api", "authentication", "security", "oauth"],
    status: "published",
    author: "John Doe",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    views: 1547,
    rating: 4.8,
    similarity: 0.95,
    highlights: ["API authentication", "OAuth 2.0", "JWT tokens"],
  },
  {
    id: "2",
    title: "Database Migration Strategies",
    content: "Step-by-step guide for safe database migrations...",
    description: "Best practices for zero-downtime database migrations",
    category: "Development",
    tags: ["database", "migration", "deployment"],
    status: "published",
    author: "Jane Smith",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-18"),
    views: 892,
    rating: 4.6,
    similarity: 0.87,
    highlights: ["database migrations", "zero-downtime", "deployment"],
  },
  {
    id: "3",
    title: "React Performance Optimization",
    content: "Advanced techniques for optimizing React applications...",
    description: "Improve your React app performance with these proven techniques",
    category: "Development",
    tags: ["react", "performance", "optimization"],
    status: "draft",
    author: "Mike Johnson",
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-19"),
    views: 645,
    rating: 4.7,
    similarity: 0.82,
    highlights: ["React performance", "optimization techniques"],
  },
];

export function KnowledgeSearch({
  onResultSelect,
  categories,
  authors,
  availableTags,
  className,
}: KnowledgeSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: "relevance",
    sortOrder: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // INTEGRATION: Replace mock API with real knowledge search
      const params = new URLSearchParams({
        q: searchQuery,
        limit: "10",
        ...(searchFilters.category && { category: searchFilters.category }),
        ...(searchFilters.author && { author: searchFilters.author }),
        ...(searchFilters.tags && { tags: searchFilters.tags.join(",") }),
        ...(searchFilters.sortBy && { sortBy: searchFilters.sortBy }),
        ...(searchFilters.sortOrder && { sortOrder: searchFilters.sortOrder }),
      });

      const response = await fetch(`/api/knowledge/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to search knowledge base");
      }

      const data = await response.json();

      // Transform API response to SearchResult format
      const searchResults: SearchResult[] = (data.articles || []).map((article: any) => ({
        id: article.id,
        title: article.title,
        description: article.content?.substring(0, 200) + "..." || "",
        content: article.content || "",
        category: article.category || "General",
        tags: article.tags || [],
        author: article.author_name || "Unknown",
        lastModified: new Date(article.updated_at || article.created_at),
        similarity: article.similarity || 0.8, // Default similarity score
        highlights: [], // TODO: Implement highlighting
        type: "article" as const,
      }));

      setResults(searchResults);
    } catch (error) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filters, performSearch]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const removeFilter = (key: keyof SearchFilters) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({
      sortBy: "relevance",
      sortOrder: "desc",
    });
  };

  const getActiveFilterCount = () => {
    return Object.keys(filters).filter(
      (key) => key !== "sortBy" && key !== "sortOrder" && filters[key as keyof SearchFilters]
    ).length;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const highlightText = (text: string, highlights?: string[]) => {
    if (!highlights?.length) return text;

    let highlightedText = text;
    highlights.forEach((highlight: any) => {
      const regex = new RegExp(`(${highlight})`, "gi");
      highlightedText = highlightedText.replace(regex, '<mark class="bg-blue-100 text-blue-800">$1</mark>');
    });

    // Sanitize HTML to prevent XSS attacks
    const sanitizedHTML = DOMPurify.sanitize(highlightedText);
    return <span dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <ImprovedInput
        value={query}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        placeholder="Search knowledge base..."
        icon={<Icon icon={Search} className="h-4 w-4" />}
        label="Search Knowledge Base"
        hint="Search through articles, documents, and FAQs"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-ds-2">
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger>
            <Button variant="outline" size="sm" className="gap-ds-2">
              <Icon icon={Filter} className="h-4 w-4" />
              Filters
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-tiny">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Search Filters</h4>
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-tiny">
                  Clear All
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={filters.category || ""}
                    onValueChange={(value: string) => updateFilter("category", value || undefined)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={filters.status || ""}
                    onValueChange={(value: string) => updateFilter("status", value || undefined)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Sort By</label>
                  <Select
                    value={filters.sortBy || "relevance"}
                    onValueChange={(value: string) => updateFilter("sortBy", value as SearchFilters["sortBy"])}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="date">Date Modified</SelectItem>
                      <SelectItem value="views">Views</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filters */}
        {filters.category && (
          <Badge variant="secondary" className="gap-1">
            Category: {filters.category}
            <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("category")} />
          </Badge>
        )}
        {filters.status && (
          <Badge variant="secondary" className="gap-1">
            Status: {filters.status}
            <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("status")} />
          </Badge>
        )}
      </div>

      {/* Results */}
      <div className="space-y-3">
        {!query && !loading && (
          <EmptyState
            icon={<Icon icon={Search} />}
            title="Search Knowledge Base"
            description="Enter keywords to find articles, guides, and documentation."
          />
        )}

        {query && !loading && results.length === 0 && (
          <EmptyState
            icon={<Icon icon={Search} />}
            title={EmptyStateVariantsConfig.searchResults(query).title}
            description={EmptyStateVariantsConfig.searchResults(query).description}
          />
        )}

        {results.map((result: any) => (
          <Card
            key={result.id}
            className="cursor-pointer transition-shadow hover:shadow-card-hover"
            onClick={() => onResultSelect?.(result)}
          >
            <CardContent className="spacing-3">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-1 text-base font-medium">{highlightText(result.title, result.highlights)}</h3>
                  <p className="text-foreground mb-2 text-sm">{highlightText(result.description, result.highlights)}</p>
                </div>
                {result.similarity && (
                  <Badge variant="outline" className="ml-2">
                    <Icon icon={Sparkles} className="mr-1 h-3 w-3" />
                    {Math.round(result.similarity * 100)}%
                  </Badge>
                )}
              </div>

              <div className="mb-2 flex items-center gap-3 text-tiny text-[var(--fl-color-text-muted)]">
                <div className="flex items-center gap-1">
                  <Icon icon={Tag} className="h-3 w-3" />
                  {result.category}
                </div>
                <div className="flex items-center gap-1">
                  <Icon icon={User} className="h-3 w-3" />
                  {result.author}
                </div>
                <div className="flex items-center gap-1">
                  <Icon icon={Calendar} className="h-3 w-3" />
                  {formatDate(result.updatedAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Icon icon={Eye} className="h-3 w-3" />
                  {result.views}
                </div>
                <div className="flex items-center gap-1">
                  <Icon icon={Star} className="h-3 w-3" />
                  {result.rating}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {result.tags.slice(0, 3).map((tag: any) => (
                    <Badge key={tag} variant="outline" className="text-tiny">
                      {tag}
                    </Badge>
                  ))}
                  {result.tags.length > 3 && (
                    <Badge variant="outline" className="text-tiny">
                      +{result.tags.length - 3}
                    </Badge>
                  )}
                </div>
                <Badge variant={result.status === "published" ? "default" : "secondary"} className="text-tiny">
                  {result.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
