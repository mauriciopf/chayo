import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { validateAuthConfig } from '../utils/authConfig';

// Validate configuration on module load
const config = validateAuthConfig();

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    // Configure auth settings for mobile
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
