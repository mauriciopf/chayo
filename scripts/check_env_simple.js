console.log('🔍 Environment Variables Check (Simple)\n');

// Check if .env.local exists
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
console.log('📁 Checking for .env.local file...');

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ .env.local file found');
  
  // Parse environment variables
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  console.log('\n📋 Variables in .env.local:');
  lines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      if (key.includes('SUPABASE')) {
        console.log(`${key}: ${value.substring(0, 20)}...`);
      } else {
        console.log(`${key}: [value hidden]`);
      }
    }
  });
  
  // Check required Supabase vars
  const hasUrl = envContent.includes('NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_URL');
  const hasKey = envContent.includes('NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  console.log('\n🔍 Required Supabase Variables:');
  console.log(`NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_URL: ${hasUrl ? '✅ Found' : '❌ Missing'}`);
  console.log(`NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_ANON_KEY: ${hasKey ? '✅ Found' : '❌ Missing'}`);
  
} catch (error) {
  console.log('❌ .env.local file not found or not readable');
  console.log('   Make sure you have a .env.local file in the project root');
}

console.log('\n🌐 Current NODE_ENV:', process.env.NODE_ENV || 'undefined'); 