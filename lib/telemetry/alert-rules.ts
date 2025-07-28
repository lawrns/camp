import { db } from "@/db/client";
import { notificationService } from "./notification-service";
import { realTimeMetricsService, type MetricAlert } from "./real-time-metrics";

export type AlertCondition =
  | "greater_than"
  | "less_than"
  | "equals"
  | "not_equals"
  | "greater_than_or_equal"
  | "less_than_or_equal";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertStatus = "active" | "acknowledged" | "resolved" | "silenced";

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
  notificationChannels: string[];
  cooldownMinutes: number;
  evaluationWindow: number; // in minutes
  consecutiveBreaches: number; // how many consecutive breaches before alerting
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface AlertInstance {
  id: string;
  ruleId: string;
  ruleName: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  value: number;
  threshold: number;
  condition: AlertCondition;
  metric: string;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  silencedUntil?: Date;
  silencedBy?: string;
  notificationsSent: string[];
  metadata?: Record<string, any>;
}

export interface AlertRuleEvaluation {
  ruleId: string;
  timestamp: Date;
  value: number;
  breached: boolean;
  consecutiveBreaches: number;
}

export class AlertRulesService {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, AlertInstance> = new Map();
  private evaluationHistory: Map<string, AlertRuleEvaluation[]> = new Map();
  private cooldownTracker: Map<string, Date> = new Map();

  constructor() {
    this.setupMetricListener();
    this.loadRulesFromDatabase();
  }

  private setupMetricListener() {
    realTimeMetricsService.on("metric", (metric) => {
      this.evaluateRulesForMetric(metric.name, metric.value, metric.timestamp);
    });
  }

  private async loadRulesFromDatabase() {
    // In a real implementation, this would load from the database
    // For now, we'll use some default rules
    const defaultRules: AlertRule[] = [
      {
        id: "rule-1",
        name: "High Response Time",
        description: "Alert when average response time exceeds 10 minutes",
        metric: "avg_response_time",
        condition: "greater_than",
        threshold: 10,
        severity: "high",
        enabled: true,
        notificationChannels: ["email-default", "slack-support"],
        cooldownMinutes: 30,
        evaluationWindow: 5,
        consecutiveBreaches: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "system",
      },
      {
        id: "rule-2",
        name: "Low Agent Utilization",
        description: "Alert when agent utilization drops below 50%",
        metric: "agent_utilization_rate",
        condition: "less_than",
        threshold: 50,
        severity: "medium",
        enabled: true,
        notificationChannels: ["email-default"],
        cooldownMinutes: 60,
        evaluationWindow: 10,
        consecutiveBreaches: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "system",
      },
      {
        id: "rule-3",
        name: "High Memory Usage",
        description: "Alert when memory usage exceeds 90%",
        metric: "memory_usage_percent",
        condition: "greater_than",
        threshold: 90,
        severity: "critical",
        enabled: true,
        notificationChannels: ["email-default", "slack-engineering"],
        cooldownMinutes: 15,
        evaluationWindow: 5,
        consecutiveBreaches: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "system",
      },
    ];

    defaultRules.forEach((rule: any) => {
      this.rules.set(rule.id, rule);
    });
  }

  private evaluateRulesForMetric(metricName: string, value: number, timestamp: Date) {
    // Find all rules that monitor this metric
    const relevantRules = Array.from(this.rules.values()).filter(
      (rule: any) => rule.metric === metricName && rule.enabled
    );

    for (const rule of relevantRules) {
      this.evaluateRule(rule, value, timestamp);
    }
  }

  private evaluateRule(rule: AlertRule, value: number, timestamp: Date) {
    // Check if rule is in cooldown
    const cooldownEnd = this.cooldownTracker.get(rule.id);
    if (cooldownEnd && timestamp < cooldownEnd) {
      return;
    }

    // Evaluate the condition
    const breached = this.evaluateCondition(rule.condition, value, rule.threshold);

    // Get evaluation history for this rule
    const history = this.evaluationHistory.get(rule.id) || [];

    // Add current evaluation
    const evaluation: AlertRuleEvaluation = {
      ruleId: rule.id,
      timestamp,
      value,
      breached,
      consecutiveBreaches: breached ? this.getConsecutiveBreaches(history) + 1 : 0,
    };

    // Update history (keep only last 100 evaluations)
    history.push(evaluation);
    if (history.length > 100) {
      history.shift();
    }
    this.evaluationHistory.set(rule.id, history);

    // Check if we should trigger an alert
    if (breached && evaluation.consecutiveBreaches >= rule.consecutiveBreaches) {
      this.triggerAlert(rule, value, timestamp);
    } else if (!breached) {
      // Auto-resolve alert if condition is no longer met
      this.autoResolveAlert(rule.id, timestamp);
    }
  }

  private evaluateCondition(condition: AlertCondition, value: number, threshold: number): boolean {
    switch (condition) {
      case "greater_than":
        return value > threshold;
      case "less_than":
        return value < threshold;
      case "equals":
        return value === threshold;
      case "not_equals":
        return value !== threshold;
      case "greater_than_or_equal":
        return value >= threshold;
      case "less_than_or_equal":
        return value <= threshold;
      default:
        return false;
    }
  }

