'use client';

import { useAuth } from './useAuth';

export function usePermission() {
  const { role, checkPermission } = useAuth();

  const can = (permissionCode) => {
    if (!role) return false;
    if (role === 'ADMIN') return true;
    return checkPermission(permissionCode);
  };

  return { can, role };
}
