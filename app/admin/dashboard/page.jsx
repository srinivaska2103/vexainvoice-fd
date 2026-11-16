'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardPage from '@/app/dashboard/page';

export default function AdminDashboardRoute() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardPage />
    </ProtectedRoute>
  );
}

