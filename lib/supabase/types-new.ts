export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      activity_events: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_type: string;
          conversation_id: string | null;
          created_at: string | null;
          description: string | null;
          entity_id: string | null;
          entity_type: string;
          id: string;
          metadata: Json | null;
          organization_id: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_type: string;
          conversation_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          metadata?: Json | null;
          organization_id: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_type?: string;
          conversation_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          metadata?: Json | null;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_events_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_events_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_events_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "activity_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_availability: {
        Row: {
          agent_id: string;
          auto_assign: boolean | null;
          avg_response_time: number | null;
          current_chat_count: number | null;
          last_active: string | null;
          max_concurrent_chats: number | null;
          organization_id: string;
          priority_score: number | null;
          satisfaction_score: number | null;
          skills: Json | null;
          status: string | null;
          status_message: string | null;
          timezone: string | null;
          total_conversations: number | null;
          updated_at: string | null;
          working_hours: Json | null;
        };
        Insert: {
          agent_id: string;
          auto_assign?: boolean | null;
          avg_response_time?: number | null;
          current_chat_count?: number | null;
          last_active?: string | null;
          max_concurrent_chats?: number | null;
          organization_id: string;
          priority_score?: number | null;
          satisfaction_score?: number | null;
          skills?: Json | null;
          status?: string | null;
          status_message?: string | null;
          timezone?: string | null;
          total_conversations?: number | null;
          updated_at?: string | null;
          working_hours?: Json | null;
        };
        Update: {
          agent_id?: string;
          auto_assign?: boolean | null;
          avg_response_time?: number | null;
          current_chat_count?: number | null;
          last_active?: string | null;
          max_concurrent_chats?: number | null;
          organization_id?: string;
          priority_score?: number | null;
          satisfaction_score?: number | null;
          skills?: Json | null;
          status?: string | null;
          status_message?: string | null;
          timezone?: string | null;
          total_conversations?: number | null;
          updated_at?: string | null;
          working_hours?: Json | null;
        };
        Relationships: [];
      };
      agents: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          name: string;
          organization_id: string | null;
          role: string | null;
          status: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          name: string;
          organization_id?: string | null;
          role?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          name?: string;
          organization_id?: string | null;
          role?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agents_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "agents_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_budgets: {
        Row: {
          alert_threshold: number | null;
          created_at: string | null;
          current_usage: number | null;
          id: string;
          is_active: boolean | null;
          monthly_limit: number;
          organization_id: string;
          reset_at: string;
          updated_at: string | null;
        };
        Insert: {
          alert_threshold?: number | null;
          created_at?: string | null;
          current_usage?: number | null;
          id?: string;
          is_active?: boolean | null;
          monthly_limit?: number;
          organization_id: string;
          reset_at?: string;
          updated_at?: string | null;
        };
        Update: {
          alert_threshold?: number | null;
          created_at?: string | null;
          current_usage?: number | null;
          id?: string;
          is_active?: boolean | null;
          monthly_limit?: number;
          organization_id?: string;
          reset_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_budgets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "ai_budgets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_feedback: {
        Row: {
          comment: string | null;
          conversation_id: string | null;
          created_at: string | null;
          created_by: string | null;
          feedback_type: string;
          id: string;
          message_id: string | null;
          metadata: Json | null;
          organization_id: string;
          rating: number | null;
        };
        Insert: {
          comment?: string | null;
          conversation_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          feedback_type: string;
          id?: string;
          message_id?: string | null;
          metadata?: Json | null;
          organization_id: string;
          rating?: number | null;
        };
        Update: {
          comment?: string | null;
          conversation_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          feedback_type?: string;
          id?: string;
          message_id?: string | null;
          metadata?: Json | null;
          organization_id?: string;
          rating?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_feedback_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_feedback_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_feedback_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_feedback_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_feedback_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "ai_feedback_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_handovers: {
        Row: {
          ai_confidence: number | null;
          assigned_agent: string | null;
          completed_at: string | null;
          context: Json | null;
          conversation_id: string;
          created_at: string | null;
          handover_reason: string;
          id: string;
          organization_id: string;
          status: string | null;
        };
        Insert: {
          ai_confidence?: number | null;
          assigned_agent?: string | null;
          completed_at?: string | null;
          context?: Json | null;
          conversation_id: string;
          created_at?: string | null;
          handover_reason: string;
          id?: string;
          organization_id: string;
          status?: string | null;
        };
        Update: {
          ai_confidence?: number | null;
          assigned_agent?: string | null;
          completed_at?: string | null;
          context?: Json | null;
          conversation_id?: string;
          created_at?: string | null;
          handover_reason?: string;
          id?: string;
          organization_id?: string;
          status?: string | null;
        };
        Relationships: [];
      };
      ai_insights: {
        Row: {
          confidence_score: number | null;
          content: string | null;
          conversation_id: string;
          created_at: string | null;
          id: string;
          insight_type: string;
          is_active: boolean | null;
          metadata: Json | null;
          title: string | null;
        };
        Insert: {
          confidence_score?: number | null;
          content?: string | null;
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          insight_type: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          title?: string | null;
        };
        Update: {
          confidence_score?: number | null;
          content?: string | null;
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          insight_type?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_insights_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_insights_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_insights_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_processing_logs: {
        Row: {
          conversation_id: string;
          created_at: string | null;
          error_message: string | null;
          event_type: string | null;
          id: string;
          message_id: string | null;
          organization_id: string;
          processing_time_ms: number | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          conversation_id: string;
          created_at?: string | null;
          error_message?: string | null;
          event_type?: string | null;
          id?: string;
          message_id?: string | null;
          organization_id: string;
          processing_time_ms?: number | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          conversation_id?: string;
          created_at?: string | null;
          error_message?: string | null;
          event_type?: string | null;
          id?: string;
          message_id?: string | null;
          organization_id?: string;
          processing_time_ms?: number | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_processing_logs_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_processing_logs_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_processing_logs_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_processing_logs_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_processing_logs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "ai_processing_logs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_routing_suggestions: {
        Row: {
          confidence_score: number | null;
          conversation_id: string;
          created_at: string;
          id: string;
          metadata: Json | null;
          organization_id: string;
          reasoning: string | null;
          suggested_agent_id: string | null;
        };
        Insert: {
          confidence_score?: number | null;
          conversation_id: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          organization_id: string;
          reasoning?: string | null;
          suggested_agent_id?: string | null;
        };
        Update: {
          confidence_score?: number | null;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          organization_id?: string;
          reasoning?: string | null;
          suggested_agent_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_routing_suggestions_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_routing_suggestions_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_routing_suggestions_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_routing_suggestions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "ai_routing_suggestions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_routing_suggestions_suggested_agent_id_fkey";
            columns: ["suggested_agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_sessions: {
        Row: {
          completion_tokens: number | null;
          context: Json | null;
          conversation_id: string;
          created_at: string | null;
          ended_at: string | null;
          id: string;
          model_used: string | null;
          organization_id: string;
          persona: string | null;
          prompt_tokens: number | null;
          status: string | null;
          total_tokens: number | null;
          updated_at: string | null;
        };
        Insert: {
          completion_tokens?: number | null;
          context?: Json | null;
          conversation_id: string;
          created_at?: string | null;
          ended_at?: string | null;
          id?: string;
          model_used?: string | null;
          organization_id: string;
          persona?: string | null;
          prompt_tokens?: number | null;
          status?: string | null;
          total_tokens?: number | null;
          updated_at?: string | null;
        };
        Update: {
          completion_tokens?: number | null;
          context?: Json | null;
          conversation_id?: string;
          created_at?: string | null;
          ended_at?: string | null;
          id?: string;
          model_used?: string | null;
          organization_id?: string;
          persona?: string | null;
          prompt_tokens?: number | null;
          status?: string | null;
          total_tokens?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_sessions_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_sessions_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_sessions_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_sessions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "ai_sessions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_suggestions: {
        Row: {
          confidence_score: number | null;
          conversation_id: string;
          created_at: string | null;
          id: string;
          suggested_text: string;
          suggestion_type: string | null;
          trigger_message_id: string | null;
          used: boolean | null;
        };
        Insert: {
          confidence_score?: number | null;
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          suggested_text: string;
          suggestion_type?: string | null;
          trigger_message_id?: string | null;
          used?: boolean | null;
        };
        Update: {
          confidence_score?: number | null;
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          suggested_text?: string;
          suggestion_type?: string | null;
          trigger_message_id?: string | null;
          used?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_suggestions_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_suggestions_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_suggestions_trigger_message_id_fkey";
            columns: ["trigger_message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_training_data: {
        Row: {
          category: string;
          content: Json;
          created_at: string | null;
          data_type: string;
          description: string | null;
          id: string;
          is_validated: boolean | null;
          labels: Json | null;
          name: string;
          organization_id: string;
          quality_score: number | null;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          content: Json;
          created_at?: string | null;
          data_type: string;
          description?: string | null;
          id?: string;
          is_validated?: boolean | null;
          labels?: Json | null;
          name: string;
          organization_id: string;
          quality_score?: number | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          content?: Json;
          created_at?: string | null;
          data_type?: string;
          description?: string | null;
          id?: string;
          is_validated?: boolean | null;
          labels?: Json | null;
          name?: string;
          organization_id?: string;
          quality_score?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_training_data_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "ai_training_data_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_usage_events: {
        Row: {
          conversation_id: string | null;
          cost_usd: number | null;
          created_at: string | null;
          event_type: string;
          id: string;
          metadata: Json | null;
          model_used: string | null;
          organization_id: string;
          tokens_used: number | null;
        };
        Insert: {
          conversation_id?: string | null;
          cost_usd?: number | null;
          created_at?: string | null;
          event_type: string;
          id?: string;
          metadata?: Json | null;
          model_used?: string | null;
          organization_id: string;
          tokens_used?: number | null;
        };
        Update: {
          conversation_id?: string | null;
          cost_usd?: number | null;
          created_at?: string | null;
          event_type?: string;
          id?: string;
          metadata?: Json | null;
          model_used?: string | null;
          organization_id?: string;
          tokens_used?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_usage_events_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_usage_events_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_usage_events_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_usage_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "ai_usage_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      analytics_events: {
        Row: {
          created_at: string;
          event_name: string;
          event_type: string;
          id: string;
          organization_id: string;
          properties: Json | null;
          session_id: string | null;
          timestamp: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_name: string;
          event_type: string;
          id?: string;
          organization_id: string;
          properties?: Json | null;
          session_id?: string | null;
          timestamp?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_name?: string;
          event_type?: string;
          id?: string;
          organization_id?: string;
          properties?: Json | null;
          session_id?: string | null;
          timestamp?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "analytics_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      api_keys: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          name: string;
          organization_id: string;
          permissions: Json | null;
          scopes: string[] | null;
          status: string | null;
          updated_at: string | null;
          usage_count: number | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          name: string;
          organization_id: string;
          permissions?: Json | null;
          scopes?: string[] | null;
          status?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          key_hash?: string;
          key_prefix?: string;
          last_used_at?: string | null;
          name?: string;
          organization_id?: string;
          permissions?: Json | null;
          scopes?: string[] | null;
          status?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "api_keys_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "api_keys_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "api_keys_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      applied_migrations: {
        Row: {
          applied_at: string | null;
          applied_by: string | null;
          checksum: string | null;
          filename: string;
          id: number;
        };
        Insert: {
          applied_at?: string | null;
          applied_by?: string | null;
          checksum?: string | null;
          filename: string;
          id?: number;
        };
        Update: {
          applied_at?: string | null;
          applied_by?: string | null;
          checksum?: string | null;
          filename?: string;
          id?: number;
        };
        Relationships: [];
      };
      campfire_handoff_logs: {
        Row: {
          action: string;
          created_at: string | null;
          created_by: string | null;
          details: Json | null;
          handoff_id: string | null;
          id: string;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          created_by?: string | null;
          details?: Json | null;
          handoff_id?: string | null;
          id?: string;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          created_by?: string | null;
          details?: Json | null;
          handoff_id?: string | null;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campfire_handoff_logs_handoff_id_fkey";
            columns: ["handoff_id"];
            isOneToOne: false;
            referencedRelation: "campfire_handoffs";
            referencedColumns: ["id"];
          },
        ];
      };
      campfire_handoffs: {
        Row: {
          completed_at: string | null;
          conversation_id: string | null;
          created_at: string | null;
          from_agent_id: string | null;
          handoff_type: string;
          id: string;
          notes: string | null;
          organization_id: string;
          status: string | null;
          to_agent_id: string | null;
        };
        Insert: {
          completed_at?: string | null;
          conversation_id?: string | null;
          created_at?: string | null;
          from_agent_id?: string | null;
          handoff_type: string;
          id?: string;
          notes?: string | null;
          organization_id: string;
          status?: string | null;
          to_agent_id?: string | null;
        };
        Update: {
          completed_at?: string | null;
          conversation_id?: string | null;
          created_at?: string | null;
          from_agent_id?: string | null;
          handoff_type?: string;
          id?: string;
          notes?: string | null;
          organization_id?: string;
          status?: string | null;
          to_agent_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "campfire_handoffs_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campfire_handoffs_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campfire_handoffs_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campfire_handoffs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "campfire_handoffs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      conversation_activities: {
        Row: {
          activity_type: string;
          actor_id: string | null;
          actor_type: string | null;
          conversation_id: string;
          created_at: string | null;
          description: string | null;
          id: string;
          metadata: Json | null;
        };
        Insert: {
          activity_type: string;
          actor_id?: string | null;
          actor_type?: string | null;
          conversation_id: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
        };
        Update: {
          activity_type?: string;
          actor_id?: string | null;
          actor_type?: string | null;
          conversation_id?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_activities_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_activities_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_activities_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      conversation_assignments: {
        Row: {
          agent_id: string;
          assigned_by: string | null;
          assignment_type: string | null;
          conversation_id: string;
          created_at: string | null;
          ended_at: string | null;
          id: string;
          metadata: Json | null;
          organization_id: string;
          reason: string | null;
        };
        Insert: {
          agent_id: string;
          assigned_by?: string | null;
          assignment_type?: string | null;
          conversation_id: string;
          created_at?: string | null;
          ended_at?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id: string;
          reason?: string | null;
        };
        Update: {
          agent_id?: string;
          assigned_by?: string | null;
          assignment_type?: string | null;
          conversation_id?: string;
          created_at?: string | null;
          ended_at?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id?: string;
          reason?: string | null;
        };
        Relationships: [];
      };
      conversation_followers: {
        Row: {
          conversation_id: string;
          followed_at: string;
          id: string;
          notify_on_assignment: boolean | null;
          notify_on_new_message: boolean | null;
          notify_on_status_change: boolean | null;
          user_id: string;
        };
        Insert: {
          conversation_id: string;
          followed_at?: string;
          id?: string;
          notify_on_assignment?: boolean | null;
          notify_on_new_message?: boolean | null;
          notify_on_status_change?: boolean | null;
          user_id: string;
        };
        Update: {
          conversation_id?: string;
          followed_at?: string;
          id?: string;
          notify_on_assignment?: boolean | null;
          notify_on_new_message?: boolean | null;
          notify_on_status_change?: boolean | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_followers_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_followers_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_followers_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_followers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      conversation_messages: {
        Row: {
          conversation_id: string | null;
          created_at: string | null;
          id: string;
          message_id: string | null;
        };
        Insert: {
          conversation_id?: string | null;
          created_at?: string | null;
          id?: string;
          message_id?: string | null;
        };
        Update: {
          conversation_id?: string | null;
          created_at?: string | null;
          id?: string;
          message_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_messages_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      conversation_notes: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string | null;
          created_by: string;
          id: string;
          is_private: boolean | null;
          organization_id: string;
          tags: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string | null;
          created_by: string;
          id?: string;
          is_private?: boolean | null;
          organization_id: string;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string | null;
          created_by?: string;
          id?: string;
          is_private?: boolean | null;
          organization_id?: string;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_notes_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_notes_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_notes_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      conversation_sentiment_tracking: {
        Row: {
          analysis_method: string | null;
          analyzed_at: string | null;
          confidence: number;
          conversation_id: number;
          created_at: string | null;
          id: string;
          message_id: number | null;
          organization_id: string;
          sentiment_type: string;
          updated_at: string | null;
        };
        Insert: {
          analysis_method?: string | null;
          analyzed_at?: string | null;
          confidence: number;
          conversation_id: number;
          created_at?: string | null;
          id?: string;
          message_id?: number | null;
          organization_id: string;
          sentiment_type: string;
          updated_at?: string | null;
        };
        Update: {
          analysis_method?: string | null;
          analyzed_at?: string | null;
          confidence?: number;
          conversation_id?: number;
          created_at?: string | null;
          id?: string;
          message_id?: number | null;
          organization_id?: string;
          sentiment_type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      conversation_status_history: {
        Row: {
          changed_by: string | null;
          conversation_id: string;
          created_at: string | null;
          from_status: string;
          id: string;
          metadata: Json | null;
          organization_id: string;
          reason: string | null;
          to_status: string;
        };
        Insert: {
          changed_by?: string | null;
          conversation_id: string;
          created_at?: string | null;
          from_status: string;
          id?: string;
          metadata?: Json | null;
          organization_id: string;
          reason?: string | null;
          to_status: string;
        };
        Update: {
          changed_by?: string | null;
          conversation_id?: string;
          created_at?: string | null;
          from_status?: string;
          id?: string;
          metadata?: Json | null;
          organization_id?: string;
          reason?: string | null;
          to_status?: string;
        };
        Relationships: [];
      };
      conversation_tags: {
        Row: {
          color: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          is_system: boolean | null;
          name: string;
          organization_id: string;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_system?: boolean | null;
          name: string;
          organization_id: string;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_system?: boolean | null;
          name?: string;
          organization_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_tags_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_tags_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "conversation_tags_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          ai_confidence_score: number | null;
          ai_handover_id: string | null;
          ai_handover_session_id: string | null;
          ai_persona: string | null;
          assigned_agent_id: string | null;
          assigned_at: string | null;
          assigned_operator_id: string | null;
          assigned_to: string | null;
          assigned_to_ai: boolean | null;
          assignee_id: string | null;
          created_at: string | null;
          customer: Json | null;
          customer_attributes: Json | null;
          customer_browser: string | null;
          customer_device_type: string | null;
          customer_email: string | null;
          customer_id: string | null;
          customer_ip: string | null;
          customer_location: Json | null;
          customer_name: string | null;
          customer_os: string | null;
          customer_timezone: string | null;
          email_from: string | null;
          emailfrom: string | null;
          escalation_reason: string | null;
          first_response_at: string | null;
          id: string;
          internal_notes: string | null;
          last_message_at: string | null;
          last_message_preview: string | null;
          mailbox_id: number | null;
          metadata: Json | null;
          organization_id: string;
          priority: string | null;
          priority_level: number | null;
          rag_enabled: boolean | null;
          resolved_at: string | null;
          sentiment_score: number | null;
          status: string | null;
          status_reason: string | null;
          subject: string | null;
          tags: string[] | null;
          ticket_id: string | null;
          unread_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          ai_confidence_score?: number | null;
          ai_handover_id?: string | null;
          ai_handover_session_id?: string | null;
          ai_persona?: string | null;
          assigned_agent_id?: string | null;
          assigned_at?: string | null;
          assigned_operator_id?: string | null;
          assigned_to?: string | null;
          assigned_to_ai?: boolean | null;
          assignee_id?: string | null;
          created_at?: string | null;
          customer?: Json | null;
          customer_attributes?: Json | null;
          customer_browser?: string | null;
          customer_device_type?: string | null;
          customer_email?: string | null;
          customer_id?: string | null;
          customer_ip?: string | null;
          customer_location?: Json | null;
          customer_name?: string | null;
          customer_os?: string | null;
          customer_timezone?: string | null;
          email_from?: string | null;
          emailfrom?: string | null;
          escalation_reason?: string | null;
          first_response_at?: string | null;
          id?: string;
          internal_notes?: string | null;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          mailbox_id?: number | null;
          metadata?: Json | null;
          organization_id: string;
          priority?: string | null;
          priority_level?: number | null;
          rag_enabled?: boolean | null;
          resolved_at?: string | null;
          sentiment_score?: number | null;
          status?: string | null;
          status_reason?: string | null;
          subject?: string | null;
          tags?: string[] | null;
          ticket_id?: string | null;
          unread_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          ai_confidence_score?: number | null;
          ai_handover_id?: string | null;
          ai_handover_session_id?: string | null;
          ai_persona?: string | null;
          assigned_agent_id?: string | null;
          assigned_at?: string | null;
          assigned_operator_id?: string | null;
          assigned_to?: string | null;
          assigned_to_ai?: boolean | null;
          assignee_id?: string | null;
          created_at?: string | null;
          customer?: Json | null;
          customer_attributes?: Json | null;
          customer_browser?: string | null;
          customer_device_type?: string | null;
          customer_email?: string | null;
          customer_id?: string | null;
          customer_ip?: string | null;
          customer_location?: Json | null;
          customer_name?: string | null;
          customer_os?: string | null;
          customer_timezone?: string | null;
          email_from?: string | null;
          emailfrom?: string | null;
          escalation_reason?: string | null;
          first_response_at?: string | null;
          id?: string;
          internal_notes?: string | null;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          mailbox_id?: number | null;
          metadata?: Json | null;
          organization_id?: string;
          priority?: string | null;
          priority_level?: number | null;
          rag_enabled?: boolean | null;
          resolved_at?: string | null;
          sentiment_score?: number | null;
          status?: string | null;
          status_reason?: string | null;
          subject?: string | null;
          tags?: string[] | null;
          ticket_id?: string | null;
          unread_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_operator_id_fkey";
            columns: ["assigned_operator_id"];
            isOneToOne: false;
            referencedRelation: "operators";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_mailbox_id_fkey";
            columns: ["mailbox_id"];
            isOneToOne: false;
            referencedRelation: "mailboxes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "conversations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_satisfaction: {
        Row: {
          conversation_id: string;
          created_at: string;
          created_by: string | null;
          feedback: string | null;
          id: string;
          organization_id: string;
          rating: number;
        };
        Insert: {
          conversation_id: string;
          created_at?: string;
          created_by?: string | null;
          feedback?: string | null;
          id?: string;
          organization_id: string;
          rating: number;
        };
        Update: {
          conversation_id?: string;
          created_at?: string;
          created_by?: string | null;
          feedback?: string | null;
          id?: string;
          organization_id?: string;
          rating?: number;
        };
        Relationships: [
          {
            foreignKeyName: "customer_satisfaction_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_satisfaction_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_satisfaction_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_satisfaction_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_satisfaction_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "customer_satisfaction_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_verifications: {
        Row: {
          created_at: string;
          customer_email: string;
          email_score: number | null;
          email_verified: boolean | null;
          id: string;
          last_verified_at: string | null;
          methods: string[] | null;
          organization_id: string;
          overall_score: number;
          phone_score: number | null;
          phone_verified: boolean | null;
          risk_level: string;
          status: string;
          updated_at: string;
          verification_metadata: Json | null;
          verification_notes: string | null;
        };
        Insert: {
          created_at?: string;
          customer_email: string;
          email_score?: number | null;
          email_verified?: boolean | null;
          id?: string;
          last_verified_at?: string | null;
          methods?: string[] | null;
          organization_id: string;
          overall_score?: number;
          phone_score?: number | null;
          phone_verified?: boolean | null;
          risk_level?: string;
          status?: string;
          updated_at?: string;
          verification_metadata?: Json | null;
          verification_notes?: string | null;
        };
        Update: {
          created_at?: string;
          customer_email?: string;
          email_score?: number | null;
          email_verified?: boolean | null;
          id?: string;
          last_verified_at?: string | null;
          methods?: string[] | null;
          organization_id?: string;
          overall_score?: number;
          phone_score?: number | null;
          phone_verified?: boolean | null;
          risk_level?: string;
          status?: string;
          updated_at?: string;
          verification_metadata?: Json | null;
          verification_notes?: string | null;
        };
        Relationships: [];
      };
      email_templates: {
        Row: {
          body: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          name: string;
          organization_id: string;
          subject: string;
          template_type: string;
          updated_at: string | null;
          variables: Json | null;
        };
        Insert: {
          body: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          name: string;
          organization_id: string;
          subject: string;
          template_type: string;
          updated_at?: string | null;
          variables?: Json | null;
        };
        Update: {
          body?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          name?: string;
          organization_id?: string;
          subject?: string;
          template_type?: string;
          updated_at?: string | null;
          variables?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "email_templates_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "email_templates_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "email_templates_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      escalation_rules: {
        Row: {
          actions: Json;
          conditions: Json;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          organization_id: string;
          updated_at: string | null;
        };
        Insert: {
          actions: Json;
          conditions: Json;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          organization_id: string;
          updated_at?: string | null;
        };
        Update: {
          actions?: Json;
          conditions?: Json;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          organization_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "escalation_rules_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "escalation_rules_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      escalations: {
        Row: {
          assigned_to: string | null;
          conversation_id: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          escalation_type: string;
          id: string;
          organization_id: string;
          priority: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          conversation_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          escalation_type: string;
          id?: string;
          organization_id: string;
          priority?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          conversation_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          escalation_type?: string;
          id?: string;
          organization_id?: string;
          priority?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "escalations_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "escalations_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "escalations_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "escalations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "escalations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      faqs: {
        Row: {
          answer: string;
          category: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          organization_id: string;
          question: string;
          updated_at: string | null;
        };
        Insert: {
          answer: string;
          category?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          organization_id: string;
          question: string;
          updated_at?: string | null;
        };
        Update: {
          answer?: string;
          category?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          organization_id?: string;
          question?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "faqs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "faqs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      file_attachments: {
        Row: {
          conversation_id: string | null;
          created_at: string | null;
          file_size: number;
          filename: string;
          id: string;
          message_id: string | null;
          metadata: Json | null;
          mime_type: string;
          organization_id: string;
          original_filename: string;
          storage_path: string;
          updated_at: string | null;
          upload_status: string | null;
          uploaded_by: string | null;
        };
        Insert: {
          conversation_id?: string | null;
          created_at?: string | null;
          file_size: number;
          filename: string;
          id?: string;
          message_id?: string | null;
          metadata?: Json | null;
          mime_type: string;
          organization_id: string;
          original_filename: string;
          storage_path: string;
          updated_at?: string | null;
          upload_status?: string | null;
          uploaded_by?: string | null;
        };
        Update: {
          conversation_id?: string | null;
          created_at?: string | null;
          file_size?: number;
          filename?: string;
          id?: string;
          message_id?: string | null;
          metadata?: Json | null;
          mime_type?: string;
          organization_id?: string;
          original_filename?: string;
          storage_path?: string;
          updated_at?: string | null;
          upload_status?: string | null;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "file_attachments_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "file_attachments_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "file_attachments_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "file_attachments_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      files: {
        Row: {
          created_at: string | null;
          file_path: string;
          file_size: number | null;
          filename: string;
          id: string;
          mime_type: string | null;
          organization_id: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          file_path: string;
          file_size?: number | null;
          filename: string;
          id?: string;
          mime_type?: string | null;
          organization_id: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          file_path?: string;
          file_size?: number | null;
          filename?: string;
          id?: string;
          mime_type?: string | null;
          organization_id?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "files_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "files_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      handoff_requests: {
        Row: {
          accepted_at: string | null;
          ai_confidence: number | null;
          assigned_agent_id: string | null;
          assigned_at: string | null;
          completed_at: string | null;
          conversation_id: string;
          created_at: string;
          escalation_path: string[] | null;
          handoff_context: Json | null;
          id: string;
          organization_id: string;
          priority: string;
          reason: string;
          status: string;
          target_agent_id: string | null;
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          ai_confidence?: number | null;
          assigned_agent_id?: string | null;
          assigned_at?: string | null;
          completed_at?: string | null;
          conversation_id: string;
          created_at?: string;
          escalation_path?: string[] | null;
          handoff_context?: Json | null;
          id?: string;
          organization_id: string;
          priority?: string;
          reason: string;
          status?: string;
          target_agent_id?: string | null;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          ai_confidence?: number | null;
          assigned_agent_id?: string | null;
          assigned_at?: string | null;
          completed_at?: string | null;
          conversation_id?: string;
          created_at?: string;
          escalation_path?: string[] | null;
          handoff_context?: Json | null;
          id?: string;
          organization_id?: string;
          priority?: string;
          reason?: string;
          status?: string;
          target_agent_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "handoff_requests_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "handoff_requests_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "handoff_requests_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "handoff_requests_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "handoff_requests_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      handover_context: {
        Row: {
          context_data: Json;
          conversation_id: string;
          created_at: string | null;
          id: string;
          organization_id: string;
          preserved_at: string;
          summary: Json | null;
        };
        Insert: {
          context_data: Json;
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          organization_id: string;
          preserved_at: string;
          summary?: Json | null;
        };
        Update: {
          context_data?: Json;
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          organization_id?: string;
          preserved_at?: string;
          summary?: Json | null;
        };
        Relationships: [];
      };
      handover_decisions: {
        Row: {
          assigned_agent: string | null;
          confidence_score: number | null;
          conversation_id: string;
          created_at: string | null;
          decision_type: string;
          id: string;
          metadata: Json | null;
          organization_id: string;
          reason: string;
          triggered_rules: Json | null;
          updated_at: string | null;
        };
        Insert: {
          assigned_agent?: string | null;
          confidence_score?: number | null;
          conversation_id: string;
          created_at?: string | null;
          decision_type: string;
          id?: string;
          metadata?: Json | null;
          organization_id: string;
          reason: string;
          triggered_rules?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          assigned_agent?: string | null;
          confidence_score?: number | null;
          conversation_id?: string;
          created_at?: string | null;
          decision_type?: string;
          id?: string;
          metadata?: Json | null;
          organization_id?: string;
          reason?: string;
          triggered_rules?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      handover_notifications: {
        Row: {
          content: Json | null;
          context: Json | null;
          conversation_id: string;
          created_at: string | null;
          id: string;
          notification_type: string;
          organization_id: string;
          priority: string | null;
          recipients: Json | null;
          sent_at: string | null;
          status: string | null;
        };
        Insert: {
          content?: Json | null;
          context?: Json | null;
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          notification_type: string;
          organization_id: string;
          priority?: string | null;
          recipients?: Json | null;
          sent_at?: string | null;
          status?: string | null;
        };
        Update: {
          content?: Json | null;
          context?: Json | null;
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          notification_type?: string;
          organization_id?: string;
          priority?: string | null;
          recipients?: Json | null;
          sent_at?: string | null;
          status?: string | null;
        };
        Relationships: [];
      };
      handover_status: {
        Row: {
          conversation_id: string;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          organization_id: string;
          reason: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id: string;
          reason?: string | null;
          status: string;
          updated_at?: string | null;
        };
        Update: {
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id?: string;
          reason?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      knowledge_base_articles: {
        Row: {
          category_id: string | null;
          content: string;
          created_at: string | null;
          created_by: string | null;
          helpful_count: number | null;
          id: string;
          is_featured: boolean | null;
          not_helpful_count: number | null;
          organization_id: string;
          published_at: string | null;
          search_vector: unknown | null;
          slug: string;
          sort_order: number | null;
          status: string | null;
          summary: string | null;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
          updated_by: string | null;
          view_count: number | null;
        };
        Insert: {
          category_id?: string | null;
          content: string;
          created_at?: string | null;
          created_by?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_featured?: boolean | null;
          not_helpful_count?: number | null;
          organization_id: string;
          published_at?: string | null;
          search_vector?: unknown | null;
          slug: string;
          sort_order?: number | null;
          status?: string | null;
          summary?: string | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
          updated_by?: string | null;
          view_count?: number | null;
        };
        Update: {
          category_id?: string | null;
          content?: string;
          created_at?: string | null;
          created_by?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_featured?: boolean | null;
          not_helpful_count?: number | null;
          organization_id?: string;
          published_at?: string | null;
          search_vector?: unknown | null;
          slug?: string;
          sort_order?: number | null;
          status?: string | null;
          summary?: string | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_base_articles_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "knowledge_base_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_base_articles_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_base_articles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "knowledge_base_articles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_base_articles_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_base_categories: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          organization_id: string;
          parent_id: string | null;
          slug: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          organization_id: string;
          parent_id?: string | null;
          slug: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          organization_id?: string;
          parent_id?: string | null;
          slug?: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_base_categories_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_base_categories_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "knowledge_base_categories_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_base_categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "knowledge_base_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_categories: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          organization_id: string;
          parent_id: string | null;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          organization_id: string;
          parent_id?: string | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          organization_id?: string;
          parent_id?: string | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_categories_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "knowledge_categories_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "knowledge_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_chunks: {
        Row: {
          content: string;
          created_at: string | null;
          document_id: string | null;
          id: string;
          metadata: Json | null;
          organization_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          document_id?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          document_id?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "knowledge_documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_chunks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "knowledge_chunks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_documents: {
        Row: {
          content: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_active: boolean | null;
          metadata: Json | null;
          organization_id: string;
          source: string | null;
          title: string;
          updated_at: string | null;
          url: string | null;
          version: number | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          organization_id: string;
          source?: string | null;
          title: string;
          updated_at?: string | null;
          url?: string | null;
          version?: number | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          organization_id?: string;
          source?: string | null;
          title?: string;
          updated_at?: string | null;
          url?: string | null;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "knowledge_documents_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_embeddings: {
        Row: {
          chunk_index: number | null;
          content: string;
          created_at: string | null;
          embedding: string | null;
          id: string;
          metadata: Json | null;
          organization_id: string;
          source_id: string | null;
          source_type: string | null;
          updated_at: string | null;
        };
        Insert: {
          chunk_index?: number | null;
          content: string;
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id: string;
          source_id?: string | null;
          source_type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          chunk_index?: number | null;
          content?: string;
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id?: string;
          source_id?: string | null;
          source_type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_embeddings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "knowledge_embeddings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      mailboxes: {
        Row: {
          created_at: string | null;
          description: string | null;
          gmail_support_email_id: string | null;
          id: number;
          name: string;
          organization_id: string;
          settings: Json | null;
          slug: string;
          updated_at: string | null;
          widget_hmac_secret: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          gmail_support_email_id?: string | null;
          id?: number;
          name: string;
          organization_id: string;
          settings?: Json | null;
          slug: string;
          updated_at?: string | null;
          widget_hmac_secret?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          gmail_support_email_id?: string | null;
          id?: number;
          name?: string;
          organization_id?: string;
          settings?: Json | null;
          slug?: string;
          updated_at?: string | null;
          widget_hmac_secret?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mailboxes_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "mailboxes_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      message_delivery_confirmations: {
        Row: {
          confirmed_at: string | null;
          conversation_id: string;
          delivered_at: string;
          delivered_to: string;
          delivery_method: string | null;
          id: string;
          message_id: string;
          metadata: Json | null;
          organization_id: string;
        };
        Insert: {
          confirmed_at?: string | null;
          conversation_id: string;
          delivered_at: string;
          delivered_to: string;
          delivery_method?: string | null;
          id?: string;
          message_id: string;
          metadata?: Json | null;
          organization_id: string;
        };
        Update: {
          confirmed_at?: string | null;
          conversation_id?: string;
          delivered_at?: string;
          delivered_to?: string;
          delivery_method?: string | null;
          id?: string;
          message_id?: string;
          metadata?: Json | null;
          organization_id?: string;
        };
        Relationships: [];
      };
      message_delivery_status: {
        Row: {
          created_at: string | null;
          delivered_at: string | null;
          id: string;
          message_id: string | null;
          metadata: Json | null;
          read_at: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          delivered_at?: string | null;
          id?: string;
          message_id?: string | null;
          metadata?: Json | null;
          read_at?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          delivered_at?: string | null;
          id?: string;
          message_id?: string | null;
          metadata?: Json | null;
          read_at?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "message_delivery_status_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      message_edits: {
        Row: {
          content: string;
          created_at: string | null;
          edit_type: string | null;
          id: string;
          message_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          edit_type?: string | null;
          id?: string;
          message_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          edit_type?: string | null;
          id?: string;
          message_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "message_edits_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      message_queue: {
        Row: {
          channel_type: string;
          created_at: string | null;
          error_message: string | null;
          event_name: string;
          id: string;
          max_retries: number | null;
          organization_id: string;
          payload: Json;
          priority: string | null;
          processed_at: string | null;
          resource_id: string;
          retry_count: number | null;
          scheduled_at: string | null;
          status: string | null;
        };
        Insert: {
          channel_type: string;
          created_at?: string | null;
          error_message?: string | null;
          event_name: string;
          id?: string;
          max_retries?: number | null;
          organization_id: string;
          payload: Json;
          priority?: string | null;
          processed_at?: string | null;
          resource_id: string;
          retry_count?: number | null;
          scheduled_at?: string | null;
          status?: string | null;
        };
        Update: {
          channel_type?: string;
          created_at?: string | null;
          error_message?: string | null;
          event_name?: string;
          id?: string;
          max_retries?: number | null;
          organization_id?: string;
          payload?: Json;
          priority?: string | null;
          processed_at?: string | null;
          resource_id?: string;
          retry_count?: number | null;
          scheduled_at?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "message_queue_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "message_queue_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      message_read_receipts: {
        Row: {
          conversation_id: string;
          created_at: string | null;
          id: string;
          message_id: string;
          metadata: Json | null;
          organization_id: string;
          read_at: string;
          read_by: string;
          reader_type: string | null;
        };
        Insert: {
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          message_id: string;
          metadata?: Json | null;
          organization_id: string;
          read_at: string;
          read_by: string;
          reader_type?: string | null;
        };
        Update: {
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          message_id?: string;
          metadata?: Json | null;
          organization_id?: string;
          read_at?: string;
          read_by?: string;
          reader_type?: string | null;
        };
        Relationships: [];
      };
      message_read_status: {
        Row: {
          created_at: string | null;
          id: string;
          message_id: string | null;
          read_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          message_id?: string | null;
          read_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          message_id?: string | null;
          read_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "message_read_status_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          ai_confidence: number | null;
          ai_metadata: Json | null;
          ai_sources: Json | null;
          attachments: Json | null;
          confidence_score: number | null;
          content: string;
          content_type: string | null;
          conversation_id: string;
          created_at: string | null;
          delivered_at: string | null;
          delivery_status: string | null;
          escalation_required: boolean | null;
          id: string;
          is_deleted: boolean | null;
          is_internal: boolean | null;
          is_internal_note: boolean | null;
          is_partial: boolean | null;
          is_private: boolean | null;
          is_read: boolean | null;
          message_type: string | null;
          metadata: Json | null;
          operator_id: string | null;
          organization_id: string;
          read_at: string | null;
          read_by: string | null;
          read_status: string | null;
          reply_to_id: string | null;
          sender_avatar: string | null;
          sender_email: string | null;
          sender_id: string | null;
          sender_name: string | null;
          sender_type: string;
          status: string | null;
          thread_id: string | null;
          typing_duration_ms: number | null;
          updated_at: string | null;
        };
        Insert: {
          ai_confidence?: number | null;
          ai_metadata?: Json | null;
          ai_sources?: Json | null;
          attachments?: Json | null;
          confidence_score?: number | null;
          content: string;
          content_type?: string | null;
          conversation_id: string;
          created_at?: string | null;
          delivered_at?: string | null;
          delivery_status?: string | null;
          escalation_required?: boolean | null;
          id?: string;
          is_deleted?: boolean | null;
          is_internal?: boolean | null;
          is_internal_note?: boolean | null;
          is_partial?: boolean | null;
          is_private?: boolean | null;
          is_read?: boolean | null;
          message_type?: string | null;
          metadata?: Json | null;
          operator_id?: string | null;
          organization_id: string;
          read_at?: string | null;
          read_by?: string | null;
          read_status?: string | null;
          reply_to_id?: string | null;
          sender_avatar?: string | null;
          sender_email?: string | null;
          sender_id?: string | null;
          sender_name?: string | null;
          sender_type: string;
          status?: string | null;
          thread_id?: string | null;
          typing_duration_ms?: number | null;
          updated_at?: string | null;
        };
        Update: {
          ai_confidence?: number | null;
          ai_metadata?: Json | null;
          ai_sources?: Json | null;
          attachments?: Json | null;
          confidence_score?: number | null;
          content?: string;
          content_type?: string | null;
          conversation_id?: string;
          created_at?: string | null;
          delivered_at?: string | null;
          delivery_status?: string | null;
          escalation_required?: boolean | null;
          id?: string;
          is_deleted?: boolean | null;
          is_internal?: boolean | null;
          is_internal_note?: boolean | null;
          is_partial?: boolean | null;
          is_private?: boolean | null;
          is_read?: boolean | null;
          message_type?: string | null;
          metadata?: Json | null;
          operator_id?: string | null;
          organization_id?: string;
          read_at?: string | null;
          read_by?: string | null;
          read_status?: string | null;
          reply_to_id?: string | null;
          sender_avatar?: string | null;
          sender_email?: string | null;
          sender_id?: string | null;
          sender_name?: string | null;
          sender_type?: string;
          status?: string | null;
          thread_id?: string | null;
          typing_duration_ms?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_operator_id_fkey";
            columns: ["operator_id"];
            isOneToOne: false;
            referencedRelation: "operators";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "messages_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_read_by_fkey";
            columns: ["read_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey";
            columns: ["reply_to_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      model_versions: {
        Row: {
          configuration: Json | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          model_type: string;
          name: string;
          organization_id: string;
          version: string;
        };
        Insert: {
          configuration?: Json | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          model_type: string;
          name: string;
          organization_id: string;
          version: string;
        };
        Update: {
          configuration?: Json | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          model_type?: string;
          name?: string;
          organization_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "model_versions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "model_versions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          content: string;
          conversation_id: string | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          organization_id: string;
          updated_at: string | null;
        };
        Insert: {
          content: string;
          conversation_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          organization_id: string;
          updated_at?: string | null;
        };
        Update: {
          content?: string;
          conversation_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          organization_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notes_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "notes_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          action_url: string | null;
          created_at: string;
          data: Json | null;
          delivered_at: string | null;
          delivery_method: string | null;
          id: string;
          is_delivered: boolean | null;
          is_read: boolean | null;
          message: string;
          organization_id: string;
          read_at: string | null;
          title: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          action_url?: string | null;
          created_at?: string;
          data?: Json | null;
          delivered_at?: string | null;
          delivery_method?: string | null;
          id?: string;
          is_delivered?: boolean | null;
          is_read?: boolean | null;
          message: string;
          organization_id: string;
          read_at?: string | null;
          title: string;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          action_url?: string | null;
          created_at?: string;
          data?: Json | null;
          delivered_at?: string | null;
          delivery_method?: string | null;
          id?: string;
          is_delivered?: boolean | null;
          is_read?: boolean | null;
          message?: string;
          organization_id?: string;
          read_at?: string | null;
          title?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "notifications_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      onboarding_applied_customizations: {
        Row: {
          applied_at: string | null;
          applied_successfully: boolean | null;
          customization_data: Json;
          customization_type: string;
          error_message: string | null;
          id: string;
          organization_id: string;
          user_id: string;
        };
        Insert: {
          applied_at?: string | null;
          applied_successfully?: boolean | null;
          customization_data: Json;
          customization_type: string;
          error_message?: string | null;
          id?: string;
          organization_id: string;
          user_id: string;
        };
        Update: {
          applied_at?: string | null;
          applied_successfully?: boolean | null;
          customization_data?: Json;
          customization_type?: string;
          error_message?: string | null;
          id?: string;
          organization_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "onboarding_applied_customizations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "onboarding_applied_customizations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      onboarding_business_profiles: {
        Row: {
          company_size: string | null;
          created_at: string | null;
          current_solution: string | null;
          current_tools: string[] | null;
          customer_satisfaction_current: string | null;
          data_import_needs: string | null;
          escalation_process: string | null;
          id: string;
          implementation_type: string | null;
          industry: string | null;
          launch_timeline: string | null;
          organization_id: string;
          primary_challenges: string[] | null;
          primary_goals: string[] | null;
          priority_integrations: string[] | null;
          response_time_current: string | null;
          response_time_goal: string | null;
          satisfaction_goal: string | null;
          specific_pain_points: string | null;
          success_metrics: string[] | null;
          support_volume: string | null;
          team_burnout_level: string | null;
          team_emails: string[] | null;
          team_roles: string[] | null;
          team_size: string | null;
          technical_contact: string | null;
          testing_needs: string[] | null;
          timezone: string | null;
          updated_at: string | null;
          user_id: string;
          volume_growth_expectation: string | null;
          website: string | null;
          working_hours: string | null;
        };
        Insert: {
          company_size?: string | null;
          created_at?: string | null;
          current_solution?: string | null;
          current_tools?: string[] | null;
          customer_satisfaction_current?: string | null;
          data_import_needs?: string | null;
          escalation_process?: string | null;
          id?: string;
          implementation_type?: string | null;
          industry?: string | null;
          launch_timeline?: string | null;
          organization_id: string;
          primary_challenges?: string[] | null;
          primary_goals?: string[] | null;
          priority_integrations?: string[] | null;
          response_time_current?: string | null;
          response_time_goal?: string | null;
          satisfaction_goal?: string | null;
          specific_pain_points?: string | null;
          success_metrics?: string[] | null;
          support_volume?: string | null;
          team_burnout_level?: string | null;
          team_emails?: string[] | null;
          team_roles?: string[] | null;
          team_size?: string | null;
          technical_contact?: string | null;
          testing_needs?: string[] | null;
          timezone?: string | null;
          updated_at?: string | null;
          user_id: string;
          volume_growth_expectation?: string | null;
          website?: string | null;
          working_hours?: string | null;
        };
        Update: {
          company_size?: string | null;
          created_at?: string | null;
          current_solution?: string | null;
          current_tools?: string[] | null;
          customer_satisfaction_current?: string | null;
          data_import_needs?: string | null;
          escalation_process?: string | null;
          id?: string;
          implementation_type?: string | null;
          industry?: string | null;
          launch_timeline?: string | null;
          organization_id?: string;
          primary_challenges?: string[] | null;
          primary_goals?: string[] | null;
          priority_integrations?: string[] | null;
          response_time_current?: string | null;
          response_time_goal?: string | null;
          satisfaction_goal?: string | null;
          specific_pain_points?: string | null;
          success_metrics?: string[] | null;
          support_volume?: string | null;
          team_burnout_level?: string | null;
          team_emails?: string[] | null;
          team_roles?: string[] | null;
          team_size?: string | null;
          technical_contact?: string | null;
          testing_needs?: string[] | null;
          timezone?: string | null;
          updated_at?: string | null;
          user_id?: string;
          volume_growth_expectation?: string | null;
          website?: string | null;
          working_hours?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "onboarding_business_profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "onboarding_business_profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      onboarding_completion_tracking: {
        Row: {
          completed_at: string | null;
          completed_steps: string[] | null;
          completion_percentage: number | null;
          created_at: string | null;
          current_step: string;
          customization_applied_at: string | null;
          customizations_applied: boolean | null;
          estimated_time_remaining: number | null;
          id: string;
          is_completed: boolean | null;
          last_activity_at: string | null;
          organization_id: string;
          skipped_steps: string[] | null;
          started_at: string | null;
          total_steps: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          completed_steps?: string[] | null;
          completion_percentage?: number | null;
          created_at?: string | null;
          current_step: string;
          customization_applied_at?: string | null;
          customizations_applied?: boolean | null;
          estimated_time_remaining?: number | null;
          id?: string;
          is_completed?: boolean | null;
          last_activity_at?: string | null;
          organization_id: string;
          skipped_steps?: string[] | null;
          started_at?: string | null;
          total_steps?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          completed_steps?: string[] | null;
          completion_percentage?: number | null;
          created_at?: string | null;
          current_step?: string;
          customization_applied_at?: string | null;
          customizations_applied?: boolean | null;
          estimated_time_remaining?: number | null;
          id?: string;
          is_completed?: boolean | null;
          last_activity_at?: string | null;
          organization_id?: string;
          skipped_steps?: string[] | null;
          started_at?: string | null;
          total_steps?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "onboarding_completion_tracking_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "onboarding_completion_tracking_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      onboarding_preferences: {
        Row: {
          ai_automation_level: string | null;
          ai_handover_threshold: number | null;
          ai_tone: string | null;
          channel_priorities: Json | null;
          created_at: string | null;
          dashboard_layout: string | null;
          enabled_channels: string[] | null;
          id: string;
          notification_preferences: Json | null;
          organization_id: string;
          preferred_metrics: string[] | null;
          updated_at: string | null;
          user_id: string;
          widget_color: string | null;
          widget_greeting: string | null;
          widget_offline_message: string | null;
          widget_position: string | null;
        };
        Insert: {
          ai_automation_level?: string | null;
          ai_handover_threshold?: number | null;
          ai_tone?: string | null;
          channel_priorities?: Json | null;
          created_at?: string | null;
          dashboard_layout?: string | null;
          enabled_channels?: string[] | null;
          id?: string;
          notification_preferences?: Json | null;
          organization_id: string;
          preferred_metrics?: string[] | null;
          updated_at?: string | null;
          user_id: string;
          widget_color?: string | null;
          widget_greeting?: string | null;
          widget_offline_message?: string | null;
          widget_position?: string | null;
        };
        Update: {
          ai_automation_level?: string | null;
          ai_handover_threshold?: number | null;
          ai_tone?: string | null;
          channel_priorities?: Json | null;
          created_at?: string | null;
          dashboard_layout?: string | null;
          enabled_channels?: string[] | null;
          id?: string;
          notification_preferences?: Json | null;
          organization_id?: string;
          preferred_metrics?: string[] | null;
          updated_at?: string | null;
          user_id?: string;
          widget_color?: string | null;
          widget_greeting?: string | null;
          widget_offline_message?: string | null;
          widget_position?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "onboarding_preferences_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "onboarding_preferences_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      operator_presence: {
        Row: {
          active_conversations: number | null;
          created_at: string | null;
          id: string;
          last_heartbeat: string | null;
          operator_id: string;
          response_time_ms: number | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          active_conversations?: number | null;
          created_at?: string | null;
          id?: string;
          last_heartbeat?: string | null;
          operator_id: string;
          response_time_ms?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          active_conversations?: number | null;
          created_at?: string | null;
          id?: string;
          last_heartbeat?: string | null;
          operator_id?: string;
          response_time_ms?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "operator_presence_operator_id_fkey";
            columns: ["operator_id"];
            isOneToOne: true;
            referencedRelation: "operators";
            referencedColumns: ["id"];
          },
        ];
      };
      operators: {
        Row: {
          avatar_url: string;
          created_at: string | null;
          email: string;
          id: string;
          internal_classification: string | null;
          is_online: boolean | null;
          last_seen_at: string | null;
          name: string;
          organization_id: string | null;
          typing_accuracy: number | null;
          typing_speed_wpm: number | null;
          typing_variance: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          avatar_url: string;
          created_at?: string | null;
          email: string;
          id?: string;
          internal_classification?: string | null;
          is_online?: boolean | null;
          last_seen_at?: string | null;
          name: string;
          organization_id?: string | null;
          typing_accuracy?: number | null;
          typing_speed_wpm?: number | null;
          typing_variance?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          avatar_url?: string;
          created_at?: string | null;
          email?: string;
          id?: string;
          internal_classification?: string | null;
          is_online?: boolean | null;
          last_seen_at?: string | null;
          name?: string;
          organization_id?: string | null;
          typing_accuracy?: number | null;
          typing_speed_wpm?: number | null;
          typing_variance?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "operators_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "operators_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string | null;
          id: string;
          organization_id: string;
          permissions: Json | null;
          role: string;
          status: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          organization_id: string;
          permissions?: Json | null;
          role?: string;
          status?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          organization_id?: string;
          permissions?: Json | null;
          role?: string;
          status?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_settings: {
        Row: {
          ai_handover_enabled: boolean | null;
          auto_assign_enabled: boolean | null;
          business_hours: Json | null;
          created_at: string | null;
          id: string;
          notification_settings: Json | null;
          organization_id: string;
          rag_enabled: boolean | null;
          real_time_typing_enabled: boolean | null;
          updated_at: string | null;
          widget_enabled: boolean | null;
        };
        Insert: {
          ai_handover_enabled?: boolean | null;
          auto_assign_enabled?: boolean | null;
          business_hours?: Json | null;
          created_at?: string | null;
          id?: string;
          notification_settings?: Json | null;
          organization_id: string;
          rag_enabled?: boolean | null;
          real_time_typing_enabled?: boolean | null;
          updated_at?: string | null;
          widget_enabled?: boolean | null;
        };
        Update: {
          ai_handover_enabled?: boolean | null;
          auto_assign_enabled?: boolean | null;
          business_hours?: Json | null;
          created_at?: string | null;
          id?: string;
          notification_settings?: Json | null;
          organization_id?: string;
          rag_enabled?: boolean | null;
          real_time_typing_enabled?: boolean | null;
          updated_at?: string | null;
          widget_enabled?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "organization_settings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          business_hours: Json | null;
          created_at: string | null;
          human_like_ai: boolean | null;
          id: string;
          metadata: Json | null;
          name: string;
          onboarding_completed_at: string | null;
          onboarding_customizations_applied: boolean | null;
          settings: Json | null;
          slug: string;
          updated_at: string | null;
          widget_api_key: string | null;
        };
        Insert: {
          business_hours?: Json | null;
          created_at?: string | null;
          human_like_ai?: boolean | null;
          id?: string;
          metadata?: Json | null;
          name: string;
          onboarding_completed_at?: string | null;
          onboarding_customizations_applied?: boolean | null;
          settings?: Json | null;
          slug: string;
          updated_at?: string | null;
          widget_api_key?: string | null;
        };
        Update: {
          business_hours?: Json | null;
          created_at?: string | null;
          human_like_ai?: boolean | null;
          id?: string;
          metadata?: Json | null;
          name?: string;
          onboarding_completed_at?: string | null;
          onboarding_customizations_applied?: boolean | null;
          settings?: Json | null;
          slug?: string;
          updated_at?: string | null;
          widget_api_key?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          current_conversations: number | null;
          email: string;
          full_name: string | null;
          id: string;
          max_conversations: number | null;
          metadata: Json | null;
          organization_id: string | null;
          skills: Json | null;
          status: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          current_conversations?: number | null;
          email: string;
          full_name?: string | null;
          id?: string;
          max_conversations?: number | null;
          metadata?: Json | null;
          organization_id?: string | null;
          skills?: Json | null;
          status?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          current_conversations?: number | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          max_conversations?: number | null;
          metadata?: Json | null;
          organization_id?: string | null;
          skills?: Json | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      quick_replies: {
        Row: {
          category: string | null;
          content: string;
          created_at: string | null;
          id: number;
          is_global: boolean;
          is_template: boolean;
          mailbox_id: number | null;
          organization_id: string | null;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
          usage_count: number;
          user_id: string;
        };
        Insert: {
          category?: string | null;
          content: string;
          created_at?: string | null;
          id?: number;
          is_global?: boolean;
          is_template?: boolean;
          mailbox_id?: number | null;
          organization_id?: string | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
          usage_count?: number;
          user_id: string;
        };
        Update: {
          category?: string | null;
          content?: string;
          created_at?: string | null;
          id?: number;
          is_global?: boolean;
          is_template?: boolean;
          mailbox_id?: number | null;
          organization_id?: string | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
          usage_count?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quick_replies_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "quick_replies_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      rag_profiles: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          knowledge_sources: Json | null;
          max_tokens: number | null;
          name: string;
          organization_id: string;
          system_prompt: string | null;
          temperature: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          knowledge_sources?: Json | null;
          max_tokens?: number | null;
          name: string;
          organization_id: string;
          system_prompt?: string | null;
          temperature?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          knowledge_sources?: Json | null;
          max_tokens?: number | null;
          name?: string;
          organization_id?: string;
          system_prompt?: string | null;
          temperature?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rag_profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "rag_profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      realtime_channels: {
        Row: {
          channel_name: string;
          channel_type: string;
          created_at: string | null;
          id: string;
          last_activity: string | null;
          last_activity_at: string | null;
          metadata: Json | null;
          organization_id: string;
          resource_id: string;
          subscriber_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          channel_name: string;
          channel_type: string;
          created_at?: string | null;
          id?: string;
          last_activity?: string | null;
          last_activity_at?: string | null;
          metadata?: Json | null;
          organization_id: string;
          resource_id: string;
          subscriber_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          channel_name?: string;
          channel_type?: string;
          created_at?: string | null;
          id?: string;
          last_activity?: string | null;
          last_activity_at?: string | null;
          metadata?: Json | null;
          organization_id?: string;
          resource_id?: string;
          subscriber_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "realtime_channels_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "realtime_channels_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_searches: {
        Row: {
          created_at: string;
          description: string | null;
          filters: Json;
          id: string;
          is_shared: boolean | null;
          last_used_at: string | null;
          name: string;
          organization_id: string;
          sort_by: string | null;
          sort_order: string | null;
          updated_at: string;
          usage_count: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          filters?: Json;
          id?: string;
          is_shared?: boolean | null;
          last_used_at?: string | null;
          name: string;
          organization_id: string;
          sort_by?: string | null;
          sort_order?: string | null;
          updated_at?: string;
          usage_count?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          filters?: Json;
          id?: string;
          is_shared?: boolean | null;
          last_used_at?: string | null;
          name?: string;
          organization_id?: string;
          sort_by?: string | null;
          sort_order?: string | null;
          updated_at?: string;
          usage_count?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_searches_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "saved_searches_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_searches_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      security_alerts: {
        Row: {
          alert_type: string;
          created_at: string | null;
          description: string | null;
          id: string;
          metadata: Json | null;
          organization_id: string;
          resolved_at: string | null;
          resolved_by: string | null;
          resource_affected: string | null;
          severity: string;
          source_ip: unknown | null;
          status: string | null;
          title: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          alert_type: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          resource_affected?: string | null;
          severity: string;
          source_ip?: unknown | null;
          status?: string | null;
          title: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          alert_type?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          resource_affected?: string | null;
          severity?: string;
          source_ip?: unknown | null;
          status?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "security_alerts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "security_alerts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      security_metrics: {
        Row: {
          created_at: string | null;
          id: string;
          metric_name: string;
          metric_type: string;
          organization_id: string;
          recorded_at: string | null;
          tags: Json | null;
          unit: string | null;
          value: number;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          metric_name: string;
          metric_type: string;
          organization_id: string;
          recorded_at?: string | null;
          tags?: Json | null;
          unit?: string | null;
          value: number;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          metric_name?: string;
          metric_type?: string;
          organization_id?: string;
          recorded_at?: string | null;
          tags?: Json | null;
          unit?: string | null;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "security_metrics_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "security_metrics_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: {
          category: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_public: boolean | null;
          key: string;
          organization_id: string;
          updated_at: string | null;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          key: string;
          organization_id: string;
          updated_at?: string | null;
          updated_by?: string | null;
          value: Json;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          key?: string;
          organization_id?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "settings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "settings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          organization_id: string;
          plan_name: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          organization_id: string;
          plan_name: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          organization_id?: string;
          plan_name?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "subscriptions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          category: string | null;
          color: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          last_used_at: string | null;
          name: string;
          organization_id: string;
          updated_at: string;
          usage_count: number | null;
        };
        Insert: {
          category?: string | null;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          last_used_at?: string | null;
          name: string;
          organization_id: string;
          updated_at?: string;
          usage_count?: number | null;
        };
        Update: {
          category?: string | null;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          last_used_at?: string | null;
          name?: string;
          organization_id?: string;
          updated_at?: string;
          usage_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "tags_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tags_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "tags_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      team_members: {
        Row: {
          created_at: string | null;
          id: string;
          invited_at: string | null;
          invited_by: string | null;
          is_active: boolean | null;
          joined_at: string | null;
          organization_id: string;
          permissions: Json | null;
          role: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          is_active?: boolean | null;
          joined_at?: string | null;
          organization_id: string;
          permissions?: Json | null;
          role?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          is_active?: boolean | null;
          joined_at?: string | null;
          organization_id?: string;
          permissions?: Json | null;
          role?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "team_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ticket_activities: {
        Row: {
          activity_type: string;
          created_at: string | null;
          description: string;
          id: string;
          metadata: Json | null;
          organization_id: string;
          ticket_id: string;
          user_id: string | null;
        };
        Insert: {
          activity_type: string;
          created_at?: string | null;
          description: string;
          id?: string;
          metadata?: Json | null;
          organization_id: string;
          ticket_id: string;
          user_id?: string | null;
        };
        Update: {
          activity_type?: string;
          created_at?: string | null;
          description?: string;
          id?: string;
          metadata?: Json | null;
          organization_id?: string;
          ticket_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_activities_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "ticket_activities_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ticket_activities_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      ticket_comments: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          is_internal: boolean | null;
          metadata: Json | null;
          organization_id: string;
          ticket_id: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          is_internal?: boolean | null;
          metadata?: Json | null;
          organization_id: string;
          ticket_id: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          is_internal?: boolean | null;
          metadata?: Json | null;
          organization_id?: string;
          ticket_id?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_comments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "ticket_comments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      tickets: {
        Row: {
          assigned_agent_id: string | null;
          category: string | null;
          closed_at: string | null;
          conversation_id: string | null;
          created_at: string | null;
          created_by: string | null;
          customer_email: string | null;
          customer_id: string | null;
          customer_name: string | null;
          description: string | null;
          due_date: string | null;
          id: string;
          metadata: Json | null;
          organization_id: string;
          priority: string;
          resolved_at: string | null;
          status: string;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          assigned_agent_id?: string | null;
          category?: string | null;
          closed_at?: string | null;
          conversation_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          customer_email?: string | null;
          customer_id?: string | null;
          customer_name?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id: string;
          priority?: string;
          resolved_at?: string | null;
          status?: string;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          assigned_agent_id?: string | null;
          category?: string | null;
          closed_at?: string | null;
          conversation_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          customer_email?: string | null;
          customer_id?: string | null;
          customer_name?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id?: string;
          priority?: string;
          resolved_at?: string | null;
          status?: string;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_agent_id_fkey";
            columns: ["assigned_agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "tickets_assigned_agent_id_fkey";
            columns: ["assigned_agent_id"];
            isOneToOne: false;
            referencedRelation: "user_organization_info";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "tickets_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "tickets_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_organization_info";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "tickets_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "tickets_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "user_organization_info";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "tickets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "tickets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      training_datasets: {
        Row: {
          created_at: string | null;
          dataset_type: string;
          description: string | null;
          file_path: string | null;
          id: string;
          name: string;
          organization_id: string;
          record_count: number | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          dataset_type: string;
          description?: string | null;
          file_path?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          record_count?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          dataset_type?: string;
          description?: string | null;
          file_path?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          record_count?: number | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "training_datasets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "training_datasets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      typing_indicators: {
        Row: {
          conversation_id: string;
          created_at: string | null;
          current_position: number | null;
          id: string;
          is_typing: boolean | null;
          last_character_at: string | null;
          last_typing_at: string | null;
          operator_id: string;
          organization_id: string | null;
          pause_started_at: string | null;
          pause_type: string | null;
          preview_text: string | null;
          started_typing_at: string | null;
          updated_at: string | null;
          user_id: string | null;
          user_name: string | null;
          user_type: string | null;
        };
        Insert: {
          conversation_id: string;
          created_at?: string | null;
          current_position?: number | null;
          id?: string;
          is_typing?: boolean | null;
          last_character_at?: string | null;
          last_typing_at?: string | null;
          operator_id: string;
          organization_id?: string | null;
          pause_started_at?: string | null;
          pause_type?: string | null;
          preview_text?: string | null;
          started_typing_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          user_name?: string | null;
          user_type?: string | null;
        };
        Update: {
          conversation_id?: string;
          created_at?: string | null;
          current_position?: number | null;
          id?: string;
          is_typing?: boolean | null;
          last_character_at?: string | null;
          last_typing_at?: string | null;
          operator_id?: string;
          organization_id?: string | null;
          pause_started_at?: string | null;
          pause_type?: string | null;
          preview_text?: string | null;
          started_typing_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          user_name?: string | null;
          user_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "typing_indicators_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "typing_indicators_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "typing_indicators_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "typing_indicators_operator_id_fkey";
            columns: ["operator_id"];
            isOneToOne: false;
            referencedRelation: "operators";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "typing_indicators_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "typing_indicators_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          created_at: string | null;
          id: string;
          organization_id: string;
          preferences: Json;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          organization_id: string;
          preferences?: Json;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          organization_id?: string;
          preferences?: Json;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "user_preferences_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      user_presence: {
        Row: {
          created_at: string | null;
          id: string;
          last_seen_at: string | null;
          metadata: Json | null;
          organization_id: string;
          status: string;
          updated_at: string | null;
          user_id: string | null;
          user_type: string | null;
          visitor_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          last_seen_at?: string | null;
          metadata?: Json | null;
          organization_id: string;
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
          user_type?: string | null;
          visitor_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          last_seen_at?: string | null;
          metadata?: Json | null;
          organization_id?: string;
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
          user_type?: string | null;
          visitor_id?: string | null;
        };
        Relationships: [];
      };
      vector_documents: {
        Row: {
          chunk_index: number | null;
          content: string;
          created_at: string | null;
          embedding: string | null;
          id: string;
          metadata: Json | null;
          organization_id: string;
          source_id: string | null;
          source_type: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          chunk_index?: number | null;
          content: string;
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id: string;
          source_id?: string | null;
          source_type?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          chunk_index?: number | null;
          content?: string;
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id?: string;
          source_id?: string | null;
          source_type?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "vector_documents_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "vector_documents_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      webhooks: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          events: string[];
          failure_count: number | null;
          headers: Json | null;
          id: string;
          is_active: boolean | null;
          last_failure_at: string | null;
          last_success_at: string | null;
          last_triggered_at: string | null;
          name: string;
          organization_id: string;
          retry_count: number | null;
          secret: string | null;
          timeout_seconds: number | null;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          events?: string[];
          failure_count?: number | null;
          headers?: Json | null;
          id?: string;
          is_active?: boolean | null;
          last_failure_at?: string | null;
          last_success_at?: string | null;
          last_triggered_at?: string | null;
          name: string;
          organization_id: string;
          retry_count?: number | null;
          secret?: string | null;
          timeout_seconds?: number | null;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          events?: string[];
          failure_count?: number | null;
          headers?: Json | null;
          id?: string;
          is_active?: boolean | null;
          last_failure_at?: string | null;
          last_success_at?: string | null;
          last_triggered_at?: string | null;
          name?: string;
          organization_id?: string;
          retry_count?: number | null;
          secret?: string | null;
          timeout_seconds?: number | null;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "webhooks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "webhooks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "webhooks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      websocket_v2_events: {
        Row: {
          conversation_id: string | null;
          created_at: string;
          event_data: Json;
          event_id: string;
          event_type: string;
          id: string;
          organization_id: string;
          user_id: string | null;
        };
        Insert: {
          conversation_id?: string | null;
          created_at?: string;
          event_data?: Json;
          event_id: string;
          event_type: string;
          id?: string;
          organization_id: string;
          user_id?: string | null;
        };
        Update: {
          conversation_id?: string | null;
          created_at?: string;
          event_data?: Json;
          event_id?: string;
          event_type?: string;
          id?: string;
          organization_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "websocket_v2_events_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "websocket_v2_events_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "websocket_v2_events_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "websocket_v2_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "websocket_v2_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      widget_file_attachments: {
        Row: {
          conversation_id: string | null;
          created_at: string | null;
          file_path: string;
          file_size: number | null;
          filename: string;
          id: string;
          message_id: string | null;
          mime_type: string | null;
          organization_id: string;
        };
        Insert: {
          conversation_id?: string | null;
          created_at?: string | null;
          file_path: string;
          file_size?: number | null;
          filename: string;
          id?: string;
          message_id?: string | null;
          mime_type?: string | null;
          organization_id: string;
        };
        Update: {
          conversation_id?: string | null;
          created_at?: string | null;
          file_path?: string;
          file_size?: number | null;
          filename?: string;
          id?: string;
          message_id?: string | null;
          mime_type?: string | null;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "widget_file_attachments_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "widget_file_attachments_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "widget_file_attachments_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "widget_file_attachments_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "widget_file_attachments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "widget_file_attachments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      widget_read_receipts: {
        Row: {
          conversation_id: string | null;
          created_at: string | null;
          id: string;
          message_id: string | null;
          organization_id: string;
          read_at: string | null;
          user_id: string | null;
        };
        Insert: {
          conversation_id?: string | null;
          created_at?: string | null;
          id?: string;
          message_id?: string | null;
          organization_id: string;
          read_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          conversation_id?: string | null;
          created_at?: string | null;
          id?: string;
          message_id?: string | null;
          organization_id?: string;
          read_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "widget_read_receipts_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversation_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "widget_read_receipts_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "widget_read_receipts_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "unassigned_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "widget_read_receipts_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "widget_read_receipts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "widget_read_receipts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      widget_settings: {
        Row: {
          auto_open_delay_ms: number | null;
          background_color: string | null;
          border_radius: number | null;
          created_at: string | null;
          enable_sound_notifications: boolean | null;
          font_family: string | null;
          height: number | null;
          id: string;
          mailbox_id: number;
          offset_x: number | null;
          offset_y: number | null;
          organization_id: string | null;
          placeholder_text: string | null;
          position: string | null;
          primary_color: string | null;
          show_typing_indicator: boolean | null;
          text_color: string | null;
          updated_at: string | null;
          welcome_message: string | null;
          width: number | null;
        };
        Insert: {
          auto_open_delay_ms?: number | null;
          background_color?: string | null;
          border_radius?: number | null;
          created_at?: string | null;
          enable_sound_notifications?: boolean | null;
          font_family?: string | null;
          height?: number | null;
          id?: string;
          mailbox_id: number;
          offset_x?: number | null;
          offset_y?: number | null;
          organization_id?: string | null;
          placeholder_text?: string | null;
          position?: string | null;
          primary_color?: string | null;
          show_typing_indicator?: boolean | null;
          text_color?: string | null;
          updated_at?: string | null;
          welcome_message?: string | null;
          width?: number | null;
        };
        Update: {
          auto_open_delay_ms?: number | null;
          background_color?: string | null;
          border_radius?: number | null;
          created_at?: string | null;
          enable_sound_notifications?: boolean | null;
          font_family?: string | null;
          height?: number | null;
          id?: string;
          mailbox_id?: number;
          offset_x?: number | null;
          offset_y?: number | null;
          organization_id?: string | null;
          placeholder_text?: string | null;
          position?: string | null;
          primary_color?: string | null;
          show_typing_indicator?: boolean | null;
          text_color?: string | null;
          updated_at?: string | null;
          welcome_message?: string | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "widget_settings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "widget_settings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      widget_visitors: {
        Row: {
          created_at: string | null;
          id: string;
          last_seen_at: string | null;
          metadata: Json | null;
          session_id: string;
          updated_at: string | null;
          workspace_id: string;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          last_seen_at?: string | null;
          metadata?: Json | null;
          session_id: string;
          updated_at?: string | null;
          workspace_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          last_seen_at?: string | null;
          metadata?: Json | null;
          session_id?: string;
          updated_at?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "widget_visitors_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "widget_visitors_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      conversation_stats: {
        Row: {
          agent_messages: number | null;
          ai_messages: number | null;
          assigned_to: string | null;
          created_at: string | null;
          customer_email: string | null;
          customer_name: string | null;
          id: string | null;
          last_message_at: string | null;
          latest_message_at: string | null;
          organization_id: string | null;
          priority: string | null;
          resolution_time_seconds: number | null;
          response_time_seconds: number | null;
          status: string | null;
          total_messages: number | null;
          unread_messages: number | null;
          updated_at: string | null;
          visitor_messages: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "conversations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      database_health_status: {
        Row: {
          category: string | null;
          description: string | null;
          status: string | null;
        };
        Relationships: [];
      };
      onboarding_status_view: {
        Row: {
          ai_tone: string | null;
          company_size: string | null;
          completed_steps: string[] | null;
          completion_percentage: number | null;
          current_step: string | null;
          customizations_applied: boolean | null;
          dashboard_layout: string | null;
          industry: string | null;
          is_completed: boolean | null;
          onboarding_completed_at: string | null;
          onboarding_customizations_applied: boolean | null;
          organization_id: string | null;
          organization_name: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      unassigned_conversations: {
        Row: {
          ai_confidence_score: number | null;
          ai_handover_id: string | null;
          ai_handover_session_id: string | null;
          ai_persona: string | null;
          assigned_agent_id: string | null;
          assigned_at: string | null;
          assigned_operator_id: string | null;
          assigned_to: string | null;
          assigned_to_ai: boolean | null;
          assignee_id: string | null;
          avg_sentiment_score: number | null;
          created_at: string | null;
          customer: Json | null;
          customer_attributes: Json | null;
          customer_browser: string | null;
          customer_device_type: string | null;
          customer_email: string | null;
          customer_id: string | null;
          customer_ip: string | null;
          customer_location: Json | null;
          customer_message_count: number | null;
          customer_name: string | null;
          customer_os: string | null;
          customer_timezone: string | null;
          email_from: string | null;
          emailfrom: string | null;
          escalation_reason: string | null;
          first_response_at: string | null;
          has_attachments: boolean | null;
          id: string | null;
          internal_notes: string | null;
          last_message_at: string | null;
          last_message_preview: string | null;
          mailbox_id: number | null;
          metadata: Json | null;
          organization_id: string | null;
          priority: string | null;
          priority_level: number | null;
          rag_enabled: boolean | null;
          resolved_at: string | null;
          sentiment_score: number | null;
          status: string | null;
          status_reason: string | null;
          subject: string | null;
          suggested_agent_id: string | null;
          tags: string[] | null;
          ticket_id: string | null;
          unread_count: number | null;
          updated_at: string | null;
          waiting_seconds: number | null;
        };
        Insert: {
          ai_confidence_score?: number | null;
          ai_handover_id?: string | null;
          ai_handover_session_id?: string | null;
          ai_persona?: string | null;
          assigned_agent_id?: string | null;
          assigned_at?: string | null;
          assigned_operator_id?: string | null;
          assigned_to?: string | null;
          assigned_to_ai?: boolean | null;
          assignee_id?: string | null;
          avg_sentiment_score?: never;
          created_at?: string | null;
          customer?: Json | null;
          customer_attributes?: Json | null;
          customer_browser?: string | null;
          customer_device_type?: string | null;
          customer_email?: string | null;
          customer_id?: string | null;
          customer_ip?: string | null;
          customer_location?: Json | null;
          customer_message_count?: never;
          customer_name?: string | null;
          customer_os?: string | null;
          customer_timezone?: string | null;
          email_from?: string | null;
          emailfrom?: string | null;
          escalation_reason?: string | null;
          first_response_at?: string | null;
          has_attachments?: never;
          id?: string | null;
          internal_notes?: string | null;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          mailbox_id?: number | null;
          metadata?: Json | null;
          organization_id?: string | null;
          priority?: string | null;
          priority_level?: number | null;
          rag_enabled?: boolean | null;
          resolved_at?: string | null;
          sentiment_score?: number | null;
          status?: string | null;
          status_reason?: string | null;
          subject?: string | null;
          suggested_agent_id?: never;
          tags?: string[] | null;
          ticket_id?: string | null;
          unread_count?: number | null;
          updated_at?: string | null;
          waiting_seconds?: never;
        };
        Update: {
          ai_confidence_score?: number | null;
          ai_handover_id?: string | null;
          ai_handover_session_id?: string | null;
          ai_persona?: string | null;
          assigned_agent_id?: string | null;
          assigned_at?: string | null;
          assigned_operator_id?: string | null;
          assigned_to?: string | null;
          assigned_to_ai?: boolean | null;
          assignee_id?: string | null;
          avg_sentiment_score?: never;
          created_at?: string | null;
          customer?: Json | null;
          customer_attributes?: Json | null;
          customer_browser?: string | null;
          customer_device_type?: string | null;
          customer_email?: string | null;
          customer_id?: string | null;
          customer_ip?: string | null;
          customer_location?: Json | null;
          customer_message_count?: never;
          customer_name?: string | null;
          customer_os?: string | null;
          customer_timezone?: string | null;
          email_from?: string | null;
          emailfrom?: string | null;
          escalation_reason?: string | null;
          first_response_at?: string | null;
          has_attachments?: never;
          id?: string | null;
          internal_notes?: string | null;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          mailbox_id?: number | null;
          metadata?: Json | null;
          organization_id?: string | null;
          priority?: string | null;
          priority_level?: number | null;
          rag_enabled?: boolean | null;
          resolved_at?: string | null;
          sentiment_score?: number | null;
          status?: string | null;
          status_reason?: string | null;
          subject?: string | null;
          suggested_agent_id?: never;
          tags?: string[] | null;
          ticket_id?: string | null;
          unread_count?: number | null;
          updated_at?: string | null;
          waiting_seconds?: never;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_operator_id_fkey";
            columns: ["assigned_operator_id"];
            isOneToOne: false;
            referencedRelation: "operators";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_mailbox_id_fkey";
            columns: ["mailbox_id"];
            isOneToOne: false;
            referencedRelation: "mailboxes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "conversations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      user_organization_info: {
        Row: {
          email: string | null;
          full_name: string | null;
          membership_created_at: string | null;
          organization_id: string | null;
          organization_name: string | null;
          organization_slug: string | null;
          role: string | null;
          status: string | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "onboarding_status_view";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      add_organization_to_jwt_claims: {
        Args: { user_id: string };
        Returns: undefined;
      };
      array_remove_all: {
        Args: { arr: string[]; elements: string[] };
        Returns: string[];
      };
      assign_conversation_to_available_agent: {
        Args: { p_conversation_id: string; p_organization_id: string };
        Returns: string;
      };
      batch_add_tags: {
        Args: { p_conversation_ids: string[]; p_tags: string[] };
        Returns: {
          conversation_id: string;
          tags_added: string[];
          total_tags: string[];
        }[];
      };
      batch_assign_conversations: {
        Args: { p_assignments: Json[] };
        Returns: {
          conversation_id: string;
          assigned_to: string;
          assignment_note: string;
          success: boolean;
          error: string;
        }[];
      };
      batch_create_notifications: {
        Args: { p_notifications: Json[] };
        Returns: {
          notification_id: string;
          user_id: string;
          created: boolean;
        }[];
      };
      batch_insert_messages: {
        Args: { p_messages: Json[] };
        Returns: {
          message_id: string;
          success: boolean;
          error: string;
        }[];
      };
      batch_log_analytics_events: {
        Args: { p_events: Json[] };
        Returns: number;
      };
      batch_mark_notifications_read: {
        Args: { p_notification_ids: string[]; p_user_id: string };
        Returns: number;
      };
      batch_remove_tags: {
        Args: { p_conversation_ids: string[]; p_tags: string[] };
        Returns: {
          conversation_id: string;
          tags_removed: string[];
          remaining_tags: string[];
        }[];
      };
      batch_search_conversations: {
        Args: { p_organization_id: string; p_search_queries: Json[] };
        Returns: {
          query_id: number;
          conversation_id: string;
          relevance_score: number;
          matched_fields: string[];
        }[];
      };
      batch_update_conversation_status: {
        Args: {
          p_conversation_ids: string[];
          p_status: string;
          p_user_id: string;
          p_resolution_note?: string;
        };
        Returns: {
          conversation_id: string;
          old_status: string;
          new_status: string;
          updated: boolean;
        }[];
      };
      binary_quantize: {
        Args: { "": string } | { "": unknown };
        Returns: unknown;
      };
      calculate_typing_duration: {
        Args: { message_text: string; wpm?: number; variance?: number };
        Returns: number;
      };
      cleanup_stale_channels: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      cleanup_stale_typing_indicators: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      cleanup_typing_indicators: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      custom_access_token_hook: {
        Args: { event: Json };
        Returns: Json;
      };
      debug_realtime_access: {
        Args: { user_id_param: string; organization_id_param: string };
        Returns: {
          check_name: string;
          result: boolean;
          details: string;
        }[];
      };
      ensure_organization_consistency: {
        Args: Record<PropertyKey, never>;
        Returns: {
          table_name: string;
          inconsistent_count: number;
        }[];
      };
      fix_organization_consistency: {
        Args: Record<PropertyKey, never>;
        Returns: {
          table_name: string;
          fixed_count: number;
        }[];
      };
      get_channel_stats: {
        Args: { p_organization_id: string };
        Returns: {
          channel_name: string;
          channel_type: string;
          subscriber_count: number;
          last_activity: string;
        }[];
      };
      get_conversation_timeline: {
        Args: { p_conversation_id: string; p_limit?: number };
        Returns: {
          event_type: string;
          event_time: string;
          actor_name: string;
          actor_role: string;
          description: string;
          metadata: Json;
        }[];
      };
      get_inbox_conversations: {
        Args: {
          p_organization_id: string;
          p_status?: string[];
          p_assigned_to?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          conversation_id: string;
          customer_name: string;
          customer_email: string;
          customer_avatar: string;
          status: string;
          priority: string;
          assigned_to: string;
          assigned_agent_name: string;
          created_at: string;
          updated_at: string;
          last_message_at: string;
          unread_count: number;
          last_message_preview: string;
          last_message_sender_type: string;
          tags: string[];
        }[];
      };
      get_organization_settings: {
        Args: { org_id: string };
        Returns: {
          ai_handover_enabled: boolean | null;
          auto_assign_enabled: boolean | null;
          business_hours: Json | null;
          created_at: string | null;
          id: string;
          notification_settings: Json | null;
          organization_id: string;
          rag_enabled: boolean | null;
          real_time_typing_enabled: boolean | null;
          updated_at: string | null;
          widget_enabled: boolean | null;
        };
      };
      get_organization_unread_count: {
        Args: { org_id: string };
        Returns: number;
      };
      get_user_available_organizations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          organization_id: string;
          organization_name: string;
          organization_slug: string;
          role: string;
          status: string;
          permissions: Json;
          is_current: boolean;
        }[];
      };
      get_user_organizations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          organization_id: string;
        }[];
      };
      halfvec_avg: {
        Args: { "": number[] };
        Returns: unknown;
      };
      halfvec_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      halfvec_send: {
        Args: { "": unknown };
        Returns: string;
      };
      halfvec_typmod_in: {
        Args: { "": unknown[] };
        Returns: number;
      };
      hnsw_bit_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      hnsw_halfvec_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      hnsw_sparsevec_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      hnswhandler: {
        Args: { "": unknown };
        Returns: unknown;
      };
      ivfflat_bit_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      ivfflat_halfvec_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      ivfflathandler: {
        Args: { "": unknown };
        Returns: unknown;
      };
      l2_norm: {
        Args: { "": unknown } | { "": unknown };
        Returns: number;
      };
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown };
        Returns: string;
      };
      mark_conversation_read: {
        Args: { conv_id: string };
        Returns: Json;
      };
      mark_messages_as_read: {
        Args: { p_conversation_id: string; p_user_id: string };
        Returns: number;
      };
      mark_messages_read: {
        Args: { p_conversation_id: number; p_user_id?: string };
        Returns: undefined;
      };
      queue_realtime_message: {
        Args: {
          p_organization_id: string;
          p_channel_type: string;
          p_resource_id: string;
          p_event_name: string;
          p_payload: Json;
          p_priority?: string;
        };
        Returns: string;
      };
      refresh_agent_workload: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      refresh_conversation_stats: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      search_knowledge_base: {
        Args: { search_query: string; org_id: string; match_count?: number };
        Returns: {
          id: string;
          title: string;
          content: string;
          summary: string;
          category_name: string;
          rank: number;
        }[];
      };
      search_knowledge_chunks: {
        Args: {
          query_embedding: string;
          org_id: string;
          limit_count?: number;
          similarity_threshold?: number;
        };
        Returns: {
          id: string;
          content: string;
          document_title: string;
          source_type: string;
          source_id: string;
          metadata: Json;
          similarity: number;
          chunk_index: number;
        }[];
      };
      search_knowledge_chunks_legacy: {
        Args: { query_embedding: string; org_id: string; limit_count?: number };
        Returns: {
          id: string;
          content: string;
          similarity: number;
        }[];
      };
      search_similar_documents: {
        Args: {
          query_embedding: string;
          org_id: string;
          match_threshold?: number;
          match_count?: number;
        };
        Returns: {
          id: string;
          title: string;
          content: string;
          metadata: Json;
          similarity: number;
        }[];
      };
      set_active_organization: {
        Args: { target_organization_id: string };
        Returns: Json;
      };
      sparsevec_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      sparsevec_send: {
        Args: { "": unknown };
        Returns: string;
      };
      sparsevec_typmod_in: {
        Args: { "": unknown[] };
        Returns: number;
      };
      update_channel_activity: {
        Args: {
          p_organization_id: string;
          p_channel_name: string;
          p_channel_type?: string;
          p_resource_id?: string;
          p_metadata?: Json;
        };
        Returns: undefined;
      };
      user_exists: {
        Args: { user_id: string };
        Returns: boolean;
      };
      vector_avg: {
        Args: { "": number[] };
        Returns: string;
      };
      vector_dims: {
        Args: { "": string } | { "": unknown };
        Returns: number;
      };
      vector_norm: {
        Args: { "": string };
        Returns: number;
      };
      vector_out: {
        Args: { "": string };
        Returns: unknown;
      };
      vector_send: {
        Args: { "": string };
        Returns: string;
      };
      vector_typmod_in: {
        Args: { "": unknown[] };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
