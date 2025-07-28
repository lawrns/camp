-- Migration: Add missing customer_ip column to conversations table
-- Date: 2025-06-29
-- Purpose: Fix critical widget functionality by adding required customer_ip field

-- Add missing customer_ip column to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS customer_ip VARCHAR(45) DEFAULT NULL;

-- Update the column with a comment for clarity
COMMENT ON COLUMN conversations.customer_ip IS 'IP address of the customer/visitor';

-- Add index for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_conversations_customer_ip 
ON conversations(customer_ip) 
WHERE customer_ip IS NOT NULL;

-- Verify the column was added successfully
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'customer_ip'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'SUCCESS: customer_ip column added to conversations table';
    ELSE
        RAISE EXCEPTION 'FAILED: customer_ip column was not added to conversations table';
    END IF;
END $$;
