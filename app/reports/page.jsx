'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  ReceiptIndianRupee,
  Package,
  Users,
  UserCheck,
  RefreshCw,
  Calendar,
  Filter,
  ShoppingCart,
  Receipt,
  FileSpreadsheet,
  Building2,
  ChevronDown,
  Wallet,
  Boxes,
  FileText,
  Percent,
  RotateCcw,
  Download
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { reportService } from '@/services/reportService';
import { returnService } from '@/services/returnService';
import { exportService } from '@/services/exportService';
import { useToast } from '@/context/ToastContext';

export default function ReportsPage() {
  const { toastSuccess, toastError } = useToast();
  const [data, setData] = useState(null);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState(null);
  const [reportResult, setReportResult] = useState({
    summary: {},
    sales: [],
    salesReturns: [],
    productWiseSales: [],
    customerWiseSales: [],
    monthlyRevenue: []
  });
  const [loading, setLoading] = useState(true);

  // Export State
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportSalesReports = async (exportType) => {
    setIsExportDropdownOpen(false);
    setIsExporting(true);
    toastSuccess('Preparing Excel file...');
    try {
      const params = { exportType };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedMonth && selectedMonth !== 'ALL') params.month = selectedMonth;
      if (selectedYear && selectedYear !== 'ALL') params.year = selectedYear;

      await exportService.exportSales(params);
      toastSuccess('Excel file downloaded successfully.');
    } catch (err) {
      console.error(err);
      toastError(err.message || 'Unable to export sales report.');
    } finally {
      setIsExporting(false);
    }
  };

  // Filters State
  const [activeTab, setActiveTab] = useState('sales'); // 'sales', 'returns', 'products', 'customers', 'monthly'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate, selectedMonth, selectedYear]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedMonth && selectedMonth !== 'ALL') params.month = selectedMonth;
      if (selectedYear && selectedYear !== 'ALL') params.year = selectedYear;

      const [dashRes, salesRes, returnsRes] = await Promise.allSettled([
        reportService.getDashboardSummary(params),
        reportService.getSalesReport(params),
        returnService.getSalesReturns(params)
      ]);

      if (dashRes.status === 'fulfilled') {
        const dVal = dashRes.value;
        setData((dVal && (dVal.todaySalesAmount !== undefined || dVal.totalStockValue !== undefined)) ? dVal : (dVal?.data || dVal));
      }
      
      const returnsDataList = returnsRes.status === 'fulfilled' ? (returnsRes.value?.data || returnsRes.value || []) : [];

      if (salesRes.status === 'fulfilled') {
        const rawVal = salesRes.value;
        const raw = (rawVal && (rawVal.summary || rawVal.sales)) 
          ? rawVal 
          : ((rawVal?.data && (rawVal.data.summary || rawVal.data.sales)) ? rawVal.data : rawVal);

        setReportResult({
          summary: raw?.summary || {},
          sales: Array.isArray(raw?.sales) ? raw.sales : (Array.isArray(raw) ? raw : []),
          salesReturns: Array.isArray(returnsDataList) ? returnsDataList : [],
          productWiseSales: Array.isArray(raw?.productWiseSales) ? raw.productWiseSales : [],
          customerWiseSales: Array.isArray(raw?.customerWiseSales) ? raw.customerWiseSales : [],
          monthlyRevenue: Array.isArray(raw?.monthlyRevenue) ? raw.monthlyRevenue : []
        });
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (presetKey) => {
    const today = new Date();
    if (presetKey === 'TODAY') {
      const formatted = today.toISOString().split('T')[0];
      setStartDate(formatted);
      setEndDate(formatted);
      setSelectedMonth('ALL');
      setSelectedYear('ALL');
    } else if (presetKey === 'THIS_MONTH') {
      setStartDate('');
      setEndDate('');
      setSelectedMonth(String(today.getMonth() + 1));
      setSelectedYear(String(today.getFullYear()));
    } else if (presetKey === 'THIS_YEAR') {
      setStartDate('');
      setEndDate('');
      setSelectedMonth('ALL');
      setSelectedYear(String(today.getFullYear()));
    } else if (presetKey === 'ALL') {
      setStartDate('');
      setEndDate('');
      setSelectedMonth('ALL');
      setSelectedYear('ALL');
    }
  };

  const monthsList = [
    { value: 'ALL', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const currentYr = new Date().getFullYear();
  const yearsList = [
    { value: 'ALL', label: 'All Years' },
    { value: String(currentYr), label: String(currentYr) },
    { value: String(currentYr - 1), label: String(currentYr - 1) },
    { value: String(currentYr - 2), label: String(currentYr - 2) },
    { value: String(currentYr - 3), label: String(currentYr - 3) }
  ];

  const safeSalesList = reportResult.sales || [];
  const salesReturnsList = reportResult.salesReturns || [];
  const productSalesList = reportResult.productWiseSales || [];
  const customerSalesList = reportResult.customerWiseSales || [];
  const monthlyRevenueList = reportResult.monthlyRevenue || [];

  const totalRevenue = reportResult.summary.totalSalesAmount || data?.totalRevenue || data?.sales_total || 0;
  const totalInvoices = reportResult.summary.totalInvoices || safeSalesList.length || 0;
  const totalGstValue = reportResult.summary.totalTaxAmount || 0;
  const totalReceivables = data?.totalCustomerOutstanding || data?.outstandingBalance || reportResult.summary.totalBalanceAmount || 0;
  const stockValuation = data?.totalStockValue || data?.stockValuation || 0;
  const totalSalesReturnsValue = salesReturnsList.reduce((sum, r) => sum + Number(r.totalAmount || r.grand_total || r.total_amount || 0), 0);

  return (
    <ProtectedRoute permissions={['reports.sales', 'reports.purchases', 'reports.stock', 'reports.customers', 'reports.suppliers', 'reports.payments']}>
      <DashboardLayout>
        <div className="space-y-6 pb-16">
          {/* Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span>Business Reports & Analytics</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Comprehensive revenue insights, product sales performance, customer analytics, and date filtering.
              </p>
            </div>

            <div className="flex items-center space-x-2.5 self-start lg:self-auto">
              <div className="relative">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-extrabold text-xs shadow-md transition disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Preparing Excel...' : '↓ Export Excel'}</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                </button>

                {isExportDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 border-b border-slate-100">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Export Report Data</p>
                    </div>
                    <button
                      onClick={() => handleExportSalesReports('transactions')}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      Sales Transactions
                    </button>
                    <button
                      onClick={() => handleExportSalesReports('returns')}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      Sales Returns
                    </button>
                    <button
                      onClick={() => handleExportSalesReports('product_wise')}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      Product-Wise Sales
                    </button>
                    <button
                      onClick={() => handleExportSalesReports('customer_wise')}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      Customer-Wise Sales
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={() => handleExportSalesReports('full')}
                      className="w-full text-left px-3.5 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-50"
                    >
                      Full Sales Report (All Sheets)
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={fetchReportData}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-semibold transition text-xs shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <span>Filter & Date Controls</span>
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('ALL')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition"
                >
                  All Time
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('TODAY')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('THIS_MONTH')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('THIS_YEAR')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                >
                  This Year
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Filter by Month
                </label>
                <Select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setStartDate('');
                    setEndDate('');
                  }}
                  options={monthsList}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Filter by Year
                </label>
                <Select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setStartDate('');
                    setEndDate('');
                  }}
                  options={yearsList}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  From Date
                </label>
                <DatePicker
                  placeholder="Select From Date"
                  value={startDate}
                  onChange={(val) => {
                    setStartDate(val);
                    setSelectedMonth('ALL');
                    setSelectedYear('ALL');
                  }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  To Date
                </label>
                <DatePicker
                  placeholder="Select To Date"
                  value={endDate}
                  onChange={(val) => {
                    setEndDate(val);
                    setSelectedMonth('ALL');
                    setSelectedYear('ALL');
                  }}
                />
              </div>
            </div>
          </div>

          {/* Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                ₹{Number(totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-xs text-emerald-600 font-bold flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Active Revenue Period
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Invoices</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <ReceiptIndianRupee className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {totalInvoices}
              </div>
              <span className="text-xs text-blue-600 font-bold">Completed Transactions</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total GST Value</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-indigo-600">
                ₹{Number(totalGstValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-xs text-indigo-600 font-bold">Collected Tax Liability</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer Receivables</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-amber-600">
                ₹{Number(totalReceivables).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-xs text-amber-700 font-bold">Uncollected Payments</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Valuation</span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                  <Boxes className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                ₹{Number(stockValuation).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-xs text-purple-600 font-bold">Inventory Asset Value</span>
            </div>

            {/* CARD 6: SALES RETURNS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sales Returns</span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                  <RotateCcw className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-rose-600">
                ₹{Number(totalSalesReturnsValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-xs text-rose-600 font-bold flex items-center">
                {salesReturnsList.length} Restocked Returns
              </span>
            </div>
          </div>

          {/* VISUAL ANALYTICS & CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Chart 1: Revenue Trend Bar Chart (8 Cols) */}
            <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Revenue Trend & Monthly Analytics
                    </h3>
                    <p className="text-[11px] text-slate-400">Visual breakdown of total sales performance over time</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                  {monthlyRevenueList.length} Period Records
                </span>
              </div>

              {monthlyRevenueList.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  <BarChart3 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-600">No revenue trend data for selected filter</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try selecting "All Time" preset to view complete revenue trends.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100 bg-slate-50/50 rounded-xl">
                    {monthlyRevenueList.slice(0, 12).map((m, idx) => {
                      const maxRev = Math.max(...monthlyRevenueList.map(item => Number(item.totalRevenue || item.revenue || item.totalAmount || 0)), 1);
                      const currentVal = Number(m.totalRevenue || m.revenue || m.totalAmount || 0);
                      const heightPercent = Math.min(Math.max(Math.round((currentVal / maxRev) * 85), 25), 95);
                      const label = m.monthLabel || m.monthName || m.month || `M${idx + 1}`;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative max-w-[120px]">
                          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-md shadow-lg pointer-events-none whitespace-nowrap z-20">
                            {label}: ₹{currentVal.toLocaleString('en-IN')}
                          </div>
                          
                          <div
                            className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 rounded-t-lg transition-all duration-300 shadow-xs relative"
                            style={{ height: `${heightPercent}%` }}
                          >
                            <span className="text-[9px] font-black text-white absolute inset-x-0 bottom-1.5 text-center truncate px-0.5">
                              {currentVal > 0 ? `₹${currentVal}` : ''}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 mt-2 truncate w-full text-center">
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Chart 2: Top Products Share (4 Cols) */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Top Products Share
                    </h3>
                    <p className="text-[11px] text-slate-400">Revenue contribution by product</p>
                  </div>
                </div>
              </div>

              {productSalesList.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-600">No product sales share data</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {productSalesList.slice(0, 5).map((p, idx) => {
                    const maxProdRev = Math.max(...productSalesList.map(item => Number(item.totalRevenue || 0)), 1);
                    const prodRev = Number(p.totalRevenue || 0);
                    const percent = Math.max(Math.round((prodRev / maxProdRev) * 100), 5);
                    const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-emerald-600', 'bg-amber-600'];

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 line-clamp-1 truncate max-w-[160px]">
                            {p.product_name || p.name || 'Product'}
                          </span>
                          <span className="font-black text-slate-900">
                            ₹{prodRev.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{p.quantitySold || p.quantity || 0} items sold</span>
                          <span>{percent}% share</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('sales')}
              className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'sales'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ReceiptIndianRupee className="w-4 h-4" />
              <span>Sales Transactions ({safeSalesList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('returns')}
              className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'returns'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Sales Returns ({salesReturnsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'products'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Product-Wise Sales ({productSalesList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'customers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Customer-Wise Sales ({customerSalesList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('monthly')}
              className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'monthly'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Monthly Revenue ({monthlyRevenueList.length})</span>
            </button>
          </div>

          {/* TAB 1: Sales Transactions */}
          {activeTab === 'sales' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between font-bold text-slate-900 text-xs">
                <span>Detailed Sales Transactions Breakdown</span>
                <span className="text-slate-500 font-normal">Total Records: {safeSalesList.length}</span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">Loading sales report data...</div>
              ) : safeSalesList.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">No sales transactions found for the selected filter.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Invoice No</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Sale Type</th>
                        <th className="py-3 px-4 text-right">Subtotal</th>
                        <th className="py-3 px-4 text-right">Tax (GST)</th>
                        <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {safeSalesList.map((s) => (
                        <tr
                          key={s.id}
                          onClick={() => setSelectedInvoiceDetail(s)}
                          className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                          title="Click to view itemized invoice breakdown"
                        >
                          <td className="py-3.5 px-4 font-bold text-blue-600 font-mono group-hover:underline">
                            {s.invoice_number || s.invoiceNumber || s.id?.slice(0, 8)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {new Date(s.invoice_date || s.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {s.customers?.name || s.customer?.name || 'Retail Cash Customer'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                              {s.invoice_type || s.sale_type || 'SALE'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-600">
                            ₹{Number(s.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-600">
                            ₹{(Number(s.cgst_amount || 0) + Number(s.sgst_amount || 0) + Number(s.igst_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-sm">
                            ₹{Number(s.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: Sales Returns */}
          {activeTab === 'returns' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between font-bold text-slate-900 text-xs">
                <span>Detailed Sales Returns Breakdown</span>
                <span className="text-slate-500 font-normal">Total Records: {salesReturnsList.length}</span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">Loading sales returns data...</div>
              ) : salesReturnsList.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">No sales returns found for the selected period.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Return Ref #</th>
                        <th className="py-3 px-4">Original Invoice</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Reason / Notes</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {salesReturnsList.map((ret) => (
                        <tr key={ret.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-rose-600 font-mono">
                            {ret.returnNumber || `RET-${ret.id?.substring(0, 8)}`}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900 font-mono">
                            {ret.sale?.invoiceNumber || ret.invoice_number || '-'}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {ret.customer?.name || ret.sale?.customer?.name || 'Walk-in Customer'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700">
                              {ret.reason || 'Customer Return'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {new Date(ret.created_at || ret.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200">
                              Restocked
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Product-Wise Sales */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between font-bold text-slate-900 text-xs">
                <span>Product Sales Performance & Analytics</span>
                <span className="text-slate-500 font-normal">Total Products Sold: {productSalesList.length}</span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">Loading product sales analytics...</div>
              ) : productSalesList.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">No product sales records available for the selected period.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-4">SKU / Code</th>
                        <th className="py-3 px-4 text-center">Orders Count</th>
                        <th className="py-3 px-4 text-right">Qty Sold</th>
                        <th className="py-3 px-4 text-right">Total Revenue (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {productSalesList.map((p) => (
                        <tr key={p.product_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2">
                            <Package className="w-4 h-4 text-purple-600 shrink-0" />
                            <span>{p.product_name}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">{p.sku}</td>
                          <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{p.ordersCount}</td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">{p.quantitySold}</td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 text-sm">
                            ₹{Number(p.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Customer-Wise Sales */}
          {activeTab === 'customers' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between font-bold text-slate-900 text-xs">
                <span>Customer Sales & Revenue Contribution</span>
                <span className="text-slate-500 font-normal">Total Customers: {customerSalesList.length}</span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">Loading customer sales data...</div>
              ) : customerSalesList.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">No customer sales available for the selected period.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">Phone Number</th>
                        <th className="py-3 px-4 text-center">Total Invoices</th>
                        <th className="py-3 px-4 text-right">Total Amount Spent (₹)</th>
                        <th className="py-3 px-4 text-right">Paid Amount (₹)</th>
                        <th className="py-3 px-4 text-right">Outstanding Balance (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {customerSalesList.map((c) => (
                        <tr key={c.customer_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2">
                            <Users className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>{c.customer_name}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">{c.phone}</td>
                          <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{c.totalOrders}</td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-sm">
                            ₹{Number(c.totalSalesAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                            ₹{Number(c.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-amber-600">
                            ₹{Number(c.outstandingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Monthly Revenue */}
          {activeTab === 'monthly' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between font-bold text-slate-900 text-xs">
                <span>Monthly Revenue Breakdown</span>
                <span className="text-slate-500 font-normal">Months Tracked: {monthlyRevenueList.length}</span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">Loading monthly revenue breakdown...</div>
              ) : monthlyRevenueList.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">No monthly revenue data available.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Month & Year</th>
                        <th className="py-3 px-4 text-center">Invoices Count</th>
                        <th className="py-3 px-4 text-right">GST / Tax Amount (₹)</th>
                        <th className="py-3 px-4 text-right">Total Monthly Sales (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {monthlyRevenueList.map((m) => (
                        <tr key={m.key} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>{m.monthLabel}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{m.invoiceCount}</td>
                          <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                            ₹{Number(m.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 text-sm">
                            ₹{Number(m.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Interactive Invoice Itemized Details Modal */}
          {selectedInvoiceDetail && (
            <Modal
              isOpen={!!selectedInvoiceDetail}
              onClose={() => setSelectedInvoiceDetail(null)}
              title={`Invoice Breakdown: ${selectedInvoiceDetail.invoice_number || selectedInvoiceDetail.invoiceNumber || selectedInvoiceDetail.id}`}
              maxWidth="max-w-2xl"
            >
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-900 text-white rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Customer</span>
                    <p className="font-bold text-sm text-blue-400">
                      {selectedInvoiceDetail.customers?.name || selectedInvoiceDetail.customer?.name || 'Retail Cash Customer'}
                    </p>
                    <p className="text-[10px] text-slate-300">
                      Phone: {selectedInvoiceDetail.customers?.phone || selectedInvoiceDetail.customer?.phone || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Invoice Date</span>
                    <p className="font-mono text-xs">
                      {new Date(selectedInvoiceDetail.invoice_date || selectedInvoiceDetail.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px]">
                      {selectedInvoiceDetail.invoice_type || selectedInvoiceDetail.sale_type || 'SALE'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">Billed Items Breakdown</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {Array.isArray(selectedInvoiceDetail.sale_items || selectedInvoiceDetail.items) && (selectedInvoiceDetail.sale_items || selectedInvoiceDetail.items).length > 0 ? (
                      (selectedInvoiceDetail.sale_items || selectedInvoiceDetail.items).map((item, idx) => (
                        <div key={idx} className="p-3 flex justify-between items-center hover:bg-slate-50">
                          <div>
                            <p className="font-bold text-slate-900">{item.product_name || item.products?.name || 'Item'}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              SKU: {item.sku || item.products?.sku || 'N/A'} | Qty: {Number(item.quantity || 1)} x ₹{Number(item.unit_price || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right font-extrabold text-slate-900">
                            ₹{Number(item.total_amount || (Number(item.quantity || 1) * Number(item.unit_price || 0))).toFixed(2)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-400">No item details available for this invoice</div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-right font-medium">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{Number(selectedInvoiceDetail.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax (GST):</span>
                    <span>₹{(Number(selectedInvoiceDetail.cgst_amount || 0) + Number(selectedInvoiceDetail.sgst_amount || 0) + Number(selectedInvoiceDetail.igst_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-1 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="text-blue-600">₹{Number(selectedInvoiceDetail.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
