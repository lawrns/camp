-- Add location fields to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS customer_ip INET,
ADD COLUMN IF NOT EXISTS customer_location JSONB;

-- Add location fields to platform_customers
ALTER TABLE platform_customers
ADD COLUMN IF NOT EXISTS last_known_ip INET,
ADD COLUMN IF NOT EXISTS location_history JSONB[] DEFAULT '{}';

-- Create index for IP lookups
CREATE INDEX IF NOT EXISTS idx_conversations_customer_ip 
ON conversations(customer_ip);

-- Create index for location data
CREATE INDEX IF NOT EXISTS idx_conversations_customer_location 
ON conversations USING GIN(customer_location);

-- Function to update customer location history
CREATE OR REPLACE FUNCTION update_customer_location_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if location has changed
  IF NEW.customer_location IS NOT NULL AND 
     (OLD.customer_location IS NULL OR 
      OLD.customer_location::text != NEW.customer_location::text) THEN
    
    -- Update platform_customers with location history
    UPDATE platform_customers
    SET 
      last_known_ip = NEW.customer_ip,
      location_history = array_append(
        COALESCE(location_history, '{}'), 
        jsonb_build_object(
          'location', NEW.customer_location,
          'timestamp', NOW(),
          'ip', NEW.customer_ip::text,
          'conversation_id', NEW.id
        )
      )
    WHERE email = NEW.customer_email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for location history updates
DROP TRIGGER IF EXISTS update_location_history_trigger ON conversations;
CREATE TRIGGER update_location_history_trigger
AFTER INSERT OR UPDATE OF customer_location ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_customer_location_history();

-- Add comment for documentation
COMMENT ON COLUMN conversations.customer_ip IS 'IP address of the customer when conversation was created';
COMMENT ON COLUMN conversations.customer_location IS 'JSON object containing country, city, timezone, and other location data';
COMMENT ON COLUMN platform_customers.last_known_ip IS 'Most recent IP address seen for this customer';
COMMENT ON COLUMN platform_customers.location_history IS 'Array of location history entries with timestamp';

-- Grant appropriate permissions
GRANT SELECT ON conversations TO authenticated;
GRANT SELECT ON platform_customers TO authenticated;