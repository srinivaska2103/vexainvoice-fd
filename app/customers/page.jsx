'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Spinner } from '@/components/ui/Spinner';

export default function CustomersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/crm/customers');
  }, [router]);

  return (
    <ProtectedRoute permissions={['customers.view', 'crm.view']}>
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-slate-500">
          <Spinner size="lg" className="text-blue-600" />
          <p className="text-xs font-bold">Redirecting to Customer Intelligence Workspace...</p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
