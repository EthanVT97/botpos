-- Advanced Analytics Schema
-- Run this after auth_schema.sql

-- Sales analytics view (daily aggregation)
CREATE OR REPLACE VIEW v_sales_analytics AS
SELECT 
  DATE(o.created_at) as sale_date,
  COUNT(o.id) as order_count,
  SUM(o.total_amount) as total_sales,
  SUM(o.total_amount - o.discount) as net_sales,
  SUM(o.discount) as total_discount,
  SUM(o.tax) as total_tax,
  AVG(o.total_amount) as avg_order_value,
  COUNT(DISTINCT o.customer_id) as unique_customers,
  COUNT(CASE WHEN o.payment_method = 'cash' THEN 1 END) as cash_orders,
  COUNT(CASE WHEN o.payment_method = 'kpay' THEN 1 END) as kpay_orders,
  COUNT(CASE WHEN o.payment_method = 'wavepay' THEN 1 END) as wavepay_orders,
  COUNT(CASE WHEN o.payment_method = 'card' THEN 1 END) as card_orders,
  SUM(CASE WHEN o.payment_method = 'cash' THEN o.total_amount ELSE 0 END) as cash_amount,
  SUM(CASE WHEN o.payment_method = 'kpay' THEN o.total_amount ELSE 0 END) as kpay_amount,
  SUM(CASE WHEN o.payment_method = 'wavepay' THEN o.total_amount ELSE 0 END) as wavepay_amount,
  SUM(CASE WHEN o.payment_method = 'card' THEN o.total_amount ELSE 0 END) as card_amount
FROM orders o
WHERE o.status != 'cancelled'
GROUP BY DATE(o.created_at)
ORDER BY sale_date DESC;

-- Product performance view
CREATE OR REPLACE VIEW v_product_performance AS
SELECT 
  p.id,
  p.name,
  p.name_mm,
  p.sku,
  p.price,
  p.cost,
  p.stock_quantity,
  c.name as category_name,
  COUNT(oi.id) as times_sold,
  SUM(oi.quantity) as total_quantity_sold,
  SUM(oi.subtotal) as total_revenue,
  SUM(oi.subtotal - (COALESCE(p.cost, 0) * oi.quantity)) as total_profit,
  CASE 
    WHEN SUM(oi.subtotal) > 0 
    THEN ((SUM(oi.subtotal - (COALESCE(p.cost, 0) * oi.quantity)) / SUM(oi.subtotal)) * 100)
    ELSE 0 
  END as profit_margin_percent,
  AVG(oi.price) as avg_selling_price,
  MAX(o.created_at) as last_sold_date
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
LEFT JOIN categories c ON p.category_id = c.id
GROUP BY p.id, p.name, p.name_mm, p.sku, p.price, p.cost, p.stock_quantity, c.name;

-- Customer analytics view
CREATE OR REPLACE VIEW v_customer_analytics AS
SELECT 
  c.id,
  c.name,
  c.phone,
  c.email,
  COUNT(o.id) as total_orders,
  SUM(o.total_amount) as total_spent,
  AVG(o.total_amount) as avg_order_value,
  MAX(o.created_at) as last_order_date,
  MIN(o.created_at) as first_order_date,
  EXTRACT(DAY FROM (MAX(o.created_at) - MIN(o.created_at))) as customer_lifetime_days,
  CASE 
    WHEN MAX(o.created_at) > NOW() - INTERVAL '30 days' THEN 'active'
    WHEN MAX(o.created_at) > NOW() - INTERVAL '90 days' THEN 'inactive'
    ELSE 'churned'
  END as customer_status,
  COUNT(DISTINCT DATE(o.created_at)) as purchase_frequency
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id AND o.status != 'cancelled'
GROUP BY c.id, c.name, c.phone, c.email;

-- Hourly sales pattern view
CREATE OR REPLACE VIEW v_hourly_sales AS
SELECT 
  EXTRACT(HOUR FROM o.created_at) as hour_of_day,
  COUNT(o.id) as order_count,
  SUM(o.total_amount) as total_sales,
  AVG(o.total_amount) as avg_order_value
FROM orders o
WHERE o.status != 'cancelled'
  AND o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY EXTRACT(HOUR FROM o.created_at)
ORDER BY hour_of_day;

-- Category performance view
CREATE OR REPLACE VIEW v_category_performance AS
SELECT 
  c.id,
  c.name,
  c.name_mm,
  COUNT(DISTINCT p.id) as product_count,
  COUNT(oi.id) as times_sold,
  SUM(oi.quantity) as total_quantity_sold,
  SUM(oi.subtotal) as total_revenue,
  SUM(oi.subtotal - (COALESCE(p.cost, 0) * oi.quantity)) as total_profit,
  AVG(oi.price) as avg_selling_price
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
GROUP BY c.id, c.name, c.name_mm;

-- Payment method analytics view
CREATE OR REPLACE VIEW v_payment_analytics AS
SELECT 
  o.payment_method,
  COUNT(o.id) as transaction_count,
  SUM(o.total_amount) as total_amount,
  AVG(o.total_amount) as avg_transaction_value,
  MIN(o.total_amount) as min_transaction,
  MAX(o.total_amount) as max_transaction
FROM orders o
WHERE o.status != 'cancelled'
GROUP BY o.payment_method;

-- Inventory value view
CREATE OR REPLACE VIEW v_inventory_value AS
SELECT 
  p.id,
  p.name,
  p.name_mm,
  p.stock_quantity,
  p.cost,
  p.price,
  (p.stock_quantity * COALESCE(p.cost, 0)) as inventory_cost_value,
  (p.stock_quantity * p.price) as inventory_retail_value,
  (p.stock_quantity * (p.price - COALESCE(p.cost, 0))) as potential_profit,
  c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.stock_quantity > 0;

