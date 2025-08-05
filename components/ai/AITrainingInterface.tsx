/**
 * AI Training Data Interface - TEAM2-P3-007
 * Interface for reviewing and improving AI responses
 */

"use client";

import React, { useEffect, useState } from "react";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import {
  Warning as AlertTriangle,
  Brain,
  CheckCircle,
  Clock,
  Funnel as Filter,
  ChatCircle as MessageSquare,
  Pencil,
  FloppyDisk as Save,
  MagnifyingGlass as Search,
  Star,
  ThumbsDown,
  ThumbsUp,
  X,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface TrainingItem {
  id: string;
  conversationId: string;
  customerMessage: string;
  aiResponse: string;
  confidence: number;
  rating?: "good" | "poor" | "excellent";
  feedback?: string;
  suggestedImprovement?: string;
  timestamp: string;
  status: "pending" | "reviewed" | "improved";
  persona: string;
  escalated: boolean;
}

interface AITrainingInterfaceProps {
  organizationId: string;
  className?: string;
}

export function AITrainingInterface({ organizationId, className }: AITrainingInterfaceProps) {
  const [trainingItems, setTrainingItems] = useState<TrainingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed" | "improved">("all");
  const [confidenceFilter, setConfidenceFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editedResponse, setEditedResponse] = useState("");

  // Fetch training data
  useEffect(() => {
    const fetchTrainingData = async () => {
      try {
        setIsLoading(true);

        // This would call a real API endpoint once implemented
        const response = await fetch(`/api/ai/training-data?organizationId=${organizationId}`);

        if (response.ok) {
          const data = await response.json();
          setTrainingItems(data.items || []);
        } else {
          // Mock training data for development
          const mockItems: TrainingItem[] = [
            {
              id: "train-1",
              conversationId: "conv-123",
              customerMessage: "I need help resetting my password but I forgot my email address",
              aiResponse:
                "I can help you with password reset. You'll need to provide your email address to receive the reset link.",
              confidence: 0.45,
              rating: "poor",
              feedback: "Didn't address the core issue - customer forgot their email",
              suggestedImprovement:
                "I understand you need to reset your password but don't remember your email. I can help you recover your account using your phone number or username instead. Would you like me to walk you through those options?",
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              status: "pending",
              persona: "supportive",
              escalated: true,
            },
            {
              id: "train-2",
              conversationId: "conv-456",
              customerMessage: "What's your refund policy?",
              aiResponse:
                "Our refund policy allows for full refunds within 30 days of purchase for most items. Some restrictions apply to digital products and custom orders. Would you like me to check the specific policy for your recent purchase?",
              confidence: 0.88,
              rating: "good",
              feedback: "Good response but could be more specific about restrictions",
              timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              status: "reviewed",
              persona: "professional",
              escalated: false,
            },
            {
              id: "train-3",
              conversationId: "conv-789",
              customerMessage: "My order arrived damaged, what should I do?",
              aiResponse:
                "I'm sorry to hear your order arrived damaged! That's definitely not the experience we want for you. I can immediately process a replacement or full refund - whichever you prefer. I'll also make sure this doesn't happen again by flagging this with our shipping team. Which option works better for you?",
              confidence: 0.92,
              rating: "excellent",
              feedback: "Perfect empathetic response with clear action items",
              timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
              status: "reviewed",
              persona: "supportive",
              escalated: false,
            },
          ];
          setTrainingItems(mockItems);
        }
      } catch (error) {
        setTrainingItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrainingData();
  }, [organizationId]);

  const handleRating = async (itemId: string, rating: "good" | "poor" | "excellent") => {
    try {
      const response = await fetch(`/api/ai/training-data/${itemId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, organizationId }),
      });

      if (response.ok) {
        setTrainingItems((prev) =>
          prev.map((item: unknown) => (item.id === itemId ? { ...item, rating, status: "reviewed" } : item))
        );
      }
    } catch (error) {}
  };

  const handleFeedback = async (itemId: string, feedback: string) => {
    try {
      const response = await fetch(`/api/ai/training-data/${itemId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback, organizationId }),
      });

      if (response.ok) {
        setTrainingItems((prev) =>
          prev.map((item: unknown) => (item.id === itemId ? { ...item, feedback, status: "reviewed" } : item))
        );
      }
    } catch (error) {}
  };

  const handleImprovement = async (itemId: string, improvement: string) => {
    try {
      const response = await fetch(`/api/ai/training-data/${itemId}/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestedImprovement: improvement, organizationId }),
      });

      if (response.ok) {
        setTrainingItems((prev) =>
          prev.map((item: unknown) =>
            item.id === itemId ? { ...item, suggestedImprovement: improvement, status: "improved" } : item
          )
        );
        setEditingItem(null);
        setEditedResponse("");
      }
    } catch (error) {}
  };

  const startEditing = (item: TrainingItem) => {
    setEditingItem(item.id);
    setEditedResponse(item.suggestedImprovement || item.aiResponse);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditedResponse("");
  };

  const filteredItems = trainingItems.filter((item: unknown) => {
    if (filter !== "all" && item.status !== filter) return false;

    if (confidenceFilter !== "all") {
      const confidence = item.confidence;
      if (confidenceFilter === "low" && confidence >= 0.6) return false;
      if (confidenceFilter === "medium" && (confidence < 0.6 || confidence >= 0.8)) return false;
      if (confidenceFilter === "high" && confidence < 0.8) return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.customerMessage.toLowerCase().includes(query) ||
        item.aiResponse.toLowerCase().includes(query) ||
        (item.feedback && item.feedback.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-100";
    if (confidence >= 0.6) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  const getStatusIcon = (status: TrainingItem["status"]) => {
    switch (status) {
      case "pending":
        return <Icon icon={Clock} className="h-4 w-4 text-orange-600" />;
      case "reviewed":
        return <Icon icon={CheckCircle} className="h-4 w-4 text-blue-600" />;
      case "improved":
        return <Icon icon={Star} className="text-semantic-success-dark h-4 w-4" />;
    }
  };

  const getRatingIcon = (rating?: string) => {
    switch (rating) {
      case "excellent":
        return <Icon icon={Star} className="text-semantic-success-dark h-4 w-4 fill-green-600" />;
      case "good":
        return <Icon icon={ThumbsUp} className="h-4 w-4 text-blue-600" />;
      case "poor":
        return <Icon icon={ThumbsDown} className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-spacing-md">
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-ds-lg border spacing-3">
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="mb-2 h-16 rounded bg-gray-200"></div>
                <div className="h-4 w-1/2 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header and Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-ds-2 text-base font-semibold">
              <Icon icon={Brain} className="h-5 w-5 text-purple-600" />
              AI Training Data
            </h3>
            <p className="text-sm text-muted-foreground">Review and improve AI responses to enhance performance</p>
          </div>
          <Badge variant="outline">
            {filteredItems.length} of {trainingItems.length} items
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-ds-2">
            <Icon icon={Filter} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
            <Select value={filter} onValueChange={(value: string) => setFilter(value as typeof filter)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="improved">Improved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select
            value={confidenceFilter}
            onValueChange={(value: string) => setConfidenceFilter(value as typeof confidenceFilter)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Confidence</SelectItem>
              <SelectItem value="low">Low (&lt;60%)</SelectItem>
              <SelectItem value="medium">Medium (60-80%)</SelectItem>
              <SelectItem value="high">High (&gt;80%)</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-ds-2">
            <Icon icon={Search} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-48"
            />
          </div>
        </div>
      </div>

      {/* Training Items */}
      <div className="space-y-3">
        {filteredItems.map((item: unknown) => (
          <OptimizedMotion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="transition-shadow hover:shadow-card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(item.status)}
                    <Badge className={cn("text-xs", getConfidenceColor(item.confidence))}>
                      {Math.round(item.confidence * 100)}% confidence
                    </Badge>
                    <Badge variant="outline" className="text-tiny">
                      {item.persona}
                    </Badge>
                    {item.escalated && (
                      <Badge variant="error" className="text-tiny">
                        <Icon icon={AlertTriangle} className="mr-1 h-3 w-3" />
                        Escalated
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-ds-2">
                    {getRatingIcon(item.rating)}
                    <span className="text-tiny text-muted-foreground">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Customer Message */}
                <div>
                  <p className="text-foreground mb-1 text-sm font-medium">Customer Message:</p>
                  <div className="rounded border-l-4 border-[var(--fl-color-brand)] bg-[var(--fl-color-info-subtle)] spacing-3">
                    <p className="text-sm">{item.customerMessage}</p>
                  </div>
                </div>

                {/* AI Response */}
                <div>
                  <p className="text-foreground mb-1 text-sm font-medium">AI Response:</p>
                  <div className="rounded border bg-[var(--fl-color-background-subtle)] spacing-3">
                    <p className="text-sm">{item.aiResponse}</p>
                  </div>
                </div>

                {/* Improvement Section */}
                {(item.suggestedImprovement || editingItem === item.id) && (
                  <div>
                    <p className="text-foreground mb-1 text-sm font-medium">Suggested Improvement:</p>
                    {editingItem === item.id ? (
                      <div className="space-y-spacing-sm">
                        <Textarea
                          value={editedResponse}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedResponse(e.target.value)}
                          placeholder="Write an improved response..."
                          rows={3}
                        />
                        <div className="flex gap-ds-2">
                          <Button size="sm" onClick={() => handleImprovement(item.id, editedResponse)} leftIcon={<Icon icon={Save} className="h-3 w-3" />}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing} leftIcon={<Icon icon={X} className="h-3 w-3" />}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded border-l-4 border-[var(--fl-color-success)] bg-[var(--fl-color-success-subtle)] spacing-3">
                        <p className="text-sm">{item.suggestedImprovement}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback */}
                {item.feedback && (
                  <div>
                    <p className="text-foreground mb-1 text-sm font-medium">Feedback:</p>
                    <div className="rounded border-l-4 border-orange-300 bg-orange-50 spacing-3">
                      <p className="text-sm">{item.feedback}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-ds-2 border-t pt-2">
                  {/* Rating Buttons */}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={item.rating === "excellent" ? "primary" : "outline"}
                      onClick={() => handleRating(item.id, "excellent")}
                    >
                      <Icon icon={Star} className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant={item.rating === "good" ? "primary" : "outline"}
                      onClick={() => handleRating(item.id, "good")}
                    >
                      <Icon icon={ThumbsUp} className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant={item.rating === "poor" ? "primary" : "outline"}
                      onClick={() => handleRating(item.id, "poor")}
                    >
                      <Icon icon={ThumbsDown} className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Improvement Button */}
                  {editingItem !== item.id && (
                    <Button size="sm" variant="outline" onClick={() => startEditing(item)} leftIcon={<Icon icon={Pencil} className="h-3 w-3" />}>
                      Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </OptimizedMotion.div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="p-spacing-lg text-center">
            <Icon icon={MessageSquare} className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-base font-semibold">No Training Data</h3>
            <p className="text-muted-foreground">
              No AI responses match your current filters. Try adjusting your search criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
