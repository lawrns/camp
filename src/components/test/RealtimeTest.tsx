"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Test component to verify Supabase realtime connection
 */
export function RealtimeTest() {
  const [connectionStatus, setConnectionStatus] = useState<string>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const testRealtime = async () => {
      try {
        setConnectionStatus("connecting");
        setTestResults((prev) => [...prev, "🔄 Starting realtime connection test..."]);

        // Create browser client
        const supabaseClient = supabase.browser();
        setTestResults((prev) => [...prev, "✅ Supabase client created successfully"]);

        // Test basic channel subscription
        const testChannel = supabaseClient.channel("test-connection");
        setTestResults((prev) => [...prev, "✅ Test channel created"]);

        testChannel.subscribe((status: string) => {
          setTestResults((prev) => [...prev, `📡 Channel status: ${status}`]);

          if (status === "SUBSCRIBED") {
            setConnectionStatus("connected");
            setTestResults((prev) => [...prev, "🎉 Realtime connection successful!"]);
          } else if (status === "CHANNEL_ERROR") {
            setConnectionStatus("error");
            setError("Channel subscription failed");
            setTestResults((prev) => [...prev, "❌ Channel subscription failed"]);
          }
        });

        // Test broadcast
        setTimeout(() => {
          testChannel.send({
            type: "broadcast",
            event: "test",
            payload: { message: "Hello from test!" },
          });
          setTestResults((prev) => [...prev, "📤 Test broadcast sent"]);
        }, 2000);

        // Cleanup after 10 seconds
        setTimeout(() => {
          testChannel.unsubscribe();
          setTestResults((prev) => [...prev, "🧹 Test channel unsubscribed"]);
        }, 10000);
      } catch (err) {
        setConnectionStatus("error");
        setError(err instanceof Error ? err.message : "Unknown error");
        setTestResults((prev) => [...prev, `❌ Error: ${err}`]);
      }
    };

    testRealtime();
  }, []);

  return (
    <div className="rounded-ds-lg border bg-[var(--fl-color-background-subtle)] spacing-3">
      <h3 className="mb-4 text-base font-semibold">Supabase Realtime Connection Test</h3>

      <div className="mb-4">
        <p className="text-sm">
          <strong>Status:</strong>
          <span
            className={`ml-2 rounded px-2 py-1 text-xs ${
              connectionStatus === "connected"
                ? "bg-[var(--fl-color-success-subtle)] text-green-800"
                : connectionStatus === "connecting"
                  ? "bg-[var(--fl-color-warning-subtle)] text-yellow-800"
                  : connectionStatus === "error"
                    ? "bg-[var(--fl-color-danger-subtle)] text-red-800"
                    : "bg-gray-100 text-gray-800"
            }`}
          >
            {connectionStatus}
          </span>
        </p>

        {error && (
          <p className="mt-2 text-sm text-red-600">
            <strong>Error:</strong> {error}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-medium">Test Log:</h4>
        <div className="bg-background max-h-40 overflow-y-auto rounded border spacing-3">
          {testResults.map((result, index) => (
            <div key={index} className="font-mono text-tiny">
              {result}
            </div>
          ))}
        </div>
      </div>

      <div className="text-foreground mt-4 text-tiny">
        <p>
          <strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}
        </p>
        <p>
          <strong>Expected WebSocket:</strong> wss://yvntokkncxbhapqjesti.supabase.co/realtime/v1/websocket
        </p>
      </div>
    </div>
  );
}
