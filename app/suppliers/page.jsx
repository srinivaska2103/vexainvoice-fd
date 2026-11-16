'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Edit, 
  Trash2, 
  Eye, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  IndianRupee, 
  Layers, 
  X,
  CreditCard,
  Building,
  ShieldCheck
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { supplierService } from '@/services/supplierService';
import { paymentService } from '@/services/paymentService';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/hooks/useAuth';
import { getRolePath } from '@/lib/permissions';

export default function SuppliersPage() {
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();
  const { can } = usePermission();
  const { role, user } = useAuth();

  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | INACTIVE | OUTSTANDING | FULLY_PAID

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentSupplier, setPaymentSupplier] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    referenceNumber: '',
    notes: ''
  });
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);

  // Supplier Form Data
  const [formData, setFormData] = useState({
    name: '',
    supplier_code: '',
    contact_person: '',
    phone: '',
    alt_phone: '',
    email: '',
    gstin: '',
    pan: '',
    supplier_type: 'MANUFACTURER',
    payment_terms: 'NET_30',
    credit_limit: '0',
    address: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    country: 'India',
    opening_balance: '0',
    notes: '',
    is_active: true
  });

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const res = await supplierService.getSuppliers({ search, filter: statusFilter });
      const list = res.data || res.suppliers || res || [];
      setSuppliers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
      toastError('Failed to load supplier list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search, statusFilter]);

  // Overall Dashboard Metrics
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.is_active).length;
  const outstandingSuppliersCount = suppliers.filter(s => Number(s.outstanding || 0) > 0).length;
  const totalPayables = suppliers.reduce((acc, s) => acc + Number(s.outstanding || 0), 0);

  // Extract State code from GSTIN
  const handleGstinChange = (val) => {
    const cleanGstin = val.toUpperCase().trim();
    setFormData((prev) => ({
      ...prev,
      gstin: cleanGstin,
      gst_number: cleanGstin
    }));
  };

  const handleOpenModal = (supplier = null) => {
    setFormError('');
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name || '',
        supplier_code: supplier.supplier_code || '',
        contact_person: supplier.contact_person || '',
        phone: supplier.phone || '',
        alt_phone: supplier.alt_phone || '',
        email: supplier.email || '',
        gstin: supplier.gst_number || supplier.gstin || '',
        pan: supplier.pan || '',
        supplier_type: supplier.supplier_type || 'MANUFACTURER',
        payment_terms: supplier.payment_terms || 'NET_30',
        credit_limit: String(supplier.credit_limit || 0),
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || 'Tamil Nadu',
        pincode: supplier.pincode || '',
        country: supplier.country || 'India',
        opening_balance: String(supplier.opening_balance || 0),
        notes: supplier.notes || '',
        is_active: supplier.is_active !== false
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        supplier_code: `SUP-${Date.now().toString().slice(-5)}`,
        contact_person: '',
        phone: '',
        alt_phone: '',
        email: '',
        gstin: '',
        pan: '',
        supplier_type: 'MANUFACTURER',
        payment_terms: 'NET_30',
        credit_limit: '0',
        address: '',
        city: '',
        state: 'Tamil Nadu',
        pincode: '',
        country: 'India',
        opening_balance: '0',
        notes: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Supplier Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        gst_number: formData.gstin ? formData.gstin.trim() : null,
        gstin: formData.gstin ? formData.gstin.trim() : null,
        opening_balance: parseFloat(formData.opening_balance || 0)
      };

      if (editingSupplier) {
        await supplierService.updateSupplier(editingSupplier.id, payload);
        toastSuccess('Supplier details updated successfully');
      } else {
        await supplierService.createSupplier(payload);
        toastSuccess('New supplier added successfully');
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to save supplier details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!confirm(`Are you sure you want to deactivate supplier ${name}? Historical purchase records will be safely preserved.`)) return;
    try {
      await supplierService.deleteSupplier(id);
      toastSuccess(`Supplier ${name} deactivated`);
      fetchSuppliers();
    } catch (err) {
      toastError(err.message || 'Failed to deactivate supplier');
    }
  };

  // Payment Record Modal Handler
  const handleOpenPaymentModal = (supplier) => {
    setPaymentSupplier(supplier);
    setPaymentData({
      amount: String(supplier.outstanding || 0),
      paymentMethod: 'CASH',
      referenceNumber: '',
      notes: 'Supplier Bill Payment'
    });
    setIsPaymentModalOpen(true);
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentSupplier || !paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toastError('Please enter a valid payment amount');
      return;
    }

    setIsPaymentSubmitting(true);
    try {
      await paymentService.createSupplierPayment({
        supplier_id: paymentSupplier.id,
        amount: parseFloat(paymentData.amount),
        payment_method: paymentData.paymentMethod,
        reference_number: paymentData.referenceNumber,
        notes: paymentData.notes
      });

      toastSuccess(`Payment of ${formatCurrency(paymentData.amount)} recorded for ${paymentSupplier.name}`);
      setIsPaymentModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      toastError(err.message || 'Failed to record supplier payment');
    } finally {
      setIsPaymentSubmitting(false);
    }
  };

  return (
    <ProtectedRoute permissions={['suppliers.view', 'suppliers.read']}>
      <DashboardLayout>
        <div className="p-3 sm:p-6 max-w-[1600px] mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 shrink-0" />
                <span>Suppliers & Vendors</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage garment manufacturers, textile mills, supplier payables & ledger statements
              </p>
            </div>
            {can('suppliers.create') && (
              <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-xs justify-center font-bold rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>
            )}
          </div>

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Suppliers</p>
                  <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalSuppliers}</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="p-5 border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Suppliers</p>
                  <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{activeSuppliers}</h3>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="p-5 border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Accounts</p>
                  <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{outstandingSuppliersCount}</h3>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-5 border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Payables</p>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-rose-600 mt-1">{formatCurrency(totalPayables)}</h3>
                </div>
                <div className="p-2.5 sm:p-3 bg-rose-50 text-rose-600 rounded-xl">
                  <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </Card>
          </div>

          {/* Search & Filter Bar */}
          <Card className="p-4 bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by vendor name, code, contact person, mobile, GSTIN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 focus:bg-white text-sm"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none no-scrollbar -mx-1 px-1">
                {[
                  { id: 'ALL', label: 'All Suppliers' },
                  { id: 'ACTIVE', label: 'Active' },
                  { id: 'OUTSTANDING', label: 'Outstanding' },
                  { id: 'FULLY_PAID', label: 'Fully Paid' },
                  { id: 'INACTIVE', label: 'Inactive' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                      statusFilter === f.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Supplier Table / Card View */}
          {isLoading ? (
            <div className="py-20 text-center">
              <Spinner className="w-8 h-8 mx-auto text-blue-600" />
              <p className="text-sm text-slate-500 mt-2">Loading supplier records...</p>
            </div>
          ) : suppliers.length === 0 ? (
            <Card className="p-12 text-center bg-white border border-slate-200/80">
              <EmptyState
                icon={Building2}
                title="No suppliers found"
                description={search ? "No suppliers match your search criteria." : "You haven't registered any suppliers or vendors yet."}
                action={can('suppliers.create') && (
                  <Button onClick={() => handleOpenModal()} className="bg-blue-600 text-white mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Supplier
                  </Button>
                )}
              />
            </Card>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-4">Supplier / Vendor</th>
                      <th className="p-4">Contact Person</th>
                      <th className="p-4">GSTIN & Code</th>
                      <th className="p-4">City / State</th>
                      <th className="p-4 text-right">Total Purchases</th>
                      <th className="p-4 text-right">Total Paid</th>
                      <th className="p-4 text-right">Outstanding</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-slate-50/80 transition group">
                        <td className="p-4">
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                            {supplier.name}
                          </div>
                          {supplier.phone && (
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              {supplier.phone}
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="text-xs font-semibold text-slate-800">
                            {supplier.contact_person || supplier.name}
                          </div>
                          {supplier.email && (
                            <div className="text-xs text-slate-400 truncate max-w-[180px]">
                              {supplier.email}
                            </div>
                          )}
                        </td>

                        <td className="p-4 font-mono text-xs text-slate-600">
                          <div className="font-semibold text-slate-800">
                            {supplier.gstin || supplier.gst_number || 'URP / Non-GST'}
                          </div>
                          {supplier.supplier_code && (
                            <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 rounded border border-slate-200 mt-0.5">
                              {supplier.supplier_code}
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-xs text-slate-600">
                          <div>{supplier.city || 'Tamil Nadu'}</div>
                          <div className="text-[10px] text-slate-400">{supplier.country || 'India'}</div>
                        </td>

                        <td className="p-4 text-right font-semibold text-slate-900">
                          {formatCurrency(supplier.totalPurchases || 0)}
                        </td>

                        <td className="p-4 text-right font-semibold text-emerald-600">
                          {formatCurrency(supplier.totalPaid || 0)}
                        </td>

                        <td className="p-4 text-right">
                          <div className={`font-extrabold ${Number(supplier.outstanding || 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            {formatCurrency(supplier.outstanding || 0)}
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          {supplier.is_active !== false ? (
                            <Badge variant="success" className="text-[10px] uppercase font-bold">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] uppercase font-bold">Inactive</Badge>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View Supplier Profile & Ledger"
                              onClick={() => router.push(getRolePath(role, user?.custom_role?.slug, `suppliers/${supplier.id}`))}
                              className="text-blue-600 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {can('payments.create') && Number(supplier.outstanding || 0) > 0 && (
                              <Button
                                size="xs"
                                title="Record Supplier Payment"
                                onClick={() => handleOpenPaymentModal(supplier)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-2 py-1"
                              >
                                Pay
                              </Button>
                            )}

                            {can('suppliers.edit') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Edit Supplier"
                                onClick={() => handleOpenModal(supplier)}
                                className="text-slate-600 hover:bg-slate-100"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}

                            {can('suppliers.delete') && supplier.is_active !== false && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Deactivate Supplier"
                                onClick={() => handleDeactivate(supplier.id, supplier.name)}
                                className="text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden grid grid-cols-1 gap-4">
                {suppliers.map((supplier) => (
                  <Card key={supplier.id} className="p-4 bg-white border border-slate-200/80 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{supplier.name}</h4>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          GSTIN: {supplier.gstin || supplier.gst_number || 'URP'} · Code: {supplier.supplier_code || 'SUP-01'}
                        </div>
                      </div>
                      {supplier.is_active !== false ? (
                        <Badge variant="success" className="text-[10px]">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Purchases</span>
                        <span className="font-bold text-slate-900">{formatCurrency(supplier.totalPurchases || 0)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Paid</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(supplier.totalPaid || 0)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Outstanding</span>
                        <span className={`font-extrabold ${Number(supplier.outstanding || 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {formatCurrency(supplier.outstanding || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      <div className="text-xs text-slate-500 flex items-center gap-1 truncate">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{supplier.phone || 'No phone'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {can('payments.create') && Number(supplier.outstanding || 0) > 0 && (
                          <Button size="xs" onClick={() => handleOpenPaymentModal(supplier)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg">
                            Pay
                          </Button>
                        )}
                        <Button size="xs" onClick={() => router.push(getRolePath(role, user?.custom_role?.slug, `suppliers/${supplier.id}`))} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs whitespace-nowrap">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Add / Edit Supplier Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={editingSupplier ? "Edit Supplier Details" : "Add New Supplier / Vendor"}
            size="lg"
          >
            <form onSubmit={handleSaveSupplier} className="space-y-6 pt-2">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Supplier Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="e.g. Tirupur Knitting Mills"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Supplier Code
                    </label>
                    <Input
                      placeholder="e.g. SUP-1024"
                      value={formData.supplier_code}
                      onChange={(e) => setFormData({ ...formData, supplier_code: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Person
                    </label>
                    <Input
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alternate Phone
                    </label>
                    <Input
                      placeholder="e.g. 0421-224455"
                      value={formData.alt_phone}
                      onChange={(e) => setFormData({ ...formData, alt_phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="e.g. sales@tirupurknitting.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Tax & Business Information */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Tax & Business Info
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GSTIN Number
                    </label>
                    <Input
                      placeholder="e.g. 33AAAAA0000A1Z5"
                      value={formData.gstin}
                      onChange={(e) => handleGstinChange(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PAN Number
                    </label>
                    <Input
                      placeholder="e.g. ABCDE1234F"
                      value={formData.pan}
                      onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Opening Payable Balance (₹)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.opening_balance}
                      onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  Location Address
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Street Address
                    </label>
                    <Input
                      placeholder="e.g. 12, Mill Road, Industrial Estate"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                      <Input
                        placeholder="e.g. Tirupur"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                      <Input
                        placeholder="Tamil Nadu"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                      <Input
                        placeholder="641601"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white min-w-[120px]">
                  {isSubmitting ? <Spinner className="w-4 h-4 mr-2" /> : (editingSupplier ? "Save Changes" : "Create Supplier")}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Record Supplier Payment Modal */}
          <Modal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            title={`Record Payment to ${paymentSupplier?.name}`}
            size="md"
          >
            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="font-bold text-slate-900">{paymentSupplier?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Outstanding Payable:</span>
                  <span className="font-extrabold text-rose-600">{formatCurrency(paymentSupplier?.outstanding || 0)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  placeholder="Enter payment amount"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="text-lg font-bold"
                />
              </div>

              <div>
                <Select
                  label="Payment Method"
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  options={[
                    { value: 'CASH', label: 'Cash' },
                    { value: 'UPI', label: 'UPI / GooglePay / PhonePe' },
                    { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT / RTGS)' },
                    { value: 'CHEQUE', label: 'Cheque' },
                    { value: 'CARD', label: 'Debit / Credit Card' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction Reference / UTR Number
                </label>
                <Input
                  placeholder="e.g. UTR9823749283 / Cheque No"
                  value={paymentData.referenceNumber}
                  onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Notes / Remarks
                </label>
                <Input
                  placeholder="Optional notes"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPaymentSubmitting} className="bg-emerald-600 text-white min-w-[120px]">
                  {isPaymentSubmitting ? <Spinner className="w-4 h-4 mr-2" /> : "Record Payment"}
                </Button>
              </div>
            </form>
          </Modal>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
