/**
 * Security Compliance Framework
 * Provides security compliance and incident management for AI systems
 */

export interface SecurityIncident {
  id: string;
  type: "data-breach" | "unauthorized-access" | "malicious-input" | "system-compromise" | "policy-violation";
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "mitigated" | "resolved" | "closed";
  description: string;
  timestamp: Date;
  affectedSystems: string[];
  reportedBy: string;
  assignedTo?: string;
  metadata?: Record<string, unknown>;
}

export interface ComplianceCheck {
  id: string;
  name: string;
  description: string;
  category: "data-protection" | "access-control" | "audit-logging" | "encryption" | "privacy";
  status: "pass" | "fail" | "warning" | "not-applicable";
  lastChecked: Date;
  details?: string;
}

export interface SecurityFramework {
  name: string;
  version: string;
  standards: string[]; // e.g., ['SOC2', 'GDPR', 'HIPAA']
  checks: ComplianceCheck[];
  lastAudit: Date;
  nextAudit: Date;
  complianceScore: number; // 0-100
}

export class SecurityComplianceFramework {
  private incidents: Map<string, SecurityIncident> = new Map();
  private frameworks: Map<string, SecurityFramework> = new Map();

  constructor() {
    this.initializeDefaultFramework();
  }

  private initializeDefaultFramework(): void {
    const defaultFramework: SecurityFramework = {
      name: "AI Security Framework",
      version: "1.0.0",
      standards: ["SOC2", "GDPR", "ISO27001"],
      checks: [
        {
          id: "data-encryption",
          name: "Data Encryption at Rest",
          description: "Verify all sensitive data is encrypted at rest",
          category: "encryption",
          status: "pass",
          lastChecked: new Date(),
        },
        {
          id: "access-control",
          name: "Role-Based Access Control",
          description: "Verify proper RBAC implementation",
          category: "access-control",
          status: "pass",
          lastChecked: new Date(),
        },
      ],
      lastAudit: new Date(),
      nextAudit: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      complianceScore: 95,
    };

    this.frameworks.set("default", defaultFramework);
  }

  async reportIncident(incident: Omit<SecurityIncident, "id" | "timestamp">): Promise<SecurityIncident> {
    const newIncident: SecurityIncident = {
      ...incident,
      id: `incident-${Date.now()}`,
      timestamp: new Date(),
    };

    this.incidents.set(newIncident.id, newIncident);
    return newIncident;
  }

  async getIncidents(filters?: {
    type?: SecurityIncident["type"];
    severity?: SecurityIncident["severity"];
    status?: SecurityIncident["status"];
  }): Promise<SecurityIncident[]> {
    let incidents = Array.from(this.incidents.values());

    if (filters) {
      if (filters.type) {
        incidents = incidents.filter((i: unknown) => i.type === filters.type);
      }
      if (filters.severity) {
        incidents = incidents.filter((i: unknown) => i.severity === filters.severity);
      }
      if (filters.status) {
        incidents = incidents.filter((i: unknown) => i.status === filters.status);
      }
    }

    return incidents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async updateIncident(id: string, updates: Partial<SecurityIncident>): Promise<SecurityIncident | null> {
    const existing = this.incidents.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    this.incidents.set(id, updated);
    return updated;
  }

  async runComplianceCheck(frameworkName = "default"): Promise<ComplianceCheck[]> {
    const framework = this.frameworks.get(frameworkName);
    if (!framework) throw new Error("Framework not found");

    // Simulate compliance checks
    const checks = framework.checks.map((check: unknown) => ({
      ...check,
      lastChecked: new Date(),
      status: Math.random() > 0.1 ? "pass" : ("warning" as const),
    }));

    // Update framework
    framework.checks = checks;
    framework.complianceScore = (checks.filter((c: unknown) => c.status === "pass").length / checks.length) * 100;
    this.frameworks.set(frameworkName, framework);

    return checks;
  }

  async getComplianceScore(frameworkName = "default"): Promise<number> {
    const framework = this.frameworks.get(frameworkName);
    return framework?.complianceScore || 0;
  }

  async generateSecurityReport(): Promise<{
    summary: {
      totalIncidents: number;
      openIncidents: number;
      criticalIncidents: number;
      complianceScore: number;
    };
    incidents: SecurityIncident[];
    compliance: ComplianceCheck[];
  }> {
    const incidents = Array.from(this.incidents.values());
    const framework = this.frameworks.get("default")!;

    return {
      summary: {
        totalIncidents: incidents.length,
        openIncidents: incidents.filter((i: unknown) => i.status === "open").length,
        criticalIncidents: incidents.filter((i: unknown) => i.severity === "critical").length,
        complianceScore: framework.complianceScore,
      },
      incidents: incidents.slice(0, 10), // Latest 10
      compliance: framework.checks,
    };
  }
}

// Default instance
export const securityFramework = new SecurityComplianceFramework();

// Utility functions
export function reportSecurityIncident(
  incident: Omit<SecurityIncident, "id" | "timestamp">
): Promise<SecurityIncident> {
  return securityFramework.reportIncident(incident);
}

export function getSecurityIncidents(
  filters?: Parameters<SecurityComplianceFramework["getIncidents"]>[0]
): Promise<SecurityIncident[]> {
  return securityFramework.getIncidents(filters);
}

export function runSecurityAudit(): Promise<ComplianceCheck[]> {
  return securityFramework.runComplianceCheck();
}
