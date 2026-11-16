'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Users,
  Search,
  ChevronRight,
  AlertCircle,
  CalendarCheck,
  ArrowRight
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { crmService } from '@/services/crmService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PurchasePatternsPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await crmService.getCrmCustomers({
        search: search || undefined,
        limit: 50
      });
      const customerList = Array.isArray(res) ? res : (res?.data || res?.customers || []);
      setCustomers(customerList);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-indigo-600" /> Customer Purchase Patterns & Follow-up Matrix
          </h1>
          <p className="text-xs text-slate-500">Historical order interval calculations and potential repeat purchase follow-up opportunity windows</p>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 space-y-0.5">
          <p className="font-extrabold">Important Business Logic Note</p>
          <p className="text-indigo-800">
            Purchase pattern intervals are calculated strictly from actual completed sales history. It is provided as a historical insight to identify potential follow-up opportunities, not a guaranteed prediction.
          </p>
        </div>
      </div>

      {/* Customer Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition"
            />
          </div>
          <span className="text-xs font-extrabold text-slate-500">
            Showing {customers.length} Customers
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Spinner size="lg" className="text-indigo-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-500 mt-2">Analyzing customer purchase frequency patterns...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <TrendingUp className="w-10 h-10 text-slate-300 mx-auto opacity-70" />
            <p className="text-sm font-bold text-slate-700">No customer records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-extrabold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5 text-center">Completed Orders</th>
                  <th className="px-5 py-3.5 text-right">Total Spent</th>
                  <th className="px-5 py-3.5 text-right">Avg Order Value</th>
                  <th className="px-5 py-3.5">Last Purchase Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/crm/customers/${c.id}`} className="font-extrabold text-slate-900 hover:text-indigo-600 text-sm">
                        {c.name}
                      </Link>
                      {c.phone && <div className="text-[11px] font-mono text-slate-400">{c.phone}</div>}
                    </td>
                    <td className="px-5 py-4 text-center font-black text-slate-900">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-indigo-50 text-indigo-700 rounded-lg text-xs">
                        {c.totalOrders}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-black text-slate-900 text-sm">{formatCurrency(c.totalSpent)}</td>
                    <td className="px-5 py-4 text-right font-black text-indigo-600 text-xs">{formatCurrency(c.avgOrderValue)}</td>
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {c.lastPurchaseDate ? formatDate(c.lastPurchaseDate) : <span className="text-slate-400 italic">No Sales</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/crm/customers/${c.id}?tab=pattern`}>
                        <button className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-extrabold shadow-2xs hover:shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap">
                          <span>Pattern 360</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
