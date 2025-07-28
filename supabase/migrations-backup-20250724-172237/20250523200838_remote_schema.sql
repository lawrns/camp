

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "drizzle";


ALTER SCHEMA "drizzle" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "internal";


ALTER SCHEMA "internal" OWNER TO "postgres";




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";






CREATE TYPE "public"."AgentAvailabilityStatus" AS ENUM (
    'online',
    'away',
    'busy',
    'offline'
);


ALTER TYPE "public"."AgentAvailabilityStatus" OWNER TO "postgres";


CREATE TYPE "public"."AttributeDataType" AS ENUM (
    'text',
    'number',
    'boolean',
    'date',
    'select',
    'multiselect',
    'file',
    'url',
    'longtext',
    'email',
    'phone'
);


ALTER TYPE "public"."AttributeDataType" OWNER TO "postgres";


CREATE TYPE "public"."CompanySize" AS ENUM (
    'size_1_5',
    'size_6_15',
    'size_16_49',
    'size_50_199',
    'size_200_999',
    'size_1000_plus'
);


ALTER TYPE "public"."CompanySize" OWNER TO "postgres";


CREATE TYPE "public"."MessageType" AS ENUM (
    'text',
    'image',
    'file',
    'system',
    'notification',
    'action',
    'automated'
);


ALTER TYPE "public"."MessageType" OWNER TO "postgres";


CREATE TYPE "public"."OnboardingStatus" AS ENUM (
    'pending_profile',
    'pending_organization',
    'pending_verification',
    'completed',
    'skipped',
    'in_progress'
);


ALTER TYPE "public"."OnboardingStatus" OWNER TO "postgres";


CREATE TYPE "public"."ProfileRole" AS ENUM (
    'admin',
    'agent',
    'owner'
);


ALTER TYPE "public"."ProfileRole" OWNER TO "postgres";


CREATE TYPE "public"."ProgressStatus" AS ENUM (
    'not_started',
    'in_progress',
    'completed',
    'skipped'
);


ALTER TYPE "public"."ProgressStatus" OWNER TO "postgres";


CREATE TYPE "public"."SenderType" AS ENUM (
    'user',
    'system',
    'agent',
    'bot',
    'visitor'
);


ALTER TYPE "public"."SenderType" OWNER TO "postgres";


CREATE TYPE "public"."TicketPriority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."TicketPriority" OWNER TO "postgres";


CREATE TYPE "public"."TicketSource" AS ENUM (
    'email',
    'web',
    'chat',
    'phone',
    'api',
    'import'
);


ALTER TYPE "public"."TicketSource" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "internal"."get_user_organization_ids"("user_id" "uuid") RETURNS "uuid"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN 
  RETURN ARRAY(
    SELECT organization_id 
    FROM profiles 
    WHERE id = user_id
  ); 
END;
$$;


ALTER FUNCTION "internal"."get_user_organization_ids"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "internal"."is_user_agent"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN 
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = user_id AND role = 'agent'
  ); 
END;
$$;


ALTER FUNCTION "internal"."is_user_agent"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "internal"."is_user_in_organization"("user_id" "uuid", "org_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = user_id
    AND p.organization_id = org_id
  );
END;
$$;


