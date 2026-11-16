'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/ui/Spinner';
import { getRoleDashboard } from '@/lib/permissions';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, role, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      const destination = isAuthenticated 
        ? getRoleDashboard(role, user?.custom_role?.slug) 
        : '/login';
      router.replace(destination);

      // Immediate fallback redirect to ensure page never gets stuck on Initializing loader
      if (typeof window !== 'undefined' && window.location.pathname === '/') {
        window.location.href = destination;
      }
    }
  }, [isAuthenticated, isLoading, role, user, router]);

  return <LoadingScreen message="Initializing VEXA Invoice..." />;
}

