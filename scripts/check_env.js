require('dotenv').config({ path: '.env.local' });

console.log('🔍 Environment Variables Check\n');

const requiredVars = [
  'NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

console.log('Required Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NOT FOUND`);
  }
});

console.log('\nOptional Environment Variables:');
const optionalVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'NODE_ENV'
];

optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`⚠️  ${varName}: NOT FOUND (optional)`);
  }
});

console.log('\n🔗 Testing Supabase URL format...');
const url = process.env.NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_URL;
if (url) {
  if (url.includes('supabase.co')) {
    console.log('✅ URL format looks correct');
  } else {
    console.log('⚠️  URL format might be incorrect');
  }
} else {
  console.log('❌ No URL to test');
} 