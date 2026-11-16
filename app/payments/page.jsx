'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreditCard, Plus, Search, User, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { paymentService } from '@/services/paymentService';
import { customerService } from '@/services/customerService';
import { supplierService } from '@/services/supplierService';
import { salesService } from '@/services/salesService';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/hooks/useAuth';

function PaymentsContent() {
  const { checkPermission, role } = useAuth();
  const canCreatePayment = role === 'ADMIN' || checkPermission('payments.create');
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const [tab, setTab] = useState(() => (typeParam === 'supplier' ? 'supplier' : 'customer'));

  useEffect(() => {
    if (typeParam === 'supplier') {
      setTab('supplier');
    } else if (typeParam === 'customer') {
      setTab('customer');
    }
  }, [typeParam]);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [search, setSearch] = useState('');
  const [selectedEntityFilter, setSelectedEntityFilter] = useState('');

  // Form State
  const [entityId, setEntityId] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH'); // CASH, UPI, BANK_TRANSFER, CHEQUE
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setSelectedEntityFilter('');
    fetchPayments();
    fetchEntities();
  }, [tab]);

  useEffect(() => {
    setSelectedSaleId('');
    setCustomerInvoices([]);
    if (tab === 'customer' && entityId) {
      fetchCustomerInvoices(entityId);
    }
  }, [entityId, tab]);

  const fetchCustomerInvoices = async (custId) => {
    try {
      setLoadingInvoices(true);
      const res = await salesService.getSales({ customer_id: custId, limit: 100 });
      const salesList = res.data || res.sales || res || [];
      const pendingInvoices = Array.isArray(salesList)
        ? salesList.filter((s) => {
            const grand = Number(s.grand_total || s.grandTotal || 0);
            const paid = Number(s.paid_amount || s.paidAmount || 0);
            const bal = Number(s.balance_amount ?? s.balanceAmount ?? (grand - paid));
            return bal > 0;
          })
        : [];
      setCustomerInvoices(pendingInvoices);
    } catch (err) {
      console.error('Failed to fetch customer invoices:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleInvoiceChange = (saleId) => {
    setSelectedSaleId(saleId);
    if (saleId) {
      const inv = customerInvoices.find((s) => s.id === saleId);
      if (inv) {
        const grand = Number(inv.grand_total || inv.grandTotal || 0);
        const paid = Number(inv.paid_amount || inv.paidAmount || 0);
        const bal = Number(inv.balance_amount ?? inv.balanceAmount ?? (grand - paid));
        if (bal > 0) {
          setAmount(bal.toFixed(2));
        }
      }
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      if (tab === 'customer') {
        const res = await paymentService.getCustomerPayments();
        setPayments(res.data || res || []);
      } else {
        const res = await paymentService.getSupplierPayments();
        setPayments(res.data || res || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        customerService.getCustomers(),
        supplierService.getSuppliers()
      ]);
      setCustomers(cRes.data || cRes || []);
      setSuppliers(sRes.data || sRes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (selectedEntityFilter) {
      const eId = tab === 'customer' 
        ? (p.customer_id || p.customerId || p.customers?.id || p.customer?.id)
        : (p.supplier_id || p.supplierId || p.suppliers?.id || p.supplier?.id);
      if (String(eId) !== String(selectedEntityFilter)) return false;
    }
    if (!search) return true;
    const query = search.toLowerCase();
    const entityName = (tab === 'customer' ? (p.customers?.name || p.customer?.name) : (p.suppliers?.name || p.supplier?.name)) || '';
    const ref = p.reference_no || p.referenceNo || '';
    const notesText = p.notes || '';
    return entityName.toLowerCase().includes(query) || ref.toLowerCase().includes(query) || notesText.toLowerCase().includes(query);
  });

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!entityId || !amount || parseFloat(amount) <= 0) {
      setError('Please select contact and enter a valid amount');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (tab === 'customer') {
        await paymentService.createCustomerPayment({
          customer_id: entityId,
          sale_id: selectedSaleId || undefined,
          amount: parseFloat(amount),
          payment_method: paymentMode,
          payment_mode: paymentMode,
          reference_number: referenceNo,
          reference_no: referenceNo,
          notes
        });
      } else {
        await paymentService.createSupplierPayment({
          supplier_id: entityId,
          amount: parseFloat(amount),
          payment_method: paymentMode,
          payment_mode: paymentMode,
          reference_number: referenceNo,
          reference_no: referenceNo,
          notes
        });
      }

      setSuccess('Payment recorded successfully!');
      setIsModalOpen(false);
      setEntityId('');
      setSelectedSaleId('');
      setCustomerInvoices([]);
      setAmount('');
      setReferenceNo('');
      setNotes('');
      fetchPayments();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute permissions={['payments.view']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 shrink-0" />
                <span>Payments & Collections</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Record customer payment receipts and supplier payout transactions
              </p>
            </div>

            {canCreatePayment && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Record {tab === 'customer' ? 'Customer Payment' : 'Supplier Payment'}</span>
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 text-red-700 flex items-center space-x-2 border border-red-200">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 flex items-center space-x-2 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
              <span>{success}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar scrollbar-none gap-6 sm:gap-8 px-1">
            <button
              type="button"
              onClick={() => setTab('customer')}
              className={`pb-3 font-bold text-xs sm:text-sm border-b-2 transition flex items-center space-x-2 shrink-0 cursor-pointer ${
                tab === 'customer' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Customer Receipts</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('supplier')}
              className={`pb-3 font-bold text-xs sm:text-sm border-b-2 transition flex items-center space-x-2 shrink-0 cursor-pointer ${
                tab === 'supplier' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Supplier Payouts</span>
            </button>
          </div>

          {/* Search & Customer / Supplier Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${tab === 'customer' ? 'customer' : 'supplier'}, reference #...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="w-full sm:w-72">
              <Select
                value={selectedEntityFilter}
                onChange={(e) => setSelectedEntityFilter(e.target.value)}
                options={[
                  { value: '', label: `Filter: All ${tab === 'customer' ? 'Customers' : 'Suppliers'}` },
                  ...(tab === 'customer' ? customers : suppliers).map((e) => ({
                    value: e.id,
                    label: e.name
                  }))
                ]}
              />
            </div>
          </div>

          {/* List Table */}
          {loading ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-semibold text-slate-500 mt-2">Loading transactions...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/90 text-slate-500 space-y-2 shadow-xs">
              <CreditCard className="w-10 h-10 text-slate-300 mx-auto opacity-70" />
              <p className="text-sm font-bold text-slate-700">No payment records found.</p>
              <p className="text-xs text-slate-400">Click Record Payment above to log a new transaction.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-200 tracking-wider">
                    <tr>
                      <th className="p-4 whitespace-nowrap min-w-[110px]">Date</th>
                      <th className="p-4 whitespace-nowrap min-w-[150px]">{tab === 'customer' ? 'Customer' : 'Supplier'}</th>
                      <th className="p-4 whitespace-nowrap min-w-[90px]">Mode</th>
                      <th className="p-4 whitespace-nowrap min-w-[130px]">Reference No</th>
                      <th className="p-4 text-right whitespace-nowrap min-w-[110px]">Amount (₹)</th>
                      <th className="p-4 whitespace-nowrap min-w-[120px]">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((p) => {
                      const mode = p.payment_mode || p.payment_method || 'CASH';
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-semibold text-slate-700 whitespace-nowrap">
                            {new Date(p.created_at || p.payment_date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="p-4 font-extrabold text-slate-900 text-sm whitespace-nowrap">
                            {tab === 'customer' ? (p.customers?.name || p.customer?.name || 'Customer') : (p.suppliers?.name || p.supplier?.name || 'Supplier')}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              mode === 'UPI' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              mode === 'BANK_TRANSFER' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              mode === 'CHEQUE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {mode}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-600 whitespace-nowrap">
                            {p.reference_no || p.reference_number || '-'}
                          </td>
                          <td className="p-4 text-right font-black text-emerald-600 text-sm whitespace-nowrap">
                            ₹{parseFloat(p.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4 font-medium text-slate-600 whitespace-nowrap">
                            {p.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Record {tab === 'customer' ? 'Customer Payment' : 'Supplier Payout'}
                </h2>

                <form onSubmit={handleCreatePayment} className="space-y-4">
                  <div>
                    <Select
                      label={`Select ${tab === 'customer' ? 'Customer *' : 'Supplier *'}`}
                      placeholder={`-- Choose ${tab === 'customer' ? 'Customer' : 'Supplier'} --`}
                      searchable={true}
                      value={entityId}
                      onChange={(e) => setEntityId(e.target.value)}
                      options={(tab === 'customer' ? customers : suppliers).map((e) => {
                        const bal = e.outstanding_balance ?? e.outstandingBalance ?? e.current_balance ?? e.outstanding ?? 0;
                        return {
                          value: e.id,
                          label: `${e.name} (Outstanding: ₹${Number(bal).toLocaleString('en-IN')})`
                        };
                      })}
                    />
                  </div>

                  {tab === 'customer' && entityId && (
                    <div>
                      <Select
                        label="Select Invoice / Invoice Number (Optional)"
                        placeholder={loadingInvoices ? "Loading customer invoices..." : "-- All Invoices / Auto Allocation (FIFO) --"}
                        searchable={true}
                        value={selectedSaleId}
                        onChange={(e) => handleInvoiceChange(e.target.value)}
                        options={[
                          { value: '', label: '-- All Invoices / Auto Allocation (FIFO) --' },
                          ...customerInvoices.map((inv) => {
                            const invNo = inv.invoice_number || inv.invoiceNumber || 'INV-000';
                            const grand = Number(inv.grand_total || inv.grandTotal || 0);
                            const paid = Number(inv.paid_amount || inv.paidAmount || 0);
                            const bal = Number(inv.balance_amount ?? inv.balanceAmount ?? (grand - paid));
                            const invDate = inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-IN') : '';
                            return {
                              value: inv.id,
                              label: `${invNo} — Unpaid Balance: ₹${bal.toLocaleString('en-IN')} (Total: ₹${grand.toLocaleString('en-IN')}) ${invDate ? `[${invDate}]` : ''}`
                            };
                          })
                        ]}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Amount Received / Paid (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <Select
                      label="Payment Mode"
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      options={[
                        { value: 'CASH', label: 'CASH' },
                        { value: 'UPI', label: 'UPI / GPay / PhonePe' },
                        { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/RTGS)' },
                        { value: 'CHEQUE', label: 'Cheque' },
                        { value: 'CARD', label: 'Debit / Credit Card' }
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Transaction / Cheque / Ref No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UTR-9048102394"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      placeholder="Payment remarks"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md disabled:opacity-50"
                    >
                      {saving ? 'Recording...' : 'Save Payment Entry'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">Loading...</div>}>
      <PaymentsContent />
    </Suspense>
  );
}

