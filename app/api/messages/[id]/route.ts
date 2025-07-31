import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const { conversationId } = await request.json();
    
    if (!conversationId) {
      return NextResponse.json(
        { error: "Missing required field: conversationId" },
        { status: 400 }
      );
    }

    // Get the message to check ownership
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("*, conversations!inner(*)")
      .eq("id", params.id)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Check if user can delete this message
    // Users can delete their own messages or if they're an admin/agent in the conversation
    const canDelete = 
      message.sender_id === user.id || 
      message.conversations.assigned_agent_id === user.id ||
      message.conversations.organization_id === user.organization_id;

    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to delete this message" },
        { status: 403 }
      );
    }

    // Delete message reactions first
    const { error: reactionsError } = await supabase
      .from("message_reactions")
      .delete()
      .eq("message_id", params.id);

    if (reactionsError) {
      console.error("Error deleting message reactions:", reactionsError);
    }

    // Delete the message
    const { error: deleteError } = await supabase
      .from("messages")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      messageId: params.id 
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const { content, conversationId } = await request.json();
    
    if (!content || !conversationId) {
      return NextResponse.json(
        { error: "Missing required fields: content, conversationId" },
        { status: 400 }
      );
    }

    // Get the message to check ownership
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("*, conversations!inner(*)")
      .eq("id", params.id)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Check if user can edit this message (only own messages)
    if (message.sender_id !== user.id) {
      return NextResponse.json(
        { error: "You can only edit your own messages" },
        { status: 403 }
      );
    }

    // Update the message
    const { data: updatedMessage, error: updateError } = await supabase
      .from("messages")
      .update({
        content,
        updated_at: new Date().toISOString(),
        is_edited: true
      })
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: updatedMessage
    });
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 