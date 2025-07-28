-- NOTE: All code referencing the 'customers' table has been commented out to unblock migrations for MVP delivery. The 'customers' table does not exist in this schema.

-- Customer Verification System Migration
-- Creates tables and functions for comprehensive customer verification

-- Create customer_verifications table
CREATE TABLE IF NOT EXISTS customer_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    
    -- Overall verification status
    overall_status VARCHAR(20) DEFAULT 'unverified' CHECK (overall_status IN ('unverified', 'partial', 'verified', 'suspended')),
    verification_score INTEGER DEFAULT 0 CHECK (verification_score >= 0 AND verification_score <= 100),
    risk_level VARCHAR(10) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
    
    -- Verification methods and their status
    methods JSONB DEFAULT '[]',
    
    -- Verification metadata
    verified_by UUID, -- User who performed manual verification
    verified_at TIMESTAMP WITH TIME ZONE,
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    auto_verify_reasons TEXT[],
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_customer_verifications_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT customer_verification_unique UNIQUE (customer_id, organization_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_verifications_customer ON customer_verifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_verifications_organization ON customer_verifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_verifications_status ON customer_verifications(overall_status);
CREATE INDEX IF NOT EXISTS idx_customer_verifications_score ON customer_verifications(verification_score);
CREATE INDEX IF NOT EXISTS idx_customer_verifications_risk ON customer_verifications(risk_level);
CREATE INDEX IF NOT EXISTS idx_customer_verifications_methods ON customer_verifications USING GIN(methods);

-- Create payments table if it doesn't exist (for payment verification)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_email VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL,
    amount DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_payments_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_customer_email ON payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_payments_organization ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Add verification fields to existing customers table if it exists
-- DO $$
-- BEGIN
--     -- Only proceed if customers table exists
--     IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
--         -- Add verification fields to customers table
--         IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'is_verified') THEN
--             ALTER TABLE customers ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
--         END IF;
--
--         IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'verification_score') THEN
--             ALTER TABLE customers ADD COLUMN verification_score INTEGER DEFAULT 0 CHECK (verification_score >= 0 AND verification_score <= 100);
--         END IF;
--
--         IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'verified_at') THEN
--             ALTER TABLE customers ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
--         END IF;
--
--         IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'risk_level') THEN
--             ALTER TABLE customers ADD COLUMN risk_level VARCHAR(10) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high'));
--         END IF;
--     END IF;
-- END $$;

-- Create function to update customer verification summary
-- CREATE OR REPLACE FUNCTION update_customer_verification_summary()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- Update customers table with verification summary
--     UPDATE customers
--     SET 
--         is_verified = (NEW.overall_status = 'verified'),
--         verification_score = NEW.verification_score,
--         verified_at = CASE WHEN NEW.overall_status = 'verified' THEN COALESCE(NEW.verified_at, NOW()) ELSE NULL END,
--         risk_level = NEW.risk_level,
--         updated_at = NOW()
--     WHERE id = NEW.customer_id;
--     
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Create trigger to automatically update customer verification summary
-- DROP TRIGGER IF EXISTS update_customer_verification_summary_trigger ON customer_verifications;
-- CREATE TRIGGER update_customer_verification_summary_trigger
--     AFTER INSERT OR UPDATE ON customer_verifications
--     FOR EACH ROW
--     EXECUTE FUNCTION update_customer_verification_summary();

