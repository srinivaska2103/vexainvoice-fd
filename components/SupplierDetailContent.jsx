'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Building2, Phone, Mail, MapPin, Package, Clock, FileText, CreditCard, ChevronDown, ChevronRight, Plus, DollarSign, CheckCircle2, AlertCircle, Printer, Layers, Tag, ShieldCheck, Building 
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { supplierService } from '@/services/supplierService';
import { paymentService } from '@/services/paymentService';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { usePermission } from '@/hooks/usePermission';

export default function SupplierDetailContent({ supplierId: propSupplierId }) {
  const params = useParams();
  const id = propSupplierId || params?.id;
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();
  const { can } = usePermission();

  const [supplier, setSupplier] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && id !== 'placeholder') {
      fetchSupplierDetails();
    }
  }, [id]);

  const fetchSupplierDetails = async () => {
    try {
      setLoading(true);
      const [supRes, ledgerRes] = await Promise.all([
        supplierService.getSupplierById(id),
        supplierService.getSupplierLedger(id)
      ]);
      setSupplier(supRes.data || supRes);
      setLedger(ledgerRes.ledger || ledgerRes.data || ledgerRes || []);
    } catch (err) {
      console.error('Failed to fetch supplier detail:', err);
      toastError('Failed to load supplier details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center">
          <Spinner className="w-8 h-8 mx-auto text-blue-600" />
          <p className="text-sm text-slate-500 mt-2">Loading supplier profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!supplier) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center space-y-4">
          <p className="text-slate-500 font-semibold">Supplier record not found.</p>
          <Button onClick={() => router.push('/suppliers')} className="bg-blue-600 text-white">
            Back to Supplier Directory
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProtectedRoute permissions={['suppliers.view', 'suppliers.read']}>
      <DashboardLayout>
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/suppliers')}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">{supplier.name}</h1>
                <p className="text-xs text-slate-500 font-mono">Supplier Profile & Financial Ledger</p>
              </div>
            </div>
          </div>
          <Card className="p-6 bg-white border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-2">Supplier Overview</h2>
            <p className="text-xs text-slate-600">GSTIN: {supplier.gstin || supplier.gst_number || 'N/A'}</p>
            <p className="text-xs text-slate-600">Phone: {supplier.phone || 'N/A'}</p>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
