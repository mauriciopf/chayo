import { useState, useEffect } from 'react';
import { VibeCardData } from '@/lib/shared/types/vibeCardTypes';
import { VibeCardService } from '../../onboarding/services/vibeCardService';

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

      // Call API to save vibe card (update completion_data)
      const response = await fetch(`/api/organizations/${organizationId}/vibe-card`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(vibeCardData)
      });

      if (!response.ok) {
        throw new Error('Failed to save vibe card');
      }

      const result = await response.json();
      setVibeCard(result.vibe_card);
      
      return true;
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

      // Call API to regenerate vibe card using AI
      const response = await fetch(`/api/organizations/${organizationId}/regenerate-vibe-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate vibe card');
      }

      const result = await response.json();
      setVibeCard(result.vibe_card);
      
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
