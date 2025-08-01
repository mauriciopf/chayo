import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// GET - Get specific payment provider
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; providerId: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const { id: organizationId, providerId } = params

    // Get the current user and verify access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get the specific payment provider
    const { data: provider, error: providerError } = await supabase
      .from('payment_providers')
      .select('*')
      .eq('id', providerId)
      .eq('organization_id', organizationId)
      .single()

    if (providerError || !provider) {
      return NextResponse.json({ error: 'Payment provider not found' }, { status: 404 })
    }

    return NextResponse.json({ provider })
  } catch (error) {
    console.error('Error in payment provider GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update payment provider settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; providerId: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const { id: organizationId, providerId } = params

    // Get the current user and verify access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get current provider to verify it exists
    const { data: currentProvider, error: getCurrentError } = await supabase
      .from('payment_providers')
      .select('*')
      .eq('id', providerId)
      .eq('organization_id', organizationId)
      .single()

    if (getCurrentError || !currentProvider) {
      return NextResponse.json({ error: 'Payment provider not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      paymentType,
      priceId,
      serviceName,
      serviceAmount,
      serviceCurrency,
      serviceType,
      recurringInterval,
      is_default,
      is_active
    } = body

    // Prepare update data
    const updateData: any = {}

    if (paymentType) {
      updateData.payment_type = paymentType
    }

    if (priceId !== undefined) {
      updateData.price_id = priceId || null
    }

    if (serviceName !== undefined) {
      updateData.service_name = serviceName || null
    }

    if (serviceAmount !== undefined) {
      updateData.service_amount = serviceAmount || null
    }

    if (serviceCurrency) {
      updateData.service_currency = serviceCurrency
    }

    if (serviceType) {
      updateData.service_type = serviceType
    }

    if (recurringInterval !== undefined) {
      updateData.recurring_interval = recurringInterval || null
    }

    if (is_default !== undefined) {
      updateData.is_default = is_default
    }

    if (is_active !== undefined) {
      updateData.is_active = is_active
    }

    // If setting as default, ensure no other provider is default
    if (is_default === true) {
      await supabase
        .from('payment_providers')
        .update({ is_default: false })
        .eq('organization_id', organizationId)
        .neq('id', providerId)
    }

    // Update the payment provider
    const { data: updatedProvider, error: updateError } = await supabase
      .from('payment_providers')
      .update(updateData)
      .eq('id', providerId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating payment provider:', updateError)
      return NextResponse.json({ error: 'Failed to update payment provider' }, { status: 500 })
    }

    return NextResponse.json({ provider: updatedProvider })
  } catch (error) {
    console.error('Error in payment provider PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove payment provider
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; providerId: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const { id: organizationId, providerId } = params

    // Get the current user and verify access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get current provider to verify it exists
    const { data: currentProvider, error: getCurrentError } = await supabase
      .from('payment_providers')
      .select('*')
      .eq('id', providerId)
      .eq('organization_id', organizationId)
      .single()

    if (getCurrentError || !currentProvider) {
      return NextResponse.json({ error: 'Payment provider not found' }, { status: 404 })
    }

    // Check if there are any active payment transactions using this provider
    const { data: activeTransactions, error: transactionsError } = await supabase
      .from('payment_transactions')
      .select('id')
      .eq('payment_provider_id', providerId)
      .eq('status', 'pending')

    if (transactionsError) {
      console.error('Error checking active transactions:', transactionsError)
      return NextResponse.json({ error: 'Failed to check active transactions' }, { status: 500 })
    }

    if (activeTransactions && activeTransactions.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete payment provider with active transactions' 
      }, { status: 400 })
    }

    // Delete the payment provider
    const { error: deleteError } = await supabase
      .from('payment_providers')
      .delete()
      .eq('id', providerId)
      .eq('organization_id', organizationId)

    if (deleteError) {
      console.error('Error deleting payment provider:', deleteError)
      return NextResponse.json({ error: 'Failed to delete payment provider' }, { status: 500 })
    }

    // If this was the default provider, set another active provider as default
    if (currentProvider.is_default) {
      const { data: remainingProviders } = await supabase
        .from('payment_providers')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .limit(1)

      if (remainingProviders && remainingProviders.length > 0) {
        await supabase
          .from('payment_providers')
          .update({ is_default: true })
          .eq('id', remainingProviders[0].id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in payment provider DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}