"use client";

/**
 * Vector Storage Monitoring Dashboard - Team A Implementation
 *
 * Comprehensive monitoring interface for vector storage and TTL management
 * TEAMA-005: Knowledge Vector TTL & Cleanup
 */
import React, { useEffect, useState } from "react";
import {
  Warning as AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  HardDrive,
  ArrowsClockwise as RefreshCw,
  Trash as Trash2,
} from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/unified-ui/components/Alert";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Separator } from "@/components/unified-ui/components/Separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Icon } from "@/lib/ui/Icon";
import {
  estimateCleanupImpact,
  getVectorStorageStats,
  shouldRecommendCleanup,
  triggerEmergencyCleanup,
  triggerOrganizationCleanup,
} from "@/lib/vector-cleanup-helpers";

interface VectorStorageStats {
  totalVectors: number;
  totalSize: number;
  totalEstimatedSize: number;
  orphanedVectors: { total: number; expired: number; estimatedSize: number };
  duplicateVectors: number;
  lastCleanup: Date | null;
  knowledgeChunks: { total: number; expired: number; withEmbeddings: number; estimatedSize: number };
  conversationEmbeddings: { total: number; expired: number; estimatedSize: number };
  vectorDocuments: { total: number; expired: number; estimatedSize: number };
}

interface CleanupImpact {
  estimatedDeletions: number;
  estimatedSpaceFreed: number;
  estimatedSpaceFreedMB: string;
  breakdown: Array<{
    type: string;
    deletions: number;
    sizeFreed: number;
    duration: number;
  }>;
  wouldProceed: boolean;
  errors: string[];
}

interface CleanupRecommendation {
  recommend: boolean;
  reasons: string[];
  urgency: "low" | "medium" | "high";
  stats: VectorStorageStats;
}

