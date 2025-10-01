import React from 'react';
import { WebViewScreen } from '../components/WebViewScreen';
import { useAppConfig } from '../hooks/useAppConfig';
import { useTranslation } from '../hooks/useTranslation';

interface PaymentsScreenProps {
  navigation?: any;
}

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({ navigation: _navigation }) => {
  const { config, urlGenerator } = useAppConfig();
  const { t } = useTranslation();

  if (!config || !urlGenerator) {
    return null; // Or loading component
  }

  const paymentsUrl = urlGenerator.getMobileOptimizedUrl(
    urlGenerator.getToolUrl('payments')
  );

  return (
    <WebViewScreen
      url={paymentsUrl}
      title={t('payments.title')}
    />
  );
};
