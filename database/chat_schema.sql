-- Chat messages table for multi-channel communication
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'admin')),
  message TEXT NOT NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('viber', 'telegram', 'messenger', 'dashboard')),
  channel_message_id VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat sessions table to track active conversations
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
  channel VARCHAR(20) NOT NULL,
  last_message_at TIMESTAMP DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_customer ON chat_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel);
CREATE INDEX IF NOT EXISTS idx_chat_messages_read ON chat_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_customer ON chat_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_active ON chat_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message ON chat_sessions(last_message_at DESC);

-- Function to update chat session
CREATE OR REPLACE FUNCTION update_chat_session()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chat_sessions (customer_id, channel, last_message_at, unread_count)
  VALUES (
    NEW.customer_id,
    NEW.channel,
    NEW.created_at,
    CASE WHEN NEW.sender_type = 'customer' THEN 1 ELSE 0 END
  )
  ON CONFLICT (customer_id) DO UPDATE SET
    last_message_at = NEW.created_at,
    unread_count = CASE 
      WHEN NEW.sender_type = 'customer' THEN chat_sessions.unread_count + 1
      ELSE chat_sessions.unread_count
    END,
    channel = NEW.channel,
    is_active = TRUE,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update chat sessions
DROP TRIGGER IF EXISTS trigger_update_chat_session ON chat_messages;
CREATE TRIGGER trigger_update_chat_session
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(p_customer_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE chat_messages
  SET is_read = TRUE, updated_at = NOW()
  WHERE customer_id = p_customer_id AND is_read = FALSE;
  
  UPDATE chat_sessions
  SET unread_count = 0, updated_at = NOW()
  WHERE customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql;
