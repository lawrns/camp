"use client";

import { WidgetProvider } from "@/components/widget";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function WidgetTestPage() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState({
    organizationId: "test-org",
    conversationId: "test-conv",
    userId: "test-user",
    debug: false,
  });

  useEffect(() => {
    // Get config from URL params
    const organizationId = searchParams.get("orgId") || searchParams.get("organizationId") || "test-org";
    const convId = searchParams.get("convId") || "test-conv";
    const userId = searchParams.get("userId") || "test-user";
    const debug = searchParams.get("debug") === "true";

    setConfig({
      organizationId: organizationId,
      conversationId: convId,
      userId: userId,
      debug: debug,
    });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-100 spacing-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Widget E2E Testing Environment</h1>

        {/* Test Configuration */}
        <div className="mb-8 rounded-ds-lg bg-white spacing-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Test Configuration</h2>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <span className="font-medium text-gray-600">Organization ID:</span>
              <div className="font-mono text-blue-600">{config.organizationId}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Conversation ID:</span>
              <div className="font-mono text-blue-600">{config.conversationId}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600">User ID:</span>
              <div className="font-mono text-blue-600">{config.userId}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Debug Mode:</span>
              <div className={`font-mono ${config.debug ? "text-green-600" : "text-gray-400"}`}>
                {config.debug ? "Enabled" : "Disabled"}
              </div>
            </div>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="mb-8 rounded-ds-lg bg-white spacing-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Test Instructions</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900">Performance Testing:</h3>
              <ul className="ml-4 list-inside list-disc space-y-1">
                <li>Click the widget button to open the chat panel</li>
                <li>Send messages and observe response times</li>
                <li>Test typing indicators with multiple browser tabs</li>
                <li>Monitor for WebSocket connection errors in console</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">AI Resolution Testing:</h3>
              <ul className="ml-4 list-inside list-disc space-y-1">
                <li>Ask common support questions (password reset, pricing, etc.)</li>
                <li>Observe AI confidence scores (debug mode only)</li>
                <li>Test edge cases (empty messages, gibberish, very long text)</li>
                <li>Verify human-like typing behavior and agent names</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Real-time Testing:</h3>
              <ul className="ml-4 list-inside list-disc space-y-1">
                <li>Open multiple browser tabs with same conversation ID</li>
                <li>Type in one tab and verify typing indicators appear in others</li>
                <li>Send messages and verify they appear in all tabs</li>
                <li>Test connection resilience by refreshing tabs</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Test Data Attributes for E2E */}
        <div className="mb-8 rounded-ds-lg bg-white spacing-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Test Data Attributes</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div>
              <code className="rounded bg-gray-100 px-2 py-1">data-testid=&quot;widget-button&quot;</code> - Widget launcher
              button
            </div>
            <div>
              <code className="rounded bg-gray-100 px-2 py-1">data-testid=&quot;widget-panel&quot;</code> - Main widget panel
            </div>
            <div>
              <code className="rounded bg-gray-100 px-2 py-1">data-testid=&quot;message-input&quot;</code> - Message input field
            </div>
            <div>
              <code className="rounded bg-gray-100 px-2 py-1">data-testid=&quot;send-button&quot;</code> - Send message button
            </div>
            <div>
              <code className="rounded bg-gray-100 px-2 py-1">data-testid=&quot;typing-indicator&quot;</code> - Typing indicator
            </div>
            <div>
              <code className="rounded bg-gray-100 px-2 py-1">data-testid=&quot;ai-message&quot;</code> - AI response message
            </div>
            <div>
              <code className="rounded bg-gray-100 px-2 py-1">data-testid=&quot;handover-indicator&quot;</code> - Handover to
              human indicator
            </div>
            <div>
              <code className="rounded bg-gray-100 px-2 py-1">data-testid=&quot;confidence-score&quot;</code> - AI confidence
              score (debug)
            </div>
            <div>
              <code className="rounded bg-gray-100 px-2 py-1">data-testid=&quot;agent-name&quot;</code> - Agent name display
            </div>
          </div>
        </div>

        {/* Performance Metrics Display */}
        {config.debug && (
          <div className="mb-8 rounded-ds-lg bg-white spacing-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Performance Metrics (Debug)</h2>
            <PerformanceMonitor />
          </div>
        )}

        {/* Sample Test Scenarios */}
        <div className="mb-8 rounded-ds-lg bg-white spacing-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Sample Test Scenarios</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-medium text-gray-900">High Confidence (Should NOT handover):</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>&quot;How do I reset my password?&quot;</li>
                <li>&quot;What are your pricing plans?&quot;</li>
                <li>&quot;How do I create an account?&quot;</li>
                <li>&quot;Where can I find the user guide?&quot;</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-gray-900">Low Confidence (Should handover):</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>&quot;I need a custom enterprise solution&quot;</li>
                <li>&quot;There&apos;s a critical bug in production&quot;</li>
                <li>&quot;I want to discuss a partnership&quot;</li>
                <li>&quot;Can you help with complex integration?&quot;</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Component */}
      <WidgetProvider
        organizationId={config.organizationId}
        conversationId={config.conversationId}
        userId={config.userId}
        debug={config.debug}
      >
        <div />
      </WidgetProvider>
    </div>
  );
}

function PerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    memoryUsage: 0,
    connectionCount: 0,
    messagesSent: 0,
    errorsCount: 0,
  });

  useEffect(() => {
    // Monitor performance metrics
    const startTime = performance.now();

    const updateMetrics = () => {
      const loadTime = performance.now() - startTime;

      // Get memory usage if available
      let memoryUsage = 0;
      if ("memory" in performance) {
        memoryUsage = (performance as unknown).memory.usedJSHeapSize / 1024 / 1024; // MB
      }

      setMetrics((prev) => ({
        ...prev,
        loadTime: Math.round(loadTime),
        memoryUsage: Math.round(memoryUsage * 100) / 100,
      }));
    };

    const interval = setInterval(updateMetrics, 1000);
    updateMetrics();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
      <div>
        <span className="font-medium text-gray-600">Load Time:</span>
        <div className="font-mono text-blue-600">{metrics.loadTime}ms</div>
      </div>
      <div>
        <span className="font-medium text-gray-600">Memory:</span>
        <div className="font-mono text-blue-600">{metrics.memoryUsage}MB</div>
      </div>
      <div>
        <span className="font-medium text-gray-600">Connections:</span>
        <div className="font-mono text-blue-600">{metrics.connectionCount}</div>
      </div>
      <div>
        <span className="font-medium text-gray-600">Messages:</span>
        <div className="font-mono text-blue-600">{metrics.messagesSent}</div>
      </div>
      <div>
        <span className="font-medium text-gray-600">Errors:</span>
        <div className={`font-mono ${metrics.errorsCount > 0 ? "text-red-600" : "text-green-600"}`}>
          {metrics.errorsCount}
        </div>
      </div>
    </div>
  );
}
