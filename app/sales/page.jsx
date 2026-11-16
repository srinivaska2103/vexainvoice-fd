'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Search, 
  ShoppingCart, 
  Eye, 
  Printer, 
  Plus,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronRight,
  User,
  Phone,
  DollarSign,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  Download,
  Banknote
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { salesService } from '@/services/salesService';
import { exportService } from '@/services/exportService';
import InvoicePrintTemplate from '@/components/invoice/InvoicePrintTemplate';
import SalesReturnModal from '@/components/sales/SalesReturnModal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export default function SalesHistoryPage() {
  const { toastSuccess, toastError } = useToast();
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Export State
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportSales = async (exportType) => {
    setIsExportDropdownOpen(false);
    setIsExporting(true);
    toastSuccess('Preparing Excel file...');
    try {
      const params = { exportType };
      if (search) params.search = search;
      if (typeFilter) params.status = typeFilter;
      if (customerTypeFilter) params.customerType = customerTypeFilter;
      if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;
      if (paymentMethodFilter) params.paymentMethod = paymentMethodFilter;
      if (dateFilter) {
        params.startDate = dateFilter;
        params.endDate = dateFilter;
      }
      await exportService.exportSales(params);
      toastSuccess('Excel file downloaded successfully.');
    } catch (err) {
      console.error(err);
      toastError(err.message || 'Unable to export data.');
    } finally {
      setIsExporting(false);
    }
  };

  // Expand / Collapse state sets
  const [expandedCustomerIds, setExpandedCustomerIds] = useState(new Set());
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState(new Set());

  // Print, Delete & Return Modals
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState(null);
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const params = { search, invoiceType: typeFilter };
      if (customerTypeFilter) params.customerType = customerTypeFilter;
      if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;
      if (paymentMethodFilter) params.paymentMethod = paymentMethodFilter;
      if (dateFilter) {
        params.startDate = dateFilter;
        params.endDate = dateFilter;
      }
      const res = await salesService.getSales(params);
      const list = res.data || res.sales || res || [];
      const items = Array.isArray(list) ? list : [];
      setSales(items);

      // Auto-expand on search match
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const autoCustIds = new Set();
        const autoInvIds = new Set();

        items.forEach((sale) => {
          const custName = (sale.customer?.name || 'Walk-in Customer').toLowerCase();
          const invNum = (sale.invoiceNumber || sale.invoice_number || '').toLowerCase();
          const hasMatchingItem = (sale.items || sale.sale_items || []).some(it => 
            (it.name || it.product_name || '').toLowerCase().includes(query)
          );

          if (custName.includes(query) || invNum.includes(query) || hasMatchingItem) {
            const cId = sale.customer?.id || 'WALK_IN';
            autoCustIds.add(cId);
            autoInvIds.add(sale.id);
          }
        });

        setExpandedCustomerIds(autoCustIds);
        setExpandedInvoiceIds(autoInvIds);
      }
    } catch (err) {
      console.error('Failed to fetch sales:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!saleToDelete) return;
    const invNum = saleToDelete.invoiceNumber || saleToDelete.invoice_number;

    setIsDeleting(true);
    try {
      await salesService.deleteSale(saleToDelete.id);
      toastSuccess(`Invoice ${invNum} deleted successfully`);
      setSaleToDelete(null);
      fetchSales();
    } catch (err) {
      toastError(err.message || 'Failed to delete invoice');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [search, typeFilter, customerTypeFilter, paymentStatusFilter, paymentMethodFilter, dateFilter]);

  const filteredSales = sales.filter((sale) => {
    if (customerTypeFilter) {
      const cType = String(
        sale.customers?.customerType ||
        sale.customer?.customerType ||
        sale.customers?.customer_type ||
        sale.customer?.customer_type ||
        'RETAIL'
      ).toUpperCase();
      if (cType !== customerTypeFilter.toUpperCase()) return false;
    }

    if (paymentStatusFilter) {
      const grandTotal = Number(sale.grandTotal || sale.grand_total || 0);
      const paid = Number(sale.paidAmount || sale.paid_amount || 0);
      const outstanding = Number(sale.balanceAmount || sale.balance_amount || (grandTotal - paid));

      if (paymentStatusFilter === 'PAID' && outstanding > 0) return false;
      if ((paymentStatusFilter === 'UNPAID' || paymentStatusFilter === 'DUE') && paid > 0) return false;
      if (paymentStatusFilter === 'PARTIAL' && (paid <= 0 || outstanding <= 0)) return false;
    }

    if (paymentMethodFilter) {
      const payments = sale.sale_payments || sale.payments || [];
      const hasMethod = payments.some(p => (p.payment_method || p.paymentMethod) === paymentMethodFilter);
      if (!hasMethod && payments.length > 0) return false;
    }

    if (dateFilter) {
      const invDate = (sale.invoice_date || sale.invoiceDate || sale.created_at || '').split('T')[0];
      if (invDate && invDate !== dateFilter) return false;
    }

    return true;
  });

  // Group sales by Parent Customer
  const groupedCustomers = useMemo(() => {
    const map = new Map();

    filteredSales.forEach((sale) => {
      const cust = sale.customer || sale.customers;
      const custId = cust?.id || 'WALK_IN';
      const custName = cust?.name || 'Walk-in Customer';
      const custPhone = cust?.phone || '';
      const custType = cust?.customer_type || cust?.customerType || 'RETAIL';
      const custCurrentBalance = cust?.current_balance ?? cust?.outstanding_balance ?? cust?.outstandingBalance;

      if (!map.has(custId)) {
        map.set(custId, {
          customerId: custId,
          customerName: custName,
          customerPhone: custPhone,
          customerType: custType,
          customerCurrentBalance: custCurrentBalance,
          sales: [],
          totalBilling: 0,
          totalPaid: 0,
          totalBalance: 0,
          totalReturned: 0
        });
      }

      const group = map.get(custId);
      group.sales.push(sale);

      const totalAmt = Number(sale.totalAmount || sale.total_amount || sale.grand_total || 0);
      const paidAmt = Number(sale.paidAmount || sale.paid_amount || 0);
      const balAmt = Number(sale.balanceAmount ?? sale.balance_amount ?? (totalAmt - paidAmt));
      const returnedAmt = Number(
        sale.returnedAmount || 
        sale.returned_amount || 
        ((sale.status === 'RETURNED' || sale.is_return || Boolean(sale.notes?.toLowerCase().includes('return'))) ? totalAmt : 0)
      );

      group.totalBilling += totalAmt;
      group.totalPaid += paidAmt;
      group.totalBalance += balAmt;
      group.totalReturned += returnedAmt;
    });

    return Array.from(map.values()).map(group => {
      // If customer has a real current_balance from party ledger (non-walkin), sync totalBalance with it if available
      if (group.customerId !== 'WALK_IN' && group.customerCurrentBalance !== undefined && group.customerCurrentBalance !== null) {
        return {
          ...group,
          totalBalance: Number(group.customerCurrentBalance)
        };
      }
      return group;
    });
  }, [filteredSales]);

  const toggleCustomerExpand = (cId) => {
    setExpandedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(cId)) next.delete(cId);
      else next.add(cId);
      return next;
    });
  };

  const toggleInvoiceExpand = (invId) => {
    setExpandedInvoiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(invId)) next.delete(invId);
      else next.add(invId);
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedCustomerIds(new Set(groupedCustomers.map(g => g.customerId)));
    setExpandedInvoiceIds(new Set(filteredSales.map(s => s.id)));
  };

  const handleCollapseAll = () => {
    setExpandedCustomerIds(new Set());
    setExpandedInvoiceIds(new Set());
  };

  return (
    <ProtectedRoute permissions={['sales.view']}>
      <DashboardLayout>
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h1 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600 shrink-0" />
                <span>Sales Invoices & Billing History</span>
              </h1>
              <p className="text-[10.5px] sm:text-xs text-slate-500 mt-0.5">
                Parent Customer → Issued Invoices → Line Item Products & Variants Breakdown
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2">
              {/* Export Excel Dropdown */}
              <div className="relative col-span-2 sm:col-span-1">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Exporting...' : 'Export Excel'}</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                </button>

                {isExportDropdownOpen && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 border-b border-slate-100">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Export Sales Data</p>
                    </div>
                    <button
                      onClick={() => handleExportSales('transactions')}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between"
                    >
                      <span>Sales Transactions</span>
                    </button>
                    <button
                      onClick={() => handleExportSales('returns')}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between"
                    >
                      <span>Sales Returns</span>
                    </button>
                    <button
                      onClick={() => handleExportSales('product_wise')}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between"
                    >
                      <span>Product-Wise Sales</span>
                    </button>
                    <button
                      onClick={() => handleExportSales('customer_wise')}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between"
                    >
                      <span>Customer-Wise Sales</span>
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={() => handleExportSales('current_view')}
                      className="w-full text-left px-3.5 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center justify-between"
                    >
                      <span>Export Current View</span>
                    </button>
                    <button
                      onClick={() => handleExportSales('full')}
                      className="w-full text-left px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center justify-between"
                    >
                      <span>Full Sales Report (All Sheets)</span>
                    </button>
                  </div>
                )}
              </div>

              <Link href="/sales/returns" className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full justify-center rounded-xl font-bold border-slate-300 text-xs py-2">
                  <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-600" />
                  <span>Returns</span>
                </Button>
              </Link>

              <Link href="/sales/new" className="w-full sm:w-auto">
                <Button size="sm" className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs text-xs py-2">
                  <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                  <span>+ POS Sale</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Filter Bar */}
          <Card className="p-3 sm:p-4 bg-white border border-slate-200/80 shadow-xs space-y-2.5 rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
              {/* Search Box */}
              <div className="sm:col-span-2 lg:col-span-2">
                <Input
                  placeholder="Search invoice #, customer name, phone..."
                  icon={Search}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 text-xs bg-slate-50 border-slate-200 w-full rounded-xl"
                />
              </div>

              {/* Customer Type Filter */}
              <div>
                <Select
                  value={customerTypeFilter}
                  onChange={(e) => setCustomerTypeFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Customer Types' },
                    { value: 'RETAIL', label: 'Retail Customer' },
                    { value: 'WHOLESALE', label: 'Wholesale Buyer' },
                    { value: 'DEALER', label: 'Dealer / Stockist' },
                    { value: 'BUSINESS', label: 'Shop Customer' }
                  ]}
                  className="w-full text-xs h-9 rounded-xl"
                />
              </div>

              {/* Payment Status Filter */}
              <div>
                <Select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Payment Statuses' },
                    { value: 'PAID', label: 'Fully Paid' },
                    { value: 'PARTIAL', label: 'Partial Payment' },
                    { value: 'UNPAID', label: 'Unpaid / Due' }
                  ]}
                  className="w-full text-xs h-9 rounded-xl"
                />
              </div>

              {/* Payment Method Filter */}
              <div>
                <Select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Payment Methods' },
                    { value: 'CASH', label: 'Cash' },
                    { value: 'UPI', label: 'UPI / QR' },
                    { value: 'CARD', label: 'Debit / Credit Card' },
                    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                    { value: 'CREDIT', label: 'Credit Account' }
                  ]}
                  className="w-full text-xs h-9 rounded-xl"
                />
              </div>
            </div>

            {/* Sub-row with Invoice Date picker and Active Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-bold text-[10px] sm:text-[11px] uppercase tracking-wider">Date:</span>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {dateFilter && (
                  <button
                    type="button"
                    onClick={() => setDateFilter('')}
                    className="text-[11px] text-rose-600 hover:underline font-bold"
                  >
                    Clear Date
                  </button>
                )}
              </div>

              {(search || customerTypeFilter || paymentStatusFilter || paymentMethodFilter || dateFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setCustomerTypeFilter('');
                    setPaymentStatusFilter('');
                    setPaymentMethodFilter('');
                    setDateFilter('');
                  }}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  Reset All Invoice Filters
                </button>
              )}
            </div>
          </Card>

          {/* Grouped Parent-Child Table */}
          {isLoading ? (
            <div className="flex justify-center p-16">
              <Spinner size="lg" className="text-blue-600" />
            </div>
          ) : groupedCustomers.length === 0 ? (
            <Card className="p-12 text-center bg-white border border-slate-200">
              <EmptyState
                icon={FileText}
                title="No Sales Invoices Found"
                description="Issued customer invoices will appear here grouped by parent customer."
                action={
                  <Link href="/sales/new">
                    <Button size="sm" className="bg-blue-600 text-white font-bold">Issue New Sale</Button>
                  </Link>
                }
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {groupedCustomers.map((group) => {
                const isCustExpanded = expandedCustomerIds.has(group.customerId);

                return (
                  <Card key={group.customerId} className="bg-white border border-slate-200/80 shadow-sm overflow-hidden transition">
                    
                    {/* PARENT LEVEL: CUSTOMER ROW */}
                    <div
                      onClick={() => toggleCustomerExpand(group.customerId)}
                      className="p-3 sm:p-4 bg-slate-50/80 hover:bg-slate-100/80 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 border-b border-slate-200/80 select-none"
                    >
                      <div className="flex items-center space-x-2.5 sm:space-x-3">
                        <button className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 transition shrink-0">
                          {isCustExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{group.customerName}</h3>
                            <Badge
                              variant={
                                group.customerType === 'WHOLESALE'
                                  ? 'secondary'
                                  : (group.customerType === 'BUSINESS' || group.customerType === 'SHOP')
                                  ? 'indigo'
                                  : 'default'
                              }
                              className="text-[9px] sm:text-[10px]"
                            >
                              {(group.customerType === 'BUSINESS' || group.customerType === 'SHOP')
                                ? 'SHOP CUSTOMER'
                                : (group.customerType || 'RETAIL')}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] sm:text-[10px] font-bold bg-white text-blue-600 border-blue-200">
                              {group.sales.length} Invoice(s)
                            </Badge>
                          </div>
                          {group.customerPhone && (
                            <div className="text-[11px] sm:text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {group.customerPhone}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Financial Totals for Customer */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:flex items-center gap-2 sm:gap-4 md:gap-6 text-xs text-left sm:text-right pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                        <div className="bg-white md:bg-transparent p-2 md:p-0 rounded-xl border md:border-0 border-slate-100">
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase block">Total Billing</span>
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{formatCurrency(group.totalBilling)}</span>
                        </div>
                        <div className="bg-white md:bg-transparent p-2 md:p-0 rounded-xl border md:border-0 border-slate-100">
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase block">Total Paid</span>
                          <span className="font-extrabold text-emerald-600 text-xs sm:text-sm">{formatCurrency(group.totalPaid)}</span>
                        </div>
                        {group.totalReturned > 0 && (
                          <div className="bg-rose-50/50 md:bg-transparent p-2 md:p-0 rounded-xl border md:border-0 border-rose-100">
                            <span className="text-[9px] sm:text-[10px] font-bold text-rose-500 uppercase block">Returned</span>
                            <span className="font-extrabold text-rose-600 text-xs sm:text-sm">{formatCurrency(group.totalReturned)}</span>
                          </div>
                        )}
                        <div className="bg-white md:bg-transparent p-2 md:p-0 rounded-xl border md:border-0 border-slate-100">
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase block">Total Due</span>
                          <span className={`font-extrabold text-xs sm:text-sm ${group.totalBalance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            {formatCurrency(group.totalBalance)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CHILD LEVEL: INVOICES (RESPONSIVE CARDS ON MOBILE, TABLE ON DESKTOP) */}
                    {isCustExpanded && (
                      <div className="bg-white">
                        {/* MOBILE INVOICES CARD LIST (< md screens) */}
                        <div className="block md:hidden divide-y divide-slate-100 p-2.5 space-y-2.5">
                          {group.sales.map((sale) => {
                            const isInvExpanded = expandedInvoiceIds.has(sale.id);
                            const totalAmt = Number(sale.totalAmount || sale.total_amount || sale.grand_total || 0);
                            const paidAmt = Number(sale.paidAmount || sale.paid_amount || 0);
                            const balAmt = Number(sale.balance_amount ?? sale.balanceAmount ?? (totalAmt - paidAmt));
                            const isReturned = sale.status === 'RETURNED' || sale.is_return || Boolean(sale.notes?.toLowerCase().includes('return'));
                            const isPaid = !isReturned && balAmt <= 0;
                            const items = sale.items || sale.sale_items || [];

                            return (
                              <div
                                key={sale.id}
                                className={`rounded-2xl border p-3 space-y-2.5 transition shadow-2xs ${
                                  isReturned ? 'bg-rose-50/40 border-rose-200' : 'bg-slate-50/60 border-slate-200/90'
                                }`}
                              >
                                {/* Invoice Header: Invoice #, Date, Status */}
                                <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                                  <div className="flex items-center space-x-1.5 flex-wrap">
                                    <span className={`font-mono font-bold text-xs ${isReturned ? 'text-rose-700' : 'text-blue-600'}`}>
                                      {sale.invoiceNumber || sale.invoice_number}
                                    </span>
                                    <Badge variant={sale.invoiceType === 'WHOLESALE' ? 'secondary' : 'default'} className="text-[9px]">
                                      {sale.invoiceType || 'RETAIL'}
                                    </Badge>
                                    {isReturned && (
                                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                                        <RotateCcw className="w-2.5 h-2.5 mr-0.5" />
                                        RETURNED
                                      </span>
                                    )}
                                  </div>

                                  <div>
                                    {isReturned ? (
                                      <Badge variant="danger" className="text-[9px] bg-rose-600 text-white font-extrabold">
                                        RETURNED
                                      </Badge>
                                    ) : (
                                      <Badge variant={isPaid ? 'success' : 'danger'} className="text-[9px]">
                                        {isPaid ? 'PAID' : 'DUE'}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Financial row */}
                                <div className="grid grid-cols-3 gap-1.5 text-xs bg-white p-2 rounded-xl border border-slate-200/60">
                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Total</span>
                                    <span className="font-extrabold text-slate-900 text-xs">{formatCurrency(totalAmt)}</span>
                                    {isReturned && (
                                      <span className="text-[9px] font-bold text-rose-600 block">
                                        Ret: {formatCurrency(sale.returnedAmount || sale.returned_amount || totalAmt)}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Paid</span>
                                    <span className="font-extrabold text-emerald-600 text-xs">{formatCurrency(paidAmt)}</span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Balance</span>
                                    <span className={`font-extrabold text-xs ${balAmt > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                      {formatCurrency(balAmt)}
                                    </span>
                                  </div>
                                </div>

                                {/* Items toggle button + Date */}
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                  <span>Date: {formatDate(sale.createdAt || sale.invoice_date)}</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleInvoiceExpand(sale.id)}
                                    className="text-blue-600 font-bold hover:underline flex items-center"
                                  >
                                    <span>{items.length} Items</span>
                                    {isInvExpanded ? <ChevronDown className="w-3 h-3 ml-0.5" /> : <ChevronRight className="w-3 h-3 ml-0.5" />}
                                  </button>
                                </div>

                                {/* Actions row */}
                                <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-200/50">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSaleForPrint(sale)}
                                    className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg"
                                  >
                                    <Printer className="w-3 h-3 mr-1 text-indigo-600" />
                                    <span>Print</span>
                                  </button>

                                  {isReturned && (sale.items || sale.sale_items || []).every(it => Number(it.returned_quantity || it.returnedQuantity || 0) >= Number(it.original_quantity || it.originalQuantity || it.quantity || 1)) ? (
                                    <span className="inline-flex items-center px-2 py-1 text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-300 rounded-lg">
                                      Fully Returned
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedSaleForReturn(sale)}
                                      className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg"
                                    >
                                      <RotateCcw className="w-3 h-3 mr-1 text-rose-600" />
                                      <span>Return</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setSaleToDelete(sale)}
                                    className="p-1 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Expanded Mobile Line Items */}
                                {isInvExpanded && (
                                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2 mt-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                      Line Items ({items.length})
                                    </p>
                                    <div className="divide-y divide-slate-100 text-xs">
                                      {items.map((item, idx) => {
                                        const origQty = Number(item.original_quantity || item.originalQuantity || item.quantity || 1);
                                        const retQty = Number(item.returned_quantity || item.returnedQuantity || 0);
                                        const unitPrice = Number(item.unitPrice || item.unit_price || 0);
                                        const gstRate = Number(item.gst_percentage || item.taxRate || 5);
                                        const itemRetVal = (retQty > 0)
                                          ? (retQty * unitPrice * (1 + gstRate / 100))
                                          : (isReturned && items.length === 1 ? totalAmt : 0);

                                        return (
                                          <div key={idx} className="py-1.5 flex items-center justify-between">
                                            <div className="min-w-0 pr-2">
                                              <p className="font-bold text-slate-800 truncate">{item.name || item.product_name}</p>
                                              <p className="text-[10px] text-slate-500">
                                                {origQty} pcs • {formatCurrency(unitPrice)} (+{gstRate}% GST)
                                              </p>
                                              {retQty > 0 && (
                                                <span className="text-[9px] text-rose-600 font-bold">
                                                  Returned: {retQty} pcs ({formatCurrency(itemRetVal)})
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-right shrink-0 font-bold text-slate-900">
                                              {formatCurrency(item.totalAmount || item.total_amount)}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* DESKTOP INVOICES TABLE (>= md screens) */}
                        <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[700px]">
                          <thead className="bg-slate-900 text-white font-semibold uppercase text-[10px] tracking-wider">
                            <tr>
                              <th className="py-3 px-4 w-10"></th>
                              <th className="py-3 px-4">Invoice #</th>
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4">Type</th>
                              <th className="py-3 px-4 text-right">Total (₹)</th>
                              <th className="py-3 px-4 text-right">Paid (₹)</th>
                              <th className="py-3 px-4 text-right">Balance (₹)</th>
                              <th className="py-3 px-4 text-center">Status</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {group.sales.map((sale) => {
                              const isInvExpanded = expandedInvoiceIds.has(sale.id);
                              const totalAmt = Number(sale.totalAmount || sale.total_amount || sale.grand_total || 0);
                              const paidAmt = Number(sale.paidAmount || sale.paid_amount || 0);
                              const balAmt = Number(sale.balance_amount ?? sale.balanceAmount ?? (totalAmt - paidAmt));
                              const isReturned = sale.status === 'RETURNED' || sale.is_return || Boolean(sale.notes?.toLowerCase().includes('return'));
                              const isPaid = !isReturned && balAmt <= 0;
                              const items = sale.items || sale.sale_items || [];

                              return (
                                <React.Fragment key={sale.id}>
                                  <tr className={`transition ${isReturned ? 'bg-rose-50/50 hover:bg-rose-100/60' : 'hover:bg-slate-50'}`}>
                                    <td className="py-3.5 px-4">
                                      <button
                                        onClick={() => toggleInvoiceExpand(sale.id)}
                                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                                      >
                                        {isInvExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                      </button>
                                    </td>

                                    <td className="py-3.5 px-4 font-mono font-bold">
                                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                                        <span className={isReturned ? 'text-rose-700' : 'text-blue-600'}>
                                          {sale.invoiceNumber || sale.invoice_number}
                                        </span>
                                        {isReturned && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                                            <RotateCcw className="w-2.5 h-2.5 mr-1" />
                                            RETURNED
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    <td className="py-3.5 px-4 text-slate-500 font-semibold">
                                      {formatDate(sale.createdAt || sale.invoice_date)}
                                    </td>

                                    <td className="py-3.5 px-4">
                                      <Badge variant={sale.invoiceType === 'WHOLESALE' ? 'secondary' : 'default'} className="text-[10px]">
                                        {sale.invoiceType || 'RETAIL'}
                                      </Badge>
                                    </td>

                                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                                      <div>{formatCurrency(totalAmt)}</div>
                                      {isReturned && (
                                        <div className="text-[10px] font-bold text-rose-600">
                                          Returned: {formatCurrency(sale.returnedAmount || sale.returned_amount || totalAmt)}
                                        </div>
                                      )}
                                    </td>

                                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                                      {formatCurrency(paidAmt)}
                                    </td>

                                    <td className="py-3.5 px-4 text-right font-extrabold text-rose-600">
                                      {formatCurrency(balAmt)}
                                    </td>

                                    <td className="py-3.5 px-4 text-center">
                                      {isReturned ? (
                                        <Badge variant="danger" className="text-[10px] bg-rose-600 text-white font-extrabold">
                                          RETURNED
                                        </Badge>
                                      ) : (
                                        <Badge variant={isPaid ? 'success' : 'danger'} className="text-[10px]">
                                          {isPaid ? 'PAID' : 'DUE'}
                                        </Badge>
                                      )}
                                    </td>

                                    <td className="py-3.5 px-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedSaleForPrint(sale)}
                                          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-all"
                                        >
                                          <Printer className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                                          View / Print
                                        </button>

                                        {isReturned && (sale.items || sale.sale_items || []).every(it => Number(it.returned_quantity || it.returnedQuantity || 0) >= Number(it.original_quantity || it.originalQuantity || it.quantity || 1)) ? (
                                          <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-100/90 border border-rose-300 rounded-lg">
                                            <RotateCcw className="w-3 h-3 mr-1 text-rose-600" />
                                            Fully Returned
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => setSelectedSaleForReturn(sale)}
                                            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50/80 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition-all cursor-pointer shadow-2xs"
                                            title="Process Itemized Return & Refund"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                                            Return
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => setSaleToDelete(sale)}
                                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 rounded-lg transition-all"
                                          title="Delete Invoice"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
                                          <span className="ml-1 hidden sm:inline">Delete</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>

                                  {/* GRANDCHILD LEVEL: LINE ITEMS BREAKDOWN */}
                                  {isInvExpanded && (
                                    <tr className="bg-slate-50/90">
                                      <td colSpan={9} className="p-3 pl-12 border-b border-slate-200">
                                        <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 shadow-inner">
                                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                                            <span>Invoice Sold Items & Variant Breakdown ({items.length} Items)</span>
                                            <span className="font-mono text-blue-600">Invoice: #{sale.invoiceNumber || sale.invoice_number}</span>
                                          </div>
                                          {items.length === 0 ? (
                                            <div className="p-3 text-slate-400 text-xs italic">No line items recorded for this invoice.</div>
                                          ) : (
                                            <div className="overflow-x-auto">
                                              <table className="w-full text-left text-xs min-w-[650px]">
                                                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                                                <tr>
                                                  <th className="p-2">Product Name</th>
                                                  <th className="p-2">Variant / Specs</th>
                                                  <th className="p-2 text-center">Original Qty</th>
                                                  <th className="p-2 text-center">Returned Qty</th>
                                                  <th className="p-2 text-center">Remaining Qty</th>
                                                  <th className="p-2 text-right">Unit Price</th>
                                                  <th className="p-2 text-right">GST %</th>
                                                  <th className="p-2 text-right">Total Item Amount</th>
                                                  <th className="p-2 text-right">Returned Value</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-100">
                                                {items.map((item, idx) => {
                                                  let varText = 'Standard';
                                                  if (item.color || item.size) {
                                                    varText = [item.color, item.size].filter(Boolean).join(' / ');
                                                  }
                                                  const origQty = Number(item.original_quantity || item.originalQuantity || item.quantity || 1);
                                                  const retQty = Number(item.returned_quantity || item.returnedQuantity || 0);
                                                  const remQty = Math.max(0, origQty - retQty);
                                                  const unitPrice = Number(item.unitPrice || item.unit_price || 0);
                                                  const gstRate = Number(item.gst_percentage || item.taxRate || 5);
                                                  const itemRetVal = (retQty > 0)
                                                    ? (retQty * unitPrice * (1 + gstRate / 100))
                                                    : (isReturned && items.length === 1 ? totalAmt : 0);

                                                  return (
                                                    <tr key={idx} className="hover:bg-slate-50">
                                                      <td className="p-2 font-bold text-slate-800">{item.name || item.product_name}</td>
                                                      <td className="p-2 text-slate-600">{varText}</td>
                                                      <td className="p-2 text-center font-bold text-slate-700">{origQty} PCS</td>
                                                      <td className="p-2 text-center font-bold">
                                                        {retQty > 0 ? (
                                                          <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md font-extrabold text-[11px]">
                                                            {retQty} PCS Returned
                                                          </span>
                                                        ) : isReturned ? (
                                                          <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md font-extrabold text-[11px]">
                                                            {origQty} PCS Returned
                                                          </span>
                                                        ) : (
                                                          <span className="text-slate-400 font-normal">0</span>
                                                        )}
                                                      </td>
                                                      <td className="p-2 text-center font-extrabold text-emerald-600">
                                                        <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md">
                                                          {isReturned && retQty === 0 ? 0 : remQty} PCS Remaining
                                                        </span>
                                                      </td>
                                                      <td className="p-2 text-right font-mono">{formatCurrency(unitPrice)}</td>
                                                      <td className="p-2 text-right font-mono text-slate-500">{gstRate}%</td>
                                                      <td className="p-2 text-right font-extrabold text-slate-900">{formatCurrency(item.totalAmount || item.total_amount)}</td>
                                                      <td className="p-2 text-right font-bold">
                                                        {itemRetVal > 0 ? (
                                                          <span className="text-rose-600 font-mono font-extrabold">
                                                            {formatCurrency(itemRetVal)}
                                                          </span>
                                                        ) : (
                                                          <span className="text-slate-400 font-mono">-</span>
                                                        )}
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}

                                          {/* Return & Customer Refund History for Invoice */}
                                          {sale.returnHistory && sale.returnHistory.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-1.5 text-rose-700 font-extrabold text-[10.5px] uppercase tracking-wider">
                                                  <RotateCcw className="w-3.5 h-3.5" />
                                                  <span>Sales Return & Customer Refund Records ({sale.returnHistory.length})</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500">
                                                  Total Refunded: <strong className="text-rose-600 font-mono font-black">{formatCurrency(sale.returnedAmount || 0)}</strong>
                                                </span>
                                              </div>

                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {sale.returnHistory.map((ret, rIdx) => (
                                                  <div key={rIdx} className="p-2.5 bg-rose-50/60 border border-rose-200/80 rounded-xl space-y-1 text-xs">
                                                    <div className="flex items-center justify-between">
                                                      <span className="font-mono font-black text-blue-700 text-[11px]">{ret.returnRef}</span>
                                                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                                                        ret.refundStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                      }`}>
                                                        {ret.refundStatus || 'COMPLETED'}
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                                                      <span>Method: <strong className="text-slate-800">{ret.refundMethod || 'CASH'}</strong></span>
                                                      <span className="font-mono font-extrabold text-rose-700">{formatCurrency(ret.refundAmount || 0)}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5 border-t border-rose-100">
                                                      <span className="truncate max-w-[200px]" title={ret.reason}>Reason: {ret.reason || 'Customer Return'}</span>
                                                      <span>{formatDate(ret.returnedAt)}</span>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          <ConfirmModal
            isOpen={!!saleToDelete}
            onClose={() => setSaleToDelete(null)}
            onConfirm={handleConfirmDelete}
            title="Delete Invoice?"
            description={`Are you sure you want to delete invoice ${saleToDelete?.invoiceNumber || saleToDelete?.invoice_number || ''}? This action will permanently remove the sale record and restore stock quantities.`}
            confirmText="Delete Invoice"
            cancelText="Keep Invoice"
            isDanger={true}
            isLoading={isDeleting}
          />

          {/* Print Modal */}
          <Modal
            isOpen={!!selectedSaleForPrint}
            onClose={() => setSelectedSaleForPrint(null)}
            title={`Invoice Details - ${selectedSaleForPrint?.invoiceNumber || selectedSaleForPrint?.invoice_number}`}
            size="xl"
          >
            <InvoicePrintTemplate sale={selectedSaleForPrint} onClose={() => setSelectedSaleForPrint(null)} />
          </Modal>

          {/* Sales Return & Refund Modal */}
          <SalesReturnModal
            isOpen={!!selectedSaleForReturn}
            onClose={() => setSelectedSaleForReturn(null)}
            sale={selectedSaleForReturn}
            onReturnSuccess={() => {
              fetchSales();
            }}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
