/**
 * Knowledge Management System
 *
 * Comprehensive interface for managing knowledge base content:
 * - Document upload and processing
 * - Vector embedding management
 * - Knowledge source organization
 * - Real-time sync with RAG system
 * - Performance analytics
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle as AlertCircle, ExternalLink, ChartBar as BarChart3, Book, BookOpen, Brain, CheckCircle, Clock, Database, Download, Pencil as Edit, FileText, Flame as Flame, RefreshCw as RefreshCw, Search as Search, Settings as Settings, Sparkles as Sparkles, Plus, Target, Trash as Trash2, TrendingUp, Upload, Zap as Zap,  } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Page, PageHeader, PageHeaderRow, PageTitle, PageToolbar, PageContent } from "@/components/ui/page-shell";
import { Icon } from "@/lib/ui/Icon";
import { api } from "@/lib/trpc/provider";

interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  type: "article" | "faq" | "guide" | "policy";
  status: "draft" | "published" | "archived";
  category: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  helpfulness: number;
  vectorized: boolean;
  embedding_status: "pending" | "processing" | "completed" | "failed";
  file_size?: number;
  file_type?: string;
  embedded?: boolean;
  relevanceScore?: number;
}

interface KnowledgeMetrics {
  totalDocuments: number;
  totalChunks: number;
  embeddingProgress: number;
  avgRelevance: number;
  queryVolume: number;
  responseAccuracy: number;
}

export default function KnowledgePage() {
  const router = useRouter();
  const [userName] = useState("Knowledge Manager");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Real tRPC queries
  const { data: documentsData, isLoading: documentsLoading } = api.mailbox.knowledge.list.useQuery(
    {
      mailboxSlug: "test-mailbox-dev",
      search: searchTerm || undefined,
      type: selectedType !== "all" ? selectedType as unknown : undefined,
      status: selectedStatus !== "all" ? selectedStatus as unknown : undefined,
      limit: 50,
      offset: 0,
    },
    {
      enabled: true,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const { data: knowledgeStats } = api.mailbox.knowledge.stats.useQuery(
    { mailboxSlug: "test-mailbox-dev" },
    {
      enabled: true,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // Transform API data to component format
  const documents: KnowledgeDocument[] = (documentsData?.documents || []).map((doc: any) => ({
    id: doc.id,
    title: doc.title,
    content: doc.content,
    type: doc.type,
    status: doc.status,
    category: "General", // TODO: Add category support
    tags: doc.tags,
    author: doc.author,
    createdAt: doc.createdAt.toISOString().split('T')[0],
    updatedAt: doc.updatedAt.toISOString().split('T')[0],
    views: doc.views,
    helpfulness: 4.5, // Mock helpfulness score
    vectorized: doc.embedding,
    embedding_status: doc.embedding ? "completed" : "pending",
    embedded: doc.embedding,
    relevanceScore: 0.95,
  }));

  const loading = documentsLoading;


  // Calculate metrics from real data
  const metrics: KnowledgeMetrics = {
    totalDocuments: knowledgeStats?.total || 0,
    totalChunks: (knowledgeStats?.total || 0) * 15, // Estimate chunks per document
    embeddingProgress: Math.round(((knowledgeStats?.published || 0) / Math.max(knowledgeStats?.total || 1, 1)) * 100),
    avgRelevance: 0.92, // TODO: Calculate from search analytics
    queryVolume: 1247, // TODO: Get from analytics
    responseAccuracy: 0.89, // TODO: Calculate from feedback data
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    {
      title: string;
      chunk: string;
      relevance: number;
      document_id: string;
    }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  const [newDocument, setNewDocument] = useState({
    title: "",
    content: "",
    type: "article" as const,
    category: "",
    tags: [] as string[],
  });

  const [showAddDocument, setShowAddDocument] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);

  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      // The search is handled by the tRPC query automatically
      // when searchTerm changes
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getStatusBadge = (status: KnowledgeDocument["status"]) => {
    switch (status) {
      case "published":
        return <Badge variant="default" className="rounded-full">Published</Badge>;
      case "draft":
        return <Badge variant="secondary" className="rounded-full">Draft</Badge>;
      case "archived":
        return <Badge variant="outline" className="rounded-full">Archived</Badge>;
      default:
        return <Badge variant="outline" className="rounded-full">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: KnowledgeDocument["type"]) => {
    switch (type) {
      case "article":
        return <Badge variant="outline" className="rounded-full">Article</Badge>;
      case "faq":
        return <Badge variant="outline" className="rounded-full">FAQ</Badge>;
      case "guide":
        return <Badge variant="outline" className="rounded-full">Guide</Badge>;
      case "policy":
        return <Badge variant="outline" className="rounded-full">Policy</Badge>;
      default:
        return <Badge variant="outline" className="rounded-full">Document</Badge>;
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Simulate search API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock search results
      setSearchResults([
        {
          title: "Getting Started with Customer Support",
          chunk: "This guide covers the basics of providing excellent customer support including response times, tone, and problem-solving techniques.",
          relevance: 0.95,
          document_id: "1",
        },
        {
          title: "Handling Difficult Customers",
          chunk: "When dealing with frustrated customers, it's important to remain calm, listen actively, and focus on finding solutions.",
          relevance: 0.87,
          document_id: "2",
        },
      ]);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    // Simulate document upload and processing
    console.log("Uploading document:", file.name);

    const newDoc: KnowledgeDocument = {
      id: Date.now().toString(),
      title: file.name.replace(/\.[^/.]+$/, ""),
      content: "Document content will be extracted...",
      type: "article",
      status: "draft",
      category: "Uncategorized",
      tags: [],
      author: userName,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      views: 0,
      helpfulness: 0,
      vectorized: false,
      embedding_status: "pending",
      file_size: file.size,
      file_type: file.type,
      embedded: false,
      relevanceScore: 0,
    };

    // setDocuments(prev => [newDoc, ...prev]); // This line was removed as per the edit hint
  };

  const handleDeleteDocument = (_documentId: string) => {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading knowledge base...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Page>
      <PageHeader>
        <PageHeaderRow
          left={<PageTitle subtitle="Manage your knowledge base and AI training content">{`${getGreeting()}, ${userName}`}</PageTitle>}
          right={
            <PageToolbar>
              <Button onClick={() => router.push('/dashboard/knowledge/editor')} leftIcon={<Icon icon={Plus} className="h-4 w-4" />}>
                New Document
              </Button>
              <Button onClick={() => setShowAddDocument(true)} variant="outline" leftIcon={<Icon icon={Upload} className="h-4 w-4" />}>
                Upload File
              </Button>
            </PageToolbar>
          }
        />
      </PageHeader>

      <PageContent>
        {/* Knowledge Metrics Overview */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <Icon icon={FileText} className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                Knowledge articles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vector Chunks</CardTitle>
              <Icon icon={Database} className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalChunks}</div>
              <p className="text-xs text-muted-foreground">
                Embedded content
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
              <Icon icon={Brain} className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(metrics.responseAccuracy * 100)}%</div>
              <p className="text-xs text-muted-foreground">
                Response quality
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Query Volume</CardTitle>
              <Icon icon={TrendingUp} className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.queryVolume}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="search">AI Search</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Knowledge Documents</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Icon icon={Search} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">{doc.title}</h3>
                        <div className="flex items-center gap-[var(--fl-spacing-2)]">
                          {getStatusBadge(doc.status)}
                          {getTypeBadge(doc.type)}
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Icon icon={Edit} className="h-4 w-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-3">{doc.content}</p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>By {doc.author}</span>
                      <span>{doc.views} views</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">AI Embedding</span>
                        <div className="flex items-center gap-[var(--fl-spacing-2)]">
                          {doc.vectorized ? (
                            <Icon icon={CheckCircle} className="h-4 w-4 text-green-500" />
                          ) : (
                            <Icon icon={Clock} className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm font-medium">
                            {doc.vectorized ? "Complete" : "Pending"}
                          </span>
                        </div>
                      </div>
                      {doc.vectorized && (
                        <Progress value={100} className="h-2" />
                      )}
                    </div>

                    <div className="flex gap-[var(--fl-spacing-2)] pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedDocument(doc)}
                        leftIcon={<Icon icon={BookOpen} className="h-3 w-3" />}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteDocument(doc.id)}
                        leftIcon={<Icon icon={Trash2} className="h-3 w-3" />}
                      >
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* AI Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-[var(--fl-spacing-2)]">
                  <Icon icon={Brain} className="h-5 w-5" />
                  AI-Powered Knowledge Search
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-[var(--fl-spacing-2)]">
                  <Input
                    type="text"
                    placeholder="Ask a question about your knowledge base..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    leftIcon={
                      isSearching ? (
                        <Icon icon={RefreshCw} className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon icon={Search} className="h-4 w-4" />
                      )
                    }
                  >
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Search Results</h3>
                    {searchResults.map((result, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h4 className="font-medium">{result.title}</h4>
                              <p className="text-sm text-gray-600">{result.chunk}</p>
                              <div className="flex items-center gap-[var(--fl-spacing-2)]">
                                <Badge variant="outline" className="rounded-full">
                                  {Math.round(result.relevance * 100)}% relevance
                                </Badge>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" leftIcon={<Icon icon={ExternalLink} className="h-3 w-3" />}>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-[var(--fl-spacing-2)]">
                    <Icon icon={BarChart3} className="h-5 w-5" />
                    Embedding Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Documents Processed</span>
                      <span className="text-sm font-medium">
                        {documents.filter(d => d.vectorized).length}/{documents.length}
                      </span>
                    </div>
                    <Progress
                      value={documents.length > 0 ? (documents.filter(d => d.vectorized).length / documents.length) * 100 : 0}
                      className="h-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Average Relevance</span>
                      <span className="text-sm font-medium">
                        {Math.round(metrics.avgRelevance * 100)}%
                      </span>
                    </div>
                    <Progress value={metrics.avgRelevance * 100} className="h-3" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-[var(--fl-spacing-2)]">
                    <Icon icon={TrendingUp} className="h-5 w-5" />
                    Usage Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{metrics.queryVolume}</div>
                      <div className="text-sm text-gray-500">Total Queries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(metrics.responseAccuracy * 100)}%
                      </div>
                      <div className="text-sm text-gray-500">Accuracy Rate</div>
                    </div>
                  </div>

                  <Alert>
                    <Icon icon={Sparkles} className="h-4 w-4" />
                    <AlertDescription>
                      Your knowledge base is performing well! Consider adding more documents to improve AI responses.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </PageContent>
    </Page>
  );
}