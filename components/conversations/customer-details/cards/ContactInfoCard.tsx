import React from "react";
import { ArrowSquareOut, Clock, MapPin, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";

interface ContactInfoCardProps {
  phone?: string | undefined;
  location: {
    city: string;
    country: string;
  };
  localTime?: string | undefined;
}

export function ContactInfoCard({ phone, location, localTime }: ContactInfoCardProps) {
  return (
    <Card className="border-[var(--fl-color-border)] shadow-card-base">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-ds-2 text-sm font-semibold text-gray-800">
          <Icon icon={User} className="h-4 w-4 text-[var(--fl-color-info)]" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {phone && (
          <div className="flex items-center gap-3 text-sm">
            <Icon icon={Phone} className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <span className="font-medium text-gray-900">{phone}</span>
            <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 spacing-1">
              <Icon icon={ArrowSquareOut} className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm">
          <Icon icon={MapPin} className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <span className="font-medium text-gray-900">
            {location.city}, {location.country}
          </span>
        </div>
        {localTime && (
          <div className="flex items-center gap-3 text-sm">
            <Icon icon={Clock} className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <span className="font-medium text-gray-900">{localTime}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
