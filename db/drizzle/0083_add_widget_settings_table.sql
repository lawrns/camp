CREATE TABLE "agent_notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" text NOT NULL,
	"preferences" jsonb DEFAULT '{"handoff_request":{"push":true,"websocket":true,"email":false,"sms":false,"sound":true},"assignment":{"push":true,"websocket":true,"email":true,"sms":false,"sound":true},"escalation":{"push":true,"websocket":true,"email":true,"sms":true,"sound":true},"queue_alert":{"push":false,"websocket":true,"email":false,"sms":false,"sound":false}}'::jsonb NOT NULL,
	"push_tokens" jsonb DEFAULT '[]'::jsonb,
	"email_address" text,
	"phone_number" text,
	"working_hours" jsonb,
	"do_not_disturb" jsonb DEFAULT '{"enabled":false}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_notification_preferences_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "agent_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" text NOT NULL,
	"handoff_id" uuid,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"priority" text DEFAULT 'medium',
	"channels" jsonb DEFAULT '{"push":{"enabled":true},"websocket":{"enabled":true},"email":{"enabled":false},"sms":{"enabled":false}}'::jsonb NOT NULL,
	"status" text DEFAULT 'pending',
	"delivery_attempts" integer DEFAULT 0,
	"last_delivery_attempt" timestamp,
	"acknowledged_at" timestamp,
	"expires_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" varchar(255) NOT NULL,
	"conversation_id" integer NOT NULL,
	"model_version_id" integer,
	"feedback_type" varchar(50) NOT NULL,
	"rating" integer,
	"text_feedback" text,
	"correction" json,
	"category" varchar(100),
	"severity" varchar(20),
	"tags" json DEFAULT '[]'::json,
	"is_anonymous" boolean DEFAULT true,
	"user_id" varchar(255),
	"user_agent" varchar(500),
	"ip_address" varchar(45),
	"session_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" json DEFAULT '{}'::json
);
--> statement-breakpoint
CREATE TABLE "ai_feedback_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"feedback_id" integer NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"action_by" varchar(255) NOT NULL,
	"action_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"resolution" text,
	"status" varchar(50) DEFAULT 'open',
	"priority" varchar(20) DEFAULT 'medium',
	"assigned_to" varchar(255),
	"estimated_resolution_time" timestamp,
	"actual_resolution_time" timestamp,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" json DEFAULT '{}'::json
);
--> statement-breakpoint
CREATE TABLE "ai_feedback_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"feedback_id" integer NOT NULL,
	"sentiment" varchar(20) NOT NULL,
	"intent" varchar(50) NOT NULL,
	"urgency" varchar(20) NOT NULL,
	"category" varchar(100) NOT NULL,
	"themes" json DEFAULT '[]'::json,
	"entities" json DEFAULT '[]'::json,
	"actionable" boolean DEFAULT false,
	"suggested_actions" json DEFAULT '[]'::json,
	"confidence" real NOT NULL,
	"processing_time" integer,
	"analysis_version" varchar(20) DEFAULT '1.0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" json DEFAULT '{}'::json
);
--> statement-breakpoint
CREATE TABLE "ai_feedback_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"parent_id" integer,
	"color" varchar(7) DEFAULT '#3B82F6',
	"icon" varchar(50),
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_feedback_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"period" varchar(20) NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"model_version_id" integer,
	"total_feedback" integer DEFAULT 0,
	"positive_feedback" integer DEFAULT 0,
	"negative_feedback" integer DEFAULT 0,
	"average_rating" real,
	"top_issues" json DEFAULT '[]'::json,
	"top_improvements" json DEFAULT '[]'::json,
	"sentiment_distribution" json DEFAULT '{"positive":0,"neutral":0,"negative":0}'::json,
	"category_breakdown" json DEFAULT '{}'::json,
	"actionable_items" integer DEFAULT 0,
	"resolved_items" integer DEFAULT 0,
	"avg_resolution_time" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" json DEFAULT '{}'::json
);
--> statement-breakpoint
CREATE TABLE "ai_feedback_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"category_id" integer,
	"template" json NOT NULL,
	"is_active" boolean DEFAULT true,
	"usage_count" integer DEFAULT 0,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_training_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"mailbox_id" integer NOT NULL,
	"data_type" varchar(50) NOT NULL,
	"category" varchar(100) NOT NULL,
	"content" json NOT NULL,
	"labels" json DEFAULT '[]'::json,
	"quality_score" integer,
	"is_validated" boolean DEFAULT false,
	"validated_by" varchar(255),
	"validated_at" timestamp,
	"version" varchar(50) DEFAULT '1.0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE "ai_training_data_batch_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"training_data_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_training_data_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"mailbox_id" integer NOT NULL,
	"total_records" integer DEFAULT 0,
	"validated_records" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'draft',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE "automation_execution_logs" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"trigger_data" jsonb DEFAULT '{}'::jsonb,
	"action_result" jsonb DEFAULT '{}'::jsonb,
	"error" text,
	"executed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_workflows" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"organization_id" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"trigger_type" text NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb,
	"action_type" text NOT NULL,
	"action_config" jsonb DEFAULT '{}'::jsonb,
	"conditions" jsonb DEFAULT '[]'::jsonb,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"organization_id" text NOT NULL,
	"name" text,
	"credentials" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "campfire_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campfire_handoff_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handoff_id" uuid NOT NULL,
	"action" text NOT NULL,
	"user_id" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"details" jsonb
);
--> statement-breakpoint
CREATE TABLE "campfire_handoffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"conversation_id" uuid,
	"persona_id" uuid,
	"draft" text,
	"reason" text NOT NULL,
	"priority" text DEFAULT 'medium',
	"transfer_type" text NOT NULL,
	"target_agent_id" text,
	"assigned_agent_id" text,
	"queue_position" integer,
	"estimated_wait_time_minutes" integer,
	"conversation_state" jsonb,
	"customer_sentiment" text DEFAULT 'neutral',
	"topic_complexity" text DEFAULT 'medium',
	"urgency_score" real DEFAULT 0.5,
	"escalation_triggers" jsonb DEFAULT '[]'::jsonb,
	"automated_triggers" jsonb,
	"message_queue" jsonb DEFAULT '[]'::jsonb,
	"delivery_guarantees" jsonb DEFAULT '{"endToEndConfirmation":true,"retryEnabled":true,"maxRetries":3,"timeoutMs":30000,"fallbackEnabled":true}'::jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"checkpoints" jsonb DEFAULT '[]'::jsonb,
	"rollback_available" boolean DEFAULT true,
	"last_checkpoint_id" text,
	"metrics" jsonb,
	"notes" text,
	"internal_notes" text,
	"feedback" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"assigned_at" timestamp,
	"accepted_at" timestamp,
	"completed_at" timestamp,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "campfire_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"sender" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"user_id" text,
	"organization_id" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"details" jsonb NOT NULL,
	"regulation_references" jsonb DEFAULT '[]' NOT NULL,
	"retention_period" integer DEFAULT 1825 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_threads" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "email_threads_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"message_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"subject" text NOT NULL,
	"from" text NOT NULL,
	"to" text NOT NULL,
	"cc" text,
	"bcc" text,
	"reply_to" text,
	"text_content" text,
	"html_content" text,
	"headers" jsonb,
	"attachments" jsonb,
	"is_processed" boolean DEFAULT false NOT NULL,
	"processing_error" text,
	"mailbox_id" bigint NOT NULL,
	"conversation_id" bigint,
	"received_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	CONSTRAINT "email_threads_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
