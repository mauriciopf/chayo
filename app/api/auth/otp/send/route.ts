import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient()
    // Authentication using server supabase client;
    
    // Send OTP via Supabase Auth 
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${req.nextUrl.origin}/dashboard`,
      },
    });
    
    if (error) {
      
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
    
    return NextResponse.json({ 
      success: true, 
      message: 'A 6-digit verification code has been sent to your email.',
      data: data
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 