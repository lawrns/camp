"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface KnowledgeBaseDashboardProps {
  organizationId: string;
  className?: string;
}

interface KnowledgeStats {
  totalDocuments: number;
  totalChunks: number;
  totalCategories: number;
  lastUpdated: string | null;
}

export function KnowledgeBaseDashboard({ organizationId, className }: KnowledgeBaseDashboardProps) {
  const [stats, setStats] = useState<KnowledgeStats>({
    totalDocuments: 0,
    totalChunks: 0,
    totalCategories: 0,
    lastUpdated: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/knowledge/stats?organizationId=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.data || stats);
        }
      } catch (error) {
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [organizationId]);
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">Manage your organization's knowledge documents and content</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="spacing-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-3xl font-bold">{loading ? "..." : stats.totalDocuments}</p>
              </div>
              <Icon icon={BookOpen} className="h-8 w-8 text-[var(--fl-color-info)]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="spacing-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Chunks</p>
                <p className="text-3xl font-bold">{loading ? "..." : stats.totalChunks}</p>
              </div>
              <Icon icon={Brain} className="text-semantic-success h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Area */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Knowledge base features are being loaded for organization: {organizationId}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default KnowledgeBaseDashboard;
