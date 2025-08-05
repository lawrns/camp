/**
 * Comprehensive Supabase Mocking Utilities
 * 
 * Provides complete mocking for:
 * - Supabase client and database operations
 * - Realtime subscriptions and channels
 * - Authentication flows and sessions
 * - RLS policy testing
 * - Edge cases and offline modes
 * - Storage operations
 * - Error scenarios
 */

import { vi, Mock } from 'vitest';
import type { 
  SupabaseClient, 
  RealtimeChannel, 
  User, 
  Session,
  AuthResponse,
  PostgrestResponse,
  PostgrestSingleResponse,
} from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

interface MockSupabaseConfig {
  user?: Partial<User>;
  session?: Partial<Session>;
  isConnected?: boolean;
  latency?: number;
  errorRate?: number;
  offlineMode?: boolean;
}

interface MockRealtimeConfig {
  autoConnect?: boolean;
  latency?: number;
  dropRate?: number;
  maxReconnectAttempts?: number;
}

interface MockDatabaseConfig {
  data?: Record<string, any[]>;
  rlsPolicies?: Record<string, (row: any, user?: User) => boolean>;
  latency?: number;
  errorRate?: number;
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

export function generateMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'mock-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function generateMockSession(user?: User): Session {
  const mockUser = user || generateMockUser();
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: mockUser,
  };
}

export function generateMockMessage(overrides: any = {}) {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    conversation_id: 'conv_123',
    organization_id: 'org_123',
    content: 'Test message',
    sender_type: 'visitor',
    sender_id: 'user_123',
    sender_name: 'Test User',
    sender_email: 'test@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function generateMockConversation(overrides: any = {}) {
  return {
    id: `conv_${Date.now()}`,
    organization_id: 'org_123',
    customer_name: 'Test Customer',
    customer_email: 'customer@example.com',
    status: 'open',
    priority: 'medium',
    assigned_to_user_id: null,
    ai_handover_active: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_message_at: new Date().toISOString(),
    closed_at: null,
    ...overrides,
  };
}

// ============================================================================
// MOCK REALTIME CHANNEL
// ============================================================================

export class MockRealtimeChannel {
  private config: MockRealtimeConfig;
  private subscriptions: Map<string, Function[]> = new Map();
  private isSubscribed = false;
  private presenceState: Record<string, any> = {};

  constructor(
    public channelName: string,
    config: MockRealtimeConfig = {}
  ) {
    this.config = {
      autoConnect: true,
      latency: 50,
      dropRate: 0,
      maxReconnectAttempts: 3,
      ...config,
    };
  }

  subscribe(callback?: (status: string) => void): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isSubscribed = true;
        const status = 'SUBSCRIBED';
        callback?.(status);
        resolve(status);
      }, this.config.latency);
    });
  }

  unsubscribe(): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isSubscribed = false;
        this.subscriptions.clear();
        resolve('UNSUBSCRIBED');
      }, this.config.latency! / 2);
    });
  }

  on(event: string, filter: any, callback: Function): this {
    const key = `${event}:${JSON.stringify(filter)}`;
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, []);
    }
    this.subscriptions.get(key)!.push(callback);
    return this;
  }

  send(payload: any): Promise<string> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < this.config.dropRate!) {
          reject(new Error('Message dropped'));
          return;
        }

        // Simulate broadcasting to subscribers
        const eventKey = `broadcast:${JSON.stringify({ event: payload.event })}`;
        const subscribers = this.subscriptions.get(eventKey) || [];
        subscribers.forEach(callback => {
          try {
            callback({ payload: payload.payload });
          } catch (error) {
            console.error('Mock channel callback error:', error);
          }
        });

        resolve('ok');
      }, this.config.latency);
    });
  }

  track(presence: any): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.presenceState[presence.userId || 'anonymous'] = presence;
        
        // Trigger presence sync
        const presenceSubscribers = this.subscriptions.get('presence:{}') || [];
        presenceSubscribers.forEach(callback => {
          try {
            callback({ event: 'sync' });
          } catch (error) {
            console.error('Mock presence callback error:', error);
          }
        });

        resolve('ok');
      }, this.config.latency);
    });
  }

  presenceState(): Record<string, any> {
    return this.presenceState;
  }

  // Test utilities
  simulateMessage(event: string, payload: any) {
    const eventKey = `broadcast:${JSON.stringify({ event })}`;
    const subscribers = this.subscriptions.get(eventKey) || [];
    subscribers.forEach(callback => callback({ payload }));
  }

  simulatePresenceJoin(userId: string, presence: any) {
    this.presenceState[userId] = presence;
    const subscribers = this.subscriptions.get('presence:{}') || [];
    subscribers.forEach(callback => callback({ event: 'join', key: userId, newPresences: [presence] }));
  }

  simulatePresenceLeave(userId: string) {
    const leftPresence = this.presenceState[userId];
    delete this.presenceState[userId];
    const subscribers = this.subscriptions.get('presence:{}') || [];
    subscribers.forEach(callback => callback({ event: 'leave', key: userId, leftPresences: [leftPresence] }));
  }

  simulateDisconnection() {
    this.isSubscribed = false;
    // Trigger reconnection after delay
    setTimeout(() => {
      if (this.config.autoConnect) {
        this.isSubscribed = true;
      }
    }, 1000);
  }
}

