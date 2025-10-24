import { Linking } from 'react-native';
import appsFlyer from 'react-native-appsflyer';
import { StorageService } from './StorageService';

export interface DeepLinkData {
  organizationSlug?: string;
  action?: string;
  campaignId?: string;
  mediaSource?: string;
  [key: string]: any; // Allow additional AppsFlyer params
}

export class DeepLinkService {
  private static appsFlyerInitialized = false;
  private static onInstallConversionDataListener: any = null;
  private static onDeepLinkListener: any = null;

  /**
   * Initialize AppsFlyer SDK
   * Call this once at app startup
   */
  static initializeAppsFlyer() {
    if (this.appsFlyerInitialized) {
      return;
    }

    const options = {
      devKey: 'jTd7SWWPyXcbcjNjScR2Ki',
      appId: 'id6751903645', // iOS App ID
      isDebug: __DEV__, // Enable debug mode in development
      onInstallConversionDataListener: true,
      onDeepLinkListener: true,
      timeToWaitForATTUserAuthorization: 10, // Wait 10 seconds for ATT dialog
    };

    appsFlyer.initSdk(
      options,
      (result) => {
        console.log('AppsFlyer: SDK initialized successfully', result);
        this.appsFlyerInitialized = true;
      },
      (error) => {
        console.error('AppsFlyer: SDK initialization error', error);
      }
    );

    // Handle deferred deep linking (install attribution)
    this.onInstallConversionDataListener = appsFlyer.onInstallConversionData((data) => {
      console.log('AppsFlyer: onInstallConversionData', data);
      
      if (data?.data?.is_first_launch === 'true') {
        console.log('AppsFlyer: First launch - deferred deep link');
        this.handleAppsFlyerData(data.data);
      }
    });

    // Handle deep linking (direct deep link)
    this.onDeepLinkListener = appsFlyer.onDeepLink((deepLinkData) => {
      console.log('AppsFlyer: onDeepLink', deepLinkData);
      
      if (deepLinkData?.data) {
        this.handleAppsFlyerData(deepLinkData.data);
      }
    });
  }

  /**
   * Cleanup AppsFlyer listeners
   */
  static cleanupAppsFlyer() {
    if (this.onInstallConversionDataListener) {
      this.onInstallConversionDataListener();
      this.onInstallConversionDataListener = null;
    }
    if (this.onDeepLinkListener) {
      this.onDeepLinkListener();
      this.onDeepLinkListener = null;
    }
    this.appsFlyerInitialized = false;
  }

  /**
   * Handle AppsFlyer attribution data
   */
  private static async handleAppsFlyerData(data: any) {
    console.log('AppsFlyer: Processing attribution data', data);

    // Extract organization slug from deep link data
    const organizationSlug = 
      data.deep_link_value || 
      data.organizationSlug || 
      data.af_dp || // AppsFlyer deep link parameter
      data.link;

    const campaignId = data.campaign || data.af_campaign;
    const mediaSource = data.media_source || data.af_media_source;

    if (organizationSlug) {
      console.log('AppsFlyer: Organization slug detected:', organizationSlug);
      await StorageService.setOrganizationSlug(organizationSlug);

      if (campaignId) {
        console.log('AppsFlyer: Campaign:', campaignId);
      }
      if (mediaSource) {
        console.log('AppsFlyer: Media Source:', mediaSource);
      }
    }
  }

  /**
   * Generate AppsFlyer OneLink for deep linking
   */
  static generateAppsFlyerLink(
    organizationSlug: string,
    options?: {
      campaignId?: string;
      mediaSource?: string;
      channel?: string;
    }
  ): string {
    // AppsFlyer OneLink template
    // Replace with your actual OneLink URL from AppsFlyer dashboard
    const oneLinkUrl = 'https://chayo.onelink.me/XXXX'; // Update with your OneLink ID
    
    const params = new URLSearchParams({
      af_dp: `chayo://business/${organizationSlug}`,
      deep_link_value: organizationSlug,
      organizationSlug,
      ...(options?.campaignId && { campaign: options.campaignId }),
      ...(options?.mediaSource && { media_source: options.mediaSource }),
      ...(options?.channel && { af_channel: options.channel }),
    });

    return `${oneLinkUrl}?${params.toString()}`;
  }

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
   * Verify organization slug exists using API
   */
  static async verifyOrganizationSlug(slug: string): Promise<boolean> {
    try {
      // Use the vibe-card endpoint to verify organization exists
      const response = await fetch(`https://chayo.vercel.app/api/vibe-card/${slug}`);
      return response.ok;
    } catch (error) {
      console.error('Error verifying organization slug:', error);
      return false;
    }
  }

  /**
   * Handle incoming deep link (non-AppsFlyer)
   */
  static async handleDeepLink(
    url: string,
    onOrganizationSlugDetected: (organizationSlug: string) => void
  ): Promise<boolean> {
    const linkData = this.parseDeepLink(url);

    if (!linkData) {
      return false;
    }

    if (linkData.organizationSlug) {
      // Verify slug exists
      const isValid = await this.verifyOrganizationSlug(linkData.organizationSlug);

      if (isValid) {
        // Store organizationSlug in local storage
        await StorageService.setOrganizationSlug(linkData.organizationSlug);
        onOrganizationSlugDetected(linkData.organizationSlug);
        return true;
      }
    }

    return false;
  }

  /**
   * Set up deep link listener (for non-AppsFlyer links)
   */
  static setupDeepLinkListener(
    onOrganizationSlugDetected: (organizationSlug: string) => void
  ): () => void {
    const handleUrl = (event: { url: string }) => {
      this.handleDeepLink(event.url, onOrganizationSlugDetected);
    };

    // Listen for incoming links when app is already open
    const subscription = Linking.addEventListener('url', handleUrl);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleDeepLink(url, onOrganizationSlugDetected);
      }
    });

    // Return cleanup function
    return () => {
      subscription?.remove();
    };
  }

  /**
   * Generate mobile app universal link (fallback)
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
      ios: 'https://apps.apple.com/app/chayo/id6751903645',
      android: 'https://play.google.com/store/apps/details?id=com.chayo.mobile',
    };
  }

  /**
   * Track AppsFlyer event (for analytics)
   */
  static async trackAppsFlyerEvent(eventName: string, eventValues?: Record<string, any>) {
    try {
      await appsFlyer.logEvent(eventName, eventValues || {});
      console.log('AppsFlyer: Event tracked:', eventName, eventValues);
    } catch (error) {
      console.error('AppsFlyer: Error tracking event:', error);
    }
  }

  /**
   * Set AppsFlyer customer user ID
   */
  static async setAppsFlyerUserId(userId: string) {
    try {
      await appsFlyer.setCustomerUserId(userId);
      console.log('AppsFlyer: Customer user ID set:', userId);
    } catch (error) {
      console.error('AppsFlyer: Error setting customer user ID:', error);
    }
  }

  /**
   * Get AppsFlyer UID
   */
  static async getAppsFlyerUID(): Promise<string | null> {
    try {
      const uid = await appsFlyer.getAppsFlyerUID();
      console.log('AppsFlyer: UID:', uid);
      return uid;
    } catch (error) {
      console.error('AppsFlyer: Error getting UID:', error);
      return null;
    }
  }
}
