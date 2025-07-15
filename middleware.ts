import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {routing} from './src/i18n/routing';

// Create the internationalization middleware
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  try {
    // Skip middleware for auth callback to prevent interference
    if (request.nextUrl.pathname === '/auth/callback') {
      return NextResponse.next()
    }

    // Handle internationalization first - this is crucial for locale routing
    const intlResponse = intlMiddleware(request);
    
    // If intl middleware returns a response (redirect for missing locale), use it immediately
    if (intlResponse) {
      return intlResponse;
    }

    // Only proceed with auth checks if we have a valid locale in the path
    const pathname = request.nextUrl.pathname;
    const hasLocale = /^\/(en|es)/.test(pathname);
    
    if (!hasLocale) {
      // This shouldn't happen if intl middleware is working correctly,
      // but as a fallback, redirect to default locale
      return NextResponse.redirect(new URL(`/en${pathname}`, request.url));
    }

    // Create a Supabase client configured to use cookies
    const { supabase, response } = createClient(request)

    // Refresh session if expired - required for Server Components
    const { data: { user } } = await supabase.auth.getUser()

    // Extract path without locale for route checking
    const pathWithoutLocale = pathname.replace(/^\/(en|es)/, '') || '/'

    // Protect dashboard routes (locale-aware)
    if (pathWithoutLocale.startsWith('/dashboard')) {
      if (!user) {
        const locale = pathname.match(/^\/(en|es)/)?.[1] || 'en';
        return NextResponse.redirect(new URL(`/${locale}/auth`, request.url))
      }
    }

    // Redirect authenticated users away from auth pages
    if (pathWithoutLocale.startsWith('/auth') &&
        !pathWithoutLocale.startsWith('/auth/callback')) {
      if (user) {
        const locale = pathname.match(/^\/(en|es)/)?.[1] || 'en';
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
      }
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  // Match all pathnames except for
  // - api routes
  // - _next (internal Next.js files)
  // - static files (images, etc.)
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
