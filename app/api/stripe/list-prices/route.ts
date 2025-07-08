import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(req: NextRequest) {
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
      limit: 20
    })

    const priceList = prices.data.map(price => ({
      id: price.id,
      product_id: typeof price.product === 'object' ? price.product.id : price.product,
      product_name: typeof price.product === 'object' && 'name' in price.product ? price.product.name : 'Unknown',
      amount: price.unit_amount ? price.unit_amount / 100 : 0,
      currency: price.currency,
      recurring: price.recurring?.interval || 'one-time'
    }))

    return NextResponse.json({ prices: priceList })
  } catch (error) {
    console.error('Error fetching prices:', error)
    return NextResponse.json(
      { error: 'Error fetching prices' },
      { status: 500 }
    )
  }
}
