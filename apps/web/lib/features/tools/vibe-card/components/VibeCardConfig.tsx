'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Heart, Edit3, Sparkles, Save, RefreshCw } from 'lucide-react';
import { VibeCardPreview } from './VibeCardPreview';
import { VibeCardEditor } from './VibeCardEditor';
import { useVibeCard } from '../hooks/useVibeCard';
import { VibeCardData } from '@/lib/shared/types/vibeCardTypes';

interface VibeCardConfigProps {
  organizationId: string
  isEnabled: boolean
  onSettingsChange?: () => void
}

export function VibeCardConfig({ 
  organizationId, 
  isEnabled, 
  onSettingsChange 
}: VibeCardConfigProps) {
  const t = useTranslations('vibe-card');
  const {
    vibeCard,
    loading,
    saving,
    regenerating,
    updateVibeCard,
    saveVibeCard,
    regenerateVibeCard
  } = useVibeCard(organizationId);

  const [isEditing, setIsEditing] = useState(false);
  const [localVibeCard, setLocalVibeCard] = useState<VibeCardData | null>(vibeCard);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalVibeCard(vibeCard);
    setHasChanges(false);
  }, [vibeCard]);

  const handleVibeCardChange = (updates: Partial<VibeCardData>) => {
    if (!localVibeCard) return;
    
    const newVibeCard = { ...localVibeCard, ...updates };
    setLocalVibeCard(newVibeCard);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localVibeCard) return;
    
    await saveVibeCard(localVibeCard);
    setHasChanges(false);
    setIsEditing(false);
    onSettingsChange?.();
  };

  const handleRegenerate = async () => {
    await regenerateVibeCard();
    setHasChanges(false);
    setIsEditing(false);
    onSettingsChange?.();
  };

  if (!isEnabled) {
    return (
      <div 
        className="p-4 border rounded-lg"
        style={{ 
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        <p 
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          {t('disabled')}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>
          {t('loading')}
        </span>
      </div>
    );
  }

  if (!vibeCard) {
    return (
      <div 
        className="p-6 border rounded-lg text-center"
        style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        <Heart className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('noVibeCard.title')}
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          {t('noVibeCard.description')}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {t('noVibeCard.instruction')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('title')}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('subtitle')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <Edit3 className="h-4 w-4" />
              {t('edit')}
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsEditing(false);
                  setLocalVibeCard(vibeCard);
                  setHasChanges(false);
                }}
                className="px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-secondary)'
                }}
              >
                {t('cancel')}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                style={{
                  backgroundColor: hasChanges ? 'var(--accent-primary)' : 'var(--bg-muted)',
                  opacity: hasChanges ? 1 : 0.5
                }}
              >
                <Save className="h-4 w-4" />
                {saving ? t('saving') : t('save')}
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* AI Regenerate Section */}
      <motion.div
        className="rounded-xl border p-4"
        style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {t('aiRegenerate.title')}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('aiRegenerate.description')}
              </p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'white'
            }}
          >
            <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? t('regenerating') : t('regenerate')}
          </motion.button>
        </div>
      </motion.div>

      {/* Vibe Card Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Left Side - Preview */}
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('preview.title')}
          </h3>
          <VibeCardPreview vibeCard={localVibeCard || vibeCard} />
        </div>

        {/* Right Side - Editor (when editing) */}
        {isEditing && localVibeCard && (
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {t('editor.title')}
            </h3>
            <VibeCardEditor
              organizationId={organizationId}
              vibeCard={localVibeCard}
              onChange={handleVibeCardChange}
            />
          </div>
        )}

        {/* Right Side - Info (when not editing) */}
        {!isEditing && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('info.title')}
            </h3>
            
            <div 
              className="rounded-lg border p-4"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('info.howItWorks.title')}
              </h4>
              <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <li>• {t('info.howItWorks.point1')}</li>
                <li>• {t('info.howItWorks.point2')}</li>
                <li>• {t('info.howItWorks.point3')}</li>
                <li>• {t('info.howItWorks.point4')}</li>
              </ul>
            </div>

            <div 
              className="rounded-lg border p-4"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('info.marketplace.title')}
              </h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('info.marketplace.description')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
