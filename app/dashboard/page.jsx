'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  AlertTriangle, 
  FileText, 
  PlusCircle, 
  ShoppingCart, 
  ArrowUpRight, 
  RefreshCw,
  Sparkles,
  Clock,
  CreditCard,
  CheckCircle2,
  QrCode
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { reportService } from '@/services/reportService';
import { salesService } from '@/services/salesService';
import { subscriptionService } from '@/services/subscriptionService';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import ShopQrModal from '@/components/shop/ShopQrModal';

export default function DashboardPage() {
  const { business, role } = useAuth();
  const isAdmin = role === 'ADMIN';

  const [summary, setSummary] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [subStatus, setSubStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const promises = [
        reportService.getDashboardSummary(),
        salesService.getSales({ limit: 5 })
      ];

      // Subscription status is visible to ADMIN only
      if (isAdmin) {
        promises.push((subscriptionService.getMyStatus || subscriptionService.getCompanyStatus)());
      }

      const results = await Promise.allSettled(promises);
      const sumRes = results[0];
      const salesRes = results[1];
      const subRes = isAdmin ? results[2] : null;

      if (sumRes.status === 'fulfilled') {
        setSummary(sumRes.value.data || sumRes.value);
      }
      if (salesRes.status === 'fulfilled') {
        const val = salesRes.value;
        setRecentSales(Array.isArray(val) ? val : (val?.data || val?.sales || val || []));
      }
      if (subRes && subRes.status === 'fulfilled') {
        setSubStatus(subRes.value.data || subRes.value);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <ProtectedRoute permissions={['dashboard.view']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Executive Dashboard</h1>
              <p className="text-xs text-slate-500 mt-1">
                Real-time performance overview of sales, inventory & receivables
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsQrModalOpen(true)}
                  className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-bold shadow-xs cursor-pointer flex-1 sm:flex-none justify-center"
                  title="View & Download Shop Catalogue QR Code"
                >
                  <QrCode className="w-4 h-4 mr-1.5 sm:mr-2 text-indigo-600 shrink-0" />
                  Catalogue QR
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchDashboardData}
                disabled={isLoading}
                className="flex-1 sm:flex-none justify-center"
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 sm:mr-2 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/sales/new" className="w-full sm:w-auto">
                <Button size="sm" className="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/20">
                  <ShoppingCart className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
                  Fast POS Billing
                </Button>
              </Link>
            </div>
          </div>

          {/* Compact Free Trial Status Card (ADMIN only) */}
          {isAdmin && (subStatus?.subscription?.status === 'TRIALING' || subStatus?.access?.isTrial) && (
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-sm tracking-tight">Free Trial</span>
                    <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {subStatus?.access?.daysRemaining ?? 7} Days Remaining
                    </span>
                  </div>
                  <p className="text-xs text-blue-100 mt-0.5 font-medium">
                    Full access enabled until{' '}
                    <strong className="text-white font-bold">
                      {subStatus?.subscription?.trial_end_at || subStatus?.access?.trialEnd
                        ? new Date(subStatus?.subscription?.trial_end_at || subStatus?.access?.trialEnd).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : '7 days'}
                    </strong>
                    . Subscribe at any time to continue uninterrupted.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <Link href="/settings/subscription">
                  <Button size="sm" className="bg-white text-indigo-700 hover:bg-blue-50 font-black shadow-sm text-xs px-4 py-2 rounded-xl transition cursor-pointer">
                    <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                    Subscribe Now — ₹599/mo
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" className="text-indigo-600" />
            </div>
          ) : error ? (
            <Card className="p-6 text-center text-rose-600 bg-rose-50 border-rose-200">
              <p className="font-semibold text-sm">{error}</p>
              <Button size="sm" variant="outline" className="mt-4" onClick={fetchDashboardData}>
                Try Again
              </Button>
            </Card>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <Card className="p-5 border-l-4 border-l-indigo-600 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Sales</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">
                        {formatCurrency(summary?.todaySalesAmount || 0)}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {summary?.todaySalesCount || 0} Invoices today
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Valuation</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">
                        {formatCurrency(summary?.totalStockValue || 0)}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {summary?.totalProducts || 0} Unique Products
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Package className="w-6 h-6" />
                    </div>
                  </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Due</p>
                      <h3 className="text-2xl font-bold text-amber-600 mt-1">
                        {formatCurrency(summary?.customerOutstanding || 0)}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Receivables</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-rose-500 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Items</p>
                      <h3 className="text-2xl font-bold text-rose-600 mt-1">
                        {summary?.lowStockCount || 0}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Action Required</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Actions & Recent Sales */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Invoices */}
                <div className="lg:col-span-2">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-slate-900">Recent Sales Invoices</h2>
                      <Link href="/sales" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center">
                        View All Invoices
                        <ArrowUpRight className="w-4 h-4 ml-1" />
                      </Link>
                    </div>

                    {recentSales.length === 0 ? (
                      <EmptyState
                        icon={FileText}
                        title="No Invoices Issued Yet"
                        description="Start creating sales invoices through POS or Wholesale billing."
                        action={
                          <Link href="/sales/pos">
                            <Button size="sm">Create First Invoice</Button>
                          </Link>
                        }
                      />
                    ) : (
                      <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                        <table className="w-full text-left text-xs min-w-[500px]">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                              <th className="pb-3 px-2">Invoice #</th>
                              <th className="pb-3 px-2">Customer</th>
                              <th className="pb-3 px-2">Type</th>
                              <th className="pb-3 px-2">Total Amount</th>
                              <th className="pb-3 px-2">Payment Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {recentSales.map((sale) => (
                              <tr key={sale.id} className="hover:bg-slate-50">
                                 <td className="py-3 px-2 font-bold text-indigo-600 font-mono">{sale.invoiceNumber || sale.invoice_number || sale.id}</td>
                                <td className="py-3 px-2 text-slate-900 font-semibold truncate max-w-[140px]">{sale.customer?.name || sale.customers?.name || 'Walk-in Customer'}</td>
                                <td className="py-3 px-2">
                                  <Badge variant={(sale.invoiceType || sale.invoice_type) === 'WHOLESALE' ? 'secondary' : 'default'} className="text-[10px]">
                                    {sale.invoiceType || sale.invoice_type || 'SALE'}
                                  </Badge>
                                </td>
                                <td className="py-3 px-2 font-bold text-slate-900 whitespace-nowrap">
                                  {formatCurrency(sale.totalAmount ?? sale.total_amount ?? sale.grand_total ?? 0)}
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap">
                                  <Badge 
                                    className="text-[10px]"
                                    variant={
                                      (sale.paymentStatus || 'PAID') === 'PAID' ? 'success' :
                                      (sale.paymentStatus === 'PARTIAL') ? 'warning' : 'danger'
                                    }
                                  >
                                    {sale.paymentStatus || 'PAID'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Quick Shortcuts */}
                <div className="space-y-6">
                  <Card className="p-6">
                    <h2 className="text-base font-bold text-slate-900 mb-4">Quick Shortcuts</h2>
                    <div className="space-y-3">
                      <Link href="/sales/pos" className="block">
                        <div className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all flex items-center justify-between group">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                              <ShoppingCart className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">POS Retail Counter</p>
                              <p className="text-[11px] text-slate-400">Barcode scan & fast billing</p>
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                        </div>
                      </Link>

                      <Link href="/products" className="block">
                        <div className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between group">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                              <Package className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">Product Inventory</p>
                              <p className="text-[11px] text-slate-400">Add products & manage stock</p>
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                        </div>
                      </Link>

                      <Link href="/purchases" className="block">
                        <div className="p-3 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition-all flex items-center justify-between group">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                              <PlusCircle className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 group-hover:text-sky-600">New Purchase Inward</p>
                              <p className="text-[11px] text-slate-400">Record supplier invoice</p>
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
                        </div>
                      </Link>

                      <Link href="/reports" className="block">
                        <div className="p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition-all flex items-center justify-between group">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 group-hover:text-amber-600">GST & Profit Reports</p>
                              <p className="text-[11px] text-slate-400">GSTR-1, P&L & Stock valuation</p>
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                        </div>
                      </Link>

                      {/* Customer Catalogue QR Code Shortcut */}
                      {isAdmin && (
                        <div
                          onClick={() => setIsQrModalOpen(true)}
                          className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-400 transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                              <QrCode className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Customer Shop QR</p>
                              <p className="text-[11px] text-slate-500">Scan & download public catalogue QR</p>
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-indigo-500 group-hover:text-indigo-700" />
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}

          {/* Shop Catalogue QR Modal */}
          <ShopQrModal
            isOpen={isQrModalOpen}
            onClose={() => setIsQrModalOpen(false)}
            shopSlug={business?.company_id || 'sai-textiles'}
            businessName={business?.business_name || 'Sai textiles'}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
