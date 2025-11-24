-- Multi-Store Support Schema
-- Enables managing multiple store locations with centralized control

-- Stores table (store locations)
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  name_mm VARCHAR(255),
  code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  manager_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  timezone VARCHAR(50) DEFAULT 'Asia/Yangon',
  currency VARCHAR(10) DEFAULT 'MMK',
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Store inventory (track stock per store)
CREATE TABLE IF NOT EXISTS store_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  max_quantity INTEGER,
  last_restocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_id, product_id)
);

-- Store transfers (move inventory between stores)
CREATE TABLE IF NOT EXISTS store_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_store_id UUID REFERENCES stores(id),
  to_store_id UUID REFERENCES stores(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_transit, completed, cancelled
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  notes TEXT,
  transfer_date TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Store transfer items
CREATE TABLE IF NOT EXISTS store_transfer_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id UUID REFERENCES store_transfers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  received_quantity INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User store assignments (which users can access which stores)
CREATE TABLE IF NOT EXISTS user_stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'staff', -- manager, staff, viewer
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- Add store_id to existing tables
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_store_id UUID REFERENCES stores(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);
CREATE INDEX IF NOT EXISTS idx_stores_code ON stores(code);
CREATE INDEX IF NOT EXISTS idx_store_inventory_store ON store_inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_store_inventory_product ON store_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_store_inventory_low_stock ON store_inventory(store_id, product_id) WHERE quantity <= min_quantity;
CREATE INDEX IF NOT EXISTS idx_store_transfers_from ON store_transfers(from_store_id);
CREATE INDEX IF NOT EXISTS idx_store_transfers_to ON store_transfers(to_store_id);
CREATE INDEX IF NOT EXISTS idx_store_transfers_status ON store_transfers(status);
CREATE INDEX IF NOT EXISTS idx_user_stores_user ON user_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stores_store ON user_stores(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);

-- Function to update store inventory
CREATE OR REPLACE FUNCTION update_store_inventory(
  p_store_id UUID,
  p_product_id UUID,
  p_quantity_change INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO store_inventory (store_id, product_id, quantity)
  VALUES (p_store_id, p_product_id, p_quantity_change)
  ON CONFLICT (store_id, product_id) DO UPDATE SET
    quantity = store_inventory.quantity + p_quantity_change,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get store inventory with product details
CREATE OR REPLACE FUNCTION get_store_inventory(p_store_id UUID)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR(255),
  product_name_mm VARCHAR(255),
  sku VARCHAR(100),
  quantity INTEGER,
  min_quantity INTEGER,
  max_quantity INTEGER,
  is_low_stock BOOLEAN,
  last_restocked_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.name_mm,
    p.sku,
    COALESCE(si.quantity, 0)::INTEGER,
    COALESCE(si.min_quantity, 0)::INTEGER,
    si.max_quantity,
    (COALESCE(si.quantity, 0) <= COALESCE(si.min_quantity, 0)) AS is_low_stock,
    si.last_restocked_at
  FROM products p
  LEFT JOIN store_inventory si ON p.id = si.product_id AND si.store_id = p_store_id
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql;

-- Function to process store transfer
CREATE OR REPLACE FUNCTION process_store_transfer(
  p_transfer_id UUID,
  p_approved_by UUID
)
RETURNS VOID AS $$
DECLARE
  v_transfer RECORD;
  v_item RECORD;
BEGIN
  -- Get transfer details
  SELECT * INTO v_transfer FROM store_transfers WHERE id = p_transfer_id;
  
  IF v_transfer.status != 'pending' THEN
    RAISE EXCEPTION 'Transfer is not in pending status';
  END IF;
  
  -- Update transfer status
  UPDATE store_transfers
  SET status = 'in_transit',
      approved_by = p_approved_by,
      transfer_date = NOW(),
      updated_at = NOW()
  WHERE id = p_transfer_id;
  
  -- Deduct from source store
  FOR v_item IN SELECT * FROM store_transfer_items WHERE transfer_id = p_transfer_id LOOP
    PERFORM update_store_inventory(v_transfer.from_store_id, v_item.product_id, -v_item.quantity);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to complete store transfer
CREATE OR REPLACE FUNCTION complete_store_transfer(p_transfer_id UUID)
RETURNS VOID AS $$
DECLARE
  v_transfer RECORD;
  v_item RECORD;
BEGIN
  -- Get transfer details
  SELECT * INTO v_transfer FROM store_transfers WHERE id = p_transfer_id;
  
  IF v_transfer.status != 'in_transit' THEN
    RAISE EXCEPTION 'Transfer is not in transit status';
  END IF;
  
  -- Update transfer status
  UPDATE store_transfers
  SET status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_transfer_id;
  
  -- Add to destination store
  FOR v_item IN SELECT * FROM store_transfer_items WHERE transfer_id = p_transfer_id LOOP
    PERFORM update_store_inventory(
      v_transfer.to_store_id, 
      v_item.product_id, 
      COALESCE(v_item.received_quantity, v_item.quantity)
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- View for store performance
CREATE OR REPLACE VIEW v_store_performance AS
SELECT 
  s.id AS store_id,
  s.name AS store_name,
  s.code AS store_code,
  COUNT(DISTINCT o.id) AS total_orders,
  COALESCE(SUM(o.total_amount), 0) AS total_sales,
  COALESCE(AVG(o.total_amount), 0) AS avg_order_value,
  COUNT(DISTINCT o.customer_id) AS unique_customers,
  COUNT(DISTINCT CASE WHEN o.created_at >= NOW() - INTERVAL '30 days' THEN o.id END) AS orders_last_30_days,
  COALESCE(SUM(CASE WHEN o.created_at >= NOW() - INTERVAL '30 days' THEN o.total_amount ELSE 0 END), 0) AS sales_last_30_days
FROM stores s
LEFT JOIN orders o ON s.id = o.store_id
WHERE s.is_active = TRUE
GROUP BY s.id, s.name, s.code;

-- Insert default main store
INSERT INTO stores (name, name_mm, code, address, is_active)
VALUES 
  ('Main Store', 'ပင်မဆိုင်', 'MAIN', 'Yangon, Myanmar', TRUE),
  ('Branch 1', 'ဆိုင်ခွဲ ၁', 'BR01', 'Mandalay, Myanmar', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Migrate existing inventory to main store
DO $$
DECLARE
  v_main_store_id UUID;
BEGIN
  SELECT id INTO v_main_store_id FROM stores WHERE code = 'MAIN' LIMIT 1;
  
  IF v_main_store_id IS NOT NULL THEN
    -- Copy product stock to store_inventory
    INSERT INTO store_inventory (store_id, product_id, quantity, min_quantity)
    SELECT v_main_store_id, id, stock_quantity, 10
    FROM products
    ON CONFLICT (store_id, product_id) DO NOTHING;
    
    -- Update existing orders to main store
    UPDATE orders SET store_id = v_main_store_id WHERE store_id IS NULL;
    
    -- Update existing inventory movements to main store
    UPDATE inventory_movements SET store_id = v_main_store_id WHERE store_id IS NULL;
  END IF;
END $$;

COMMENT ON TABLE stores IS 'Store locations and branches';
COMMENT ON TABLE store_inventory IS 'Product inventory per store';
COMMENT ON TABLE store_transfers IS 'Inventory transfers between stores';
COMMENT ON TABLE user_stores IS 'User access to stores';
