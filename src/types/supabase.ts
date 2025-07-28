export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agents: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          metadata: Json | null
          name: string
          organization_id: string
          role: string | null
          status: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name: string
          organization_id: string
          role?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          organization_id?: string
          role?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_processing_logs: {
        Row: {
          agent_id: string | null
          ai_session_id: string | null
          conversation_id: string
          cost_usd: number | null
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          message_id: string | null
          organization_id: string
          processing_time_ms: number | null
          status: string
          tokens_used: number | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          ai_session_id?: string | null
          conversation_id: string
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          message_id?: string | null
          organization_id: string
          processing_time_ms?: number | null
          status?: string
          tokens_used?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          ai_session_id?: string | null
          conversation_id?: string
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          message_id?: string | null
          organization_id?: string
          processing_time_ms?: number | null
          status?: string
          tokens_used?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_processing_logs_ai_session_id_fkey"
            columns: ["ai_session_id"]
            isOneToOne: false
            referencedRelation: "ai_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_processing_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_processing_logs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_processing_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_processing_logs_agent_id"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sessions: {
        Row: {
          agent_id: string | null
          ai_model: string | null
          ai_persona: string | null
          confidence_threshold: number | null
          conversation_id: string
          cost_usd: number | null
          created_at: string | null
          ended_at: string | null
          id: string
          organization_id: string
          session_metadata: Json | null
          session_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          ai_model?: string | null
          ai_persona?: string | null
          confidence_threshold?: number | null
          conversation_id: string
          cost_usd?: number | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          organization_id: string
          session_metadata?: Json | null
          session_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          ai_model?: string | null
          ai_persona?: string | null
          confidence_threshold?: number | null
          conversation_id?: string
          cost_usd?: number | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          organization_id?: string
          session_metadata?: Json | null
          session_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_sessions_agent_id"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          file_size: number
          filename: string
          id: string
          message_id: string | null
          metadata: Json | null
          mime_type: string
          organization_id: string
          original_filename: string
          storage_path: string
          updated_at: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          file_size: number
          filename: string
          id?: string
          message_id?: string | null
          metadata?: Json | null
          mime_type: string
          organization_id: string
          original_filename: string
          storage_path: string
          updated_at?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          file_size?: number
          filename?: string
          id?: string
          message_id?: string | null
          metadata?: Json | null
          mime_type?: string
          organization_id?: string
          original_filename?: string
          storage_path?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_summaries: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          key_points: string[] | null
          organization_id: string
          sentiment: string | null
          sentiment_confidence: number | null
          summary: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          key_points?: string[] | null
          organization_id: string
          sentiment?: string | null
          sentiment_confidence?: number | null
          summary: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          key_points?: string[] | null
          organization_id?: string
          sentiment?: string | null
          sentiment_confidence?: number | null
          summary?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_summaries_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_summaries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_id: string | null
          ai_confidence_score: number | null
          ai_handover_active: boolean | null
          ai_persona: string | null
          assigned_at: string | null
          assigned_to_user_id: string | null
          assignment_metadata: Json | null
          closed_at: string | null
          created_at: string | null
          customer: Json | null
          customer_browser: string | null
          customer_device_type: string | null
          customer_email: string | null
          customer_id: string | null
          customer_ip: unknown | null
          customer_name: string | null
          customer_online: boolean | null
          customer_os: string | null
          customer_verified: boolean | null
          id: string
          last_message_at: string | null
          mailbox_id: number | null
          metadata: Json | null
          organization_id: string
          priority: string | null
          rag_enabled: boolean | null
          status: string | null
          subject: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          ai_confidence_score?: number | null
          ai_handover_active?: boolean | null
          ai_persona?: string | null
          assigned_at?: string | null
          assigned_to_user_id?: string | null
          assignment_metadata?: Json | null
          closed_at?: string | null
          created_at?: string | null
          customer?: Json | null
          customer_browser?: string | null
          customer_device_type?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_ip?: unknown | null
          customer_name?: string | null
          customer_online?: boolean | null
          customer_os?: string | null
          customer_verified?: boolean | null
          id?: string
          last_message_at?: string | null
          mailbox_id?: number | null
          metadata?: Json | null
          organization_id: string
          priority?: string | null
          rag_enabled?: boolean | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          ai_confidence_score?: number | null
          ai_handover_active?: boolean | null
          ai_persona?: string | null
          assigned_at?: string | null
          assigned_to_user_id?: string | null
          assignment_metadata?: Json | null
          closed_at?: string | null
          created_at?: string | null
          customer?: Json | null
          customer_browser?: string | null
          customer_device_type?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_ip?: unknown | null
          customer_name?: string | null
          customer_online?: boolean | null
          customer_os?: string | null
          customer_verified?: boolean | null
          id?: string
          last_message_at?: string | null
          mailbox_id?: number | null
          metadata?: Json | null
          organization_id?: string
          priority?: string | null
          rag_enabled?: boolean | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_mailbox_id_fkey"
            columns: ["mailbox_id"]
            isOneToOne: false
            referencedRelation: "mailboxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      escalations: {
        Row: {
          acknowledged_at: string | null
          ai_confidence_score: number | null
          conversation_id: string
          created_at: string | null
          escalated_at: string | null
          escalated_by_ai: boolean | null
          escalated_by_user_id: string | null
          escalated_to_agent_id: string | null
          escalation_reason: string
          escalation_type: string
          handover_context: Json | null
          id: string
          message_id: string | null
          organization_id: string
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          ai_confidence_score?: number | null
          conversation_id: string
          created_at?: string | null
          escalated_at?: string | null
          escalated_by_ai?: boolean | null
          escalated_by_user_id?: string | null
          escalated_to_agent_id?: string | null
          escalation_reason: string
          escalation_type: string
          handover_context?: Json | null
          id?: string
          message_id?: string | null
          organization_id: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          ai_confidence_score?: number | null
          conversation_id?: string
          created_at?: string | null
          escalated_at?: string | null
          escalated_by_ai?: boolean | null
          escalated_by_user_id?: string | null
          escalated_to_agent_id?: string | null
          escalation_reason?: string
          escalation_type?: string
          handover_context?: Json | null
          id?: string
          message_id?: string | null
          organization_id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          organization_id: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          organization_id: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          organization_id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faq_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          document_id: string
          embedding: string | null
          id: string
          metadata: Json | null
          organization_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          category: string | null
          content: string
          content_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          metadata: Json | null
          organization_id: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          organization_id: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          organization_id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mailboxes: {
        Row: {
          agent_id: string | null
          auto_assignment: boolean | null
          created_at: string | null
          description: string | null
          gmail_support_email_id: string | null
          id: number
          max_queue_size: number | null
          name: string
          organization_id: string
          settings: Json | null
          slug: string
          updated_at: string | null
          widget_hmac_secret: string | null
        }
        Insert: {
          agent_id?: string | null
          auto_assignment?: boolean | null
          created_at?: string | null
          description?: string | null
          gmail_support_email_id?: string | null
          id?: number
          max_queue_size?: number | null
          name: string
          organization_id: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
          widget_hmac_secret?: string | null
        }
        Update: {
          agent_id?: string | null
          auto_assignment?: boolean | null
          created_at?: string | null
          description?: string | null
          gmail_support_email_id?: string | null
          id?: number
          max_queue_size?: number | null
          name?: string
          organization_id?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
          widget_hmac_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mailboxes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          organization_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          organization_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          organization_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          agent_id: string | null
          ai_metadata: Json | null
          attachments: Json | null
          confidence_score: number | null
          content: string
          content_type: string | null
          conversation_id: string
          created_at: string | null
          edited_at: string | null
          escalation_required: boolean | null
          id: string
          is_deleted: boolean | null
          is_internal: boolean | null
          is_private: boolean | null
          message_type: string | null
          metadata: Json | null
          organization_id: string
          sender_email: string | null
          sender_id: string | null
          sender_name: string | null
          sender_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          ai_metadata?: Json | null
          attachments?: Json | null
          confidence_score?: number | null
          content: string
          content_type?: string | null
          conversation_id: string
          created_at?: string | null
          edited_at?: string | null
          escalation_required?: boolean | null
          id?: string
          is_deleted?: boolean | null
          is_internal?: boolean | null
          is_private?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          organization_id: string
          sender_email?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sender_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          ai_metadata?: Json | null
          attachments?: Json | null
          confidence_score?: number | null
          content?: string
          content_type?: string | null
          conversation_id?: string
          created_at?: string | null
          edited_at?: string | null
          escalation_required?: boolean | null
          id?: string
          is_deleted?: boolean | null
          is_internal?: boolean | null
          is_private?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          organization_id?: string
          sender_email?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sender_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_completion_tracking: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          organization_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          organization_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_completion_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          permissions: Json | null
          role: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          permissions?: Json | null
          role?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          permissions?: Json | null
          role?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          agent_id: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          name: string
          settings: Json | null
          slug: string
          status: string | null
          updated_at: string | null
          widget_api_key: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          name: string
          settings?: Json | null
          slug: string
          status?: string | null
          updated_at?: string | null
          widget_api_key?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
          status?: string | null
          updated_at?: string | null
          widget_api_key?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_chat_count: number | null
          email: string
          full_name: string | null
          id: string
          is_online: boolean | null
          last_seen_at: string | null
          max_concurrent_chats: number | null
          metadata: Json | null
          organization_id: string | null
          role: string | null
          status: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_chat_count?: number | null
          email: string
          full_name?: string | null
          id?: string
          is_online?: boolean | null
          last_seen_at?: string | null
          max_concurrent_chats?: number | null
          metadata?: Json | null
          organization_id?: string | null
          role?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_chat_count?: number | null
          email?: string
          full_name?: string | null
          id?: string
          is_online?: boolean | null
          last_seen_at?: string | null
          max_concurrent_chats?: number | null
          metadata?: Json | null
          organization_id?: string | null
          role?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          applied_at: string | null
          description: string | null
          version: string
        }
        Insert: {
          applied_at?: string | null
          description?: string | null
          version: string
        }
        Update: {
          applied_at?: string | null
          description?: string | null
          version?: string
        }
        Relationships: []
      }
      sla_tracking: {
        Row: {
          assigned_agent_id: string | null
          breach_time: string | null
          category: string | null
          conversation_id: string | null
          created_at: string | null
          end_time: string | null
          id: string
          notes: string | null
          organization_id: string
          priority: string | null
          sla_type: string
          start_time: string
          status: string
          target_time_minutes: number
          updated_at: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          breach_time?: string | null
          category?: string | null
          conversation_id?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          priority?: string | null
          sla_type: string
          start_time?: string
          status?: string
          target_time_minutes: number
          updated_at?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          breach_time?: string | null
          category?: string | null
          conversation_id?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          priority?: string | null
          sla_type?: string
          start_time?: string
          status?: string
          target_time_minutes?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sla_tracking_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_indicators: {
        Row: {
          conversation_id: string
          id: string
          is_typing: boolean | null
          organization_id: string
          started_at: string | null
          updated_at: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          conversation_id: string
          id?: string
          is_typing?: boolean | null
          organization_id: string
          started_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          conversation_id?: string
          id?: string
          is_typing?: boolean | null
          organization_id?: string
          started_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_indicators_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempts: number | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          event_type: string
          id: string
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          status: string | null
          webhook_id: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          next_retry_at?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          status?: string | null
          webhook_id: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          agent_id: string | null
          created_at: string | null
          events: string[]
          headers: Json | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          retry_count: number | null
          secret: string | null
          timeout_seconds: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          events?: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          retry_count?: number | null
          secret?: string | null
          timeout_seconds?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          events?: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          retry_count?: number | null
          secret?: string | null
          timeout_seconds?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_quick_replies: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          label: string
          message: string
          organization_id: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          label: string
          message: string
          organization_id: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          label?: string
          message?: string
          organization_id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "widget_quick_replies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_settings: {
        Row: {
          auto_open: boolean | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          organization_id: string
          position: string | null
          primary_color: string | null
          secondary_color: string | null
          settings: Json | null
          show_avatar: boolean | null
          show_typing_indicator: boolean | null
          updated_at: string | null
          widget_subtitle: string | null
          widget_title: string | null
        }
        Insert: {
          auto_open?: boolean | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          organization_id: string
          position?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          show_avatar?: boolean | null
          show_typing_indicator?: boolean | null
          updated_at?: string | null
          widget_subtitle?: string | null
          widget_title?: string | null
        }
        Update: {
          auto_open?: boolean | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          organization_id?: string
          position?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          show_avatar?: boolean | null
          show_typing_indicator?: boolean | null
          updated_at?: string | null
          widget_subtitle?: string | null
          widget_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "widget_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_welcome_config: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean | null
          message: string
          organization_id: string
          trigger_type: string | null
          trigger_value: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          message: string
          organization_id: string
          trigger_type?: string | null
          trigger_value?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          message?: string
          organization_id?: string
          trigger_type?: string | null
          trigger_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "widget_welcome_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_sla_breaches: {
        Args: Record<PropertyKey, never>
        Returns: {
          sla_id: string
          organization_id: string
          conversation_id: string
          sla_type: string
          breach_time: string
          minutes_overdue: number
        }[]
      }
      cleanup_old_ai_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_typing_indicators: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      complete_sla_tracking: {
        Args: { p_sla_id: string; p_status?: string }
        Returns: boolean
      }
      create_sla_tracking: {
        Args: {
          p_organization_id: string
          p_conversation_id: string
          p_sla_type: string
          p_target_time_minutes: number
          p_priority?: string
        }
        Returns: string
      }
      generate_widget_api_key: {
        Args: { org_id: string }
        Returns: string
      }
      get_conversation_messages: {
        Args: {
          conv_id: string
          org_id: string
          page_size?: number
          before_message_id?: string
        }
        Returns: {
          id: string
          content: string
          sender_type: string
          sender_name: string
          sender_email: string
          message_type: string
          attachments: Json
          created_at: string
        }[]
      }
      get_conversation_stats: {
        Args: { org_id: string; start_date?: string; end_date?: string }
        Returns: {
          total_conversations: number
          open_conversations: number
          closed_conversations: number
          avg_response_time_minutes: number
          avg_resolution_time_hours: number
        }[]
      }
      get_inbox_conversations: {
        Args: {
          org_id: string
          page_size?: number
          page_offset?: number
          status_filter?: string
        }
        Returns: {
          id: string
          subject: string
          status: string
          priority: string
          customer_email: string
          customer_name: string
          assigned_to_user_id: string
          last_message_at: string
          created_at: string
          unread_count: number
        }[]
      }
      get_sla_compliance_stats: {
        Args: { org_id: string; start_date?: string; end_date?: string }
        Returns: {
          sla_type: string
          total_slas: number
          met_slas: number
          breached_slas: number
          compliance_rate: number
        }[]
      }
      get_user_active_organization: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      search_knowledge_chunks: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
          org_id: string
        }
        Returns: {
          id: string
          document_id: string
          content: string
          similarity: number
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      set_user_active_organization: {
        Args: { org_id: string }
        Returns: boolean
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      validate_widget_api_key: {
        Args: { api_key: string }
        Returns: string
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
