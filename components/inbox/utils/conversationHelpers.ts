export const filterConversations = (conversations: unknown[], searchQuery: string, activeFilter: string) => {
  // Deduplicate conversations by ID first
  const conversationMap = new Map();
  conversations.forEach((conv: unknown) => {
    if (conv.id && !conversationMap.has(conv.id)) {
      conversationMap.set(conv.id, conv);
    }
  });
  let filtered = Array.from(conversationMap.values());

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (conv) =>
        conv.customerName?.toLowerCase().includes(query) ||
        conv.customerEmail?.toLowerCase().includes(query) ||
        conv.last_message_preview?.toLowerCase().includes(query)
    );
  }

  switch (activeFilter) {
    case "unread":
      filtered = filtered.filter((conv: unknown) => (conv.unread_count || 0) > 0);
      break;
    case "assigned":
      filtered = filtered.filter((conv: unknown) => conv.assigned_agent_id);
      break;
    case "unassigned":
      filtered = filtered.filter((conv: unknown) => !conv.assigned_agent_id);
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
    senderType: "agent" as const,
    senderId: userId,
    senderName: userEmail?.split("@")[0] || "Agent",
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