ALTER FUNCTION "internal"."is_user_in_organization"("user_id" "uuid", "org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_embeddings"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- This is a placeholder. In production, you would call an external API
  -- to generate embeddings and store them in the embedding column.
  -- For now, we'll just set a note in the metadata.
  NEW.metadata = jsonb_set(COALESCE(NEW.metadata, '{}'::jsonb), '{embedding_status}', '"pending"'::jsonb);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_embeddings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_db_stats"() RETURNS TABLE("table_name" "text", "row_count" bigint, "total_size" "text", "index_size" "text", "table_size" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.relname::TEXT AS table_name,
    c.reltuples::BIGINT AS row_count,
    pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
    pg_size_pretty(pg_indexes_size(c.oid)) AS index_size,
    pg_size_pretty(pg_relation_size(c.oid)) AS table_size
  FROM
    pg_class c
  JOIN
    pg_namespace n ON n.oid = c.relnamespace
  WHERE
    n.nspname = 'public'
    AND c.relkind = 'r'
  ORDER BY
    pg_total_relation_size(c.oid) DESC;
END;
$$;


ALTER FUNCTION "public"."get_db_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_slow_queries"("min_calls" integer DEFAULT 10, "min_avg_time" double precision DEFAULT 100.0) RETURNS TABLE("query" "text", "calls" bigint, "avg_time" double precision, "total_time" double precision, "rows_per_call" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    query,
    calls,
    mean_time AS avg_time,
    total_time,
    rows_per_call
  FROM
    pg_stat_statements
  WHERE
    calls >= min_calls
    AND mean_time >= min_avg_time
  ORDER BY
    total_time DESC
  LIMIT 20;
END;
$$;


ALTER FUNCTION "public"."get_slow_queries"("min_calls" integer, "min_avg_time" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."knowledge_documents_search_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ BEGIN NEW.search_vector = to_tsvector('english', coalesce(NEW.title,'') || ' ' || coalesce(NEW.content,'')); RETURN NEW; END $$;


ALTER FUNCTION "public"."knowledge_documents_search_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."perform_maintenance"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  table_name TEXT;
  maintenance_log TEXT := 'Maintenance performed on: ';
BEGIN
  -- Vacuum and analyze all tables in the public schema
  FOR table_name IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE 'VACUUM ANALYZE ' || table_name;
    maintenance_log := maintenance_log || table_name || ', ';
  END LOOP;
  
  -- Reset pg_stat_statements
  PERFORM pg_stat_statements_reset();
  maintenance_log := maintenance_log || 'pg_stat_statements reset';
  
  RETURN maintenance_log;
END;
$$;


ALTER FUNCTION "public"."perform_maintenance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_knowledge"("query_text" "text", "query_embedding" "extensions"."vector", "organization_id" "uuid", "match_threshold" double precision DEFAULT 0.5, "match_count" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "knowledge_base_id" "uuid", "title" "text", "content" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    kd.id,
    kd.knowledge_base_id,
    kd.title,
    kd.content,
    CASE
      WHEN kd.embedding IS NULL THEN
        ts_rank(kd.search_vector, to_tsquery('english', query_text))
      ELSE
        1 - (kd.embedding <=> query_embedding)
    END AS similarity
  FROM
    knowledge_documents kd
  JOIN
    knowledge_base kb ON kd.knowledge_base_id = kb.id
  WHERE
    kb.organization_id = search_knowledge.organization_id
    AND (
      -- If embedding exists, use vector similarity
      (kd.embedding IS NOT NULL AND 1 - (kd.embedding <=> query_embedding) > match_threshold)
      OR
      -- Otherwise fall back to text search
      (kd.embedding IS NULL AND kd.search_vector @@ to_tsquery('english', query_text))
    )
  ORDER BY
    similarity DESC
  LIMIT
    match_count;
END;
$$;


ALTER FUNCTION "public"."search_knowledge"("query_text" "text", "query_embedding" "extensions"."vector", "organization_id" "uuid", "match_threshold" double precision, "match_count" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
    "id" integer NOT NULL,
    "hash" "text" NOT NULL,
    "created_at" bigint
);


ALTER TABLE "drizzle"."__drizzle_migrations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "drizzle"."__drizzle_migrations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "drizzle"."__drizzle_migrations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "drizzle"."__drizzle_migrations_id_seq" OWNED BY "drizzle"."__drizzle_migrations"."id";



CREATE TABLE IF NOT EXISTS "public"."AuthAttempt" (
    "id" "text" NOT NULL,
    "ip_address" "text" NOT NULL,
    "user_agent" "text",
    "email" "text" NOT NULL,
    "success" boolean DEFAULT false NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."AuthAttempt" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AuthBlock" (
    "id" "text" NOT NULL,
    "ip_address" "text" NOT NULL,
    "email" "text" NOT NULL,
    "blocked_until" timestamp(3) without time zone NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."AuthBlock" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Ticket" (
    "id" "uuid" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ticketTypeId" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "priority" "public"."TicketPriority" DEFAULT 'medium'::"public"."TicketPriority" NOT NULL,
    "statusId" "uuid",
    "assignedAgentId" "uuid",
    "customerId" "uuid",
    "organizationId" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "dueAt" timestamp(3) without time zone,
    "resolvedAt" timestamp(3) without time zone,
    "firstResponseAt" timestamp(3) without time zone,
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "source" "public"."TicketSource" DEFAULT 'web'::"public"."TicketSource" NOT NULL,
    "formData" "jsonb"
);


ALTER TABLE "public"."Ticket" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."TicketAttribute" (
    "id" "uuid" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ticketTypeId" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "label" "text" NOT NULL,
    "dataType" "public"."AttributeDataType" NOT NULL,
    "options" "jsonb",
    "isRequired" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."TicketAttribute" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."TicketComment" (
    "id" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ticketId" "uuid" NOT NULL,
    "authorId" "uuid",
    "body" "text" NOT NULL,
    "isInternal" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."TicketComment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."TicketConversation" (
    "ticketId" "uuid" NOT NULL,
    "conversationId" "uuid" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."TicketConversation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."TicketState" (
    "id" "uuid" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "isActive" boolean DEFAULT true NOT NULL,
    "organizationId" "uuid"
);


ALTER TABLE "public"."TicketState" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."TicketStatusHistory" (
    "id" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ticketId" "uuid" NOT NULL,
    "oldStatusId" "uuid",
    "newStatusId" "uuid" NOT NULL,
    "changedByUserId" "uuid"
);


ALTER TABLE "public"."TicketStatusHistory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."TicketType" (
    "id" "uuid" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "isActive" boolean DEFAULT true NOT NULL,
    "organizationId" "uuid"
);


ALTER TABLE "public"."TicketType" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_ProfileSkills" (
    "A" "uuid" NOT NULL,
    "B" "uuid" NOT NULL
);


ALTER TABLE "public"."_ProfileSkills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_RuleTargetTeams" (
    "A" "uuid" NOT NULL,
    "B" "uuid" NOT NULL
);


ALTER TABLE "public"."_RuleTargetTeams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_RuleTicketTypes" (
    "A" "uuid" NOT NULL,
    "B" "uuid" NOT NULL
);


ALTER TABLE "public"."_RuleTicketTypes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_TicketToTicketLabel" (
    "A" "uuid" NOT NULL,
    "B" "uuid" NOT NULL
);


ALTER TABLE "public"."_TicketToTicketLabel" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attachments" (
    "id" "uuid" NOT NULL,
    "message_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "storage_path" "text" NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "table_name" "text",
    "record_id" "text",
    "user_id" "uuid",
    "organization_id" "uuid",
    "action_details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."canned_responses" (
    "id" "uuid" NOT NULL,
    "organization_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_by_id" "text",
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL,
    "category" "text",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[]
);


ALTER TABLE "public"."canned_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_metrics" (
    "conversation_id" "uuid" NOT NULL,
    "first_response_time_ms" integer,
    "resolution_time_ms" integer,
    "message_count" integer DEFAULT 0 NOT NULL,
    "participant_count" integer DEFAULT 0 NOT NULL,
    "satisfaction_score" integer,
    "updated_at" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."conversation_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_participants" (
    "id" "uuid" NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'participant'::"text" NOT NULL,
    "joined_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_read_at" timestamp(3) without time zone
);


ALTER TABLE "public"."conversation_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "initiator_id" "uuid" NOT NULL,
    "initiator_type" "public"."SenderType" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "priority" "text" DEFAULT 'normal'::"text" NOT NULL,
    "last_message_at" timestamp with time zone,
    "assignee_id" "uuid",
    "assignee_type" "text" DEFAULT 'human'::"text"
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_verification_tokens" (
    "id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "expires_at" timestamp(6) with time zone NOT NULL,
    "used" boolean DEFAULT false NOT NULL,
    "used_at" timestamp(6) with time zone,
    "created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(6) with time zone NOT NULL
);


ALTER TABLE "public"."email_verification_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL,
    "organization_id" "uuid",
    "description" "text",
    "created_at" timestamp(6) with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp(6) with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."feature_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_base" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."knowledge_base" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "knowledge_base_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "file_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "embedding" "extensions"."vector"(1536),
    "search_vector" "tsvector"
);


ALTER TABLE "public"."knowledge_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "sender_type" "public"."SenderType" NOT NULL,
    "message_type" "public"."MessageType" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "is_private" boolean DEFAULT false NOT NULL,
    "parent_message_id" "uuid",
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" NOT NULL,
    "profile_id" "text" NOT NULL,
    "content" "text" NOT NULL,
    "type" "text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "reference_type" "text",
    "reference_id" "text"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_progress" (
    "id" "uuid" NOT NULL,
    "profileId" "uuid" NOT NULL,
    "stepId" "uuid" NOT NULL,
    "status" "public"."ProgressStatus" DEFAULT 'not_started'::"public"."ProgressStatus" NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "lastInteractAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "notes" "text"
);


