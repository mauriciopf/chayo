-- Create products_list_tool table - simple product list management tool
CREATE TABLE IF NOT EXISTS products_list_tool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_list_tool_organization_id ON products_list_tool(organization_id);
-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_list_tool_updated_at 
  BEFORE UPDATE ON products_list_tool 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
