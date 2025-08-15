import React from 'react';
import { WebViewScreen } from '../components/WebViewScreen';
import { useAppConfig } from '../hooks/useAppConfig';

export const DocumentsScreen: React.FC = () => {
  const { config, urlGenerator } = useAppConfig();

  if (!config || !urlGenerator) {
    return null; // Or loading component
  }

  const documentsUrl = urlGenerator.getMobileOptimizedUrl(
    urlGenerator.getToolUrl('documents')
  );

  return (
    <WebViewScreen
      url={documentsUrl}
      title="Documents & Forms"
    />
  );
};