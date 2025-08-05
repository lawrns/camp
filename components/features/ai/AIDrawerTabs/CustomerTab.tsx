"use client";

import React from "react";
import { AlertTriangle as AlertCircle, Clock, Envelope as Mail, MessageCircle as MessageSquare, TrendUp as TrendingUp, User,  } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Separator } from "@/components/unified-ui/components/Separator";
import { Icon } from "@/lib/ui/Icon";
import type { ConversationWithRelations } from "@/types/entities/conversation";

interface CustomerTabProps {
  conversation: ConversationWithRelations;
}

interface SentimentTrend {
  date: string;
  sentiment: "positive" | "neutral" | "negative";
  score: number;
}

export const CustomerTab: React.FC<CustomerTabProps> = ({ conversation }) => {
  const customer = conversation.customer;

  // Mock sentiment data - in real app, fetch from analytics service
  const sentimentHistory: SentimentTrend[] = [
    { date: "2024-01-15", sentiment: "positive", score: 85 },
    { date: "2024-01-10", sentiment: "neutral", score: 65 },
    { date: "2024-01-05", sentiment: "negative", score: 35 },
    { date: "2023-12-28", sentiment: "neutral", score: 60 },
    { date: "2023-12-20", sentiment: "positive", score: 90 },
  ];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600 bg-[var(--fl-color-success-subtle)]";
      case "neutral":
        return "text-gray-600 bg-[var(--fl-color-background-subtle)]";
      case "negative":
        return "text-red-600 bg-[var(--fl-color-danger-subtle)]";
      default:
        return "text-gray-600 bg-[var(--fl-color-background-subtle)]";
    }
  };

  const getCustomerValue = () => {
    // Mock calculation based on conversation history
    const totalConversations = 12;
    const resolvedConversations = 10;
    const avgResponseTime = 3.5; // hours

    return {
      totalConversations,
      resolvedConversations,
      resolutionRate: Math.round((resolvedConversations / totalConversations) * 100),
      avgResponseTime,
      lifetimeValue: "$2,450",
      accountAge: "8 months",
    };
  };

  const customerMetrics = getCustomerValue();

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 spacing-3">
        {/* Customer Header */}
        <div className="flex items-start gap-3">
          <Avatar className="h-16 w-16">
            <AvatarImage {...(customer?.avatarUrl && { src: customer.avatarUrl })} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-base text-white">
              {customer?.name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("") || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">{customer?.name || "Anonymous Customer"}</h3>
            <div className="text-foreground mt-1 flex items-center gap-3 text-sm">
              {customer?.email && (
                <span className="flex items-center gap-1">
                  <Icon icon={Mail} className="h-3.5 w-3.5" />
                  {customer.email}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Icon icon={Clock} className="h-3.5 w-3.5" />
                {customerMetrics.accountAge}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Customer Value Metrics */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-900">Customer Value</h4>
          <div className="grid grid-cols-2 gap-3">
            <Card className="spacing-3">
              <div className="text-tiny text-[var(--fl-color-text-muted)]">Lifetime Value</div>
              <div className="mt-1 text-base font-semibold text-gray-900">{customerMetrics.lifetimeValue}</div>
            </Card>
            <Card className="spacing-3">
              <div className="text-tiny text-[var(--fl-color-text-muted)]">Total Conversations</div>
              <div className="mt-1 text-base font-semibold text-gray-900">{customerMetrics.totalConversations}</div>
            </Card>
            <Card className="spacing-3">
              <div className="text-tiny text-[var(--fl-color-text-muted)]">Resolution Rate</div>
              <div className="mt-1 flex items-center gap-ds-2">
                <span className="text-base font-semibold text-gray-900">{customerMetrics.resolutionRate}%</span>
                <Progress value={customerMetrics.resolutionRate} className="h-2 w-16" />
              </div>
            </Card>
            <Card className="spacing-3">
              <div className="text-tiny text-[var(--fl-color-text-muted)]">Avg Response Time</div>
              <div className="mt-1 text-base font-semibold text-gray-900">{customerMetrics.avgResponseTime}h</div>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Sentiment Trend */}
        <div>
          <h4 className="mb-3 flex items-center gap-ds-2 text-sm font-medium text-gray-900">
            <Icon icon={TrendingUp} className="h-4 w-4" />
            Sentiment History
          </h4>
          <div className="space-y-spacing-sm">
            {sentimentHistory.map((trend, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-ds-full ${
                      trend.sentiment === "positive"
                        ? "bg-semantic-success"
                        : trend.sentiment === "negative"
                          ? "bg-brand-mahogany-500"
                          : "bg-neutral-400"
                    }`}
                  />
                  <span className="text-foreground text-sm">
                    {new Date(trend.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <Badge variant="secondary" className={`text-xs ${getSentimentColor(trend.sentiment)}`}>
                  {trend.sentiment} ({trend.score}%)
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Recent Issues */}
        <div>
          <h4 className="mb-3 flex items-center gap-ds-2 text-sm font-medium text-gray-900">
            <Icon icon={AlertCircle} className="h-4 w-4" />
            Common Topics
          </h4>
          <div className="flex flex-wrap gap-ds-2">
            <Badge variant="outline">Shipping delays</Badge>
            <Badge variant="outline">Refund requests</Badge>
            <Badge variant="outline">Product quality</Badge>
            <Badge variant="outline">Account access</Badge>
          </div>
        </div>

        {/* Customer Notes */}
        <Card className="border-amber-200 bg-amber-50 spacing-3">
          <h4 className="mb-2 flex items-center gap-ds-2 text-sm font-medium text-amber-900">
            <Icon icon={MessageSquare} className="h-4 w-4" />
            Customer Notes
          </h4>
          <p className="text-sm text-amber-800">
            VIP customer - High lifetime value. Prefers email communication. Had shipping issues in the past but
            remained loyal. Appreciates detailed explanations and proactive updates.
          </p>
        </Card>
      </div>
    </div>
  );
};