CREATE TABLE "emoji_reactions" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "emoji_reactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"message_id" bigint NOT NULL,
	"user_id" text NOT NULL,
	"emoji" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escalation_rule_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"handoff_id" uuid,
	"condition_results" jsonb NOT NULL,
	"final_score" real NOT NULL,
	"threshold_met" boolean NOT NULL,
	"action_taken" boolean NOT NULL,
	"context" jsonb,
	"result" jsonb,
	"executed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escalation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"conditions" jsonb NOT NULL,
	"action" jsonb NOT NULL,
	"priority" integer DEFAULT 50,
	"score_weight" real DEFAULT 1,
	"enabled" boolean DEFAULT true,
	"cooldown_minutes" integer DEFAULT 5,
	"max_triggers_per_hour" integer DEFAULT 10,
	"evaluation_mode" text DEFAULT 'real_time',
	"evaluation_interval_seconds" integer DEFAULT 30,
	"activation_conditions" jsonb,
	"success_metrics" jsonb,
	"trigger_history" jsonb DEFAULT '[]'::jsonb,
	"performance" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_triggered" timestamp,
	"version" integer DEFAULT 1,
	"parent_rule_id" uuid
);
--> statement-breakpoint
CREATE TABLE "widget_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mailbox_id" bigint NOT NULL,
	"primary_color" text DEFAULT '#3B82F6',
	"background_color" text DEFAULT '#FFFFFF',
	"text_color" text DEFAULT '#1F2937',
	"border_radius" integer DEFAULT 8,
	"font_family" text DEFAULT 'Inter',
	"welcome_message" text DEFAULT 'Hi! How can we help you today?',
	"placeholder_text" text DEFAULT 'Type your message...',
	"auto_open_delay_ms" integer DEFAULT 0,
	"show_typing_indicator" boolean DEFAULT true,
	"enable_sound_notifications" boolean DEFAULT true,
	"position" text DEFAULT 'bottom-right',
	"offset_x" integer DEFAULT 20,
	"offset_y" integer DEFAULT 20,
	"width" integer DEFAULT 400,
	"height" integer DEFAULT 600,
	"business_hours" jsonb DEFAULT '{"enabled":false,"timezone":"UTC","schedule":{"monday":{"enabled":true,"start":"09:00","end":"17:00"},"tuesday":{"enabled":true,"start":"09:00","end":"17:00"},"wednesday":{"enabled":true,"start":"09:00","end":"17:00"},"thursday":{"enabled":true,"start":"09:00","end":"17:00"},"friday":{"enabled":true,"start":"09:00","end":"17:00"},"saturday":{"enabled":false,"start":"09:00","end":"17:00"},"sunday":{"enabled":false,"start":"09:00","end":"17:00"}}}'::jsonb,
	"offline_message" text DEFAULT 'We''re currently offline. Leave us a message and we''ll get back to you soon!',
	"require_email" boolean DEFAULT false,
	"require_name" boolean DEFAULT false,
	"custom_fields" jsonb DEFAULT '[]'::jsonb,
	"enable_ai" boolean DEFAULT true,
	"ai_welcome_message" text DEFAULT 'I''m an AI assistant. I can help you with common questions, or connect you with a human agent.',
	"ai_handoff_triggers" jsonb DEFAULT '{"lowConfidenceThreshold":0.3,"userRequestsHuman":true,"maxAIResponses":5,"keywords":["speak to human","human agent","representative"]}'::jsonb,
	"show_gdpr_notice" boolean DEFAULT false,
	"gdpr_notice_text" text DEFAULT 'We use cookies and collect data to improve your experience. By continuing, you agree to our privacy policy.',
	"privacy_policy_url" text,
	"terms_of_service_url" text,
	"custom_css" text,
	"custom_js" text,
	"webhook_url" text,
	"allow_file_uploads" boolean DEFAULT true,
	"max_file_size_mb" integer DEFAULT 10,
	"allowed_file_types" jsonb DEFAULT '["image/*",".pdf",".doc",".docx",".txt"]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "typing_indicators" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "typing_indicators_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"conversation_id" bigint NOT NULL,
	"user_id" text NOT NULL,
	"sender_type" text NOT NULL,
	"is_typing" boolean DEFAULT false NOT NULL,
	"content" text
);
--> statement-breakpoint
CREATE TABLE "rag_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"prompt" text NOT NULL,
	"threshold" real DEFAULT 0.7 NOT NULL,
	"k" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_read_status" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "message_read_status_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"message_id" bigint NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_queue" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "message_queue_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"message_id" bigint NOT NULL,
	"status" text NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 5 NOT NULL,
	"next_retry_at" timestamp with time zone,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "message_threads" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "message_threads_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"thread_id" text NOT NULL,
	"parent_message_id" bigint NOT NULL,
	"conversation_id" bigint NOT NULL,
	"title" text,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_delivery_status" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "message_delivery_status_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"message_id" bigint NOT NULL,
	"status" text NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "model_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_name" varchar(255) NOT NULL,
	"version" varchar(100) NOT NULL,
	"description" text,
	"base_model" varchar(100) NOT NULL,
	"fine_tuned_model_id" varchar(255),
	"dataset_id" integer,
	"status" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT false,
	"tags" json DEFAULT '[]'::json,
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_datasets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE "knowledge_categories" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "knowledge_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"mailbox_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_id" bigint
);
--> statement-breakpoint
CREATE TABLE "knowledge_document_categories" (
	"document_id" bigint NOT NULL,
	"category_id" bigint NOT NULL,
	CONSTRAINT "knowledge_document_categories_document_id_category_id_pk" PRIMARY KEY("document_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "knowledge_document_versions" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "knowledge_document_versions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"document_id" bigint NOT NULL,
	"content" text NOT NULL,
	"metadata" json,
	"version_number" bigint NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_documents" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "knowledge_documents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"mailbox_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"source_type" text NOT NULL,
	"source_url" text,
	"content" text,
	"metadata" json,
	"tags" text[],
	"category" text,
	"enabled" boolean DEFAULT true,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "knowledge_suggestions" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "knowledge_suggestions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"mailbox_id" text NOT NULL,
	"content" text NOT NULL,
	"title" text,
	"reason" text NOT NULL,
	"source_conversation_id" text,
	"replacement_for_id" bigint,
	"status" text DEFAULT 'pending',
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE "knowledge_chunks" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "knowledge_chunks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"document_id" bigint NOT NULL,
	"mailbox_id" bigint NOT NULL,
	"content" text NOT NULL,
	"content_hash" text,
	"token_count" integer,
	"chunk_index" integer,
	"embedding" vector(1536),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "quick_replies" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "quick_replies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"mailbox_id" bigint,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"is_global" boolean DEFAULT false NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"tags" text[]
);
--> statement-breakpoint
CREATE TABLE "ticket_comments" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "ticket_comments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"ticket_id" bigint NOT NULL,
	"user_id" text NOT NULL,
	"comment" text NOT NULL,
	"is_internal" boolean DEFAULT true,
	"attachments" json
);
--> statement-breakpoint
CREATE TABLE "ticket_fields" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "ticket_fields_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"ticket_id" bigint NOT NULL,
	"field_name" text NOT NULL,
	"field_value" json,
	CONSTRAINT "unique_ticket_field" UNIQUE("ticket_id","field_name")
);
--> statement-breakpoint
CREATE TABLE "ticket_history" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "ticket_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"ticket_id" bigint NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"field_name" text,
	"old_value" json,
	"new_value" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_types" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "ticket_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"mailbox_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"default_priority" text DEFAULT 'medium',
	"default_status" text DEFAULT 'open',
	"fields" json,
	"auto_assign" boolean DEFAULT false,
	"sla_hours" integer
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "tickets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"ticket_number" bigint GENERATED BY DEFAULT AS IDENTITY (sequence name "tickets_ticket_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"conversation_id" text,
	"mailbox_id" text NOT NULL,
	"ticket_type_id" bigint,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"assignee_id" text,
	"reporter_id" text,
	"customer_id" text,
	"due_date" timestamp with time zone,
	"tags" text[],
	"metadata" json,
	"resolved_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	CONSTRAINT "unique_ticket_mailbox_number" UNIQUE("mailbox_id","ticket_number")
);
--> statement-breakpoint
CREATE TABLE "user_presence" (
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "user_presence_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"is_online" boolean DEFAULT false NOT NULL,
	"last_active" timestamp with time zone DEFAULT now() NOT NULL,
	"last_heartbeat" timestamp with time zone DEFAULT now() NOT NULL,
	"status_message" text,
	CONSTRAINT "user_presence_userId_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "vector_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"embedding" json NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "delivery_status" text DEFAULT 'sending';--> statement-breakpoint
ALTER TABLE "conversations_conversation" ADD COLUMN "rag_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations_conversation" ADD COLUMN "rag_profile_id" uuid;--> statement-breakpoint
ALTER TABLE "agent_notifications" ADD CONSTRAINT "agent_notifications_handoff_id_campfire_handoffs_id_fk" FOREIGN KEY ("handoff_id") REFERENCES "public"."campfire_handoffs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_conversation_id_conversations_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations_conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_model_version_id_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."model_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback_actions" ADD CONSTRAINT "ai_feedback_actions_feedback_id_ai_feedback_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."ai_feedback"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback_analysis" ADD CONSTRAINT "ai_feedback_analysis_feedback_id_ai_feedback_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."ai_feedback"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback_categories" ADD CONSTRAINT "ai_feedback_categories_parent_id_ai_feedback_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ai_feedback_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback_summaries" ADD CONSTRAINT "ai_feedback_summaries_model_version_id_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."model_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback_templates" ADD CONSTRAINT "ai_feedback_templates_category_id_ai_feedback_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."ai_feedback_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_training_data" ADD CONSTRAINT "ai_training_data_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes_mailbox"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_training_data_batch_items" ADD CONSTRAINT "ai_training_data_batch_items_batch_id_ai_training_data_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."ai_training_data_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_training_data_batch_items" ADD CONSTRAINT "ai_training_data_batch_items_training_data_id_ai_training_data_id_fk" FOREIGN KEY ("training_data_id") REFERENCES "public"."ai_training_data"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_training_data_batches" ADD CONSTRAINT "ai_training_data_batches_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes_mailbox"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_execution_logs" ADD CONSTRAINT "automation_execution_logs_workflow_id_automation_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."automation_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campfire_handoff_logs" ADD CONSTRAINT "campfire_handoff_logs_handoff_id_campfire_handoffs_id_fk" FOREIGN KEY ("handoff_id") REFERENCES "public"."campfire_handoffs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campfire_handoffs" ADD CONSTRAINT "campfire_handoffs_channel_id_campfire_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."campfire_channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campfire_handoffs" ADD CONSTRAINT "campfire_handoffs_persona_id_rag_profiles_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."rag_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes_mailbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_conversation_id_conversations_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations_conversation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emoji_reactions" ADD CONSTRAINT "emoji_reactions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_rule_executions" ADD CONSTRAINT "escalation_rule_executions_rule_id_escalation_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."escalation_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_settings" ADD CONSTRAINT "widget_settings_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes_mailbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "typing_indicators" ADD CONSTRAINT "typing_indicators_conversation_id_conversations_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_read_status" ADD CONSTRAINT "message_read_status_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_queue" ADD CONSTRAINT "message_queue_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_parent_message_id_messages_id_fk" FOREIGN KEY ("parent_message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_conversation_id_conversations_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_delivery_status" ADD CONSTRAINT "message_delivery_status_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_versions" ADD CONSTRAINT "model_versions_dataset_id_training_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."training_datasets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_categories" ADD CONSTRAINT "knowledge_categories_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes_mailbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_categories" ADD CONSTRAINT "knowledge_categories_parent_id_knowledge_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."knowledge_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_document_categories" ADD CONSTRAINT "knowledge_document_categories_document_id_knowledge_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."knowledge_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_document_categories" ADD CONSTRAINT "knowledge_document_categories_category_id_knowledge_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."knowledge_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_document_versions" ADD CONSTRAINT "knowledge_document_versions_document_id_knowledge_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."knowledge_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes_mailbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_suggestions" ADD CONSTRAINT "knowledge_suggestions_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes_mailbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_suggestions" ADD CONSTRAINT "knowledge_suggestions_source_conversation_id_conversations_conversation_id_fk" FOREIGN KEY ("source_conversation_id") REFERENCES "public"."conversations_conversation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_suggestions" ADD CONSTRAINT "knowledge_suggestions_replacement_for_id_knowledge_documents_id_fk" FOREIGN KEY ("replacement_for_id") REFERENCES "public"."knowledge_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_id_knowledge_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."knowledge_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes_mailbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_replies" ADD CONSTRAINT "quick_replies_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes_mailbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_fields" ADD CONSTRAINT "ticket_fields_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_history" ADD CONSTRAINT "ticket_history_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes_mailbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_conversation_id_conversations_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations_conversation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes_mailbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticket_type_id_ticket_types_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_customer_id_mailboxes_platformcustomer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."mailboxes_platformcustomer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_threads_message_id_idx" ON "email_threads" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "email_threads_thread_id_idx" ON "email_threads" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "email_threads_mailbox_id_idx" ON "email_threads" USING btree ("mailbox_id");--> statement-breakpoint
CREATE INDEX "email_threads_conversation_id_idx" ON "email_threads" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "email_threads_received_at_idx" ON "email_threads" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "email_threads_is_processed_idx" ON "email_threads" USING btree ("is_processed");--> statement-breakpoint
CREATE INDEX "idx_emoji_reactions_message_id" ON "emoji_reactions" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "idx_emoji_reactions_user_id" ON "emoji_reactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_emoji_reactions_emoji" ON "emoji_reactions" USING btree ("emoji");--> statement-breakpoint
CREATE INDEX "emoji_reactions_message_user_emoji_unique" ON "emoji_reactions" USING btree ("message_id","user_id","emoji");--> statement-breakpoint
CREATE INDEX "idx_typing_indicators_conversation_id" ON "typing_indicators" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_typing_indicators_is_typing" ON "typing_indicators" USING btree ("is_typing");--> statement-breakpoint
CREATE INDEX "idx_typing_indicators_updated_at" ON "typing_indicators" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "typing_indicators_conversation_user_unique" ON "typing_indicators" USING btree ("conversation_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_message_read_status_message_id" ON "message_read_status" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "idx_message_read_status_user_id" ON "message_read_status" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "message_read_status_message_user_unique" ON "message_read_status" USING btree ("message_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_message_queue_message_id" ON "message_queue" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "idx_message_queue_status" ON "message_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_message_queue_next_retry_at" ON "message_queue" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "idx_message_threads_thread_id" ON "message_threads" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "idx_message_threads_parent_message_id" ON "message_threads" USING btree ("parent_message_id");--> statement-breakpoint
CREATE INDEX "idx_message_threads_conversation_id" ON "message_threads" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_message_threads_last_activity_at" ON "message_threads" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX "idx_message_delivery_status_message_id" ON "message_delivery_status" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "idx_message_delivery_status_status" ON "message_delivery_status" USING btree ("status");--> statement-breakpoint
CREATE INDEX "message_delivery_status_message_unique" ON "message_delivery_status" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_categories_mailbox_id" ON "knowledge_categories" USING btree ("mailbox_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_categories_parent_id" ON "knowledge_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_document_categories_document_id" ON "knowledge_document_categories" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_document_categories_category_id" ON "knowledge_document_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_document_versions_document_id" ON "knowledge_document_versions" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_document_versions_version_number" ON "knowledge_document_versions" USING btree ("version_number");--> statement-breakpoint
CREATE INDEX "idx_knowledge_documents_mailbox_id" ON "knowledge_documents" USING btree ("mailbox_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_documents_source_type" ON "knowledge_documents" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "idx_knowledge_documents_tags" ON "knowledge_documents" USING btree ("tags");--> statement-breakpoint
CREATE INDEX "idx_knowledge_suggestions_mailbox_id" ON "knowledge_suggestions" USING btree ("mailbox_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_suggestions_status" ON "knowledge_suggestions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_knowledge_suggestions_source_conversation_id" ON "knowledge_suggestions" USING btree ("source_conversation_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_chunks_document_id" ON "knowledge_chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_chunks_mailbox_id" ON "knowledge_chunks" USING btree ("mailbox_id");--> statement-breakpoint
CREATE INDEX "idx_quick_replies_user_id" ON "quick_replies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quick_replies_mailbox_id" ON "quick_replies" USING btree ("mailbox_id");--> statement-breakpoint
CREATE INDEX "idx_quick_replies_category" ON "quick_replies" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_quick_replies_is_global" ON "quick_replies" USING btree ("is_global");--> statement-breakpoint
CREATE INDEX "idx_quick_replies_is_template" ON "quick_replies" USING btree ("is_template");--> statement-breakpoint
CREATE INDEX "idx_quick_replies_usage_count" ON "quick_replies" USING btree ("usage_count");--> statement-breakpoint
CREATE INDEX "idx_ticket_comments_ticket_id" ON "ticket_comments" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_ticket_comments_user_id" ON "ticket_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ticket_fields_ticket_id" ON "ticket_fields" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_ticket_history_ticket_id" ON "ticket_history" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_ticket_history_user_id" ON "ticket_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ticket_history_action" ON "ticket_history" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_ticket_types_mailbox_id" ON "ticket_types" USING btree ("mailbox_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_conversation_id" ON "tickets" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_mailbox_id" ON "tickets" USING btree ("mailbox_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_ticket_type_id" ON "tickets" USING btree ("ticket_type_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_assignee_id" ON "tickets" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_customer_id" ON "tickets" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_status" ON "tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tickets_priority" ON "tickets" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_tickets_due_date" ON "tickets" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_user_presence_user_id" ON "user_presence" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_presence_last_heartbeat" ON "user_presence" USING btree ("last_heartbeat");--> statement-breakpoint
CREATE INDEX "idx_user_presence_last_active" ON "user_presence" USING btree ("last_active");--> statement-breakpoint
ALTER TABLE "conversations_conversation" ADD CONSTRAINT "conversations_conversation_rag_profile_id_rag_profiles_id_fk" FOREIGN KEY ("rag_profile_id") REFERENCES "public"."rag_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversations_mailbox_status_created_at_idx" ON "conversations_conversation" USING btree ("mailbox_id","status","created_at");