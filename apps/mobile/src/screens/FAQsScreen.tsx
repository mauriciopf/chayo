import React from 'react';
import { MobileFAQs } from '../components';
import { useAppConfig } from '../hooks/useAppConfig';

export const FAQsScreen: React.FC = () => {
  const { config } = useAppConfig();

  if (!config) {
    return null; // Or loading component
  }

  return (
    <MobileFAQs
      organizationSlug={config.organizationSlug || ''}
      businessName={config.organizationName || 'Our Business'}
      baseUrl={config.baseUrl}
    />
  );
};