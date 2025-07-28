/**
 * AI Metrics Panel Component
 */

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "@/components/charts/LazyCharts";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Separator } from "@/components/unified-ui/components/Separator";
import { cn } from "@/lib/utils";
import { AIMetrics, SentimentDataPoint } from "./types";
import { getConfidenceColor, getSentimentIcon } from "./utils";

interface MetricsPanelProps {
  metrics: AIMetrics;
  sentimentHistory: SentimentDataPoint[];
  className?: string;
}

export const MetricsPanel = ({ metrics, sentimentHistory, className }: MetricsPanelProps) => {
  const renderConfidenceMeter = (confidence: number) => (
    <div className="space-y-spacing-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Confidence</span>
        <span className={cn("text-typography-sm font-bold", getConfidenceColor(confidence))}>
          {Math.round(confidence * 100)}%
        </span>
      </div>
      <Progress value={confidence * 100} className="h-2" />
    </div>
  );

  const renderSentimentGraph = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-spacing-sm text-sm">
          {getSentimentIcon(metrics.sentiment)}
          <span>Sentiment Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sentimentHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                fontSize={10}
              />
              <YAxis domain={[0, 1]} fontSize={10} />
              <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Badge
            variant={
              metrics.sentiment === "positive" ? "success" : metrics.sentiment === "neutral" ? "secondary" : "error"
            }
          >
            {metrics.sentiment}
          </Badge>
          <span className="text-tiny text-[var(--fl-color-text-muted)]">
            Score: {metrics.sentimentScore.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("space-y-4 spacing-4", className)}>
      {/* Confidence Meter */}
      <Card>
        <CardContent className="spacing-3">{renderConfidenceMeter(metrics.confidence)}</CardContent>
      </Card>

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm">Response Time</span>
            <span className="text-sm font-medium">{metrics.responseTime}ms</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm">Intent</span>
            <Badge variant="outline" className="text-tiny">
              {metrics.intent}
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm">Context Relevance</span>
            <span className={cn("text-typography-sm font-medium", getConfidenceColor(metrics.contextRelevance))}>
              {Math.round(metrics.contextRelevance * 100)}%
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm">Escalation Risk</span>
            <span
              className={cn(
                "text-typography-sm font-medium",
                metrics.escalationRisk > 0.7
                  ? "text-red-600"
                  : metrics.escalationRisk > 0.4
                    ? "text-yellow-600"
                    : "text-semantic-success-dark"
              )}
            >
              {Math.round(metrics.escalationRisk * 100)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Graph */}
      {renderSentimentGraph()}

      {/* Detected Entities */}
      {metrics.entities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Detected Entities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-ds-2">
              {metrics.entities.map((entity, index) => (
                <Badge key={index} variant="outline" className="text-tiny">
                  {entity}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
