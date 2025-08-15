import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AppConfig, ConfigLoader, ToolUrlGenerator } from '@chayo/config';
import { UseAppConfigReturn } from '../hooks/useAppConfig';

// Configuration constants
const CONFIG = {
  WEB_BASE_URL: __DEV__ 
    ? 'http://localhost:3000' 
    : 'https://chayo-ai-site.vercel.app',
  API_BASE_URL: __DEV__ 
    ? 'http://localhost:3000' 
    : 'https://chayo-ai-site.vercel.app',
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load configuration';
      setError(errorMessage);
      console.error('Config loading error:', err);
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