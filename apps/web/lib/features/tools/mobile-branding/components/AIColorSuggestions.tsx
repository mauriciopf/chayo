'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Check, Loader2 } from 'lucide-react';
import { ThemeConfig } from '@/lib/shared/types/configTypes';
import { ColorHarmonyService, ColorHarmonySuggestion } from '../services/colorHarmonyService';

interface AIColorSuggestionsProps {
  currentColors: ThemeConfig;
  onApplySuggestion: (colors: Partial<ThemeConfig>) => void;
  onToggleManualMode: () => void;
  onSuggestionChange?: (colors: Partial<ThemeConfig>) => void;
  className?: string;
}

export function AIColorSuggestions({ 
  currentColors, 
  onApplySuggestion, 
  onToggleManualMode,
  onSuggestionChange,
  className = '' 
}: AIColorSuggestionsProps) {
  const t = useTranslations('mobile-branding');
  const [suggestion, setSuggestion] = useState<ColorHarmonySuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Generate initial suggestions
  useEffect(() => {
    generateSuggestions();
  }, []);

  // Reset applied state when colors change
  useEffect(() => {
    setApplied(false);
  }, [currentColors]);

  const generateSuggestions = async (changedField?: keyof ThemeConfig) => {
    setLoading(true);
    setHasError(false);
    try {
      const newSuggestion = await ColorHarmonyService.getSuggestions({
        currentColors,
        changedField,
      });
      setSuggestion(newSuggestion);
      
      // Notify parent component about the new suggestion for preview
      if (onSuggestionChange) {
        onSuggestionChange({
          primaryColor: newSuggestion.primaryColor,
          secondaryColor: newSuggestion.secondaryColor,
          backgroundColor: newSuggestion.backgroundColor,
          textColor: newSuggestion.textColor,
        });
      }
    } catch (error) {
      console.error('Failed to generate color suggestions:', error);
      setHasError(true);
      setSuggestion(null);
      // Clear the preview when there's an error
      if (onSuggestionChange) {
        onSuggestionChange({});
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = () => {
    if (!suggestion) return;

    onApplySuggestion({
      primaryColor: suggestion.primaryColor,
      secondaryColor: suggestion.secondaryColor,
      backgroundColor: suggestion.backgroundColor,
      textColor: suggestion.textColor,
    });
    
    setApplied(true);
    
    // Reset applied state after 2 seconds
    setTimeout(() => setApplied(false), 2000);
  };

  const handleRefresh = () => {
    generateSuggestions();
  };

  // Don't render the component if there's an error and no suggestion
  if (hasError && !suggestion && !loading) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              AI Color Harmony
            </h3>
            <p className="text-sm text-gray-600">
              Smart suggestions based on color theory
            </p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 rounded-lg border transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
          onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
        >
          <RefreshCw className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-8"
          >
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">{t('ai.generating')}</span>
          </motion.div>
        ) : suggestion ? (
          <motion.div
            key="suggestion"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* AI Description */}
            <div className="rounded-lg p-4 border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', opacity: 0.9 }}>
              <p className="text-sm text-gray-700 leading-relaxed">
                {suggestion.description}
              </p>
            </div>

            {/* Color Palette Preview */}
            <div className="grid grid-cols-4 gap-3">
              <ColorPreview
                label="Primary"
                color={suggestion.primaryColor}
                description="Buttons & highlights"
              />
              <ColorPreview
                label="Secondary"
                color={suggestion.secondaryColor}
                description="Tab bars & accents"
              />
              <ColorPreview
                label="Background"
                color={suggestion.backgroundColor}
                description="Main background"
              />
              <ColorPreview
                label="Text"
                color={suggestion.textColor}
                description="Text content"
                textColor={suggestion.backgroundColor} // Show text on background
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApplySuggestion}
                disabled={applied}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  applied
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {applied ? (
                  <>
                    <Check className="h-4 w-4" />
{t('ai.applied')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
{t('ai.apply')}
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onToggleManualMode}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium border transition-colors"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
              >
{t('ai.manualMode')}
              </motion.button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

interface ColorPreviewProps {
  label: string;
  color: string;
  description: string;
  textColor?: string;
}

function ColorPreview({ label, color, description, textColor }: ColorPreviewProps) {
  return (
    <div className="text-center">
      <div 
        className="w-full h-16 rounded-lg border border-gray-200 mb-2 flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        {textColor && (
          <span 
            className="text-sm font-medium"
            style={{ color: textColor }}
          >
            Aa
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 uppercase font-mono">{color}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
  );
}
