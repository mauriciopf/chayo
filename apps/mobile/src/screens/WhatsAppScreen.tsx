import React from 'react';
import { WebViewScreen } from '../components/WebViewScreen';
import { useAppConfig } from '../hooks/useAppConfig';

export const WhatsAppScreen: React.FC = () => {
  const { config, urlGenerator } = useAppConfig();

  if (!config || !urlGenerator) {
    return null; // Or loading component
  }

  const whatsappUrl = urlGenerator.getMobileOptimizedUrl(
    urlGenerator.getToolUrl('whatsapp')
  );

  return (
    <WebViewScreen
      url={whatsappUrl}
      title="WhatsApp Chat"
    />
  );
};