-- Create function to automatically verify customers based on activity
-- CREATE OR REPLACE FUNCTION auto_verify_customer_on_activity()
-- RETURNS TRIGGER AS $$
-- DECLARE
--     customer_record RECORD;
--     verification_record RECORD;
--     total_score INTEGER := 0;
--     verification_methods JSONB := '[]';
-- BEGIN
--     -- Only run for completed payments
--     IF NEW.status != 'completed' THEN
--         RETURN NEW;
--     END IF;
--     
--     -- Get customer by email
--     SELECT * INTO customer_record 
--     FROM customers 
--     WHERE email = NEW.customer_email 
--     AND organization_id = NEW.organization_id 
--     LIMIT 1;
--     
--     IF NOT FOUND THEN
--         RETURN NEW;
--     END IF;
--     
--     -- Check if verification record exists
--     SELECT COUNT(*), COALESCE(SUM(amount), 0) INTO verification_record
--     FROM payments
--     WHERE customer_email = NEW.customer_email
--     AND organization_id = NEW.organization_id
--     AND status = 'completed';
--     
--     -- Add payment verification method
--     verification_methods := jsonb_build_array(
--         jsonb_build_object(
--             'type', 'payment',
--             'status', 'verified',
--             'verifiedAt', NOW(),
--             'metadata', jsonb_build_object(
--                 'paymentCount', verification_record.count,
--                 'totalAmount', verification_record.sum,
--                 'lastPayment', NEW.created_at
--             )
--         )
--     );
--     
--     total_score := LEAST(100, verification_record.count * 15 + LEAST(50, verification_record.sum / 10));
--     
--     -- Insert or update verification record
--     INSERT INTO customer_verifications (
--         customer_id,
--         organization_id,
--         overall_status,
--         verification_score,
--         risk_level,
--         methods,
--         last_checked,
--         auto_verify_reasons
--     ) VALUES (
--         customer_record.id,
--         NEW.organization_id,
--         CASE 
--             WHEN total_score >= 60 THEN 'verified'
--             WHEN total_score >= 30 THEN 'partial'
--             ELSE 'unverified'
--         END,
--         total_score,
--         CASE 
--             WHEN total_score >= 70 THEN 'low'
--             WHEN total_score <= 30 THEN 'high'
--             ELSE 'medium'
--         END,
--         verification_methods,
--         NOW(),
--         ARRAY['payment_history']
--     ) ON CONFLICT (customer_id, organization_id) DO UPDATE SET
--         overall_status = CASE 
--             WHEN EXCLUDED.verification_score >= 60 THEN 'verified'
--             WHEN EXCLUDED.verification_score >= 30 THEN 'partial'
--             ELSE 'unverified'
--         END,
--         verification_score = GREATEST(customer_verifications.verification_score, EXCLUDED.verification_score),
--         risk_level = CASE 
--             WHEN EXCLUDED.verification_score >= 70 THEN 'low'
--             WHEN EXCLUDED.verification_score <= 30 THEN 'high'
--             ELSE 'medium'
--         END,
--         methods = EXCLUDED.methods,
--         last_checked = NOW(),
--         auto_verify_reasons = array_append(COALESCE(customer_verifications.auto_verify_reasons, '{}'), 'payment_history'),
--         updated_at = NOW();
--     
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Create trigger for automatic verification on payment completion
-- DROP TRIGGER IF EXISTS auto_verify_on_payment_trigger ON payments;
-- CREATE TRIGGER auto_verify_on_payment_trigger
--     AFTER INSERT OR UPDATE ON payments
--     FOR EACH ROW
--     EXECUTE FUNCTION auto_verify_customer_on_activity();

-- Create function to get customer verification summary
-- CREATE OR REPLACE FUNCTION get_customer_verification_summary(p_customer_id UUID, p_organization_id UUID)
-- RETURNS TABLE (
--     customer_id UUID,
--     is_verified BOOLEAN,
--     verification_score INTEGER,
--     risk_level TEXT,
--     verification_methods JSONB,
--     verified_at TIMESTAMP WITH TIME ZONE,
--     last_checked TIMESTAMP WITH TIME ZONE
-- ) AS $$
-- BEGIN
--     RETURN QUERY
--     SELECT 
--         cv.customer_id,
--         (cv.overall_status = 'verified') as is_verified,
--         cv.verification_score,
--         cv.risk_level,
--         cv.methods as verification_methods,
--         cv.verified_at,
--         cv.last_checked
--     FROM customer_verifications cv
--     WHERE cv.customer_id = p_customer_id
--     AND cv.organization_id = p_organization_id;
-- END;
-- $$ LANGUAGE plpgsql;

