import React from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";
import { formatTimeAgo } from "@/lib/utils";

interface CustomerValueCardProps {
  sessions?: number | undefined;
  lifetimeValue?: number | undefined;
  conversationCount?: number | undefined;
  firstSeen: string;
  averageResponseTime?: string | undefined;
}

export function CustomerValueCard({
  sessions,
  lifetimeValue,
  conversationCount,
  firstSeen,
  averageResponseTime,
}: CustomerValueCardProps) {
  return (
    <Card className="border-[var(--fl-color-border)] shadow-card-base">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-ds-2 text-sm font-semibold text-gray-800">
          <Icon icon={BarChart3} className="text-semantic-success h-4 w-4" />
          Customer Value
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground font-medium">Total Sessions:</span>
          <span className="font-semibold text-gray-900">{sessions || 0}</span>
        </div>
        {lifetimeValue && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium">Lifetime Value:</span>
            <span className="font-semibold text-gray-900">${lifetimeValue.toLocaleString()}</span>
          </div>
        )}
        {conversationCount && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium">Conversations:</span>
            <span className="font-semibold text-gray-900">{conversationCount}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground font-medium">First Seen:</span>
          <span className="font-semibold text-gray-900">{formatTimeAgo(firstSeen)}</span>
        </div>
        {averageResponseTime && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium">Avg Response:</span>
            <span className="font-semibold text-gray-900">{averageResponseTime}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
