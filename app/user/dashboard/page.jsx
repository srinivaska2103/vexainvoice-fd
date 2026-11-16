'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  ReceiptIndianRupee,
  ScanBarcode,
  Boxes,
  ArrowUpRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export default function UserDashboardView() {
  const { user, role, displayRole, checkPermission } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const promises = [
        reportService.getDashboardSummary().catch(() => null),
        salesService.getSales({ limit: 5 }).catch(() => ({ data: [] }))
      ];
      const [sumRes, salesRes] = await Promise.all(promises);
      if (sumRes) setSummary(sumRes);
      if (salesRes?.data) setRecentSales(Array.isArray(salesRes.data) ? salesRes.data : salesRes.data.sales || []);
    } catch (err) {
      setError(err.message || 'Failed to load user portal overview');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['USER', 'BILLING_STAFF', 'MANAGER', 'ACCOUNTANT', 'STOCK_STAFF']}>
      <DashboardLayout>
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Employee Portal &bull; {displayRole || role}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Welcome back, {user?.name || 'Team Member'}!
              </h1>
              <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
                Access your designated business modules, point of sale, customer records, and inventory tasks.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {checkPermission('sales.create') && (
                <Link href="/sales/new">
                  <Button className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-md rounded-xl text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Create Invoice</span>
                  </Button>
                </Link>
              )}
              {checkPermission('stock.view') && (
                <Link href="/stock">
                  <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 font-semibold rounded-xl text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2">
                    <Boxes className="w-4 h-4" />
                    <span>Check Stock</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link href="/sales/new">
              <Card className="p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group bg-white border-slate-200/80 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm text-slate-900">New Sale</div>
                <div className="text-[11px] text-slate-500">POS & GST Billing</div>
              </Card>
            </Link>

            <Link href="/sales">
              <Card className="p-4 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group bg-white border-slate-200/80 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ReceiptIndianRupee className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm text-slate-900">Invoices</div>
                <div className="text-[11px] text-slate-500">History & Receipts</div>
              </Card>
            </Link>

            <Link href="/customers">
              <Card className="p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group bg-white border-slate-200/80 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm text-slate-900">Customers</div>
                <div className="text-[11px] text-slate-500">Profiles & Balances</div>
              </Card>
            </Link>

            <Link href="/stock">
              <Card className="p-4 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group bg-white border-slate-200/80 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Boxes className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm text-slate-900">Inventory</div>
                <div className="text-[11px] text-slate-500">Products & Quantities</div>
              </Card>
            </Link>
          </div>

          {/* Operational Metrics Cards */}
          {isLoading ? (
            <div className="h-44 flex items-center justify-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Card className="p-5 bg-white border-slate-200/80 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Today's Sales</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-slate-900">
                  {formatCurrency(summary?.today_sales || summary?.todaySales || 0)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Processed today</p>
              </Card>

              <Card className="p-5 bg-white border-slate-200/80 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Invoices</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ReceiptIndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-slate-900">
                  {summary?.total_invoices || summary?.invoicesCount || recentSales.length || 0}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Recorded transactions</p>
              </Card>

              <Card className="p-5 bg-white border-slate-200/80 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Low Stock Items</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-slate-900">
                  {summary?.low_stock_count || summary?.lowStockCount || 0}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Items requiring replenishment</p>
              </Card>
            </div>
          )}

          {/* Recent Invoices Table */}
          <Card className="p-6 bg-white border-slate-200/80 rounded-3xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Sales Activity</h2>
                <p className="text-xs text-slate-500">Latest completed checkout receipts</p>
              </div>
              <Link href="/sales" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <span>View All Invoices</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentSales.length === 0 ? (
              <EmptyState title="No recent invoices" description="Created sales transactions will be summarized here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-blue-600">
                          {sale.invoice_number || sale.invoiceNumber || sale.id?.slice(0, 8)}
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-medium">
                          {sale.customer_name || sale.customer?.name || 'Walk-in Customer'}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {formatDate(sale.invoice_date || sale.created_at)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(sale.total_amount || sale.totalAmount || 0)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase font-bold">
                            {sale.payment_status || 'PAID'}
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}
