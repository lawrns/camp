/**
 * Race Condition Monitoring and Detection System
 *
 * This module provides real-time monitoring and detection of race conditions
 * in the application, with detailed logging and alerting capabilities.
 */

import { EventEmitter } from "events";
import { useEffect, useState } from "react";

interface RaceConditionEvent {
  id: string;
  type: "mutex_contention" | "duplicate_request" | "out_of_order" | "state_conflict" | "version_mismatch";
  severity: "low" | "medium" | "high" | "critical";
  component: string;
  operation: string;
  details: Record<string, any>;
  timestamp: number;
  stackTrace?: string;
}

interface MonitoringMetrics {
  mutexContentions: number;
  duplicateRequests: number;
  outOfOrderEvents: number;
  stateConflicts: number;
  versionMismatches: number;
  totalEvents: number;
  criticalEvents: number;
  lastEventTime: number | null;
}

export class RaceConditionMonitor extends EventEmitter {
  private events: RaceConditionEvent[] = [];
  private metrics: MonitoringMetrics = {
    mutexContentions: 0,
    duplicateRequests: 0,
    outOfOrderEvents: 0,
    stateConflicts: 0,
    versionMismatches: 0,
    totalEvents: 0,
    criticalEvents: 0,
    lastEventTime: null,
  };
  private maxEventsToStore = 1000;
  private alertThresholds = {
    mutexContentions: 10,
    duplicateRequests: 20,
    outOfOrderEvents: 15,
    stateConflicts: 5,
    versionMismatches: 10,
  };
  private alertIntervalMs = 60000; // 1 minute
  private lastAlertTime = 0;
  private isMonitoring = true;

  constructor() {
    super();
    this.startPeriodicCheck();
  }

  /**
   * Log a mutex contention event
   */
  logMutexContention(component: string, operation: string, waitTime: number, queueLength: number) {
    if (!this.isMonitoring) return;

    const event: RaceConditionEvent = {
      id: this.generateEventId(),
      type: "mutex_contention",
      severity: this.calculateContentionSeverity(waitTime, queueLength),
      component,
      operation,
      details: {
        waitTime,
        queueLength,
      },
      timestamp: Date.now(),
      stackTrace: this.captureStackTrace(),
    };

    this.recordEvent(event);
  }

  /**
   * Log a duplicate request
   */
  logDuplicateRequest(component: string, operation: string, requestKey: string, count: number) {
    if (!this.isMonitoring) return;

    const event: RaceConditionEvent = {
      id: this.generateEventId(),
      type: "duplicate_request",
      severity: count > 5 ? "high" : count > 2 ? "medium" : "low",
      component,
      operation,
      details: {
        requestKey,
        duplicateCount: count,
      },
      timestamp: Date.now(),
    };

    this.recordEvent(event);
  }

  /**
   * Log an out-of-order event
   */
  logOutOfOrderEvent(
    component: string,
    operation: string,
    expectedOrder: number,
    actualOrder: number,
    eventId: string
  ) {
    if (!this.isMonitoring) return;

    const event: RaceConditionEvent = {
      id: this.generateEventId(),
      type: "out_of_order",
      severity: Math.abs(expectedOrder - actualOrder) > 10 ? "high" : "medium",
      component,
      operation,
      details: {
        expectedOrder,
        actualOrder,
        eventId,
        orderDifference: Math.abs(expectedOrder - actualOrder),
      },
      timestamp: Date.now(),
    };

    this.recordEvent(event);
  }

  /**
   * Log a state conflict
   */
  logStateConflict(
    component: string,
    operation: string,
    currentVersion: number,
    incomingVersion: number,
    entityId: string
  ) {
    if (!this.isMonitoring) return;

    const event: RaceConditionEvent = {
      id: this.generateEventId(),
      type: "state_conflict",
      severity: "high",
      component,
      operation,
      details: {
        currentVersion,
        incomingVersion,
        entityId,
        versionDiff: Math.abs(currentVersion - incomingVersion),
      },
      timestamp: Date.now(),
      stackTrace: this.captureStackTrace(),
    };

    this.recordEvent(event);
  }

  /**
   * Log a version mismatch
   */
  logVersionMismatch(component: string, operation: string, expected: number, actual: number, entityId: string) {
    if (!this.isMonitoring) return;

    const event: RaceConditionEvent = {
      id: this.generateEventId(),
      type: "version_mismatch",
      severity: Math.abs(expected - actual) > 5 ? "critical" : "high",
      component,
      operation,
      details: {
        expectedVersion: expected,
        actualVersion: actual,
        entityId,
        versionGap: Math.abs(expected - actual),
      },
      timestamp: Date.now(),
    };

    this.recordEvent(event);
  }

  /**
   * Get current metrics
   */
  getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent events
   */
  getRecentEvents(count: number = 100): RaceConditionEvent[] {
    return this.events.slice(-count);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: RaceConditionEvent["type"]): RaceConditionEvent[] {
    return this.events.filter((e: any) => e.type === type);
  }

  /**
   * Get critical events
   */
  getCriticalEvents(): RaceConditionEvent[] {
    return this.events.filter((e: any) => e.severity === "critical");
  }

