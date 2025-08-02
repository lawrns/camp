"use client";

// DEPRECATED: UnifiedChatView moved to archive - redirecting to main inbox
import { redirect } from "next/navigation";

export default async function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Redirect to main inbox with conversation selected
  const { id } = await params;
  redirect(`/dashboard/inbox?conversation=${id}`);
}
