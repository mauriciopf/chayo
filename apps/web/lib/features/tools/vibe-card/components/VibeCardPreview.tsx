'use client';

import { motion } from 'framer-motion';
import { Heart, MapPin, Star } from 'lucide-react';
import { VibeCardData } from '@/lib/shared/types/vibeCardTypes';

interface VibeCardPreviewProps {
  vibeCard: VibeCardData
}

export function VibeCardPreview({ vibeCard }: VibeCardPreviewProps) {
  const {
    business_name,
    business_type,
    origin_story,
    value_badges,
    personality_traits,
    vibe_colors,
    vibe_aesthetic,
    why_different,
    perfect_for,
    customer_love,
    location
  } = vibeCard;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden shadow-xl border max-w-md"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        borderColor: vibe_colors.primary + '20'
      }}
    >
      {/* Header with gradient */}
      <div 
        className="p-6 text-white relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${vibe_colors.primary} 0%, ${vibe_colors.secondary} 100%)`
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5" />
            <span className="text-sm opacity-90">{vibe_aesthetic}</span>
          </div>
          
          <h3 className="text-xl font-bold mb-1">{business_name}</h3>
          <p className="text-sm opacity-90">{business_type}</p>
          
          {location && (
            <div className="flex items-center gap-1 mt-2 opacity-80">
              <MapPin className="h-3 w-3" />
              <span className="text-xs">{location}</span>
            </div>
          )}
        </div>
        
        {/* Decorative elements */}
        <div 
          className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20"
          style={{ backgroundColor: vibe_colors.accent }}
        />
        <div 
          className="absolute -bottom-2 -left-2 w-16 h-16 rounded-full opacity-20"
          style={{ backgroundColor: vibe_colors.accent }}
        />
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        
        {/* Origin Story */}
        <div>
          <h4 className="font-semibold text-sm mb-2" style={{ color: vibe_colors.primary }}>
            Our Story
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {origin_story}
          </p>
        </div>

        {/* Value Badges */}
        {value_badges.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2" style={{ color: vibe_colors.primary }}>
              What We Stand For
            </h4>
            <div className="flex flex-wrap gap-2">
              {value_badges.map((badge, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: vibe_colors.primary + '15',
                    color: vibe_colors.primary
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Personality Traits */}
        {personality_traits.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2" style={{ color: vibe_colors.primary }}>
              Our Vibe
            </h4>
            <div className="flex flex-wrap gap-2">
              {personality_traits.map((trait, index) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded text-xs"
                  style={{
                    backgroundColor: vibe_colors.secondary + '20',
                    color: vibe_colors.secondary
                  }}
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Why Different */}
        {why_different && (
          <div>
            <h4 className="font-semibold text-sm mb-2" style={{ color: vibe_colors.primary }}>
              What Makes Us Special
            </h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {why_different}
            </p>
          </div>
        )}

        {/* Perfect For */}
        {perfect_for.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2" style={{ color: vibe_colors.primary }}>
              Perfect For
            </h4>
            <ul className="text-sm space-y-1">
              {perfect_for.map((customer, index) => (
                <li key={index} className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <Star className="h-3 w-3" style={{ color: vibe_colors.accent }} />
                  {customer}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Customer Love */}
        {customer_love && (
          <div 
            className="rounded-lg p-4 border-l-4"
            style={{
              backgroundColor: vibe_colors.primary + '05',
              borderLeftColor: vibe_colors.primary
            }}
          >
            <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
              "{customer_love}"
            </p>
          </div>
        )}

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 rounded-lg font-semibold text-white shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${vibe_colors.primary} 0%, ${vibe_colors.secondary} 100%)`
          }}
        >
          Connect With Us
        </motion.button>
      </div>
    </motion.div>
  );
}
