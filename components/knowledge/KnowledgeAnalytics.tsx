"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { ChartLineUp as Activity, BookOpen, Brain, ChartPie, Clock, Download, Eye, Search as Search, Star, Target, TrendDown as TrendingDown, TrendUp as TrendingUp } from "lucide-react";
import { useState } from "react";

interface AnalyticsData {
  overview: {
    totalArticles: number;
    totalViews: number;
    totalSearches: number;
    averageRating: number;
    responseTime: number;
    successRate: number;
  };
  trends: {
    period: string;
    articles: { value: number; change: number };
    views: { value: number; change: number };
    searches: { value: number; change: number };
    rating: { value: number; change: number };
  };
  topArticles: Array<{
    id: string;
    title: string;
    views: number;
    rating: number;
    category: string;
    lastUpdated: Date;
  }>;
  searchQueries: Array<{
    query: string;
    count: number;
    successRate: number;
    avgRating: number;
  }>;
  categories: Array<{
    name: string;
    articles: number;
    views: number;
    rating: number;
    growth: number;
  }>;
  gaps: Array<{
    query: string;
    frequency: number;
    suggestedAction: string;
    priority: "high" | "medium" | "low";
  }>;
  usage: Array<{
    date: string;
    searches: number;
    views: number;
    ratings: number;
  }>;
}

const mockAnalytics: AnalyticsData = {
  overview: {
    totalArticles: 127,
    totalViews: 15420,
    totalSearches: 8934,
    averageRating: 4.7,
    responseTime: 1.2,
    successRate: 89.5,
  },
  trends: {
    period: "Last 30 days",
    articles: { value: 127, change: 12.5 },
    views: { value: 15420, change: 23.1 },
    searches: { value: 8934, change: 18.7 },
    rating: { value: 4.7, change: 2.3 },
  },
  topArticles: [
    {
      id: "1",
      title: "API Authentication Best Practices",
      views: 1547,
      rating: 4.8,
      category: "Security",
      lastUpdated: new Date("2024-01-20"),
    },
    {
      id: "2",
      title: "Getting Started Guide",
      views: 1203,
      rating: 4.9,
      category: "Getting Started",
      lastUpdated: new Date("2024-01-18"),
    },
    {
      id: "3",
      title: "Database Migration Strategies",
      views: 892,
      rating: 4.6,
      category: "Development",
      lastUpdated: new Date("2024-01-15"),
    },
  ],
  searchQueries: [
    { query: "api authentication", count: 234, successRate: 92, avgRating: 4.8 },
    { query: "database migration", count: 189, successRate: 87, avgRating: 4.6 },
    { query: "webhook setup", count: 156, successRate: 78, avgRating: 4.2 },
    { query: "error handling", count: 134, successRate: 85, avgRating: 4.5 },
  ],
  categories: [
    { name: "Security", articles: 23, views: 4521, rating: 4.8, growth: 15.2 },
    { name: "Development", articles: 31, views: 3892, rating: 4.6, growth: 12.8 },
    { name: "Integration", articles: 18, views: 2934, rating: 4.7, growth: 8.9 },
    { name: "Getting Started", articles: 12, views: 2156, rating: 4.9, growth: 22.1 },
  ],
  gaps: [
    {
      query: "webhook troubleshooting",
      frequency: 45,
      suggestedAction: "Create comprehensive webhook debugging guide",
      priority: "high",
    },
    {
      query: "rate limiting best practices",
      frequency: 32,
      suggestedAction: "Add rate limiting section to API docs",
      priority: "medium",
    },
    {
      query: "mobile sdk examples",
      frequency: 28,
      suggestedAction: "Create mobile SDK tutorial series",
      priority: "medium",
    },
  ],
  usage: [
    { date: "2024-01-15", searches: 234, views: 567, ratings: 45 },
    { date: "2024-01-16", searches: 267, views: 623, ratings: 52 },
    { date: "2024-01-17", searches: 298, views: 701, ratings: 48 },
    { date: "2024-01-18", searches: 312, views: 734, ratings: 56 },
    { date: "2024-01-19", searches: 289, views: 678, ratings: 43 },
    { date: "2024-01-20", searches: 345, views: 789, ratings: 61 },
  ],
};

interface KnowledgeAnalyticsProps {
  data?: AnalyticsData;
  className?: string;
}

