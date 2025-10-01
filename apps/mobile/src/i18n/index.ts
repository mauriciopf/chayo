import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

// Import translation files
import es from './locales/es.json';

// Get device locale with fallback
const getDeviceLocale = (): string => {
  try {
    const locales = RNLocalize.getLocales();

    if (locales && locales.length > 0) {
      // Check each locale in order of preference
      for (const locale of locales) {
        const languageCode = locale.languageCode.toLowerCase();

        // If Spanish is found in any of the user's preferred languages, use Spanish
        if (languageCode === 'es') {
          console.log('🌍 Device locale detected: Spanish');
          return 'es';
        }
      }

      // Default to Spanish when no explicit match is found
      console.log('🌍 Device locale detected but defaulting to Spanish');
      return 'es';
    }
  } catch (error) {
    console.warn('Failed to detect device locale:', error);
  }

  // Fallback to Spanish if no locale detected or error occurred
  console.log('🌍 Using fallback locale: Spanish');
  return 'es';
};

const resources = {
  es: {
    translation: es,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLocale(),
    fallbackLng: 'es',

    // Debug mode - set to false in production
    debug: __DEV__,

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // React i18next options
    react: {
      useSuspense: false, // Disable suspense for React Native
    },

    // Additional options for better mobile experience
    returnEmptyString: false,
    returnNull: false,
  });

export default i18n;
