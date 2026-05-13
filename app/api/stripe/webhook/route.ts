import { NextResponse, type NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type Stripe from 'stripe';

// Disable body parsing — Stripe signature verification requires raw body
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const supabaseUserId = session.client_reference_id;
    const stripeCustomerId = session.customer as string;

    if (supabaseUserId && stripeCustomerId) {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            },
          },
        }
      );

      await supabase.from('profiles').upsert(
        { id: supabaseUserId, stripe_customer_id: stripeCustomerId },
        { onConflict: 'id' }
      );
    }
  }

  return NextResponse.json({ received: true });
}