// ============================================================================
// MOCK DATABASE OPERATIONS
// ============================================================================

export class MockSupabaseDatabase {
  private config: MockDatabaseConfig;
  private data: Record<string, any[]>;
  private rlsPolicies: Record<string, (row: any, user?: User) => boolean>;

  constructor(config: MockDatabaseConfig = {}) {
    this.config = {
      latency: 100,
      errorRate: 0,
      ...config,
    };
    
    this.data = config.data || {
      messages: [],
      conversations: [],
      users: [],
      organizations: [],
      typing_indicators: [],
    };
    
    this.rlsPolicies = config.rlsPolicies || {};
  }

  from(table: string) {
    return {
      select: (columns = '*') => this.createQuery(table, 'select', { columns }),
      insert: (data: any) => this.createQuery(table, 'insert', { data }),
      update: (data: any) => this.createQuery(table, 'update', { data }),
      delete: () => this.createQuery(table, 'delete'),
      upsert: (data: any) => this.createQuery(table, 'upsert', { data }),
    };
  }

  rpc(functionName: string, params: any = {}) {
    return this.createQuery('rpc', 'call', { functionName, params });
  }

  private createQuery(table: string, operation: string, options: any = {}) {
    const query = {
      table,
      operation,
      options,
      filters: [] as any[],
      
      // Filter methods
      eq: (column: string, value: any) => {
        query.filters.push({ type: 'eq', column, value });
        return query;
      },
      
      neq: (column: string, value: any) => {
        query.filters.push({ type: 'neq', column, value });
        return query;
      },
      
      in: (column: string, values: any[]) => {
        query.filters.push({ type: 'in', column, values });
        return query;
      },
      
      gte: (column: string, value: any) => {
        query.filters.push({ type: 'gte', column, value });
        return query;
      },
      
      lte: (column: string, value: any) => {
        query.filters.push({ type: 'lte', column, value });
        return query;
      },
      
      like: (column: string, pattern: string) => {
        query.filters.push({ type: 'like', column, pattern });
        return query;
      },
      
      order: (column: string, options: any = {}) => {
        query.orderBy = { column, ...options };
        return query;
      },
      
      limit: (count: number) => {
        query.limitCount = count;
        return query;
      },
      
      range: (from: number, to: number) => {
        query.rangeFrom = from;
        query.rangeTo = to;
        return query;
      },
      
      single: () => {
        query.single = true;
        return query;
      },
      
      // Execute query
      then: (resolve: Function, reject?: Function) => {
        return this.executeQuery(query).then(resolve, reject);
      },
    };
    
    return query;
  }

