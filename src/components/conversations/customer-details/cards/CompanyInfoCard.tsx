import React from "react";
import { ChartBar as BarChart3 } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";

interface CompanyInfoCardProps {
  company?: string | undefined;
  role?: string | undefined;
}

export function CompanyInfoCard({ company, role }: CompanyInfoCardProps) {
  // Don't render if neither company nor role is provided
  if (!company && !role) {
    return null;
  }

  return (
    <Card className="border-[var(--fl-color-border)] shadow-card-base">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-ds-2 text-sm font-semibold text-gray-800">
          <Icon icon={BarChart3} className="h-4 w-4 text-purple-500" />
          Company Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {company && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium">Company:</span>
            <span className="font-semibold text-gray-900">{company}</span>
          </div>
        )}
        {role && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium">Role:</span>
            <span className="font-semibold text-gray-900">{role}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
