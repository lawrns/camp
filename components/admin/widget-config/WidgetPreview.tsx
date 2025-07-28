"use client";

import React, { useEffect, useRef } from "react";
import {
  ArrowsOut as Maximize,
  Monitor,
  DeviceMobile as Smartphone,
  DeviceTablet as Tablet,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
import { Card } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface WidgetPreviewProps {
  config: any;
  embedCode: string;
  previewDevice: "desktop" | "tablet" | "mobile";
  previewFullscreen: boolean;
  isWidgetOpen: boolean;
  onDeviceChange: (device: "desktop" | "tablet" | "mobile") => void;
  onFullscreenToggle: (fullscreen: boolean) => void;
  onWidgetToggle: (open: boolean) => void;
  onUpdatePreview: () => void;
}

const deviceDimensions = {
  desktop: { width: "100%", height: "600px" },
  tablet: { width: "768px", height: "1024px" },
  mobile: { width: "375px", height: "667px" },
};

export function WidgetPreview({
  config,
  embedCode,
  previewDevice,
  previewFullscreen,
  isWidgetOpen,
  onDeviceChange,
  onFullscreenToggle,
  onWidgetToggle,
  onUpdatePreview,
}: WidgetPreviewProps) {
  const previewRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    onUpdatePreview();
  }, [config, onUpdatePreview]);

  const getPreviewDimensions = () => {
    if (previewFullscreen) {
      return { width: "100%", height: "100%" };
    }
    return deviceDimensions[previewDevice];
  };

  const dimensions = getPreviewDimensions();

  return (
    <Card className="p-spacing-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">Live Preview</h3>
        <div className="flex items-center gap-ds-2">
          {/* Device selector */}
          <div className="bg-background flex items-center gap-1 rounded-ds-lg spacing-1">
            <Button
              size="sm"
              variant={previewDevice === "desktop" ? "primary" : "ghost"}
              onClick={() => onDeviceChange("desktop")}
              className="h-8 w-8 p-0"
            >
              <Icon icon={Monitor} className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={previewDevice === "tablet" ? "primary" : "ghost"}
              onClick={() => onDeviceChange("tablet")}
              className="h-8 w-8 p-0"
            >
              <Icon icon={Tablet} className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={previewDevice === "mobile" ? "primary" : "ghost"}
              onClick={() => onDeviceChange("mobile")}
              className="h-8 w-8 p-0"
            >
              <Icon icon={Smartphone} className="h-4 w-4" />
            </Button>
          </div>

          {/* Fullscreen toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onFullscreenToggle(!previewFullscreen)}
            className="h-8 w-8 p-0"
          >
            {previewFullscreen ? <Icon icon={X} className="h-4 w-4" /> : <Icon icon={Maximize} className="h-4 w-4" />}
          </Button>

          {/* Widget toggle */}
          <Button
            size="sm"
            variant={isWidgetOpen ? "primary" : "outline"}
            onClick={() => onWidgetToggle(!isWidgetOpen)}
          >
            {isWidgetOpen ? "Close Widget" : "Open Widget"}
          </Button>
        </div>
      </div>

      {/* Preview area */}
      <div
        className={cn(
          "relative overflow-hidden rounded-ds-lg bg-neutral-50 transition-all duration-300",
          previewFullscreen && "fixed inset-0 z-50 bg-white spacing-4"
        )}
        style={!previewFullscreen ? { height: dimensions.height } : {}}
      >
        {previewFullscreen && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onFullscreenToggle(false)}
            className="absolute right-4 top-4 z-10"
          >
            <Icon icon={X} className="h-4 w-4" />
          </Button>
        )}

        <div
          className={cn(
            "mx-auto overflow-hidden rounded-ds-lg bg-white shadow-lg transition-all duration-300",
            previewDevice === "tablet" && "radius-2xl border-8 border-gray-800",
            previewDevice === "mobile" && "radius-3xl border-8 border-gray-800"
          )}
          style={{ width: dimensions.width, maxWidth: "100%" }}
        >
          <iframe
            ref={previewRef}
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { 
                      margin: 0; 
                      padding: 20px;
                      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                      background: #f5f5f5;
                    }
                    .preview-info {
                      background: white;
                      padding: 20px;
                      border-radius: 8px;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                      margin-bottom: 20px;
                    }
                    .preview-info h2 {
                      margin: 0 0 10px 0;
                      color: #333;
                    }
                    .preview-info p {
                      margin: 5px 0;
                      color: #666;
                      font-size: 14px;
                    }
                  </style>
                </head>
                <body>
                  <div class="preview-info">
                    <h2>Widget Preview</h2>
                    <p>Device: ${previewDevice}</p>
                    <p>Widget Status: ${isWidgetOpen ? "Open" : "Closed"}</p>
                    <p>Primary Color: ${config.appearance?.colors?.primary || "#246BFF"}</p>
                  </div>
                  ${embedCode}
                  <script>
                    // Simulate widget behavior
                    window.addEventListener('message', function(e) {
                      if (e.data.type === 'widget-toggle') {

                      }
                    });
                  </script>
                </body>
              </html>
            `}
            className="h-full w-full"
            sandbox="allow-scripts allow-same-origin"
            title="Widget Preview"
          />
        </div>
      </div>
    </Card>
  );
}
