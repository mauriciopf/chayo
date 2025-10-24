import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ORGANIZATION_ID: '@chayo:organization_id',
  ORGANIZATION_SLUG: '@chayo:organization_slug',
  USER_EMAIL: '@chayo:user_email',
  DEEP_LINK_DATA: '@chayo:deep_link_data',
} as const;

export class StorageService {
  /**
   * Store organization ID
   */
  static async setOrganizationId(organizationId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ORGANIZATION_ID, organizationId);
    } catch (error) {
      console.error('Error storing organization ID:', error);
      throw error;
    }
  }

  /**
   * Get stored organization ID
   */
  static async getOrganizationId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ORGANIZATION_ID);
    } catch (error) {
      console.error('Error retrieving organization ID:', error);
      return null;
    }
  }

  /**
   * Clear organization ID
   */
  static async clearOrganizationId(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ORGANIZATION_ID);
    } catch (error) {
      console.error('Error clearing organization ID:', error);
      throw error;
    }
  }

  /**
   * Store organization slug
   */
  static async setOrganizationSlug(slug: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ORGANIZATION_SLUG, slug);
    } catch (error) {
      console.error('Error storing organization slug:', error);
      throw error;
    }
  }

  /**
   * Get stored organization slug
   */
  static async getOrganizationSlug(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ORGANIZATION_SLUG);
    } catch (error) {
      console.error('Error retrieving organization slug:', error);
      return null;
    }
  }

  /**
   * Clear organization slug
   */
  static async clearOrganizationSlug(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ORGANIZATION_SLUG);
    } catch (error) {
      console.error('Error clearing organization slug:', error);
      throw error;
    }
  }

  /**
   * Store user email
   */
  static async setUserEmail(email: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
    } catch (error) {
      console.error('Error storing user email:', error);
      throw error;
    }
  }

  /**
   * Get stored user email
   */
  static async getUserEmail(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL);
    } catch (error) {
      console.error('Error retrieving user email:', error);
      return null;
    }
  }

  /**
   * Clear user email
   */
  static async clearUserEmail(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    } catch (error) {
      console.error('Error clearing user email:', error);
      throw error;
    }
  }

  /**
   * Store deep link data
   */
  static async setDeepLinkData(data: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DEEP_LINK_DATA, data);
    } catch (error) {
      console.error('Error storing deep link data:', error);
      throw error;
    }
  }

  /**
   * Get stored deep link data
   */
  static async getDeepLinkData(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.DEEP_LINK_DATA);
    } catch (error) {
      console.error('Error retrieving deep link data:', error);
      return null;
    }
  }

  /**
   * Clear deep link data
   */
  static async clearDeepLinkData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.DEEP_LINK_DATA);
    } catch (error) {
      console.error('Error clearing deep link data:', error);
      throw error;
    }
  }



  /**
   * Clear all stored data
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ORGANIZATION_ID,
        STORAGE_KEYS.ORGANIZATION_SLUG,
        STORAGE_KEYS.USER_EMAIL,
        STORAGE_KEYS.DEEP_LINK_DATA,
      ]);
    } catch (error) {
      console.error('Error clearing all storage:', error);
      throw error;
    }
  }

  /**
   * Check if user has completed initial setup
   */
  static async hasCompletedSetup(): Promise<boolean> {
    try {
      const organizationId = await this.getOrganizationId();
      const slug = await this.getOrganizationSlug();
      const email = await this.getUserEmail();
      return !!(organizationId || slug || email);
    } catch (error) {
      console.error('Error checking setup status:', error);
      return false;
    }
  }
}
