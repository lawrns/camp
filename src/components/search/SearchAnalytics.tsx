import React from "react";
import { Search as Search, Target, TrendUp as TrendingUp, Zap as Zap } from "lucide-react";
import { Card, CardContent } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";

interface SearchAnalyticsData {
  totalSearches: number;
  avgResponseTime: number;
  successRate: number;
  topCategories: Array<{
    name: string;
    searches: number;
  }>;
}

interface SearchAnalyticsProps {
  analytics: SearchAnalyticsData;
  currentResultsCount: number;
}

export function SearchAnalytics({ analytics, currentResultsCount }: SearchAnalyticsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card>
        <CardContent className="spacing-3 text-center">
          <Icon icon={Search} className="mx-auto mb-2 h-8 w-8 text-blue-600" />
          <div className="text-3xl font-bold">{analytics.totalSearches.toLocaleString()}</div>
          <div className="text-sm text-[var(--fl-color-text-muted)]">Total Searches</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="spacing-3 text-center">
          <Icon icon={Zap} className="text-semantic-success-dark mx-auto mb-2 h-8 w-8" />
          <div className="text-3xl font-bold">{analytics.avgResponseTime}s</div>
          <div className="text-sm text-[var(--fl-color-text-muted)]">Avg Response Time</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="spacing-3 text-center">
          <Icon icon={Target} className="mx-auto mb-2 h-8 w-8 text-purple-600" />
          <div className="text-3xl font-bold">{analytics.successRate}%</div>
          <div className="text-sm text-[var(--fl-color-text-muted)]">Success Rate</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="spacing-3 text-center">
          <Icon icon={TrendingUp} className="mx-auto mb-2 h-8 w-8 text-orange-600" />
          <div className="text-3xl font-bold">{currentResultsCount}</div>
          <div className="text-sm text-[var(--fl-color-text-muted)]">Current Results</div>
        </CardContent>
      </Card>
    </div>
  );
}
