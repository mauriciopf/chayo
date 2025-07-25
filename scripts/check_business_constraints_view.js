const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBusinessConstraintsView() {
  try {
    console.log('🔍 Checking business_constraints_view...')
    
    // Check if the view exists
    const { data: viewExists, error: viewError } = await supabase
      .from('business_constraints_view')
      .select('organization_id')
      .limit(1)
    
    if (viewError) {
      console.error('❌ View does not exist or is not accessible:', viewError)
      return
    }
    
    console.log('✅ View exists and is accessible')
    
    // Get all organizations
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
    
    if (orgError) {
      console.error('❌ Error fetching organizations:', orgError)
      return
    }
    
    console.log(`📋 Found ${organizations?.length || 0} organizations`)
    
    // Check business info fields for each organization
    for (const org of organizations || []) {
      console.log(`\n🔍 Checking organization: ${org.name} (${org.id})`)
      
      // Get business info fields
      const { data: fields, error: fieldsError } = await supabase
        .from('business_info_fields')
        .select('field_name, field_value, is_answered')
        .eq('organization_id', org.id)
      
      if (fieldsError) {
        console.error('❌ Error fetching business info fields:', fieldsError)
        continue
      }
      
      console.log(`📋 Found ${fields?.length || 0} business info fields`)
      
      const answeredFields = fields?.filter(f => f.is_answered) || []
      console.log(`✅ ${answeredFields.length} answered fields:`, answeredFields.map(f => f.field_name))
      
      // Check view data
      const { data: viewData, error: viewDataError } = await supabase
        .from('business_constraints_view')
        .select('business_constraints')
        .eq('organization_id', org.id)
        .single()
      
      if (viewDataError) {
        console.error('❌ Error fetching view data:', viewDataError)
        continue
      }
      
      if (viewData) {
        console.log('✅ View data found:', {
          business_info_gathered: viewData.business_constraints?.business_info_gathered,
          name: viewData.business_constraints?.name,
          fields_count: Object.keys(viewData.business_constraints || {}).length
        })
      } else {
        console.log('❌ No view data found')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkBusinessConstraintsView() 