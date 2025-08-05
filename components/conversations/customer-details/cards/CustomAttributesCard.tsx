import React from "react";
import { Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";

interface CustomAttributesCardProps {
  customAttributes?: Record<string, any> | undefined;
}

export function CustomAttributesCard({ customAttributes }: CustomAttributesCardProps) {
  // Don't render if no custom attributes
  if (!customAttributes || Object.keys(customAttributes).length === 0) {
    return null;
  }

  return (
    <Card className="border-[var(--fl-color-border)] shadow-card-base">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-ds-2 text-sm font-semibold text-gray-800">
          <Icon icon={Tag} className="text-semantic-warning h-4 w-4" />
          Account Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(customAttributes).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium capitalize">{key.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
            <span className="font-semibold text-gray-900">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
