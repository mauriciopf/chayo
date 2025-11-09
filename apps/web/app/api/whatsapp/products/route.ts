import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

const SYSTEM_USER_TOKEN = process.env.FACEBOOK_SYSTEM_USER_TOKEN

/**
 * GET /api/whatsapp/products
 * Fetch all products from Meta Commerce catalog and sync to Chayo
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    // Get WABA details
    const { data: whatsappAccount, error: wabaError } = await supabase
      .from('whatsapp_business_accounts')
      .select('waba_id, catalog_id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .maybeSingle()

    if (wabaError || !whatsappAccount) {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 404 })
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
                catalogName: 'Chayo Products'
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
              error: 'Failed to create Meta catalog automatically. Please create one in Commerce Manager.',
              details: error.error
            }, { status: 500 })
          }
        }
      }
    }

    if (!catalogId) {
      console.warn('⚠️ Could not get or create catalog_id')
      return NextResponse.json({ 
        error: 'No catalog configured. Please create one in Meta Commerce Manager.' 
      }, { status: 404 })
    }

    if (!SYSTEM_USER_TOKEN) {
      return NextResponse.json({ error: 'System user token not configured' }, { status: 500 })
    }

    console.log('📦 Fetching products from Meta catalog:', catalogId)

    // Fetch products from Meta Commerce catalog
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${catalogId}/products?fields=id,retailer_id,name,description,price,availability,image_url,url&limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${SYSTEM_USER_TOKEN}`
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Failed to fetch Meta products:', error)
      return NextResponse.json(
        { error: error.error?.message || 'Failed to fetch products from Meta' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const metaProducts = data.data || []

    console.log(`📊 Found ${metaProducts.length} products in Meta catalog`)

    // Get existing Chayo products to avoid duplicates
    const { data: existingProducts } = await supabase
      .from('products_list_tool')
      .select('id, meta_product_id, name')
      .eq('organization_id', organizationId)

    const existingMetaIds = new Set(
      (existingProducts || [])
        .filter(p => p.meta_product_id)
        .map(p => p.meta_product_id)
    )

    // Import products that don't exist in Chayo yet
    const productsToImport = metaProducts.filter((mp: any) => 
      !existingMetaIds.has(mp.id)
    )

    console.log(`📥 Importing ${productsToImport.length} new products from Meta`)

    const importedProducts = []
    const importErrors = []

    for (const metaProduct of productsToImport) {
      try {
        // Parse price (format: "9.99 USD" -> 9.99)
        const priceMatch = metaProduct.price?.match(/^([\d.]+)\s+/)
        const price = priceMatch ? parseFloat(priceMatch[1]) : null

        const productData = {
          organization_id: organizationId,
          name: metaProduct.name,
          description: metaProduct.description || null,
          image_url: metaProduct.image_url || null,
          price: price,
          meta_product_id: metaProduct.id,
          synced_to_meta_at: new Date().toISOString()
        }

        const { data: imported, error: importError } = await supabase
          .from('products_list_tool')
          .insert(productData)
          .select()
          .single()

        if (importError) {
          console.error(`❌ Failed to import product ${metaProduct.name}:`, importError)
          importErrors.push({
            name: metaProduct.name,
            error: importError.message
          })
        } else {
          console.log(`✅ Imported product: ${metaProduct.name}`)
          importedProducts.push(imported)
        }
      } catch (error) {
        console.error(`❌ Error importing product ${metaProduct.name}:`, error)
        importErrors.push({
          name: metaProduct.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      totalMetaProducts: metaProducts.length,
      existingInChayo: existingMetaIds.size,
      imported: importedProducts.length,
      importedProducts,
      errors: importErrors.length > 0 ? importErrors : undefined
    })

  } catch (error) {
    console.error('❌ Error syncing Meta products:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync products' },
      { status: 500 }
    )
  }
}

