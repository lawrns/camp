import React from "react";
import {
  AlertCircle,
  History,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { Customer } from "@/types/customer";

interface ConversationHistoryItem {
  id: string;
  subject: string;
  status: "open" | "resolved" | "pending";
  timestamp: string;
  lastMessage: string;
  channel: string;
}

interface HistoryTabProps {
  customer: Customer;
  conversationHistory: ConversationHistoryItem[];
  isLoadingHistory: boolean;
  error: string | null;
}

export function HistoryTab({ customer, conversationHistory, isLoadingHistory, error }: HistoryTabProps) {
  return (
    <div className="panel-content-padding">
      <div className="space-y-3 py-4">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-ds-2 font-semibold text-gray-900">
            <Icon icon={History} className="h-4 w-4 text-purple-500" />
            Conversation History
          </h4>
          {isLoadingHistory && <Icon icon={Loader2} className="h-4 w-4 animate-spin text-purple-600" />}
        </div>

        {error && (
          <Alert variant="error">
            <Icon icon={AlertCircle} className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isLoadingHistory && !error && conversationHistory.length === 0 && (
          <div className="py-8 text-center">
            <Icon icon={MessageSquare} className="mx-auto mb-3 h-12 w-12 text-neutral-300" />
            <p className="text-sm text-[var(--color-text-muted)]">No previous conversations found</p>
          </div>
        )}

        {!isLoadingHistory && conversationHistory.length > 0 && (
          <div className="space-y-3">
            {conversationHistory.map((conversation: unknown) => (
              <Card
                key={conversation.id}
                className="cursor-pointer border-[var(--color-border)] transition-shadow hover:shadow-card-hover"
              >
                <CardContent className="spacing-3">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-ds-2">
                      <Badge
                        variant={conversation.status === "resolved" ? "default" : "secondary"}
                        className={cn(
                          "text-xs",
                          conversation.status === "resolved" &&
                            "bg-status-success-light text-status-success-dark border-status-success-light",
                          conversation.status === "open" &&
                            "bg-status-warning-light text-status-warning-dark border-status-warning-light"
                        )}
                      >
                        {conversation.status}
                      </Badge>
                      <Badge variant="outline" className="text-tiny">
                        {conversation.channel}
                      </Badge>
                    </div>
                    <span className="text-tiny text-[var(--color-text-muted)]">{conversation.timestamp}</span>
                  </div>
                  <h5 className="mb-1 font-medium text-gray-900">{conversation.subject}</h5>
                  <p className="text-foreground line-clamp-2 text-sm">{conversation.lastMessage}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Conversation Summary */}
        {customer.conversationCount && customer.conversationCount > 0 && (
          <Card className="mt-6 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-purple-900">Conversation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-purple-700">Total Conversations:</span>
                <span className="font-semibold text-purple-900">
                  {customer.conversationCount || conversationHistory.length}
                </span>
              </div>
              {customer.averageResponseTime && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-700">Avg Response Time:</span>
                  <span className="font-semibold text-purple-900">{customer.averageResponseTime}</span>
                </div>
              )}
              {customer.customer_value?.lifetime_value && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-700">Lifetime Value:</span>
                  <span className="font-semibold text-purple-900">
                    ${customer.customer_value.lifetime_value.toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
