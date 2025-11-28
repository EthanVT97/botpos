-- Chat Enhancements Schema
-- Add new features: file attachments, templates, notes, tags, typing indicators

-- Add columns to chat_messages for file attachments
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Create message templates table
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  shortcut VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create customer notes table
CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create conversation tags table
CREATE TABLE IF NOT EXISTS conversation_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#3b82f6',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create junction table for session tags
CREATE TABLE IF NOT EXISTS chat_session_tags (
  session_id UUID REFERENCES chat_sessions(customer_id) ON DELETE CASCADE,
  tag_id UUID REFERENCES conversation_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (session_id, tag_id)
);

-- Add columns to chat_sessions for enhanced features
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS is_typing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS typing_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_exported_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_templates_active ON message_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(category);
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created ON customer_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_session_tags_session ON chat_session_tags(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_session_tags_tag ON chat_session_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_attachment ON chat_messages(attachment_url) WHERE attachment_url IS NOT NULL;

-- Insert default message templates
INSERT INTO message_templates (name, content, category, shortcut) VALUES
  ('Welcome', 'Hello! Welcome to our store. How can I help you today?', 'greeting', '/welcome'),
  ('Thank You', 'Thank you for your purchase! We appreciate your business.', 'closing', '/thanks'),
  ('Order Status', 'Your order is being processed. We''ll notify you once it''s ready.', 'order', '/status'),
  ('Payment Received', 'We have received your payment. Thank you!', 'payment', '/paid'),
  ('Out of Stock', 'Sorry, this item is currently out of stock. We''ll notify you when it''s available.', 'inventory', '/oos'),
  ('Delivery Info', 'Your order will be delivered within 2-3 business days.', 'delivery', '/delivery')
ON CONFLICT DO NOTHING;

-- Insert default conversation tags
INSERT INTO conversation_tags (name, color, description) VALUES
  ('urgent', '#ef4444', 'Requires immediate attention'),
  ('follow-up', '#f59e0b', 'Needs follow-up'),
  ('resolved', '#10b981', 'Issue resolved'),
  ('complaint', '#dc2626', 'Customer complaint'),
  ('inquiry', '#3b82f6', 'General inquiry'),
  ('order', '#8b5cf6', 'Order related'),
  ('payment', '#ec4899', 'Payment related'),
  ('vip', '#fbbf24', 'VIP customer')
ON CONFLICT DO NOTHING;

-- Create function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS void AS $$
BEGIN
  UPDATE chat_sessions
  SET is_typing = false
  WHERE is_typing = true 
    AND typing_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- Create function to update template usage count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE message_templates
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE message_templates IS 'Quick reply templates for chat messages';
COMMENT ON TABLE customer_notes IS 'Internal notes about customers';
COMMENT ON TABLE conversation_tags IS 'Tags for categorizing conversations';
COMMENT ON TABLE chat_session_tags IS 'Junction table linking sessions to tags';
