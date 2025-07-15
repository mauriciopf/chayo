import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'es'],
  
  // Used when no locale matches
  defaultLocale: 'en',
  
  // The prefix for the locale in the URL
  localePrefix: 'always',
  
  // Enable automatic locale detection
  localeDetection: true
});

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