  /**
   * Clear all events and reset metrics
   */
  reset() {
    this.events = [];
    this.metrics = {
      mutexContentions: 0,
      duplicateRequests: 0,
      outOfOrderEvents: 0,
      stateConflicts: 0,
      versionMismatches: 0,
      totalEvents: 0,
      criticalEvents: 0,
      lastEventTime: null,
    };
  }

  /**
   * Enable/disable monitoring
   */
  setMonitoring(enabled: boolean) {
    this.isMonitoring = enabled;
  }

  /**
   * Export events for analysis
   */
  exportEvents(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        events: this.events,
        exportTime: new Date().toISOString(),
      },
      null,
      2
    );
  }

  /**
   * Private methods
   */
  private recordEvent(event: RaceConditionEvent) {
    // Add to events array
    this.events.push(event);

    // Trim if too many events
    if (this.events.length > this.maxEventsToStore) {
      this.events = this.events.slice(-this.maxEventsToStore);
    }

    // Update metrics
    this.metrics.totalEvents++;
    this.metrics.lastEventTime = event.timestamp;

    switch (event.type) {
      case "mutex_contention":
        this.metrics.mutexContentions++;
        break;
      case "duplicate_request":
        this.metrics.duplicateRequests++;
        break;
      case "out_of_order":
        this.metrics.outOfOrderEvents++;
        break;
      case "state_conflict":
        this.metrics.stateConflicts++;
        break;
      case "version_mismatch":
        this.metrics.versionMismatches++;
        break;
    }

    if (event.severity === "critical") {
      this.metrics.criticalEvents++;
    }

    // Emit event
    this.emit("raceCondition", event);

    // Check if we should alert
    this.checkAlertThresholds();

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
    }
  }

  private checkAlertThresholds() {
    const now = Date.now();
    if (now - this.lastAlertTime < this.alertIntervalMs) {
      return; // Don't alert too frequently
    }

    const alerts: string[] = [];

    if (this.metrics.mutexContentions > this.alertThresholds.mutexContentions) {
      alerts.push(`High mutex contention: ${this.metrics.mutexContentions} events`);
    }

    if (this.metrics.duplicateRequests > this.alertThresholds.duplicateRequests) {
      alerts.push(`Many duplicate requests: ${this.metrics.duplicateRequests} events`);
    }

    if (this.metrics.outOfOrderEvents > this.alertThresholds.outOfOrderEvents) {
      alerts.push(`Out-of-order events detected: ${this.metrics.outOfOrderEvents} events`);
    }

    if (this.metrics.stateConflicts > this.alertThresholds.stateConflicts) {
      alerts.push(`State conflicts detected: ${this.metrics.stateConflicts} events`);
    }

    if (this.metrics.versionMismatches > this.alertThresholds.versionMismatches) {
      alerts.push(`Version mismatches: ${this.metrics.versionMismatches} events`);
    }

    if (alerts.length > 0) {
      this.lastAlertTime = now;
      this.emit("alert", {
        timestamp: now,
        alerts,
        metrics: this.getMetrics(),
      });
    }
  }

  private startPeriodicCheck() {
    setInterval(() => {
      // Emit periodic metrics
      this.emit("metrics", this.getMetrics());

      // Clean up old events (older than 1 hour)
      const oneHourAgo = Date.now() - 3600000;
      this.events = this.events.filter((e: any) => e.timestamp > oneHourAgo);
    }, 30000); // Every 30 seconds
  }

  private generateEventId(): string {
    return `race_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateContentionSeverity(waitTime: number, queueLength: number): RaceConditionEvent["severity"] {
    if (waitTime > 5000 || queueLength > 10) return "critical";
    if (waitTime > 2000 || queueLength > 5) return "high";
    if (waitTime > 500 || queueLength > 2) return "medium";
    return "low";
  }

  private captureStackTrace(): string {
    const stack = new Error().stack;
    return stack ? stack.split("\n").slice(3).join("\n") : "";
  }
}

// Global monitor instance
export const raceConditionMonitor = new RaceConditionMonitor();

// React hook for monitoring
export function useRaceConditionMonitor() {
  const [metrics, setMetrics] = useState<MonitoringMetrics>(raceConditionMonitor.getMetrics());
  const [recentEvents, setRecentEvents] = useState<RaceConditionEvent[]>([]);

  useEffect(() => {
    const handleMetrics = (newMetrics: MonitoringMetrics) => {
      setMetrics(newMetrics);
    };

    const handleRaceCondition = () => {
      setRecentEvents(raceConditionMonitor.getRecentEvents(10));
    };

    raceConditionMonitor.on("metrics", handleMetrics);
    raceConditionMonitor.on("raceCondition", handleRaceCondition);

    return () => {
      raceConditionMonitor.off("metrics", handleMetrics);
      raceConditionMonitor.off("raceCondition", handleRaceCondition);
    };
  }, []);

  return {
    metrics,
    recentEvents,
    criticalEvents: raceConditionMonitor.getCriticalEvents(),
    exportData: () => raceConditionMonitor.exportEvents(),
    reset: () => raceConditionMonitor.reset(),
  };
}