ALTER TABLE "public"."onboarding_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_responses" (
    "id" "uuid" NOT NULL,
    "profileId" "uuid" NOT NULL,
    "questionKey" "text" NOT NULL,
    "response" "jsonb" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."onboarding_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_steps" (
    "id" "uuid" NOT NULL,
    "key" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isRequired" boolean DEFAULT true NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "organizationId" "uuid",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "defaultContent" "jsonb"
);


ALTER TABLE "public"."onboarding_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_themes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "brand" "jsonb" DEFAULT '{"accent": "#8B5CF6", "base100": "#FFFFFF", "base200": "#F3F4F6", "base300": "#D1D5DB", "neutral": "#1F2937", "primary": "#3B82F6", "secondary": "#10B981"}'::"jsonb" NOT NULL,
    "created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."organization_themes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "default_agent_name" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "subscription" "text" DEFAULT 'free'::"text" NOT NULL,
    "domain_allowlist" "text"[] DEFAULT ARRAY[]::"text"[],
    "created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    "company_size" "public"."CompanySize",
    "theme_logo_url" "text",
    "theme_primary_color" character varying(7)
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "user_id" "uuid",
    "full_name" "text",
    "role" "public"."ProfileRole" NOT NULL,
    "email" "text",
    "created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    "onboarding_status" "public"."OnboardingStatus" DEFAULT 'pending_profile'::"public"."OnboardingStatus" NOT NULL,
    "availability_status" "public"."AgentAvailabilityStatus" DEFAULT 'offline'::"public"."AgentAvailabilityStatus"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rag_chat_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "user_query" "text" NOT NULL,
    "ai_response" "text" NOT NULL,
    "documents_used" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."rag_chat_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."refresh_tokens" (
    "id" "text" NOT NULL,
    "token" "text" NOT NULL,
    "expires_at" timestamp(3) without time zone NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "revoked" boolean DEFAULT false NOT NULL,
    "replaced_by_token" "text",
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL,
    "revoked_at" timestamp(3) without time zone
);


ALTER TABLE "public"."refresh_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."routing_rules" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "organizationId" "uuid" NOT NULL,
    "priority" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "conditions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "actionType" "text" NOT NULL,
    "actionParams" "jsonb" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."routing_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_alerts" (
    "id" "uuid" NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "severity" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "sourceIp" "text",
    "userId" "uuid",
    "organizationId" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "relatedEvents" "text"[] DEFAULT ARRAY[]::"text"[],
    "status" "text" DEFAULT 'OPEN'::"text" NOT NULL
);


ALTER TABLE "public"."security_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "refresh_token" "text" NOT NULL,
    "user_agent" "text",
    "ip_address" "text",
    "expires_at" timestamp(6) with time zone NOT NULL,
    "created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_active_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "is_valid" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."skills" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."skills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sla_events" (
    "id" "uuid" NOT NULL,
    "ticketId" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "dueAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "breachedAt" timestamp(3) without time zone,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."sla_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sla_policies" (
    "id" "uuid" NOT NULL,
    "templateId" "uuid" NOT NULL,
    "ticketTypeId" "uuid",
    "priority" "public"."TicketPriority",
    "responseDue" integer,
    "resolutionDue" integer,
    "businessHoursOnly" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."sla_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sla_policy_templates" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "organizationId" "uuid" NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "firstResponse" integer,
    "resolution" integer
);


ALTER TABLE "public"."sla_policy_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_assignments" (
    "id" "uuid" NOT NULL,
    "team_id" "uuid" NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "assigned_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "assigned_by_id" "uuid"
);


ALTER TABLE "public"."team_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "team_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "joined_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL,
    "handles_ticket_types" "text"[] DEFAULT ARRAY[]::"text"[]
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_attachments" (
    "id" "uuid" NOT NULL,
    "ticketId" "uuid" NOT NULL,
    "fileName" "text" NOT NULL,
    "fileType" "text" NOT NULL,
    "fileSize" integer NOT NULL,
    "storagePath" "text" NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "uploadedBy" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."ticket_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_field_values" (
    "id" "uuid" NOT NULL,
    "fieldId" "uuid" NOT NULL,
    "ticketId" "uuid" NOT NULL,
    "value" "jsonb" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."ticket_field_values" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_fields" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "type" "public"."AttributeDataType" NOT NULL,
    "required" boolean DEFAULT false NOT NULL,
    "default" "jsonb",
    "options" "jsonb",
    "organizationId" "uuid" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."ticket_fields" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_forms" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "organizationId" "uuid" NOT NULL,
    "ticketTypeId" "uuid",
    "isActive" boolean DEFAULT true NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "fields" "jsonb" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."ticket_forms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_labels" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT '#3B82F6'::"text" NOT NULL,
    "description" "text",
    "organizationId" "uuid" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" "uuid"
);


ALTER TABLE "public"."ticket_labels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."widget_configurations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "is_public" boolean DEFAULT true NOT NULL,
    "allowed_origins" "text"[] DEFAULT ARRAY[]::"text"[],
    "created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."widget_configurations" OWNER TO "postgres";


ALTER TABLE ONLY "drizzle"."__drizzle_migrations" ALTER COLUMN "id" SET DEFAULT "nextval"('"drizzle"."__drizzle_migrations_id_seq"'::"regclass");



ALTER TABLE ONLY "drizzle"."__drizzle_migrations"
    ADD CONSTRAINT "__drizzle_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."AuthAttempt"
    ADD CONSTRAINT "AuthAttempt_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."AuthBlock"
    ADD CONSTRAINT "AuthBlock_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."TicketAttribute"
    ADD CONSTRAINT "TicketAttribute_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."TicketComment"
    ADD CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."TicketConversation"
    ADD CONSTRAINT "TicketConversation_pkey" PRIMARY KEY ("ticketId", "conversationId");



