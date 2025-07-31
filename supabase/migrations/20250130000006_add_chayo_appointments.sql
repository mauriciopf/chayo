-- Create appointments table for Chayo's built-in booking system
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Client information
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    
    -- Appointment details
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    service_type TEXT,
    notes TEXT,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_appointments_organization_id ON appointments(organization_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_organization_date ON appointments(organization_id, appointment_date);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();

-- RLS policies for appointments
-- Organizations can only see their own appointments
-- We'll keep RLS simple for now but add it for future security

-- Note: For now, we're not enabling RLS to keep things simple
-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Organizations can view their own appointments" ON appointments
--     FOR SELECT USING (
--         organization_id IN (
--             SELECT organization_id 
--             FROM team_members 
--             WHERE user_id = auth.uid()
--         )
--     );

-- CREATE POLICY "Organizations can insert their own appointments" ON appointments
--     FOR INSERT WITH CHECK (
--         organization_id IN (
--             SELECT organization_id 
--             FROM team_members 
--             WHERE user_id = auth.uid()
--         )
--     );

-- CREATE POLICY "Organizations can update their own appointments" ON appointments
--     FOR UPDATE USING (
--         organization_id IN (
--             SELECT organization_id 
--             FROM team_members 
--             WHERE user_id = auth.uid()
--         )
--     );

-- CREATE POLICY "Organizations can delete their own appointments" ON appointments
--     FOR DELETE USING (
--         organization_id IN (
--             SELECT organization_id 
--             FROM team_members 
--             WHERE user_id = auth.uid()
--         )
--     );