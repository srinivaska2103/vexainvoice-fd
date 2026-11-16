'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import StockPage from '@/app/stock/page';

export default function StockManagerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['STOCK_STAFF']}>
      <StockPage />
    </ProtectedRoute>
  );
}

