import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    let query = supabase
      .from('products_list_tool')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: products, error, count } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      name,
      description,
      imageUrl,
      price,
      paymentTransactionId,
      supportsReservations
    } = body

    if (!organizationId || !name) {
      return NextResponse.json(
        { error: 'Organization ID and name are required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    const { data: product, error } = await supabase
      .from('products_list_tool')
      .insert({
        organization_id: organizationId,
        name,
        description,
        image_url: imageUrl,
        price,
        payment_transaction_id: paymentTransactionId,
        supports_reservations: supportsReservations || false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ product })

  } catch (error) {
    console.error('Products POST API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}