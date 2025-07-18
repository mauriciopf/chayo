import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const createClient = (request: NextRequest) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check for Authorization header
  const authHeader = request.headers.get('authorization')
  const accessToken = authHeader?.replace('Bearer ', '')

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
        },
      },
      global: {
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` })
        }
      }
    }
  )

  return { supabase, response }
}

export async function getUserOrganization(supabase: any, userId: string) {
  // Try to find an active team membership for this user
  const { data: membership, error: membershipError } = await supabase
    .from('team_members')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (!membership || membershipError) return null

  // Fetch the organization row
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', membership.organization_id)
    .single()

  if (!org || orgError) return null
  return org
}
