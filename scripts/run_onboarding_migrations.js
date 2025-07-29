const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql) {
  console.log('Executing SQL...');
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.error('SQL Error:', error);
    throw error;
  }
}

async function runOnboardingMigrations() {
  try {
    console.log('🚀 Starting onboarding migrations...\n');

    // Migration 1: Add setup completion tracking
    console.log('📋 Migration 1: Adding setup completion tracking...');
    const setupCompletionSQL = `
      -- Create setup_completion table
      CREATE TABLE IF NOT EXISTS setup_completion (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        setup_status TEXT NOT NULL DEFAULT 'in_progress' CHECK (setup_status IN ('in_progress', 'completed', 'abandoned')),
        completed_at TIMESTAMPTZ,
        total_questions INTEGER DEFAULT 0,
        answered_questions INTEGER DEFAULT 0,
        current_stage TEXT DEFAULT 'stage_1',
        stage_progress JSONB DEFAULT '{}'::jsonb,
        completion_data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(organization_id)
      );

      -- Enable RLS for setup_completion
      ALTER TABLE setup_completion ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies for setup_completion
      DROP POLICY IF EXISTS "Users can view their own setup completion" ON setup_completion;
      CREATE POLICY "Users can view their own setup completion" ON setup_completion
        FOR SELECT USING (
          organization_id = ANY(public.get_user_organization_ids(auth.uid()::uuid))
        );

      DROP POLICY IF EXISTS "Users can insert their own setup completion" ON setup_completion;
      CREATE POLICY "Users can insert their own setup completion" ON setup_completion
        FOR INSERT WITH CHECK (
          organization_id = ANY(public.get_user_organization_ids(auth.uid()::uuid))
        );

      DROP POLICY IF EXISTS "Users can update their own setup completion" ON setup_completion;
      CREATE POLICY "Users can update their own setup completion" ON setup_completion
        FOR UPDATE USING (
          organization_id = ANY(public.get_user_organization_ids(auth.uid()::uuid))
        );

      -- Create indexes for setup_completion
      CREATE INDEX IF NOT EXISTS idx_setup_completion_organization_id ON setup_completion(organization_id);
      CREATE INDEX IF NOT EXISTS idx_setup_completion_status ON setup_completion(setup_status);
      CREATE INDEX IF NOT EXISTS idx_setup_completion_created_at ON setup_completion(created_at);

      -- Create trigger for setup_completion updated_at
      DROP TRIGGER IF EXISTS update_setup_completion_updated_at ON setup_completion;
      CREATE TRIGGER update_setup_completion_updated_at 
        BEFORE UPDATE ON setup_completion 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      -- Grant permissions
      GRANT ALL ON setup_completion TO authenticated;

      -- Add comment
      COMMENT ON TABLE setup_completion IS 'Tracks onboarding setup completion status for organizations';
    `;
    
    await executeSQL(setupCompletionSQL);
    console.log('✅ Setup completion tracking added successfully!\n');

    // Migration 2: Add onboarding columns to business_info_fields
    console.log('📝 Migration 2: Adding onboarding columns to business_info_fields...');
    const businessInfoFieldsSQL = `
      -- Add missing columns to business_info_fields table
      ALTER TABLE business_info_fields 
      ADD COLUMN IF NOT EXISTS allow_multiple BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS show_other BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'stage_1',
      ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

      -- Add comments for the new columns
      COMMENT ON COLUMN business_info_fields.allow_multiple IS 'Whether multiple choices can be selected for this question';
      COMMENT ON COLUMN business_info_fields.show_other IS 'Whether to show "Other" option for multiple choice questions';
      COMMENT ON COLUMN business_info_fields.stage IS 'Which onboarding stage this question belongs to';
      COMMENT ON COLUMN business_info_fields."order" IS 'Order of the question within its stage';

      -- Create index for ordering questions
      CREATE INDEX IF NOT EXISTS idx_business_info_fields_order ON business_info_fields("order");

      -- Create index for stage-based queries
      CREATE INDEX IF NOT EXISTS idx_business_info_fields_stage ON business_info_fields(stage);

      -- Update existing records to have default values
      UPDATE business_info_fields 
      SET 
        allow_multiple = false,
        show_other = false,
        stage = 'stage_1',
        "order" = id::text::integer % 1000
      WHERE allow_multiple IS NULL OR show_other IS NULL OR stage IS NULL OR "order" IS NULL;
    `;
    
    await executeSQL(businessInfoFieldsSQL);
    console.log('✅ Business info fields onboarding columns added successfully!\n');

    // Migration 3: Add multiple choices support (if not already present)
    console.log('🔢 Migration 3: Ensuring multiple choices support...');
    const multipleChoicesSQL = `
      -- Add multiple_choices column if it doesn't exist
      ALTER TABLE business_info_fields 
      ADD COLUMN IF NOT EXISTS multiple_choices JSONB DEFAULT NULL;

      -- Add comment for multiple_choices
      COMMENT ON COLUMN business_info_fields.multiple_choices IS 'JSON array of multiple choice options for this question';
    `;
    
    await executeSQL(multipleChoicesSQL);
    console.log('✅ Multiple choices support ensured!\n');

    // Migration 4: Create helper function for getting user organization IDs (if not exists)
    console.log('🔧 Migration 4: Creating helper functions...');
    const helperFunctionsSQL = `
      -- Create function to get user organization IDs (if not exists)
      CREATE OR REPLACE FUNCTION public.get_user_organization_ids(user_id UUID)
      RETURNS UUID[] AS $$
      DECLARE
        org_ids UUID[];
      BEGIN
        -- Get organizations owned by user
        SELECT array_agg(id) INTO org_ids
        FROM organizations 
        WHERE owner_id = user_id;
        
        -- Get organizations where user is a team member
        SELECT array_cat(org_ids, array_agg(organization_id)) INTO org_ids
        FROM team_members 
        WHERE user_id = user_id AND status = 'active';
        
        RETURN COALESCE(org_ids, ARRAY[]::UUID[]);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Grant execute permission
      GRANT EXECUTE ON FUNCTION public.get_user_organization_ids(UUID) TO authenticated;
    `;
    
    await executeSQL(helperFunctionsSQL);
    console.log('✅ Helper functions created!\n');

    // Migration 5: Ensure update_updated_at_column function exists
    console.log('⏰ Migration 5: Ensuring updated_at trigger function...');
    const triggerFunctionSQL = `
      -- Create update_updated_at_column function if it doesn't exist
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await executeSQL(triggerFunctionSQL);
    console.log('✅ Updated_at trigger function ensured!\n');

    console.log('🎉 All onboarding migrations completed successfully!');
    console.log('\n📊 Summary of changes:');
    console.log('  ✅ Created setup_completion table for tracking onboarding progress');
    console.log('  ✅ Added onboarding columns to business_info_fields table');
    console.log('  ✅ Added multiple choices support');
    console.log('  ✅ Created helper functions for organization access');
    console.log('  ✅ Ensured trigger functions for automatic timestamp updates');
    console.log('\n🚀 Your database is now ready for the new integrated onboarding system!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n💡 If you encounter errors, you may need to:');
    console.error('   1. Check your Supabase service role key has proper permissions');
    console.error('   2. Ensure your database is accessible');
    console.error('   3. Run migrations manually in the Supabase dashboard');
    process.exit(1);
  }
}

// Run the migrations
runOnboardingMigrations(); 