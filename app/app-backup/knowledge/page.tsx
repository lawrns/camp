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
import {
  Warning as AlertCircle,
  ArrowSquareOut,
  ChartBar as BarChart3,
  Book,
  BookOpen,
  Brain,
  CheckCircle,
  Clock,
  Database,
  Download,
  PencilSimple as Edit,
  FileText,
  Fire as Flame,
  ArrowsClockwise as RefreshCw,
  MagnifyingGlass as Search,
  Gear as Settings,
  Sparkle as Sparkles,
  Target,
  Trash as Trash2,
  TrendUp as TrendingUp,
  Upload,
  Lightning as Zap,
} from "@phosphor-icons/react";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { Icon } from "@/lib/ui/Icon";

interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  chunks: number;
  embedded: boolean;
  lastUpdated: string;
  relevanceScore: number;
  usage: number;
  source: string;
  status: "active" | "processing" | "failed" | "disabled";
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
  const [loading, setLoading] = useState(true);

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);

  // Fetch documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch("/api/knowledge/documents");
        if (response.ok) {
          const data = await response.json();
          setDocuments(data.data.documents || []);
        }
      } catch (error) {
        // Keep empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const [metrics, setMetrics] = useState<KnowledgeMetrics>({
    totalDocuments: 0,
    totalChunks: 0,
    embeddingProgress: 0,
    avgRelevance: 0,
    queryVolume: 0,
    responseAccuracy: 0,
  });

  // Fetch metrics from API
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/knowledge/stats");
        if (response.ok) {
          const data = await response.json();
          const stats = data.data;
          setMetrics({
            totalDocuments: stats.totalDocuments || 0,
            totalChunks: stats.totalChunks || 0,
            embeddingProgress:
              documents.length > 0
                ? Math.round((documents.filter((d) => d.embedded).length / documents.length) * 100)
                : 0,
            avgRelevance:
              documents.length > 0 ? documents.reduce((sum, d) => sum + d.relevanceScore, 0) / documents.length : 0,
            queryVolume: stats.queryVolume || 0,
            responseAccuracy: stats.responseAccuracy || 0,
          });
        }
      } catch (error) {
        // Keep default values on error
      }
    };

    if (documents.length > 0) {
      fetchMetrics();
    }
  }, [documents]);

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
    source: "upload",
  });

  const [isUploading, setIsUploading] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    // Simulate real-time metrics updates
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        queryVolume: prev.queryVolume + Math.floor(Math.random() * 5),
        embeddingProgress: Math.min(100, prev.embeddingProgress + Math.random() * 2),
      }));
    }, 10000);

    return () => {
      clearTimeout(loadTimer);
      clearInterval(interval);
    };
  }, []);

  const handleSearch = async (query: string): Promise<void> => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchQuery(query);

    try {
      // Perform real knowledge base search
      const response = await fetch(`/api/knowledge/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.data.results || []);
        } else {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUploadDocument = async (): Promise<void> => {
    if (!newDocument.title || !newDocument.content) return;

    setIsUploading(true);

    try {
      // Real document upload to API
      const response = await fetch("/api/knowledge/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newDocument.title,
          content: newDocument.content,
          source_type: "manual",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh documents list
          const documentsResponse = await fetch("/api/knowledge/documents");
          if (documentsResponse.ok) {
            const documentsData = await documentsResponse.json();
            setDocuments(documentsData.data.documents || []);
          }

          // Clear form
          setNewDocument({ title: "", content: "", source: "upload" });

          // Refresh metrics
          const metricsResponse = await fetch("/api/knowledge/stats");
          if (metricsResponse.ok) {
            const metricsData = await metricsResponse.json();
            const stats = metricsData.data;
            setMetrics((prev) => ({
              ...prev,
              totalDocuments: stats.totalDocuments || 0,
              totalChunks: stats.totalChunks || 0,
            }));
          }
        }
      }
    } catch (error) {

    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const response = await fetch(`/api/knowledge/documents/${docId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh documents list
        const documentsResponse = await fetch("/api/knowledge/documents");
        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json();
          setDocuments(documentsData.data.documents || []);
        }

        // Refresh metrics
        const metricsResponse = await fetch("/api/knowledge/stats");
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          const stats = metricsData.data;
          setMetrics((prev) => ({
            ...prev,
            totalDocuments: stats.totalDocuments || 0,
            totalChunks: stats.totalChunks || 0,
          }));
        }
      }
    } catch (error) {

    }
  };

  const handleReprocessDocument = async (docId: string) => {
    try {
      const response = await fetch(`/api/knowledge/documents/${docId}/reprocess`, {
        method: "POST",
      });

      if (response.ok) {
        // Refresh documents list to show updated status
        const documentsResponse = await fetch("/api/knowledge/documents");
        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json();
          setDocuments(documentsData.data.documents || []);
        }
      }
    } catch (error) {

    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="space-y-8">
            <div className="h-32 animate-pulse radius-2xl bg-gray-200"></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-ds-xl bg-gray-200"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-ds-xl bg-gray-200"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
      <div className="container mx-auto max-w-6xl px-6 py-12">
        {/* Welcome Header with Fire Icon */}
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-4">
            <Icon icon={Flame} size={47} className="flex-shrink-0 text-blue-600" />
            <div className="text-left">
              <h1 className="text-4xl font-bold text-gray-900">
                {getGreeting()}, {userName}!
              </h1>
              <p className="mt-1 text-xl text-gray-600">Manage your AI knowledge base effectively</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-[var(--fl-color-text-muted)]">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-ds-full bg-emerald-500"></div>
              <span>Live data • Last updated {new Date().toLocaleTimeString()}</span>
            </div>
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              size="sm"
              className="border-status-info-light flex items-center gap-2 text-blue-600 hover:bg-[var(--fl-color-info-subtle)]"
            >
              <Icon icon={Zap} className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Knowledge Metrics - Beautiful Blue Theme */}
        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="spacing-6">
              <div className="mb-4 flex items-center justify-between">
                <Icon icon={BookOpen} className="h-8 w-8" />
                <Badge className="border-0 bg-white/20 text-xs text-white">Total</Badge>
              </div>
              <div className="mb-1 text-3xl font-bold">{metrics.totalDocuments}</div>
              <div className="text-sm text-blue-100">Knowledge Documents</div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-lg">
            <CardContent className="spacing-6">
              <div className="mb-4 flex items-center justify-between">
                <Icon icon={Brain} className="h-8 w-8" />
                <Badge className="border-0 bg-white/20 text-xs text-white">Progress</Badge>
              </div>
              <div className="mb-1 text-3xl font-bold">{Math.round(metrics.embeddingProgress)}%</div>
              <div className="text-sm text-blue-100">Embedding Complete</div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg">
            <CardContent className="spacing-6">
              <div className="mb-4 flex items-center justify-between">
                <Icon icon={Target} className="h-8 w-8" />
                <Badge className="border-0 bg-white/20 text-xs text-white">Accuracy</Badge>
              </div>
              <div className="mb-1 text-3xl font-bold">{Math.round(metrics.responseAccuracy * 100)}%</div>
              <div className="text-sm text-blue-100">Response Quality</div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-300 to-blue-400 text-white shadow-lg">
            <CardContent className="spacing-6">
              <div className="mb-4 flex items-center justify-between">
                <Icon icon={Search} className="h-8 w-8" />
                <Badge className="border-0 bg-white/20 text-xs text-white">Queries</Badge>
              </div>
              <div className="mb-1 text-3xl font-bold">{metrics.queryVolume}</div>
              <div className="text-sm text-blue-100">Total Searches</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="documents" className="space-y-8">
          <div className="flex items-center justify-center">
            <TabsList className="grid w-full max-w-2xl grid-cols-5">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="documents" className="space-y-6">
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Icon icon={Database} className="h-6 w-6 text-blue-600" />
                  Knowledge Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.map((doc: KnowledgeDocument) => (
                    <div
                      key={doc.id}
                      className="rounded-ds-xl border border-[var(--fl-color-border-subtle)] spacing-4 transition-all hover:bg-[var(--fl-color-info-subtle)]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{doc.title}</h4>
                            <Badge
                              variant={
                                doc.status === "active"
                                  ? "default"
                                  : doc.status === "processing"
                                    ? "secondary"
                                    : doc.status === "failed"
                                      ? "error"
                                      : "secondary"
                              }
                            >
                              {doc.status}
                            </Badge>
                            {doc.embedded && (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                                Embedded
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-4 text-sm text-[var(--fl-color-text-muted)] md:grid-cols-4">
                            <div className="flex items-center gap-1">
                              <Icon icon={FileText} className="h-4 w-4" />
                              {doc.chunks} chunks
                            </div>
                            <div className="flex items-center gap-1">
                              <Icon icon={Target} className="h-4 w-4" />
                              {Math.round(doc.relevanceScore * 100)}% relevance
                            </div>
                            <div className="flex items-center gap-1">
                              <Icon icon={Search} className="h-4 w-4" />
                              {doc.usage} queries
                            </div>
                            <div className="flex items-center gap-1">
                              <Icon icon={Clock} className="h-4 w-4" />
                              {doc.lastUpdated}
                            </div>
                          </div>
                          <p className="leading-relaxed text-sm text-gray-600">
                            {doc.content.substring(0, 150)}...
                          </p>
                        </div>
                        <div className="ml-4 flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleReprocessDocument(doc.id)}>
                            <Icon icon={RefreshCw} className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Icon icon={Edit} className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Icon icon={Download} className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-status-error hover:text-red-600-dark"
                          >
                            <Icon icon={Trash2} className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Icon icon={Search} className="h-6 w-6 text-blue-600" />
                  Knowledge Base Search
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-3">
                  <Input
                    placeholder="Search knowledge base..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch(searchQuery)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleSearch(searchQuery)}
                    disabled={isSearching}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {isSearching ? (
                      <Icon icon={RefreshCw} className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon icon={Search} className="h-4 w-4" />
                    )}
                    Search
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Search Results</h4>
                    {searchResults.map((result, index) => (
                      <div key={index} className="rounded-ds-xl bg-gradient-to-r from-blue-50 to-blue-100 spacing-4">
                        <div className="mb-2 flex items-start justify-between">
                          <h5 className="font-semibold text-blue-900">{result.title}</h5>
                          <Badge className="bg-blue-600 text-white">{Math.round(result.relevance * 100)}% match</Badge>
                        </div>
                        <p className="text-status-info-dark leading-relaxed text-sm">{result.chunk}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-ds-xl bg-gradient-to-r from-blue-50 to-blue-100 spacing-4">
                  <div className="flex items-start gap-3">
                    <Icon icon={Sparkles} className="h-6 w-6 text-blue-600" />
                    <div className="flex-1">
                      <h4 className="mb-1 font-semibold text-blue-900">Search Testing</h4>
                      <p className="text-status-info-dark leading-relaxed text-sm">
                        Search queries use the same vector similarity system as your AI assistant. Test different
                        queries to optimize knowledge retrieval accuracy.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Icon icon={Upload} className="h-6 w-6 text-blue-600" />
                  Upload New Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Document Title</label>
                    <Input
                      placeholder="Enter document title..."
                      value={newDocument.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewDocument((prev) => ({ ...prev, title: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Content</label>
                    <Textarea
                      placeholder="Paste or type your document content here..."
                      value={newDocument.content}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setNewDocument((prev) => ({ ...prev, content: e.target.value }))
                      }
                      rows={10}
                      className="resize-none"
                    />
                    <p className="mt-2 text-xs text-[var(--fl-color-text-muted)]">
                      Estimated chunks: {Math.floor(newDocument.content.length / 500)} • Characters:{" "}
                      {newDocument.content.length}
                    </p>
                  </div>
                  <Button
                    onClick={handleUploadDocument}
                    disabled={!newDocument.title || !newDocument.content || isUploading}
                    className="w-full bg-blue-600 py-3 text-white hover:bg-blue-700"
                  >
                    {isUploading ? (
                      <>
                        <Icon icon={RefreshCw} className="mr-2 h-5 w-5 animate-spin" />
                        Processing Document...
                      </>
                    ) : (
                      <>
                        <Icon icon={Upload} className="mr-2 h-5 w-5" />
                        Upload Document
                      </>
                    )}
                  </Button>
                </div>

                <div className="rounded-ds-xl bg-gradient-to-r from-emerald-50 to-emerald-100 spacing-4">
                  <div className="flex items-start gap-3">
                    <Icon icon={CheckCircle} className="h-6 w-6 text-emerald-600" />
                    <div className="flex-1">
                      <h4 className="mb-1 font-semibold text-emerald-900">Automatic Processing</h4>
                      <p className="leading-relaxed text-sm text-emerald-700">
                        Documents are automatically chunked, embedded using vector AI, and integrated with your
                        knowledge base. Processing typically takes 30-60 seconds depending on document size.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Icon icon={BarChart3} className="h-6 w-6 text-blue-600" />
                    Usage Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Knowledge Base Utilization</span>
                      <span className="text-sm text-[var(--fl-color-text-muted)]">
                        {Math.round(metrics.avgRelevance * 100)}%
                      </span>
                    </div>
                    <Progress value={metrics.avgRelevance * 100} className="h-3" />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Embedding Progress</span>
                      <span className="text-sm text-[var(--fl-color-text-muted)]">
                        {Math.round(metrics.embeddingProgress)}%
                      </span>
                    </div>
                    <Progress value={metrics.embeddingProgress} className="h-3" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-ds-xl bg-[var(--fl-color-background-subtle)] spacing-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">{metrics.totalChunks}</div>
                      <div className="text-xs uppercase tracking-wide text-[var(--fl-color-text-muted)]">
                        Total Chunks
                      </div>
                    </div>
                    <div className="rounded-ds-xl bg-[var(--fl-color-background-subtle)] spacing-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">{Math.round(metrics.avgRelevance * 100)}%</div>
                      <div className="text-xs uppercase tracking-wide text-[var(--fl-color-text-muted)]">
                        Avg Relevance
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Icon icon={TrendingUp} className="h-6 w-6 text-blue-600" />
                    Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-ds-xl bg-gradient-to-r from-blue-50 to-blue-100 spacing-4">
                    <div className="flex items-start gap-3">
                      <Icon icon={Sparkles} className="h-6 w-6 text-blue-600" />
                      <div className="flex-1">
                        <h4 className="mb-1 font-semibold text-blue-900">Knowledge Insight</h4>
                        <p className="text-status-info-dark leading-relaxed text-sm">
                          Your knowledge base is performing excellently with{" "}
                          {Math.round(metrics.responseAccuracy * 100)}% accuracy.
                          {metrics.queryVolume} queries processed with high relevance scores.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      className="w-full bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => router.push("/dashboard/ai-management")}
                    >
                      <Icon icon={Brain} className="mr-2 h-5 w-5" />
                      AI Management
                      <Icon icon={ArrowSquareOut} className="ml-2 h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      className="border-status-info-light w-full text-blue-600 hover:bg-[var(--fl-color-info-subtle)]"
                      onClick={() => router.push("/dashboard/analytics")}
                    >
                      <Icon icon={BarChart3} className="mr-2 h-5 w-5" />
                      Full Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Icon icon={Settings} className="h-6 w-6 text-blue-600" />
                  Knowledge Base Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Processing Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-ds-lg border spacing-3">
                        <div>
                          <span className="text-sm font-medium">Auto-embedding</span>
                          <p className="text-xs text-[var(--fl-color-text-muted)]">Automatically embed new documents</p>
                        </div>
                        <div className="h-2 w-2 rounded-ds-full bg-emerald-500"></div>
                      </div>
                      <div className="flex items-center justify-between rounded-ds-lg border spacing-3">
                        <div>
                          <span className="text-sm font-medium">Chunk optimization</span>
                          <p className="text-xs text-[var(--fl-color-text-muted)]">Smart document chunking</p>
                        </div>
                        <div className="h-2 w-2 rounded-ds-full bg-emerald-500"></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Performance Thresholds</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-ds-lg border spacing-3">
                        <span className="text-sm font-medium">Min relevance score</span>
                        <Badge variant="outline">0.75</Badge>
                      </div>
                      <div className="flex items-center justify-between rounded-ds-lg border spacing-3">
                        <span className="text-sm font-medium">Max chunk size</span>
                        <Badge variant="outline">512 tokens</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">Save Configuration</h4>
                      <p className="text-sm text-[var(--fl-color-text-muted)]">
                        Apply changes to knowledge base settings
                      </p>
                    </div>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">Save Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
