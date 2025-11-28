-- Add typing indicator and attachment columns to chat tables
-- This migration is backward compatible and safe to run multiple times

-- Add typing indicator columns to chat_sessions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_sessions' AND column_name = 'is_typing'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN is_typing BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_sessions' AND column_name = 'typing_at'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN typing_at TIMESTAMP;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_sessions' AND column_name = 'last_exported_at'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN last_exported_at TIMESTAMP;
  END IF;
END $$;

-- Add attachment columns to chat_messages
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'attachment_url'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN attachment_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'attachment_type'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN attachment_type VARCHAR(100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'attachment_name'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN attachment_name VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'attachment_size'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN attachment_size INTEGER;
  END IF;
END $$;

-- Create index for typing indicator
CREATE INDEX IF NOT EXISTS idx_chat_sessions_typing ON chat_sessions(is_typing) WHERE is_typing = TRUE;

-- Create index for attachments
CREATE INDEX IF NOT EXISTS idx_chat_messages_attachments ON chat_messages(attachment_url) WHERE attachment_url IS NOT NULL;
