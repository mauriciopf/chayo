import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const { supabase } = createClient(req);
    
    console.log('📧 OTP send attempt for email:', email);
    
    // Check if user already exists
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('Current session check:', { user: userData.user?.email || 'none', error: userError?.message || 'none' });
    } catch (e) {
      console.log('No existing session found');
    }
    
    // Send OTP via Supabase Auth 
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${req.nextUrl.origin}/dashboard`,
      },
    });
    
    if (error) {
      console.error('❌ OTP send error:', {
        message: error.message,
        status: error.status || 'unknown'
      });
      
      // Handle specific error cases
      if (error.message?.includes('rate limit')) {
        return NextResponse.json({ error: 'Too many requests. Please wait before requesting another code.' }, { status: 429 });
      }
      
      if (error.message?.includes('invalid email')) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to send verification code. Please try again.' 
      }, { status: 500 });
    }
    
    console.log('✅ OTP sent successfully to:', email);
    console.log('📋 Send response data:', data);
    
    return NextResponse.json({ 
      success: true, 
      message: 'A 6-digit verification code has been sent to your email.',
      data: data
    });
  } catch (error) {
    console.error('💥 OTP send route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 