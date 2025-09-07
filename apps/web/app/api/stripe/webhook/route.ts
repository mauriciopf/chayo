import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize these inside the handler to avoid build-time errors
let stripe: Stripe
let supabase: ReturnType<typeof createClient>
let webhookSecret: string

function initializeClients() {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required')
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  
  if (!supabase) {
    if (!process.env.NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables are required')
    }
    supabase = createClient(
      process.env.NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  
  if (!webhookSecret) {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required')
    }
    webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  }
}

export async function POST(req: NextRequest) {
  try {
    // Initialize clients only when the function is called
    initializeClients()
    
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      // Platform subscription events
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      // Connect account events (for payment tool)
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break
      
      case 'capability.updated':
        await handleCapabilityUpdated(event.data.object as Stripe.Capability)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const planName = session.metadata?.plan_name
  
  if (!userId || !planName) {
    console.error('Missing user_id or plan_name in session metadata')
    return
  }

  // Get the subscription
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
  
  // Upsert user subscription
  const { error } = await (supabase
    .from('user_subscriptions') as any)
    .upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscription.id,
      plan_name: planName,
      status: subscription.status,
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    }, {
      onConflict: 'user_id'
    })

  if (error) {
    console.error('Error updating user subscription:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { error } = await (supabase
    .from('user_subscriptions') as any)
    .update({
      status: subscription.status,
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await (supabase
    .from('user_subscriptions') as any)
    .update({
      status: 'cancelled',
      plan_name: 'free',
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error cancelling subscription:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Update subscription status to active
  if ((invoice as any).subscription) {
    const { error } = await (supabase
      .from('user_subscriptions') as any)
      .update({ status: 'active' })
      .eq('stripe_subscription_id', (invoice as any).subscription as string)

    if (error) {
      console.error('Error updating subscription status:', error)
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Update subscription status to past_due
  if ((invoice as any).subscription) {
    const { error } = await (supabase
      .from('user_subscriptions') as any)
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', (invoice as any).subscription as string)

    if (error) {
      console.error('Error updating subscription status:', error)
    }
  }
}

// Connect account event handlers
async function handleAccountUpdated(account: Stripe.Account) {
  // Update stripe_settings when account capabilities change
  const { error } = await (supabase
    .from('stripe_settings') as any)
    .update({
      is_active: account.details_submitted && account.charges_enabled,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_user_id', account.id)

  if (error) {
    console.error('Error updating Stripe account status:', error)
  } else {
    console.log(`Updated account ${account.id}: active=${account.details_submitted && account.charges_enabled}`)
  }
}

async function handleCapabilityUpdated(capability: Stripe.Capability) {
  // Update account status when capabilities change (e.g., transfers enabled)
  if (capability.id === 'transfers') {
    const { error } = await (supabase
      .from('stripe_settings') as any)
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('stripe_user_id', capability.account)

    if (error) {
      console.error('Error updating capability status:', error)
    } else {
      console.log(`Updated capability ${capability.id} for account ${capability.account}: ${capability.status}`)
    }
  }
}
