/**
 * Widget Debug Utilities
 * 
 * Comprehensive debugging and diagnostics for the unified authentication widget system
 */

export interface DebugLogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: any;
}

export interface WidgetDebugState {
  authStatus: 'loading' | 'authenticated' | 'failed' | 'disconnected';
  supabaseClientStatus: 'initializing' | 'connected' | 'error';
  websocketStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  organizationId?: string;
  conversationId?: string;
  lastMessageSent?: Date;
  lastMessageReceived?: Date;
  lastError?: {
    message: string;
    timestamp: Date;
    category: string;
  };
  sessionToken?: string;
  logs: DebugLogEntry[];
}

class WidgetDebugger {
  private state: WidgetDebugState = {
    authStatus: 'loading',
    supabaseClientStatus: 'initializing',
    websocketStatus: 'disconnected',
    logs: [],
  };

  private listeners: ((state: WidgetDebugState) => void)[] = [];
  private maxLogs = 100;

  // Subscribe to debug state changes
  subscribe(listener: (state: WidgetDebugState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Get current debug state
  getState(): WidgetDebugState {
    return { ...this.state };
  }

  // Update debug state
  private updateState(updates: Partial<WidgetDebugState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  // Add log entry
  private addLog(entry: DebugLogEntry) {
    const logs = [...this.state.logs, entry];
    if (logs.length > this.maxLogs) {
      logs.shift(); // Remove oldest log
    }
    this.updateState({ logs });
  }

  // Generic log method
  private log(level: DebugLogEntry['level'], category: string, message: string, data?: any) {
    const entry: DebugLogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
    };

    this.addLog(entry);

    // Console output with prefixed tags
    const prefix = `[Widget ${category}]`;
    const timestamp = entry.timestamp.toISOString().split('T')[1].split('.')[0];
    const logMessage = `${prefix} ${timestamp} - ${message}`;

    switch (level) {
      case 'error':
        console.error(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'debug':
        console.debug(logMessage, data);
        break;
      default:
        console.log(logMessage, data);
    }

    // Update last error if this is an error
    if (level === 'error') {
      this.updateState({
        lastError: {
          message,
          timestamp: entry.timestamp,
          category,
        },
      });
    }
  }

  // Authentication logging
  logAuth(level: DebugLogEntry['level'], message: string, data?: any) {
    this.log(level, 'Auth', message, data);
  }

  updateAuthStatus(status: WidgetDebugState['authStatus'], sessionToken?: string) {
    this.updateState({ authStatus: status, sessionToken });
    this.logAuth('info', `Authentication status changed to: ${status}`, { sessionToken: sessionToken ? 'present' : 'none' });
  }

  // Supabase client logging
  logSupabase(level: DebugLogEntry['level'], message: string, data?: any) {
    this.log(level, 'Supabase', message, data);
  }

  updateSupabaseStatus(status: WidgetDebugState['supabaseClientStatus']) {
    this.updateState({ supabaseClientStatus: status });
    this.logSupabase('info', `Supabase client status changed to: ${status}`);
  }

  // WebSocket/Realtime logging
  logRealtime(level: DebugLogEntry['level'], message: string, data?: any) {
    this.log(level, 'Realtime', message, data);
  }

  updateWebSocketStatus(status: WidgetDebugState['websocketStatus']) {
    this.updateState({ websocketStatus: status });
    this.logRealtime('info', `WebSocket status changed to: ${status}`);
  }

  // Message logging
  logMessage(level: DebugLogEntry['level'], message: string, data?: any) {
    this.log(level, 'Messages', message, data);
  }

  updateMessageSent() {
    this.updateState({ lastMessageSent: new Date() });
    this.logMessage('info', 'Message sent successfully');
  }

  updateMessageReceived() {
    this.updateState({ lastMessageReceived: new Date() });
    this.logMessage('info', 'Message received successfully');
  }

  // Read receipts logging
  logReadReceipts(level: DebugLogEntry['level'], message: string, data?: any) {
    this.log(level, 'ReadReceipts', message, data);
  }

  // Error logging
  logError(message: string, error?: any, category: string = 'Error') {
    this.log('error', category, message, error);
  }

  // Network request logging
  logNetworkRequest(url: string, method: string, headers?: Record<string, string>, data?: any) {
    this.log('debug', 'Network', `${method} ${url}`, { headers, data });
  }

  logNetworkResponse(url: string, status: number, data?: any, error?: any) {
    const level = status >= 400 ? 'error' : 'info';
    this.log(level, 'Network', `Response ${status} from ${url}`, { data, error });
  }

  // Organization and conversation tracking
  updateOrganizationId(organizationId: string) {
    this.updateState({ organizationId });
    this.logAuth('info', `Organization ID set: ${organizationId}`);
  }

  updateConversationId(conversationId: string) {
    this.updateState({ conversationId });
    this.logAuth('info', `Conversation ID set: ${conversationId}`);
  }

  // Clear logs
  clearLogs() {
    this.updateState({ logs: [] });
    this.log('info', 'Debug', 'Logs cleared');
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.state.logs, null, 2);
  }

  // Get formatted status summary
  getStatusSummary(): string {
    const { authStatus, supabaseClientStatus, websocketStatus, organizationId, conversationId, lastError } = this.state;
    
    return `
Widget Debug Status:
- Auth: ${authStatus}
- Supabase: ${supabaseClientStatus}
- WebSocket: ${websocketStatus}
- Org ID: ${organizationId || 'not set'}
- Conv ID: ${conversationId || 'not set'}
- Last Error: ${lastError ? `${lastError.message} (${lastError.timestamp.toISOString()})` : 'none'}
    `.trim();
  }
}

// Global widget debugger instance
export const widgetDebugger = new WidgetDebugger();

// Utility function to format timestamps
export function formatTimestamp(date: Date): string {
  return date.toISOString().split('T')[1].split('.')[0];
}

// Utility function to get debug level color
export function getDebugLevelColor(level: DebugLogEntry['level']): string {
  switch (level) {
    case 'error': return '#ef4444';
    case 'warn': return '#f59e0b';
    case 'debug': return '#6b7280';
    default: return '#3b82f6';
  }
}
