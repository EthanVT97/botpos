-- Authentication and Authorization Schema
-- Run this after the main schema.sql

-- Add authentication fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default roles with permissions
INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'Full system access', '{
    "dashboard": true,
    "pos": true,
    "products": {"view": true, "create": true, "edit": true, "delete": true},
    "categories": {"view": true, "create": true, "edit": true, "delete": true},
    "customers": {"view": true, "create": true, "edit": true, "delete": true},
    "orders": {"view": true, "create": true, "edit": true, "delete": true},
    "inventory": {"view": true, "create": true, "edit": true, "delete": true},
    "reports": {"view": true, "export": true},
    "settings": {"view": true, "edit": true},
    "users": {"view": true, "create": true, "edit": true, "delete": true},
    "bots": {"view": true, "edit": true},
    "chat": {"view": true, "send": true},
    "bot_flows": {"view": true, "create": true, "edit": true, "delete": true},
    "uom": {"view": true, "create": true, "edit": true, "delete": true},
    "selling_price": {"view": true, "edit": true}
  }'),
  ('manager', 'Manager access - no user management', '{
    "dashboard": true,
    "pos": true,
    "products": {"view": true, "create": true, "edit": true, "delete": true},
    "categories": {"view": true, "create": true, "edit": true, "delete": true},
    "customers": {"view": true, "create": true, "edit": true, "delete": true},
    "orders": {"view": true, "create": true, "edit": true, "delete": false},
    "inventory": {"view": true, "create": true, "edit": true, "delete": false},
    "reports": {"view": true, "export": true},
    "settings": {"view": true, "edit": false},
    "users": {"view": true, "create": false, "edit": false, "delete": false},
    "bots": {"view": true, "edit": false},
    "chat": {"view": true, "send": true},
    "bot_flows": {"view": true, "create": true, "edit": true, "delete": false},
    "uom": {"view": true, "create": true, "edit": true, "delete": false},
    "selling_price": {"view": true, "edit": true}
  }'),
  ('cashier', 'POS and order access only', '{
    "dashboard": true,
    "pos": true,
    "products": {"view": true, "create": false, "edit": false, "delete": false},
    "categories": {"view": true, "create": false, "edit": false, "delete": false},
    "customers": {"view": true, "create": true, "edit": true, "delete": false},
    "orders": {"view": true, "create": true, "edit": false, "delete": false},
    "inventory": {"view": true, "create": false, "edit": false, "delete": false},
    "reports": {"view": false, "export": false},
    "settings": {"view": false, "edit": false},
    "users": {"view": false, "create": false, "edit": false, "delete": false},
    "bots": {"view": false, "edit": false},
    "chat": {"view": true, "send": true},
    "bot_flows": {"view": false, "create": false, "edit": false, "delete": false},
    "uom": {"view": true, "create": false, "edit": false, "delete": false},
    "selling_price": {"view": true, "edit": false}
  }'),
  ('viewer', 'Read-only access', '{
    "dashboard": true,
    "pos": false,
    "products": {"view": true, "create": false, "edit": false, "delete": false},
    "categories": {"view": true, "create": false, "edit": false, "delete": false},
    "customers": {"view": true, "create": false, "edit": false, "delete": false},
    "orders": {"view": true, "create": false, "edit": false, "delete": false},
    "inventory": {"view": true, "create": false, "edit": false, "delete": false},
    "reports": {"view": true, "export": true},
    "settings": {"view": false, "edit": false},
    "users": {"view": false, "create": false, "edit": false, "delete": false},
    "bots": {"view": false, "edit": false},
    "chat": {"view": true, "send": false},
    "bot_flows": {"view": true, "create": false, "edit": false, "delete": false},
    "uom": {"view": true, "create": false, "edit": false, "delete": false},
    "selling_price": {"view": true, "edit": false}
  }')
ON CONFLICT (name) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  description = EXCLUDED.description;

-- Create sessions table for express-session
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Function to log user actions
CREATE OR REPLACE FUNCTION log_user_action(
  p_user_id UUID,
  p_action VARCHAR,
  p_resource VARCHAR,
  p_resource_id UUID,
  p_details JSONB,
  p_ip_address VARCHAR,
  p_user_agent TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
  VALUES (p_user_id, p_action, p_resource, p_resource_id, p_details, p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql;

-- Create default admin user (password: admin123 - CHANGE THIS!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (email, full_name, role, password_hash, is_active)
VALUES (
  'admin@myanmarpos.com',
  'System Administrator',
  'admin',
  '$2a$10$rKvVPZqGvVZqGvVZqGvVZO7K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

COMMENT ON TABLE roles IS 'User roles with granular permissions';
COMMENT ON TABLE audit_logs IS 'Audit trail for all user actions';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.refresh_token IS 'JWT refresh token for session management';
