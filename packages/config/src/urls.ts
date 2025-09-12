import { ToolType, ToolUrlConfig } from './types';

/**
 * Generate tool URLs based on organization slug and web base URL
 */
export class ToolUrlGenerator {
  constructor(
    private webBaseUrl: string,
    private organizationSlug: string
  ) {}

  /**
   * Get URL for a specific tool
   */
  getToolUrl(tool: ToolType): string {
    const urls: ToolUrlConfig = {
      appointments: `${this.webBaseUrl}/book-appointment/${this.organizationSlug}`,
      payments: `${this.webBaseUrl}/client-chat/${this.organizationSlug}?tool=payments`,
      documents: `${this.webBaseUrl}/client-chat/${this.organizationSlug}?tool=documents`, 
      faqs: `${this.webBaseUrl}/faqs/${this.organizationSlug}`,
      intake_forms: `${this.webBaseUrl}/client-chat/${this.organizationSlug}?tool=intake_forms`,
      'mobile-branding': `${this.webBaseUrl}/dashboard/mobile-branding`,
      products: `${this.webBaseUrl}/client-chat/${this.organizationSlug}?tool=products`,
    };

    return urls[tool];
  }

  /**
   * Get all tool URLs
   */
  getAllToolUrls(): ToolUrlConfig {
    return {
      appointments: this.getToolUrl('appointments'),
      payments: this.getToolUrl('payments'),
      documents: this.getToolUrl('documents'),
      faqs: this.getToolUrl('faqs'),
      intake_forms: this.getToolUrl('intake_forms'),
      'mobile-branding': this.getToolUrl('mobile-branding'),
      products: this.getToolUrl('products'),
    };
  }

  /**
   * Add mobile optimization parameters to URL
   */
  getMobileOptimizedUrl(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}mobile=true&hideNav=true`;
  }
}