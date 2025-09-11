-- Add payment integration to products_list_tool
-- This allows linking products/services to payment transactions (optional)

ALTER TABLE products_list_tool 
ADD COLUMN payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL;

-- Create index for better performance when querying products with payments
CREATE INDEX IF NOT EXISTS idx_products_list_tool_payment_transaction_id 
ON products_list_tool(payment_transaction_id);

-- Add comment to explain the relationship
COMMENT ON COLUMN products_list_tool.payment_transaction_id IS 'Optional link to payment transaction - allows products/services to be associated with payment links created by the payment tool';
