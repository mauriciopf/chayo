import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({locale}) => {
  // Ensure locale is always defined and valid
  const validLocale = locale && ['en', 'es'].includes(locale) ? locale : 'en';
  
  try {
    const messages = (await import(`./messages/${validLocale}.json`)).default;
    
    return {
      locale: validLocale,
      messages
    };
  } catch (error) {
    console.error(`Failed to load messages for locale ${validLocale}:`, error);
    // Fallback to English
    const fallbackMessages = (await import(`./messages/en.json`)).default;
    return {
      locale: 'en',
      messages: fallbackMessages
    };
  }
});
