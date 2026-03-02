-- Wine Platform Database Schema
-- Multi-winery checkout with shipping calculator

-- Wineries table
CREATE TABLE IF NOT EXISTS wineries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  order_email TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  min_case_rules JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table (wines)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winery_id UUID NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format_liters DECIMAL(3,2) NOT NULL, -- 0.75 or 1.5
  unit_price_eur DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group orders (consolidated orders)
CREATE TABLE IF NOT EXISTS group_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shipping_address JSONB NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- started_at + 20 days
  status TEXT NOT NULL DEFAULT 'active', -- active, expired, completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parent orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_order_id UUID REFERENCES group_orders(id) ON DELETE CASCADE,
  shipping_method TEXT NOT NULL CHECK (shipping_method IN ('ocean', 'air_express', 'sail_cargo')),
  shipping_quote JSONB NOT NULL,
  wine_value_eur DECIMAL(12,2) NOT NULL,
  insurance_eur DECIMAL(10,2) NOT NULL,
  tariff_eur DECIMAL(10,2) NOT NULL,
  tariff_percent DECIMAL(5,2) DEFAULT 15.00,
  state_fees_eur DECIMAL(10,2) DEFAULT 0.00,
  total_eur DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sub-orders per winery
CREATE TABLE IF NOT EXISTS order_suborders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  winery_id UUID REFERENCES wineries(id) ON DELETE CASCADE,
  items JSONB NOT NULL, -- array of {product_id, qty, unit_price_eur}
  wine_value_eur DECIMAL(10,2) NOT NULL,
  small_batch_fee_eur DECIMAL(8,2) DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email log
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suborder_id UUID REFERENCES order_suborders(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'resend',
  subject TEXT NOT NULL,
  status TEXT NOT NULL, -- sent, failed, retry
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_winery_id ON products(winery_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_group_order_id ON orders(group_order_id);
CREATE INDEX IF NOT EXISTS idx_group_orders_user_id ON group_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_group_orders_status ON group_orders(status);
CREATE INDEX IF NOT EXISTS idx_order_suborders_order_id ON order_suborders(order_id);
CREATE INDEX IF NOT EXISTS idx_order_suborders_winery_id ON order_suborders(winery_id);
CREATE INDEX IF NOT EXISTS idx_email_log_suborder_id ON email_log(suborder_id);

-- Enable RLS
ALTER TABLE wineries ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_suborders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Wineries - public read for all, write for authenticated users
CREATE POLICY "Wineries are viewable by everyone" ON wineries FOR SELECT USING (true);
CREATE POLICY "Wineries are insertable by authenticated users" ON wineries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Wineries are updatable by authenticated users" ON wineries FOR UPDATE USING (auth.role() = 'authenticated');

-- Products - public read for all, write for authenticated users
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Products are insertable by authenticated users" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Products are updatable by authenticated users" ON products FOR UPDATE USING (auth.role() = 'authenticated');

-- Group orders - users can only see their own
CREATE POLICY "Users can view their own group orders" ON group_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own group orders" ON group_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own group orders" ON group_orders FOR UPDATE USING (auth.uid() = user_id);

-- Orders - users can only see their own, admins can see all
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Users can insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can insert all orders" ON orders FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Order suborders - users can only see their own, admins can see all
CREATE POLICY "Users can view their own suborders" ON order_suborders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_suborders.order_id 
    AND orders.user_id = auth.uid()
  )
);
CREATE POLICY "Admins can view all suborders" ON order_suborders FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Email log - users can only see their own, admins can see all
CREATE POLICY "Users can view their own email logs" ON email_log FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM order_suborders 
    WHERE order_suborders.id = email_log.suborder_id
    AND EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_suborders.order_id 
      AND orders.user_id = auth.uid()
    )
  )
);
CREATE POLICY "Admins can view all email logs" ON email_log FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Insert sample wineries for testing
INSERT INTO wineries (id, name, order_email, country, region) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Champagne House', 'orders@champagnehouse.com', 'France', 'Champagne'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Bordeaux Estates', 'info@bordeaux.com', 'France', 'Bordeaux'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Burgundy Collection', 'contact@burgundy.com', 'France', 'Burgundy')
ON CONFLICT DO NOTHING;
