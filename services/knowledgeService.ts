/**
 * Knowledge Base Service
 * Direct Supabase integration for knowledge document management
 */

import { createApiClient } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type KnowledgeDocument = Database["public"]["Tables"]["knowledge_documents"]["Row"];
type KnowledgeDocumentInsert = Database["public"]["Tables"]["knowledge_documents"]["Insert"];
type KnowledgeDocumentUpdate = Database["public"]["Tables"]["knowledge_documents"]["Update"];

export interface KnowledgeDocumentWithStats extends KnowledgeDocument {
  views?: number;
  helpful?: number;
  notHelpful?: number;
  embedding?: boolean;
  searchable?: boolean;
}

export interface CreateKnowledgeDocumentInput {
  title: string;
  content: string;
  content_type?: "article" | "faq" | "guide" | "policy";
  category?: string;
  tags?: string[];
  is_public?: boolean;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateKnowledgeDocumentInput {
  title?: string;
  content?: string;
  content_type?: "article" | "faq" | "guide" | "policy";
  category?: string;
  tags?: string[];
  is_public?: boolean;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface KnowledgeSearchFilters {
  search?: string;
  content_type?: "article" | "faq" | "guide" | "policy";
  category?: string;
  is_active?: boolean;
  is_public?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Get all knowledge documents for an organization
 */
export async function getKnowledgeDocuments(
  organizationId: string,
  filters: KnowledgeSearchFilters = {}
): Promise<{ documents: KnowledgeDocumentWithStats[]; total: number; hasMore: boolean }> {
  const supabase = createApiClient();
  
  try {
    let query = supabase
      .from("knowledge_documents")
      .select("*", { count: "exact" })
      .eq("organization_id", organizationId);

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    if (filters.content_type) {
      query = query.eq("content_type", filters.content_type);
    }

    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    if (filters.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active);
    }

    if (filters.is_public !== undefined) {
      query = query.eq("is_public", filters.is_public);
    }

    // Apply pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Order by updated_at desc
    query = query.order("updated_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error("[KnowledgeService] Error fetching documents:", error);
      throw new Error(`Failed to fetch knowledge documents: ${error.message}`);
    }

    // Enhance documents with mock stats (in real implementation, these would come from analytics tables)
    const documentsWithStats: KnowledgeDocumentWithStats[] = (data || []).map((doc) => ({
      ...doc,
      views: Math.floor(Math.random() * 500) + 50,
      helpful: Math.floor(Math.random() * 50) + 5,
      notHelpful: Math.floor(Math.random() * 5),
      embedding: true, // Assume all documents have embeddings
      searchable: doc.is_active && doc.is_public,
    }));

    return {
      documents: documentsWithStats,
      total: count || 0,
      hasMore: offset + limit < (count || 0),
    };
  } catch (error) {
    console.error("[KnowledgeService] Error in getKnowledgeDocuments:", error);
    throw error;
  }
}

/**
 * Get a specific knowledge document by ID
 */
export async function getKnowledgeDocument(
  documentId: string,
  organizationId: string
): Promise<KnowledgeDocumentWithStats | null> {
  const supabase = createApiClient();

  try {
    const { data, error } = await supabase
      .from("knowledge_documents")
      .select("*")
      .eq("id", documentId)
      .eq("organization_id", organizationId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Document not found
      }
      console.error("[KnowledgeService] Error fetching document:", error);
      throw new Error(`Failed to fetch knowledge document: ${error.message}`);
    }

    // Enhance with mock stats
    return {
      ...data,
      views: Math.floor(Math.random() * 500) + 50,
      helpful: Math.floor(Math.random() * 50) + 5,
      notHelpful: Math.floor(Math.random() * 5),
      embedding: true,
      searchable: data.is_active && data.is_public,
    };
  } catch (error) {
    console.error("[KnowledgeService] Error in getKnowledgeDocument:", error);
    throw error;
  }
}

/**
 * Create a new knowledge document
 */
export async function createKnowledgeDocument(
  organizationId: string,
  input: CreateKnowledgeDocumentInput
): Promise<KnowledgeDocument> {
  const supabase = createApiClient();

  try {
    const documentData: KnowledgeDocumentInsert = {
      organization_id: organizationId,
      title: input.title,
      content: input.content,
      content_type: input.content_type || "article",
      category: input.category,
      tags: input.tags || [],
      is_public: input.is_public || false,
      is_active: input.is_active !== undefined ? input.is_active : true,
      metadata: input.metadata || {},
    };

    const { data, error } = await supabase
      .from("knowledge_documents")
      .insert(documentData)
      .select()
      .single();

    if (error) {
      console.error("[KnowledgeService] Error creating document:", error);
      throw new Error(`Failed to create knowledge document: ${error.message}`);
    }

    console.log(`[KnowledgeService] Created document: ${data.title} (${data.id})`);
    return data;
  } catch (error) {
    console.error("[KnowledgeService] Error in createKnowledgeDocument:", error);
    throw error;
  }
}

/**
 * Update an existing knowledge document
 */
export async function updateKnowledgeDocument(
  documentId: string,
  organizationId: string,
  input: UpdateKnowledgeDocumentInput
): Promise<KnowledgeDocument> {
  const supabase = createApiClient();

  try {
    const updateData: KnowledgeDocumentUpdate = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("knowledge_documents")
      .update(updateData)
      .eq("id", documentId)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) {
      console.error("[KnowledgeService] Error updating document:", error);
      throw new Error(`Failed to update knowledge document: ${error.message}`);
    }

    console.log(`[KnowledgeService] Updated document: ${data.title} (${data.id})`);
    return data;
  } catch (error) {
    console.error("[KnowledgeService] Error in updateKnowledgeDocument:", error);
    throw error;
  }
}

