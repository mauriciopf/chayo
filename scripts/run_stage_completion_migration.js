const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runStageCompletionMigration() {
  try {
    console.log('🔄 Running stage completion migration...')

    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250122000003_add_stage_completion_columns.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration SQL:')
    console.log(migrationSQL)

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }

    console.log('✅ Stage completion migration completed successfully!')
    console.log('📊 Migration result:', data)

  } catch (error) {
    console.error('❌ Error running migration:', error)
    process.exit(1)
  }
}

runStageCompletionMigration() 