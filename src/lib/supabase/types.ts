// Import centralized types for consistency
import type {
  Agent as CentralizedAgent,
  Conversation as CentralizedConversation,
  Message as CentralizedMessage,
  User as CentralizedUser,
} from "@/types/entities";

/**
 * Updated Supabase TypeScript Types
 *
 * Generated based on actual database schema for Campfire RAG Operator
 * These types provide full type safety for all Supabase operations
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      // Core Organization & User Management
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: "owner" | "admin" | "agent" | "member";
          status: "pending" | "active" | "inactive";
          mailbox_id: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: "owner" | "admin" | "agent" | "member";
          status?: "pending" | "active" | "inactive";
          mailbox_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "agent" | "member";
          status?: "pending" | "active" | "inactive";
          mailbox_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };

      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          fullName: string;
          avatar_url: string | null;
          organization_id: string | null;
          role: "visitor" | "agent" | "admin" | "owner";
          onboarding_status:
            | "pending_profile"
            | "pending_organization"
            | "pending_verification"
            | "completed"
            | "skipped"
            | "in_progress";
          company_size:
            | "size_1_5"
            | "size_6_15"
            | "size_16_49"
            | "size_50_199"
            | "size_200_999"
            | "size_1000_plus"
            | null;
          use_case: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          fullName: string;
          avatar_url?: string | null;
          organization_id?: string | null;
          role?: "visitor" | "agent" | "admin" | "owner";
          onboarding_status?:
            | "pending_profile"
            | "pending_organization"
            | "pending_verification"
            | "completed"
            | "skipped"
            | "in_progress";
          company_size?:
            | "size_1_5"
            | "size_6_15"
            | "size_16_49"
            | "size_50_199"
            | "size_200_999"
            | "size_1000_plus"
            | null;
          use_case?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          organization_id?: string | null;
          role?: "visitor" | "agent" | "admin" | "owner";
          onboarding_status?:
            | "pending_profile"
            | "pending_organization"
            | "pending_verification"
            | "completed"
            | "skipped"
            | "in_progress";
          company_size?:
            | "size_1_5"
            | "size_6_15"
            | "size_16_49"
            | "size_50_199"
            | "size_200_999"
            | "size_1000_plus"
            | null;
          use_case?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      // Conversation Management
      conversations: {
        Row: {
          id: string;
          organization_id: string;
          customerEmail: string;
          subject: string | null;
          status: "open" | "closed" | "active" | "escalated";
          priority: "low" | "medium" | "high" | "urgent" | null;
          assignee_type: string | null;
          assignee_id: string | null;
          first_response_time: string | null;
          ai_handover_active: boolean | null;
          ai_handover_session_id: string | null;
          ai_confidence_score: number | null;
          rag_enabled: boolean | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
          lastMessageAt: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customerEmail: string;
          subject?: string | null;
          status?: "open" | "closed" | "active" | "escalated";
          priority?: "low" | "medium" | "high" | "urgent" | null;
          assignee_type?: string | null;
          assignee_id?: string | null;
          first_response_time?: string | null;
          ai_handover_active?: boolean | null;
          ai_handover_session_id?: string | null;
          ai_confidence_score?: number | null;
          rag_enabled?: boolean | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          customer_email?: string;
          subject?: string | null;
          status?: "open" | "closed" | "active" | "escalated";
          priority?: "low" | "medium" | "high" | "urgent" | null;
          assignee_type?: string | null;
          assignee_id?: string | null;
          first_response_time?: string | null;
          ai_handover_active?: boolean | null;
          ai_handover_session_id?: string | null;
          ai_confidence_score?: number | null;
          rag_enabled?: boolean | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      messages: {
        Row: {
          id: string;
          conversation_id: string;
          organization_id: string;
          content: string;
          senderType: "user" | "system" | "agent" | "bot" | "visitor" | "customer" | "ai" | "rag";
          senderId: string | null;
          message_type: "text" | "image" | "file" | "system" | "notification" | "action" | "automated";
          metadata: Json | null;
          ai_confidence: number | null;
          ai_sources: Json | null;
          is_deleted: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          organization_id: string;
          content: string;
          senderType: "user" | "system" | "agent" | "bot" | "visitor" | "customer" | "ai" | "rag";
          sender_id?: string | null;
          message_type?: "text" | "image" | "file" | "system" | "notification" | "action" | "automated";
          metadata?: Json | null;
          ai_confidence?: number | null;
          ai_sources?: Json | null;
          is_deleted?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          organization_id?: string;
          content?: string;
          sender_type?: "user" | "system" | "agent" | "bot" | "visitor" | "customer" | "ai" | "rag";
          sender_id?: string | null;
          message_type?: "text" | "image" | "file" | "system" | "notification" | "action" | "automated";
          metadata?: Json | null;
          ai_confidence?: number | null;
          ai_sources?: Json | null;
          is_deleted?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      // AI & RAG System
      ai_sessions: {
        Row: {
          id: string;
          conversation_id: string;
          organization_id: string;
          persona: string | null;
          confidence_threshold: number | null;
          sessionMetadata: Json | null;
          status: "active" | "completed" | "expired" | "failed";
          expiresAt: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          organization_id: string;
          persona?: string | null;
          confidence_threshold?: number | null;
          session_metadata?: Json | null;
          status?: "active" | "completed" | "expired" | "failed";
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          organization_id?: string;
          persona?: string | null;
          confidence_threshold?: number | null;
          session_metadata?: Json | null;
          status?: "active" | "completed" | "expired" | "failed";
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_sessions_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_sessions_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      campfire_handoffs: {
        Row: {
          id: string;
          conversation_id: string;
          organization_id: string;
          state:
            | "ai_active"
            | "requesting_agent"
            | "agent_notified"
            | "agent_joining"
            | "agent_active"
            | "handover_complete"
            | "cancelled";
          priority: "low" | "medium" | "high" | "urgent";
          context: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          organization_id: string;
          state?:
            | "ai_active"
            | "requesting_agent"
            | "agent_notified"
            | "agent_joining"
            | "agent_active"
            | "handover_complete"
            | "cancelled";
          priority?: "low" | "medium" | "high" | "urgent";
          context?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          organization_id?: string;
          state?:
            | "ai_active"
            | "requesting_agent"
            | "agent_notified"
            | "agent_joining"
            | "agent_active"
            | "handover_complete"
            | "cancelled";
          priority?: "low" | "medium" | "high" | "urgent";
          context?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campfire_handoffs_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campfire_handoffs_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      knowledge_documents: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          content: string;
          metadata: Json | null;
          source_url: string | null;
          embedding: number[] | null;
          chunk_index: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          content: string;
          metadata?: Json | null;
          source_url?: string | null;
          embedding?: number[] | null;
          chunk_index?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          content?: string;
          metadata?: Json | null;
          source_url?: string | null;
          embedding?: number[] | null;
          chunk_index?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      // Realtime & Communication
      typing_indicators: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          userName: string | null;
          isTyping: boolean;
          lastActivity: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          user_name?: string | null;
          is_typing?: boolean;
          last_activity?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          user_name?: string | null;
          is_typing?: boolean;
          last_activity?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "typing_indicators_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };

      // File Management
      conversation_files: {
        Row: {
          id: string;
          conversation_id: string;
          organization_id: string;
          uploaded_by: string;
          file_name: string;
          file_path: string;
          file_size: number;
          file_type: string;
          public_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          organization_id: string;
          uploaded_by: string;
          file_name: string;
          file_path: string;
          file_size: number;
          file_type: string;
          public_url: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          organization_id?: string;
          uploaded_by?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          file_type?: string;
          public_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_files_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_files_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_files_uploaded_by_fkey";
            columns: ["uploaded_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // AI System Tables
      ai_processing_logs: {
        Row: {
          id: string;
          organization_id: string;
          conversation_id: string | null;
          model: string;
          tokens_input: number;
          tokens_output: number;
          cost: number;
          latency_ms: number;
          status: string;
          error: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          conversation_id?: string | null;
          model: string;
          tokens_input: number;
          tokens_output: number;
          cost: number;
          latency_ms: number;
          status?: string;
          error?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          conversation_id?: string | null;
          model?: string;
          tokens_input?: number;
          tokens_output?: number;
          cost?: number;
          latency_ms?: number;
          status?: string;
          error?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_processing_logs_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_processing_logs_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };

      ai_feedback: {
        Row: {
          id: string;
          organization_id: string;
          conversation_id: string;
          message_id: string;
          rating: number;
          feedback_type: string;
          feedback_text: string | null;
          createdBy: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          conversation_id: string;
          message_id: string;
          rating: number;
          feedback_type: string;
          feedback_text?: string | null;
          createdBy: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          conversation_id?: string;
          message_id?: string;
          rating?: number;
          feedback_type?: string;
          feedback_text?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_feedback_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_feedback_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_feedback_message_id_fkey";
            columns: ["message_id"];
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };

      ai_insights: {
        Row: {
          id: string;
          organization_id: string;
          insight_type: string;
          title: string;
          description: string;
          data: Json;
          severity: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          insight_type: string;
          title: string;
          description: string;
          data: Json;
          severity?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          insight_type?: string;
          title?: string;
          description?: string;
          data?: Json;
          severity?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_insights_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      ai_handovers: {
        Row: {
          id: string;
          conversation_id: string;
          organization_id: string;
          status: string;
          reason: string;
          confidence_score: number;
          created_at: string;
          completedAt: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          organization_id: string;
          status?: string;
          reason: string;
          confidence_score: number;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          organization_id?: string;
          status?: string;
          reason?: string;
          confidence_score?: number;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_handovers_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_handovers_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      // Activity & Events
      activity_events: {
        Row: {
          id: string;
          organization_id: string;
          actor_id: string | null;
          actor_type: string;
          action: string;
          resource_type: string;
          resource_id: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          actor_id?: string | null;
          actor_type: string;
          action: string;
          resource_type: string;
          resource_id: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          actor_id?: string | null;
          actor_type?: string;
          action?: string;
          resource_type?: string;
          resource_id?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_events_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      // Agent Management
      agents: {
        Row: {
          id: string;
          organization_id: string;
          profile_id: string;
          status: "available" | "busy" | "away" | "offline";
          lastSeenAt: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          profile_id: string;
          status?: "available" | "busy" | "away" | "offline";
          last_seen_at?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          profile_id?: string;
          status?: "available" | "busy" | "away" | "offline";
          last_seen_at?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agents_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agents_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      agent_availability: {
        Row: {
          id: string;
          agent_id: string;
          organization_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          organization_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          organization_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_availability_agent_id_fkey";
            columns: ["agent_id"];
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_availability_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      // Organization Settings
      organization_settings: {
        Row: {
          id: string;
          organization_id: string;
          real_time_typing_enabled: boolean | null;
          auto_assign_enabled: boolean | null;
          rag_enabled: boolean | null;
          ai_handover_enabled: boolean | null;
          widget_enabled: boolean | null;
          notification_settings: Json | null;
          business_hours: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          real_time_typing_enabled?: boolean | null;
          auto_assign_enabled?: boolean | null;
          rag_enabled?: boolean | null;
          ai_handover_enabled?: boolean | null;
          widget_enabled?: boolean | null;
          notification_settings?: Json | null;
          business_hours?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          real_time_typing_enabled?: boolean | null;
          auto_assign_enabled?: boolean | null;
          rag_enabled?: boolean | null;
          ai_handover_enabled?: boolean | null;
          widget_enabled?: boolean | null;
          notification_settings?: Json | null;
          business_hours?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views: {
      // Add any database views here if they exist
    };

    Functions: {
      // RLS and utility functions
      get_user_organization_ids_secure: {
        Args: Record<string, never>;
        Returns: string[];
      };
      user_can_access_organization: {
        Args: { org_id: string };
        Returns: boolean;
      };
      user_can_access_dashboard_data: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
      get_dashboard_boot: {
        Args: { _user_id: string };
        Returns: Json;
      };
      get_user_dashboard_data: {
        Args: { p_user_id: string; p_conversation_limit?: number };
        Returns: Json;
      };
      get_organization_settings: {
        Args: { org_id: string };
        Returns: Database["public"]["Tables"]["organization_settings"]["Row"];
      };
      get_active_ai_session: {
        Args: { p_conversation_id: string };
        Returns: {
          session_id: string;
          organization_id: string;
          persona: string;
          confidence_threshold: number;
          sessionMetadata: Json;
          created_at: string;
        }[];
      };
      cleanup_expired_ai_sessions: {
        Args: Record<string, never>;
        Returns: number;
      };
      cleanup_expired_typing_indicators: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_conversation_context: {
        Args: { p_conversation_id: string; p_message_limit?: number };
        Returns: Json;
      };
      get_conversation_messages: {
        Args: { p_conversation_id: string; p_limit?: number; p_offset?: number };
        Returns: {
          id: string;
          content: string;
          senderType: string;
          senderId: string;
          created_at: string;
          message_type: string;
          metadata: Json;
          ai_confidence: number;
          ai_sources: Json;
        }[];
      };
    };

    Enums: {
      ProfileRole: "visitor" | "agent" | "admin" | "owner";
      OnboardingStatus:
        | "pending_profile"
        | "pending_organization"
        | "pending_verification"
        | "completed"
        | "skipped"
        | "in_progress";
      CompanySize: "size_1_5" | "size_6_15" | "size_16_49" | "size_50_199" | "size_200_999" | "size_1000_plus";
      SenderType: "user" | "system" | "agent" | "bot" | "visitor" | "customer" | "ai" | "rag";
      MessageType: "text" | "image" | "file" | "system" | "notification" | "action" | "automated";
      TicketPriority: "low" | "medium" | "high" | "urgent";
      HandoverState:
        | "ai_active"
        | "requesting_agent"
        | "agent_notified"
        | "agent_joining"
        | "agent_active"
        | "handover_complete"
        | "cancelled";
      AgentStatus: "available" | "busy" | "away" | "offline";
    };

    CompositeTypes: {
      // Add any composite types here if they exist
    };
  };
}

// Helper Types for commonly used patterns
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];

// Commonly used type aliases
export type Organization = Tables<"organizations">;
export type Profile = Tables<"profiles">;
export type Conversation = Tables<"conversations">;
export type Message = Tables<"messages">;
export type AISession = Tables<"ai_sessions">;
export type CampfireHandoff = Tables<"campfire_handoffs">;
export type KnowledgeDocument = Tables<"knowledge_documents">;
export type TypingIndicator = Tables<"typing_indicators">;
export type OrganizationSettings = Tables<"organization_settings">;
export type OrganizationMember = Tables<"organization_members">;
export type ConversationFile = Tables<"conversation_files">;
export type AIProcessingLog = Tables<"ai_processing_logs">;
export type AIFeedback = Tables<"ai_feedback">;
export type AIInsight = Tables<"ai_insights">;
export type AIHandover = Tables<"ai_handovers">;
export type ActivityEvent = Tables<"activity_events">;
export type Agent = Tables<"agents">;
export type AgentAvailability = Tables<"agent_availability">;

// Insert/Update type aliases
export type OrganizationInsert = TablesInsert<"organizations">;
export type ConversationInsert = TablesInsert<"conversations">;
export type MessageInsert = TablesInsert<"messages">;
export type ProfileUpdate = TablesUpdate<"profiles">;

// Enum type aliases
export type ProfileRole = Enums<"ProfileRole">;
export type SenderType = Enums<"SenderType">;
export type MessageType = Enums<"MessageType">;
export type HandoverState = Enums<"HandoverState">;
export type TicketPriority = Enums<"TicketPriority">;

// Function return types
export type DashboardData = Database["public"]["Functions"]["get_user_dashboard_data"]["Returns"];
// Export User type for external use
export type User = CentralizedUser;
export type ConversationContext = Database["public"]["Functions"]["get_conversation_context"]["Returns"];
export type ConversationMessages = Database["public"]["Functions"]["get_conversation_messages"]["Returns"];

// Re-export for compatibility
export type { Database as SupabaseDatabase };
