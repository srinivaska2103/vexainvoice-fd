'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { hasPermission } from '@/lib/permissions';

export function useAuth() {
  const { user, business, token, isAuthenticated, isLoading, login, logout, updateBusiness, updateUser } = useAuthStore();

  const role = user?.role || null;
  const displayRole = user?.custom_role?.name || user?.display_role || user?.displayRole || (user?.role ? user.role.replace(/_/g, ' ') : '');

  const hasRole = (...allowedRoles) => {
    if (!role) return false;
    return allowedRoles.includes(role);
  };

  const customPermissions = user?.permissions || user?.custom_role?.permissions || [];
  const hasCustomRole = Boolean(user?.custom_role_id || user?.custom_role);

  const checkPermission = (permissionCode) => {
    if (!role && !customPermissions.length) return false;
    if (role === 'ADMIN') return true;
    if (customPermissions.includes('*')) return true;
    if (customPermissions.includes(permissionCode)) return true;
    // If user has a custom role assigned, their configured permissions are authoritative!
    if (hasCustomRole) return false;
    return hasPermission(role, permissionCode);
  };

  const canAccess = (moduleName) => {
    if (!role && !customPermissions.length) return false;
    if (role === 'ADMIN') return true;
    if (customPermissions.includes('*')) return true;

    // Check if custom permissions grant access to this module
    const modulePrefix = moduleName.toLowerCase();
    if (customPermissions.some(p => p.startsWith(modulePrefix) || p.includes(modulePrefix))) {
      return true;
    }

    // If user is on a custom role, do not fall back to base system role permissions
    if (hasCustomRole) return false;

    if (role === 'MANAGER') return true;

    switch (moduleName) {
      case 'SALES':
      case 'CUSTOMERS':
      case 'PAYMENTS':
      case 'QUOTATIONS':
        return ['BILLING_STAFF', 'ACCOUNTANT', 'USER'].includes(role);
      case 'PRODUCTS':
      case 'PURCHASES':
      case 'STOCK':
        return ['STOCK_STAFF'].includes(role);
      case 'REPORTS':
        return ['ACCOUNTANT'].includes(role);
      case 'SETTINGS':
        return role === 'ADMIN';
      default:
        return false;
    }
  };

  return {
    user,
    business,
    token,
    role,
    displayRole,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateBusiness,
    updateBusinessState: updateBusiness,
    updateUser,
    hasRole,
    canAccess,
    checkPermission
  };
}

