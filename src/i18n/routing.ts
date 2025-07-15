import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'es'],
 
  // Used when no locale matches
  defaultLocale: 'en',
  
  // The prefix for the locale in the URL
  localePrefix: 'always',
  
  // Enable automatic locale detection
  localeDetection: true
});
