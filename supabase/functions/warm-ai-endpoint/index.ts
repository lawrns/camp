import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface WarmupAttempt {
  endpoint: string;
  status: number;
  duration: number;
  success: boolean;
  error?: string;
}

const ENDPOINTS_TO_WARM = [
  "/api/ai/stream",
  "/api/ai/generate-reply",
  "/api/conversations/summary",
  "/api/auth/session",
];

serve(async (req: Request) => {
  const startTime = Date.now();

  try {
    const { method } = req;

    // Only respond to GET requests for warmup
    if (method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Get environment variables
    const apiUrl = Deno.env.get("API_URL") || Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://campfire.so";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAdminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const warmupAttempts: WarmupAttempt[] = [];

    // Warm up each endpoint in parallel
    const warmupPromises = ENDPOINTS_TO_WARM.map(async (endpoint) => {
      const endpointStartTime = Date.now();

      try {
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: endpoint === "/api/ai/stream" ? "POST" : "GET",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Supabase-Warmup-Function/1.0",
            "X-Warmup-Request": "true",
          },
          body:
            endpoint === "/api/ai/stream"
              ? JSON.stringify({
                conversationId: "warmup-" + Date.now(),
                message: "system warmup ping",
                context: {
                  warmup: true,
                  timestamp: Date.now(),
                  source: "edge-function",
                },
              })
              : undefined,
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        const duration = Date.now() - endpointStartTime;
        const isSuccess = response.status < 500;

        // Read a small portion of the response to ensure full processing
        const responseText = await response.text();

        const attempt: WarmupAttempt = {
          endpoint,
          status: response.status,
          duration,
          success: isSuccess,
        };

        if (!isSuccess) {
          attempt.error = `HTTP ${response.status}: ${responseText.substring(0, 200)}`;
        }

        warmupAttempts.push(attempt);

        return attempt;
      } catch (error) {
        const duration = Date.now() - endpointStartTime;
        const attempt: WarmupAttempt = {
          endpoint,
          status: 0,
          duration,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };

        warmupAttempts.push(attempt);
        console.error(`[Warmup] ${endpoint} failed:`, error);

        return attempt;
      }
    });

    // Wait for all warmup attempts to complete
    await Promise.allSettled(warmupPromises);

    const totalDuration = Date.now() - startTime;
    const successCount = warmupAttempts.filter((a: any) => a.success).length;
    const failureCount = warmupAttempts.length - successCount;

    // Log metrics to Supabase (optional)
    if (supabaseUrl && supabaseAdminKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAdminKey);

        await supabase.from("warmup_logs").insert({
          timestamp: new Date().toISOString(),
          total_duration: totalDuration,
          endpoints_warmed: warmupAttempts.length,
          success_count: successCount,
          failure_count: failureCount,
          attempts: warmupAttempts,
          api_url: apiUrl,
        });
      } catch (logError) {
        console.warn("[Warmup] Failed to log metrics:", logError);
      }
    }

    // Log summary
    // Return detailed response
    return new Response(
      JSON.stringify({
        success: successCount > 0,
        timestamp: new Date().toISOString(),
        summary: {
          endpoints_warmed: warmupAttempts.length,
          success_count: successCount,
          failure_count: failureCount,
          total_duration: totalDuration,
          average_duration: Math.round(
            warmupAttempts.reduce((sum: any, a: any) => sum + a.duration, 0) / warmupAttempts.length
          ),
        },
        attempts: warmupAttempts,
        api_url: apiUrl,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      }
    );
  } catch (error) {
    const totalDuration = Date.now() - startTime;

    console.error("[Warmup] Critical error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        duration: totalDuration,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

// Cron configuration for Supabase:
//
// CREATE OR REPLACE FUNCTION warm_ai_endpoints()
// RETURNS void
// LANGUAGE plpgsql
// AS $$
// BEGIN
//   PERFORM http_get('https://your-project.supabase.co/functions/v1/warm-ai-endpoint');
// END;
// $$;
//
// SELECT cron.schedule('warm-ai-endpoints', '*/3 * * * *', 'SELECT warm_ai_endpoints();');
//
// Cost estimation: ~$5/month for 3-minute intervals
