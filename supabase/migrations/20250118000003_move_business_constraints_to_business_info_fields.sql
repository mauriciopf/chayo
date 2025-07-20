-- Migration: Move business constraints from agents table to business_info_fields
-- Create a more structured approach where business constraints are stored in business_info_fields
-- and agents reference them through a business_constraints_id

-- First, let's add a business_constraints_id column to the agents table
ALTER TABLE agents ADD COLUMN business_constraints_id UUID;

-- Create a function to generate business constraints from business_info_fields
CREATE OR REPLACE FUNCTION generate_business_constraints(org_id UUID)
RETURNS JSONB AS $$
DECLARE
    constraints JSONB;
    answered_fields RECORD;
    answered_count INTEGER;
BEGIN
    -- Initialize with default values
    constraints := '{
        "name": "Business AI Assistant",
        "tone": "professional",
        "greeting": "¡Hola! I am Chayo, your AI business assistant. I am here to understand your health and wellness business better. To get started, what type of business do you run?",
        "goals": ["Gather comprehensive business information", "Understand business processes", "Document business operations", "Learn about products and services", "Understand customer base"],
        "industry": "General Business",
        "values": ["Information Accuracy", "Business Understanding", "Process Documentation", "Customer Focus", "Operational Clarity"],
        "policies": ["Only ask business-related questions", "Gather detailed information about operations", "Document business processes accurately", "Maintain focus on business information"],
        "contact_info": "",
        "custom_rules": ["Only ask questions about their business", "Never provide advice or information about other topics", "Focus on gathering business information"],
        "whatsapp_trial_mentioned": false,
        "business_info_gathered": 0
    }'::JSONB;

    -- Add all answered business info fields to the constraints
    FOR answered_fields IN 
        SELECT field_name, field_value 
        FROM business_info_fields 
        WHERE organization_id = org_id AND is_answered = true
    LOOP
        constraints := jsonb_set(constraints, ARRAY[answered_fields.field_name], to_jsonb(answered_fields.field_value));
    END LOOP;

    -- Update business_info_gathered count
    SELECT COUNT(*) INTO answered_count
    FROM business_info_fields 
    WHERE organization_id = org_id AND is_answered = true;
    
    constraints := jsonb_set(constraints, ARRAY['business_info_gathered'], to_jsonb(answered_count));

    RETURN constraints;
END;
$$ LANGUAGE plpgsql;

-- Create a view to get business constraints for an organization
CREATE OR REPLACE VIEW business_constraints_view AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    generate_business_constraints(o.id) as business_constraints
FROM organizations o;

-- Create a function to get business constraints for an agent
CREATE OR REPLACE FUNCTION get_agent_business_constraints(agent_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    org_id UUID;
    constraints JSONB;
BEGIN
    -- Get the organization_id for this agent
    SELECT organization_id INTO org_id
    FROM agents
    WHERE id = agent_uuid;
    
    IF org_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Generate business constraints for this organization
    RETURN generate_business_constraints(org_id);
END;
$$ LANGUAGE plpgsql;

-- Update existing agents to have a reference to their organization's business constraints
UPDATE agents 
SET business_constraints_id = organization_id
WHERE business_constraints_id IS NULL;

-- Make business_constraints_id NOT NULL after populating
ALTER TABLE agents ALTER COLUMN business_constraints_id SET NOT NULL;

-- Add foreign key constraint (optional, since it references organization_id)
-- ALTER TABLE agents ADD CONSTRAINT fk_agents_business_constraints 
--     FOREIGN KEY (business_constraints_id) REFERENCES organizations(id);

-- Create an index for better performance
CREATE INDEX idx_agents_business_constraints_id ON agents(business_constraints_id);

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_business_constraints(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_business_constraints(UUID) TO authenticated;
GRANT SELECT ON business_constraints_view TO authenticated; 