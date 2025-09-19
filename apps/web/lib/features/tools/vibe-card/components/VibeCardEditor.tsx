'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Palette } from 'lucide-react';
import { VibeCardData, VIBE_AESTHETICS } from '@/lib/shared/types/vibeCardTypes';

interface VibeCardEditorProps {
  vibeCard: VibeCardData
  onChange: (updates: Partial<VibeCardData>) => void
}

export function VibeCardEditor({ vibeCard, onChange }: VibeCardEditorProps) {
  const [newValueBadge, setNewValueBadge] = useState('');
  const [newPersonalityTrait, setNewPersonalityTrait] = useState('');
  const [newPerfectFor, setNewPerfectFor] = useState('');

  const handleAddValueBadge = () => {
    if (newValueBadge.trim()) {
      onChange({
        value_badges: [...(vibeCard.value_badges || []), newValueBadge.trim()]
      });
      setNewValueBadge('');
    }
  };

  const handleRemoveValueBadge = (index: number) => {
    onChange({
      value_badges: (vibeCard.value_badges || []).filter((_, i) => i !== index)
    });
  };

  const handleAddPersonalityTrait = () => {
    if (newPersonalityTrait.trim()) {
      onChange({
        personality_traits: [...(vibeCard.personality_traits || []), newPersonalityTrait.trim()]
      });
      setNewPersonalityTrait('');
    }
  };

  const handleRemovePersonalityTrait = (index: number) => {
    onChange({
      personality_traits: (vibeCard.personality_traits || []).filter((_, i) => i !== index)
    });
  };

  const handleAddPerfectFor = () => {
    if (newPerfectFor.trim()) {
      onChange({
        perfect_for: [...(vibeCard.perfect_for || []), newPerfectFor.trim()]
      });
      setNewPerfectFor('');
    }
  };

  const handleRemovePerfectFor = (index: number) => {
    onChange({
      perfect_for: (vibeCard.perfect_for || []).filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Business Name
          </label>
          <input
            type="text"
            value={vibeCard.business_name}
            onChange={(e) => onChange({ business_name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Business Type
          </label>
          <input
            type="text"
            value={vibeCard.business_type}
            onChange={(e) => onChange({ business_type: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      </div>

      {/* Origin Story */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Origin Story
        </label>
        <textarea
          value={vibeCard.origin_story}
          onChange={(e) => onChange({ origin_story: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg resize-none"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)'
          }}
          placeholder="Tell your unique story..."
        />
      </div>

      {/* Vibe Aesthetic */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Vibe Aesthetic
        </label>
        <select
          value={vibeCard.vibe_aesthetic}
          onChange={(e) => onChange({ vibe_aesthetic: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)'
          }}
        >
          {VIBE_AESTHETICS.map((aesthetic) => (
            <option key={aesthetic} value={aesthetic}>
              {aesthetic}
            </option>
          ))}
        </select>
      </div>

      {/* Colors */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          <Palette className="h-4 w-4 inline mr-1" />
          Brand Colors
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              Primary
            </label>
            <input
              type="color"
              value={vibeCard.vibe_colors.primary}
              onChange={(e) => onChange({
                vibe_colors: { ...vibeCard.vibe_colors, primary: e.target.value }
              })}
              className="w-full h-10 border rounded cursor-pointer"
              style={{ borderColor: 'var(--border-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              Secondary
            </label>
            <input
              type="color"
              value={vibeCard.vibe_colors.secondary}
              onChange={(e) => onChange({
                vibe_colors: { ...vibeCard.vibe_colors, secondary: e.target.value }
              })}
              className="w-full h-10 border rounded cursor-pointer"
              style={{ borderColor: 'var(--border-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              Accent
            </label>
            <input
              type="color"
              value={vibeCard.vibe_colors.accent}
              onChange={(e) => onChange({
                vibe_colors: { ...vibeCard.vibe_colors, accent: e.target.value }
              })}
              className="w-full h-10 border rounded cursor-pointer"
              style={{ borderColor: 'var(--border-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* Value Badges */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Value Badges
        </label>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {(vibeCard.value_badges || []).map((badge, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white'
                }}
              >
                {badge}
                <button
                  onClick={() => handleRemoveValueBadge(index)}
                  className="hover:bg-white/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newValueBadge}
              onChange={(e) => setNewValueBadge(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddValueBadge()}
              placeholder="Add value badge..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            />
            <button
              onClick={handleAddValueBadge}
              className="px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'white'
              }}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Personality Traits */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Personality Traits
        </label>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {(vibeCard.personality_traits || []).map((trait, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 px-3 py-1 rounded text-xs"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                {trait}
                <button
                  onClick={() => handleRemovePersonalityTrait(index)}
                  className="hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPersonalityTrait}
              onChange={(e) => setNewPersonalityTrait(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddPersonalityTrait()}
              placeholder="Add personality trait..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            />
            <button
              onClick={handleAddPersonalityTrait}
              className="px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'white'
              }}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Why Different */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          What Makes You Different
        </label>
        <textarea
          value={vibeCard.why_different}
          onChange={(e) => onChange({ why_different: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border rounded-lg resize-none"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)'
          }}
          placeholder="What's your unique advantage..."
        />
      </div>

      {/* Perfect For */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Perfect For
        </label>
        <div className="space-y-2">
          <div className="space-y-1">
            {(vibeCard.perfect_for || []).map((customer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded border"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                  {customer}
                </span>
                <button
                  onClick={() => handleRemovePerfectFor(index)}
                  className="hover:bg-gray-200 rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPerfectFor}
              onChange={(e) => setNewPerfectFor(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddPerfectFor()}
              placeholder="Add ideal customer type..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            />
            <button
              onClick={handleAddPerfectFor}
              className="px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'white'
              }}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Love */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Customer Love (Testimonial Style)
        </label>
        <textarea
          value={vibeCard.customer_love}
          onChange={(e) => onChange({ customer_love: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border rounded-lg resize-none"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)'
          }}
          placeholder="What customers love about you..."
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Location (Optional)
        </label>
        <input
          type="text"
          value={vibeCard.location || ''}
          onChange={(e) => onChange({ location: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)'
          }}
          placeholder="City, State or Region"
        />
      </div>
    </div>
  );
}
