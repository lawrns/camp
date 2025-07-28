/**
 * Realtime Monitor Compatibility
 *
 * Provides monitoring stubs for components importing from this path.
 *
 * @deprecated Monitoring is now simplified
 */

export class RealtimeMonitor {
  private static instance: RealtimeMonitor;

  static getInstance(): RealtimeMonitor {
    if (!this.instance) {
      this.instance = new RealtimeMonitor();
    }
    return this.instance;
  }

  recordEvent(event: string, data?: any): void {}

  recordMetric(metric: string, value: number): void {}

  getMetrics(): any {
    return {
      connectionsActive: 1,
      messagesProcessed: 0,
      errors: 0,
    };
  }
}

export default RealtimeMonitor.getInstance();
