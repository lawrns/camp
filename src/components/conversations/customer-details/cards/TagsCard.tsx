import React from "react";
import { Tag } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";

interface TagsCardProps {
  tags?: string[] | undefined;
}

export function TagsCard({ tags }: TagsCardProps) {
  // Don't render if no tags
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <Card className="border-[var(--fl-color-border)] shadow-card-base">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-ds-2 text-sm font-semibold text-gray-800">
          <Icon icon={Tag} className="h-4 w-4 text-pink-500" />
          Tags
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-ds-2">
          {tags.map((tag: unknown) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-status-info-dark border-status-info-light bg-gradient-to-r from-blue-50 to-indigo-50 text-tiny hover:from-blue-100 hover:to-indigo-100"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
