/*
  # Create orders and revenue tracking tables

  1. New Tables
    - `user_orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `order_number` (integer)
      - `name` (text, customer name)
      - `description` (text)
      - `total` (decimal)
      - `payment_method` (text)
      - `phone` (text)
      - `table_number` (integer)
      - `received_amount` (decimal)
      - `change_amount` (decimal)
      - `address` (jsonb)
      - `status` (text)
      - `card_color` (text)
      - `created_at` (timestamp)
      - `completed_at` (timestamp)
    
    - `user_daily_stats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `date` (date)
      - `daily_revenue` (decimal)
      - `total_orders` (integer)
      - `cash_initial` (decimal)
      - `cash_current` (decimal)
      - `last_reset_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own data
*/

-- Create user_orders table
CREATE TABLE IF NOT EXISTS user_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_number integer NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  total decimal(10,2) NOT NULL,
  payment_method text,
  phone text,
  table_number integer,
  received_amount decimal(10,2),
  change_amount decimal(10,2),
  address jsonb,
  status text NOT NULL DEFAULT 'pedidos',
  card_color text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create user_daily_stats table
CREATE TABLE IF NOT EXISTS user_daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  daily_revenue decimal(10,2) DEFAULT 0,
  total_orders integer DEFAULT 0,
  cash_initial decimal(10,2) DEFAULT 0,
  cash_current decimal(10,2) DEFAULT 0,
  last_reset_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE user_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for user_orders
CREATE POLICY "Users can manage their own orders"
  ON user_orders
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for user_daily_stats
CREATE POLICY "Users can manage their own daily stats"
  ON user_daily_stats
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_orders_user_id ON user_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orders_status ON user_orders(status);
CREATE INDEX IF NOT EXISTS idx_user_orders_created_at ON user_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_user_daily_stats_user_id ON user_daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_stats_date ON user_daily_stats(date);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_daily_stats_updated_at
  BEFORE UPDATE ON user_daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();