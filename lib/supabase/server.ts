import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function getSupabaseServerClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {cookies: cookies()} // ✅ only evaluated when function is called inside request scope
  )
}