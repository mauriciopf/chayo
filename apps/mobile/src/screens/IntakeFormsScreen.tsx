import React from 'react';
import { MobileIntakeForms } from '../components/MobileIntakeForms';
import { useAppConfig } from '../hooks/useAppConfig';
import { useTranslation } from '../hooks/useTranslation';

export const IntakeFormsScreen: React.FC = () => {
  const { config } = useAppConfig();
  const { t } = useTranslation();

  if (!config) {
    return null; // Or loading component
  }

  return (
    <MobileIntakeForms
      organizationSlug={config.organizationSlug || ''}
    />
  );
};
