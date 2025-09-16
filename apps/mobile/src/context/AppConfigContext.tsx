import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppConfig, ConfigLoader, ToolUrlGenerator } from '../lib/config';
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
  organizationId?: string;
  userEmail?: string;
}

export const AppConfigProvider: React.FC<AppConfigProviderProps> = ({
  children,
  organizationSlug,
  organizationId,
  userEmail,
}) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [urlGenerator, setUrlGenerator] = useState<ToolUrlGenerator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const configLoader = React.useMemo(() => new ConfigLoader({
    webBaseUrl: CONFIG.WEB_BASE_URL,
    apiBaseUrl: CONFIG.API_BASE_URL,
  }), []);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let loadedConfig: AppConfig;

      if (organizationId) {
        // Load by organization ID (most common - from stored data)
        loadedConfig = await configLoader.loadConfigById(organizationId);
      } else if (organizationSlug) {
        // Load by organization slug (QR code flow)
        loadedConfig = await configLoader.loadConfigBySlug(organizationSlug);
      } else if (userEmail) {
        // Load by email (login flow)
        loadedConfig = await configLoader.loadConfigByEmail(userEmail);
      } else {
        throw new Error('Either organizationId, organizationSlug, or userEmail must be provided');
      }

      setConfig(loadedConfig);

      // Create URL generator
      const generator = configLoader.createUrlGenerator(loadedConfig.organizationSlug);
      setUrlGenerator(generator);

    } catch (err) {
      console.error('Config loading failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load configuration';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [organizationId, organizationSlug, userEmail, configLoader]);

  const refetch = async () => {
    await loadConfig();
  };

  useEffect(() => {
    if (organizationId || organizationSlug || userEmail) {
      loadConfig();
    }
  }, [organizationId, organizationSlug, userEmail, loadConfig]);

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
