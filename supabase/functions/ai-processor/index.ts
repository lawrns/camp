import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const openAIKey = Deno.env.get("OPENAI_API_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const startTime = Date.now();
    const body = await req.json();
    const { conversation_id, user_msg } = body;

    // Call the RAG service endpoint
    const response = await fetch(`${supabaseUrl}/functions/v1/rag-generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        conversation_id,
        message: user_msg,
      }),
    });

    const ragResult = await response.json();

    // Insert AI response into messages table
    const messageResult = await supabase
      .from("messages")
      .insert({
        conversation_id,
        sender_type: "ai",
        content: ragResult.text || ragResult.response,
        citations: ragResult.citations || [],
        confidence: ragResult.confidence || 0.8,
      })
      .select()
      .single();

    // Get organization ID for metrics
    const { data: convo } = await supabase
      .from("conversations")
      .select("organization_id")
      .eq("id", conversation_id)
      .single();

    // Record metrics
    if (convo && messageResult.data) {
      await supabase.from("ai_metrics").insert({
        conversation_id,
        organization_id: convo.organization_id,
        latency_ms: Date.now() - startTime,
        tokens: ragResult.tokens || 200,
        model: "gpt-4-turbo",
        confidence: ragResult.confidence || 0.8,
        hallucination_score: ragResult.hallucinationScore || 0.0,
        was_filtered: ragResult.wasFiltered || false,
        filter_reasons: ragResult.filterReasons || [],
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("AI Processor Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
