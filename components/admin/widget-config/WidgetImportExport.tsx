"use client";

import React, { useRef } from "react";
import { Download, FileCode as FileJson, Upload } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";

interface WidgetImportExportProps {
  config: unknown;
  onImport: (config: unknown) => void;
  onExport: () => void;
}

export function WidgetImportExport({ config, onImport, onExport }: WidgetImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `widget-config-${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    onExport();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        onImport(importedConfig);
      } catch (error) {
        // TODO: Show error toast
      }
    };
    reader.readAsText(file);
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-ds-2">
          <Icon icon={FileJson} className="h-5 w-5" />
          Import/Export Configuration
        </CardTitle>
        <CardDescription>Save your widget configuration or load a previously saved configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={handleExport} className="w-full">
            <Icon icon={Download} className="mr-2 h-4 w-4" />
            Export Configuration
          </Button>

          <Button variant="outline" onClick={triggerImport} className="w-full">
            <Icon icon={Upload} className="mr-2 h-4 w-4" />
            Import Configuration
          </Button>

          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>

        <div className="rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
          <h4 className="mb-2 text-sm font-medium text-gray-900">What's included in the export?</h4>
          <ul className="text-foreground space-y-1 text-sm">
            <li>• All appearance settings (colors, position, size)</li>
            <li>• Behavior configuration (welcome message, auto-open)</li>
            <li>• Business hours schedule</li>
            <li>• Security settings (allowed domains, rate limiting)</li>
            <li>• AI configuration (if enabled)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
