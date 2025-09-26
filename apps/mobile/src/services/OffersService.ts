export interface Offer {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  offer_type: 'percentage' | 'fixed_amount';
  offer_value: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive' | 'expired';
  ai_banner_url?: string;
  ai_banner_prompt?: string;
  banner_generated_at?: string;
  products?: Product[];
  product_count?: number;
  is_activated_by_user?: boolean;
  activated_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  discounted_price?: number;
  image_url?: string;
}

export interface OffersResponse {
  success: boolean;
  offers?: Offer[];
  total?: number;
  error?: string;
}

export interface ActivateOfferResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export class OffersService {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://chayo.vercel.app') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get available offers for an organization (includes both active and inactive)
   */
  async getActiveOffers(organizationId: string, userId?: string): Promise<OffersResponse> {
    try {
      const params = new URLSearchParams({
        organizationId,
        ...(userId && { userId })
      });

      const response = await fetch(`${this.baseUrl}/api/offers/active?${params}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Organization not found' };
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return { 
        success: true, 
        offers: data.offers || [], 
        total: data.total || 0 
      };
    } catch (error) {
      console.error('Error fetching available offers:', error);
      return { 
        success: false, 
        error: 'Failed to load offers. Please check your connection.' 
      };
    }
  }

  /**
   * Activate an offer for a user
   */
  async activateOffer(offerId: string, userId: string, organizationId: string): Promise<ActivateOfferResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/offers/${offerId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          organizationId
        })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || 'Failed to activate offer' };
      }
    } catch (error) {
      console.error('Error activating offer:', error);
      return { 
        success: false, 
        error: 'Network error. Please try again.' 
      };
    }
  }

  /**
   * Deactivate an offer for a user
   */
  async deactivateOffer(offerId: string, userId: string): Promise<ActivateOfferResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/offers/${offerId}/activate?userId=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        return { success: true, message: 'Offer deactivated successfully' };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to deactivate offer' };
      }
    } catch (error) {
      console.error('Error deactivating offer:', error);
      return { 
        success: false, 
        error: 'Network error. Please try again.' 
      };
    }
  }

  /**
   * Check if offers are available for an organization
   */
  async hasOffers(organizationId: string): Promise<boolean> {
    try {
      const result = await this.getActiveOffers(organizationId);
      return result.success && (result.offers?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking offers availability:', error);
      return false;
    }
  }
}

// Export singleton instance
export const offersService = new OffersService();
export default OffersService;
