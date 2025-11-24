-- Multi-UOM (Unit of Measure) Schema
-- This schema adds support for multiple units of measure with conversion tables

-- UOM (Unit of Measure) table
CREATE TABLE uom (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_mm VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Product UOM table (links products to their available UOMs)
CREATE TABLE product_uom (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  uom_id UUID REFERENCES uom(id),
  is_base_uom BOOLEAN DEFAULT false,
  conversion_factor DECIMAL(10, 4) NOT NULL DEFAULT 1,
  price DECIMAL(10, 2),
  cost DECIMAL(10, 2),
  barcode VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, uom_id)
);

-- UOM Conversion table (for direct conversions between UOMs)
CREATE TABLE uom_conversion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_uom_id UUID REFERENCES uom(id),
  to_uom_id UUID REFERENCES uom(id),
  conversion_factor DECIMAL(10, 4) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_uom_id, to_uom_id)
);

-- Add base_uom_id to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_uom_id UUID REFERENCES uom(id);

-- Update order_items to include UOM
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS uom_id UUID REFERENCES uom(id);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS base_quantity DECIMAL(10, 4);

-- Update inventory_movements to include UOM
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS uom_id UUID REFERENCES uom(id);
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS base_quantity DECIMAL(10, 4);

-- Insert default UOMs
INSERT INTO uom (code, name, name_mm, description) VALUES
  ('PCS', 'Pieces', 'ခု', 'Individual pieces'),
  ('BOX', 'Box', 'ဘူး', 'Box packaging'),
  ('CTN', 'Carton', 'ကတ်တန်', 'Carton packaging'),
  ('PKT', 'Packet', 'ထုပ်', 'Packet packaging'),
  ('BAG', 'Bag', 'အိတ်', 'Bag packaging'),
  ('KG', 'Kilogram', 'ကီလိုဂရမ်', 'Weight in kilograms'),
  ('G', 'Gram', 'ဂရမ်', 'Weight in grams'),
  ('L', 'Liter', 'လီတာ', 'Volume in liters'),
  ('ML', 'Milliliter', 'မီလီလီတာ', 'Volume in milliliters'),
  ('DOZ', 'Dozen', 'ဒါဇင်', '12 pieces'),
  ('SET', 'Set', 'အစုံ', 'Set of items'),
  ('ROLL', 'Roll', 'လိပ်', 'Roll packaging')
ON CONFLICT (code) DO NOTHING;

-- Insert common UOM conversions
INSERT INTO uom_conversion (from_uom_id, to_uom_id, conversion_factor)
SELECT 
  (SELECT id FROM uom WHERE code = 'KG'),
  (SELECT id FROM uom WHERE code = 'G'),
  1000
WHERE NOT EXISTS (
  SELECT 1 FROM uom_conversion 
  WHERE from_uom_id = (SELECT id FROM uom WHERE code = 'KG')
  AND to_uom_id = (SELECT id FROM uom WHERE code = 'G')
);

INSERT INTO uom_conversion (from_uom_id, to_uom_id, conversion_factor)
SELECT 
  (SELECT id FROM uom WHERE code = 'G'),
  (SELECT id FROM uom WHERE code = 'KG'),
  0.001
WHERE NOT EXISTS (
  SELECT 1 FROM uom_conversion 
  WHERE from_uom_id = (SELECT id FROM uom WHERE code = 'G')
  AND to_uom_id = (SELECT id FROM uom WHERE code = 'KG')
);

INSERT INTO uom_conversion (from_uom_id, to_uom_id, conversion_factor)
SELECT 
  (SELECT id FROM uom WHERE code = 'L'),
  (SELECT id FROM uom WHERE code = 'ML'),
  1000
WHERE NOT EXISTS (
  SELECT 1 FROM uom_conversion 
  WHERE from_uom_id = (SELECT id FROM uom WHERE code = 'L')
  AND to_uom_id = (SELECT id FROM uom WHERE code = 'ML')
);

INSERT INTO uom_conversion (from_uom_id, to_uom_id, conversion_factor)
SELECT 
  (SELECT id FROM uom WHERE code = 'ML'),
  (SELECT id FROM uom WHERE code = 'L'),
  0.001
WHERE NOT EXISTS (
  SELECT 1 FROM uom_conversion 
  WHERE from_uom_id = (SELECT id FROM uom WHERE code = 'ML')
  AND to_uom_id = (SELECT id FROM uom WHERE code = 'L')
);

INSERT INTO uom_conversion (from_uom_id, to_uom_id, conversion_factor)
SELECT 
  (SELECT id FROM uom WHERE code = 'DOZ'),
  (SELECT id FROM uom WHERE code = 'PCS'),
  12
WHERE NOT EXISTS (
  SELECT 1 FROM uom_conversion 
  WHERE from_uom_id = (SELECT id FROM uom WHERE code = 'DOZ')
  AND to_uom_id = (SELECT id FROM uom WHERE code = 'PCS')
);

INSERT INTO uom_conversion (from_uom_id, to_uom_id, conversion_factor)
SELECT 
  (SELECT id FROM uom WHERE code = 'PCS'),
  (SELECT id FROM uom WHERE code = 'DOZ'),
  0.0833
