"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Download, FileXls as FileSpreadsheet, FileText, Spinner as Loader2 } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Checkbox } from "@/components/unified-ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/unified-ui/components/dialog";
import { Label } from "@/components/unified-ui/components/label";
import { RadioGroup, RadioGroupItem } from "@/components/unified-ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/lib/ui/Icon";

interface ExportConfig {
  reportType: "conversations" | "performance" | "ai-insights" | "team";
  format: "csv" | "pdf" | "json";
  dateRange: {
    from: Date;
    to: Date;
  };
  includeOptions: {
    messages: boolean;
    customerInfo: boolean;
    metrics: boolean;
    aiData: boolean;
  };
}

export function ExportReports() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [config, setConfig] = useState<ExportConfig>({
    reportType: "conversations",
    format: "csv",
    dateRange: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      to: new Date(),
    },
    includeOptions: {
      messages: true,
      customerInfo: true,
      metrics: true,
      aiData: false,
    },
  });

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let endpoint = "";
      let body = {};

      switch (config.reportType) {
        case "conversations":
          endpoint = "/api/conversations/export";
          body = {
            format: config.format,
            dateRange: config.dateRange,
            includeMessages: config.includeOptions.messages,
            includeCustomerInfo: config.includeOptions.customerInfo,
          };
          break;

        case "performance":
          endpoint = "/api/analytics/performance/export";
          body = {
            format: config.format,
            dateRange: config.dateRange,
            includeMetrics: config.includeOptions.metrics,
          };
          break;

        case "ai-insights":
          endpoint = "/api/ai/reports/export";
          body = {
            format: config.format,
            dateRange: config.dateRange,
            includeAIData: config.includeOptions.aiData,
          };
          break;

        case "team":
          endpoint = "/api/team/reports/export";
          body = {
            format: config.format,
            dateRange: config.dateRange,
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Handle file download
      if (config.format === "csv" || config.format === "pdf") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${config.reportType}-report-${format(new Date(), "yyyy-MM-dd")}.${config.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Handle JSON response
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${config.reportType}-report-${format(new Date(), "yyyy-MM-dd")}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast({
        title: "Export Successful",
        description: `Your ${config.reportType} report has been downloaded.`,
      });

      setShowDialog(false);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Download} className="h-5 w-5" />
            Export Reports
          </CardTitle>
          <CardDescription>Download your data in various formats for analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowDialog(true)} className="w-full" leftIcon={<Icon icon={FileText} className="h-4 w-4" />}>
            Export Report
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
            <DialogDescription>Configure your export settings and download the report</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Report Type */}
            <div className="space-y-spacing-sm">
              <Label>Report Type</Label>
              <Select
                value={config.reportType}
                onValueChange={(value) => setConfig({ ...config, reportType: value as ExportConfig["reportType"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversations">Conversations Report</SelectItem>
                  <SelectItem value="performance">Performance Report</SelectItem>
                  <SelectItem value="ai-insights">AI Insights Report</SelectItem>
                  <SelectItem value="team">Team Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Format */}
            <div className="space-y-spacing-sm">
              <Label>Export Format</Label>
              <RadioGroup
                value={config.format}
                onValueChange={(value) => setConfig({ ...config, format: value as ExportConfig["format"] })}
              >
                <div className="flex items-center space-x-spacing-sm">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="flex cursor-pointer items-center gap-ds-2">
                    <Icon icon={FileSpreadsheet} className="h-4 w-4" />
                    CSV (Excel Compatible)
                  </Label>
                </div>
                <div className="flex items-center space-x-spacing-sm">
                  <RadioGroupItem value="pdf" id="pdf" disabled />
                  <Label htmlFor="pdf" className="flex cursor-pointer items-center gap-ds-2 opacity-50">
                    <Icon icon={FileText} className="h-4 w-4" />
                    PDF (Coming Soon)
                  </Label>
                </div>
                <div className="flex items-center space-x-spacing-sm">
                  <RadioGroupItem value="json" id="json" />
                  <Label htmlFor="json" className="flex cursor-pointer items-center gap-ds-2">
                    <Icon icon={FileText} className="h-4 w-4" />
                    JSON (Raw Data)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Date Range */}
            <div className="space-y-spacing-sm">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-tiny text-muted-foreground">From</Label>
                  <input
                    type="date"
                    value={format(config.dateRange.from, "yyyy-MM-dd")}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setConfig({
                        ...config,
                        dateRange: { ...config.dateRange, from: new Date(e.target.value) },
                      })
                    }
                    className="w-full rounded-ds-md border px-3 py-2"
                  />
                </div>
                <div>
                  <Label className="text-tiny text-muted-foreground">To</Label>
                  <input
                    type="date"
                    value={format(config.dateRange.to, "yyyy-MM-dd")}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setConfig({
                        ...config,
                        dateRange: { ...config.dateRange, to: new Date(e.target.value) },
                      })
                    }
                    className="w-full rounded-ds-md border px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Include Options */}
            <div className="space-y-spacing-sm">
              <Label>Include in Export</Label>
              <div className="space-y-spacing-sm">
                {config.reportType === "conversations" && (
                  <>
                    <div className="flex items-center space-x-spacing-sm">
                      <Checkbox
                        id="messages"
                        checked={config.includeOptions.messages}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            includeOptions: { ...config.includeOptions, messages: e.target.checked },
                          })
                        }
                      />
                      <Label htmlFor="messages" className="cursor-pointer">
                        Include message history
                      </Label>
                    </div>
                    <div className="flex items-center space-x-spacing-sm">
                      <Checkbox
                        id="customerInfo"
                        checked={config.includeOptions.customerInfo}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            includeOptions: { ...config.includeOptions, customerInfo: e.target.checked },
                          })
                        }
                      />
                      <Label htmlFor="customerInfo" className="cursor-pointer">
                        Include customer information
                      </Label>
                    </div>
                  </>
                )}

                {(config.reportType === "performance" || config.reportType === "ai-insights") && (
                  <div className="flex items-center space-x-spacing-sm">
                    <Checkbox
                      id="metrics"
                      checked={config.includeOptions.metrics}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          includeOptions: { ...config.includeOptions, metrics: e.target.checked },
                        })
                      }
                    />
                    <Label htmlFor="metrics" className="cursor-pointer">
                      Include detailed metrics
                    </Label>
                  </div>
                )}

                {config.reportType === "ai-insights" && (
                  <div className="flex items-center space-x-spacing-sm">
                    <Checkbox
                      id="aiData"
                      checked={config.includeOptions.aiData}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          includeOptions: { ...config.includeOptions, aiData: e.target.checked },
                        })
                      }
                    />
                    <Label htmlFor="aiData" className="cursor-pointer">
                      Include AI model performance data
                    </Label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Icon icon={Download} className="mr-2 h-4 w-4" />
                  Export Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
