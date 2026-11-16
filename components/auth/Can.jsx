'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Reusable permission control component
 * Usage: <Can permission="sales.create"> <Button>New Sale</Button> </Can>
 */
export function Can({ permission, role, children, fallback = null }) {
  const { checkPermission, hasRole } = useAuth();

  let isAuthorized = true;

  if (permission) {
    isAuthorized = checkPermission(permission);
  }

  if (role) {
    const rolesArray = Array.isArray(role) ? role : [role];
    isAuthorized = isAuthorized && hasRole(...rolesArray);
  }

  if (!isAuthorized) {
    return fallback;
  }

  return <>{children}</>;
}

export default Can;
