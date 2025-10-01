import { supabase } from '../lib/supabase';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { sha256 } from 'js-sha256';
import {
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
} from '@env';

// Export supabase for use in other modules
export { supabase };

// Types
export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  provider: 'google' | 'apple' | 'email';
}

export interface Customer {
  id: string;
  organizationId: string;
  email: string;
  fullName?: string;
  phone?: string;
  authProvider: string;
  supabaseUserId: string;
  avatarUrl?: string;
  metadata: any;
}

// Configure Google Sign-In (call this once at app start)
export function configureGoogleSignIn() {
  try {
    GoogleSignin.configure({
      iosClientId: EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '408321366335-k0k1ncstcrfic51h9t6vg22774ut765u.apps.googleusercontent.com',
      webClientId: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '408321366335-k0k1ncstcrfic51h9t6vg22774ut765u.apps.googleusercontent.com',
      offlineAccess: false,
    });
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to configure Google Sign-In:', error);
    }
    // Non-blocking error - app can still function with Apple/Email auth
  }
}

// Generate cryptographically secure random string for Apple nonce
function randomString(length = 32): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomBytes = new Uint8Array(length);

  // Use cryptographically secure random values
  // react-native-get-random-values polyfill is imported at app entry (index.js)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    // Fallback for edge cases where crypto.getRandomValues is not available
    throw new Error('crypto.getRandomValues is not available - ensure react-native-get-random-values is imported at app entry');
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

// Apple Sign-In (iOS only)
export async function signInWithApple(): Promise<AuthUser> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS');
  }

  // Generate nonce
  const rawNonce = randomString(32);

  // Create SHA-256 hash using js-sha256 (getRandomValues polyfilled by react-native-get-random-values)
  const hashedNonce = sha256(rawNonce);

  // Request Apple credentials
  const credential = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) {
    throw new Error('Inicio de sesión con Apple falló: no se recibió identityToken');
  }

  // Exchange with Supabase
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });

  if (error) {throw error;}
  if (!data.user) {throw new Error('No user returned from Apple Sign-In');}

  return {
    id: data.user.id,
    email: data.user.email!,
    fullName: credential.fullName ?
      `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim() :
      data.user.user_metadata?.full_name,
    avatarUrl: data.user.user_metadata?.avatar_url,
    provider: 'apple',
  };
}

// Google Sign-In
export async function signInWithGoogle(): Promise<AuthUser> {
  // Ensure Play Services on Android
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const userInfo = await GoogleSignin.signIn();

  // Get tokens
  const tokens = await GoogleSignin.getTokens();
  const idToken = tokens.idToken || userInfo.data?.idToken;

  if (!idToken) {
    throw new Error('Inicio de sesión con Google falló: no se recibió idToken');
  }

  // Exchange with Supabase
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) {throw error;}
  if (!data.user) {throw new Error('No user returned from Google Sign-In');}

  return {
    id: data.user.id,
    email: data.user.email!,
    fullName: data.user.user_metadata?.full_name || userInfo.data?.user?.name,
    avatarUrl: data.user.user_metadata?.avatar_url || userInfo.data?.user?.photo,
    provider: 'google',
  };
}

// Email Sign-In
export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {throw error;}
  if (!data.user) {throw new Error('No user returned from email sign-in');}

  return {
    id: data.user.id,
    email: data.user.email!,
    fullName: data.user.user_metadata?.full_name,
    avatarUrl: data.user.user_metadata?.avatar_url,
    provider: 'email',
  };
}

// Email Sign-Up
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string
): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {throw error;}
  if (!data.user) {throw new Error('No user returned from email sign-up');}

  return {
    id: data.user.id,
    email: data.user.email!,
    fullName: fullName || data.user.user_metadata?.full_name,
    avatarUrl: data.user.user_metadata?.avatar_url,
    provider: 'email',
  };
}

// Sign Out
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {throw error;}

  // Sign out from Google if signed in
  try {
    const isSignedIn = await GoogleSignin.getCurrentUser();
    if (isSignedIn) {
      await GoogleSignin.signOut();
    }
  } catch (e) {
    // Ignore Google sign-out errors
  }
}

// Get current session
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {throw error;}
  return session;
}

// Create or update customer record
export async function createOrUpdateCustomer(
  organizationId: string,
  user: AuthUser,
  additionalData?: { phone?: string }
): Promise<Customer> {
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  if (!user.email) {
    throw new Error('User email is required');
  }

  const { data, error } = await supabase.rpc('get_or_create_customer', {
    p_organization_id: organizationId,
    p_email: user.email,
    p_full_name: user.fullName || '',
    p_phone: additionalData?.phone || null,
    p_auth_provider: user.provider,
    p_supabase_user_id: user.id,
    p_avatar_url: user.avatarUrl || null,
    p_metadata: {},
  });

  if (error) {
    console.error('Database error creating customer:', error);
    throw new Error('Failed to create customer record');
  }

  if (!data) {
    throw new Error('No customer data returned from database');
  }

  return data;
}

// Create customer interaction
export async function createCustomerInteraction(
  customerId: string,
  organizationId: string,
  tool: string,
  interactionData: any
) {
  if (!customerId || !organizationId || !tool) {
    throw new Error('Customer ID, Organization ID, and Tool are required');
  }

  const { data, error } = await supabase.rpc('create_customer_interaction', {
    p_customer_id: customerId,
    p_organization_id: organizationId,
    p_tool: tool,
    p_interaction_data: interactionData || {},
  });

  if (error) {
    console.error('Database error creating interaction:', error);
    throw new Error('Failed to track customer interaction');
  }

  return data;
}
