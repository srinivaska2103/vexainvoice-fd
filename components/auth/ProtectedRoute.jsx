'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/ui/Spinner';
import { getRoleDashboard } from '@/lib/permissions';

export function ProtectedRoute({ children, allowedRoles = [], permissions = [], redirectTo = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, role, user, business, checkPermission } = useAuth();

  const isRoleAllowed = allowedRoles.length === 0 || 
    role === 'ADMIN' || 
    allowedRoles.includes(role) ||
    (user?.custom_role?.slug && allowedRoles.includes(user.custom_role.slug)) ||
    (user?.role_slug && allowedRoles.includes(user.role_slug));

  const isPermAllowed = permissions.length === 0 || 
    role === 'ADMIN' || 
    permissions.some(p => checkPermission(p));

  // Evaluate subscription access enforcement
  const isSubRestricted = Boolean(
    business?.subscription_allowed === false ||
    business?.subscription_status === 'EXPIRED' ||
    business?.subscription_status === 'CANCELLED' ||
    business?.subscription_status === 'NO_SUBSCRIPTION' ||
    (business?.subscription_status === 'PENDING' && business?.license_status !== 'ACTIVE')
  );

  const cleanPath = (pathname || '').split('?')[0].replace(/\/$/, '');
  const userRoleSlug = user?.custom_role?.slug || user?.role_slug;
  const isSubscriptionRoute = cleanPath.endsWith('/settings/subscription');
  const isHelpRoute = cleanPath.includes('/help') || cleanPath.includes('/support');

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (isSubRestricted && !isSubscriptionRoute && !isHelpRoute) {
        // Enforce subscription locking: Redirect expired/cancelled companies directly to subscription pricing
        const subRedirect = `/company/${role === 'ADMIN' ? 'admin' : (userRoleSlug || 'user')}/settings/subscription`;
        router.replace(subRedirect);
      } else if (!isRoleAllowed || !isPermAllowed) {
        const fallback = redirectTo || '/access-denied';
        router.replace(fallback);
      } else if (pathname && !pathname.startsWith('/company/')) {
        // Backward-compatibility: Automatically migrate legacy unprefixed URLs (e.g. /products, /sales, /quotations)
        // to the user's canonical role-prefixed path (/company/{roleSlug}/{modulePath})
        const legacyCleanPath = pathname.replace(/^\/+|\/+$/g, '');
        const nonModuleRoots = ['login', 'register', 'signup', 'forgot-password', 'access-denied', 'verify-email', 'shop'];
        if (legacyCleanPath && !nonModuleRoots.some(root => legacyCleanPath.startsWith(root))) {
          const targetUrl = `/company/${role === 'ADMIN' ? 'admin' : (userRoleSlug || 'user')}/${legacyCleanPath}`;
          router.replace(targetUrl);
        }
      }
    }
  }, [isAuthenticated, isLoading, isSubRestricted, isSubscriptionRoute, isHelpRoute, isRoleAllowed, isPermAllowed, router, pathname, redirectTo, role, user, userRoleSlug]);

  if (isLoading || !isAuthenticated) {
    return <LoadingScreen message="Checking session authentication..." />;
  }

  // During transitional verification or unauthorized access, prevent unauthorized children rendering
  if (!isRoleAllowed) {
    return <LoadingScreen message="Verifying route authorization..." />;
  }

  if (!isPermAllowed) {
    return <LoadingScreen message="Verifying role permissions..." />;
  }

  return children;
}

export default ProtectedRoute;

