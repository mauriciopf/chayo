require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testOtpFlow() {
  console.log('🔍 Testing OTP Flow Debug...\n');
  
  // Test email to use
  const testEmail = 'test@example.com';
  
  try {
    console.log('1️⃣ Testing OTP Send...');
    const { data: sendData, error: sendError } = await supabase.auth.signInWithOtp({
      email: testEmail,
      options: {
        shouldCreateUser: true,
      },
    });
    
    if (sendError) {
      console.error('❌ OTP Send Error:', sendError);
      return;
    }
    
    console.log('✅ OTP Send Success:', sendData);
    console.log('\n2️⃣ Now try verifying with a code...');
    
    // Test verification with a fake code to see the error message
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: testEmail,
      token: '123456',
      type: 'email',
    });
    
    if (verifyError) {
      console.log('❌ Expected Verify Error (with fake code):', verifyError);
      console.log('Error code:', verifyError.status);
      console.log('Error message:', verifyError.message);
    } else {
      console.log('🤔 Unexpected success with fake code:', verifyData);
    }
    
    // Test with different type
    const { data: verifyData2, error: verifyError2 } = await supabase.auth.verifyOtp({
      email: testEmail,
      token: '123456',
      type: 'signup',
    });
    
    if (verifyError2) {
      console.log('❌ Expected Verify Error with signup type (with fake code):', verifyError2);
    } else {
      console.log('🤔 Unexpected success with signup type:', verifyData2);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testOtpFlow(); 