interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface FAQ {
  id: string;
  name: string;
  description: string;
  faq_items: FAQItem[];
  updated_at: string;
}

interface FAQResponse {
  faqs: FAQ[];
  organization: {
    slug: string;
  };
}

class FAQService {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://chayo.ai') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all active FAQs for an organization by slug
   */
  async getFAQs(organizationSlug: string): Promise<{ success: boolean; data?: FAQ[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/faqs/${organizationSlug}`);

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Organization not found' };
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data: FAQResponse = await response.json();
      return { success: true, data: data.faqs || [] };
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      return { success: false, error: 'Failed to load FAQs. Please check your connection.' };
    }
  }

  /**
   * Check if FAQs are available for an organization
   */
  async hasFAQs(organizationSlug: string): Promise<boolean> {
    try {
      const result = await this.getFAQs(organizationSlug);
      return result.success && (result.data?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking FAQ availability:', error);
      return false;
    }
  }

  /**
   * Get FAQ statistics
   */
  async getFAQStats(organizationSlug: string): Promise<{ totalFAQs: number; totalItems: number }> {
    try {
      const result = await this.getFAQs(organizationSlug);
      
      if (!result.success || !result.data) {
        return { totalFAQs: 0, totalItems: 0 };
      }

      const totalFAQs = result.data.length;
      const totalItems = result.data.reduce((sum, faq) => sum + faq.faq_items.length, 0);

      return { totalFAQs, totalItems };
    } catch (error) {
      console.error('Error getting FAQ stats:', error);
      return { totalFAQs: 0, totalItems: 0 };
    }
  }
}

// Export singleton instance
export const faqService = new FAQService();
export default FAQService;
