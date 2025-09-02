'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Smartphone, Palette, Upload, Save } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { LogoUpload } from './LogoUpload';
import { MobilePreview } from './MobilePreview';
import { AIColorSuggestions } from './AIColorSuggestions';
import { useMobileBranding } from '../hooks/useMobileBranding';
import { ThemeConfig } from '@/lib/shared/types/configTypes';

interface MobileBrandingConfigProps {
  organizationId: string
  isEnabled: boolean
  onSettingsChange?: () => void
}

export function MobileBrandingConfig({ 
  organizationId, 
  isEnabled, 
  onSettingsChange 
}: MobileBrandingConfigProps) {
  const t = useTranslations('mobile-branding');
  const {
    config,
    loading,
    saving,
    updateConfig,
    saveConfig,
    uploadLogo
  } = useMobileBranding(organizationId);

  const [localConfig, setLocalConfig] = useState<ThemeConfig>(config);
  const [hasChanges, setHasChanges] = useState(false);
  const [showManualColors, setShowManualColors] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
  }, [config]);

  const handleConfigChange = (updates: Partial<ThemeConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const handleAISuggestionApply = async (updates: Partial<ThemeConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    // Auto-save when AI suggestions are applied
    await saveConfig(newConfig);
    setHasChanges(false);
  };

  const handleToggleManualMode = () => {
    setShowManualColors(true);
  };

  const handleSave = async () => {
    await saveConfig(localConfig);
    setHasChanges(false);
  };



  const handleLogoUpload = async (file: File) => {
    const logoUrl = await uploadLogo(file);
    if (logoUrl) {
      handleConfigChange({ logoUrl });
    }
  };

  if (!isEnabled) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-amber-800 text-sm">
          Enable the Mobile Branding tool above to customize your app's appearance.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Smartphone className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('title')}
            </h1>
            <p className="text-gray-600">
              {t('description')}
            </p>
          </div>
        </div>

        {/* Action Buttons - Only show save button in manual mode */}
        {showManualColors && (
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving ? t('saving') : t('save')}
            </motion.button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* AI Color Suggestions - Show by default */}
          {!showManualColors && (
            <AIColorSuggestions
              currentColors={localConfig}
              onApplySuggestion={handleAISuggestionApply}
              onToggleManualMode={handleToggleManualMode}
            />
          )}

          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Upload className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t('logo.title')}
              </h2>
            </div>
            <LogoUpload
              currentLogo={localConfig.logoUrl}
              onUpload={handleLogoUpload}
              uploading={saving}
            />
          </motion.div>

          {/* Manual Colors Section - Only show when requested */}
          {showManualColors && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t('colors.title')}
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowManualColors(false)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
{t('ai.backToAI')}
                </motion.button>
              </div>

              <div className="space-y-6">
                <ColorPicker
                  label={t('colors.primary')}
                  value={localConfig.primaryColor}
                  onChange={(color) => handleConfigChange({ primaryColor: color })}
                  description={t('colors.primaryDescription')}
                />

                <ColorPicker
                  label={t('colors.secondary')}
                  value={localConfig.secondaryColor}
                  onChange={(color) => handleConfigChange({ secondaryColor: color })}
                  description={t('colors.secondaryDescription')}
                />

                <ColorPicker
                  label={t('colors.background')}
                  value={localConfig.backgroundColor}
                  onChange={(color) => handleConfigChange({ backgroundColor: color })}
                  description={t('colors.backgroundDescription')}
                />

                <ColorPicker
                  label={t('colors.text')}
                  value={localConfig.textColor}
                  onChange={(color) => handleConfigChange({ textColor: color })}
                  description={t('colors.textDescription')}
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Mobile Preview */}
        <div className="lg:sticky lg:top-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <MobilePreview config={localConfig} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}