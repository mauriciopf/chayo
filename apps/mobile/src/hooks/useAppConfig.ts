import { useState, useEffect, useContext } from 'react';
import { AppConfig, ConfigLoader, ToolUrlGenerator } from '../lib/config';
import { AppConfigContext } from '../context/AppConfigContext';

export interface UseAppConfigReturn {
  config: AppConfig | null;
  urlGenerator: ToolUrlGenerator | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to access app configuration
 */
export const useAppConfig = (): UseAppConfigReturn => {
  const context = useContext(AppConfigContext);
  
  if (!context) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }

  return context;
};