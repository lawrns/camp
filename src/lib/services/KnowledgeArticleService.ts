/**
 * Knowledge Article Service
 * Provides knowledge article management and creation functionality
 * Now connected to real database via API endpoints
 */

export interface KnowledgeArticle {
  id: number; // Changed from string to number (database uses bigint)
  title: string;
  content: string;
  description?: string; // Added description field
  tags: string[];
  category?: string; // Made optional as in database
  sourceType: "pdf" | "url" | "markdown" | "docx" | "text" | "html"; // Added sourceType
  sourceUrl?: string; // Added sourceUrl
  enabled: boolean; // Changed from status to enabled
  createdBy?: string; // Changed from authorId
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  description?: string;
  tags?: string[];
  category?: string;
  sourceType?: "pdf" | "url" | "markdown" | "docx" | "text" | "html";
  sourceUrl?: string;
  enabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateArticleRequest {
  title?: string;
  content?: string;
  description?: string;
  tags?: string[];
  category?: string;
  sourceType?: "pdf" | "url" | "markdown" | "docx" | "text" | "html";
  sourceUrl?: string;
  enabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SearchArticlesRequest {
  query?: string;
  category?: string;
  tags?: string[];
  enabled?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "updatedAt" | "title";
  sortOrder?: "asc" | "desc";
}

export interface ArticleSearchResult {
  articles: KnowledgeArticle[];
  total: number;
  hasMore: boolean;
}

export interface ConversationToArticleRequest {
  conversationId: string;
  title: string;
  category: string;
  tags?: string[];
  authorId: string;
  organizationId: string;
  includeMetadata?: boolean;
  messageIds?: string[];
  status?: string;
}

export interface ArticleAnalytics {
  articleId: string;
  viewCount: number;
  upvotes: number;
  downvotes: number;
  rating: number; // average rating 0-5
  searchAppearances: number;
  clickThroughRate: number;
  lastViewed?: Date;
  topSearchTerms: string[];
  referralSources: string[];
}

export class KnowledgeArticleService {
  private baseUrl = "/api/knowledge";

  async createArticle(request: CreateArticleRequest): Promise<KnowledgeArticle> {
    const response = await fetch(`${this.baseUrl}/articles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create article");
    }

    const result = await response.json();
    return result.data;
  }

  async createArticleFromConversation(request: ConversationToArticleRequest): Promise<KnowledgeArticle> {
    // Simulate fetching conversation data
    const conversationData = await this.fetchConversationData(request.conversationId);

    // Extract and format content from conversation
    const content = this.extractContentFromConversation(conversationData);
    const summary = this.generateSummary(content);

    // Create metadata from conversation
    const metadata: Record<string, unknown> = {
      sourceConversationId: request.conversationId,
      extractedAt: new Date().toISOString(),
      participantCount: conversationData.participants?.length || 0,
      messageCount: conversationData.messages?.length || 0,
    };

    if (request.includeMetadata && conversationData.metadata) {
      metadata.conversationMetadata = conversationData.metadata;
    }

    return this.createArticle({
      title: request.title,
      content,
      summary,
      tags: request.tags || this.extractTagsFromContent(content),
      category: request.category,
      status: "draft", // Always start as draft when created from conversation
      authorId: request.authorId,
      organizationId: request.organizationId,
      metadata,
    });
  }

  async updateArticle(articleId: number, request: UpdateArticleRequest): Promise<KnowledgeArticle | null> {
    const response = await fetch(`${this.baseUrl}/articles/${articleId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      const error = await response.json();
      throw new Error(error.error || "Failed to update article");
    }

    const result = await response.json();
    return result.data;
  }

  async getArticle(articleId: number): Promise<KnowledgeArticle | null> {
    const response = await fetch(`${this.baseUrl}/articles/${articleId}`);

    if (!response.ok) {
      if (response.status === 404) return null;
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch article");
    }

    const result = await response.json();
    return result.data;
  }

  async deleteArticle(articleId: number): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/articles/${articleId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      if (response.status === 404) return false;
      const error = await response.json();
      throw new Error(error.error || "Failed to delete article");
    }

    return true;
  }

  async searchArticles(request: SearchArticlesRequest): Promise<ArticleSearchResult> {
    const params = new URLSearchParams();

    if (request.query) params.append("query", request.query);
    if (request.category) params.append("category", request.category);
    if (request.tags) params.append("tags", request.tags.join(","));
    if (request.enabled !== undefined) params.append("enabled", request.enabled.toString());
    if (request.limit) params.append("limit", request.limit.toString());
    if (request.offset) params.append("offset", request.offset.toString());
    if (request.sortBy) params.append("sortBy", request.sortBy);
    if (request.sortOrder) params.append("sortOrder", request.sortOrder);

    const response = await fetch(`${this.baseUrl}/articles?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to search articles");
    }

    const result = await response.json();
    return {
      articles: result.data.articles,
      total: result.data.total,
      hasMore: result.data.hasMore,
    };
  }

  async getArticlesByCategory(category: string): Promise<KnowledgeArticle[]> {
    return this.searchArticles({
      category,
      enabled: true,
      sortBy: "updatedAt",
      sortOrder: "desc",
    }).then((result) => result.articles);
  }

  async getRecentArticles(limit: number = 10): Promise<KnowledgeArticle[]> {
    return this.searchArticles({
      enabled: true,
      sortBy: "createdAt",
      sortOrder: "desc",
      limit,
    }).then((result) => result.articles);
  }

  async getKnowledgeAnalytics(timeRange: "week" | "month" | "quarter" | "year" = "month"): Promise<any> {
    const response = await fetch(`${this.baseUrl}/analytics?timeRange=${timeRange}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch analytics");
    }

    const result = await response.json();
    return result.data;
  }

  async getCategories(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/categories`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch categories");
    }

    const result = await response.json();
    return result.data;
  }

  async createCategory(name: string, description?: string, parentId?: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, description, parentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create category");
    }

    const result = await response.json();
    return result.data;
  }
}

// Default instance
export const knowledgeArticleService = new KnowledgeArticleService();

// Utility functions
export async function createArticle(request: CreateArticleRequest): Promise<KnowledgeArticle> {
  return knowledgeArticleService.createArticle(request);
}

export async function createArticleFromConversation(request: ConversationToArticleRequest): Promise<KnowledgeArticle> {
  return knowledgeArticleService.createArticleFromConversation(request);
}

export async function getArticle(articleId: number): Promise<KnowledgeArticle | null> {
  return knowledgeArticleService.getArticle(articleId);
}

export async function searchArticles(request: SearchArticlesRequest): Promise<ArticleSearchResult> {
  return knowledgeArticleService.searchArticles(request);
}

export async function getRecentArticles(limit?: number): Promise<KnowledgeArticle[]> {
  return knowledgeArticleService.getRecentArticles(limit);
}
