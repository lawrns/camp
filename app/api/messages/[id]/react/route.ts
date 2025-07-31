import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(
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
    const { reaction, conversationId } = await request.json();
    
    if (!reaction || !conversationId) {
      return NextResponse.json(
        { error: "Missing required fields: reaction, conversationId" },
        { status: 400 }
      );
    }

    // Validate reaction type
    const validReactions = ["like", "heart", "thumbsup", "smile"];
    if (!validReactions.includes(reaction)) {
      return NextResponse.json(
        { error: "Invalid reaction type" },
        { status: 400 }
      );
    }

    // Check if user already reacted to this message
    const { data: existingReaction } = await supabase
      .from("message_reactions")
      .select("*")
      .eq("message_id", params.id)
      .eq("user_id", user.id)
      .eq("reaction_type", reaction)
      .single();

    if (existingReaction) {
      // Remove reaction
      const { error: deleteError } = await supabase
        .from("message_reactions")
        .delete()
        .eq("id", existingReaction.id);

      if (deleteError) {
        return NextResponse.json(
          { error: "Failed to remove reaction" },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        action: "removed",
        reaction,
        messageId: params.id 
      });
    } else {
      // Add reaction
      const { data: newReaction, error: insertError } = await supabase
        .from("message_reactions")
        .insert({
          message_id: params.id,
          user_id: user.id,
          reaction_type: reaction,
          conversation_id: conversationId,
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to add reaction" },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        action: "added",
        reaction,
        messageId: params.id,
        reactionId: newReaction.id
      });
    }
  } catch (error) {
    console.error("Error handling message reaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
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

    // Get reactions for this message
    const { data: reactions, error } = await supabase
      .from("message_reactions")
      .select(`
        *,
        users:user_id (
          id,
          email,
          full_name
        )
      `)
      .eq("message_id", params.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch reactions" },
        { status: 500 }
      );
    }

    // Group reactions by type
    const groupedReactions = reactions.reduce((acc, reaction) => {
      const type = reaction.reaction_type;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          users: [],
          hasReacted: false
        };
      }
      acc[type].count++;
      acc[type].users.push(reaction.users);
      if (reaction.user_id === user.id) {
        acc[type].hasReacted = true;
      }
      return acc;
    }, {} as Record<string, { count: number; users: any[]; hasReacted: boolean }>);

    return NextResponse.json({ reactions: groupedReactions });
  } catch (error) {
    console.error("Error fetching message reactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 