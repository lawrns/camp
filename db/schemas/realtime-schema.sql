-- Campfire Real-time Communication Schema
-- This file contains all database tables and policies needed for real-time features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA public;

-- ================================================================
-- CORE TABLES FOR REAL-TIME COMMUNICATION
-- ================================================================

-- Workspaces (if not exists)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Workspace members (if not exists) 
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'agent', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- User profiles (if not exists)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  subject TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'escalated')),
  escalated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(conversation_id, user_id)
);

-- Messages with delivery tracking
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'error')),
  thread_id UUID, -- For threaded messages
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Typing indicators (database-driven for reliability)
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  is_typing BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Message read receipts
CREATE TABLE IF NOT EXISTS message_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- User presence tracking
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'offline')),
  custom_status TEXT,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, workspace_id)
);

-- Knowledge base for RAG integration
CREATE TABLE IF NOT EXISTS knowledge_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Vector embeddings for RAG
CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 embeddings
  chunk_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_workspace_id ON conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Typing indicators indexes
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_updated_at ON typing_indicators(updated_at);

-- Message receipts indexes
CREATE INDEX IF NOT EXISTS idx_message_receipts_message_id ON message_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_receipts_user_id ON message_receipts(user_id);

-- Presence indexes
CREATE INDEX IF NOT EXISTS idx_user_presence_workspace_id ON user_presence(workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen_at DESC);

-- Knowledge base indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_workspace_id ON knowledge_articles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_workspace_id ON knowledge_embeddings(workspace_id);

-- Vector similarity index
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_vector 
ON knowledge_embeddings USING ivfflat (embedding vector_cosine_ops);

-- ================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_typing_indicators_updated_at 
    BEFORE UPDATE ON typing_indicators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at 
    BEFORE UPDATE ON user_presence 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;

-- Workspace policies
CREATE POLICY "Users can view workspaces they belong to" ON workspaces
FOR SELECT USING (
  id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Workspace members policies
CREATE POLICY "Users can view workspace members in their workspaces" ON workspace_members
FOR SELECT USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Profile policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (id = auth.uid());

-- Conversation policies
CREATE POLICY "Users can view conversations in their workspaces" ON conversations
FOR SELECT USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversations in their workspaces" ON conversations
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update conversations in their workspaces" ON conversations
FOR UPDATE USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Conversation participants policies
CREATE POLICY "Users can view participants in accessible conversations" ON conversation_participants
FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can join conversations in their workspaces" ON conversation_participants
FOR INSERT WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- Message policies
CREATE POLICY "Users can view messages in conversations they belong to" ON messages
FOR SELECT USING (
  conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages in conversations they belong to" ON messages
FOR INSERT WITH CHECK (
  conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid()
  ) AND sender_id = auth.uid()
);

-- Typing indicator policies
CREATE POLICY "Users can view typing indicators in their conversations" ON typing_indicators
FOR SELECT USING (
  conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own typing indicators" ON typing_indicators
FOR ALL USING (user_id = auth.uid());

-- Message receipt policies
CREATE POLICY "Users can view message receipts for accessible messages" ON message_receipts
FOR SELECT USING (
  message_id IN (
    SELECT id FROM messages 
    WHERE conversation_id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can manage their own message receipts" ON message_receipts
FOR ALL USING (user_id = auth.uid());

-- User presence policies
CREATE POLICY "Users can view presence in their workspaces" ON user_presence
FOR SELECT USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own presence" ON user_presence
FOR ALL USING (user_id = auth.uid());

-- Knowledge base policies
CREATE POLICY "Users can view published articles in their workspaces" ON knowledge_articles
FOR SELECT USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid()
  ) AND is_published = true
);

CREATE POLICY "Users can manage articles in their workspaces" ON knowledge_articles
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'agent')
  )
);

-- Knowledge embeddings policies
CREATE POLICY "Users can view embeddings in their workspaces" ON knowledge_embeddings
FOR SELECT USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- ================================================================
-- REALTIME PUBLICATION
-- ================================================================

-- Enable realtime for all relevant tables
BEGIN;
  -- Remove existing publication if it exists
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create new publication with all tables
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    conversations,
    conversation_participants, 
    messages,
    typing_indicators,
    message_receipts,
    user_presence,
    knowledge_articles;
COMMIT;

-- ================================================================
-- UTILITY FUNCTIONS
-- ================================================================

-- Function to search knowledge base using vector similarity
CREATE OR REPLACE FUNCTION search_knowledge_base(
  workspace_id UUID,
  query_text TEXT,
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INTEGER DEFAULT 5
)
RETURNS TABLE (
  article_id UUID,
  title TEXT,
  content TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ka.id as article_id,
    ka.title,
    ke.content,
    (ke.embedding <=> get_embedding(query_text)) as similarity
  FROM knowledge_embeddings ke
  JOIN knowledge_articles ka ON ke.article_id = ka.id
  WHERE 
    ka.workspace_id = search_knowledge_base.workspace_id
    AND ka.is_published = true
    AND (ke.embedding <=> get_embedding(query_text)) < (1 - similarity_threshold)
  ORDER BY similarity ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get text embedding (placeholder - would integrate with OpenAI)
CREATE OR REPLACE FUNCTION get_embedding(input_text TEXT)
RETURNS vector AS $$
BEGIN
  -- This is a placeholder - in production, this would call OpenAI API
  -- For now, return a zero vector
  RETURN array_fill(0, ARRAY[1536])::vector;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup stale typing indicators
CREATE OR REPLACE FUNCTION cleanup_stale_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators 
  WHERE updated_at < now() - interval '10 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count for a user in a conversation
CREATE OR REPLACE FUNCTION get_unread_count(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  last_read_at TIMESTAMP WITH TIME ZONE;
  unread_count INTEGER;
BEGIN
  -- Get user's last read timestamp
  SELECT cp.last_read_at INTO last_read_at
  FROM conversation_participants cp
  WHERE cp.conversation_id = p_conversation_id 
    AND cp.user_id = p_user_id;
  
  -- Count messages after last read time
  SELECT COUNT(*)::INTEGER INTO unread_count
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id != p_user_id
    AND (last_read_at IS NULL OR m.created_at > last_read_at);
    
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create periodic cleanup job for typing indicators (if pg_cron is available)
-- SELECT cron.schedule('cleanup-typing-indicators', '*/10 * * * * *', 'SELECT cleanup_stale_typing_indicators();'); 