import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AppConfig, ConfigLoader, ToolUrlGenerator } from '@chayo/config';
import { UseAppConfigReturn } from '../hooks/useAppConfig';

// Configuration constants
const CONFIG = {
  WEB_BASE_URL: 'https://chayo.vercel.app',
  API_BASE_URL: 'https://chayo.vercel.app',
};

export const AppConfigContext = createContext<UseAppConfigReturn | null>(null);

interface AppConfigProviderProps {
  children: ReactNode;
  organizationSlug?: string;
  userEmail?: string;
}

export const AppConfigProvider: React.FC<AppConfigProviderProps> = ({
  children,
  organizationSlug,
  userEmail,
}) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [urlGenerator, setUrlGenerator] = useState<ToolUrlGenerator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const configLoader = new ConfigLoader({
    webBaseUrl: CONFIG.WEB_BASE_URL,
    apiBaseUrl: CONFIG.API_BASE_URL,
  });

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      let loadedConfig: AppConfig;

      if (organizationSlug) {
        // Load by organization slug (QR code flow)
        loadedConfig = await configLoader.loadConfigBySlug(organizationSlug);
      } else if (userEmail) {
        // Load by email (login flow)
        loadedConfig = await configLoader.loadConfigByEmail(userEmail);
      } else {
        throw new Error('Either organizationSlug or userEmail must be provided');
      }

      setConfig(loadedConfig);
      
      // Create URL generator
      const generator = configLoader.createUrlGenerator(loadedConfig.organizationSlug);
      setUrlGenerator(generator);

    } catch (err) {
      console.warn('Config loading failed, using fallback config:', err);
      
      // Provide a fallback config for development
      const fallbackConfig: AppConfig = {
        organizationSlug: organizationSlug || 'demo-business',
        organizationId: 'demo-org-id',
        businessName: 'Demo Business',
        appName: 'Chayo AI',
        theme: {
          primaryColor: '#007AFF',
          secondaryColor: '#5856D6',
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
          logoUrl: 'https://via.placeholder.com/150x50/007AFF/FFFFFF?text=Chayo',
        },
        enabledTools: ['appointments', 'payments', 'documents', 'faqs'],
        webBaseUrl: CONFIG.WEB_BASE_URL,
        apiBaseUrl: CONFIG.API_BASE_URL,
      };
      
      setConfig(fallbackConfig);
      
      // Create URL generator with fallback config
      const generator = configLoader.createUrlGenerator(fallbackConfig.organizationSlug);
      setUrlGenerator(generator);
      
      // Don't set error in development, just warn
      if (!__DEV__) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load configuration';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await loadConfig();
  };

  useEffect(() => {
    if (organizationSlug || userEmail) {
      loadConfig();
    }
  }, [organizationSlug, userEmail]);

  const value: UseAppConfigReturn = {
    config,
    urlGenerator,
    loading,
    error,
    refetch,
  };

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
};