  private getConsecutiveBreaches(history: AlertRuleEvaluation[]): number {
    let count = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i]?.breached) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  private async triggerAlert(rule: AlertRule, value: number, timestamp: Date) {
    // Check if there's already an active alert for this rule
    const existingAlert = Array.from(this.activeAlerts.values()).find(
      (alert) => alert.ruleId === rule.id && alert.status === "active"
    );

    if (existingAlert) {
      // Update existing alert with new value
      existingAlert.value = value;
      existingAlert.triggeredAt = timestamp;
      return;
    }

    // Create new alert
    const alert: AlertInstance = {
      id: `alert-${rule.id}-${timestamp.getTime()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      message: this.generateAlertMessage(rule, value),
      severity: rule.severity,
      status: "active",
      value,
      threshold: rule.threshold,
      condition: rule.condition,
      metric: rule.metric,
      triggeredAt: timestamp,
      notificationsSent: [],
    };

    this.activeAlerts.set(alert.id, alert);

    // Set cooldown
    const cooldownEnd = new Date(timestamp.getTime() + rule.cooldownMinutes * 60 * 1000);
    this.cooldownTracker.set(rule.id, cooldownEnd);

    // Send notifications
    await this.sendNotifications(alert, rule);

    // Emit alert event
    this.emitAlertEvent("alert.triggered", alert);
  }

  private autoResolveAlert(ruleId: string, timestamp: Date) {
    const activeAlert = Array.from(this.activeAlerts.values()).find(
      (alert) => alert.ruleId === ruleId && alert.status === "active"
    );

    if (activeAlert) {
      activeAlert.status = "resolved";
      activeAlert.resolvedAt = timestamp;
      activeAlert.resolvedBy = "system";

      this.emitAlertEvent("alert.resolved", activeAlert);
    }
  }

  private generateAlertMessage(rule: AlertRule, value: number): string {
    const conditionText = this.getConditionText(rule.condition);
    return `${rule.name}: ${rule.metric} ${conditionText} ${rule.threshold} (current: ${value})`;
  }

  private getConditionText(condition: AlertCondition): string {
    switch (condition) {
      case "greater_than":
        return "is greater than";
      case "less_than":
        return "is less than";
      case "equals":
        return "equals";
      case "not_equals":
        return "does not equal";
      case "greater_than_or_equal":
        return "is greater than or equal to";
      case "less_than_or_equal":
        return "is less than or equal to";
      default:
        return "meets condition";
    }
  }

  private async sendNotifications(alert: AlertInstance, rule: AlertRule) {
    for (const channelId of rule.notificationChannels) {
      try {
        await notificationService.sendAlert(channelId, alert);
        alert.notificationsSent.push(channelId);
      } catch (error) {}
    }
  }

  private emitAlertEvent(eventType: string, alert: AlertInstance) {
    // In a real implementation, this might emit to a WebSocket or event bus
  }

  // Public API methods
  async createRule(rule: Omit<AlertRule, "id" | "createdAt" | "updatedAt">): Promise<AlertRule> {
    const newRule: AlertRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.rules.set(newRule.id, newRule);

    // In a real implementation, save to database
    return newRule;
  }

  async updateRule(id: string, updates: Partial<AlertRule>): Promise<AlertRule | null> {
    const rule = this.rules.get(id);
    if (!rule) return null;

    const updatedRule = {
      ...rule,
      ...updates,
      updatedAt: new Date(),
    };

    this.rules.set(id, updatedRule);

    // In a real implementation, save to database
    return updatedRule;
  }

  async deleteRule(id: string): Promise<boolean> {
    const deleted = this.rules.delete(id);

    // Auto-resolve any active alerts for this rule
    const activeAlertsForRule = Array.from(this.activeAlerts.values()).filter(
      (alert) => alert.ruleId === id && alert.status === "active"
    );

    for (const alert of activeAlertsForRule) {
      alert.status = "resolved";
      alert.resolvedAt = new Date();
      alert.resolvedBy = "system";
    }

    return deleted;
  }

  getAllRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  getRule(id: string): AlertRule | undefined {
    return this.rules.get(id);
  }

  getActiveAlerts(): AlertInstance[] {
    return Array.from(this.activeAlerts.values()).filter(
      (alert) => alert.status === "active" || alert.status === "acknowledged"
    );
  }

  getAllAlerts(): AlertInstance[] {
    return Array.from(this.activeAlerts.values());
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert || alert.status !== "active") return false;

    alert.status = "acknowledged";
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    this.emitAlertEvent("alert.acknowledged", alert);
    return true;
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert || (alert.status !== "active" && alert.status !== "acknowledged")) return false;

    alert.status = "resolved";
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;

    this.emitAlertEvent("alert.resolved", alert);
    return true;
  }

  async silenceAlert(alertId: string, silenceUntil: Date, silencedBy: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.status = "silenced";
    alert.silencedUntil = silenceUntil;
    alert.silencedBy = silencedBy;

    this.emitAlertEvent("alert.silenced", alert);
    return true;
  }

  getEvaluationHistory(ruleId: string): AlertRuleEvaluation[] {
    return this.evaluationHistory.get(ruleId) || [];
  }
}

// Singleton instance
export const alertRulesService = new AlertRulesService();
