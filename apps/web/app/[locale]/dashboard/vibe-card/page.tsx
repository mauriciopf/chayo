'use client';

import { useTranslations } from 'next-intl';
import { VibeCardConfig } from '@/lib/features/tools/vibe-card/components/VibeCardConfig';
import { useAuth } from '@/lib/features/auth/hooks/useAuth';

export default function VibeCardPage() {
  const t = useTranslations('vibe-card');
  const { currentOrganization, authState, loading } = useAuth();

  // Show loading state while authentication is loading
  if (loading || authState === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (authState !== 'authenticated' || !currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">Please authenticate to access vibe card settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <VibeCardConfig 
        organizationId={currentOrganization.id}
        isEnabled={true}
      />
    </div>
  );
}
