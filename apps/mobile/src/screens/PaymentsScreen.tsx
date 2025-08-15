import React from 'react';
import { WebViewScreen } from '../components/WebViewScreen';
import { useAppConfig } from '../hooks/useAppConfig';

export const PaymentsScreen: React.FC = () => {
  const { config, urlGenerator } = useAppConfig();

  if (!config || !urlGenerator) {
    return null; // Or loading component
  }

  const paymentsUrl = urlGenerator.getMobileOptimizedUrl(
    urlGenerator.getToolUrl('payments')
  );

  return (
    <WebViewScreen
      url={paymentsUrl}
      title="Payments"
    />
  );
};