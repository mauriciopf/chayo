import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Look up stored Stripe customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ active: false });
  }

  // Query Stripe directly
  const subscriptions = await stripe.subscriptions.list({
    customer: profile.stripe_customer_id,
    status: 'active',
    limit: 1,
  });

  return NextResponse.json({ active: subscriptions.data.length > 0 });
}
