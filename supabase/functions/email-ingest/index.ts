import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface EmailHeaders {
  "message-id": string;
  "thread-id"?: string;
  subject: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  "reply-to"?: string;
  date: string;
  "content-type"?: string;
  [key: string]: string | undefined;
}

interface EmailPayload {
  headers: EmailHeaders;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    contentId?: string;
    content?: string; // base64 encoded
  }>;
  rawEmail?: string;
}

interface ProcessedEmail {
  messageId: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  textContent?: string;
  htmlContent?: string;
  headers: Record<string, string>;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    contentId?: string;
  }>;
  receivedAt: string;
  sentAt?: string;
}

async function retryable<T>(fn: () => Promise<T>, maxRetries: number = 3, delay: number = 1000): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError!;
}

function parseEmail(payload: EmailPayload): ProcessedEmail {
  const headers = payload.headers;

  // Extract thread ID from headers or generate from message ID
  const threadId = headers["thread-id"] || headers["references"] || headers["in-reply-to"] || headers["message-id"];

  // Parse date
  const receivedAt = new Date().toISOString();
  const sentAt = headers.date ? new Date(headers.date).toISOString() : undefined;

  // Process attachments (exclude content to save space)
  const attachments = payload.attachments?.map((att: any) => ({
    filename: att.filename,
    contentType: att.contentType,
    size: att.size,
    contentId: att.contentId,
  }));

  return {
    messageId: headers["message-id"],
    threadId,
    subject: headers.subject || "(No Subject)",
    from: headers.from,
    to: headers.to,
    cc: headers.cc,
    bcc: headers.bcc,
    replyTo: headers["reply-to"],
    textContent: payload.text,
    htmlContent: payload.html,
    headers: headers as Record<string, string>,
    attachments,
    receivedAt,
    sentAt,
  };
}

async function findOrCreateConversation(
  supabase: any,
  email: ProcessedEmail,
  mailboxId: number
): Promise<number | null> {
  try {
    // Try to find existing conversation by thread ID
    const { data: existingThread } = await supabase
      .from("email_threads")
      .select("conversation_id")
      .eq("thread_id", email.threadId)
      .not("conversation_id", "is", null)
      .limit(1)
      .single();

    if (existingThread?.conversation_id) {
      return existingThread.conversation_id;
    }

    // Create new conversation
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        mailbox_id: mailboxId,
        title: email.subject,
        status: "open",
        channel: "email",
        contact_email: email.from,
        created_at: email.receivedAt,
      })
      .select("id")
      .single();

    if (conversationError) {
      console.error("Failed to create conversation:", conversationError);
      return null;
    }

    return conversation.id;
  } catch (error) {
    console.error("Error in findOrCreateConversation:", error);
    return null;
  }
}

async function storeEmailThread(
  supabase: any,
  email: ProcessedEmail,
  mailboxId: number,
  conversationId: string | null
): Promise<void> {
  await retryable(async () => {
    const { error } = await supabase.from("email_threads").insert({
      message_id: email.messageId,
      thread_id: email.threadId,
      subject: email.subject,
      from: email.from,
      to: email.to,
      cc: email.cc,
      bcc: email.bcc,
      reply_to: email.replyTo,
      text_content: email.textContent,
      html_content: email.htmlContent,
      headers: email.headers,
      attachments: email.attachments,
      mailbox_id: mailboxId,
      conversation_id: conversationId,
      received_at: email.receivedAt,
      sent_at: email.sentAt,
      is_processed: true,
    });

    if (error) {
      throw new Error(`Failed to store email thread: ${error.message}`);
    }
  });
}

serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verify request method
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse request body
    const payload: EmailPayload = await req.json();

    // Validate required fields
    if (!payload.headers?.["message-id"] || !payload.headers?.from || !payload.headers?.to) {
      return new Response(JSON.stringify({ error: "Missing required email headers" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Process the email
    const email = parseEmail(payload);

    // Extract mailbox from the 'to' field (you may need to adjust this logic)
    const toEmail = email.to.toLowerCase();
    const { data: mailbox } = await supabase
      .from("mailboxes")
      .select("id")
      .ilike("slug", `%${toEmail.split("@")[0]}%`)
      .limit(1)
      .single();

    if (!mailbox) {
      return new Response(JSON.stringify({ error: "Mailbox not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from("email_threads")
      .select("id")
      .eq("message_id", email.messageId)
      .limit(1)
      .single();

    if (existingEmail) {
      return new Response(JSON.stringify({ message: "Email already processed", id: existingEmail.id }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Find or create conversation
    const conversationId = await findOrCreateConversation(supabase, email, mailbox.id);

    // Store the email thread
    await storeEmailThread(supabase, email, mailbox.id, conversationId);

    return new Response(
      JSON.stringify({
        message: "Email processed successfully",
        messageId: email.messageId,
        conversationId,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error processing email:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