export default function VectorStorageMonitoring({ organizationId }: { organizationId?: string }) {
  const [stats, setStats] = useState<VectorStorageStats | null>(null);
  const [impact, setImpact] = useState<CleanupImpact | null>(null);
  const [recommendation, setRecommendation] = useState<CleanupRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cleanupInProgress, setCleanupInProgress] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);

      const [statsData, impactData, recommendationData] = await Promise.all([
        getVectorStorageStats(organizationId || ""),
        estimateCleanupImpact(organizationId || ""),
        shouldRecommendCleanup(organizationId || ""),
      ]);

      setStats(statsData || null);
      setImpact({
        estimatedDeletions: impactData.estimatedRemovedVectors,
        estimatedSpaceFreed: impactData.estimatedFreedSpace,
        estimatedSpaceFreedMB: (impactData.estimatedFreedSpace / (1024 * 1024)).toFixed(1) + " MB",
        breakdown: [
          {
            type: "general",
            deletions: impactData.estimatedRemovedVectors,
            sizeFreed: impactData.estimatedFreedSpace,
            duration: impactData.estimatedTimeMinutes,
          },
        ],
        wouldProceed: true,
        errors: [],
      });
      setRecommendation({
        recommend: recommendationData,
        reasons: recommendationData ? ["Storage optimization recommended"] : ["Storage is optimized"],
        urgency: recommendationData ? "medium" : "low",
        stats: statsData,
      });
    } catch (error) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const handleCleanup = async (emergency = false) => {
    try {
      setCleanupInProgress(true);

      if (emergency) {
        await triggerEmergencyCleanup({
          ...(organizationId && { organizationId }),
          aggressiveMode: true,
        });
      } else {
        await triggerOrganizationCleanup(organizationId || "", { dryRun: false });
      }

      // Refresh data after cleanup
      setTimeout(() => {
        loadData();
        setCleanupInProgress(false);
      }, 2000);
    } catch (error) {
      setCleanupInProgress(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Database} className="h-5 w-5" />
            Vector Storage Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Icon icon={RefreshCw} className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading storage data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || !impact || !recommendation) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Vector Storage Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Icon icon={AlertTriangle} className="h-4 w-4" />
            <AlertTitle>Data Unavailable</AlertTitle>
            <AlertDescription>Unable to load vector storage data. Please try refreshing.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const totalVectors = stats.knowledgeChunks.total + stats.conversationEmbeddings.total + stats.vectorDocuments.total;
  const totalExpired =
    stats.knowledgeChunks.expired +
    stats.conversationEmbeddings.expired +
    stats.vectorDocuments.expired +
    stats.orphanedVectors.total;
  const expiredPercentage = totalVectors > 0 ? (totalExpired / totalVectors) * 100 : 0;

  return (
    <div className="w-full space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vector Storage Monitoring</h2>
          <p className="text-muted-foreground">Monitor and manage vector embeddings storage and cleanup</p>
        </div>
        <div className="flex items-center gap-ds-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={refreshing}>
            <Icon icon={RefreshCw} className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {recommendation.recommend && (
            <Button
              variant={recommendation.urgency === "high" ? "destructive" : "primary"}
              size="sm"
              onClick={() => handleCleanup(recommendation.urgency === "high")}
              disabled={cleanupInProgress}
            >
              <Icon icon={Trash2} className="mr-2 h-4 w-4" />
              {cleanupInProgress ? "Cleaning..." : "Run Cleanup"}
            </Button>
          )}
        </div>
      </div>

      {/* Cleanup Recommendation Alert */}
      {recommendation.recommend && (
        <Alert className={recommendation.urgency === "high" ? "border-destructive" : "border-warning"}>
          <Icon icon={AlertTriangle} className="h-4 w-4" />
          <AlertTitle>Cleanup Recommended ({recommendation.urgency} priority)</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {recommendation.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            <Icon icon={HardDrive} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatBytes(stats.totalEstimatedSize)}</div>
            <p className="text-tiny text-muted-foreground">Across all vector types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vectors</CardTitle>
            <Icon icon={Database} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalVectors.toLocaleString()}</div>
            <p className="text-tiny text-muted-foreground">Knowledge + conversations + documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Vectors</CardTitle>
            <Icon icon={Clock} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalExpired.toLocaleString()}</div>
            <Progress value={expiredPercentage} className="mt-2" />
            <p className="text-tiny text-muted-foreground">{expiredPercentage.toFixed(1)}% of total vectors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <Icon icon={Trash2} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{impact.estimatedSpaceFreedMB} MB</div>
            <p className="text-tiny text-muted-foreground">
              {impact.estimatedDeletions.toLocaleString()} items to clean
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="cleanup">Cleanup Impact</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* Knowledge Chunks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Knowledge Chunks</CardTitle>
                <CardDescription>Document embeddings and chunks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Total chunks:</span>
                  <span className="font-medium">{stats.knowledgeChunks.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>With embeddings:</span>
                  <span className="font-medium">{stats.knowledgeChunks.withEmbeddings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expired:</span>
                  <span className="font-medium text-orange-600">{stats.knowledgeChunks.expired.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Storage size:</span>
                  <span className="font-medium">{formatBytes(stats.knowledgeChunks.estimatedSize)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Conversation Embeddings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conversation Embeddings</CardTitle>
                <CardDescription>Conversation summary embeddings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Total conversations:</span>
                  <span className="font-medium">{stats.conversationEmbeddings.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expired:</span>
                  <span className="font-medium text-orange-600">
                    {stats.conversationEmbeddings.expired.toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Storage size:</span>
                  <span className="font-medium">{formatBytes(stats.conversationEmbeddings.estimatedSize)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Vector Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vector Documents</CardTitle>
                <CardDescription>Generic vector documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Total documents:</span>
                  <span className="font-medium">{stats.vectorDocuments.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expired:</span>
                  <span className="font-medium text-orange-600">{stats.vectorDocuments.expired.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Storage size:</span>
                  <span className="font-medium">{formatBytes(stats.vectorDocuments.estimatedSize)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Orphaned Vectors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Orphaned Vectors</CardTitle>
                <CardDescription>Vectors without parent documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Orphaned count:</span>
                  <span className="font-medium text-red-600">{stats.orphanedVectors.total.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Storage size:</span>
                  <span className="font-medium">{formatBytes(stats.orphanedVectors.estimatedSize)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Storage Breakdown</CardTitle>
              <CardDescription>Detailed analysis of vector storage usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    name: "Knowledge Chunks",
                    size: stats.knowledgeChunks.estimatedSize,
                    count: stats.knowledgeChunks.total,
                  },
                  {
                    name: "Conversation Embeddings",
                    size: stats.conversationEmbeddings.estimatedSize,
                    count: stats.conversationEmbeddings.total,
                  },
                  {
                    name: "Vector Documents",
                    size: stats.vectorDocuments.estimatedSize,
                    count: stats.vectorDocuments.total,
                  },
                  {
                    name: "Orphaned Vectors",
                    size: stats.orphanedVectors.estimatedSize,
                    count: stats.orphanedVectors.total,
                  },
                ].map((item: unknown) => {
                  const percentage = stats.totalEstimatedSize > 0 ? (item.size / stats.totalEstimatedSize) * 100 : 0;
                  return (
                    <div key={item.name} className="space-y-spacing-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.name}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatBytes(item.size)}</div>
                          <div className="text-tiny text-muted-foreground">{item.count.toLocaleString()} items</div>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="text-right text-tiny text-muted-foreground">
                        {percentage.toFixed(1)}% of total storage
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleanup" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Cleanup Impact Analysis</CardTitle>
              <CardDescription>Preview of what would happen if cleanup runs now</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-ds-lg bg-muted spacing-3">
                  <div>
                    <div className="font-medium">Total Items to Delete</div>
                    <div className="text-sm text-muted-foreground">Across all vector types</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{impact.estimatedDeletions.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{impact.estimatedSpaceFreedMB} MB freed</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {impact.breakdown.map((item: unknown) => (
                    <div key={item.type} className="flex items-center justify-between rounded-ds-lg border spacing-3">
                      <div>
                        <div className="font-medium capitalize">{item.type.replace("_", " ")}</div>
                        <div className="text-sm text-muted-foreground">Estimated duration: {item.duration}ms</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.deletions.toLocaleString()} items</div>
                        <div className="text-sm text-muted-foreground">{formatBytes(item.sizeFreed)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {impact.errors.length > 0 && (
                  <Alert variant="error">
                    <Icon icon={AlertTriangle} className="h-4 w-4" />
                    <AlertTitle>Potential Issues</AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 list-inside list-disc">
                        {impact.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center gap-ds-2 pt-4">
                  <Icon icon={CheckCircle} className="text-semantic-success-dark h-5 w-5" />
                  <span className="text-sm">
                    Ready to proceed: {impact.wouldProceed ? "Yes" : "No (check errors above)"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>TTL Configuration</CardTitle>
              <CardDescription>Time-to-live settings for different vector types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-spacing-sm">
                    <label className="text-sm font-medium">Knowledge Chunks TTL</label>
                    <div className="text-3xl font-bold">90 days</div>
                    <p className="text-tiny text-muted-foreground">For knowledge document chunks</p>
                  </div>
                  <div className="space-y-spacing-sm">
                    <label className="text-sm font-medium">Conversation Embeddings TTL</label>
                    <div className="text-3xl font-bold">180 days</div>
                    <p className="text-tiny text-muted-foreground">For closed conversation summaries</p>
                  </div>
                  <div className="space-y-spacing-sm">
                    <label className="text-sm font-medium">Vector Documents TTL</label>
                    <div className="text-3xl font-bold">30 days</div>
                    <p className="text-tiny text-muted-foreground">For generic vector documents</p>
                  </div>
                  <div className="space-y-spacing-sm">
                    <label className="text-sm font-medium">Orphaned Vectors TTL</label>
                    <div className="text-3xl font-bold">7 days</div>
                    <p className="text-tiny text-muted-foreground">For vectors without parent documents</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-2 font-medium">Cleanup Schedule</h4>
                  <div className="space-y-spacing-sm text-sm">
                    <div className="flex justify-between">
                      <span>Daily cleanup:</span>
                      <Badge variant="secondary">2:00 AM daily</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Weekly comprehensive:</span>
                      <Badge variant="secondary">3:00 AM Sunday</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage monitoring:</span>
                      <Badge variant="secondary">Every 6 hours</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
