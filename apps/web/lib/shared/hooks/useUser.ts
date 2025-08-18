'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/shared/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UserWithOrganization extends User {
  organizationId?: string;
  organizationSlug?: string;
}

export function useUser() {
  const [user, setUser] = useState<UserWithOrganization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUserWithOrganization = async (authUser: User) => {
      try {
        // Get user's organization
        const { data: membership } = await supabase
          .from('team_members')
          .select(`
            organization_id,
            organizations!inner (
              id,
              slug
            )
          `)
          .eq('user_id', authUser.id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        const userWithOrg: UserWithOrganization = {
          ...authUser,
          organizationId: membership?.organization_id,
          organizationSlug: (membership?.organizations as any)?.slug,
        };

        if (isMounted) {
          setUser(userWithOrg);
        }
      } catch (error) {
        console.error('Error fetching user organization:', error);
        if (isMounted) {
          setUser(authUser);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (session?.user) {
          await fetchUserWithOrganization(session.user);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
  };
}