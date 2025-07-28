/**
 * Knowledge Profile Manager
 * Manages knowledge profiles and expertise areas for AI systems
 */

export interface KnowledgeProfile {
  id: string;
  name: string;
  description: string;
  domains: string[];
  expertise: ExpertiseArea[];
  version: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isDefault?: boolean;
  confidenceThreshold: number; // 0-1 scale, minimum confidence for responses
  metadata?: Record<string, unknown>;
  // Additional properties for quality analysis
  confidence?: number;
  model?: string;
  usageCount?: number;
  lastUsed?: Date;
}

export interface ExpertiseArea {
  domain: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  confidence: number; // 0-1
  keywords: string[];
  lastUpdated: Date;
}

export interface ProfileMetrics {
  totalProfiles: number;
  activeProfiles: number;
  averageConfidence: number;
  topDomains: string[];
  recentUpdates: number;
}

export interface KnowledgeQuery {
  query: string;
  domain?: string;
  minConfidence?: number;
  maxResults?: number;
}

export interface QueryResult {
  profile: KnowledgeProfile;
  relevanceScore: number;
  matchedDomains: string[];
  confidence: number;
}

export class KnowledgeProfileManager {
  private profiles: Map<string, KnowledgeProfile> = new Map();
  private profileIndex: Map<string, Set<string>> = new Map(); // domain -> profile IDs

  constructor() {
    this.initializeDefaultProfiles();
  }

  private initializeDefaultProfiles(): void {
    const defaultProfile: KnowledgeProfile = {
      id: "default-profile",
      name: "General Knowledge",
      description: "General purpose knowledge profile for common queries",
      domains: ["general", "support", "documentation"],
      expertise: [
        {
          domain: "general",
          level: "intermediate",
          confidence: 0.7,
          keywords: ["help", "support", "question", "information"],
          lastUpdated: new Date(),
        },
        {
          domain: "support",
          level: "advanced",
          confidence: 0.8,
          keywords: ["troubleshoot", "issue", "problem", "fix"],
          lastUpdated: new Date(),
        },
      ],
      version: "1.0.0",
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      confidenceThreshold: 0.7,
    };

    this.profiles.set(defaultProfile.id, defaultProfile);
    this.updateIndex(defaultProfile);
  }