  private async executeQuery(query: any): Promise<PostgrestResponse<any> | PostgrestSingleResponse<any>> {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, this.config.latency));
    
    // Simulate random errors
    if (Math.random() < this.config.errorRate!) {
      throw new Error('Mock database error');
    }

    try {
      let result: any[] = [];
      
      if (query.operation === 'select') {
        result = this.executeSelect(query);
      } else if (query.operation === 'insert') {
        result = this.executeInsert(query);
      } else if (query.operation === 'update') {
        result = this.executeUpdate(query);
      } else if (query.operation === 'delete') {
        result = this.executeDelete(query);
      } else if (query.operation === 'upsert') {
        result = this.executeUpsert(query);
      } else if (query.operation === 'call') {
        result = this.executeRpc(query);
      }

      // Apply RLS policies
      result = this.applyRlsPolicies(query.table, result);

      // Apply ordering
      if (query.orderBy) {
        result = this.applyOrdering(result, query.orderBy);
      }

      // Apply limit and range
      if (query.limitCount) {
        result = result.slice(0, query.limitCount);
      } else if (query.rangeFrom !== undefined && query.rangeTo !== undefined) {
        result = result.slice(query.rangeFrom, query.rangeTo + 1);
      }

      const response = {
        data: query.single ? (result[0] || null) : result,
        error: null,
        count: result.length,
        status: 200,
        statusText: 'OK',
      };

      return response as any;
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          details: '',
          hint: '',
          code: '500',
        },
        count: 0,
        status: 500,
        statusText: 'Internal Server Error',
      } as any;
    }
  }

  private executeSelect(query: any): any[] {
    const tableData = this.data[query.table] || [];
    return this.applyFilters(tableData, query.filters);
  }

  private executeInsert(query: any): any[] {
    const tableData = this.data[query.table] || [];
    const newRecords = Array.isArray(query.options.data) ? query.options.data : [query.options.data];
    
    newRecords.forEach(record => {
      const newRecord = {
        ...record,
        id: record.id || `${query.table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: record.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      tableData.push(newRecord);
    });
    
    this.data[query.table] = tableData;
    return newRecords;
  }

  private executeUpdate(query: any): any[] {
    const tableData = this.data[query.table] || [];
    const matchingRecords = this.applyFilters(tableData, query.filters);
    
    matchingRecords.forEach(record => {
      Object.assign(record, {
        ...query.options.data,
        updated_at: new Date().toISOString(),
      });
    });
    
    return matchingRecords;
  }

  private executeDelete(query: any): any[] {
    const tableData = this.data[query.table] || [];
    const matchingRecords = this.applyFilters(tableData, query.filters);
    
    this.data[query.table] = tableData.filter(record => 
      !matchingRecords.includes(record)
    );
    
    return matchingRecords;
  }

  private executeUpsert(query: any): any[] {
    // Simple upsert implementation
    const records = Array.isArray(query.options.data) ? query.options.data : [query.options.data];
    const results: any[] = [];
    
    records.forEach(record => {
      const existing = this.data[query.table]?.find(r => r.id === record.id);
      if (existing) {
        Object.assign(existing, { ...record, updated_at: new Date().toISOString() });
        results.push(existing);
      } else {
        const newRecord = {
          ...record,
          id: record.id || `${query.table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: record.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.data[query.table] = this.data[query.table] || [];
        this.data[query.table].push(newRecord);
        results.push(newRecord);
      }
    });
    
    return results;
  }

  private executeRpc(query: any): any[] {
    // Mock RPC functions
    const { functionName, params } = query.options;
    
    switch (functionName) {
      case 'cleanup_old_typing_indicators':
        const cutoff = new Date(Date.now() - 30000).toISOString();
        this.data.typing_indicators = this.data.typing_indicators?.filter(
          indicator => indicator.last_activity > cutoff
        ) || [];
        return [];
        
      case 'batch_insert_messages':
        const messages = params.message_batch || [];
        messages.forEach((msg: any) => {
          this.data.messages = this.data.messages || [];
          this.data.messages.push(msg);
        });
        return messages;
        
      default:
        return [];
    }
  }

  private applyFilters(data: any[], filters: any[]): any[] {
    return data.filter(record => {
      return filters.every(filter => {
        const value = record[filter.column];
        
        switch (filter.type) {
          case 'eq':
            return value === filter.value;
          case 'neq':
            return value !== filter.value;
          case 'in':
            return filter.values.includes(value);
          case 'gte':
            return value >= filter.value;
          case 'lte':
            return value <= filter.value;
          case 'like':
            return typeof value === 'string' && 
                   value.toLowerCase().includes(filter.pattern.toLowerCase().replace('%', ''));
          default:
            return true;
        }
      });
    });
  }

  private applyRlsPolicies(table: string, data: any[]): any[] {
    const policy = this.rlsPolicies[table];
    if (!policy) return data;
    
    // In a real implementation, you'd pass the current user
    return data.filter(row => policy(row));
  }

  private applyOrdering(data: any[], orderBy: any): any[] {
    return [...data].sort((a, b) => {
      const aVal = a[orderBy.column];
      const bVal = b[orderBy.column];
      
      if (aVal < bVal) return orderBy.ascending === false ? 1 : -1;
      if (aVal > bVal) return orderBy.ascending === false ? -1 : 1;
      return 0;
    });
  }

  // Test utilities
  addData(table: string, records: any[]) {
    this.data[table] = this.data[table] || [];
    this.data[table].push(...records);
  }

  clearData(table?: string) {
    if (table) {
      this.data[table] = [];
    } else {
      Object.keys(this.data).forEach(key => {
        this.data[key] = [];
      });
    }
  }

  getData(table: string): any[] {
    return this.data[table] || [];
  }

  setRlsPolicy(table: string, policy: (row: any, user?: User) => boolean) {
    this.rlsPolicies[table] = policy;
  }
}

