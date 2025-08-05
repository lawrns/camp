/**
 * Conversation Similarity Panel
 *
 * Displays similar conversations and insights for the current conversation.
 * Helps agents find relevant past conversations and resolution strategies.
 */

"use client";

import React, { useEffect, useState } from "react";
import {
  Warning as AlertTriangle,
  ChartBar as BarChart3,
  CheckCircle,
  Clock,
  Lightbulb,
  MessageSquare,
  Search,
  Target,
  TrendUp as TrendingUp,
  Users,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import {
  ConversationCluster,
  ConversationMatch,
  conversationSimilarityMatcher,
} from "@/lib/ai/ConversationSimilarityMatcher";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface ConversationSimilarityPanelProps {
  conversationId: string;
  organizationId: string;
  onSelectSimilarConversation?: (conversationId: string) => void;
  showClusters?: boolean;
  showInsights?: boolean;
  className?: string;
}

// Extended interface for similarity panel with additional properties
interface ExtendedConversationMatch extends ConversationMatch {
  conversation?: {
    status: string;
    title?: string;
    messageCount?: number;
    participants?: number;
    lastActivity?: string;
  };
  keyTopics?: string[];
  matchReason?: string[];
  suggestedActions?: string[];
  insights?: {
    escalationRisk?: number;
    resolutionProbability?: number;
  };
}

interface ExtendedConversationCluster extends ConversationCluster {
  clusterId?: string;
  conversations: unknown[];
  pattern?: {
    type: string;
  };
  averageSimilarity?: number;
  commonTopics?: string[];
  resolutionInsights?: {
    successRate: number;
    averageTime: number;
    commonSolutions: string[];
  };
}

interface SimilarityPanelState {
  matches: ExtendedConversationMatch[];
  clusters: ExtendedConversationCluster[];
  insights: unknown;
  loading: boolean;
  error: string | null;
  activeTab: "matches" | "clusters" | "insights";
}

export function ConversationSimilarityPanel({
  conversationId,
  organizationId,
  onSelectSimilarConversation,
  showClusters = true,
  showInsights = true,
  className,
}: ConversationSimilarityPanelProps) {
  const [state, setState] = useState<SimilarityPanelState>({
    matches: [],
    clusters: [],
    insights: null,
    loading: true,
    error: null,
    activeTab: "matches",
  });

  useEffect(() => {
    loadSimilarityData();
  }, [conversationId, organizationId]);

  const loadSimilarityData = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Load similar conversations
      // Note: This needs to be refactored to match the actual API
      // For now, we'll pass empty arrays until the API is properly implemented
      const matches = await conversationSimilarityMatcher.findSimilarConversations(
        { id: conversationId, organizationId } as unknown,
        [] as unknown
      );

      let clusters: ConversationCluster[] = [];
      let insights: unknown = null;

      // Load clusters and insights if enabled
      if (showClusters || showInsights) {
        [clusters, insights] = await Promise.all([
          showClusters
            ? conversationSimilarityMatcher.clusterConversations(organizationId, { timeWindow: { days: 7 } })
            : Promise.resolve([]),
          showInsights
            ? conversationSimilarityMatcher.getConversationInsights(organizationId, { days: 7 })
            : Promise.resolve(null),
        ]);
      }

      setState((prev) => ({
        ...prev,
        matches: matches as unknown as ExtendedConversationMatch[],
        clusters: clusters as unknown as ExtendedConversationCluster[],
        insights: insights || null,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Failed to load similarity data",
        loading: false,
      }));
    }
  };

  const formatSimilarityScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.9) return "text-green-600 bg-[var(--fl-color-success-subtle)]";
    if (score >= 0.8) return "text-blue-600 bg-[var(--fl-color-info-subtle)]";
    if (score >= 0.7) return "text-orange-600 bg-orange-50";
    return "text-gray-600 bg-[var(--fl-color-background-subtle)]";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <Icon icon={CheckCircle} className="text-semantic-success h-4 w-4" />;
      case "escalated":
        return <Icon icon={AlertTriangle} className="text-brand-mahogany-500 h-4 w-4" />;
      case "open":
      case "pending":
        return <Icon icon={Clock} className="text-semantic-warning h-4 w-4" />;
      default:
        return <Icon icon={MessageSquare} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />;
    }
  };

  const renderSimilarConversations = () => {
    if (state.loading) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-ds-lg border spacing-3">
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="mb-1 h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      );
    }

    if (state.matches.length === 0) {
      return (
        <div className="py-8 text-center text-[var(--fl-color-text-muted)]">
          <Icon icon={Search} className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>No similar conversations found</p>
          <p className="text-sm">Try adjusting the similarity threshold</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {state.matches.map((match: ExtendedConversationMatch) => (
          <Card
            key={match.conversationId}
            className="cursor-pointer spacing-3 transition-shadow hover:shadow-card-hover"
            onClick={() => onSelectSimilarConversation?.(match.conversationId)}
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center space-x-spacing-sm">
                {getStatusIcon(match.conversation?.status || "unknown")}
                <span className="truncate text-sm font-medium">
                  {match.conversation?.title || `Conversation ${match.conversationId.slice(0, 8)}`}
                </span>
              </div>
              <Badge className={cn("text-xs", getSimilarityColor(match.similarity))}>
                {formatSimilarityScore(match.similarity)}
              </Badge>
            </div>

            <div className="mb-2 flex items-center space-x-spacing-md text-tiny text-[var(--fl-color-text-muted)]">
              <span className="flex items-center">
                <Icon icon={MessageSquare} className="mr-1 h-3 w-3" />
                {match.conversation?.messageCount || 0} messages
              </span>
              <span className="flex items-center">
                <Icon icon={Users} className="mr-1 h-3 w-3" />
                {match.conversation?.participants || 0} participants
              </span>
              <span className="flex items-center">
                <Icon icon={Clock} className="mr-1 h-3 w-3" />
                {match.conversation?.lastActivity
                  ? new Date(match.conversation.lastActivity).toLocaleDateString()
                  : "Unknown"}
              </span>
            </div>

            {match.keyTopics && match.keyTopics.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {match.keyTopics.slice(0, 3).map((topic: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-tiny">
                    {topic}
                  </Badge>
                ))}
              </div>
            )}

            {match.matchReason && match.matchReason.length > 0 && (
              <div className="text-foreground text-tiny">
                <strong>Match reason:</strong> {match.matchReason[0]}
              </div>
            )}

            {match.suggestedActions && match.suggestedActions.length > 0 && (
              <div className="mt-2 text-tiny">
                <div className="mb-1 flex items-center text-blue-600">
                  <Icon icon={Lightbulb} className="mr-1 h-3 w-3" />
                  Suggested action:
                </div>
                <div className="text-foreground">{match.suggestedActions[0]}</div>
              </div>
            )}

            {match.insights &&
              (match.insights.escalationRisk !== undefined || match.insights.resolutionProbability !== undefined) && (
                <div className="mt-2 flex space-x-3 text-tiny">
                  {match.insights.escalationRisk !== undefined && (
                    <div
                      className={cn(
                        "flex items-center",
                        match.insights.escalationRisk > 0.7
                          ? "text-red-600"
                          : match.insights.escalationRisk > 0.4
                            ? "text-orange-600"
                            : "text-semantic-success-dark"
                      )}
                    >
                      <Icon icon={AlertTriangle} className="mr-1 h-3 w-3" />
                      Risk: {Math.round(match.insights.escalationRisk * 100)}%
                    </div>
                  )}
                  {match.insights.resolutionProbability !== undefined && (
                    <div className="text-semantic-success-dark flex items-center">
                      <Icon icon={Target} className="mr-1 h-3 w-3" />
                      Resolution: {Math.round(match.insights.resolutionProbability * 100)}%
                    </div>
                  )}
                </div>
              )}
          </Card>
        ))}
      </div>
    );
  };

  const renderClusters = () => {
    if (state.loading) {
      return (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="spacing-3">
              <Skeleton className="mb-3 h-5 w-1/2" />
              <Skeleton className="mb-2 h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </Card>
          ))}
        </div>
      );
    }

    if (state.clusters.length === 0) {
      return (
        <div className="py-8 text-center text-[var(--fl-color-text-muted)]">
          <Icon icon={BarChart3} className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>No conversation clusters found</p>
          <p className="text-sm">Not enough similar conversations to form clusters</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {state.clusters.map((cluster: ExtendedConversationCluster) => (
          <Card key={cluster.clusterId || cluster.id} className="spacing-3">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-medium">Cluster #{(cluster.clusterId || cluster.id || "unknown").slice(-8)}</h4>
              <Badge variant="outline">{cluster.conversations?.length || 0} conversations</Badge>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[var(--fl-color-text-muted)]">Pattern:</span>
                <div className="font-medium capitalize">{cluster.pattern?.type?.replace("_", " ") || "Unknown"}</div>
              </div>
              <div>
                <span className="text-[var(--fl-color-text-muted)]">Avg Similarity:</span>
                <div className="font-medium">
                  {formatSimilarityScore(cluster.averageSimilarity || cluster.avgSimilarity || 0)}
                </div>
              </div>
              <div>
                <span className="text-[var(--fl-color-text-muted)]">Success Rate:</span>
                <div className="text-semantic-success-dark font-medium">
                  {Math.round((cluster.resolutionInsights?.successRate || 0) * 100)}%
                </div>
              </div>
              <div>
                <span className="text-[var(--fl-color-text-muted)]">Avg Resolution:</span>
                <div className="font-medium">{Math.round((cluster.resolutionInsights?.averageTime || 0) / 60)}h</div>
              </div>
            </div>

            {cluster.commonTopics && cluster.commonTopics.length > 0 && (
              <div className="mb-3">
                <span className="text-sm text-[var(--fl-color-text-muted)]">Common Topics:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {cluster.commonTopics.slice(0, 4).map((topic: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-tiny">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {cluster.resolutionInsights?.commonSolutions && cluster.resolutionInsights.commonSolutions.length > 0 && (
              <div>
                <span className="text-sm text-[var(--fl-color-text-muted)]">Common Solutions:</span>
                <ul className="text-foreground mt-1 text-sm">
                  {cluster.resolutionInsights.commonSolutions.slice(0, 2).map((solution: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <Icon icon={CheckCircle} className="text-semantic-success mr-2 h-3 w-3" />
                      {solution}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  };

  const renderInsights = () => {
    if (state.loading) {
      return (
        <div className="space-y-3">
          <Card className="spacing-3">
            <Skeleton className="mb-3 h-5 w-1/3" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </Card>
        </div>
      );
    }

    if (!state.insights) {
      return (
        <div className="py-8 text-center text-[var(--fl-color-text-muted)]">
          <Icon icon={TrendingUp} className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>No insights available</p>
          <p className="text-sm">Insights will appear with more conversation data</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Summary Stats */}
        <Card className="spacing-3">
          <h4 className="mb-3 font-medium">Overview (Last 7 Days)</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{state.insights.totalConversations}</div>
              <div className="text-sm text-[var(--fl-color-text-muted)]">Total Conversations</div>
            </div>
            <div className="text-center">
              <div className="text-semantic-success-dark text-3xl font-bold">{state.insights.clusters.length}</div>
              <div className="text-sm text-[var(--fl-color-text-muted)]">Pattern Clusters</div>
            </div>
          </div>
        </Card>

        {/* Patterns */}
        <Card className="spacing-3">
          <h4 className="mb-3 font-medium">Conversation Patterns</h4>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-[var(--fl-color-text-muted)]">Average Resolution Time:</span>
              <div className="font-medium">
                {Math.round(state.insights.patterns.averageResolutionTime / 60)}h{" "}
                {state.insights.patterns.averageResolutionTime % 60}m
              </div>
            </div>
            <div>
              <span className="text-sm text-[var(--fl-color-text-muted)]">Escalation Rate:</span>
              <div
                className={cn(
                  "font-medium",
                  state.insights.patterns.escalationRate > 0.2 ? "text-red-600" : "text-semantic-success-dark"
                )}
              >
                {Math.round(state.insights.patterns.escalationRate * 100)}%
              </div>
            </div>
          </div>
        </Card>

        {/* Most Common Issues */}
        <Card className="spacing-3">
          <h4 className="mb-3 font-medium">Most Common Issues</h4>
          <div className="space-y-spacing-sm">
            {state.insights.patterns.mostCommonIssues.slice(0, 3).map((issue: string, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span>{issue}</span>
                <Badge variant="outline" className="text-tiny">
                  #{index + 1}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Recommendations */}
        {state.insights.recommendations.length > 0 && (
          <Card className="spacing-3">
            <h4 className="mb-3 flex items-center font-medium">
              <Icon icon={Lightbulb} className="text-semantic-warning mr-2 h-4 w-4" />
              Recommendations
            </h4>
            <div className="space-y-spacing-sm">
              {state.insights.recommendations.slice(0, 3).map((rec: string, index: number) => (
                <div key={index} className="text-foreground flex items-start text-sm">
                  <div className="mr-2 mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-ds-full bg-brand-blue-500" />
                  {rec}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  if (state.error) {
    return (
      <Alert className={className}>
        <Icon icon={AlertTriangle} className="h-4 w-4" />
        <AlertDescription>
          {state.error}
          <Button variant="outline" size="sm" onClick={loadSimilarityData} className="ml-2">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      <Tabs
        value={state.activeTab}
        onValueChange={(value) => setState((prev) => ({ ...prev, activeTab: value as unknown }))}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matches">Similar Conversations</TabsTrigger>
          {showClusters && <TabsTrigger value="clusters">Clusters</TabsTrigger>}
          {showInsights && <TabsTrigger value="insights">Insights</TabsTrigger>}
        </TabsList>

        <TabsContent value="matches" className="mt-4">
          {renderSimilarConversations()}
        </TabsContent>

        {showClusters && (
          <TabsContent value="clusters" className="mt-4">
            {renderClusters()}
          </TabsContent>
        )}

        {showInsights && (
          <TabsContent value="insights" className="mt-4">
            {renderInsights()}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default ConversationSimilarityPanel;
