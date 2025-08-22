import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ORGANIZATION_ID: '@chayo:organization_id',
  USER_EMAIL: '@chayo:user_email',
  APP_CONFIG: '@chayo:app_config',
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
   * Store app config cache
   */
  static async setAppConfig(config: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(config));
    } catch (error) {
      console.error('Error storing app config:', error);
      throw error;
    }
  }

  /**
   * Get cached app config
   */
  static async getAppConfig(): Promise<any | null> {
    try {
      const configString = await AsyncStorage.getItem(STORAGE_KEYS.APP_CONFIG);
      return configString ? JSON.parse(configString) : null;
    } catch (error) {
      console.error('Error retrieving app config:', error);
      return null;
    }
  }

  /**
   * Clear all stored data
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ORGANIZATION_ID,
        STORAGE_KEYS.USER_EMAIL,
        STORAGE_KEYS.APP_CONFIG,
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
      const email = await this.getUserEmail();
      return !!(organizationId || email);
    } catch (error) {
      console.error('Error checking setup status:', error);
      return false;
    }
  }
}
