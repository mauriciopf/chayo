import React, { useState, useEffect } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import { WebViewScreen } from '../components/WebViewScreen';
import { MobileAppointmentCalendar } from '../components';
import { useAppConfig } from '../hooks/useAppConfig';
import { useTranslation } from '../hooks/useTranslation';
import { appointmentService } from '../services';

export const AppointmentsScreen: React.FC = () => {
  const { config, urlGenerator } = useAppConfig();
  const { t } = useTranslation();
  const [useNativeCalendar, setUseNativeCalendar] = useState<boolean | null>(null);
  const [webViewUrl, setWebViewUrl] = useState<string>('');

  useEffect(() => {
    const determineCalendarType = async () => {
      if (!config?.organizationId) {
        setUseNativeCalendar(true); // Default to native
        return;
      }

      try {
        // Get appointment settings for this organization
        const settings = await appointmentService.getAppointmentSettings(config.organizationId);
        
        // Determine if we should use native calendar or WebView
        const shouldUseNative = appointmentService.shouldUseNativeCalendar(settings);
        setUseNativeCalendar(shouldUseNative);

        if (!shouldUseNative && settings && config.organizationSlug) {
          // Set WebView URL for external providers
          const url = appointmentService.getWebViewUrl(settings, config.organizationSlug);
          setWebViewUrl(url);
        }
      } catch (error) {
        console.error('Error determining calendar type:', error);
        // Fallback to native calendar on error
        setUseNativeCalendar(true);
      }
    };

    determineCalendarType();
  }, [config]);

  // Show loading while determining calendar type
  if (useNativeCalendar === null) {
    return <LoadingScreen />;
  }

  // Show native calendar for Chayo appointments
  if (useNativeCalendar) {
    return (
      <MobileAppointmentCalendar
        organizationId={config?.organizationId || ''}
        businessName={config?.organizationName || 'Our Business'}
        baseUrl={config?.baseUrl}
      />
    );
  }

  // Show WebView for external calendar providers
  const fallbackUrl = urlGenerator?.getMobileOptimizedUrl(
    urlGenerator.getToolUrl('appointments')
  ) || '';

  return (
    <WebViewScreen
      url={webViewUrl || fallbackUrl}
      title={t('appointments.title')}
    />
  );
};
