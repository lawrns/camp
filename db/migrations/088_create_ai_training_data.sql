-- Migration: Create AI Training Data Tables
-- Creates comprehensive AI training data infrastructure

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ai_training_data table
CREATE TABLE IF NOT EXISTS ai_training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Data categorization
  data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('conversation', 'message', 'document', 'faq', 'knowledge')),
  category VARCHAR(100) NOT NULL,
  
  -- Training content
  content JSONB NOT NULL,
  labels TEXT[] DEFAULT '{}',
  
  -- Quality and validation
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
  is_validated BOOLEAN DEFAULT FALSE,
  validated_by UUID,
  validated_at TIMESTAMP WITH TIME ZONE,
  
  -- Versioning
  version VARCHAR(50) DEFAULT '1.0',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Foreign key constraints
  CONSTRAINT fk_ai_training_data_organization 
    FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_ai_training_data_creator 
    FOREIGN KEY (created_by) 
    REFERENCES profiles(user_id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_ai_training_data_validator 
    FOREIGN KEY (validated_by) 
    REFERENCES profiles(user_id) 
    ON DELETE SET NULL
);

-- Create ai_training_data_batches table
CREATE TABLE IF NOT EXISTS ai_training_data_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Batch statistics
  total_records INTEGER DEFAULT 0,
  validated_records INTEGER DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'in_use', 'archived')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID NOT NULL,
  
  -- Foreign key constraints
  CONSTRAINT fk_ai_training_batches_organization 
    FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_ai_training_batches_creator 
    FOREIGN KEY (created_by) 
    REFERENCES profiles(user_id) 
    ON DELETE CASCADE
);

-- Create ai_training_data_batch_items table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS ai_training_data_batch_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL,
  training_data_id UUID NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Foreign key constraints
  CONSTRAINT fk_batch_items_batch 
    FOREIGN KEY (batch_id) 
    REFERENCES ai_training_data_batches(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_batch_items_training_data 
    FOREIGN KEY (training_data_id) 
    REFERENCES ai_training_data(id) 
    ON DELETE CASCADE,
    
  -- Unique constraint to prevent duplicates
  CONSTRAINT unique_batch_training_data 
    UNIQUE (batch_id, training_data_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_training_data_organization_id ON ai_training_data(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_data_type ON ai_training_data(data_type);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_category ON ai_training_data(category);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_is_validated ON ai_training_data(is_validated);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_created_at ON ai_training_data(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_quality_score ON ai_training_data(quality_score);

-- Indexes for batches
CREATE INDEX IF NOT EXISTS idx_ai_training_batches_organization_id ON ai_training_data_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_training_batches_status ON ai_training_data_batches(status);
CREATE INDEX IF NOT EXISTS idx_ai_training_batches_created_at ON ai_training_data_batches(created_at);

-- Indexes for batch items
CREATE INDEX IF NOT EXISTS idx_batch_items_batch_id ON ai_training_data_batch_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_items_training_data_id ON ai_training_data_batch_items(training_data_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_training_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ai_training_data_updated_at ON ai_training_data;
CREATE TRIGGER trigger_ai_training_data_updated_at
  BEFORE UPDATE ON ai_training_data
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_training_data_updated_at();

-- Function to update batch statistics when items are added/removed
CREATE OR REPLACE FUNCTION update_batch_statistics()
RETURNS TRIGGER AS $$
DECLARE
  batch_total INTEGER;
  batch_validated INTEGER;
BEGIN
  -- Determine which batch to update
  IF TG_OP = 'DELETE' THEN
    -- Count items in the old batch
    SELECT COUNT(*), COUNT(CASE WHEN td.is_validated THEN 1 END)
    INTO batch_total, batch_validated
    FROM ai_training_data_batch_items bi
    JOIN ai_training_data td ON td.id = bi.training_data_id
    WHERE bi.batch_id = OLD.batch_id;
    
    -- Update the batch
    UPDATE ai_training_data_batches SET
      total_records = batch_total,
      validated_records = batch_validated
    WHERE id = OLD.batch_id;
    
    RETURN OLD;
  ELSE
    -- Count items in the new batch
    SELECT COUNT(*), COUNT(CASE WHEN td.is_validated THEN 1 END)
    INTO batch_total, batch_validated
    FROM ai_training_data_batch_items bi
    JOIN ai_training_data td ON td.id = bi.training_data_id
    WHERE bi.batch_id = NEW.batch_id;
    
    -- Update the batch
    UPDATE ai_training_data_batches SET
      total_records = batch_total,
      validated_records = batch_validated
    WHERE id = NEW.batch_id;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for batch statistics
DROP TRIGGER IF EXISTS trigger_update_batch_stats_insert ON ai_training_data_batch_items;
CREATE TRIGGER trigger_update_batch_stats_insert
  AFTER INSERT ON ai_training_data_batch_items
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_statistics();

DROP TRIGGER IF EXISTS trigger_update_batch_stats_delete ON ai_training_data_batch_items;
CREATE TRIGGER trigger_update_batch_stats_delete
  AFTER DELETE ON ai_training_data_batch_items
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_statistics();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_training_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_training_data_batches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_training_data_batch_items TO authenticated;

-- Enable RLS
ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_data_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_data_batch_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_training_data
CREATE POLICY "Users can access training data for their organization" ON ai_training_data
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can access all training data" ON ai_training_data
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for ai_training_data_batches
CREATE POLICY "Users can access training batches for their organization" ON ai_training_data_batches
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can access all training batches" ON ai_training_data_batches
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for ai_training_data_batch_items
CREATE POLICY "Users can access batch items for their organization" ON ai_training_data_batch_items
  FOR ALL USING (
    batch_id IN (
      SELECT id FROM ai_training_data_batches 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can access all batch items" ON ai_training_data_batch_items
  FOR ALL USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE ai_training_data IS 'AI training data storage for machine learning and model fine-tuning';
COMMENT ON TABLE ai_training_data_batches IS 'Batches for organizing training data';
COMMENT ON TABLE ai_training_data_batch_items IS 'Many-to-many relationship between batches and training data';