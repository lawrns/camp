"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Button } from "@/components/unified-ui/components/Button";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Icon } from "@/lib/ui/Icon";
import { api } from "@/lib/trpc/provider";

// RBAC imports
import { PermissionGuard, PermissionButton } from "@/lib/rbac/components";

// Import icons
import {
  FloppyDisk as Save,
  Eye,
  Upload,
  ArrowLeft as Back,
  FileText,
  Tag,
  Folder,
  Globe,
  Lock,
  Clock,
  User,
  PencilSimple as Edit,
  CheckCircle,
  Warning,
  X,
  Plus,
  Trash,
  Copy,
  ArrowsClockwise as RefreshCw,
} from "@phosphor-icons/react";

interface DocumentData {
  id?: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  contentType: string;
  isPublic: boolean;
  isActive: boolean;
  metadata?: any;
}

export default function DocumentEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get('id');
  const isEditing = !!documentId;

  // Document state
  const [document, setDocument] = useState<DocumentData>({
    title: '',
    content: '',
    category: 'General',
    tags: [],
    contentType: 'article',
    isPublic: false,
    isActive: false,
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Fetch document if editing
  const { data: existingDocument, isLoading } = api.mailbox.knowledge.get.useQuery(
    { 
      mailboxSlug: "test-mailbox-dev",
      documentId: documentId || '',
    },
    {
      enabled: isEditing && !!documentId,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // Mutations
  const createMutation = api.mailbox.knowledge.create.useMutation();
  const updateMutation = api.mailbox.knowledge.update.useMutation();
  const publishMutation = api.mailbox.knowledge.publish.useMutation();
  const archiveMutation = api.mailbox.knowledge.archive.useMutation();
  const duplicateMutation = api.mailbox.knowledge.duplicate.useMutation();

  // Load existing document
  useEffect(() => {
    if (existingDocument?.document) {
      setDocument({
        id: existingDocument.document.id,
        title: existingDocument.document.title,
        content: existingDocument.document.content,
        category: existingDocument.document.category || 'General',
        tags: existingDocument.document.tags || [],
        contentType: existingDocument.document.content_type || 'article',
        isPublic: existingDocument.document.is_public || false,
        isActive: existingDocument.document.is_active || false,
        metadata: existingDocument.document.metadata,
      });
    }
  }, [existingDocument]);

  // Handle document changes
  const handleDocumentChange = useCallback((field: keyof DocumentData, value: any) => {
    setDocument(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  // Save document
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isEditing && documentId) {
        await updateMutation.mutateAsync({
          mailboxSlug: "test-mailbox-dev",
          documentId,
          title: document.title,
          content: document.content,
          type: document.contentType as any,
          tags: document.tags,
        });
      } else {
        const result = await createMutation.mutateAsync({
          mailboxSlug: "test-mailbox-dev",
          title: document.title,
          content: document.content,
          type: document.contentType as any,
          tags: document.tags,
        });
        
        // Redirect to edit mode with the new document ID
        if (result.document?.id) {
          router.push(`/dashboard/knowledge/editor?id=${result.document.id}`);
        }
      }
      
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Publish document
  const handlePublish = async () => {
    if (!documentId) return;
    
    try {
      await publishMutation.mutateAsync({
        mailboxSlug: "test-mailbox-dev",
        documentId,
      });
      
      setDocument(prev => ({ ...prev, isActive: true, isPublic: true }));
    } catch (error) {
      console.error('Failed to publish document:', error);
    }
  };

  // Archive document
  const handleArchive = async () => {
    if (!documentId) return;
    
    try {
      await archiveMutation.mutateAsync({
        mailboxSlug: "test-mailbox-dev",
        documentId,
      });
      
      setDocument(prev => ({ ...prev, isActive: false }));
    } catch (error) {
      console.error('Failed to archive document:', error);
    }
  };

  // Duplicate document
  const handleDuplicate = async () => {
    if (!documentId) return;
    
    try {
      const result = await duplicateMutation.mutateAsync({
        mailboxSlug: "test-mailbox-dev",
        documentId,
      });
      
      if (result.document?.id) {
        router.push(`/dashboard/knowledge/editor?id=${result.document.id}`);
      }
    } catch (error) {
      console.error('Failed to duplicate document:', error);
    }
  };

  // Add tag
  const handleAddTag = () => {
    if (newTag.trim() && !document.tags.includes(newTag.trim())) {
      handleDocumentChange('tags', [...document.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    handleDocumentChange('tags', document.tags.filter(tag => tag !== tagToRemove));
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Icon icon={RefreshCw} className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-lg text-gray-600">Loading document...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/knowledge')}
            >
              <Icon icon={Back} className="mr-2 h-4 w-4" />
              Back to Knowledge Base
            </Button>
            
            <div className="flex items-center gap-2">
              <Icon icon={FileText} className="h-5 w-5 text-gray-500" />
              <span className="text-lg font-medium">
                {isEditing ? 'Edit Document' : 'New Document'}
              </span>
              {isDirty && (
                <Badge variant="warning">
                  <Icon icon={Warning} className="mr-1 h-3 w-3" />
                  Unsaved
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Document Status */}
            {isEditing && (
              <div className="flex items-center gap-2">
                <Badge variant={document.isActive ? 'success' : 'secondary'}>
                  {document.isActive ? 'Published' : 'Draft'}
                </Badge>
                <Badge variant={document.isPublic ? 'default' : 'secondary'}>
                  <Icon icon={document.isPublic ? Globe : Lock} className="mr-1 h-3 w-3" />
                  {document.isPublic ? 'Public' : 'Private'}
                </Badge>
              </div>
            )}

            {/* Actions */}
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              leftIcon={<Icon icon={Eye} className="h-4 w-4" />}
            >
              {showPreview ? 'Edit' : 'Preview'}
            </Button>

            <PermissionButton
              action="create"
              resource="knowledge"
              onClick={handleSave}
              disabled={isSaving || !document.title.trim()}
              className="bg-blue-600 hover:bg-blue-700"
              leftIcon={<Icon icon={Save} className="h-4 w-4" />}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </PermissionButton>

            {isEditing && (
              <>
                <PermissionButton
                  action="manage"
                  resource="knowledge"
                  onClick={handlePublish}
                  disabled={!document.isActive}
                  variant="outline"
                >
                  <Icon icon={CheckCircle} className="mr-2 h-4 w-4" />
                  Publish
                </PermissionButton>

                <PermissionButton
                  action="create"
                  resource="knowledge"
                  onClick={handleDuplicate}
                  variant="outline"
                >
                  <Icon icon={Copy} className="mr-2 h-4 w-4" />
                  Duplicate
                </PermissionButton>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Document Content</CardTitle>
                  <div className="text-sm text-gray-500">
                    {document.content.length} characters
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={document.title}
                    onChange={(e) => handleDocumentChange('title', e.target.value)}
                    placeholder="Enter document title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  {showPreview ? (
                    <div className="min-h-96 p-4 border border-gray-300 rounded-lg bg-gray-50">
                      <div className="prose max-w-none">
                        {document.content.split('\n').map((line, index) => (
                          <p key={index} className="mb-2">
                            {line || '\u00A0'}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={document.content}
                      onChange={(e) => handleDocumentChange('content', e.target.value)}
                      placeholder="Write your document content here..."
                      rows={20}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Document Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon={Folder} className="h-4 w-4" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={document.category}
                    onChange={(e) => handleDocumentChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="General">General</option>
                    <option value="Support Basics">Support Basics</option>
                    <option value="Policies">Policies</option>
                    <option value="Product">Product</option>
                    <option value="Advanced Support">Advanced Support</option>
                  </select>
                </div>

                {/* Content Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type
                  </label>
                  <select
                    value={document.contentType}
                    onChange={(e) => handleDocumentChange('contentType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="article">Article</option>
                    <option value="guide">Guide</option>
                    <option value="faq">FAQ</option>
                    <option value="policy">Policy</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon={Tag} className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Tag */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <Button
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                    size="sm"
                  >
                    <Icon icon={Plus} className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tag List */}
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <Icon icon={X} className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Document Info */}
            {isEditing && document.metadata && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon={Clock} className="h-4 w-4" />
                    Document Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">{document.metadata.version || 1}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Updated:</span>
                    <span className="font-medium">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <PermissionButton
                    action="delete"
                    resource="knowledge"
                    onClick={handleArchive}
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    <Icon icon={Trash} className="mr-2 h-4 w-4" />
                    Archive Document
                  </PermissionButton>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
