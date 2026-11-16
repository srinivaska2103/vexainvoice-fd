'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PaymentsPage from '@/app/payments/page';

export default function AccountantDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['ACCOUNTANT']}>
      <PaymentsPage />
    </ProtectedRoute>
  );
}

