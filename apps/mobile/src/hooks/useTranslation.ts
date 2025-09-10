import { useTranslation as useI18nTranslation } from 'react-i18next';

// Re-export useTranslation with proper typing
export const useTranslation = (namespace?: string) => {
  return useI18nTranslation(namespace);
};

// Export the t function type for convenience
export type TFunction = ReturnType<typeof useI18nTranslation>['t'];
