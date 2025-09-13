import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { 
  AuthUser, 
  Customer, 
  configureGoogleSignIn, 
  getCurrentSession,
  createOrUpdateCustomer 
} from '../services/authService';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  // Auth state
  user: AuthUser | null;
  customer: Customer | null;
  session: Session | null;
  loading: boolean;
  
  // Actions
  setUser: (user: AuthUser | null) => void;
  setCustomer: (customer: Customer | null) => void;
  signOut: () => Promise<void>;
  
  // Helper methods
  requireAuth: (callback: (user: AuthUser, customer: Customer) => void) => void;
  createCustomerForOrganization: (organizationId: string, additionalData?: any) => Promise<Customer>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Log auth configuration status
    import('../utils/authConfig').then(({ logAuthConfigStatus }) => {
      logAuthConfigStatus();
    });

    // Configure Google Sign-In
    configureGoogleSignIn();

    // Get initial session
    getCurrentSession().then((session) => {
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          fullName: session.user.user_metadata?.full_name,
          avatarUrl: session.user.user_metadata?.avatar_url,
          provider: session.user.app_metadata?.provider || 'email',
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            fullName: session.user.user_metadata?.full_name,
            avatarUrl: session.user.user_metadata?.avatar_url,
            provider: session.user.app_metadata?.provider || 'email',
          });
        } else {
          setUser(null);
          setCustomer(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const { signOut } = await import('@/services/authService');
    await signOut();
    setUser(null);
    setCustomer(null);
  };

  const requireAuth = (callback: (user: AuthUser, customer: Customer) => void) => {
    if (user && customer) {
      callback(user, customer);
    } else {
      // This will trigger the login modal in the calling component
      console.log('Authentication required');
    }
  };

  const createCustomerForOrganization = async (
    organizationId: string, 
    additionalData?: any
  ): Promise<Customer> => {
    if (!user) {
      throw new Error('User must be authenticated to create customer');
    }

    if (!organizationId) {
      throw new Error('Organization ID is required to create customer');
    }

    try {
      const customer = await createOrUpdateCustomer(organizationId, user, additionalData);
      setCustomer(customer);
      return customer;
    } catch (error) {
      console.error('Failed to create customer for organization:', error);
      throw new Error('Failed to create customer record. Please try again.');
    }
  };

  const value: AuthContextType = {
    user,
    customer,
    session,
    loading,
    setUser,
    setCustomer,
    signOut: handleSignOut,
    requireAuth,
    createCustomerForOrganization,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
