/**
 * Utility functions for testing SSE integration
 * These can be used to verify the SSE implementation is working correctly
 */

export const SSETestUtils = {
  /**
   * Test if SSE connection can be established
   */
  async testSSEConnection(organizationId: string, sessionId: string): Promise<boolean> {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://chayo.vercel.app';
      const url = `${baseUrl}/api/sse/chat-progress/${organizationId}/${sessionId}`;

      console.log('🧪 Testing SSE connection to:', url);

      // Try to create EventSource connection
      const EventSource = require('react-native-sse').EventSource;
      const testEventSource = new EventSource(url);

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          testEventSource.close();
          console.log('❌ SSE connection test timed out');
          resolve(false);
        }, 5000);

        testEventSource.addEventListener('open', () => {
          console.log('✅ SSE connection test successful');
          clearTimeout(timeout);
          testEventSource.close();
          resolve(true);
        });

        testEventSource.addEventListener('error', (error: any) => {
          console.log('❌ SSE connection test failed:', error);
          clearTimeout(timeout);
          testEventSource.close();
          resolve(false);
        });
      });
    } catch (error) {
      console.error('❌ SSE test error:', error);
      return false;
    }
  },

  /**
   * Log current environment configuration
   */
  logEnvironmentConfig() {
    console.log('🔧 SSE Environment Configuration:');
    console.log('  - API Base URL:', process.env.EXPO_PUBLIC_API_BASE_URL || 'https://chayo.vercel.app');
    console.log('  - OpenAI API Key:', process.env.EXPO_PUBLIC_OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
  },

  /**
   * Test the complete slug validation flow
   */
  async testSlugValidationFlow(testSlug: string): Promise<void> {
    console.log('🧪 Testing slug validation flow with:', testSlug);

    try {
      // Test API endpoint
      const response = await fetch(`https://chayo.vercel.app/api/app-config/${testSlug}`);
      console.log('  - API Response Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('  - Organization ID:', data.organizationId);
        console.log('  - Business Name:', data.businessName);
        console.log('✅ Slug validation API test successful');
      } else {
        console.log('❌ Slug validation API test failed');
      }
    } catch (error) {
      console.error('❌ Slug validation test error:', error);
    }
  },
};

/**
 * Development helper to test SSE integration
 * Call this in your component during development
 */
export const runSSEIntegrationTest = async () => {
  console.log('🚀 Starting SSE Integration Test...');

  SSETestUtils.logEnvironmentConfig();

  // Test with a sample organization ID and session ID
  const testOrgId = 'test-org-123';
  const testSessionId = `test-${Date.now()}`;

  const connectionTest = await SSETestUtils.testSSEConnection(testOrgId, testSessionId);

  if (connectionTest) {
    console.log('🎉 SSE Integration Test: PASSED');
  } else {
    console.log('⚠️ SSE Integration Test: FAILED - Check server endpoints');
  }

  console.log('📝 Next steps:');
  console.log('  1. Ensure SSE endpoints exist on server');
  console.log('  2. Test with real organization ID');
  console.log('  3. Monitor network tab for SSE events');
};