-- Low stock products view
CREATE OR REPLACE VIEW v_low_stock_products AS
SELECT 
  p.id,
  p.name,
  p.name_mm,
  p.sku,
  p.stock_quantity,
  p.price,
  c.name as category_name,
  COALESCE(SUM(oi.quantity), 0) as total_sold_last_30_days,
  CASE 
    WHEN COALESCE(SUM(oi.quantity), 0) > 0 
    THEN ROUND((p.stock_quantity::DECIMAL / (SUM(oi.quantity) / 30.0)), 1)
    ELSE NULL
  END as days_of_stock_remaining
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id 
  AND o.status != 'cancelled'
  AND o.created_at >= NOW() - INTERVAL '30 days'
WHERE p.stock_quantity < 20
GROUP BY p.id, p.name, p.name_mm, p.sku, p.stock_quantity, p.price, c.name
ORDER BY p.stock_quantity ASC;

-- Sales by source view (POS vs Bot orders)
CREATE OR REPLACE VIEW v_sales_by_source AS
SELECT 
  o.source,
  COUNT(o.id) as order_count,
  SUM(o.total_amount) as total_sales,
  AVG(o.total_amount) as avg_order_value,
  SUM(o.discount) as total_discount
FROM orders o
WHERE o.status != 'cancelled'
GROUP BY o.source;

-- Function to get sales summary for date range
CREATE OR REPLACE FUNCTION get_sales_summary(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_sales DECIMAL,
  total_orders BIGINT,
  avg_order_value DECIMAL,
  total_profit DECIMAL,
  total_discount DECIMAL,
  unique_customers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(o.total_amount), 0)::DECIMAL as total_sales,
    COUNT(o.id) as total_orders,
    COALESCE(AVG(o.total_amount), 0)::DECIMAL as avg_order_value,
    COALESCE(SUM(oi.subtotal - (COALESCE(p.cost, 0) * oi.quantity)), 0)::DECIMAL as total_profit,
    COALESCE(SUM(o.discount), 0)::DECIMAL as total_discount,
    COUNT(DISTINCT o.customer_id) as unique_customers
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN products p ON oi.product_id = p.id
  WHERE o.status != 'cancelled'
    AND DATE(o.created_at) BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get top products for date range
CREATE OR REPLACE FUNCTION get_top_products(
  p_start_date DATE,
  p_end_date DATE,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR,
  product_name_mm VARCHAR,
  quantity_sold BIGINT,
  revenue DECIMAL,
  profit DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.name_mm,
    SUM(oi.quantity)::BIGINT as quantity_sold,
    SUM(oi.subtotal)::DECIMAL as revenue,
    SUM(oi.subtotal - (COALESCE(p.cost, 0) * oi.quantity))::DECIMAL as profit
  FROM products p
  JOIN order_items oi ON p.id = oi.product_id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.status != 'cancelled'
    AND DATE(o.created_at) BETWEEN p_start_date AND p_end_date
  GROUP BY p.id, p.name, p.name_mm
  ORDER BY quantity_sold DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get sales trend (daily, weekly, monthly)
CREATE OR REPLACE FUNCTION get_sales_trend(
  p_start_date DATE,
  p_end_date DATE,
  p_interval VARCHAR DEFAULT 'day'
)
RETURNS TABLE (
  period TEXT,
  total_sales DECIMAL,
  order_count BIGINT,
  avg_order_value DECIMAL
) AS $$
BEGIN
  IF p_interval = 'day' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(DATE(o.created_at), 'YYYY-MM-DD') as period,
      SUM(o.total_amount)::DECIMAL as total_sales,
      COUNT(o.id) as order_count,
      AVG(o.total_amount)::DECIMAL as avg_order_value
    FROM orders o
    WHERE o.status != 'cancelled'
      AND DATE(o.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(o.created_at)
    ORDER BY DATE(o.created_at);
  ELSIF p_interval = 'week' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(DATE_TRUNC('week', o.created_at), 'YYYY-MM-DD') as period,
      SUM(o.total_amount)::DECIMAL as total_sales,
      COUNT(o.id) as order_count,
      AVG(o.total_amount)::DECIMAL as avg_order_value
    FROM orders o
    WHERE o.status != 'cancelled'
      AND DATE(o.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE_TRUNC('week', o.created_at)
    ORDER BY DATE_TRUNC('week', o.created_at);
  ELSIF p_interval = 'month' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(DATE_TRUNC('month', o.created_at), 'YYYY-MM') as period,
      SUM(o.total_amount)::DECIMAL as total_sales,
      COUNT(o.id) as order_count,
      AVG(o.total_amount)::DECIMAL as avg_order_value
    FROM orders o
    WHERE o.status != 'cancelled'
      AND DATE(o.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE_TRUNC('month', o.created_at)
    ORDER BY DATE_TRUNC('month', o.created_at);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_created_date ON orders(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

COMMENT ON VIEW v_sales_analytics IS 'Daily sales aggregation with payment method breakdown';
COMMENT ON VIEW v_product_performance IS 'Product sales performance with profit margins';
COMMENT ON VIEW v_customer_analytics IS 'Customer lifetime value and purchase patterns';
COMMENT ON VIEW v_hourly_sales IS 'Sales patterns by hour of day';
COMMENT ON VIEW v_category_performance IS 'Category-level sales performance';
COMMENT ON VIEW v_payment_analytics IS 'Payment method usage and amounts';
COMMENT ON VIEW v_inventory_value IS 'Current inventory valuation';
COMMENT ON VIEW v_low_stock_products IS 'Products with low stock and reorder recommendations';
