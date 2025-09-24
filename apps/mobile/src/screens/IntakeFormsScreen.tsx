import React from 'react';
import { MobileIntakeForms } from '../components/MobileIntakeForms';
import { useAppConfig } from '../hooks/useAppConfig';

interface IntakeFormsScreenProps {
  navigation: any;
}

export const IntakeFormsScreen: React.FC<IntakeFormsScreenProps> = ({ navigation }) => {
  const { config } = useAppConfig();

  if (!config) {
    return null; // Or loading component
  }

  return (
    <MobileIntakeForms
      organizationSlug={config.organizationSlug || ''}
      navigation={navigation}
    />
  );
};
