"use client";

import React, { useState } from "react";
import { CheckCircle as Check, Code, Copy } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
import { Card } from "@/components/unified-ui/components/Card";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface WidgetCodeGeneratorProps {
  config: unknown;
  organizationId?: string;
  onGenerate: () => string;
}

export function WidgetCodeGenerator({ config, organizationId, onGenerate }: WidgetCodeGeneratorProps) {
  const [embedCode, setEmbedCode] = useState("");
  const [copied, setCopied] = useState(false);

  const generateEmbedCode = () => {
    const code = onGenerate();
    setEmbedCode(code);
    return code;
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
    generateEmbedCode();
  }, [config]);

  return (
    <Card className="p-spacing-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-ds-2">
          <Icon icon={Code} className="h-5 w-5 text-[var(--fl-color-text-muted)]" />
          <h3 className="text-base font-semibold">Embed Code</h3>
        </div>
        <Button size="sm" variant="outline" onClick={generateEmbedCode}>
          Regenerate Code
        </Button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Textarea
            value={embedCode}
            readOnly
            className="min-h-[200px] pr-12 font-mono text-sm"
            placeholder="Click 'Generate Code' to create embed code"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={copyToClipboard}
            disabled={!embedCode}
            className={cn("absolute right-2 top-2 transition-all", copied && "text-semantic-success-dark")}
          >
            {copied ? (
              <>
                <Icon icon={Check} className="mr-1 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Icon icon={Copy} className="mr-1 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>

        <div className="border-status-info-light rounded-ds-lg border bg-[var(--fl-color-info-subtle)] spacing-3">
          <h4 className="mb-2 text-sm font-medium text-blue-900">Installation Instructions</h4>
          <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800">
            <li>Copy the embed code above</li>
            <li>
              Paste it just before the closing{" "}
              <code className="rounded bg-[var(--fl-color-info-subtle)] px-1">&lt;/body&gt;</code> tag on your website
            </li>
            <li>The widget will automatically appear on all pages where the code is installed</li>
            <li>You can customize the appearance and behavior using the settings on this page</li>
          </ol>
        </div>

        {config.security?.allowedDomains?.length > 0 && (
          <div className="rounded-ds-lg border border-amber-200 bg-amber-50 spacing-3">
            <h4 className="mb-2 text-sm font-medium text-amber-900">Domain Restrictions</h4>
            <p className="mb-2 text-sm text-amber-800">This widget is restricted to the following domains:</p>
            <ul className="list-inside list-disc text-sm text-amber-700">
              {config.security.allowedDomains.map((domain: string, index: number) => (
                <li key={index}>{domain}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
