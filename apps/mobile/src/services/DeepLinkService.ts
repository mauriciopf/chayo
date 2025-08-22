import { Linking } from 'react-native';

export interface DeepLinkData {
  organizationSlug?: string;
  action?: string;
}

export class DeepLinkService {
  /**
   * Parse deep link URL to extract organization slug or other data
   */
  static parseDeepLink(url: string): DeepLinkData | null {
    try {
      const parsedUrl = new URL(url);
      
      // Handle mobile app deep link formats:
      // chayo://business/acme-dental (native deep link)
      // https://chayo.vercel.app/mobile/acme-dental (universal link for mobile app)
      
      const result: DeepLinkData = {};
      
      if (parsedUrl.protocol === 'chayo:') {
        // Custom scheme: chayo://business/slug
        const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
        
        if (pathParts[0] === 'business' && pathParts[1]) {
          result.organizationSlug = pathParts[1];
          result.action = 'business';
        }
      } else if (parsedUrl.hostname === 'chayo.vercel.app' && parsedUrl.pathname.startsWith('/mobile/')) {
        // Mobile-specific universal link: https://chayo.vercel.app/mobile/slug
        const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
        
        if (pathParts[0] === 'mobile' && pathParts[1]) {
          result.organizationSlug = pathParts[1];
          result.action = 'mobile';
        }
      }
      
      return Object.keys(result).length > 0 ? result : null;
    } catch (error) {
      console.error('Error parsing deep link:', error);
      return null;
    }
  }

  /**
   * Handle incoming deep link
   */
  static async handleDeepLink(
    url: string,
    onSlugDetected: (slug: string) => void
  ): Promise<boolean> {
    const linkData = this.parseDeepLink(url);
    
    if (!linkData) {
      return false;
    }

    if (linkData.organizationSlug) {
      onSlugDetected(linkData.organizationSlug);
      return true;
    }

    return false;
  }

  /**
   * Set up deep link listener
   */
  static setupDeepLinkListener(
    onSlugDetected: (slug: string) => void
  ): () => void {
    const handleUrl = (event: { url: string }) => {
      this.handleDeepLink(event.url, onSlugDetected);
    };

    // Listen for incoming links when app is already open
    const subscription = Linking.addEventListener('url', handleUrl);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleDeepLink(url, onSlugDetected);
      }
    });

    // Return cleanup function
    return () => {
      subscription?.remove();
    };
  }

  /**
   * Generate mobile app universal link
   * This URL will open the mobile app if installed, or redirect to app store
   */
  static generateMobileUniversalLink(organizationSlug: string): string {
    return `https://chayo.vercel.app/mobile/${organizationSlug}`;
  }

  /**
   * Generate direct deep link URL for a business (app-only)
   */
  static generateDeepLink(organizationSlug: string): string {
    return `chayo://business/${organizationSlug}`;
  }

  /**
   * Generate app store URLs for download prompts
   */
  static getAppStoreUrls() {
    return {
      ios: 'https://apps.apple.com/app/chayo', // Replace with actual App Store URL
      android: 'https://play.google.com/store/apps/details?id=com.chayo.mobile', // Replace with actual Play Store URL
    };
  }
}
