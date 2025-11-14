-- Bot Flow Builder Schema
-- This schema enables drag-and-drop bot conversation flows

-- Bot flows table (main flow configuration)
CREATE TABLE IF NOT EXISTS bot_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  channel VARCHAR(20) CHECK (channel IN ('viber', 'telegram', 'messenger', 'all')),
  is_active BOOLEAN DEFAULT TRUE,
  trigger_type VARCHAR(50) DEFAULT 'keyword', -- keyword, command, welcome, fallback
  trigger_value TEXT, -- keyword or command that triggers this flow
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Flow nodes table (individual steps in the flow)
CREATE TABLE IF NOT EXISTS bot_flow_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_id UUID REFERENCES bot_flows(id) ON DELETE CASCADE,
  node_id VARCHAR(100) NOT NULL, -- unique ID for frontend (e.g., 'node_1')
  node_type VARCHAR(50) NOT NULL, -- message, question, condition, action, api_call
  label VARCHAR(255),
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  config JSONB DEFAULT '{}', -- node-specific configuration
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(flow_id, node_id)
);

-- Flow connections table (edges between nodes)
CREATE TABLE IF NOT EXISTS bot_flow_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_id UUID REFERENCES bot_flows(id) ON DELETE CASCADE,
  source_node_id VARCHAR(100) NOT NULL,
  target_node_id VARCHAR(100) NOT NULL,
  condition_type VARCHAR(50), -- always, equals, contains, greater_than, less_than
  condition_value TEXT,
  label VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(flow_id, source_node_id, target_node_id, condition_value)
);

-- Flow execution state (track user progress through flows)
CREATE TABLE IF NOT EXISTS bot_flow_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  flow_id UUID REFERENCES bot_flows(id) ON DELETE CASCADE,
  current_node_id VARCHAR(100),
  variables JSONB DEFAULT '{}', -- store user responses and variables
  channel VARCHAR(20),
  is_completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bot_flows_active ON bot_flows(is_active);
CREATE INDEX IF NOT EXISTS idx_bot_flows_trigger ON bot_flows(trigger_type, trigger_value);
CREATE INDEX IF NOT EXISTS idx_bot_flow_nodes_flow ON bot_flow_nodes(flow_id);
CREATE INDEX IF NOT EXISTS idx_bot_flow_connections_flow ON bot_flow_connections(flow_id);
CREATE INDEX IF NOT EXISTS idx_bot_flow_states_customer ON bot_flow_states(customer_id);
CREATE INDEX IF NOT EXISTS idx_bot_flow_states_flow ON bot_flow_states(flow_id);
CREATE INDEX IF NOT EXISTS idx_bot_flow_states_active ON bot_flow_states(is_completed);

-- Function to get active flow by trigger
CREATE OR REPLACE FUNCTION get_flow_by_trigger(
  p_trigger_type VARCHAR(50),
  p_trigger_value TEXT,
  p_channel VARCHAR(20)
)
RETURNS TABLE (
  flow_id UUID,
  flow_name VARCHAR(255),
  start_node_id VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bf.id,
    bf.name,
    bfn.node_id
  FROM bot_flows bf
  LEFT JOIN bot_flow_nodes bfn ON bf.id = bfn.flow_id AND bfn.node_type = 'start'
  WHERE bf.is_active = TRUE
    AND bf.trigger_type = p_trigger_type
    AND (bf.trigger_value = p_trigger_value OR bf.trigger_value IS NULL)
    AND (bf.channel = p_channel OR bf.channel = 'all')
  ORDER BY bf.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get next node in flow
CREATE OR REPLACE FUNCTION get_next_node(
  p_flow_id UUID,
  p_current_node_id VARCHAR(100),
  p_user_response TEXT DEFAULT NULL
)
RETURNS TABLE (
  node_id VARCHAR(100),
  node_type VARCHAR(50),
  config JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bfn.node_id,
    bfn.node_type,
    bfn.config
  FROM bot_flow_connections bfc
  JOIN bot_flow_nodes bfn ON bfc.target_node_id = bfn.node_id AND bfc.flow_id = bfn.flow_id
  WHERE bfc.flow_id = p_flow_id
    AND bfc.source_node_id = p_current_node_id
    AND (
      bfc.condition_type = 'always' OR
      bfc.condition_type IS NULL OR
      (bfc.condition_type = 'equals' AND p_user_response = bfc.condition_value) OR
      (bfc.condition_type = 'contains' AND p_user_response ILIKE '%' || bfc.condition_value || '%')
    )
  ORDER BY 
    CASE 
      WHEN bfc.condition_type = 'equals' THEN 1
      WHEN bfc.condition_type = 'contains' THEN 2
      ELSE 3
    END
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Insert sample welcome flow
INSERT INTO bot_flows (name, description, channel, trigger_type, trigger_value, is_active)
VALUES 
  ('Welcome Flow', 'Greet new customers and show menu', 'all', 'command', '/start', TRUE),
  ('Product Inquiry', 'Help customers browse products', 'all', 'keyword', 'products', TRUE),
  ('Order Status', 'Check order status', 'all', 'keyword', 'order', TRUE)
ON CONFLICT DO NOTHING;

-- Sample nodes for Welcome Flow
DO $$
DECLARE
  welcome_flow_id UUID;
BEGIN
  SELECT id INTO welcome_flow_id FROM bot_flows WHERE name = 'Welcome Flow' LIMIT 1;
  
  IF welcome_flow_id IS NOT NULL THEN
    INSERT INTO bot_flow_nodes (flow_id, node_id, node_type, label, position_x, position_y, config)
    VALUES
      (welcome_flow_id, 'start', 'start', 'Start', 100, 100, '{"message": "Flow started"}'),
      (welcome_flow_id, 'welcome', 'message', 'Welcome Message', 300, 100, 
        '{"message": "မင်္ဂလာပါ! Welcome to our store! 🛍️\n\nHow can I help you today?", "buttons": ["View Products", "My Orders", "Contact Support"]}'),
      (welcome_flow_id, 'products', 'action', 'Show Products', 500, 50, 
        '{"action": "show_products", "limit": 5}'),
      (welcome_flow_id, 'orders', 'action', 'Show Orders', 500, 150, 
        '{"action": "show_orders"}'),
      (welcome_flow_id, 'support', 'message', 'Support Info', 500, 250, 
        '{"message": "📞 Contact Support:\nPhone: +95 9 123 456 789\nEmail: support@example.com"}')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO bot_flow_connections (flow_id, source_node_id, target_node_id, condition_type, label)
    VALUES
      (welcome_flow_id, 'start', 'welcome', 'always', 'Start'),
      (welcome_flow_id, 'welcome', 'products', 'contains', 'View Products'),
      (welcome_flow_id, 'welcome', 'orders', 'contains', 'My Orders'),
      (welcome_flow_id, 'welcome', 'support', 'contains', 'Contact Support')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

COMMENT ON TABLE bot_flows IS 'Main bot conversation flows';
COMMENT ON TABLE bot_flow_nodes IS 'Individual nodes/steps in bot flows';
COMMENT ON TABLE bot_flow_connections IS 'Connections between flow nodes';
COMMENT ON TABLE bot_flow_states IS 'Track user progress through flows';
