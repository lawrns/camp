"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import {
  Activity,
  Brain,
  Buildings as Building,
  Calendar,
  Clock,
  Envelope as Mail,
  MapPin,
  ChatCircle as MessageSquare,
  Phone,
  Star,
  Tag,
  TrendUp as TrendingUp,
  User,
} from "@phosphor-icons/react";
import { ImprovedHandoverButton } from "@/components/ai/handover/ImprovedHandoverButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface CustomerData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  displayString: string;
  createdAt?: string;
  lastSeenAt?: string;
  tags: string[];
  customFields: Record<string, any>;
}

interface Conversation {
  id: string;
  organizationId?: string;
}

interface InboxDetailsPanelProps {
  conversation: Conversation;
  customerData: CustomerData;
}

/**
 * InboxDetailsPanel - Beautiful, focused customer details panel
 *
 * Features:
 * - Beautiful visual design with Flame UI
 * - Tabbed interface for different data views
 * - AI handover integration
 * - Under 300 lines, focused responsibility
 */
export function InboxDetailsPanel({ conversation, customerData }: InboxDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState("details");

  const mockActivityData = [
    { id: 1, type: "message", description: "Sent a message", timestamp: "2 minutes ago" },
    { id: 2, type: "view", description: "Viewed pricing page", timestamp: "1 hour ago" },
    { id: 3, type: "signup", description: "Created account", timestamp: "2 days ago" },
  ];

  const mockInsights = [
    { label: "Satisfaction Score", value: "4.8/5", trend: "up" },
    { label: "Response Time", value: "< 2 min", trend: "stable" },
    { label: "Total Messages", value: "47", trend: "up" },
  ];

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-white to-gray-50/30">
      {/* Customer Header */}
      <OptimizedMotion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-[var(--fl-color-border)]/50 border-b bg-gradient-to-r from-white to-gray-50/50 p-spacing-md"
      >
        <div className="mb-4 flex items-center gap-3">
          <Avatar className="h-16 w-16">
            {customerData.avatar && <AvatarImage src={customerData.avatar} />}
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-base text-white">
              {(customerData.name || customerData.email || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h3 className="mb-1 text-base font-semibold text-gray-900">
              {customerData.name || customerData.email || "Unknown Customer"}
            </h3>
            <p className="text-foreground mb-2 text-sm">{customerData.email || "No email"}</p>

            <div className="flex items-center gap-ds-2">
              <div className="bg-semantic-success h-2 w-2 rounded-ds-full" />
              <span className="text-tiny text-[var(--fl-color-text-muted)]">Online</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-ds-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Icon icon={Mail} className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Icon icon={Phone} className="mr-2 h-4 w-4" />
            Call
          </Button>
        </div>
      </OptimizedMotion.div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
          <TabsList className="mx-4 mt-4 grid w-full grid-cols-3">
            <TabsTrigger value="details" className="text-tiny">
              Details
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-tiny">
              Activity
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-tiny">
              AI Insights
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto spacing-3">
            <OptimizedAnimatePresence mode="wait">
              <TabsContent key="details" value="details" className="mt-0 space-y-3">
                <OptimizedMotion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-3"
                >
                  {/* Contact Information */}
                  <Card className="border-[var(--fl-color-border)]/50 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-ds-2 text-sm font-medium">
                        <Icon icon={User} className="h-4 w-4 text-[var(--fl-color-info)]" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Icon icon={Mail} className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{customerData.email || "No email"}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Icon icon={Calendar} className="h-4 w-4 text-gray-400" />
                        <span className="text-foreground text-sm">
                          Joined{" "}
                          {customerData.createdAt
                            ? formatDistanceToNow(new Date(customerData.createdAt), { addSuffix: true })
                            : "recently"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Icon icon={Clock} className="h-4 w-4 text-gray-400" />
                        <span className="text-foreground text-sm">
                          Last seen{" "}
                          {customerData.lastSeenAt
                            ? formatDistanceToNow(new Date(customerData.lastSeenAt), { addSuffix: true })
                            : "recently"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tags */}
                  {customerData.tags && customerData.tags.length > 0 && (
                    <Card className="border-[var(--fl-color-border)]/50 bg-background/80 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-ds-2 text-sm font-medium">
                          <Icon icon={Tag} className="h-4 w-4 text-purple-500" />
                          Tags
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-ds-2">
                          {customerData.tags.map((tag: any) => (
                            <Badge key={tag} variant="secondary" className="text-tiny">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Handover */}
                  <Card className="border-purple-200/50 bg-gradient-to-br from-purple-50 to-blue-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-ds-2 text-sm font-medium">
                        <Icon icon={Brain} className="h-4 w-4 text-purple-500" />
                        AI Assistant
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ImprovedHandoverButton
                        conversationId={conversation.id}
                        currentConfidence={0.85}
                        complexity={0.5}
                        reasons={[]}
                        config={{
                          confidenceThreshold: 0.7,
                          complexityThreshold: 0.8,
                          timeoutThreshold: 30,
                          availableAgents: 3,
                          estimatedWaitTime: 5,
                        }}
                        onHandover={async (reason) => {}}
                        variant="inline"
                        showDetails={true}
                      />
                    </CardContent>
                  </Card>
                </OptimizedMotion.div>
              </TabsContent>

              <TabsContent key="activity" value="activity" className="mt-0">
                <OptimizedMotion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-3"
                >
                  {mockActivityData.map((activity, index) => (
                    <OptimizedMotion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-[var(--fl-color-border)]/50 bg-background/80 flex items-start gap-3 rounded-ds-lg border spacing-3 backdrop-blur-sm"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-ds-full",
                          activity.type === "message" && "bg-[var(--fl-color-info-subtle)]",
                          activity.type === "view" && "bg-[var(--fl-color-success-subtle)]",
                          activity.type === "signup" && "bg-purple-100"
                        )}
                      >
                        {activity.type === "message" && <Icon icon={MessageSquare} className="h-4 w-4 text-blue-600" />}
                        {activity.type === "view" && (
                          <Icon icon={Activity} className="text-semantic-success-dark h-4 w-4" />
                        )}
                        {activity.type === "signup" && <Icon icon={Star} className="h-4 w-4 text-purple-600" />}
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-tiny text-[var(--fl-color-text-muted)]">{activity.timestamp}</p>
                      </div>
                    </OptimizedMotion.div>
                  ))}
                </OptimizedMotion.div>
              </TabsContent>

              <TabsContent key="insights" value="insights" className="mt-0">
                <OptimizedMotion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-3"
                >
                  {mockInsights.map((insight, index) => (
                    <OptimizedMotion.div
                      key={insight.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="border-[var(--fl-color-border)]/50 bg-background/80 backdrop-blur-sm">
                        <CardContent className="spacing-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{insight.label}</p>
                              <p className="mt-1 text-base font-semibold text-gray-900">{insight.value}</p>
                            </div>

                            <div
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-ds-full",
                                insight.trend === "up" && "bg-[var(--fl-color-success-subtle)]",
                                insight.trend === "stable" && "bg-[var(--fl-color-info-subtle)]"
                              )}
                            >
                              <Icon
                                icon={TrendingUp}
                                className={cn(
                                  "h-4 w-4",
                                  insight.trend === "up" && "text-semantic-success-dark",
                                  insight.trend === "stable" && "text-blue-600"
                                )}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </OptimizedMotion.div>
                  ))}

                  <Card className="border-status-info-light/50 bg-gradient-to-br from-blue-50 to-purple-50">
                    <CardContent className="spacing-3">
                      <div className="mb-3 flex items-center gap-3">
                        <Icon icon={Brain} className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium text-gray-900">AI Recommendation</h4>
                      </div>
                      <p className="text-foreground text-sm">
                        This customer shows high engagement and satisfaction. Consider offering them a premium upgrade
                        or loyalty program.
                      </p>
                    </CardContent>
                  </Card>
                </OptimizedMotion.div>
              </TabsContent>
            </OptimizedAnimatePresence>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