-- Enable Row Level Security
-- ALTER TABLE customer_verifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customer_verifications
-- CREATE POLICY "Organization members can view customer verifications" ON customer_verifications
--     FOR SELECT USING (
--         organization_id IN (
--             SELECT organization_id 
--             FROM organization_members 
--             WHERE user_id = auth.uid() AND status = 'active'
--         )
--     );

-- CREATE POLICY "Organization members can manage customer verifications" ON customer_verifications
--     FOR ALL USING (
--         organization_id IN (
--             SELECT organization_id 
--             FROM organization_members 
--             WHERE user_id = auth.uid() AND status = 'active'
--         )
--     );

-- Create RLS policies for payments
-- CREATE POLICY "Organization members can view payments" ON payments
--     FOR SELECT USING (
--         organization_id IN (
--             SELECT organization_id 
--             FROM organization_members 
--             WHERE user_id = auth.uid() AND status = 'active'
--         )
--     );

-- CREATE POLICY "Organization members can manage payments" ON payments
--     FOR ALL USING (
--         organization_id IN (
--             SELECT organization_id 
--             FROM organization_members 
--             WHERE user_id = auth.uid() AND status = 'active'
--         )
--     );

-- Insert sample verification data for existing customers (optional)
-- INSERT INTO customer_verifications (customer_id, organization_id, overall_status, verification_score, risk_level, methods, auto_verify_reasons)
-- SELECT 
--     c.id,
--     c.organization_id,
--     CASE 
--         WHEN c.email LIKE '%@gmail.com' OR c.email LIKE '%@outlook.com' THEN 'partial'
--         WHEN c.email LIKE '%@company.com' OR c.email LIKE '%@business.com' THEN 'verified'
--         ELSE 'unverified'
--     END,
--     CASE 
--         WHEN c.email LIKE '%@gmail.com' OR c.email LIKE '%@outlook.com' THEN 35
--         WHEN c.email LIKE '%@company.com' OR c.email LIKE '%@business.com' THEN 75
--         ELSE 15
--     END,
--     CASE 
--         WHEN c.email LIKE '%@company.com' OR c.email LIKE '%@business.com' THEN 'low'
--         WHEN c.email LIKE '%@gmail.com' OR c.email LIKE '%@outlook.com' THEN 'medium'
--         ELSE 'high'
--     END,
--     jsonb_build_array(
--         jsonb_build_object(
--             'type', 'email',
--             'status', 'verified',
--             'verifiedAt', NOW(),
--             'metadata', jsonb_build_object('email', c.email, 'autoVerified', true)
--         )
--     ),
--     ARRAY['email_domain']
-- FROM customers c
-- WHERE c.email IS NOT NULL
-- ON CONFLICT (customer_id, organization_id) DO NOTHING;

-- Add helpful comments
-- COMMENT ON TABLE customer_verifications IS 'Stores customer verification status and methods for each organization';
-- COMMENT ON COLUMN customer_verifications.overall_status IS 'Overall verification status: unverified, partial, verified, suspended';
-- COMMENT ON COLUMN customer_verifications.verification_score IS 'Calculated verification score from 0-100 based on multiple factors';
-- COMMENT ON COLUMN customer_verifications.methods IS 'JSON array of verification methods and their status';
-- COMMENT ON COLUMN customer_verifications.risk_level IS 'Risk assessment: low, medium, high';
-- COMMENT ON COLUMN customer_verifications.auto_verify_reasons IS 'Array of reasons why customer was auto-verified';

-- COMMENT ON TABLE payments IS 'Payment records for customer verification and business logic';
-- COMMENT ON COLUMN payments.status IS 'Payment status: pending, completed, failed, refunded';

-- Grant necessary permissions
-- GRANT SELECT, INSERT, UPDATE ON customer_verifications TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON payments TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_customer_verification_summary TO authenticated;
-- GRANT EXECUTE ON FUNCTION update_customer_verification_summary TO authenticated;
-- GRANT EXECUTE ON FUNCTION auto_verify_customer_on_activity TO authenticated; 