ALTER TABLE ONLY "public"."TicketState"
    ADD CONSTRAINT "TicketState_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."TicketStatusHistory"
    ADD CONSTRAINT "TicketStatusHistory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."TicketType"
    ADD CONSTRAINT "TicketType_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Ticket"
    ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."_ProfileSkills"
    ADD CONSTRAINT "_ProfileSkills_AB_pkey" PRIMARY KEY ("A", "B");



ALTER TABLE ONLY "public"."_RuleTargetTeams"
    ADD CONSTRAINT "_RuleTargetTeams_AB_pkey" PRIMARY KEY ("A", "B");



ALTER TABLE ONLY "public"."_RuleTicketTypes"
    ADD CONSTRAINT "_RuleTicketTypes_AB_pkey" PRIMARY KEY ("A", "B");



ALTER TABLE ONLY "public"."_TicketToTicketLabel"
    ADD CONSTRAINT "_TicketToTicketLabel_AB_pkey" PRIMARY KEY ("A", "B");



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."canned_responses"
    ADD CONSTRAINT "canned_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_metrics"
    ADD CONSTRAINT "conversation_metrics_pkey" PRIMARY KEY ("conversation_id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_verification_tokens"
    ADD CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_base"
    ADD CONSTRAINT "knowledge_base_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_documents"
    ADD CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_progress"
    ADD CONSTRAINT "onboarding_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_responses"
    ADD CONSTRAINT "onboarding_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_steps"
    ADD CONSTRAINT "onboarding_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_themes"
    ADD CONSTRAINT "organization_themes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rag_chat_history"
    ADD CONSTRAINT "rag_chat_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."routing_rules"
    ADD CONSTRAINT "routing_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_alerts"
    ADD CONSTRAINT "security_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skills"
    ADD CONSTRAINT "skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sla_events"
    ADD CONSTRAINT "sla_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sla_policies"
    ADD CONSTRAINT "sla_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sla_policy_templates"
    ADD CONSTRAINT "sla_policy_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_assignments"
    ADD CONSTRAINT "team_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("team_id", "profile_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_attachments"
    ADD CONSTRAINT "ticket_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_field_values"
    ADD CONSTRAINT "ticket_field_values_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_fields"
    ADD CONSTRAINT "ticket_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_forms"
    ADD CONSTRAINT "ticket_forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_labels"
    ADD CONSTRAINT "ticket_labels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."widget_configurations"
    ADD CONSTRAINT "widget_configurations_pkey" PRIMARY KEY ("id");



CREATE INDEX "AuthAttempt_created_at_idx" ON "public"."AuthAttempt" USING "btree" ("created_at");



CREATE INDEX "AuthAttempt_ip_address_email_idx" ON "public"."AuthAttempt" USING "btree" ("ip_address", "email");



CREATE INDEX "AuthBlock_blocked_until_idx" ON "public"."AuthBlock" USING "btree" ("blocked_until");



CREATE INDEX "AuthBlock_ip_address_email_idx" ON "public"."AuthBlock" USING "btree" ("ip_address", "email");



CREATE INDEX "TicketAttribute_ticketTypeId_idx" ON "public"."TicketAttribute" USING "btree" ("ticketTypeId");



CREATE UNIQUE INDEX "TicketAttribute_ticketTypeId_name_key" ON "public"."TicketAttribute" USING "btree" ("ticketTypeId", "name");



CREATE INDEX "TicketComment_authorId_idx" ON "public"."TicketComment" USING "btree" ("authorId");



CREATE INDEX "TicketComment_ticketId_idx" ON "public"."TicketComment" USING "btree" ("ticketId");



CREATE INDEX "TicketConversation_conversationId_idx" ON "public"."TicketConversation" USING "btree" ("conversationId");



CREATE INDEX "TicketConversation_ticketId_idx" ON "public"."TicketConversation" USING "btree" ("ticketId");



CREATE UNIQUE INDEX "TicketState_name_key" ON "public"."TicketState" USING "btree" ("name");



CREATE INDEX "TicketState_organizationId_idx" ON "public"."TicketState" USING "btree" ("organizationId");



CREATE INDEX "TicketStatusHistory_changedByUserId_idx" ON "public"."TicketStatusHistory" USING "btree" ("changedByUserId");



CREATE INDEX "TicketStatusHistory_newStatusId_idx" ON "public"."TicketStatusHistory" USING "btree" ("newStatusId");



CREATE INDEX "TicketStatusHistory_ticketId_idx" ON "public"."TicketStatusHistory" USING "btree" ("ticketId");



CREATE UNIQUE INDEX "TicketType_name_key" ON "public"."TicketType" USING "btree" ("name");



CREATE INDEX "TicketType_organizationId_idx" ON "public"."TicketType" USING "btree" ("organizationId");



CREATE INDEX "Ticket_assignedAgentId_idx" ON "public"."Ticket" USING "btree" ("assignedAgentId");



CREATE INDEX "Ticket_customerId_idx" ON "public"."Ticket" USING "btree" ("customerId");



CREATE INDEX "Ticket_dueAt_idx" ON "public"."Ticket" USING "btree" ("dueAt");



CREATE INDEX "Ticket_organizationId_idx" ON "public"."Ticket" USING "btree" ("organizationId");



CREATE INDEX "Ticket_priority_idx" ON "public"."Ticket" USING "btree" ("priority");



CREATE INDEX "Ticket_resolvedAt_idx" ON "public"."Ticket" USING "btree" ("resolvedAt");



CREATE INDEX "Ticket_statusId_idx" ON "public"."Ticket" USING "btree" ("statusId");



CREATE INDEX "Ticket_ticketTypeId_idx" ON "public"."Ticket" USING "btree" ("ticketTypeId");



CREATE INDEX "_ProfileSkills_B_index" ON "public"."_ProfileSkills" USING "btree" ("B");



CREATE INDEX "_RuleTargetTeams_B_index" ON "public"."_RuleTargetTeams" USING "btree" ("B");



CREATE INDEX "_RuleTicketTypes_B_index" ON "public"."_RuleTicketTypes" USING "btree" ("B");



CREATE INDEX "_TicketToTicketLabel_B_index" ON "public"."_TicketToTicketLabel" USING "btree" ("B");



CREATE INDEX "audit_logs_created_at_idx" ON "public"."audit_logs" USING "btree" ("created_at");



CREATE INDEX "audit_logs_event_type_idx" ON "public"."audit_logs" USING "btree" ("event_type");



CREATE INDEX "audit_logs_organization_id_idx" ON "public"."audit_logs" USING "btree" ("organization_id");



CREATE INDEX "audit_logs_user_id_idx" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE UNIQUE INDEX "conversation_participants_conversation_id_profile_id_key" ON "public"."conversation_participants" USING "btree" ("conversation_id", "profile_id");



CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "public"."email_verification_tokens" USING "btree" ("token");



CREATE INDEX "idx_conversation_participants_profile" ON "public"."conversation_participants" USING "btree" ("profile_id");



CREATE INDEX "idx_conversations_last_message" ON "public"."conversations" USING "btree" ("last_message_at" DESC);



CREATE INDEX "idx_conversations_org_status" ON "public"."conversations" USING "btree" ("organization_id", "status");



CREATE INDEX "idx_knowledge_documents_embedding" ON "public"."knowledge_documents" USING "ivfflat" ("embedding" "extensions"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "idx_knowledge_documents_search" ON "public"."knowledge_documents" USING "gin" ("search_vector");



CREATE INDEX "idx_messages_conversation_created" ON "public"."messages" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_organization_id" ON "public"."profiles" USING "btree" ("organization_id");



CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("user_id");



CREATE INDEX "messages_organization_id_idx" ON "public"."messages" USING "btree" ("organization_id");



CREATE INDEX "onboarding_progress_completedAt_idx" ON "public"."onboarding_progress" USING "btree" ("completedAt");



CREATE UNIQUE INDEX "onboarding_progress_profileId_stepId_key" ON "public"."onboarding_progress" USING "btree" ("profileId", "stepId");



CREATE INDEX "onboarding_progress_status_idx" ON "public"."onboarding_progress" USING "btree" ("status");



CREATE UNIQUE INDEX "onboarding_responses_profileId_questionKey_key" ON "public"."onboarding_responses" USING "btree" ("profileId", "questionKey");



CREATE INDEX "onboarding_responses_questionKey_idx" ON "public"."onboarding_responses" USING "btree" ("questionKey");



CREATE INDEX "onboarding_steps_category_idx" ON "public"."onboarding_steps" USING "btree" ("category");



CREATE INDEX "onboarding_steps_isActive_idx" ON "public"."onboarding_steps" USING "btree" ("isActive");



CREATE UNIQUE INDEX "onboarding_steps_key_organizationId_key" ON "public"."onboarding_steps" USING "btree" ("key", "organizationId");



CREATE UNIQUE INDEX "organization_themes_organization_id_name_key" ON "public"."organization_themes" USING "btree" ("organization_id", "name");



CREATE UNIQUE INDEX "profiles_email_key" ON "public"."profiles" USING "btree" ("email");



CREATE UNIQUE INDEX "profiles_user_id_key" ON "public"."profiles" USING "btree" ("user_id");



CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "public"."refresh_tokens" USING "btree" ("token");



CREATE INDEX "routing_rules_isActive_priority_idx" ON "public"."routing_rules" USING "btree" ("isActive", "priority");



CREATE INDEX "routing_rules_organizationId_idx" ON "public"."routing_rules" USING "btree" ("organizationId");



CREATE INDEX "security_alerts_category_idx" ON "public"."security_alerts" USING "btree" ("category");



CREATE INDEX "security_alerts_organizationId_idx" ON "public"."security_alerts" USING "btree" ("organizationId");



CREATE INDEX "security_alerts_severity_idx" ON "public"."security_alerts" USING "btree" ("severity");



CREATE INDEX "security_alerts_status_idx" ON "public"."security_alerts" USING "btree" ("status");



CREATE INDEX "security_alerts_timestamp_idx" ON "public"."security_alerts" USING "btree" ("timestamp");



CREATE INDEX "security_alerts_userId_idx" ON "public"."security_alerts" USING "btree" ("userId");



CREATE INDEX "sessions_expires_at_idx" ON "public"."sessions" USING "btree" ("expires_at");



CREATE INDEX "sessions_refresh_token_idx" ON "public"."sessions" USING "btree" ("refresh_token");



CREATE UNIQUE INDEX "sessions_refresh_token_key" ON "public"."sessions" USING "btree" ("refresh_token");



CREATE INDEX "sessions_user_id_idx" ON "public"."sessions" USING "btree" ("user_id");



CREATE UNIQUE INDEX "skills_name_key" ON "public"."skills" USING "btree" ("name");



CREATE INDEX "skills_organization_id_idx" ON "public"."skills" USING "btree" ("organization_id");



CREATE INDEX "sla_events_dueAt_idx" ON "public"."sla_events" USING "btree" ("dueAt");



CREATE INDEX "sla_events_status_idx" ON "public"."sla_events" USING "btree" ("status");



CREATE INDEX "sla_events_ticketId_idx" ON "public"."sla_events" USING "btree" ("ticketId");



CREATE INDEX "sla_events_type_idx" ON "public"."sla_events" USING "btree" ("type");



CREATE INDEX "sla_policies_priority_idx" ON "public"."sla_policies" USING "btree" ("priority");



CREATE INDEX "sla_policies_templateId_idx" ON "public"."sla_policies" USING "btree" ("templateId");



CREATE INDEX "sla_policies_ticketTypeId_idx" ON "public"."sla_policies" USING "btree" ("ticketTypeId");



CREATE UNIQUE INDEX "sla_policy_templates_name_organizationId_key" ON "public"."sla_policy_templates" USING "btree" ("name", "organizationId");



CREATE INDEX "sla_policy_templates_organizationId_idx" ON "public"."sla_policy_templates" USING "btree" ("organizationId");



CREATE UNIQUE INDEX "team_assignments_team_id_conversation_id_key" ON "public"."team_assignments" USING "btree" ("team_id", "conversation_id");



CREATE INDEX "ticket_attachments_ticketId_idx" ON "public"."ticket_attachments" USING "btree" ("ticketId");



CREATE INDEX "ticket_attachments_uploadedBy_idx" ON "public"."ticket_attachments" USING "btree" ("uploadedBy");



CREATE INDEX "ticket_field_values_fieldId_idx" ON "public"."ticket_field_values" USING "btree" ("fieldId");



CREATE UNIQUE INDEX "ticket_field_values_fieldId_ticketId_key" ON "public"."ticket_field_values" USING "btree" ("fieldId", "ticketId");



CREATE INDEX "ticket_field_values_ticketId_idx" ON "public"."ticket_field_values" USING "btree" ("ticketId");



CREATE UNIQUE INDEX "ticket_fields_name_organizationId_key" ON "public"."ticket_fields" USING "btree" ("name", "organizationId");



CREATE INDEX "ticket_fields_organizationId_idx" ON "public"."ticket_fields" USING "btree" ("organizationId");



CREATE INDEX "ticket_fields_type_idx" ON "public"."ticket_fields" USING "btree" ("type");



CREATE UNIQUE INDEX "ticket_forms_name_organizationId_key" ON "public"."ticket_forms" USING "btree" ("name", "organizationId");



CREATE INDEX "ticket_forms_organizationId_idx" ON "public"."ticket_forms" USING "btree" ("organizationId");



CREATE INDEX "ticket_forms_ticketTypeId_idx" ON "public"."ticket_forms" USING "btree" ("ticketTypeId");



CREATE UNIQUE INDEX "ticket_labels_name_organizationId_key" ON "public"."ticket_labels" USING "btree" ("name", "organizationId");



CREATE INDEX "ticket_labels_organizationId_idx" ON "public"."ticket_labels" USING "btree" ("organizationId");



CREATE UNIQUE INDEX "unique_feature_flag_per_org" ON "public"."feature_flags" USING "btree" ("name", "organization_id");



CREATE INDEX "widget_configurations_organization_id_idx" ON "public"."widget_configurations" USING "btree" ("organization_id");



CREATE UNIQUE INDEX "widget_configurations_organization_id_key" ON "public"."widget_configurations" USING "btree" ("organization_id");



CREATE OR REPLACE TRIGGER "generate_embeddings_trigger" BEFORE INSERT OR UPDATE OF "title", "content" ON "public"."knowledge_documents" FOR EACH ROW EXECUTE FUNCTION "public"."generate_embeddings"();



CREATE OR REPLACE TRIGGER "knowledge_documents_search_update" BEFORE INSERT OR UPDATE ON "public"."knowledge_documents" FOR EACH ROW EXECUTE FUNCTION "public"."knowledge_documents_search_trigger"();



ALTER TABLE ONLY "public"."TicketAttribute"
    ADD CONSTRAINT "TicketAttribute_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "public"."TicketType"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."TicketComment"
    ADD CONSTRAINT "TicketComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."TicketComment"
    ADD CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."Ticket"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."TicketConversation"
    ADD CONSTRAINT "TicketConversation_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."TicketConversation"
    ADD CONSTRAINT "TicketConversation_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."Ticket"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."TicketState"
    ADD CONSTRAINT "TicketState_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."TicketStatusHistory"
    ADD CONSTRAINT "TicketStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."TicketStatusHistory"
    ADD CONSTRAINT "TicketStatusHistory_newStatusId_fkey" FOREIGN KEY ("newStatusId") REFERENCES "public"."TicketState"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."TicketStatusHistory"
    ADD CONSTRAINT "TicketStatusHistory_oldStatusId_fkey" FOREIGN KEY ("oldStatusId") REFERENCES "public"."TicketState"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."TicketStatusHistory"
    ADD CONSTRAINT "TicketStatusHistory_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."Ticket"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."TicketType"
    ADD CONSTRAINT "TicketType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Ticket"
    ADD CONSTRAINT "Ticket_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Ticket"
    ADD CONSTRAINT "Ticket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Ticket"
    ADD CONSTRAINT "Ticket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Ticket"
    ADD CONSTRAINT "Ticket_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."TicketState"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Ticket"
    ADD CONSTRAINT "Ticket_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "public"."TicketType"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."_ProfileSkills"
    ADD CONSTRAINT "_ProfileSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."_ProfileSkills"
    ADD CONSTRAINT "_ProfileSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."skills"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."_RuleTargetTeams"
    ADD CONSTRAINT "_RuleTargetTeams_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."routing_rules"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."_RuleTargetTeams"
    ADD CONSTRAINT "_RuleTargetTeams_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."teams"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."_RuleTicketTypes"
    ADD CONSTRAINT "_RuleTicketTypes_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."routing_rules"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."_RuleTicketTypes"
    ADD CONSTRAINT "_RuleTicketTypes_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."TicketType"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."_TicketToTicketLabel"
    ADD CONSTRAINT "_TicketToTicketLabel_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Ticket"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."_TicketToTicketLabel"
    ADD CONSTRAINT "_TicketToTicketLabel_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."ticket_labels"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_initiator_id_fkey" FOREIGN KEY ("initiator_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."email_verification_tokens"
    ADD CONSTRAINT "email_verification_tokens_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."knowledge_documents"
    ADD CONSTRAINT "knowledge_documents_knowledge_base_id_fkey" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_base"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "public"."messages"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."onboarding_progress"
    ADD CONSTRAINT "onboarding_progress_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_progress"
    ADD CONSTRAINT "onboarding_progress_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "public"."onboarding_steps"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_responses"
    ADD CONSTRAINT "onboarding_responses_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_steps"
    ADD CONSTRAINT "onboarding_steps_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_themes"
    ADD CONSTRAINT "organization_themes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routing_rules"
    ADD CONSTRAINT "routing_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sla_events"
    ADD CONSTRAINT "sla_events_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."Ticket"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sla_policies"
    ADD CONSTRAINT "sla_policies_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."sla_policy_templates"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_assignments"
    ADD CONSTRAINT "team_assignments_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."team_assignments"
    ADD CONSTRAINT "team_assignments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ticket_attachments"
    ADD CONSTRAINT "ticket_attachments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."Ticket"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_field_values"
    ADD CONSTRAINT "ticket_field_values_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "public"."ticket_fields"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_field_values"
    ADD CONSTRAINT "ticket_field_values_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."Ticket"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversations_isolation" ON "public"."conversations" USING (((("organization_id")::"text" = (("auth"."jwt"() -> 'org_id'::"text"))::"text") OR ("auth"."role"() = 'service_role'::"text")));



ALTER TABLE "public"."knowledge_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "knowledge_documents_isolation" ON "public"."knowledge_documents" USING (((EXISTS ( SELECT 1
   FROM "public"."knowledge_base" "kb"
  WHERE (("kb"."id" = "knowledge_documents"."knowledge_base_id") AND (("kb"."organization_id")::"text" = (("auth"."jwt"() -> 'org_id'::"text"))::"text")))) OR ("auth"."role"() = 'service_role'::"text")));



ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_isolation" ON "public"."messages" USING (((("organization_id")::"text" = (("auth"."jwt"() -> 'org_id'::"text"))::"text") OR ("auth"."role"() = 'service_role'::"text")));



ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "organizations_isolation" ON "public"."organizations" USING (((("id")::"text" = (("auth"."jwt"() -> 'org_id'::"text"))::"text") OR ("auth"."role"() = 'service_role'::"text")));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_isolation" ON "public"."profiles" USING (((("organization_id")::"text" = (("auth"."jwt"() -> 'org_id'::"text"))::"text") OR ("auth"."role"() = 'service_role'::"text")));



