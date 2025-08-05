import React, { ForwardRefExoticComponent, RefAttributes } from "react";
import { ChartLine as Activity, IconProps as PhosphorIconProps } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface ActivityItem {
  timestamp: string;
  description: string;
  severity: "normal" | "important" | "success" | "insight";
  icon: ForwardRefExoticComponent<PhosphorIconProps & RefAttributes<SVGSVGElement>>;
}

interface ActivityTabProps {
  activity: ActivityItem[];
  isLoadingActivity: boolean;
}

export function ActivityTab({ activity, isLoadingActivity }: ActivityTabProps) {
  return (
    <div className="panel-content-padding">
      <div className="space-y-3 py-4">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-ds-2 font-semibold text-gray-900">
            <Icon icon={Activity} className="h-4 w-4 text-[var(--fl-color-info)]" />
            Recent Activity
          </h4>
          {isLoadingActivity && <div className="h-4 w-4 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>}
        </div>
        <div className="space-y-3">
          {activity.map((activityItem, index) => {
            const IconComponent = activityItem.icon;
            return (
              <div
                key={index}
                className="hover:bg-background flex items-start gap-3 rounded-ds-lg border border-[var(--fl-color-border-subtle)] bg-[var(--fl-color-background-subtle)] spacing-3 transition-colors"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-ds-full",
                    activityItem.severity === "success" && "bg-status-success-light text-semantic-success-dark",
                    activityItem.severity === "important" && "bg-purple-100 text-purple-600",
                    activityItem.severity === "insight" && "bg-status-info-light text-blue-600",
                    activityItem.severity === "normal" && "bg-neutral-100 text-neutral-600"
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{activityItem.description}</p>
                  <div className="mt-1 flex items-center gap-ds-2">
                    <p className="text-tiny text-[var(--fl-color-text-muted)]">{activityItem.timestamp}</p>
                    {activityItem.severity === "important" && (
                      <Badge variant="secondary" className="bg-purple-50 text-tiny text-purple-700">
                        Important
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
