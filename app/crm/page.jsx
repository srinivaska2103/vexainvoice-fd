'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  RotateCw,
  UserX,
  Award,
  AlertCircle,
  CalendarCheck,
  Clock,
  ArrowRight,
  TrendingUp,
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CrmSubNav from '@/components/crm/CrmSubNav';
import { crmService } from '@/services/crmService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CrmDashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await crmService.getDashboardMetrics();
      setMetrics(res.data || res);
    } catch (err) {
      console.error('Failed to load CRM dashboard metrics:', err);
      setError('Unable to load CRM dashboard analytics. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { title: 'Total Customers', value: metrics?.totalCustomers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', href: '/crm/customers' },
    { title: 'New Customers (30d)', value: metrics?.newCustomers || 0, icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', href: '/crm/customers?segment=NEW' },
    { title: 'Repeat Customers', value: metrics?.repeatCustomers || 0, icon: RotateCw, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', href: '/crm/customers?segment=REPEAT' },
    { title: 'Inactive Customers', value: metrics?.inactiveCustomers || 0, icon: UserX, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', href: '/crm/customers?segment=INACTIVE' },
    { title: 'High Value Customers', value: metrics?.highValueCustomers || 0, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', href: '/crm/customers?segment=HIGH_VALUE' },
    { title: 'With Outstanding', value: metrics?.customersWithOutstanding || 0, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', href: '/crm/customers?segment=OUTSTANDING' },
    { title: "Today's Follow-ups", value: metrics?.todayFollowups || 0, icon: CalendarCheck, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100', href: '/crm/followups?status=TODAY' },
    { title: 'Overdue Follow-ups', value: metrics?.overdueFollowups || 0, icon: Clock, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', href: '/crm/followups?status=OVERDUE' }
  ];

  return (
    <ProtectedRoute permissions={['crm.view']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-blue-50/50 p-6 sm:p-7 rounded-3xl text-slate-900 shadow-2xs border border-slate-200/90">
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-indigo-100/70 rounded-full text-xs font-black text-indigo-700 border border-indigo-200/70">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Customer Intelligence Engine</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Customer Relationship Intelligence</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold">Understand purchase patterns, manage follow-ups, and build repeat sales.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={fetchMetrics}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-extrabold shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
              <Link href="/crm/followups">
                <button className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap">
                  <Plus className="w-4 h-4" />
                  <span>Schedule Follow-up</span>
                </button>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
              <Spinner size="lg" className="text-blue-600" />
              <p className="text-sm font-semibold text-slate-500">Loading live business CRM analytics...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
              <h3 className="text-sm font-bold text-red-900">{error}</h3>
              <Button onClick={fetchMetrics} className="bg-red-600 text-white rounded-xl">
                <RefreshCw className="w-4 h-4 mr-2" /> Retry
              </Button>
            </div>
          ) : (
            <>
              {/* Top 8 Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <Link key={idx} href={card.href}>
                      <div className={`p-5 rounded-2xl border bg-white shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group ${card.border}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.title}</span>
                          <div className={`p-2.5 rounded-xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                          <span className="text-3xl font-black text-slate-900">{card.value}</span>
                          <span className="text-xs font-bold text-blue-600 flex items-center group-hover:translate-x-1 transition-transform">
                            View <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Two Column Layout: Follow-ups & Top Products */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Follow-ups (2 Cols) */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center">
                        <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-blue-600 shrink-0" />
                        <span>Pending Team Follow-ups</span>
                      </h2>
                      <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Upcoming customer touchpoints and reminder tasks</p>
                    </div>
                    <Link href="/crm/followups" className="shrink-0 self-start sm:self-auto">
                      <Button size="sm" variant="outline" className="text-xs rounded-xl font-bold px-3 py-1.5 h-8 border-slate-200 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-1.5 transition whitespace-nowrap shadow-2xs">
                        <span>View All Follow-ups</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                      </Button>
                    </Link>
                  </div>

                  <div className="p-0 overflow-x-auto">
                    {metrics?.upcomingFollowups?.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 space-y-2">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                        <p className="text-sm font-semibold text-slate-600">No follow-ups scheduled.</p>
                        <p className="text-xs text-slate-400">All customer follow-up actions are up to date.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                          <tr>
                            <th className="px-5 py-3">Customer</th>
                            <th className="px-5 py-3">Type / Reason</th>
                            <th className="px-5 py-3">Due Date</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {metrics?.upcomingFollowups?.map((f) => (
                            <tr key={f.id} className="hover:bg-slate-50/80 transition">
                              <td className="px-5 py-3.5 font-bold text-slate-900">
                                <Link href={`/crm/customers/${f.customerId}`} className="hover:text-blue-600 underline">
                                  {f.customerName}
                                </Link>
                                {f.customerPhone && <div className="text-[11px] font-mono text-slate-400 font-normal">{f.customerPhone}</div>}
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="font-semibold text-slate-800">{f.type}</span>
                                <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{f.reason}</div>
                              </td>
                              <td className="px-5 py-3.5 font-medium text-slate-700">
                                {formatDate(f.dueDate)}
                              </td>
                              <td className="px-5 py-3.5">
                                {f.status === 'OVERDUE' ? (
                                  <Badge variant="danger" className="font-bold">Overdue</Badge>
                                ) : (
                                  <Badge variant="warning" className="font-bold">Pending</Badge>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <Link href={`/crm/customers/${f.customerId}`}>
                                  <Button size="xs" variant="outline" className="rounded-lg text-xs font-semibold">
                                    Customer 360
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Business Top Products Overview (1 Col) */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 flex items-center">
                        <Package className="w-5 h-5 mr-2 text-indigo-600" /> Top Purchased Products
                      </h2>
                      <p className="text-xs text-slate-500">Highest volume items sold to customers</p>
                    </div>
                    <Link href="/crm/customers">
                      <Button size="xs" variant="ghost" className="text-xs font-bold text-blue-600">
                        View All <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>

                  <div className="p-4 flex-1 space-y-3">
                    {metrics?.topProductsOverview?.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <p className="text-xs">More sales history is needed to generate product insights.</p>
                      </div>
                    ) : (
                      metrics?.topProductsOverview?.map((p, idx) => (
                        <div key={p.productId || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-900 truncate max-w-[180px]">{p.productName}</p>
                            <p className="text-[11px] text-slate-500">{p.totalQuantity} Qty Sold</p>
                          </div>
                          <span className="text-xs font-black text-slate-900">{formatCurrency(p.totalValue)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
