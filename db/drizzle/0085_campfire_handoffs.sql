-- Migration: campfire handoff queue & logs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS campfire_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES campfire_channels(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES rag_profiles(id) ON DELETE SET NULL,
  draft TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to update updated_at on update
DROP TRIGGER IF EXISTS set_timestamp_handoffs ON campfire_handoffs;
CREATE TRIGGER set_timestamp_handoffs
BEFORE UPDATE ON campfire_handoffs
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TABLE IF NOT EXISTS campfire_handoff_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handoff_id UUID NOT NULL REFERENCES campfire_handoffs(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  user_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB
);