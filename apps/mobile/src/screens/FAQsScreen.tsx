import React from 'react';
import { MobileFAQs } from '../components';
import { useAppConfig } from '../hooks/useAppConfig';
import { useTranslation } from '../hooks/useTranslation';

export const FAQsScreen: React.FC = () => {
  const { config } = useAppConfig();
  const { t } = useTranslation();

  if (!config) {
    return null; // Or loading component
  }

  return (
    <MobileFAQs
      organizationSlug={config.organizationSlug || ''}
      businessName={config.organizationName || t('common.businessName', { defaultValue: 'Our Business' })}
      baseUrl={config.baseUrl}
    />
  );
};