-- Add property-specific fields to products_list_tool
ALTER TABLE products_list_tool
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS bedrooms INTEGER,
ADD COLUMN IF NOT EXISTS bathrooms NUMERIC(3,1),
ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'apartment';

COMMENT ON COLUMN products_list_tool.address IS 'Full address of the property';
COMMENT ON COLUMN products_list_tool.bedrooms IS 'Number of bedrooms';
COMMENT ON COLUMN products_list_tool.bathrooms IS 'Number of bathrooms (can be fractional)';
COMMENT ON COLUMN products_list_tool.property_type IS 'Type of property (apartment, house, commercial, etc.)';

