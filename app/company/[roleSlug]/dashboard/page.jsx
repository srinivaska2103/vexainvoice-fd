'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import DashboardPage from '@/app/dashboard/page';
import SalesPosPage from '@/app/sales/pos/page';
import PaymentsPage from '@/app/payments/page';
import StockPage from '@/app/stock/page';
import SalesHistoryPage from '@/app/sales/page';

export default function CompanyRoleDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const roleSlug = String(params?.roleSlug || '').toLowerCase().trim();
  const { user, role, isLoading, isAuthenticated } = useAuth();

  // Mapping from company role slug to expected authorized database role(s)
  const roleSlugPermissionMap = {
    'admin': ['ADMIN'],
    'admin-role': ['ADMIN'],
    'stock-role': ['STOCK_STAFF'],
    'stock-manager': ['STOCK_STAFF'],
    'stock-staff': ['STOCK_STAFF'],
    'cashier-role': ['BILLING_STAFF', 'USER'],
    'cashier': ['BILLING_STAFF', 'USER'],
    'cashier-billing-staff': ['BILLING_STAFF', 'USER'],
    'billing-staff': ['BILLING_STAFF', 'USER'],
    'billing': ['BILLING_STAFF', 'USER'],
    'manager-role': ['MANAGER'],
    'manager': ['MANAGER'],
    'accountant-role': ['ACCOUNTANT'],
    'accountant': ['ACCOUNTANT'],
    'sales-role': ['BILLING_STAFF', 'USER'],
    'sales': ['BILLING_STAFF', 'USER'],
    'sales-representative': ['BILLING_STAFF', 'USER']
  };

  // Determine allowed roles for this specific route
  let allowedRoles = roleSlugPermissionMap[roleSlug] || [];
  
  // If user has a custom role whose slug matches roleSlug, allow that role
  if (user?.custom_role && user.custom_role.slug === roleSlug) {
    allowedRoles = [user.role, ...(allowedRoles.length ? allowedRoles : [])];
  }

  // Verify match: ADMIN has global access; otherwise user's assigned role or custom slug must match
  const isMatch = role === 'ADMIN' || 
    (allowedRoles.length > 0 && allowedRoles.includes(role)) ||
    (user?.custom_role?.slug === roleSlug) ||
    (user?.role_slug === roleSlug);

  return (
    <ProtectedRoute>
      {!isLoading && isAuthenticated && !isMatch ? (
        // Redirect to access-denied if another role attempts to view this role's dashboard
        <AccessDeniedRedirect />
      ) : (
        renderDashboardContent(roleSlug, user)
      )}
    </ProtectedRoute>
  );
}

function AccessDeniedRedirect() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace('/access-denied');
  }, [router]);
  return null;
}

function renderDashboardContent(roleSlug, user) {
  const customPermissions = user?.permissions || user?.custom_role?.permissions || [];
  const hasPerm = (p) => user?.role === 'ADMIN' || customPermissions.includes('*') || customPermissions.includes(p);

  switch (roleSlug) {
    case 'admin':
    case 'admin-role':
      return <DashboardPage />;
    case 'manager':
    case 'manager-role':
      return <DashboardPage />;
    case 'cashier':
    case 'cashier-role':
      return <SalesPosPage />;
    case 'accountant':
    case 'accountant-role':
      return <PaymentsPage />;
    case 'stock-role':
    case 'stock-manager':
    case 'stock':
      return <StockPage />;
    case 'sales':
    case 'sales-role':
      return <SalesHistoryPage />;
    default:
      // Dynamically select primary view for any custom role based on granted module permissions
      if (hasPerm('stock.view') && !hasPerm('dashboard.view')) return <StockPage />;
      if (hasPerm('payments.view') && !hasPerm('dashboard.view')) return <PaymentsPage />;
      if (hasPerm('sales.view') && !hasPerm('dashboard.view')) return <SalesHistoryPage />;
      return <DashboardPage />;
  }
}

