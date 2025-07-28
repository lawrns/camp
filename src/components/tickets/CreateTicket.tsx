/**
 * Create Ticket Component - MASSUPGRADE.md Phase 3
 *
 * Connects to unified /api/tickets endpoint
 * Eliminates mock data and provides real ticket creation functionality
 */

"use client";

import React, { useState } from "react";
import { Warning as AlertCircle, CheckCircle, Spinner as Loader2, Ticket } from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/lib/ui/Icon";
import { useCampfireStore } from "@/store";

interface CreateTicketProps {
  conversationId: string;
  onTicketCreated?: (ticket: any) => void;
  onCancel?: () => void;
}

interface TicketFormData {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
}

export function CreateTicket({ conversationId, onTicketCreated, onCancel }: CreateTicketProps) {
  const [formData, setFormData] = useState<TicketFormData>({
    title: "",
    description: "",
    priority: "medium",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const auth = useAuth();
  const { addNotification } = useCampfireStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Title and description are required");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          userId: auth.user?.id,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create ticket");
      }

      if (result.success) {
        setSuccess(`Ticket #${result.ticket.number} created successfully`);

        // Add notification to unified store
        addNotification({
          type: "success",
          message: `Support ticket #${result.ticket.number} created`,
        });

        // Call callback if provided
        if (onTicketCreated) {
          onTicketCreated(result.ticket);
        }

        // Reset form
        setFormData({
          title: "",
          description: "",
          priority: "medium",
        });
      } else {
        throw new Error(result.error || "Failed to create ticket");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Unknown error occurred";
      setError(errorMessage);

      // Add error notification to unified store
      addNotification({
        type: "error",
        message: `Failed to create ticket: ${errorMessage}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof TicketFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-[var(--fl-color-danger-muted)]";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-[var(--fl-color-warning-muted)]";
      case "low":
        return "bg-green-100 text-green-800 border-[var(--fl-color-success-muted)]";
      default:
        return "bg-gray-100 text-gray-800 border-[var(--fl-color-border)]";
    }
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-ds-2">
          <Icon icon={Ticket} className="h-5 w-5" />
          Create Support Ticket
        </CardTitle>
        <CardDescription>Convert this conversation into a trackable support ticket</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title */}
          <div className="space-y-spacing-sm">
            <label htmlFor="title" className="text-sm font-medium">
              Ticket Title *
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("title", e.target.value)}
              placeholder="Brief description of the issue"
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-spacing-sm">
            <label htmlFor="description" className="text-sm font-medium">
              Description *
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("description", e.target.value)}
              placeholder="Detailed description of the issue and any relevant context"
              disabled={isSubmitting}
              rows={4}
              className="w-full"
            />
          </div>

          {/* Priority */}
          <div className="space-y-spacing-sm">
            <label htmlFor="priority" className="text-sm font-medium">
              Priority
            </label>
            <Select
              value={formData.priority}
              onValueChange={(value: string) => handleInputChange("priority", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-ds-2">
                    <Badge variant="outline" className={getPriorityColor("low")}>
                      Low
                    </Badge>
                    <span className="text-foreground text-sm">Non-urgent issues</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-ds-2">
                    <Badge variant="outline" className={getPriorityColor("medium")}>
                      Medium
                    </Badge>
                    <span className="text-foreground text-sm">Standard priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-ds-2">
                    <Badge variant="outline" className={getPriorityColor("high")}>
                      High
                    </Badge>
                    <span className="text-foreground text-sm">Important issues</span>
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center gap-ds-2">
                    <Badge variant="outline" className={getPriorityColor("urgent")}>
                      Urgent
                    </Badge>
                    <span className="text-foreground text-sm">Critical issues</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="border-status-error-light flex items-center gap-ds-2 rounded-ds-md border bg-[var(--fl-color-danger-subtle)] spacing-3">
              <Icon icon={AlertCircle} className="h-4 w-4 text-red-600" />
              <span className="text-red-600-dark text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="border-status-success-light flex items-center gap-ds-2 rounded-ds-md border bg-[var(--fl-color-success-subtle)] spacing-3">
              <Icon icon={CheckCircle} className="text-semantic-success-dark h-4 w-4" />
              <span className="text-green-600-dark text-sm">{success}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                  Creating Ticket...
                </>
              ) : (
                <>
                  <Icon icon={Ticket} className="mr-2 h-4 w-4" />
                  Create Ticket
                </>
              )}
            </Button>

            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default CreateTicket;
