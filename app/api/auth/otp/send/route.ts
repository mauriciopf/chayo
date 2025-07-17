import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const { supabase } = createClient(req);
    // Send OTP via Supabase Auth (6-digit code, not magic link)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${req.nextUrl.origin}/dashboard`,
        shouldCreateUser: true,
      },
    });
    if (error) {
      console.error('OTP send error:', error);
      return NextResponse.json({ error: 'Failed to send OTP code' }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'OTP code sent to your email' });
  } catch (error) {
    console.error('OTP send route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 