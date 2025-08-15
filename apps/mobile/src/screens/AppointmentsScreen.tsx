import React from 'react';
import { WebViewScreen } from '../components/WebViewScreen';
import { useAppConfig } from '../hooks/useAppConfig';

export const AppointmentsScreen: React.FC = () => {
  const { config, urlGenerator } = useAppConfig();

  if (!config || !urlGenerator) {
    return null; // Or loading component
  }

  const appointmentsUrl = urlGenerator.getMobileOptimizedUrl(
    urlGenerator.getToolUrl('appointments')
  );

  return (
    <WebViewScreen
      url={appointmentsUrl}
      title="Book Appointment"
    />
  );
};