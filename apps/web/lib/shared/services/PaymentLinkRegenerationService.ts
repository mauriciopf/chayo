import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

/**
 * Regenerates payment links for products when their price changes
 * (e.g., when offers are activated/deactivated)
 * 
 * @param productIds - Array of product UUIDs to regenerate payment links for
 * @returns Promise with success status and count of updated products
 */
export async function regeneratePaymentLinksForProducts(productIds: string[]): Promise<{ success: boolean; updated: number; error?: string }> {
  try {
    if (!productIds || productIds.length === 0) {
      return { success: true, updated: 0 }
    }

    const supabase = await getSupabaseServerClient()

    // Get products with their current prices and payment provider
    const { data: products, error: productsError } = await supabase
      .from('products_list_tool')
      .select('id, name, price, discounted_price, has_active_offer, organization_id, payment_provider_id, payment_link_url')
      .in('id', productIds)

    if (productsError || !products) {
      console.error('Error fetching products for regeneration:', productsError)
      return { success: false, updated: 0, error: 'Failed to fetch products' }
    }

    // Only regenerate for products that have an existing payment link
    const productsToUpdate = products.filter(p => p.payment_link_url && p.payment_provider_id)

    if (productsToUpdate.length === 0) {
      console.log('No products with payment links to update')
      return { success: true, updated: 0 }
    }

    console.log(`Regenerating payment links for ${productsToUpdate.length} products...`)

    let updatedCount = 0
    const errors: string[] = []

    // Process in parallel batches to avoid timeouts (10 at a time)
    const BATCH_SIZE = 10
    for (let i = 0; i < productsToUpdate.length; i += BATCH_SIZE) {
      const batch = productsToUpdate.slice(i, i + BATCH_SIZE)
      
      await Promise.allSettled(
        batch.map(async (product) => {
          try {
            // Use discounted price if available, otherwise regular price
            const finalPrice = product.has_active_offer && product.discounted_price 
              ? product.discounted_price 
              : product.price

            // Generate new payment link
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/create-link`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                organizationId: product.organization_id,
                amount: Math.round(finalPrice * 100),
                description: product.name,
                paymentProviderId: product.payment_provider_id // Use the product's selected provider
              })
            })

            if (response.ok) {
              const { paymentUrl } = await response.json()

              // Update product with new payment link
              await supabase
                .from('products_list_tool')
                .update({ payment_link_url: paymentUrl })
                .eq('id', product.id)

              updatedCount++
              console.log(`✅ Regenerated payment link for: ${product.name} ($${finalPrice})`)
            } else {
              const errorText = await response.text()
              const error = `${product.name}: ${errorText}`
              errors.push(error)
              console.error(`Failed to regenerate link for ${product.name}:`, errorText)
            }
          } catch (productError) {
            const error = `${product.name}: ${productError}`
            errors.push(error)
            console.error(`Error regenerating link for product ${product.id}:`, productError)
          }
        })
      )
    }

    console.log(`✅ Regenerated ${updatedCount}/${productsToUpdate.length} payment links`)
    
    if (errors.length > 0) {
      console.error(`❌ Failed to regenerate ${errors.length} payment links:`, errors)
    }
    
    return { 
      success: true, 
      updated: updatedCount,
      ...(errors.length > 0 && { error: `${errors.length} products failed: ${errors.slice(0, 3).join('; ')}` })
    }

  } catch (error) {
    console.error('Error in regeneratePaymentLinksForProducts:', error)
    return { success: false, updated: 0, error: 'Internal error' }
  }
}

