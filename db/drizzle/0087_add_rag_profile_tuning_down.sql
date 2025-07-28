-- Down migration: Remove vector similarity tuning parameters from rag_profiles table
-- Removes threshold and k columns from RAG profile configuration

ALTER TABLE rag_profiles
  DROP COLUMN IF EXISTS threshold,
  DROP COLUMN IF EXISTS k;