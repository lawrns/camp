-- Migration: Add vector similarity tuning parameters to rag_profiles table
-- Adds threshold and k columns for RAG profile configuration

ALTER TABLE rag_profiles
  ADD COLUMN threshold real NOT NULL DEFAULT 0.7,
  ADD COLUMN k integer NOT NULL DEFAULT 5;

-- Add comment for clarity
COMMENT ON COLUMN rag_profiles.threshold IS 'Maximum vector distance threshold for retrieving relevant chunks';
COMMENT ON COLUMN rag_profiles.k IS 'Number of top similar chunks to retrieve';