-- Price History Table for tracking price changes
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  old_price DECIMAL(10, 2),
  new_price DECIMAL(10, 2),
  old_cost DECIMAL(10, 2),
  new_cost DECIMAL(10, 2),
  change_type VARCHAR(50), -- 'bulk_update', 'manual_edit', 'import'
  formula VARCHAR(50), -- 'plus', 'minus', 'fixed_add', etc.
  percentage DECIMAL(10, 2),
  changed_by VARCHAR(255),
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_created ON price_history(created_at DESC);

-- Function to automatically log price changes
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.price IS DISTINCT FROM NEW.price) OR (OLD.cost IS DISTINCT FROM NEW.cost) THEN
    INSERT INTO price_history (
      product_id,
      old_price,
      new_price,
      old_cost,
      new_cost,
      change_type,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.price,
      NEW.price,
      OLD.cost,
      NEW.cost,
      'manual_edit',
      'system'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on products table
DROP TRIGGER IF EXISTS price_change_trigger ON products;
CREATE TRIGGER price_change_trigger
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_price_change();

-- View for price change summary
CREATE OR REPLACE VIEW price_change_summary AS
SELECT 
  ph.product_id,
  p.name,
  p.name_mm,
  COUNT(*) as total_changes,
  MAX(ph.created_at) as last_changed,
  AVG(ph.new_price - ph.old_price) as avg_price_change
FROM price_history ph
JOIN products p ON ph.product_id = p.id
GROUP BY ph.product_id, p.name, p.name_mm;