/**
 * Delete a knowledge document
 */
export async function deleteKnowledgeDocument(
  documentId: string,
  organizationId: string
): Promise<void> {
  const supabase = createApiClient();

  try {
    const { error } = await supabase
      .from("knowledge_documents")
      .delete()
      .eq("id", documentId)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("[KnowledgeService] Error deleting document:", error);
      throw new Error(`Failed to delete knowledge document: ${error.message}`);
    }

    console.log(`[KnowledgeService] Deleted document: ${documentId}`);
  } catch (error) {
    console.error("[KnowledgeService] Error in deleteKnowledgeDocument:", error);
    throw error;
  }
}

/**
 * Get knowledge document categories for an organization
 */
export async function getKnowledgeCategories(organizationId: string): Promise<string[]> {
  const supabase = createApiClient();

  try {
    const { data, error } = await supabase
      .from("knowledge_documents")
      .select("category")
      .eq("organization_id", organizationId)
      .not("category", "is", null)
      .order("category");

    if (error) {
      console.error("[KnowledgeService] Error fetching categories:", error);
      throw new Error(`Failed to fetch knowledge categories: ${error.message}`);
    }

    // Extract unique categories
    const categories = [...new Set(data.map((item) => item.category).filter(Boolean))];
    return categories as string[];
  } catch (error) {
    console.error("[KnowledgeService] Error in getKnowledgeCategories:", error);
    throw error;
  }
}

/**
 * Get knowledge document statistics for an organization
 */
