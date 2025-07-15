import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {routing} from './src/i18n/routing';

// First handle internationalization
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  try {
    // Skip middleware for auth callback to prevent interference
    if (request.nextUrl.pathname === '/auth/callback') {
      return NextResponse.next()
    }

    // Handle internationalization first
    const intlResponse = intlMiddleware(request);
    if (intlResponse) {
      return intlResponse;
    }

    // Create a Supabase client configured to use cookies
    const { supabase, response } = createClient(request)

    // Refresh session if expired - required for Server Components
    const { data: { user } } = await supabase.auth.getUser()

    // Protect dashboard routes (locale-aware)
    const pathWithoutLocale = request.nextUrl.pathname.replace(/^\/(en|es)/, '') || '/'
    if (pathWithoutLocale.startsWith('/dashboard')) {
      if (!user) {
        const locale = request.nextUrl.pathname.split('/')[1] || 'en'
        const redirectUrl = new URL(`/${locale}/auth`, request.url)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Redirect authenticated users away from auth pages (but not callback)
    if (pathWithoutLocale.startsWith('/auth') && 
        !request.nextUrl.pathname.includes('/callback')) {
      if (user) {
        const locale = request.nextUrl.pathname.split('/')[1] || 'en'
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
      }
    }

    return response
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    console.error('Middleware error:', e)
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
