-- Add database constraints for data validation
-- Run this after schema.sql

-- Products constraints
ALTER TABLE products 
  DROP CONSTRAINT IF EXISTS products_price_positive,
  ADD CONSTRAINT products_price_positive CHECK (price >= 0);

ALTER TABLE products 
  DROP CONSTRAINT IF EXISTS products_cost_positive,
  ADD CONSTRAINT products_cost_positive CHECK (cost IS NULL OR cost >= 0);

ALTER TABLE products 
  DROP CONSTRAINT IF EXISTS products_stock_non_negative,
  ADD CONSTRAINT products_stock_non_negative CHECK (stock_quantity >= 0);

-- Orders constraints
ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_total_positive,
  ADD CONSTRAINT orders_total_positive CHECK (total_amount >= 0);

ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_discount_valid,
  ADD CONSTRAINT orders_discount_valid CHECK (discount >= 0 AND discount <= total_amount);

ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_tax_non_negative,
  ADD CONSTRAINT orders_tax_non_negative CHECK (tax >= 0);

-- Order items constraints
ALTER TABLE order_items 
  DROP CONSTRAINT IF EXISTS order_items_quantity_positive,
  ADD CONSTRAINT order_items_quantity_positive CHECK (quantity > 0);

ALTER TABLE order_items 
  DROP CONSTRAINT IF EXISTS order_items_price_non_negative,
  ADD CONSTRAINT order_items_price_non_negative CHECK (price >= 0);

-- Customers constraints
ALTER TABLE customers 
  DROP CONSTRAINT IF EXISTS customers_email_format,
  ADD CONSTRAINT customers_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add unique constraints
ALTER TABLE customers 
  DROP CONSTRAINT IF EXISTS customers_phone_unique;
  
CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_unique 
  ON customers(phone) WHERE phone IS NOT NULL;

-- Update foreign key constraints with proper ON DELETE actions
ALTER TABLE products 
  DROP CONSTRAINT IF EXISTS products_category_id_fkey;
  
ALTER TABLE products 
  ADD CONSTRAINT products_category_id_fkey 
    FOREIGN KEY (category_id) 
    REFERENCES categories(id) 
    ON DELETE SET NULL;

ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
  
ALTER TABLE orders 
  ADD CONSTRAINT orders_customer_id_fkey 
    FOREIGN KEY (customer_id) 
    REFERENCES customers(id) 
    ON DELETE SET NULL;

ALTER TABLE order_items 
  DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
  
ALTER TABLE order_items 
  ADD CONSTRAINT order_items_product_id_fkey 
    FOREIGN KEY (product_id) 
    REFERENCES products(id) 
    ON DELETE RESTRICT; -- Prevent deletion of products with orders

ALTER TABLE chat_messages 
  DROP CONSTRAINT IF EXISTS chat_messages_customer_id_fkey;
  
ALTER TABLE chat_messages 
  ADD CONSTRAINT chat_messages_customer_id_fkey 
    FOREIGN KEY (customer_id) 
    REFERENCES customers(id) 
    ON DELETE CASCADE; -- Delete messages when customer deleted

-- Add missing indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_source ON orders(source);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_stock ON products(stock_quantity);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active ON users(email, is_active);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customer_date 
  ON orders(customer_id, created_at DESC);
  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_product_order 
  ON order_items(product_id, order_id);

-- Partial indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_pending 
  ON orders(created_at DESC) WHERE status = 'pending';
  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_low_stock 
  ON products(stock_quantity) WHERE stock_quantity < 10;

COMMENT ON CONSTRAINT products_price_positive ON products IS 'Ensures product price is non-negative';
COMMENT ON CONSTRAINT orders_total_positive ON orders IS 'Ensures order total is non-negative';
COMMENT ON CONSTRAINT order_items_quantity_positive ON order_items IS 'Ensures order item quantity is positive';

SELECT 'Database constraints added successfully!' as status;
