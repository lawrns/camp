/**
 * Lightweight Gmail API Client
 * Replaces the heavy googleapis library with direct REST API calls
 * Saves ~100MB from bundle size
 */

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  historyId?: string;
  internalDate?: string;
  payload?: GmailMessagePart;
  sizeEstimate?: number;
  raw?: string;
}

export interface GmailMessagePart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: GmailMessagePartBody;
  parts?: GmailMessagePart[];
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessagePartBody {
  attachmentId?: string;
  size?: number;
  data?: string;
}

export interface GmailThread {
  id: string;
  historyId?: string;
  messages?: GmailMessage[];
}

export interface GmailListResponse<T> {
  messages?: T[];
  threads?: T[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

/**
 * Lightweight Gmail API client using direct REST calls
 */
export class LightweightGmailClient {
  private baseUrl = "https://gmail.googleapis.com/gmail/v1";
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(messageId: string, format: "minimal" | "full" | "raw" = "full"): Promise<GmailMessage> {
    return this.makeRequest<GmailMessage>(`/users/me/messages/${messageId}?format=${format}`);
  }

  /**
   * List messages with optional query
   */
  async listMessages(
    options: {
      q?: string;
      labelIds?: string[];
      maxResults?: number;
      pageToken?: string;
    } = {}
  ): Promise<GmailListResponse<GmailMessage>> {
    const params = new URLSearchParams();

    if (options.q) params.append("q", options.q);
    if (options.labelIds) params.append("labelIds", options.labelIds.join(","));
    if (options.maxResults) params.append("maxResults", options.maxResults.toString());
    if (options.pageToken) params.append("pageToken", options.pageToken);

    const query = params.toString();
    const endpoint = `/users/me/messages${query ? `?${query}` : ""}`;

    return this.makeRequest<GmailListResponse<GmailMessage>>(endpoint);
  }

  /**
   * Get a thread by ID
   */
  async getThread(threadId: string, format: "minimal" | "full" = "full"): Promise<GmailThread> {
    return this.makeRequest<GmailThread>(`/users/me/threads/${threadId}?format=${format}`);
  }

  /**
   * Send a message
   */
  async sendMessage(raw: string, threadId?: string): Promise<GmailMessage> {
    const body: any = { raw };
    if (threadId) {
      body.threadId = threadId;
    }

    return this.makeRequest<GmailMessage>("/users/me/messages/send", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<{
    emailAddress: string;
    messagesTotal: number;
    threadsTotal: number;
    historyId: string;
  }> {
    return this.makeRequest("/users/me/profile");
  }

  /**
   * Watch for changes (for webhooks)
   */
  async watch(topicName: string, labelIds?: string[]): Promise<{ historyId: string; expiration: string }> {
    const body: any = {
      topicName,
      labelIds: labelIds || ["INBOX"],
    };

    return this.makeRequest("/users/me/watch", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    await this.makeRequest("/users/me/stop", {
      method: "POST",
    });
  }
}

/**
 * Create a Gmail client instance
 */
export function createGmailClient(accessToken: string): LightweightGmailClient {
  return new LightweightGmailClient(accessToken);
}

/**
 * Utility function to extract email address from Gmail headers
 */
export function extractEmailFromHeaders(headers: GmailHeader[], headerName: string): string | null {
  const header = headers.find((h) => h.name.toLowerCase() === headerName.toLowerCase());
  if (!header) return null;

  // Extract email from "Name <email@domain.com>" format
  const emailMatch = header.value.match(/<([^>]+)>/);
  return emailMatch ? emailMatch[1] : header.value;
}

/**
 * Utility function to get header value
 */
export function getHeaderValue(headers: GmailHeader[], headerName: string): string | null {
  const header = headers.find((h) => h.name.toLowerCase() === headerName.toLowerCase());
  return header ? header.value : null;
}

/**
 * Utility function to decode base64url
 */
export function decodeBase64Url(data: string): string {
  // Replace URL-safe characters and add padding if needed
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

  try {
    return Buffer.from(padded, "base64").toString("utf-8");
  } catch (error) {

    return data;
  }
}

/**
 * Utility function to encode to base64url
 */
export function encodeBase64Url(data: string): string {
  return Buffer.from(data, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
