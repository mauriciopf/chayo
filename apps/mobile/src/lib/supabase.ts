import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { validateAuthConfig } from '../utils/authConfig';

// Get configuration with fallback for development
let config;
try {
  config = validateAuthConfig();
} catch (error) {
  // Use fallback config for development
  config = {
    supabaseUrl: 'https://nkmduznghoxkuxniqgfx.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rbWR1em5naG94a3V4bmlxZ2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NTMzNzAsImV4cCI6MjA2NzUyOTM3MH0.VfocmQ7U6wc4jiTL_30dm9m_ibe0QZYeRH4NRrTdPuU',
  };
}

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    // Configure auth settings for mobile
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
