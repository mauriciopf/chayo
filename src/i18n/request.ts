import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !['en', 'es'].includes(locale)) {
    // Default to 'en' if locale is undefined or invalid
    locale = 'en';
  }

  return {
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
