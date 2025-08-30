import React from 'react';
import { MobileIntakeForms } from '../components/MobileIntakeForms';
import { useAppConfig } from '../hooks/useAppConfig';

export const IntakeFormsScreen: React.FC = () => {
  const { config } = useAppConfig();

  if (!config) {
    return null; // Or loading component
  }

  return (
    <MobileIntakeForms
      organizationSlug={config.organizationSlug || ''}
    />
  );
};
