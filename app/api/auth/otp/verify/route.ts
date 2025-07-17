import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || typeof email !== 'string' || !code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Valid email and code required' }, { status: 400 });
    }

    const { supabase } = createClient(req);
    // Verify OTP via Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    if (error) {
      console.error('OTP verify error:', error);
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
    }
    return NextResponse.json({ success: true, user: data.user });
  } catch (error) {
    console.error('OTP verify route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 