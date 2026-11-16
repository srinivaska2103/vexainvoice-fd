'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Eye, 
  Edit3, 
  Trash2, 
  Printer, 
  Send, 
  Filter, 
  Calendar, 
  Download, 
  RefreshCw,
  Clock,
  XCircle,
  FileSpreadsheet,
  Check,
  Building,
  SlidersHorizontal
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { quotationService } from '@/services/quotationService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { DatePicker } from '@/components/ui/DatePicker';
import QuotationPreviewModal from '@/components/quotations/QuotationPreviewModal';
import CreateQuotationModal from '@/components/quotations/CreateQuotationModal';

export default function QuotationsPage() {
  const router = useRouter();
  const { toastSuccess, toastError, confirm } = useToast();

  // Quotation List & Filter State
  const [quotations, setQuotations] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    converted: 0,
    totalValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [previewQuotation, setPreviewQuotation] = useState(null);

  // Initial Load
  useEffect(() => {
    fetchQuotations();
    fetchMetrics();
  }, [statusFilter, startDate, endDate]);

  const fetchMetrics = async () => {
    try {
      setMetricsLoading(true);
      const res = await quotationService.getMetrics();
      if (res.data || res) {
        setMetrics(res.data || res);
      }
    } catch (err) {
      console.warn('Failed to fetch quotation metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchTerm) params.search = searchTerm;

      const res = await quotationService.getQuotations(params);
      const list = res.quotations || res.data || res || [];
      setQuotations(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      toastError('Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  };

  // Convert to Sale action
  const handleConvertToSale = async (qtn) => {
    const isConfirmed = await confirm({
      title: 'Convert Quotation to Sale?',
      message: `Do you want to open Quotation #${qtn.quotation_number} in the POS counter to review and complete the sale?`,
      confirmText: 'Open in POS',
      cancelText: 'Cancel'
    });

    if (isConfirmed) {
      router.push(`/sales/new?quotationId=${qtn.id}`);
    }
  };

  // Change Status (Accept / Reject)
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await quotationService.updateStatus(id, newStatus);
      toastSuccess(`Quotation marked as ${newStatus}`);
      fetchQuotations();
      fetchMetrics();
    } catch (err) {
      toastError(err.message || 'Failed to update status');
    }
  };

  // Delete Quotation
  const handleDeleteQuotation = async (qtn) => {
    const isConfirmed = await confirm({
      title: 'Delete Quotation?',
      message: `Are you sure you want to permanently delete quotation #${qtn.quotation_number}? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (isConfirmed) {
      try {
        await quotationService.deleteQuotation(qtn.id);
        toastSuccess(`Quotation #${qtn.quotation_number} deleted successfully`);
        fetchQuotations();
        fetchMetrics();
      } catch (err) {
        toastError(err.message || 'Failed to delete quotation');
      }
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (quotations.length === 0) {
      toastError('No quotation data to export');
      return;
    }

    const headers = ['Quotation No', 'Customer Name', 'Phone', 'Date', 'Valid Until', 'Items', 'Total Amount', 'Status'];
    const rows = quotations.map(q => [
      `"${q.quotation_number || ''}"`,
      `"${q.customer?.name || q.customers?.name || 'Walk-in Client'}"`,
      `"${q.customer?.phone || q.customers?.phone || ''}"`,
      `"${q.quotation_date ? new Date(q.quotation_date).toLocaleDateString() : ''}"`,
      `"${q.valid_until ? new Date(q.valid_until).toLocaleDateString() : ''}"`,
      q.items_count || (q.items ? q.items.length : 0),
      Number(q.grand_total || q.total_amount || 0).toFixed(2),
      `"${q.status || 'DRAFT'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Quotations_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Quotations exported successfully!');
  };

  // Filtered in-memory search
  const filtered = quotations.filter((q) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const qNum = (q.quotation_number || '').toLowerCase();
    const custName = (q.customer?.name || q.customers?.name || '').toLowerCase();
    const custPhone = (q.customer?.phone || q.customers?.phone || '').toLowerCase();
    const hasProduct = (q.items || q.quotation_items || []).some(
      (it) => (it.product_name || it.name || '').toLowerCase().includes(term)
    );
    return qNum.includes(term) || custName.includes(term) || custPhone.includes(term) || hasProduct;
  });

  // Render Status Badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">ACCEPTED</span>;
      case 'SENT':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">SENT</span>;
      case 'CONVERTED':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">CONVERTED</span>;
      case 'EXPIRED':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">EXPIRED</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">REJECTED</span>;
      case 'DRAFT':
      default:
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">DRAFT</span>;
    }
  };

  return (
    <ProtectedRoute permissions={['quotations.view']}>
      <DashboardLayout>
        <div className="space-y-6">
          
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <FileText className="w-6 h-6 text-blue-600 shrink-0" />
                <span>Price Quotations & Estimates</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage commercial proposals, client estimates and convert directly to confirmed sale invoices
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="w-full sm:w-auto justify-center flex items-center space-x-1.5 border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold py-2.5"
              >
                <Download className="w-4 h-4 text-slate-500 mr-1" />
                <span>Export CSV</span>
              </Button>

              <Button
                onClick={() => {
                  setEditingQuotation(null);
                  setIsCreateModalOpen(true);
                }}
                className="w-full sm:w-auto justify-center flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-bold rounded-xl py-2.5"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span>New Quotation</span>
              </Button>
            </div>
          </div>

          {/* KPI Summary Metrics Cards (Interactive Filters) */}
          <div className="flex md:grid md:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            {/* Total Quotations */}
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`min-w-[130px] md:min-w-0 p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer shrink-0 md:shrink ${
                statusFilter === 'ALL'
                  ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Quotes</p>
              <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 sm:mt-1">{metricsLoading ? '...' : metrics.total}</p>
              <p className="text-[10px] text-blue-600 font-semibold mt-0.5">{formatCurrency(metrics.totalValue || 0)}</p>
            </button>

            {/* Draft */}
            <button
              type="button"
              onClick={() => setStatusFilter('DRAFT')}
              className={`min-w-[110px] md:min-w-0 p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer shrink-0 md:shrink ${
                statusFilter === 'DRAFT'
                  ? 'bg-slate-100 border-slate-600 ring-2 ring-slate-400/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">Draft</p>
              <p className="text-lg sm:text-xl font-black text-slate-700 mt-0.5 sm:mt-1">{metricsLoading ? '...' : metrics.draft}</p>
              <span className="text-[10px] text-slate-400">Unsent</span>
            </button>

            {/* Sent */}
            <button
              type="button"
              onClick={() => setStatusFilter('SENT')}
              className={`min-w-[110px] md:min-w-0 p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer shrink-0 md:shrink ${
                statusFilter === 'SENT'
                  ? 'bg-blue-100/60 border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                  : 'bg-white border-blue-200 bg-blue-50/20 hover:border-blue-300 hover:shadow-xs'
              }`}
            >
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-600">Sent</p>
              <p className="text-lg sm:text-xl font-black text-blue-700 mt-0.5 sm:mt-1">{metricsLoading ? '...' : metrics.sent}</p>
              <span className="text-[10px] text-blue-500">Dispatched</span>
            </button>

            {/* Accepted */}
            <button
              type="button"
              onClick={() => setStatusFilter('ACCEPTED')}
              className={`min-w-[110px] md:min-w-0 p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer shrink-0 md:shrink ${
                statusFilter === 'ACCEPTED'
                  ? 'bg-emerald-100/60 border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-white border-emerald-200 bg-emerald-50/20 hover:border-emerald-300 hover:shadow-xs'
              }`}
            >
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600">Accepted</p>
              <p className="text-lg sm:text-xl font-black text-emerald-700 mt-0.5 sm:mt-1">{metricsLoading ? '...' : metrics.accepted}</p>
              <span className="text-[10px] text-emerald-500">Confirmed</span>
            </button>

            {/* Rejected */}
            <button
              type="button"
              onClick={() => setStatusFilter('REJECTED')}
              className={`min-w-[110px] md:min-w-0 p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer shrink-0 md:shrink ${
                statusFilter === 'REJECTED'
                  ? 'bg-rose-100/60 border-rose-600 ring-2 ring-rose-500/20 shadow-sm'
                  : 'bg-white border-rose-200 bg-rose-50/20 hover:border-rose-300 hover:shadow-xs'
              }`}
            >
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-600">Rejected</p>
              <p className="text-lg sm:text-xl font-black text-rose-700 mt-0.5 sm:mt-1">{metricsLoading ? '...' : metrics.rejected}</p>
              <span className="text-[10px] text-rose-500">Declined</span>
            </button>

            {/* Expired */}
            <button
              type="button"
              onClick={() => setStatusFilter('EXPIRED')}
              className={`min-w-[110px] md:min-w-0 p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer shrink-0 md:shrink ${
                statusFilter === 'EXPIRED'
                  ? 'bg-amber-100/60 border-amber-600 ring-2 ring-amber-500/20 shadow-sm'
                  : 'bg-white border-amber-200 bg-amber-50/20 hover:border-amber-300 hover:shadow-xs'
              }`}
            >
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-600">Expired</p>
              <p className="text-lg sm:text-xl font-black text-amber-700 mt-0.5 sm:mt-1">{metricsLoading ? '...' : metrics.expired}</p>
              <span className="text-[10px] text-amber-500">Past validity</span>
            </button>

            {/* Converted to Sale */}
            <button
              type="button"
              onClick={() => setStatusFilter('CONVERTED')}
              className={`min-w-[180px] md:min-w-0 md:col-span-2 p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between shrink-0 md:shrink ${
                statusFilter === 'CONVERTED'
                  ? 'bg-purple-100/70 border-purple-600 ring-2 ring-purple-500/20 shadow-sm'
                  : 'bg-gradient-to-br from-purple-50 to-indigo-50/40 border-purple-200 hover:border-purple-300 hover:shadow-xs'
              }`}
            >
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-purple-700">Converted to Sale</p>
                <p className="text-lg sm:text-xl font-black text-purple-900 mt-0.5 sm:mt-1">{metricsLoading ? '...' : metrics.converted}</p>
                <span className="text-[10px] text-purple-600 font-medium">Billed Invoices</span>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-200/60 flex items-center justify-center text-purple-700 shrink-0">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-center">
              
              {/* Search Box */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search quotation #, customer, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>

              {/* Interactive Date Pickers */}
              <div className="md:col-span-4 grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-2">
                <div className="w-full min-w-0">
                  <DatePicker
                    value={startDate}
                    onChange={(val) => setStartDate(val)}
                    placeholder="From Date"
                    className="w-full text-xs"
                  />
                </div>
                <span className="text-slate-400 text-xs font-semibold px-0.5">to</span>
                <div className="w-full min-w-0">
                  <DatePicker
                    value={endDate}
                    onChange={(val) => setEndDate(val)}
                    placeholder="To Date"
                    className="w-full text-xs"
                  />
                </div>
              </div>

              {/* Action buttons (Reset & Refresh) */}
              <div className="md:col-span-3 flex items-center justify-between sm:justify-end gap-2">
                {(startDate || endDate || searchTerm || statusFilter !== 'ALL') ? (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('ALL');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1"
                  >
                    Reset Filters
                  </button>
                ) : <div className="hidden sm:block" />}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fetchQuotations();
                    fetchMetrics();
                  }}
                  className="text-xs text-slate-600 px-3 py-1.5 rounded-xl ml-auto sm:ml-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto pt-2 border-t border-slate-100 text-xs no-scrollbar">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Filter:</span>
              {['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'CONVERTED', 'EXPIRED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold text-[11px] sm:text-xs whitespace-nowrap transition shrink-0 ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All Quotations' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Quotations Table */}
          {loading ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-semibold">Loading Quotations...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-base font-bold text-slate-800">No price quotations found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No quotations match your search or filter criteria. Create a new quotation to get started.
              </p>
              <Button
                onClick={() => {
                  setEditingQuotation(null);
                  setIsCreateModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span>Create First Quotation</span>
              </Button>
            </div>
          ) : (
            <>
              {/* MOBILE CARD VIEW (< md screens) */}
              <div className="block md:hidden space-y-3">
                {filtered.map((q) => {
                  const cust = q.customer || q.customers || { name: 'Walk-in Client' };
                  const itemsList = q.items || q.quotation_items || [];
                  const isExpired = q.status === 'EXPIRED';

                  return (
                    <div
                      key={q.id}
                      className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3"
                    >
                      {/* Card Header: Quotation # and Status */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {q.quotation_number || q.id?.slice(0, 8)}
                          </span>
                          <p className="text-[10px] text-slate-400">Date: {formatDate(q.quotation_date || q.created_at)}</p>
                        </div>
                        <div>
                          {renderStatusBadge(q.status)}
                        </div>
                      </div>

                      {/* Card Body: Customer & Amount Details */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Customer</span>
                          <p className="font-bold text-slate-900 truncate">{cust.name || 'Walk-in Client'}</p>
                          {cust.phone && <p className="text-[10px] text-slate-500 font-mono">{cust.phone}</p>}
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Amount</span>
                          <p className="font-black text-slate-900 text-base">
                            {formatCurrency(q.grand_total || q.total_amount || 0)}
                          </p>
                          <span className="text-[10px] text-slate-500 font-semibold">{itemsList.length} items</span>
                        </div>
                      </div>

                      {/* Valid Until Notice */}
                      {q.valid_until && (
                        <div className="text-[11px] bg-slate-50 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                          <span className="text-slate-500">Valid Until:</span>
                          <span className={`font-bold ${isExpired ? 'text-amber-700' : 'text-slate-700'}`}>
                            {formatDate(q.valid_until)}
                          </span>
                        </div>
                      )}

                      {/* Mobile Actions Toolbar */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                        <div className="flex items-center space-x-1">
                          {/* Preview & Download */}
                          <button
                            onClick={() => setPreviewQuotation(q)}
                            title="Preview / Print"
                            className="p-2 rounded-xl text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setPreviewQuotation(q)}
                            title="Download PDF"
                            className="p-2 rounded-xl text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Send */}
                          {q.status !== 'CONVERTED' && q.status !== 'SENT' && (
                            <button
                              onClick={() => handleUpdateStatus(q.id, 'SENT')}
                              title="Mark Sent"
                              className="p-2 rounded-xl text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit */}
                          {q.status !== 'CONVERTED' && (
                            <button
                              onClick={() => {
                                setEditingQuotation(q);
                                setIsCreateModalOpen(true);
                              }}
                              title="Edit"
                              className="p-2 rounded-xl text-slate-600 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          {/* Convert button */}
                          {q.status !== 'CONVERTED' && (
                            <button
                              onClick={() => handleConvertToSale(q)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center space-x-1"
                            >
                              <span>Convert to POS</span>
                              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                            </button>
                          )}

                          {/* Delete */}
                          {q.status !== 'CONVERTED' && (
                            <button
                              onClick={() => handleDeleteQuotation(q)}
                              title="Delete"
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW (>= md screens) */}
              <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200 text-[10px]">
                      <tr>
                        <th className="p-4">Quotation #</th>
                        <th className="p-4">Customer Details</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Valid Until</th>
                        <th className="p-4 text-center">Items</th>
                        <th className="p-4 text-right">Total Amount (₹)</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((q) => {
                        const cust = q.customer || q.customers || { name: 'Walk-in Client' };
                        const itemsList = q.items || q.quotation_items || [];
                        const isExpired = q.status === 'EXPIRED';

                        return (
                          <tr key={q.id} className="hover:bg-slate-50/70 transition">
                            <td className="p-4">
                              <span className="font-mono font-bold text-slate-900 text-xs">
                                {q.quotation_number || q.id?.slice(0, 8)}
                              </span>
                              <p className="text-[10px] text-slate-400">ID: {q.id?.slice(0, 6)}...</p>
                            </td>

                            <td className="p-4">
                              <p className="font-bold text-slate-900">{cust.name || 'Walk-in Client'}</p>
                              {cust.phone && <p className="text-[10px] text-slate-500">Ph: {cust.phone}</p>}
                            </td>

                            <td className="p-4 text-slate-600 font-medium">
                              {formatDate(q.quotation_date || q.created_at)}
                            </td>

                            <td className="p-4">
                              {q.valid_until ? (
                                <span className={`font-medium ${isExpired ? 'text-amber-700 font-bold' : 'text-slate-600'}`}>
                                  {formatDate(q.valid_until)}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            <td className="p-4 text-center">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700 text-[11px]">
                                {itemsList.length} items
                              </span>
                            </td>

                            <td className="p-4 text-right">
                              <p className="font-black text-slate-900 text-sm">
                                {formatCurrency(q.grand_total || q.total_amount || 0)}
                              </p>
                            </td>

                            <td className="p-4 text-center">
                              {renderStatusBadge(q.status)}
                            </td>

                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                {/* Preview & Download PDF */}
                                <button
                                  onClick={() => setPreviewQuotation(q)}
                                  title="View & Download PDF / Print"
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => setPreviewQuotation(q)}
                                  title="Download as PDF"
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                >
                                  <Download className="w-4 h-4" />
                                </button>

                                {/* Mark as SENT action (if DRAFT or REJECTED) */}
                                {q.status !== 'CONVERTED' && q.status !== 'SENT' && (
                                  <button
                                    onClick={() => handleUpdateStatus(q.id, 'SENT')}
                                    title="Mark as Sent to Client"
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Edit (only if not converted) */}
                                {q.status !== 'CONVERTED' && (
                                  <button
                                    onClick={() => {
                                      setEditingQuotation(q);
                                      setIsCreateModalOpen(true);
                                    }}
                                    title="Edit Quotation"
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Convert to Sale */}
                                {q.status !== 'CONVERTED' && (
                                  <button
                                    onClick={() => handleConvertToSale(q)}
                                    title="Convert directly to Sale Invoice in POS"
                                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shadow-xs flex items-center space-x-1"
                                  >
                                    <span>Convert</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                                {/* Reject action (if not converted or rejected) */}
                                {q.status !== 'CONVERTED' && q.status !== 'REJECTED' && (
                                  <button
                                    onClick={() => handleUpdateStatus(q.id, 'REJECTED')}
                                    title="Mark as Rejected"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Delete action (allowed on non-converted quotes) */}
                                {q.status !== 'CONVERTED' && (
                                  <button
                                    onClick={() => handleDeleteQuotation(q)}
                                    title="Delete Quotation"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Quotation Creation & Editing Modal */}
          {isCreateModalOpen && (
            <CreateQuotationModal
              isOpen={isCreateModalOpen}
              onClose={() => {
                setIsCreateModalOpen(false);
                setEditingQuotation(null);
              }}
              initialQuotation={editingQuotation}
              onCreated={() => {
                fetchQuotations();
                fetchMetrics();
              }}
            />
          )}

          {/* Quotation Preview & Printable Modal */}
          {previewQuotation && (
            <QuotationPreviewModal
              quotation={previewQuotation}
              onClose={() => setPreviewQuotation(null)}
              onStatusChanged={() => {
                fetchQuotations();
                fetchMetrics();
              }}
              onConverted={() => {
                fetchQuotations();
                fetchMetrics();
              }}
            />
          )}

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
