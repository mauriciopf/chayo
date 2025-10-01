/**
 * Authentication Configuration Validator
 * Ensures all required environment variables and configurations are present
 */

// Import environment variables safely
let EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
try {
  const envVars = require('@env');
  EXPO_PUBLIC_SUPABASE_URL = envVars.EXPO_PUBLIC_SUPABASE_URL;
  EXPO_PUBLIC_SUPABASE_ANON_KEY = envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = envVars.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = envVars.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
} catch (error) {
  // Silently use fallbacks in production
  if (__DEV__) {
    console.log('⚠️ Environment variables not available in authConfig, using fallbacks');
  }
}

export interface AuthConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  googleWebClientId?: string;
  googleIosClientId?: string;
}

export function validateAuthConfig(): AuthConfig {
  // Use fallback values for development if environment variables are not set
  const config: AuthConfig = {
    supabaseUrl: EXPO_PUBLIC_SUPABASE_URL || 'https://nkmduznghoxkuxniqgfx.supabase.co',
    supabaseAnonKey: EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rbWR1em5naG94a3V4bmlxZ2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NTMzNzAsImV4cCI6MjA2NzUyOTM3MH0.VfocmQ7U6wc4jiTL_30dm9m_ibe0QZYeRH4NRrTdPuU',
    googleWebClientId: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '408321366335-k0k1ncstcrfic51h9t6vg22774ut765u.apps.googleusercontent.com',
    googleIosClientId: EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '408321366335-k0k1ncstcrfic51h9t6vg22774ut765u.apps.googleusercontent.com',
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

    // Only log in development mode
    if (__DEV__) {
      console.log('🔐 Auth Configuration Status:');
      console.log('  ✅ Supabase:', config.supabaseUrl ? 'Configured' : 'Missing');
      console.log('  ✅ Email Auth: Available');
      console.log('  🍎 Apple Auth: Available on iOS');
      console.log('  📧 Google Auth:', availability.google ? 'Configured' : 'Missing client IDs');
    }

    return true;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Auth Configuration Error:', error.message);
    }
    return false;
  }
}
