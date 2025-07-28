/**
 * Customer Type Definitions
 * Comprehensive type definitions for customer data and interactions
 */

export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;

  // Profile information
  company?: string;
  title?: string;
  timezone?: string;
  language?: string;

  // Metadata
  metadata?: Record<string, any>;
  tags?: string[];

  // Preferences
  preferences?: CustomerPreferences;

  // Activity tracking
  last_seen?: string;
  first_contact?: string;
  total_conversations?: number;
  total_messages?: number;
  conversationCount?: number;
  averageResponseTime?: number;

  // Value metrics
  customer_value?: CustomerValue;

  // Verification status
  verification?: CustomerVerification;
}

export interface CustomerPreferences {
  communication_channel?: "email" | "chat" | "phone" | "sms";
  notification_settings?: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
  };
  language?: string;
  timezone?: string;
  availability?: {
    preferred_hours?: string;
    blackout_periods?: string[];
  };
}

export interface CustomerValue {
  lifetime_value?: number;
  monthly_value?: number;
  tier?: "bronze" | "silver" | "gold" | "platinum";
  subscription_status?: "active" | "trial" | "cancelled" | "expired";
  plan_type?: string;
  billing_cycle?: "monthly" | "yearly";
  payment_method?: string;
}

export interface CustomerVerification {
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  verification_date?: string;
  verification_method?: string;
}

export interface CustomerActivity {
  id: string;
  customer_id: string;
  activity_type: "message" | "call" | "email" | "visit" | "purchase" | "support_ticket";
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;

  // Context
  conversation_id?: string;
  agent_id?: string;
  outcome?: string;

  // Activity details
  duration?: number; // in seconds
  channel?: string;
  source?: string;
}

export interface CustomerInsight {
  id: string;
  customer_id: string;
  insight_type: "behavior" | "preference" | "satisfaction" | "risk" | "opportunity";
  title: string;
  description: string;
  confidence: number; // 0-1

  // Metadata
  generated_at: string;
  generated_by: "ai" | "agent" | "system";
  source_data?: string[];

  // Actionability
  actionable: boolean;
  recommended_action?: string;
  priority: "low" | "medium" | "high" | "urgent";

  // Status
  status: "active" | "resolved" | "dismissed";
  resolved_at?: string;
  resolved_by?: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  customer_count: number;
  created_at: string;
  updated_at: string;
}

export interface SegmentCriteria {
  filters: SegmentFilter[];
  logic: "AND" | "OR";
}

export interface SegmentFilter {
  field: keyof Customer | string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "less_than"
    | "between"
    | "in"
    | "not_in";
  value: any;
  data_type: "string" | "number" | "boolean" | "date" | "array";
}

export interface CustomerInteraction {
  id: string;
  customer_id: string;
  conversation_id?: string;
  type: "inbound" | "outbound";
  channel: "chat" | "email" | "phone" | "sms" | "social";

  // Content
  subject?: string;
  content: string;
  attachments?: string[];

  // Participants
  agent_id?: string;
  ai_assisted: boolean;

  // Timing
  started_at: string;
  ended_at?: string;
  response_time?: number; // in seconds
  resolution_time?: number; // in seconds

  // Outcome
  status: "open" | "pending" | "resolved" | "closed";
  resolution?: string;
  satisfaction_score?: number; // 1-5
  tags?: string[];

  // AI Analysis
  sentiment?: "positive" | "negative" | "neutral";
  intent?: string;
  category?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  escalation_required?: boolean;
}

export interface CustomerJourney {
  customer_id: string;
  stages: JourneyStage[];
  current_stage: string;
  total_duration: number; // in days
  touchpoints: number;
  conversion_events: string[];
  churn_risk?: ChurnRisk;
}

export interface JourneyStage {
  stage_name: string;
  entered_at: string;
  exited_at?: string;
  duration?: number; // in days
  interactions: CustomerInteraction[];
  milestone_reached: boolean;
  conversion_rate?: number;
}

export interface ChurnRisk {
  score: number; // 0-1
  factors: ChurnFactor[];
  last_calculated: string;
  prediction_horizon: number; // days
  recommended_actions: string[];
}

export interface ChurnFactor {
  factor: string;
  impact: number; // -1 to 1
  description: string;
  category: "behavior" | "engagement" | "satisfaction" | "value" | "support";
}

export interface CustomerSummary {
  customer: Customer;
  recent_activity: CustomerActivity[];
  active_conversations: number;
  satisfaction_score: number;
  support_tickets: {
    open: number;
    resolved: number;
    average_resolution_time: number;
  };
  insights: CustomerInsight[];
  journey_stage: string;
  churn_risk?: number;
}

// Utility types
export type CustomerField = keyof Customer;
export type CustomerStatus = "active" | "inactive" | "blocked" | "churned";
export type CustomerPriority = "low" | "medium" | "high" | "vip";

// API response types
export interface CustomerListResponse {
  customers: Customer[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CustomerDetailResponse {
  customer: Customer;
  activity: CustomerActivity[];
  insights: CustomerInsight[];
  interactions: CustomerInteraction[];
  journey: CustomerJourney;
}

// Form types
export interface CreateCustomerRequest {
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  company?: string;
  title?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  preferences?: Partial<CustomerPreferences>;
}

export interface CustomerSearchQuery {
  query?: string;
  filters?: {
    tags?: string[];
    company?: string;
    tier?: CustomerValue["tier"];
    status?: CustomerStatus;
    created_after?: string;
    created_before?: string;
  };
  sort?: {
    field: CustomerField;
    direction: "asc" | "desc";
  };
  page?: number;
  per_page?: number;
}
