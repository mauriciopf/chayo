import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

const SYSTEM_USER_TOKEN = process.env.FACEBOOK_SYSTEM_USER_TOKEN

/**
 * POST /api/products/[id]/sync-to-meta
 * Sync a product to Meta Commerce catalog when WABA is connected
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get product details with organization slug
    const { data: product, error: productError } = await supabase
      .from('products_list_tool')
      .select('*, organizations!inner(id, name, slug)')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product is already synced to Meta
    if (product.meta_product_id) {
      console.log('✅ Product already synced to Meta:', product.meta_product_id)
      return NextResponse.json({
        success: true,
        synced: true,
        alreadySynced: true,
        message: 'Product already synced to Meta Commerce',
        metaHandle: product.meta_product_id
      })
    }

    const organizationId = product.organization_id

    // Check if WABA is connected for this organization
    const { data: whatsappAccount, error: wabaError } = await supabase
      .from('whatsapp_business_accounts')
      .select('waba_id, catalog_id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .maybeSingle()

    if (wabaError || !whatsappAccount) {
      console.log('⚠️ No WABA connected for this organization - skipping Meta sync')
      return NextResponse.json({
        success: true,
        synced: false,
        message: 'Product created in Chayo database. WhatsApp not connected - Meta sync skipped.'
      })
    }

    // Check if catalog_id exists, if not, try to create or get one
    let catalogId = whatsappAccount.catalog_id

    if (!catalogId) {
      console.log('📦 No catalog found - attempting to create or fetch existing catalog')
      
      // Try to get existing catalogs first
      const catalogsResponse = await fetch(
        `${request.nextUrl.origin}/api/whatsapp/catalogs?organizationId=${organizationId}`,
        {
          headers: {
            'Cookie': request.headers.get('cookie') || ''
          }
        }
      )

      if (catalogsResponse.ok) {
        const catalogsData = await catalogsResponse.json()
        
        if (catalogsData.catalogs && catalogsData.catalogs.length > 0) {
          // Use first existing catalog
          catalogId = catalogsData.catalogs[0].id
          console.log(`✅ Found existing catalog: ${catalogId}`)
          
          // Update WABA with catalog_id
          await supabase
            .from('whatsapp_business_accounts')
            .update({ catalog_id: catalogId })
            .eq('organization_id', organizationId)
        } else {
          // No catalogs exist - create one
          console.log('📦 No existing catalogs - creating new catalog')
          
          const createResponse = await fetch(
            `${request.nextUrl.origin}/api/whatsapp/catalogs`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || ''
              },
              body: JSON.stringify({
                organizationId,
                catalogName: `${product.organizations?.name || 'Chayo'} Products`
              })
            }
          )

          if (createResponse.ok) {
            const createData = await createResponse.json()
            catalogId = createData.catalogId
            console.log(`✅ Created new catalog: ${catalogId}`)
          } else {
            const error = await createResponse.json()
            console.error('❌ Failed to create catalog:', error)
            return NextResponse.json({
              success: true,
              synced: false,
              message: 'Product created. Failed to create Meta catalog automatically.',
              error: error.error
            })
          }
        }
      }
    }

    if (!catalogId) {
      console.warn('⚠️ Could not get or create catalog_id')
      return NextResponse.json({
        success: true,
        synced: false,
        message: 'Product created. Catalog setup required in Commerce Manager.'
      })
    }

    if (!SYSTEM_USER_TOKEN) {
      return NextResponse.json({
        error: 'System user token not configured'
      }, { status: 500 })
    }

    // Build Meta Commerce product data
    const metaProductData = await buildMetaProductData(product, supabase)

    console.log('📤 Syncing product to Meta Commerce:', {
      productId: product.id,
      catalogId: catalogId,
      retailerId: metaProductData.retailer_id
    })

    // Sync to Meta Commerce via items_batch endpoint
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${catalogId}/items_batch`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SYSTEM_USER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_type: 'PRODUCT_ITEM',
          items: [
            {
              method: 'CREATE',
              retailer_id: metaProductData.retailer_id,
              data: metaProductData.data
            }
          ]
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Failed to sync product to Meta:', error)
      
      // Don't fail the whole request - product is still created in Chayo
      return NextResponse.json({
        success: true,
        synced: false,
        message: 'Product created in Chayo database. Meta sync failed.',
        metaError: error.error?.message
      })
    }

    const data = await response.json()
    console.log('✅ Product synced to Meta Commerce:', data)

    // Update product with Meta product ID
    if (data.handles && data.handles[0]) {
      await supabase
        .from('products_list_tool')
        .update({ 
          meta_product_id: data.handles[0],
          synced_to_meta_at: new Date().toISOString()
        })
        .eq('id', productId)
    }

    return NextResponse.json({
      success: true,
      synced: true,
      message: 'Product created and synced to Meta Commerce',
      metaHandle: data.handles?.[0]
    })

  } catch (error) {
    console.error('❌ Error syncing product to Meta:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to sync product',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Build Meta Commerce product data from Chayo product
 * Maps our fields to Meta's required fields with smart defaults
 */
async function buildMetaProductData(product: any, supabase: any) {
  // Use product ID as retailer_id (SKU)
  const retailerId = `chayo_${product.id}`

  // Get or create shareable link for product
  let productDeepLink
  try {
    const { data: fullUrl, error } = await supabase.rpc('upsert_shareable_link', {
      p_organization_id: product.organization_id,
      p_content_type: 'product',
      p_content_id: product.id,
      p_content_name: product.name
    })

    if (error) {
      console.error('Failed to generate shareable link:', error)
      // Fallback to manual OneLink generation
      const organizationSlug = product.organizations?.slug || product.organization_id
      productDeepLink = `https://chayo.onelink.me/SB63?deep_link_value=${organizationSlug}&deep_link_sub1=products`
    } else {
      productDeepLink = fullUrl
    }
  } catch (error) {
    console.error('Error calling upsert_shareable_link:', error)
    // Fallback to manual OneLink generation
    const organizationSlug = product.organizations?.slug || product.organization_id
    productDeepLink = `https://chayo.onelink.me/SB63?deep_link_value=${organizationSlug}&deep_link_sub1=products`
  }

  // Build required Meta Commerce fields
  const data: any = {
    // Required fields (using smart defaults for missing data)
    name: product.name,
    description: product.description || product.name,
    price: formatPrice(product.price || 1, 'USD'), // Default to $1.00 minimum (Meta might reject $0)
    availability: 'in stock', // Always in stock (no inventory tracking yet)
    condition: 'new', // All products are new
    url: productDeepLink, // Shareable OneLink generated by database function
    image_url: product.image_url || 'https://placehold.co/600x400/purple/white?text=Producto', // Placeholder if no image
    brand: product.organizations?.name || 'Chayo' // Organization name as brand
  }

  return {
    retailer_id: retailerId,
    data
  }
}

/**
 * Format price for Meta Commerce API
 * Format: "9.99 USD" (number, space, ISO 4217 currency code)
 */
function formatPrice(price: string | number, currency: string): string {
  // Convert to number and format with 2 decimals
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price
  const formattedPrice = numericPrice.toFixed(2)
  
  // Return in Meta format: "9.99 USD"
  return `${formattedPrice} ${currency.toUpperCase()}`
}