ALTER TABLE "public"."rag_chat_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rag_chat_history_isolation" ON "public"."rag_chat_history" USING (((EXISTS ( SELECT 1
   FROM "public"."conversations" "c"
  WHERE (("c"."id" = "rag_chat_history"."conversation_id") AND (("c"."organization_id")::"text" = (("auth"."jwt"() -> 'org_id'::"text"))::"text")))) OR ("auth"."role"() = 'service_role'::"text")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "internal" TO "authenticated";
GRANT USAGE ON SCHEMA "internal" TO "anon";
GRANT USAGE ON SCHEMA "internal" TO "service_role";



REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";

































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "internal"."get_user_organization_ids"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "internal"."get_user_organization_ids"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "internal"."get_user_organization_ids"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "internal"."is_user_agent"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "internal"."is_user_agent"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "internal"."is_user_agent"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "internal"."is_user_in_organization"("user_id" "uuid", "org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "internal"."is_user_in_organization"("user_id" "uuid", "org_id" "uuid") TO "anon";






























GRANT ALL ON TABLE "public"."AuthAttempt" TO "service_role";
GRANT SELECT ON TABLE "public"."AuthAttempt" TO "anon";
GRANT SELECT ON TABLE "public"."AuthAttempt" TO "authenticated";



GRANT ALL ON TABLE "public"."AuthBlock" TO "service_role";
GRANT SELECT ON TABLE "public"."AuthBlock" TO "anon";
GRANT SELECT ON TABLE "public"."AuthBlock" TO "authenticated";



GRANT ALL ON TABLE "public"."Ticket" TO "service_role";
GRANT SELECT ON TABLE "public"."Ticket" TO "anon";
GRANT SELECT ON TABLE "public"."Ticket" TO "authenticated";



GRANT ALL ON TABLE "public"."TicketAttribute" TO "service_role";
GRANT SELECT ON TABLE "public"."TicketAttribute" TO "anon";
GRANT SELECT ON TABLE "public"."TicketAttribute" TO "authenticated";



GRANT ALL ON TABLE "public"."TicketComment" TO "service_role";
GRANT SELECT ON TABLE "public"."TicketComment" TO "anon";
GRANT SELECT ON TABLE "public"."TicketComment" TO "authenticated";



GRANT ALL ON TABLE "public"."TicketConversation" TO "service_role";
GRANT SELECT ON TABLE "public"."TicketConversation" TO "anon";
GRANT SELECT ON TABLE "public"."TicketConversation" TO "authenticated";



GRANT ALL ON TABLE "public"."TicketState" TO "service_role";
GRANT SELECT ON TABLE "public"."TicketState" TO "anon";
GRANT SELECT ON TABLE "public"."TicketState" TO "authenticated";



GRANT ALL ON TABLE "public"."TicketStatusHistory" TO "service_role";
GRANT SELECT ON TABLE "public"."TicketStatusHistory" TO "anon";
GRANT SELECT ON TABLE "public"."TicketStatusHistory" TO "authenticated";



GRANT ALL ON TABLE "public"."TicketType" TO "service_role";
GRANT SELECT ON TABLE "public"."TicketType" TO "anon";
GRANT SELECT ON TABLE "public"."TicketType" TO "authenticated";



GRANT ALL ON TABLE "public"."_ProfileSkills" TO "service_role";
GRANT SELECT ON TABLE "public"."_ProfileSkills" TO "anon";
GRANT SELECT ON TABLE "public"."_ProfileSkills" TO "authenticated";



GRANT ALL ON TABLE "public"."_RuleTargetTeams" TO "service_role";
GRANT SELECT ON TABLE "public"."_RuleTargetTeams" TO "anon";
GRANT SELECT ON TABLE "public"."_RuleTargetTeams" TO "authenticated";



GRANT ALL ON TABLE "public"."_RuleTicketTypes" TO "service_role";
GRANT SELECT ON TABLE "public"."_RuleTicketTypes" TO "anon";
GRANT SELECT ON TABLE "public"."_RuleTicketTypes" TO "authenticated";



GRANT ALL ON TABLE "public"."_TicketToTicketLabel" TO "service_role";
GRANT SELECT ON TABLE "public"."_TicketToTicketLabel" TO "anon";
GRANT SELECT ON TABLE "public"."_TicketToTicketLabel" TO "authenticated";



GRANT ALL ON TABLE "public"."attachments" TO "service_role";
GRANT SELECT ON TABLE "public"."attachments" TO "anon";
GRANT SELECT ON TABLE "public"."attachments" TO "authenticated";



GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";
GRANT SELECT ON TABLE "public"."audit_logs" TO "anon";
GRANT SELECT ON TABLE "public"."audit_logs" TO "authenticated";



GRANT ALL ON TABLE "public"."canned_responses" TO "service_role";
GRANT SELECT ON TABLE "public"."canned_responses" TO "anon";
GRANT SELECT ON TABLE "public"."canned_responses" TO "authenticated";



GRANT ALL ON TABLE "public"."conversation_metrics" TO "service_role";
GRANT SELECT ON TABLE "public"."conversation_metrics" TO "anon";
GRANT SELECT ON TABLE "public"."conversation_metrics" TO "authenticated";



GRANT ALL ON TABLE "public"."conversation_participants" TO "service_role";
GRANT SELECT ON TABLE "public"."conversation_participants" TO "anon";
GRANT SELECT ON TABLE "public"."conversation_participants" TO "authenticated";



GRANT ALL ON TABLE "public"."conversations" TO "service_role";
GRANT SELECT ON TABLE "public"."conversations" TO "anon";
GRANT SELECT ON TABLE "public"."conversations" TO "authenticated";



GRANT ALL ON TABLE "public"."email_verification_tokens" TO "service_role";
GRANT SELECT ON TABLE "public"."email_verification_tokens" TO "anon";
GRANT SELECT ON TABLE "public"."email_verification_tokens" TO "authenticated";



GRANT ALL ON TABLE "public"."feature_flags" TO "service_role";
GRANT SELECT ON TABLE "public"."feature_flags" TO "anon";
GRANT SELECT ON TABLE "public"."feature_flags" TO "authenticated";



GRANT ALL ON TABLE "public"."messages" TO "service_role";
GRANT SELECT ON TABLE "public"."messages" TO "anon";
GRANT SELECT ON TABLE "public"."messages" TO "authenticated";



GRANT ALL ON TABLE "public"."notifications" TO "service_role";
GRANT SELECT ON TABLE "public"."notifications" TO "anon";
GRANT SELECT ON TABLE "public"."notifications" TO "authenticated";



GRANT ALL ON TABLE "public"."onboarding_progress" TO "service_role";
GRANT SELECT ON TABLE "public"."onboarding_progress" TO "anon";
GRANT SELECT ON TABLE "public"."onboarding_progress" TO "authenticated";



GRANT ALL ON TABLE "public"."onboarding_responses" TO "service_role";
GRANT SELECT ON TABLE "public"."onboarding_responses" TO "anon";
GRANT SELECT ON TABLE "public"."onboarding_responses" TO "authenticated";



GRANT ALL ON TABLE "public"."onboarding_steps" TO "service_role";
GRANT SELECT ON TABLE "public"."onboarding_steps" TO "anon";
GRANT SELECT ON TABLE "public"."onboarding_steps" TO "authenticated";



GRANT ALL ON TABLE "public"."organization_themes" TO "service_role";
GRANT SELECT ON TABLE "public"."organization_themes" TO "anon";
GRANT SELECT ON TABLE "public"."organization_themes" TO "authenticated";



GRANT ALL ON TABLE "public"."organizations" TO "service_role";
GRANT SELECT ON TABLE "public"."organizations" TO "anon";
GRANT SELECT ON TABLE "public"."organizations" TO "authenticated";



GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT SELECT ON TABLE "public"."profiles" TO "anon";
GRANT SELECT ON TABLE "public"."profiles" TO "authenticated";



GRANT ALL ON TABLE "public"."refresh_tokens" TO "service_role";
GRANT SELECT ON TABLE "public"."refresh_tokens" TO "anon";
GRANT SELECT ON TABLE "public"."refresh_tokens" TO "authenticated";



GRANT ALL ON TABLE "public"."routing_rules" TO "service_role";
GRANT SELECT ON TABLE "public"."routing_rules" TO "anon";
GRANT SELECT ON TABLE "public"."routing_rules" TO "authenticated";



GRANT ALL ON TABLE "public"."security_alerts" TO "service_role";
GRANT SELECT ON TABLE "public"."security_alerts" TO "anon";
GRANT SELECT ON TABLE "public"."security_alerts" TO "authenticated";



GRANT ALL ON TABLE "public"."sessions" TO "service_role";
GRANT SELECT ON TABLE "public"."sessions" TO "anon";
GRANT SELECT ON TABLE "public"."sessions" TO "authenticated";



GRANT ALL ON TABLE "public"."skills" TO "service_role";
GRANT SELECT ON TABLE "public"."skills" TO "anon";
GRANT SELECT ON TABLE "public"."skills" TO "authenticated";



GRANT ALL ON TABLE "public"."sla_events" TO "service_role";
GRANT SELECT ON TABLE "public"."sla_events" TO "anon";
GRANT SELECT ON TABLE "public"."sla_events" TO "authenticated";



GRANT ALL ON TABLE "public"."sla_policies" TO "service_role";
GRANT SELECT ON TABLE "public"."sla_policies" TO "anon";
GRANT SELECT ON TABLE "public"."sla_policies" TO "authenticated";



GRANT ALL ON TABLE "public"."sla_policy_templates" TO "service_role";
GRANT SELECT ON TABLE "public"."sla_policy_templates" TO "anon";
GRANT SELECT ON TABLE "public"."sla_policy_templates" TO "authenticated";



GRANT ALL ON TABLE "public"."team_assignments" TO "service_role";
GRANT SELECT ON TABLE "public"."team_assignments" TO "anon";
GRANT SELECT ON TABLE "public"."team_assignments" TO "authenticated";



GRANT ALL ON TABLE "public"."team_members" TO "service_role";
GRANT SELECT ON TABLE "public"."team_members" TO "anon";
GRANT SELECT ON TABLE "public"."team_members" TO "authenticated";



GRANT ALL ON TABLE "public"."teams" TO "service_role";
GRANT SELECT ON TABLE "public"."teams" TO "anon";
GRANT SELECT ON TABLE "public"."teams" TO "authenticated";



GRANT ALL ON TABLE "public"."ticket_attachments" TO "service_role";
GRANT SELECT ON TABLE "public"."ticket_attachments" TO "anon";
GRANT SELECT ON TABLE "public"."ticket_attachments" TO "authenticated";



GRANT ALL ON TABLE "public"."ticket_field_values" TO "service_role";
GRANT SELECT ON TABLE "public"."ticket_field_values" TO "anon";
GRANT SELECT ON TABLE "public"."ticket_field_values" TO "authenticated";



GRANT ALL ON TABLE "public"."ticket_fields" TO "service_role";
GRANT SELECT ON TABLE "public"."ticket_fields" TO "anon";
GRANT SELECT ON TABLE "public"."ticket_fields" TO "authenticated";



GRANT ALL ON TABLE "public"."ticket_forms" TO "service_role";
GRANT SELECT ON TABLE "public"."ticket_forms" TO "anon";
GRANT SELECT ON TABLE "public"."ticket_forms" TO "authenticated";



GRANT ALL ON TABLE "public"."ticket_labels" TO "service_role";
GRANT SELECT ON TABLE "public"."ticket_labels" TO "anon";
GRANT SELECT ON TABLE "public"."ticket_labels" TO "authenticated";



GRANT ALL ON TABLE "public"."widget_configurations" TO "service_role";
GRANT SELECT ON TABLE "public"."widget_configurations" TO "anon";
GRANT SELECT ON TABLE "public"."widget_configurations" TO "authenticated";

































RESET ALL;
