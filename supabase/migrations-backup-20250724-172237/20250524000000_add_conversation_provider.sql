-- Add conversationProvider column to conversations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'conversationProvider'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN "conversationProvider" TEXT DEFAULT 'chat';
  END IF;
END
$$; 