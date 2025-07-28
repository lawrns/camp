/**
 * Email Threads Data Module
 * Provides email thread management and data access functionality
 */

export interface EmailThread {
  id: string;
  subject: string;
  participants: string[];
  messageCount: number;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
  status: "active" | "archived" | "deleted";
  mailboxId: string;
  organizationId: string;
  tags: string[];
  priority: "low" | "medium" | "high" | "urgent";
  metadata?: Record<string, unknown>;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  sentAt: Date;
  receivedAt: Date;
  messageId: string;
  inReplyTo?: string;
  references?: string[];
  attachments: EmailAttachment[];
  headers: Record<string, string>;
  status: "sent" | "delivered" | "read" | "failed";
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  contentId?: string;
  inline: boolean;
  url: string;
}

export interface CreateThreadRequest {
  subject: string;
  participants: string[];
  mailboxId: string;
  organizationId: string;
  priority?: "low" | "medium" | "high" | "urgent";
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateThreadRequest {
  subject?: string;
  status?: "active" | "archived" | "deleted";
  priority?: "low" | "medium" | "high" | "urgent";
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface SearchThreadsRequest {
  mailboxId?: string;
  organizationId: string;
  query?: string;
  status?: "active" | "archived" | "deleted";
  priority?: "low" | "medium" | "high" | "urgent";
  participants?: string[];
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  sortBy?: "lastMessageAt" | "createdAt" | "subject" | "messageCount";
  sortOrder?: "asc" | "desc";
}

export interface ThreadSearchResult {
  threads: EmailThread[];
  total: number;
  hasMore: boolean;
}

export class EmailThreadsService {
  private threads: Map<string, EmailThread> = new Map();
  private messages: Map<string, EmailMessage> = new Map();

  async createThread(request: CreateThreadRequest): Promise<EmailThread> {
    const threadId = this.generateThreadId();
    const now = new Date();

    const thread: EmailThread = {
      id: threadId,
      subject: request.subject,
      participants: request.participants,
      messageCount: 0,
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
      status: "active",
      mailboxId: request.mailboxId,
      organizationId: request.organizationId,
      tags: request.tags || [],
      priority: request.priority || "medium",
      metadata: request.metadata || {},
    };

    this.threads.set(threadId, thread);
    return thread;
  }

  async getThread(threadId: string): Promise<EmailThread | null> {
    return this.threads.get(threadId) || null;
  }

  async updateThread(threadId: string, request: UpdateThreadRequest): Promise<EmailThread | null> {
    const thread = this.threads.get(threadId);
    if (!thread) return null;

    const updatedThread: EmailThread = {
      ...thread,
      ...request,
      updatedAt: new Date(),
    };

    this.threads.set(threadId, updatedThread);
    return updatedThread;
  }

  async deleteThread(threadId: string): Promise<boolean> {
    const thread = this.threads.get(threadId);
    if (!thread) return false;

    thread.status = "deleted";
    thread.updatedAt = new Date();
    return true;
  }

  async searchThreads(request: SearchThreadsRequest): Promise<ThreadSearchResult> {
    let threads = Array.from(this.threads.values());

    // Filter by organization
    threads = threads.filter((thread: any) => thread.organizationId === request.organizationId);

    // Apply filters
    if (request.mailboxId) {
      threads = threads.filter((thread: any) => thread.mailboxId === request.mailboxId);
    }

    if (request.status) {
      threads = threads.filter((thread: any) => thread.status === request.status);
    }

    if (request.priority) {
      threads = threads.filter((thread: any) => thread.priority === request.priority);
    }

    if (request.participants && request.participants.length > 0) {
      threads = threads.filter((thread: any) =>
        request.participants!.some((participant) => thread.participants.includes(participant))
      );
    }

    if (request.tags && request.tags.length > 0) {
      threads = threads.filter((thread: any) => request.tags!.some((tag) => thread.tags.includes(tag)));
    }

    // Apply date filters
    if (request.dateFrom) {
      threads = threads.filter((thread: any) => thread.createdAt >= request.dateFrom!);
    }

    if (request.dateTo) {
      threads = threads.filter((thread: any) => thread.createdAt <= request.dateTo!);
    }

    // Apply text search
    if (request.query) {
      const query = request.query.toLowerCase();
      threads = threads.filter(
        (thread) =>
          thread.subject.toLowerCase().includes(query) ||
          thread.participants.some((p) => p.toLowerCase().includes(query)) ||
          thread.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sort threads
    const sortBy = request.sortBy || "lastMessageAt";
    const sortOrder = request.sortOrder || "desc";

    threads.sort((a, b) => {
      let aValue: number | string | Date = a[sortBy as keyof EmailThread] as any;
      let bValue: number | string | Date = b[sortBy as keyof EmailThread] as any;

      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const offset = request.offset || 0;
    const limit = request.limit || 20;
    const total = threads.length;
    const paginatedThreads = threads.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      threads: paginatedThreads,
      total,
      hasMore,
    };
  }

  async getThreadsByMailbox(mailboxId: string, organizationId: string): Promise<EmailThread[]> {
    return this.searchThreads({
      mailboxId,
      organizationId,
      status: "active",
      sortBy: "lastMessageAt",
      sortOrder: "desc",
    }).then((result) => result.threads);
  }

  async getRecentThreads(organizationId: string, limit: number = 10): Promise<EmailThread[]> {
    return this.searchThreads({
      organizationId,
      status: "active",
      sortBy: "lastMessageAt",
      sortOrder: "desc",
      limit,
    }).then((result) => result.threads);
  }

  async addMessageToThread(
    threadId: string,
    message: Omit<EmailMessage, "id" | "threadId">
  ): Promise<EmailMessage | null> {
    const thread = this.threads.get(threadId);
    if (!thread) return null;

    const messageId = this.generateMessageId();
    const emailMessage: EmailMessage = {
      ...message,
      id: messageId,
      threadId,
    };

    this.messages.set(messageId, emailMessage);

    // Update thread
    thread.messageCount++;
    thread.lastMessageAt = message.sentAt;
    thread.updatedAt = new Date();

    return emailMessage;
  }

  async getThreadMessages(threadId: string): Promise<EmailMessage[]> {
    return Array.from(this.messages.values())
      .filter((message: any) => message.threadId === threadId)
      .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  }

  async getMessage(messageId: string): Promise<EmailMessage | null> {
    return this.messages.get(messageId) || null;
  }

  async archiveThread(threadId: string): Promise<boolean> {
    return this.updateThread(threadId, { status: "archived" }).then((thread) => !!thread);
  }

  async unarchiveThread(threadId: string): Promise<boolean> {
    return this.updateThread(threadId, { status: "active" }).then((thread) => !!thread);
  }

  async addTagsToThread(threadId: string, tags: string[]): Promise<boolean> {
    const thread = this.threads.get(threadId);
    if (!thread) return false;

    const newTags = [...new Set([...thread.tags, ...tags])];
    return this.updateThread(threadId, { tags: newTags }).then((thread) => !!thread);
  }

  async removeTagsFromThread(threadId: string, tags: string[]): Promise<boolean> {
    const thread = this.threads.get(threadId);
    if (!thread) return false;

    const newTags = thread.tags.filter((tag: any) => !tags.includes(tag));
    return this.updateThread(threadId, { tags: newTags }).then((thread) => !!thread);
  }

  async getThreadStats(organizationId: string): Promise<{
    totalThreads: number;
    activeThreads: number;
    archivedThreads: number;
    totalMessages: number;
    averageMessagesPerThread: number;
    topParticipants: { email: string; threadCount: number }[];
    threadsByPriority: { priority: string; count: number }[];
  }> {
    const threads = Array.from(this.threads.values()).filter((thread: any) => thread.organizationId === organizationId);

    const totalThreads = threads.length;
    const activeThreads = threads.filter((t: any) => t.status === "active").length;
    const archivedThreads = threads.filter((t: any) => t.status === "archived").length;
    const totalMessages = threads.reduce((sum: any, t: any) => sum + t.messageCount, 0);
    const averageMessagesPerThread = totalThreads > 0 ? totalMessages / totalThreads : 0;

    // Calculate top participants
    const participantCount = new Map<string, number>();
    threads.forEach((thread: any) => {
      thread.participants.forEach((participant: any) => {
        participantCount.set(participant, (participantCount.get(participant) || 0) + 1);
      });
    });
    const topParticipants = Array.from(participantCount.entries())
      .map(([email, threadCount]) => ({ email, threadCount }))
      .sort((a, b) => b.threadCount - a.threadCount)
      .slice(0, 10);

    // Calculate threads by priority
    const priorityCount = new Map<string, number>();
    threads.forEach((thread: any) => {
      priorityCount.set(thread.priority, (priorityCount.get(thread.priority) || 0) + 1);
    });
    const threadsByPriority = Array.from(priorityCount.entries()).map(([priority, count]) => ({ priority, count }));

    return {
      totalThreads,
      activeThreads,
      archivedThreads,
      totalMessages,
      averageMessagesPerThread,
      topParticipants,
      threadsByPriority,
    };
  }

  private generateThreadId(): string {
    return `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Default instance
export const emailThreadsService = new EmailThreadsService();

// Utility functions
export async function createThread(request: CreateThreadRequest): Promise<EmailThread> {
  return emailThreadsService.createThread(request);
}

export async function getThread(threadId: string): Promise<EmailThread | null> {
  return emailThreadsService.getThread(threadId);
}

export async function searchThreads(request: SearchThreadsRequest): Promise<ThreadSearchResult> {
  return emailThreadsService.searchThreads(request);
}

export async function getThreadsByMailbox(mailboxId: string, organizationId: string): Promise<EmailThread[]> {
  return emailThreadsService.getThreadsByMailbox(mailboxId, organizationId);
}

export async function addMessageToThread(
  threadId: string,
  message: Omit<EmailMessage, "id" | "threadId">
): Promise<EmailMessage | null> {
  return emailThreadsService.addMessageToThread(threadId, message);
}
