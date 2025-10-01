import { useState, useEffect, useCallback } from 'react';
import { offersService, Offer } from '../services/OffersService';

interface UseOffersReturn {
  offers: Offer[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  activateOffer: (offerId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  deactivateOffer: (offerId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  getOffersForProduct: (productId: string) => Offer[];
}

/**
 * Custom hook to manage offers data and actions
 * Can be used anywhere in the app to fetch and manage offers
 */
export const useOffers = (organizationId?: string, userId?: string): UseOffersReturn => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    if (!organizationId) {
      setOffers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🎯 useOffers: Fetching offers for organizationId:', organizationId, 'userId:', userId);

      const result = await offersService.getActiveOffers(organizationId, userId);

      console.log('🎯 useOffers: Service response:', result);

      if (result.success) {
        setOffers(result.offers || []);
        console.log('🎯 useOffers: Set offers:', result.offers?.length || 0, 'offers');
      } else {
        setError(result.error || 'Failed to fetch offers');
        console.error('useOffers: Failed to fetch offers:', result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch offers';
      setError(errorMessage);
      console.error('useOffers: Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, userId]);

  const activateOffer = useCallback(async (offerId: string, currentUserId: string) => {
    if (!organizationId) {
      return { success: false, error: 'Organization ID is required' };
    }

    try {
      const result = await offersService.activateOffer(offerId, currentUserId, organizationId);

      if (result.success) {
        // Refresh offers after activation
        await fetchOffers();
      }

      return result;
    } catch (error) {
      console.error('useOffers: Error activating offer:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [organizationId, fetchOffers]);

  const deactivateOffer = useCallback(async (offerId: string, currentUserId: string) => {
    try {
      const result = await offersService.deactivateOffer(offerId, currentUserId);

      if (result.success) {
        // Refresh offers after deactivation
        await fetchOffers();
      }

      return result;
    } catch (error) {
      console.error('useOffers: Error deactivating offer:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [fetchOffers]);

  const getOffersForProduct = useCallback((productId: string): Offer[] => {
    return offers.filter(offer =>
      offer.products?.some(product => product.id === productId)
    );
  }, [offers]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  return {
    offers,
    loading,
    error,
    refetch: fetchOffers,
    activateOffer,
    deactivateOffer,
    getOffersForProduct,
  };
};
