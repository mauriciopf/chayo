const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  try {
    console.log('Checking business_info_fields table structure...');
    
    // Check if table exists and get its structure
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'business_info_fields' 
        ORDER BY ordinal_position;
      `
    });
    
    if (error) {
      console.error('Error checking table structure:', error);
      return;
    }
    
    console.log('Current table structure:');
    console.table(data);
    
    // Also check if the table exists
    const { data: tableExists, error: tableError } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'business_info_fields'
        );
      `
    });
    
    if (tableError) {
      console.error('Error checking if table exists:', tableError);
      return;
    }
    
    console.log('Table exists:', tableExists[0]?.exists);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTableStructure(); 