  async createProfile(
    profileData: Omit<KnowledgeProfile, "id" | "createdAt" | "updatedAt">
  ): Promise<KnowledgeProfile> {
    const profile: KnowledgeProfile = {
      ...profileData,
      id: `profile-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.profiles.set(profile.id, profile);
    this.updateIndex(profile);

    return profile;
  }

  async getProfile(id: string): Promise<KnowledgeProfile | null> {
    return this.profiles.get(id) || null;
  }

  async updateProfile(id: string, updates: Partial<KnowledgeProfile>): Promise<KnowledgeProfile | null> {
    const existing = this.profiles.get(id);
    if (!existing) return null;

    const updated: KnowledgeProfile = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    this.profiles.set(id, updated);
    this.updateIndex(updated);

    return updated;
  }

  async deleteProfile(id: string): Promise<boolean> {
    const profile = this.profiles.get(id);
    if (!profile) return false;

    this.profiles.delete(id);
    this.removeFromIndex(profile);

    return true;
  }

  async listProfiles(activeOnly = true): Promise<KnowledgeProfile[]> {
    const allProfiles = Array.from(this.profiles.values());
    return activeOnly ? allProfiles.filter((p: unknown) => p.isActive) : allProfiles;
  }

  async queryProfiles(query: KnowledgeQuery): Promise<QueryResult[]> {
    const { query: searchQuery, domain, minConfidence = 0, maxResults = 10 } = query;
    const results: QueryResult[] = [];

    for (const profile of Array.from(this.profiles.values())) {
      if (!profile.isActive) continue;

      // Domain filtering
      if (domain && !profile.domains.includes(domain)) continue;

      // Calculate relevance score
      const relevanceScore = this.calculateRelevance(profile, searchQuery);
      if (relevanceScore < minConfidence) continue;

      // Find matched domains
      const matchedDomains = profile.domains.filter(
        (d) =>
          searchQuery.toLowerCase().includes(d.toLowerCase()) ||
          profile.expertise.some(
            (e) => e.domain === d && e.keywords.some((k) => searchQuery.toLowerCase().includes(k.toLowerCase()))
          )
      );

      // Calculate average confidence
      const confidence =
        profile.expertise.reduce((sum: any, e: unknown) => sum + e.confidence, 0) / profile.expertise.length;

      results.push({
        profile,
        relevanceScore,
        matchedDomains,
        confidence,
      });
    }

    // Sort by relevance score and confidence
    results.sort((a, b) => b.relevanceScore + b.confidence - (a.relevanceScore + a.confidence));

    return results.slice(0, maxResults);
  }

  private calculateRelevance(profile: KnowledgeProfile, query: string): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    // Check domain matches
    for (const domain of profile.domains) {
      if (queryLower.includes(domain.toLowerCase())) {
        score += 0.3;
      }
    }

    // Check expertise keywords
    for (const expertise of profile.expertise) {
      for (const keyword of expertise.keywords) {
        if (queryLower.includes(keyword.toLowerCase())) {
          score += 0.2 * expertise.confidence;
        }
      }
    }

    // Check name and description
    if (queryLower.includes(profile.name.toLowerCase())) {
      score += 0.4;
    }
    if (profile.description.toLowerCase().includes(queryLower)) {
      score += 0.2;
    }

    return Math.min(score, 1); // Cap at 1.0
  }

  private updateIndex(profile: KnowledgeProfile): void {
    // Remove from existing index entries
    this.removeFromIndex(profile);

    // Add to new index entries
    for (const domain of profile.domains) {
      if (!this.profileIndex.has(domain)) {
        this.profileIndex.set(domain, new Set());
      }
      this.profileIndex.get(domain)!.add(profile.id);
    }
  }

  private removeFromIndex(profile: KnowledgeProfile): void {
    for (const domain of profile.domains) {
      const domainProfiles = this.profileIndex.get(domain);
      if (domainProfiles) {
        domainProfiles.delete(profile.id);
        if (domainProfiles.size === 0) {
          this.profileIndex.delete(domain);
        }
      }
    }
  }

  async getMetrics(): Promise<ProfileMetrics> {
    const allProfiles = Array.from(this.profiles.values());
    const activeProfiles = allProfiles.filter((p: unknown) => p.isActive);

    const totalConfidence = activeProfiles.reduce(
      (sum, p) => sum + p.expertise.reduce((eSum: any, e: unknown) => eSum + e.confidence, 0) / p.expertise.length,
      0
    );

    const domainCounts = new Map<string, number>();
    for (const profile of activeProfiles) {
      for (const domain of profile.domains) {
        domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      }
    }

    const topDomains = Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([domain]) => domain);

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUpdates = allProfiles.filter((p: unknown) => p.updatedAt > oneWeekAgo).length;

    return {
      totalProfiles: allProfiles.length,
      activeProfiles: activeProfiles.length,
      averageConfidence: activeProfiles.length > 0 ? totalConfidence / activeProfiles.length : 0,
      topDomains,
      recentUpdates,
    };
  }

  async exportProfiles(): Promise<KnowledgeProfile[]> {
    return Array.from(this.profiles.values());
  }

  async importProfiles(profiles: KnowledgeProfile[]): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    for (const profile of profiles) {
      try {
        // Validate profile structure
        if (!profile.id || !profile.name || !profile.domains) {
          errors.push(`Invalid profile structure: ${profile.id || "unknown"}`);
          continue;
        }

        this.profiles.set(profile.id, {
          ...profile,
          updatedAt: new Date(),
        });
        this.updateIndex(profile);
        imported++;
      } catch (error) {
        errors.push(`Failed to import profile ${profile.id}: ${error}`);
      }
    }

    return { imported, errors };
  }

  async analyzeKnowledgeBaseQuality(organizationId: string): Promise<any> {
    const profiles = await this.getOrganizationProfiles(organizationId);

    // Calculate quality metrics
    const totalProfiles = profiles.length;
    const activeProfiles = profiles.filter((p: unknown) => p.confidence > 0.5);
    const averageConfidence =
      activeProfiles.length > 0
        ? activeProfiles.reduce((sum: any, p: unknown) => sum + p.confidence, 0) / activeProfiles.length
        : 0;

    // Domain coverage analysis
    const domainCoverage = new Set<string>();
    profiles.forEach((p: unknown) => p.domains.forEach((d: unknown) => domainCoverage.add(d)));

    // Identify gaps
    const commonDomains = ["customer-service", "product", "billing", "technical-support", "onboarding"];
    const missingDomains = commonDomains.filter((d: unknown) => !domainCoverage.has(d));

    const overallScore = averageConfidence * 100; // Convert to percentage

    return {
      quality: {
        overall: averageConfidence,
        completeness: totalProfiles / 100, // Assume 100 profiles is complete
        accuracy: averageConfidence,
        freshness: this.calculateFreshness(profiles),
      },
      overallScore, // Add this for backward compatibility
      metrics: {
        totalProfiles,
        activeProfiles: activeProfiles.length,
        domainCoverage: domainCoverage.size,
        averageConfidence,
        coverage: (domainCoverage.size / commonDomains.length) * 100,
        freshness: this.calculateFreshness(profiles) * 100,
        relevance: averageConfidence * 100,
        completeness: (totalProfiles / 100) * 100,
        duplication: 0, // Placeholder for duplication metric
      },
      recommendations: this.generateQualityRecommendations(profiles, missingDomains),
      gaps: missingDomains,
    };
  }

  async getOrganizationProfiles(organizationId: string): Promise<KnowledgeProfile[]> {
    // In a real implementation, this would filter by organization
    return Array.from(this.profiles.values());
  }

  private calculateFreshness(profiles: KnowledgeProfile[]): number {
    if (profiles.length === 0) return 0;

    const now = Date.now();
    const weekInMs = 7 * 24 * 60 * 60 * 1000;

    const freshProfiles = profiles.filter((p: unknown) => now - p.updatedAt.getTime() < weekInMs);

    return freshProfiles.length / profiles.length;
  }

  private generateQualityRecommendations(profiles: KnowledgeProfile[], missingDomains: string[]): unknown[] {
    const recommendations: unknown[] = [];

    if (profiles.length < 50) {
      recommendations.push({
        type: "knowledge_gap",
        priority: "high",
        description: "Add more knowledge profiles to improve coverage",
      });
    }

    if (missingDomains.length > 0) {
      recommendations.push({
        type: "knowledge_gap",
        priority: "high",
        description: `Add profiles for missing domains: ${missingDomains.join(", ")}`,
      });
    }

    const lowConfidenceProfiles = profiles.filter((p: unknown) => (p.confidence || p.confidenceThreshold) < 0.5);
    if (lowConfidenceProfiles.length > profiles.length * 0.2) {
      recommendations.push({
        type: "quality",
        priority: "medium",
        description: "Review and update low-confidence profiles",
      });
    }

    const staleProfiles = profiles.filter((p: unknown) => Date.now() - p.updatedAt.getTime() > 30 * 24 * 60 * 60 * 1000);
    if (staleProfiles.length > 0) {
      recommendations.push({
        type: "maintenance",
        priority: "low",
        description: `Update ${staleProfiles.length} stale profiles`,
      });
    }

    return recommendations;
  }

  // Missing method: cloneProfile
  async cloneProfile(
    sourceId: string,
    modifications: Partial<KnowledgeProfile> & { name: string }
  ): Promise<KnowledgeProfile> {
    const sourceProfile = await this.getProfile(sourceId);
    if (!sourceProfile) {
      throw new Error(`Source profile ${sourceId} not found`);
    }

    const clonedProfile: KnowledgeProfile = {
      ...sourceProfile,
      ...modifications,
      id: `profile-${Date.now()}`,
      name: modifications.name,
      isDefault: false, // Cloned profiles are never default
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.profiles.set(clonedProfile.id, clonedProfile);
    this.updateIndex(clonedProfile);

    return clonedProfile;
  }

  // Missing method: getProfileMetrics
  async getProfileMetrics(profileId: string, period: "1h" | "24h" | "7d" | "30d" = "7d"): Promise<any> {
    const profile = await this.getProfile(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    // Calculate period-specific metrics
    const now = Date.now();
    const periodMs = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    }[period];

    const periodStart = new Date(now - periodMs);

    // Mock metrics - in a real implementation, these would come from usage logs
    return {
      profileId,
      period,
      queries: {
        total: Math.floor(Math.random() * 1000) + 100,
        successful: Math.floor(Math.random() * 900) + 90,
        failed: Math.floor(Math.random() * 10),
      },
      performance: {
        averageResponseTime: Math.floor(Math.random() * 2000) + 500,
        averageConfidence: profile.confidence || profile.confidenceThreshold,
        successRate: 0.95 + Math.random() * 0.05,
      },
      usage: {
        totalTokens: Math.floor(Math.random() * 50000) + 10000,
        avgTokensPerQuery: Math.floor(Math.random() * 500) + 100,
        peakUsageHour: Math.floor(Math.random() * 24),
      },
      domains: profile.domains.map((domain) => ({
        domain,
        queries: Math.floor(Math.random() * 100) + 10,
        confidence: Math.random() * 0.3 + 0.7,
      })),
      trends: {
        queryGrowth: (Math.random() - 0.5) * 0.2, // -10% to +10%
        confidenceChange: (Math.random() - 0.5) * 0.1, // -5% to +5%
        usageChange: (Math.random() - 0.5) * 0.3, // -15% to +15%
      },
      lastUpdated: new Date(),
    };
  }

  // Missing method: generateRecommendations
  async generateRecommendations(profileId: string): Promise<any[]> {
    const profile = await this.getProfile(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    const recommendations: unknown[] = [];

    // Check confidence level
    const confidence = profile.confidence || profile.confidenceThreshold;
    if (confidence < 0.7) {
      recommendations.push({
        type: "performance",
        priority: "high",
        title: "Low Confidence Score",
        description: `Profile confidence is ${(confidence * 100).toFixed(1)}%. Consider reviewing and updating the knowledge base.`,
        action: "update_knowledge",
        impact: "high",
      });
    }

    // Check domain coverage
    if (profile.domains.length < 3) {
      recommendations.push({
        type: "coverage",
        priority: "medium",
        title: "Limited Domain Coverage",
        description: "Consider expanding to more domains to improve versatility.",
        action: "add_domains",
        impact: "medium",
      });
    }

    // Check freshness
    const daysSinceUpdate = Math.floor((Date.now() - profile.updatedAt.getTime()) / (24 * 60 * 60 * 1000));
    if (daysSinceUpdate > 30) {
      recommendations.push({
        type: "maintenance",
        priority: "medium",
        title: "Outdated Profile",
        description: `Profile hasn't been updated in ${daysSinceUpdate} days. Consider refreshing the content.`,
        action: "update_content",
        impact: "medium",
      });
    }

    // Check expertise areas
    const lowConfidenceExpertise = profile.expertise.filter((e) => e.confidence < 0.6);
    if (lowConfidenceExpertise.length > 0) {
      recommendations.push({
        type: "expertise",
        priority: "medium",
        title: "Low Expertise Confidence",
        description: `${lowConfidenceExpertise.length} expertise areas have low confidence. Consider additional training.`,
        action: "improve_expertise",
        impact: "medium",
        details: lowConfidenceExpertise.map((e) => e.domain),
      });
    }

    // Usage-based recommendations
    if (profile.usageCount && profile.usageCount > 1000) {
      recommendations.push({
        type: "optimization",
        priority: "low",
        title: "High Usage Profile",
        description: "This profile is heavily used. Consider performance optimization.",
        action: "optimize_performance",
        impact: "low",
      });
    }

    return recommendations;
  }
}

// Default instance
export const knowledgeProfileManager = new KnowledgeProfileManager();
export const getKnowledgeProfileManager = () => knowledgeProfileManager;

// Utility functions
export function createKnowledgeProfile(
  data: Omit<KnowledgeProfile, "id" | "createdAt" | "updatedAt">
): Promise<KnowledgeProfile> {
  return knowledgeProfileManager.createProfile(data);
}

export function findProfilesByDomain(domain: string): Promise<QueryResult[]> {
  return knowledgeProfileManager.queryProfiles({ query: "", domain });
}

export function searchProfiles(query: string, options?: Partial<KnowledgeQuery>): Promise<QueryResult[]> {
  return knowledgeProfileManager.queryProfiles({ query, ...options });
}
