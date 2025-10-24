import { Linking } from 'react-native';
import appsFlyer from 'react-native-appsflyer';
import { StorageService } from './StorageService';

export interface DeepLinkData {
  organizationSlug?: string;
  action?: string;
  campaignId?: string;
  mediaSource?: string;
  // Specific destination parameters
  productId?: string;
  formId?: string;
  documentId?: string;
  paymentId?: string;
  reservationDate?: string;
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

    // IMPORTANT: Register listeners BEFORE initializing SDK
    // This ensures we don't miss the deferred deep link payload on first launch
    
    // Handle deferred deep linking (install attribution) - FIRST OPEN ONLY
    this.onInstallConversionDataListener = appsFlyer.onInstallConversionData((data) => {
      console.log('AppsFlyer: onInstallConversionData', data);
      
      // Check for first launch (handle both boolean and string types)
      const isFirstLaunch = 
        data?.data?.is_first_launch === true || 
        data?.data?.is_first_launch === 'true';
      
      if (isFirstLaunch) {
        console.log('AppsFlyer: First launch - deferred deep link detected');
        this.handleAppsFlyerData(data.data);
      }
    });

    // Handle Unified Deep Linking (UDL) - BOTH DIRECT + DEFERRED
    this.onDeepLinkListener = appsFlyer.onDeepLink((res) => {
      console.log('AppsFlyer: onDeepLink (UDL)', res);
      
      // Only process if deep link was found successfully
      if (res?.deepLinkStatus === 'FOUND' && res?.data) {
        console.log('AppsFlyer: Deep link found, isDeferred:', res.isDeferred);
        this.handleAppsFlyerData(res.data);
      } else if (res?.deepLinkStatus === 'NOT_FOUND') {
        console.log('AppsFlyer: Deep link not found');
      } else if (res?.deepLinkStatus === 'ERROR') {
        console.error('AppsFlyer: Deep link error');
      }
    });

    // NOW initialize the SDK (listeners are already registered)
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
   * Handle AppsFlyer attribution data (from both onInstallConversionData and UDL)
   */
  private static async handleAppsFlyerData(data: any) {
    console.log('AppsFlyer: Processing attribution data', data);

    // Extract organization slug from deep link data
    // Priority: deep_link_value (UDL) > deep_link_sub1 > organizationSlug > af_dp > link
    const organizationSlug = 
      data.deep_link_value || 
      data.organizationSlug || 
      data.af_dp || // AppsFlyer deep link parameter
      data.link;

    const campaignId = data.campaign || data.af_campaign;
    const mediaSource = data.media_source || data.af_media_source;
    
    // Extract action and destination parameters from UDL deep_link_sub fields
    const action = data.deep_link_sub1 || data.action; // 'product', 'form', 'reservation', etc.
    const productId = data.deep_link_sub2;
    const formId = data.deep_link_sub3;
    const documentId = data.deep_link_sub4;
    const paymentId = data.deep_link_sub5;
    const reservationDate = data.deep_link_sub6;

    if (organizationSlug) {
      console.log('AppsFlyer: Organization slug detected:', organizationSlug);
      await StorageService.setOrganizationSlug(organizationSlug);

      // Store destination parameters if present
      const deepLinkData: DeepLinkData = {
        organizationSlug,
        action,
        productId,
        formId,
        documentId,
        paymentId,
        reservationDate,
      };

      // Store deep link data for navigation handling
      await StorageService.setDeepLinkData(JSON.stringify(deepLinkData));

      if (campaignId) {
        console.log('AppsFlyer: Campaign:', campaignId);
      }
      if (mediaSource) {
        console.log('AppsFlyer: Media Source:', mediaSource);
      }
      if (action) {
        console.log('AppsFlyer: Action:', action);
      }
    } else {
      console.log('AppsFlyer: No organization slug found in attribution data');
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
      // Specific destination options
      action?: 'chat' | 'product' | 'form' | 'reservation' | 'document' | 'payment';
      productId?: string;
      formId?: string;
      documentId?: string;
      paymentId?: string;
      reservationDate?: string;
    }
  ): string {
    // AppsFlyer OneLink template: Chayo Business Links
    const oneLinkUrl = 'https://chayo.onelink.me/SB63';
    
    const params: Record<string, string> = {
      af_dp: `chayo://business/${organizationSlug}`,
      deep_link_value: organizationSlug,
      organizationSlug,
    };

    // Add action and specific destination parameters
    if (options?.action) {
      params.deep_link_sub1 = options.action;
    }
    if (options?.productId) {
      params.deep_link_sub2 = options.productId;
    }
    if (options?.formId) {
      params.deep_link_sub3 = options.formId;
    }
    if (options?.documentId) {
      params.deep_link_sub4 = options.documentId;
    }
    if (options?.paymentId) {
      params.deep_link_sub5 = options.paymentId;
    }
    if (options?.reservationDate) {
      params.deep_link_sub6 = options.reservationDate;
    }

    // Add campaign tracking
    if (options?.campaignId) {
      params.campaign = options.campaignId;
    }
    if (options?.mediaSource) {
      params.media_source = options.mediaSource;
    }
    if (options?.channel) {
      params.af_channel = options.channel;
    }

    const searchParams = new URLSearchParams(params);
    return `${oneLinkUrl}?${searchParams.toString()}`;
  }

  /**
   * Generate link to specific product
   */
  static generateProductLink(organizationSlug: string, productId: string, options?: {
    campaignId?: string;
    mediaSource?: string;
  }): string {
    return this.generateAppsFlyerLink(organizationSlug, {
      action: 'product',
      productId,
      ...options,
    });
  }

  /**
   * Generate link to specific form
   */
  static generateFormLink(organizationSlug: string, formId: string, options?: {
    campaignId?: string;
    mediaSource?: string;
  }): string {
    return this.generateAppsFlyerLink(organizationSlug, {
      action: 'form',
      formId,
      ...options,
    });
  }

  /**
   * Generate link to reservation calendar
   */
  static generateReservationLink(organizationSlug: string, productId?: string, options?: {
    campaignId?: string;
    mediaSource?: string;
  }): string {
    return this.generateAppsFlyerLink(organizationSlug, {
      action: 'reservation',
      productId, // Optional: link to specific reservation product
      ...options,
    });
  }

  /**
   * Generate link to specific document
   */
  static generateDocumentLink(organizationSlug: string, documentId: string, options?: {
    campaignId?: string;
    mediaSource?: string;
  }): string {
    return this.generateAppsFlyerLink(organizationSlug, {
      action: 'document',
      documentId,
      ...options,
    });
  }

  /**
   * Generate link to payment
   */
  static generatePaymentLink(organizationSlug: string, paymentId: string, options?: {
    campaignId?: string;
    mediaSource?: string;
  }): string {
    return this.generateAppsFlyerLink(organizationSlug, {
      action: 'payment',
      paymentId,
      ...options,
    });
  }

  /**
   * Generate link to business chat (default behavior)
   */
  static generateChatLink(organizationSlug: string, options?: {
    campaignId?: string;
    mediaSource?: string;
  }): string {
    return this.generateAppsFlyerLink(organizationSlug, {
      action: 'chat',
      ...options,
    });
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
