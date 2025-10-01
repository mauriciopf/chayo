import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppConfig, ConfigLoader } from '../lib/config';
import { UseAppConfigReturn } from '../hooks/useAppConfig';

export const AppConfigContext = createContext<UseAppConfigReturn | null>(null);

interface AppConfigProviderProps {
  children: ReactNode;
  organizationId: string;
  organizationSlug: string;
}

export const AppConfigProvider: React.FC<AppConfigProviderProps> = ({
  children,
  organizationSlug,
  organizationId: _organizationId,
}) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [urlGenerator, _setUrlGenerator] = useState<ToolUrlGenerator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the public API with organization slug (no authentication required)
      console.log('Loading config for business:', organizationSlug);
      const loadedConfig = await ConfigLoader.loadConfigBySlug(organizationSlug);

      if (!loadedConfig) {
        throw new Error('Failed to load business configuration');
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
  }, [organizationSlug]);

  const refetch = async () => {
    await loadConfig();
  };

  useEffect(() => {
    if (organizationSlug) {
      loadConfig();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationSlug]);

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
