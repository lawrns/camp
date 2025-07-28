/**
 * Unified Timeline Component
 * Displays a chronological timeline of conversation events and activities
 */

"use client";

import React from "react";
import { Warning as AlertCircle, Robot as Bot, Clock, ChatCircle as MessageCircle, User } from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";

export interface TimelineEvent {
  id: string;
  type: "message" | "assignment" | "status_change" | "note" | "handover";
  timestamp: Date;
  actor: {
    id: string;
    name: string;
    type: "agent" | "visitor" | "ai" | "system";
  };
  content: string;
  metadata?: Record<string, any>;
}

export interface UnifiedTimelineProps {
  events: TimelineEvent[];
  conversationId?: string;
  className?: string;
  showFilters?: boolean;
  maxEvents?: number;
}

export const UnifiedTimeline: React.FC<UnifiedTimelineProps> = ({
  events,
  conversationId,
  className = "",
  showFilters = false,
  maxEvents = 50,
}) => {
  const [filteredEvents, setFilteredEvents] = React.useState<TimelineEvent[]>(events);
  const [selectedFilter, setSelectedFilter] = React.useState<string>("all");

  React.useEffect(() => {
    let filtered = events;

    if (selectedFilter !== "all") {
      filtered = events.filter((event) => event.type === selectedFilter);
    }

    if (maxEvents && filtered.length > maxEvents) {
      filtered = filtered.slice(0, maxEvents);
    }

    setFilteredEvents(filtered);
  }, [events, selectedFilter, maxEvents]);

  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "message":
        return MessageCircle;
      case "assignment":
        return User;
      case "handover":
        return Bot;
      case "status_change":
        return AlertCircle;
      case "note":
        return Clock;
      default:
        return Clock;
    }
  };

  const getEventColor = (actorType: string) => {
    switch (actorType) {
      case "agent":
        return "text-blue-600";
      case "visitor":
        return "text-green-600";
      case "ai":
        return "text-purple-600";
      case "system":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    }).format(timestamp);
  };

  return (
    <div className={className}>
      {showFilters && (
        <div className="mb-4 flex flex-wrap gap-ds-2">
          <Badge
            variant={selectedFilter === "all" ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setSelectedFilter("all")}
          >
            All
          </Badge>
          {["message", "assignment", "status_change", "note", "handover"].map((filter) => (
            <Badge
              key={filter}
              variant={selectedFilter === filter ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setSelectedFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1).replace("_", " ")}
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="p-spacing-md text-center text-[var(--fl-color-text-muted)]">
              <Icon icon={Clock} className="mx-auto mb-2 h-8 w-8" />
              <p>No timeline events found</p>
              {selectedFilter !== "all" && <p className="mt-1 text-sm">Try adjusting your filters</p>}
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((event, index) => {
            const Icon = getEventIcon(event.type);
            const isLast = index === filteredEvents.length - 1;

            return (
              <div key={event.id} className="relative">
                {/* Timeline line */}
                {!isLast && <div className="absolute left-6 top-12 h-8 w-0.5 bg-gray-200" />}

                <div className="flex items-start space-x-spacing-md">
                  {/* Icon */}
                  <div className="bg-background flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-ds-full">
                    <Icon className="text-foreground h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <Card>
                      <CardContent className="spacing-3">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center space-x-spacing-sm">
                            <span className={`font-medium ${getEventColor(event.actor.type)}`}>{event.actor.name}</span>
                            <Badge variant="outline" className="text-tiny">
                              {event.type.replace("_", " ")}
                            </Badge>
                          </div>
                          <time className="text-sm text-[var(--fl-color-text-muted)]">
                            {formatTimestamp(event.timestamp)}
                          </time>
                        </div>

                        <p className="text-foreground mb-2 text-sm">{event.content}</p>

                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="space-y-1 text-tiny text-[var(--fl-color-text-muted)]">
                            {Object.entries(event.metadata).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium">{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UnifiedTimeline;