WHERE NOT EXISTS (
  SELECT 1 FROM uom_conversion 
  WHERE from_uom_id = (SELECT id FROM uom WHERE code = 'PCS')
  AND to_uom_id = (SELECT id FROM uom WHERE code = 'DOZ')
);

-- Function to convert quantity between UOMs
CREATE OR REPLACE FUNCTION convert_uom_quantity(
  p_product_id UUID,
  p_from_uom_id UUID,
  p_to_uom_id UUID,
  p_quantity DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  v_from_factor DECIMAL;
  v_to_factor DECIMAL;
  v_result DECIMAL;
BEGIN
  -- If same UOM, return same quantity
  IF p_from_uom_id = p_to_uom_id THEN
    RETURN p_quantity;
  END IF;

  -- Get conversion factors from product_uom
  SELECT conversion_factor INTO v_from_factor
  FROM product_uom
  WHERE product_id = p_product_id AND uom_id = p_from_uom_id;

  SELECT conversion_factor INTO v_to_factor
  FROM product_uom
  WHERE product_id = p_product_id AND uom_id = p_to_uom_id;

  -- If both factors found, convert through base UOM
  IF v_from_factor IS NOT NULL AND v_to_factor IS NOT NULL THEN
    v_result := (p_quantity * v_from_factor) / v_to_factor;
    RETURN v_result;
  END IF;

  -- Try direct conversion from uom_conversion table
  SELECT conversion_factor INTO v_result
  FROM uom_conversion
  WHERE from_uom_id = p_from_uom_id AND to_uom_id = p_to_uom_id;

  IF v_result IS NOT NULL THEN
    RETURN p_quantity * v_result;
  END IF;

  -- If no conversion found, return original quantity
  RETURN p_quantity;
END;
$$ LANGUAGE plpgsql;

-- Function to get base quantity (convert to base UOM)
CREATE OR REPLACE FUNCTION get_base_quantity(
  p_product_id UUID,
  p_uom_id UUID,
  p_quantity DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  v_conversion_factor DECIMAL;
  v_base_uom_id UUID;
BEGIN
  -- Get base UOM for product
  SELECT base_uom_id INTO v_base_uom_id
  FROM products
  WHERE id = p_product_id;

  -- If no base UOM set, return original quantity
  IF v_base_uom_id IS NULL THEN
    RETURN p_quantity;
  END IF;

  -- If already in base UOM, return original quantity
  IF p_uom_id = v_base_uom_id THEN
    RETURN p_quantity;
  END IF;

  -- Get conversion factor
  SELECT conversion_factor INTO v_conversion_factor
  FROM product_uom
  WHERE product_id = p_product_id AND uom_id = p_uom_id;

  -- Return converted quantity
  IF v_conversion_factor IS NOT NULL THEN
    RETURN p_quantity * v_conversion_factor;
  END IF;

  -- If no conversion found, return original quantity
  RETURN p_quantity;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate base_quantity on order_items insert/update
CREATE OR REPLACE FUNCTION calculate_order_item_base_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.uom_id IS NOT NULL THEN
    NEW.base_quantity := get_base_quantity(NEW.product_id, NEW.uom_id, NEW.quantity);
  ELSE
    NEW.base_quantity := NEW.quantity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_item_base_quantity
BEFORE INSERT OR UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION calculate_order_item_base_quantity();

-- Trigger to calculate base_quantity on inventory_movements insert/update
CREATE OR REPLACE FUNCTION calculate_inventory_base_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.uom_id IS NOT NULL THEN
    NEW.base_quantity := get_base_quantity(NEW.product_id, NEW.uom_id, NEW.quantity);
  ELSE
    NEW.base_quantity := NEW.quantity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_base_quantity
BEFORE INSERT OR UPDATE ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION calculate_inventory_base_quantity();

-- Indexes for better performance
CREATE INDEX idx_product_uom_product ON product_uom(product_id);
CREATE INDEX idx_product_uom_uom ON product_uom(uom_id);
CREATE INDEX idx_uom_conversion_from ON uom_conversion(from_uom_id);
CREATE INDEX idx_uom_conversion_to ON uom_conversion(to_uom_id);
CREATE INDEX idx_products_base_uom ON products(base_uom_id);

-- View for product with all UOMs
CREATE OR REPLACE VIEW v_product_uom_details AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.name_mm as product_name_mm,
  pu.id as product_uom_id,
  u.id as uom_id,
  u.code as uom_code,
  u.name as uom_name,
  u.name_mm as uom_name_mm,
  pu.is_base_uom,
  pu.conversion_factor,
  pu.price,
  pu.cost,
  pu.barcode,
  pu.is_active
FROM products p
LEFT JOIN product_uom pu ON p.id = pu.product_id
LEFT JOIN uom u ON pu.uom_id = u.id
WHERE pu.is_active = true AND u.is_active = true;

COMMENT ON TABLE uom IS 'Unit of Measure master table';
COMMENT ON TABLE product_uom IS 'Product-specific UOM configurations with conversion factors';
COMMENT ON TABLE uom_conversion IS 'Direct UOM conversion table for standard conversions';
COMMENT ON COLUMN product_uom.conversion_factor IS 'Factor to convert this UOM to base UOM (e.g., 1 box = 12 pieces, factor = 12)';
COMMENT ON COLUMN product_uom.is_base_uom IS 'Indicates if this is the base UOM for stock tracking';
