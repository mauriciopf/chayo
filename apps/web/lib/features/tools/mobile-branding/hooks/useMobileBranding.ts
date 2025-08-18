'use client';

import { useState, useEffect } from 'react';
import { ThemeConfig, ThemeConfigSchema } from '@/lib/shared/types/configTypes';
import { useUser } from '@/lib/shared/hooks/useUser';

const DEFAULT_CONFIG: ThemeConfig = {
  primaryColor: '#007AFF',
  secondaryColor: '#5856D6', 
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
  logoUrl: undefined,
};

export function useMobileBranding(organizationId?: string) {
  const { user } = useUser();
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const effectiveOrgId = organizationId || user?.organizationId;

  // Load current configuration
  useEffect(() => {
    loadConfig();
  }, [effectiveOrgId]);

  const loadConfig = async () => {
    if (!effectiveOrgId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${effectiveOrgId}/mobile-config`);
      if (response.ok) {
        const data = await response.json();
        const validatedConfig = ThemeConfigSchema.parse(data);
        setConfig(validatedConfig);
      } else {
        // Use default config if none exists
        setConfig(DEFAULT_CONFIG);
      }
    } catch (error) {
      console.error('Error loading mobile branding config:', error);
      setConfig(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: ThemeConfig) => {
    if (!effectiveOrgId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/organizations/${effectiveOrgId}/mobile-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });

      if (response.ok) {
        const savedConfig = await response.json();
        setConfig(savedConfig);
        return savedConfig;
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving mobile branding config:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (updates: Partial<ThemeConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const resetToDefaults = async () => {
    await saveConfig(DEFAULT_CONFIG);
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!user?.organizationId) return null;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(`/api/organizations/${effectiveOrgId}/mobile-config/logo`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { logoUrl } = await response.json();
        return logoUrl;
      } else {
        throw new Error('Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      return null;
    } finally {
      setSaving(false);
    }
  };

  return {
    config,
    loading,
    saving,
    updateConfig,
    saveConfig,
    resetToDefaults,
    uploadLogo,
    loadConfig,
  };
}