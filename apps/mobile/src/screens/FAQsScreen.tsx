import React from 'react';
import { WebViewScreen } from '../components/WebViewScreen';
import { useAppConfig } from '../hooks/useAppConfig';

export const FAQsScreen: React.FC = () => {
  const { config, urlGenerator } = useAppConfig();

  if (!config || !urlGenerator) {
    return null; // Or loading component
  }

  const faqsUrl = urlGenerator.getMobileOptimizedUrl(
    urlGenerator.getToolUrl('faqs')
  );

  return (
    <WebViewScreen
      url={faqsUrl}
      title="Help & FAQs"
    />
  );
};