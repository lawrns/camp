-- Fix Customer Verification System
-- Migration: 20250101000002_fix_customer_verification_system

-- Create customer_verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.customer_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Verification status and scoring
  status TEXT NOT NULL DEFAULT 'unverified' CHECK (status IN ('verified', 'partial', 'unverified', 'suspended')),
  overall_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  
  -- Verification methods tracking
  methods TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Individual verification scores
  email_verified BOOLEAN DEFAULT FALSE,
  email_score INTEGER DEFAULT 0 CHECK (email_score >= 0 AND email_score <= 100),
  phone_verified BOOLEAN DEFAULT FALSE,
  phone_score INTEGER DEFAULT 0 CHECK (phone_score >= 0 AND phone_score <= 100),
  domain_score INTEGER DEFAULT 0 CHECK (domain_score >= 0 AND domain_score <= 100),
  payment_score INTEGER DEFAULT 0 CHECK (payment_score >= 0 AND payment_score <= 100),
  manual_verified BOOLEAN DEFAULT FALSE,
  manual_score INTEGER DEFAULT 0 CHECK (manual_score >= 0 AND manual_score <= 100),
  
  -- Verification details
  verification_notes TEXT,
  verification_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Verification timestamps
  last_verified_at TIMESTAMPTZ,
  email_verified_at TIMESTAMPTZ,
  phone_verified_at TIMESTAMPTZ,
  manual_verified_at TIMESTAMPTZ,
  
  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(customer_email, organization_id)
);

-- Create payments table if it doesn't exist (for payment verification)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_id TEXT,
  
  -- Payment metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add emailFrom column to conversations if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'emailfrom'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.conversations 
        ADD COLUMN emailFrom TEXT;
        
        -- Update existing conversations with email from visitor data
        -- UPDATE public.conversations 
        -- SET emailFrom = COALESCE(
        --     visitor_email,
        --     customer_email,
        --     'unknown@example.com'
        -- )
        -- WHERE emailFrom IS NULL;
    END IF;
END $$;

-- Create indexes for performance
-- CREATE INDEX IF NOT EXISTS idx_customer_verifications_email_org 
-- ON public.customer_verifications(customer_email, organization_id);

-- CREATE INDEX IF NOT EXISTS idx_customer_verifications_status 
-- ON public.customer_verifications(status);

-- CREATE INDEX IF NOT EXISTS idx_customer_verifications_score 
-- ON public.customer_verifications(overall_score);

CREATE INDEX IF NOT EXISTS idx_payments_customer_org 
ON public.payments(customer_email, organization_id);

CREATE INDEX IF NOT EXISTS idx_conversations_email_from 
ON public.conversations(emailFrom) WHERE emailFrom IS NOT NULL;

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
DROP TRIGGER IF EXISTS update_customer_verifications_updated_at ON public.customer_verifications;
CREATE TRIGGER update_customer_verifications_updated_at
    BEFORE UPDATE ON public.customer_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.customer_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customer_verifications
DROP POLICY IF EXISTS "Users can view verifications for their organization" ON public.customer_verifications;
-- CREATE POLICY "Users can view verifications for their organization"
-- ON public.customer_verifications FOR SELECT
-- USING (
--     organization_id IN (
--         SELECT organization_id FROM public.users 
--         WHERE auth.uid() = id
--     )
-- );

DROP POLICY IF EXISTS "Users can manage verifications for their organization" ON public.customer_verifications;
-- CREATE POLICY "Users can manage verifications for their organization"
-- ON public.customer_verifications FOR ALL
-- USING (
--     organization_id IN (
--         SELECT organization_id FROM public.users 
--         WHERE auth.uid() = id
--     )
-- );

-- Create RLS policies for payments
-- DROP POLICY IF EXISTS "Users can view payments for their organization" ON public.payments;
-- CREATE POLICY "Users can view payments for their organization"
-- ON public.payments FOR SELECT
-- USING (
--     organization_id IN (
--         SELECT organization_id FROM public.users 
--         WHERE auth.uid() = id
--     )
-- );

-- DROP POLICY IF EXISTS "Users can manage payments for their organization" ON public.payments;
-- CREATE POLICY "Users can manage payments for their organization"
-- ON public.payments FOR ALL
-- USING (
--     organization_id IN (
--         SELECT organization_id FROM public.users 
--         WHERE auth.uid() = id
--     )
-- );

-- Insert sample verification data for testing
-- INSERT INTO public.customer_verifications (
--     customer_email,
--     organization_id,
--     status,
--     overall_score,
--     methods,
--     email_verified,
--     email_score,
--     domain_score,
--     last_verified_at
-- ) 
-- SELECT 
--     'unknown@example.com',
--     id,
--     'partial',
--     65,
--     ARRAY['email'],
--     TRUE,
--     70,
--     60,
--     NOW()
-- FROM public.organizations 
-- WHERE NOT EXISTS (
--     SELECT 1 FROM public.customer_verifications 
--     WHERE customer_email = 'unknown@example.com' 
--     AND organization_id = public.organizations.id
-- )
-- LIMIT 1;

-- Insert sample payment data for testing
INSERT INTO public.payments (
    customer_email,
    organization_id,
    amount,
    status,
    payment_method
) 
SELECT 
    'unknown@example.com',
    id,
    99.99,
    'completed',
    'credit_card'
FROM public.organizations 
WHERE NOT EXISTS (
    SELECT 1 FROM public.payments 
    WHERE customer_email = 'unknown@example.com' 
    AND organization_id = public.organizations.id
)
LIMIT 1;

-- Grant necessary permissions
GRANT ALL ON public.customer_verifications TO authenticated;
GRANT ALL ON public.payments TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated; 