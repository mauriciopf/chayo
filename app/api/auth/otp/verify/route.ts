import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || typeof email !== 'string' || !code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Valid email and code required' }, { status: 400 });
    }

    const { supabase, response } = createClient(req);
    
    console.log('🔍 OTP verification attempt:', { 
      email, 
      code: code.substring(0, 2) + '****',
      codeLength: code.length,
      codeIsNumeric: /^\d+$/.test(code)
    });
    
    // Check if the code is 6 digits
    if (!/^\d{6}$/.test(code)) {
      console.log('❌ Invalid code format');
      return NextResponse.json({ error: 'Please enter a valid 6-digit code' }, { status: 400 });
    }
    
    // Try different verification types based on common Supabase patterns
    const verificationAttempts = [
      { type: 'email', description: 'Standard email verification' },
      { type: 'signup', description: 'New user signup verification' },
      { type: 'magiclink', description: 'Magic link verification (legacy)' }
    ];
    
    for (const attempt of verificationAttempts) {
      try {
        console.log(`🔄 Trying verification type: ${attempt.type} (${attempt.description})`);
        
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: attempt.type as any,
        });
        
        if (!error && data?.user) {
          console.log('✅ OTP verification successful with type:', attempt.type);
          console.log('👤 User:', { id: data.user.id, email: data.user.email });
          
          // Return success with session cookies
          return NextResponse.json({ success: true, user: data.user }, {
            status: 200,
            headers: response.headers,
          });
        }
        
        if (error) {
          console.log(`❌ ${attempt.type} verification failed:`, {
            message: error.message,
            status: error.status || 'unknown'
          });
        }
        
      } catch (verifyError) {
        console.log(`💥 Exception during ${attempt.type} verification:`, verifyError);
      }
    }
    
    // If all attempts failed, return generic error
    console.log('🚫 All verification attempts failed');
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
    
  } catch (error) {
    console.error('💥 OTP verify route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 