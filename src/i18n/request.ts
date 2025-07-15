import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !['en', 'es'].includes(locale)) {
    throw new Error(`Invalid locale: ${locale}`);
  }

  return {
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
