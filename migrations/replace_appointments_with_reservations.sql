-- Migration: Replace Appointments with Reservations System
-- Created: 2025-02-10
-- Description: Replaces the appointments table with a new reservations table that requires product linkage

BEGIN;

-- ============================================================================
-- 1. DROP OLD APPOINTMENTS TABLE
-- ============================================================================
-- Since we're in beta and don't need to preserve legacy data
DROP TABLE IF EXISTS appointments CASCADE;

-- ============================================================================
-- 2. CREATE NEW RESERVATIONS_TOOL TABLE (following naming convention)
-- ============================================================================
CREATE TABLE reservations_tool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products_list_tool(id) ON DELETE RESTRICT,
    
    -- Customer information
    customer_id UUID REFERENCES auth.users(id), -- If authenticated (fixed to auth.users)
    client_name TEXT, -- Optional: name may not be provided during OTP login
    client_email TEXT NOT NULL, -- Email is mandatory for reservations
    client_phone TEXT,
    
    -- Reservation details
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    notes TEXT,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 3. ADD INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_reservations_tool_organization_id ON reservations_tool(organization_id);
CREATE INDEX idx_reservations_tool_product_id ON reservations_tool(product_id);
CREATE INDEX idx_reservations_tool_customer_id ON reservations_tool(customer_id);
CREATE INDEX idx_reservations_tool_date ON reservations_tool(reservation_date);
CREATE INDEX idx_reservations_tool_status ON reservations_tool(status);
CREATE INDEX idx_reservations_tool_organization_date ON reservations_tool(organization_id, reservation_date);
CREATE INDEX idx_reservations_tool_organization_product ON reservations_tool(organization_id, product_id);

-- ============================================================================
-- 4. ADD UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_reservations_tool_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reservations_tool_updated_at
    BEFORE UPDATE ON reservations_tool
    FOR EACH ROW
    EXECUTE FUNCTION update_reservations_tool_updated_at();

-- ============================================================================
-- 5. RLS POLICIES (Optional for future security)
-- ============================================================================
-- Note: Not enabling RLS for now to keep things simple
-- Can be enabled later with proper policies

-- ALTER TABLE reservations_tool ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Organizations can view their own reservations" ON reservations_tool
--     FOR SELECT USING (
--         organization_id IN (
--             SELECT organization_id 
--             FROM team_members 
--             WHERE user_id = auth.uid()
--         )
--     );

-- CREATE POLICY "Public can insert reservations" ON reservations_tool
--     FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Organizations can update their own reservations" ON reservations_tool
--     FOR UPDATE USING (
--         organization_id IN (
--             SELECT organization_id 
--             FROM team_members 
--             WHERE user_id = auth.uid()
--         )
--     );

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Update API routes: /api/appointments → /api/reservations
-- 2. Update mobile/web UI to require product selection before reservation
-- 3. Update translations: Cita → Reservación
-- ============================================================================

