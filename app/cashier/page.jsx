'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SalesPosPage from '@/app/sales/pos/page';

export default function CashierDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['BILLING_STAFF', 'USER']}>
      <SalesPosPage />
    </ProtectedRoute>
  );
}