export function KnowledgeAnalytics({ data = mockAnalytics, className }: KnowledgeAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("30d");

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatChange = (change: number) => {
    const isPositive = change > 0;
    return (
      <span
        className={cn(
          "text-typography-sm flex items-center gap-1",
          isPositive ? "text-semantic-success-dark" : "text-red-600"
        )}
      >
        {isPositive ? <Icon icon={TrendingUp} className="h-3 w-3" /> : <Icon icon={TrendingDown} className="h-3 w-3" />}
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-[var(--fl-color-danger-muted)] bg-[var(--fl-color-danger-subtle)]";
      case "medium":
        return "border-orange-200 bg-orange-50";
      case "low":
        return "border-[var(--fl-color-success-muted)] bg-[var(--fl-color-success-subtle)]";
      default:
        return "border-[var(--fl-color-border)] bg-[var(--fl-color-background-subtle)]";
    }
  };

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    suffix = "",
  }: {
    title: string;
    value: number;
    change?: number;
    icon: unknown;
    suffix?: string;
  }) => (
    <Card>
      <CardContent className="spacing-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-ds-2">
            <Icon className="text-foreground h-4 w-4" />
            <span className="text-foreground text-sm">{title}</span>
          </div>
          {change !== undefined && formatChange(change)}
        </div>
        <div className="text-3xl font-bold">
          {formatNumber(value)}
          {suffix}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Knowledge Analytics</h2>
          <p className="text-foreground">Insights into knowledge base performance and usage</p>
        </div>
        <div className="flex items-center gap-ds-2">
          <Select value={timeRange} onValueChange={(value: string) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" leftIcon={<Icon icon={Download} className="h-4 w-4" />}>
            Export Data
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          title="Total Articles"
          value={data.overview.totalArticles}
          change={data.trends.articles.change}
          icon={BookOpen}
        />
        <MetricCard title="Total Views" value={data.overview.totalViews} change={data.trends.views.change} icon={Eye} />
        <MetricCard
          title="Searches"
          value={data.overview.totalSearches}
          change={data.trends.searches.change}
          icon={Search}
        />
        <MetricCard
          title="Avg Rating"
          value={data.overview.averageRating}
          change={data.trends.rating.change}
          icon={Star}
        />
        <MetricCard title="Response Time" value={data.overview.responseTime} icon={Clock} suffix="s" />
        <MetricCard title="Success Rate" value={data.overview.successRate} icon={Target} suffix="%" />
      </div>

      <Tabs defaultValue="performance" className="space-y-3">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="content">Content Analysis</TabsTrigger>
          <TabsTrigger value="gaps">Knowledge Gaps</TabsTrigger>
          <TabsTrigger value="usage">Usage Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* Top Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-ds-2">
                  <Icon icon={TrendingUp} className="h-5 w-5" />
                  Top Performing Articles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topArticles.map((article, index) => (
                    <div
                      key={article.id}
                      className="flex items-center gap-3 rounded-ds-lg spacing-3 hover:bg-[var(--fl-color-background-subtle)]"
                    >
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-ds-full bg-[var(--fl-color-info-subtle)] text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{article.title}</p>
                        <div className="flex items-center gap-3 text-tiny text-[var(--fl-color-text-muted)]">
                          <span>{article.category}</span>
                          <span>{formatNumber(article.views)} views</span>
                          <span>★ {article.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Search Queries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-ds-2">
                  <Icon icon={Search} className="h-5 w-5" />
                  Popular Search Queries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.searchQueries.map((query, index) => (
                    <div key={index} className="space-y-spacing-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{query.query}</span>
                        <Badge variant="outline">{query.count} searches</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-tiny text-[var(--fl-color-text-muted)]">
                        <div className="flex items-center gap-1">
                          <Icon icon={Target} className="h-3 w-3" />
                          {query.successRate}% success
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon icon={Star} className="h-3 w-3" />
                          {query.avgRating} rating
                        </div>
                      </div>
                      <Progress value={query.successRate} className="h-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-3">
          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-ds-2">
                <Icon icon={ChartPie} className="h-5 w-5" />
                Category Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {data.categories.map((category: unknown) => (
                  <div key={category.name} className="rounded-ds-lg border spacing-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium">{category.name}</h4>
                      {formatChange(category.growth)}
                    </div>
                    <div className="grid grid-cols-3 gap-ds-2 text-sm">
                      <div>
                        <div className="text-[var(--fl-color-text-muted)]">Articles</div>
                        <div className="font-medium">{category.articles}</div>
                      </div>
                      <div>
                        <div className="text-[var(--fl-color-text-muted)]">Views</div>
                        <div className="font-medium">{formatNumber(category.views)}</div>
                      </div>
                      <div>
                        <div className="text-[var(--fl-color-text-muted)]">Rating</div>
                        <div className="font-medium">★ {category.rating}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-3">
          {/* Knowledge Gaps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-ds-2">
                <Icon icon={Brain} className="h-5 w-5" />
                Knowledge Gaps & Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.gaps.map((gap, index) => (
                  <div key={index} className={cn("rounded-ds-lg border-l-4 spacing-4", getPriorityColor(gap.priority))}>
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium">"{gap.query}"</h4>
                        <p className="text-foreground mt-1 text-tiny">{gap.suggestedAction}</p>
                      </div>
                      <div className="flex items-center gap-ds-2">
                        <Badge variant="outline" className="text-tiny">
                          {gap.frequency} searches
                        </Badge>
                        <Badge variant={gap.priority === "high" ? "error" : "secondary"} className="text-tiny">
                          {gap.priority}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-tiny">
                      Create Content
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-3">
          {/* Usage Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-ds-2">
                <Icon icon={Activity} className="h-5 w-5" />
                Usage Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-7 gap-ds-2 text-tiny">
                  {data.usage.map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="mb-1 text-[var(--fl-color-text-muted)]">
                        {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                      <div className="space-y-1">
                        <div className="flex h-16 items-end justify-center rounded bg-[var(--fl-color-info-subtle)]">
                          <div
                            className="w-full rounded-b bg-brand-blue-500"
                            style={{ height: `${(day.searches / 350) * 100}%` }}
                          />
                        </div>
                        <div className="font-medium">{day.searches}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center text-tiny text-[var(--fl-color-text-muted)]">
                  Daily search volume over the last week
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
