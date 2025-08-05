import React from "react";
import { Monitor, DeviceMobile as Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";
import { formatTimeAgo } from "@/lib/utils";

interface TechnicalInfoCardProps {
  deviceType: string;
  browser?: string | undefined;
  os?: string | undefined;
  ipAddress?: string | undefined;
  firstSeen: string;
}

function getDeviceIcon(deviceType: string) {
  switch (deviceType) {
    case "mobile":
      return Smartphone;
    case "tablet":
      return Smartphone;
    default:
      return Monitor;
  }
}

export function TechnicalInfoCard({ deviceType, browser, os, ipAddress, firstSeen }: TechnicalInfoCardProps) {
  const DeviceIcon = getDeviceIcon(deviceType);

  return (
    <Card className="border-[var(--fl-color-border)] shadow-card-base">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-ds-2 text-sm font-semibold text-gray-800">
          <DeviceIcon className="h-4 w-4 text-indigo-500" />
          Technical Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground font-medium">Device:</span>
          <span className="font-semibold capitalize text-gray-900">{deviceType}</span>
        </div>
        {browser && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium">Browser:</span>
            <span className="font-semibold text-gray-900">{browser}</span>
          </div>
        )}
        {os && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium">OS:</span>
            <span className="font-semibold text-gray-900">{os}</span>
          </div>
        )}
        {ipAddress && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium">IP Address:</span>
            <span className="font-mono text-tiny text-gray-900">{ipAddress}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground font-medium">First Seen:</span>
          <span className="font-semibold text-gray-900">{formatTimeAgo(firstSeen)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
