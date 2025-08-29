import AsyncStorage from '@react-native-async-storage/async-storage';

// Sample organization ID (hardcoded for demo purposes)
export const SAMPLE_ORGANIZATION_ID = '46e30a6b-ea87-4279-b068-33a941b24983';

// AsyncStorage keys - MUST match StorageService keys!
const STORAGE_KEYS = {
  ORGANIZATION_ID: '@chayo:organization_id', // Same as StorageService
  IS_DEMO_MODE: '@chayo:is_demo_mode',
  HAS_SEEN_WELCOME: '@chayo:has_seen_welcome',
} as const;

export interface DemoModeState {
  organizationId: string | null;
  isDemoMode: boolean;
  hasSeenWelcome: boolean;
}

class DemoModeService {
  /**
   * Check if the app should show the welcome modal
   */
  async shouldShowWelcome(): Promise<boolean> {
    try {
      const hasSeenWelcome = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_WELCOME);
      const organizationId = await AsyncStorage.getItem(STORAGE_KEYS.ORGANIZATION_ID);
      
      // Show welcome if user hasn't seen it and doesn't have an organization
      return !hasSeenWelcome && !organizationId;
    } catch (error) {
      console.error('Error checking welcome status:', error);
      return true; // Default to showing welcome on error
    }
  }

  /**
   * Set demo mode and store sample organization ID
   */
  async enableDemoMode(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ORGANIZATION_ID, SAMPLE_ORGANIZATION_ID),
        AsyncStorage.setItem(STORAGE_KEYS.IS_DEMO_MODE, 'true'),
        AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_WELCOME, 'true'),
      ]);
      console.log('Demo mode enabled with sample organization:', SAMPLE_ORGANIZATION_ID);
    } catch (error) {
      console.error('Error enabling demo mode:', error);
      throw error;
    }
  }

  /**
   * Set real organization code and disable demo mode
   * This is called when user enters a real code or uses deep link
   */
  async setRealOrganization(organizationId: string): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ORGANIZATION_ID, organizationId),
        AsyncStorage.setItem(STORAGE_KEYS.IS_DEMO_MODE, 'false'),
        AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_WELCOME, 'true'),
      ]);
      console.log('Real organization set, demo mode disabled:', organizationId);
    } catch (error) {
      console.error('Error setting real organization:', error);
      throw error;
    }
  }

  /**
   * Reset all demo mode data (useful for testing or logout)
   */
  async resetDemoMode(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ORGANIZATION_ID),
        AsyncStorage.removeItem(STORAGE_KEYS.IS_DEMO_MODE),
        AsyncStorage.removeItem(STORAGE_KEYS.HAS_SEEN_WELCOME),
      ]);
      console.log('Demo mode data reset');
    } catch (error) {
      console.error('Error resetting demo mode:', error);
      throw error;
    }
  }

  /**
   * Get current demo mode state
   */
  async getDemoModeState(): Promise<DemoModeState> {
    try {
      const [organizationId, isDemoMode, hasSeenWelcome] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ORGANIZATION_ID),
        AsyncStorage.getItem(STORAGE_KEYS.IS_DEMO_MODE),
        AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_WELCOME),
      ]);

      return {
        organizationId,
        isDemoMode: isDemoMode === 'true',
        hasSeenWelcome: hasSeenWelcome === 'true',
      };
    } catch (error) {
      console.error('Error getting demo mode state:', error);
      return {
        organizationId: null,
        isDemoMode: false,
        hasSeenWelcome: false,
      };
    }
  }

  /**
   * Check if currently in demo mode
   */
  async isDemoMode(): Promise<boolean> {
    try {
      const organizationId = await AsyncStorage.getItem(STORAGE_KEYS.ORGANIZATION_ID);
      return organizationId === SAMPLE_ORGANIZATION_ID;
    } catch (error) {
      console.error('Error checking demo mode:', error);
      return false;
    }
  }



  /**
   * Mark welcome as seen without setting organization
   */
  async markWelcomeAsSeen(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_WELCOME, 'true');
    } catch (error) {
      console.error('Error marking welcome as seen:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const demoModeService = new DemoModeService();
export default demoModeService;
