import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppConfig, ConfigLoader } from '../lib/config';
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


  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let loadedConfig: AppConfig | null;

      if (organizationId) {
        // Load by organization ID (most common - from stored data)
        loadedConfig = await ConfigLoader.loadConfig(organizationId);
      } else {
        throw new Error('Either organizationId, organizationSlug, or userEmail must be provided');
      }

      setConfig(loadedConfig);

      // Create URL generator removed

    } catch (err) {
      console.error('Config loading failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load configuration';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [organizationId, organizationSlug, userEmail]);

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
