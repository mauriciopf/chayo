import { useState, useEffect } from 'react';
import { VibeCardData } from '@/lib/shared/types/vibeCardTypes';
import { VibeCardService } from '../../../onboarding/services/vibeCardService';

export function useVibeCard(organizationId: string) {
  const [vibeCard, setVibeCard] = useState<VibeCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vibeCardService = new VibeCardService();

  // Load vibe card data
  useEffect(() => {
    loadVibeCard();
  }, [organizationId]);

  const loadVibeCard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await vibeCardService.getVibeCardData(organizationId);
      setVibeCard(data);
    } catch (err) {
      console.error('Error loading vibe card:', err);
      setError('Failed to load vibe card');
    } finally {
      setLoading(false);
    }
  };

  const updateVibeCard = (updates: Partial<VibeCardData>) => {
    if (!vibeCard) return;
    
    const updatedVibeCard = { ...vibeCard, ...updates };
    setVibeCard(updatedVibeCard);
  };

  const saveVibeCard = async (vibeCardData: VibeCardData) => {
    try {
      setSaving(true);
      setError(null);

      // Use service directly (no API route needed)
      const success = await vibeCardService.updateVibeCard(organizationId, vibeCardData);
      
      if (success) {
        setVibeCard(vibeCardData);
        return true;
      } else {
        throw new Error('Failed to save vibe card');
      }
    } catch (err) {
      console.error('Error saving vibe card:', err);
      setError('Failed to save vibe card');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const regenerateVibeCard = async () => {
    try {
      setRegenerating(true);
      setError(null);

      // Call API route for regeneration (server-side only)
      const response = await fetch(`/api/organizations/${organizationId}/regenerate-vibe-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to regenerate vibe card: ${response.status}`);
      }

      const newVibeCard = await response.json();
      setVibeCard(newVibeCard);
      return true;
    } catch (err) {
      console.error('Error regenerating vibe card:', err);
      setError('Failed to regenerate vibe card');
      return false;
    } finally {
      setRegenerating(false);
    }
  };

  return {
    vibeCard,
    loading,
    saving,
    regenerating,
    error,
    updateVibeCard,
    saveVibeCard,
    regenerateVibeCard,
    reload: loadVibeCard
  };
}