// ============================================================================
// MOCK SUPABASE CLIENT
// ============================================================================

export function createMockSupabaseClient(config: MockSupabaseConfig = {}): SupabaseClient {
  const mockDatabase = new MockSupabaseDatabase();
  const channels = new Map<string, MockRealtimeChannel>();
  
  const mockUser = config.user ? generateMockUser(config.user) : null;
  const mockSession = mockUser ? generateMockSession(mockUser) : null;

  const mockClient = {
    // Database operations
    from: (table: string) => mockDatabase.from(table),
    rpc: (fn: string, params?: any) => mockDatabase.rpc(fn, params),
    
    // Authentication
    auth: {
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      }),
      getSession: vi.fn().mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as AuthResponse),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      refreshSession: vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      }),
    },
    
    // Realtime
    channel: (name: string, options?: any) => {
      if (!channels.has(name)) {
        channels.set(name, new MockRealtimeChannel(name));
      }
      return channels.get(name)!;
    },
    
    removeChannel: vi.fn().mockImplementation((channel: MockRealtimeChannel) => {
      channels.delete(channel.channelName);
      return Promise.resolve('ok');
    }),
    
    removeAllChannels: vi.fn().mockImplementation(() => {
      channels.clear();
      return Promise.resolve('ok');
    }),
    
    // Storage (basic mock)
    storage: {
      from: (bucket: string) => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: vi.fn().mockResolvedValue({ data: [], error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ 
          data: { publicUrl: 'https://mock-url.com/file' } 
        }),
      }),
    },
    
    // Test utilities
    _mockDatabase: mockDatabase,
    _mockChannels: channels,
    _setUser: (user: User | null) => {
      mockClient.auth.getUser.mockResolvedValue({ 
        data: { user }, 
        error: null 
      });
    },
    _setOffline: (offline: boolean) => {
      if (offline) {
        // Simulate network errors
        mockDatabase.config.errorRate = 1;
        channels.forEach(channel => {
          channel.simulateDisconnection();
        });
      } else {
        mockDatabase.config.errorRate = 0;
      }
    },
  } as any;

  return mockClient;
}

// ============================================================================
// EXPORTS
// ============================================================================

// ============================================================================
// RLS POLICY TESTING UTILITIES
// ============================================================================

export class RlsPolicyTester {
  private mockDatabase: MockSupabaseDatabase;
  private currentUser: User | null = null;

  constructor(mockDatabase: MockSupabaseDatabase) {
    this.mockDatabase = mockDatabase;
  }

  setCurrentUser(user: User | null) {
    this.currentUser = user;
  }

  testPolicy(
    table: string,
    policy: (row: any, user?: User) => boolean,
    testCases: Array<{ row: any; expected: boolean; description: string }>
  ) {
    const results = testCases.map(testCase => {
      const result = policy(testCase.row, this.currentUser || undefined);
      return {
        ...testCase,
        actual: result,
        passed: result === testCase.expected,
      };
    });

    const failedTests = results.filter(r => !r.passed);

    if (failedTests.length > 0) {
      console.error(`RLS Policy test failures for table ${table}:`);
      failedTests.forEach(test => {
        console.error(`  - ${test.description}: expected ${test.expected}, got ${test.actual}`);
      });
    }

    return {
      passed: failedTests.length === 0,
      results,
      failureCount: failedTests.length,
      totalCount: results.length,
    };
  }

  // Common RLS policies for testing
  static organizationMemberPolicy(row: any, user?: User): boolean {
    if (!user) return false;
    // Simulate checking if user is member of organization
    return row.organization_id === user.user_metadata?.organization_id;
  }

  static ownerOnlyPolicy(row: any, user?: User): boolean {
    if (!user) return false;
    return row.user_id === user.id || row.created_by === user.id;
  }

  static publicReadPolicy(row: any, user?: User): boolean {
    return true; // Public read access
  }

  static authenticatedOnlyPolicy(row: any, user?: User): boolean {
    return !!user;
  }
}

// ============================================================================
// OFFLINE MODE TESTING
// ============================================================================

export class OfflineModeTester {
  private mockClient: SupabaseClient;
  private originalMethods: Map<string, Function> = new Map();

