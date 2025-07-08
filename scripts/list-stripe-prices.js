#!/usr/bin/env node

const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function listPrices() {
  try {
    console.log('🔍 Fetching your Stripe prices...\n');
    
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
      limit: 20
    });

    if (prices.data.length === 0) {
      console.log('❌ No active prices found in your Stripe account.');
      console.log('Please create products and prices in your Stripe dashboard first.');
      return;
    }

    console.log('📋 Your active Stripe prices:\n');
    
    prices.data.forEach((price, index) => {
      console.log(`${index + 1}. Product: ${price.product.name}`);
      console.log(`   Price ID: ${price.id}`);
      console.log(`   Amount: $${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`);
      console.log(`   Recurring: ${price.recurring?.interval || 'one-time'}`);
      console.log(`   Product ID: ${price.product.id}`);
      console.log('');
    });

    console.log('💡 Update your .env.local file with the correct Price IDs (not Product IDs)');
    console.log('   Example: NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC=price_1234567890abcdef');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listPrices();
