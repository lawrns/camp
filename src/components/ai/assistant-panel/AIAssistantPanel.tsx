/**
 * Refactored AI Assistant Panel - Main Component
 *
 * This is a significantly simplified version of the original 1138-line component,
 * now broken down into focused, reusable modules.
 */

"use client";

import { Button } from "@/components/ui/Button-unified";
import { Alert, AlertDescription, AlertTitle } from "@/components/unified-ui/components/Alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/unified-ui/components/tooltip";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { RefreshCw, Shield } from "lucide-react";
import { useEffect, useState } from "react";
// Import our refactored modules
import { MetricsPanel } from "./MetricsPanel";
import { AIStatusIndicator, ThinkingDots } from "./StatusIndicator";
import { SuggestionsPanel } from "./SuggestionsPanel";
import { AIAssistantPanelProps, AIMetrics, AIStatus, SuggestedResponse } from "./types";
import { generateMockSentimentHistory, generateMockSuggestions } from "./utils";

export function AIAssistantPanel({
  conversationId,
  organizationId,
  className,
  onSuggestionSelect,
  onHandoverRequest,
}: AIAssistantPanelProps) {
  // State management
  const [aiStatus, setAiStatus] = useState<AIStatus>("idle");
  const [suggestions, setSuggestions] = useState<SuggestedResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"suggestions" | "insights" | "metrics">("suggestions");

  // Mock metrics data
  const mockMetrics: AIMetrics = {
    confidence: 0.87,
    responseTime: 245,
    sentiment: "positive",
    sentimentScore: 0.72,
    intent: "support_request",
    entities: ["account", "billing", "subscription"],
    contextRelevance: 0.91,
    escalationRisk: 0.23,
  };

  const sentimentHistory = generateMockSentimentHistory();

  // Simulate AI processing
  useEffect(() => {
    if (conversationId) {
      setIsLoading(true);
      setAiStatus("analyzing");

      const timer = setTimeout(() => {
        setSuggestions(generateMockSuggestions());
        setAiStatus("ready");
        setIsLoading(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [conversationId]);

  const handleRefresh = () => {
    setIsLoading(true);
    setAiStatus("processing");

    setTimeout(() => {
      setSuggestions(generateMockSuggestions());
      setAiStatus("ready");
      setIsLoading(false);
    }, 1500);
  };

  const handleHandover = () => {
    setAiStatus("idle");
    onHandoverRequest?.();
  };

  return (
    <TooltipProvider>
      <Card className={cn("flex h-full flex-col", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-spacing-sm text-base font-semibold">
              <Icon icon={Shield} className="h-5 w-5 text-blue-600" />
              <span>AI Assistant</span>
            </CardTitle>
            <div className="flex items-center space-x-spacing-sm">
              <AIStatusIndicator status={aiStatus} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="h-8 w-8 p-0"
                  >
                    <Icon icon={RefreshCw} className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh AI suggestions</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {aiStatus === "thinking" && (
            <OptimizedMotion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-2 flex items-center space-x-spacing-sm"
            >
              <ThinkingDots />
              <span className="text-sm text-[var(--fl-color-text-muted)]">AI is thinking...</span>
            </OptimizedMotion.div>
          )}
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full">
            <TabsList className="mx-4 mb-4 grid w-full grid-cols-3">
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>

            <div className="h-full">
              <TabsContent value="suggestions" className="m-0 h-full">
                <SuggestionsPanel suggestions={suggestions} onSuggestionSelect={onSuggestionSelect || (() => { })} />
              </TabsContent>

              <TabsContent value="insights" className="m-0 h-full">
                <div className="spacing-3">
                  <Alert>
                    <Icon icon={Shield} className="h-4 w-4" />
                    <AlertTitle>AI Insights</AlertTitle>
                    <AlertDescription>
                      Advanced conversation insights and recommendations will appear here.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <TabsContent value="metrics" className="m-0 h-full">
                <MetricsPanel metrics={mockMetrics} sentimentHistory={sentimentHistory} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>

        {/* Handover Button */}
        <div className="border-t spacing-3">
          <Button variant="outline" onClick={handleHandover} className="w-full" disabled={aiStatus === "idle"}>
            Request Human Agent
          </Button>
        </div>
      </Card>
    </TooltipProvider>
  );
}