  constructor(mockClient: SupabaseClient) {
    this.mockClient = mockClient;
  }

  enableOfflineMode() {
    // Store original methods
    this.originalMethods.set('from', this.mockClient.from);
    this.originalMethods.set('rpc', this.mockClient.rpc);

    // Replace with offline versions
    this.mockClient.from = this.createOfflineFrom();
    this.mockClient.rpc = this.createOfflineRpc();

    // Disable realtime
    (this.mockClient as any)._setOffline?.(true);
  }

  disableOfflineMode() {
    // Restore original methods
    if (this.originalMethods.has('from')) {
      this.mockClient.from = this.originalMethods.get('from')!;
    }
    if (this.originalMethods.has('rpc')) {
      this.mockClient.rpc = this.originalMethods.get('rpc')!;
    }

    // Re-enable realtime
    (this.mockClient as any)._setOffline?.(false);
  }

  private createOfflineFrom() {
    return (table: string) => ({
      select: () => this.createOfflineQuery('Network unavailable'),
      insert: () => this.createOfflineQuery('Cannot insert while offline'),
      update: () => this.createOfflineQuery('Cannot update while offline'),
      delete: () => this.createOfflineQuery('Cannot delete while offline'),
      upsert: () => this.createOfflineQuery('Cannot upsert while offline'),
    });
  }

  private createOfflineRpc() {
    return (functionName: string, params?: any) =>
      this.createOfflineQuery('RPC calls unavailable offline');
  }

  private createOfflineQuery(errorMessage: string) {
    return {
      eq: () => this.createOfflineQuery(errorMessage),
      neq: () => this.createOfflineQuery(errorMessage),
      in: () => this.createOfflineQuery(errorMessage),
      gte: () => this.createOfflineQuery(errorMessage),
      lte: () => this.createOfflineQuery(errorMessage),
      like: () => this.createOfflineQuery(errorMessage),
      order: () => this.createOfflineQuery(errorMessage),
      limit: () => this.createOfflineQuery(errorMessage),
      range: () => this.createOfflineQuery(errorMessage),
      single: () => this.createOfflineQuery(errorMessage),
      then: (resolve: Function, reject?: Function) => {
        const error = {
          message: errorMessage,
          details: 'Device is offline',
          hint: 'Check network connection',
          code: 'NETWORK_ERROR',
        };

        if (reject) {
          reject(error);
        } else {
          resolve({
            data: null,
            error,
            count: 0,
            status: 0,
            statusText: 'Network Error',
          });
        }
      },
    };
  }
}

// ============================================================================
// EDGE CASE TESTING UTILITIES
// ============================================================================

export class EdgeCaseTester {
  static async testConcurrentOperations(
    mockClient: SupabaseClient,
    operations: Array<() => Promise<any>>
  ) {
    const results = await Promise.allSettled(operations.map(op => op()));

    return {
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results,
    };
  }

  static async testRateLimiting(
    mockClient: SupabaseClient,
    operation: () => Promise<any>,
    requestCount: number = 100
  ) {
    const startTime = Date.now();
    const operations = Array(requestCount).fill(null).map(() => operation());

    const results = await Promise.allSettled(operations);
    const endTime = Date.now();

    return {
      duration: endTime - startTime,
      requestsPerSecond: requestCount / ((endTime - startTime) / 1000),
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
    };
  }

  static async testLargeDatasets(
    mockDatabase: MockSupabaseDatabase,
    table: string,
    recordCount: number = 10000
  ) {
    // Generate large dataset
    const records = Array(recordCount).fill(null).map((_, i) => ({
      id: `record_${i}`,
      name: `Record ${i}`,
      value: Math.random() * 1000,
      created_at: new Date().toISOString(),
    }));

    mockDatabase.addData(table, records);

    // Test query performance
    const startTime = Date.now();
    const result = await mockDatabase.from(table).select().limit(100);
    const queryTime = Date.now() - startTime;

    return {
      recordCount,
      queryTime,
      resultCount: result.data?.length || 0,
      performanceScore: queryTime < 100 ? 'good' : queryTime < 500 ? 'fair' : 'poor',
    };
  }
}

export default {
  createMockSupabaseClient,
  MockRealtimeChannel,
  MockSupabaseDatabase,
  generateMockUser,
  generateMockSession,
  generateMockMessage,
  generateMockConversation,
  RlsPolicyTester,
  OfflineModeTester,
  EdgeCaseTester,
};
