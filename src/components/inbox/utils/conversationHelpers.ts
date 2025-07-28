export const filterConversations = (conversations: any[], searchQuery: string, activeFilter: string) => {
  // Deduplicate conversations by ID first
  const conversationMap = new Map();
  conversations.forEach((conv: any) => {
    if (conv.id && !conversationMap.has(conv.id)) {
      conversationMap.set(conv.id, conv);
    }
  });
  let filtered = Array.from(conversationMap.values());

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (conv) =>
        conv.customer_name?.toLowerCase().includes(query) ||
        conv.customer_email?.toLowerCase().includes(query) ||
        conv.last_message_preview?.toLowerCase().includes(query)
    );
  }

  switch (activeFilter) {
    case "unread":
      filtered = filtered.filter((conv: any) => (conv.unread_count || 0) > 0);
      break;
    case "assigned":
      filtered = filtered.filter((conv: any) => conv.assigned_agent_id);
      break;
    case "unassigned":
      filtered = filtered.filter((conv: any) => !conv.assigned_agent_id);
      break;
  }

  return filtered;
};

export const createOptimisticMessage = (
  conversationId: string,
  content: string,
  userId: string,
  userEmail: string,
  organizationId: string
) => {
  const tempId = `temp-${Date.now()}-${userId}`;

  return {
    id: tempId,
    conversation_id: conversationId,
    content,
    sender_type: "agent" as const,
    sender_id: userId,
    sender_name: userEmail?.split("@")[0] || "Agent",
    message_type: "text" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    organization_id: organizationId || "",
    delivery_status: "sending" as const,
    status: "sending" as const,
    is_optimistic: true,
    temp_id: tempId,
  };
};