export async function getKnowledgeStats(organizationId: string) {
  const supabase = createApiClient();

  try {
    const { data, error } = await supabase
      .from("knowledge_documents")
      .select("content_type, is_active, is_public")
      .eq("organization_id", organizationId);

    if (error) {
      console.error("[KnowledgeService] Error fetching stats:", error);
      throw new Error(`Failed to fetch knowledge stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      published: data.filter((doc) => doc.is_active && doc.is_public).length,
      draft: data.filter((doc) => !doc.is_active || !doc.is_public).length,
      byType: {
        article: data.filter((doc) => doc.content_type === "article").length,
        faq: data.filter((doc) => doc.content_type === "faq").length,
        guide: data.filter((doc) => doc.content_type === "guide").length,
        policy: data.filter((doc) => doc.content_type === "policy").length,
      },
    };

    return stats;
  } catch (error) {
    console.error("[KnowledgeService] Error in getKnowledgeStats:", error);
    throw error;
  }
}

/**
 * Upload and create document from file
 */
export async function uploadKnowledgeDocument(
  organizationId: string,
  file: File,
  metadata: {
    title?: string;
    category?: string;
    tags?: string[];
    contentType?: string;
  }
): Promise<KnowledgeDocument> {
  const supabase = createApiClient();

  try {
    console.log(`[Knowledge] Uploading document ${file.name} for organization ${organizationId}`);

    // Read file content
    const content = await file.text();

    // Extract title from filename if not provided
    const title = metadata.title || file.name.replace(/\.[^/.]+$/, "");

    // Determine content type from file extension
    const contentType = metadata.contentType || getContentTypeFromFile(file);

    const documentData = {
      organization_id: organizationId,
      title,
      content,
      content_type: contentType,
      category: metadata.category || 'Uncategorized',
      tags: metadata.tags || [],
      is_public: false,
      is_active: false, // Start as draft
      metadata: {
        originalFileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        version: 1,
      },
    };

    const { data, error } = await supabase
      .from('knowledge_documents')
      .insert(documentData)
      .select()
      .single();

    if (error) {
      console.error('[Knowledge] Error uploading document:', error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }

    console.log(`[Knowledge] Successfully uploaded document: ${data.title}`);
    return data;
  } catch (error) {
    console.error('[Knowledge] Error in uploadKnowledgeDocument:', error);
    throw error;
  }
}

/**
 * Create new version of existing document
 */
export async function createDocumentVersion(
  documentId: string,
  updates: {
    title?: string;
    content?: string;
    category?: string;
    tags?: string[];
  },
  userId: string
): Promise<KnowledgeDocument> {
  const supabase = createApiClient();

  try {
    console.log(`[Knowledge] Creating new version for document ${documentId}`);

    // Get current document
    const { data: currentDoc, error: fetchError } = await supabase
      .from('knowledge_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !currentDoc) {
      throw new Error('Document not found');
    }

    // Increment version number
    const currentVersion = currentDoc.metadata?.version || 1;
    const newVersion = currentVersion + 1;

    // Create updated document data
    const updatedData = {
      ...updates,
      metadata: {
        ...currentDoc.metadata,
        version: newVersion,
        previousVersion: currentVersion,
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('knowledge_documents')
      .update(updatedData)
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      console.error('[Knowledge] Error creating document version:', error);
      throw new Error(`Failed to create document version: ${error.message}`);
    }

    console.log(`[Knowledge] Created version ${newVersion} for document: ${data.title}`);
    return data;
  } catch (error) {
    console.error('[Knowledge] Error in createDocumentVersion:', error);
    throw error;
  }
}

/**
 * Publish document (make it active and public)
 */
export async function publishKnowledgeDocument(
  documentId: string,
  userId: string
): Promise<KnowledgeDocument> {
  const supabase = createApiClient();

  try {
    console.log(`[Knowledge] Publishing document ${documentId}`);

    const { data, error } = await supabase
      .from('knowledge_documents')
      .update({
        is_active: true,
        is_public: true,
        metadata: {
          publishedBy: userId,
          publishedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      console.error('[Knowledge] Error publishing document:', error);
      throw new Error(`Failed to publish document: ${error.message}`);
    }

    console.log(`[Knowledge] Successfully published document: ${data.title}`);
    return data;
  } catch (error) {
    console.error('[Knowledge] Error in publishKnowledgeDocument:', error);
    throw error;
  }
}

/**
 * Archive document
 */
export async function archiveKnowledgeDocument(
  documentId: string,
  userId: string
): Promise<KnowledgeDocument> {
  const supabase = createApiClient();

  try {
    console.log(`[Knowledge] Archiving document ${documentId}`);

    const { data, error } = await supabase
      .from('knowledge_documents')
      .update({
        is_active: false,
        metadata: {
          archivedBy: userId,
          archivedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      console.error('[Knowledge] Error archiving document:', error);
      throw new Error(`Failed to archive document: ${error.message}`);
    }

    console.log(`[Knowledge] Successfully archived document: ${data.title}`);
    return data;
  } catch (error) {
    console.error('[Knowledge] Error in archiveKnowledgeDocument:', error);
    throw error;
  }
}

/**
 * Duplicate document
 */
export async function duplicateKnowledgeDocument(
  documentId: string,
  organizationId: string,
  userId: string
): Promise<KnowledgeDocument> {
  const supabase = createApiClient();

  try {
    console.log(`[Knowledge] Duplicating document ${documentId}`);

    // Get original document
    const { data: originalDoc, error: fetchError } = await supabase
      .from('knowledge_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !originalDoc) {
      throw new Error('Document not found');
    }

    // Create duplicate with modified title
    const duplicateData = {
      organization_id: organizationId,
      title: `${originalDoc.title} (Copy)`,
      content: originalDoc.content,
      content_type: originalDoc.content_type,
      category: originalDoc.category,
      tags: originalDoc.tags,
      is_public: false,
      is_active: false, // Start as draft
      metadata: {
        ...originalDoc.metadata,
        originalDocumentId: documentId,
        duplicatedBy: userId,
        duplicatedAt: new Date().toISOString(),
        version: 1,
      },
    };

    const { data, error } = await supabase
      .from('knowledge_documents')
      .insert(duplicateData)
      .select()
      .single();

    if (error) {
      console.error('[Knowledge] Error duplicating document:', error);
      throw new Error(`Failed to duplicate document: ${error.message}`);
    }

    console.log(`[Knowledge] Successfully duplicated document: ${data.title}`);
    return data;
  } catch (error) {
    console.error('[Knowledge] Error in duplicateKnowledgeDocument:', error);
    throw error;
  }
}

/**
 * Utility function to determine content type from file
 */
function getContentTypeFromFile(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'md':
    case 'markdown':
      return 'guide';
    case 'txt':
      return 'article';
    case 'html':
    case 'htm':
      return 'article';
    case 'pdf':
      return 'guide';
    case 'doc':
    case 'docx':
      return 'guide';
    default:
      return 'article';
  }
}
