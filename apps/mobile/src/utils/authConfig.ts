/**
 * Authentication Configuration Validator
 * Ensures all required environment variables and configurations are present
 */

export interface AuthConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  googleWebClientId?: string;
  googleIosClientId?: string;
}

export function validateAuthConfig(): AuthConfig {
  const config: AuthConfig = {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  };

  // Validate required Supabase configuration
  if (!config.supabaseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL is required in environment variables');
  }

  if (!config.supabaseAnonKey) {
    throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is required in environment variables');
  }

  // Validate URL format
  try {
    new URL(config.supabaseUrl);
  } catch {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL must be a valid URL');
  }

  return config;
}

export function getAuthProviderAvailability() {
  const config = validateAuthConfig();
  
  return {
    email: true, // Always available
    apple: true, // Available on iOS
    google: !!(config.googleWebClientId || config.googleIosClientId),
  };
}

export function logAuthConfigStatus() {
  try {
    const config = validateAuthConfig();
    const availability = getAuthProviderAvailability();
    
    console.log('🔐 Auth Configuration Status:');
    console.log('  ✅ Supabase:', config.supabaseUrl ? 'Configured' : 'Missing');
    console.log('  ✅ Email Auth: Available');
    console.log('  🍎 Apple Auth: Available on iOS');
    console.log('  📧 Google Auth:', availability.google ? 'Configured' : 'Missing client IDs');
    
    return true;
  } catch (error) {
    console.error('❌ Auth Configuration Error:', error.message);
    return false;
  }
}
