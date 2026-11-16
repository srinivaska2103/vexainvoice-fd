'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/ui/Spinner';

export default function CreateCampaignRedirect() {
  const router = useRouter();
  const { user, role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      const userRoleSlug = user?.custom_role?.slug || user?.role_slug || (role === 'ADMIN' ? 'admin' : 'user');
      router.replace(`/company/${userRoleSlug}/crm/whatsapp/campaigns?tab=create`);
    }
  }, [isLoading, role, user, router]);

  return <LoadingScreen message="Opening Campaign Studio..." />;
}
