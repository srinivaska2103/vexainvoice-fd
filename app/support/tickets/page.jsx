'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Ticket,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  FileText
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supportService } from '@/services/supportService';
import { getRolePath } from '@/lib/permissions';

export default function MySupportTicketsPage() {
  const { user, role, business } = useAuth();
  const userRoleSlug = user?.custom_role?.slug || user?.role_slug;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await supportService.getMyTickets({
        status: statusFilter,
        search: searchQuery
      });
      const list = Array.isArray(res) ? res : (res?.data || []);
      setTickets(list);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTickets();
    }, 200);
    return () => clearTimeout(timer);
  }, [statusFilter, searchQuery]);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-700">Open</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-700">In Progress</span>;
      case 'WAITING_FOR_CUSTOMER':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-purple-700">Waiting For You</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-700">Resolved</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-600">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{st}</span>;
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'CRITICAL':
        return <span className="text-[10px] font-extrabold uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">Critical</span>;
      case 'HIGH':
        return <span className="text-[10px] font-extrabold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">High</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-extrabold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">Medium</span>;
      default:
        return <span className="text-[10px] font-extrabold uppercase text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">Low</span>;
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <Ticket className="w-6 h-6 text-blue-600 shrink-0" />
                <span>My Support Tickets</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                View status updates, replies, and communicate with VEXA TECH technical support.
              </p>
            </div>

            <Link
              href={getRolePath(role, userRoleSlug, 'support/new')}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer shadow-sm shadow-blue-600/25"
            >
              <Plus className="w-4 h-4" />
              <span>Raise New Ticket</span>
            </Link>
          </div>

          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket #, subject..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 shrink-0">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_FOR_CUSTOMER">Waiting For You</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {/* Tickets Table / List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-slate-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
                <p className="text-xs">Loading support tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">No support tickets found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  You haven't submitted any tickets matching the current filter. Need help with billing or products?
                </p>
                <Link
                  href={getRolePath(role, userRoleSlug, 'support/new')}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Raise a Support Ticket</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse text-xs min-w-[750px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                      <th className="py-3.5 px-5">Ticket #</th>
                      <th className="py-3.5 px-5">Subject</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Submitted By</th>
                      <th className="py-3.5 px-4">Last Activity</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {tickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <Link
                            href={getRolePath(role, userRoleSlug, `support/tickets/${t.id}`)}
                            className="font-mono font-bold text-blue-600 hover:underline"
                          >
                            {t.ticket_number}
                          </Link>
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <div className="max-w-xs sm:max-w-md">
                            <Link
                              href={getRolePath(role, userRoleSlug, `support/tickets/${t.id}`)}
                              className="font-bold text-slate-900 hover:text-blue-600 block truncate"
                            >
                              {t.subject}
                            </Link>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {t.category.replace(/_/g, ' ')} • {t.affected_module || 'General'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getPriorityBadge(t.priority)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(t.status)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          <span className="font-semibold">{t.user_name}</span>
                          <span className="text-[10px] text-slate-400 block">{t.user_role}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {new Date(t.updated_at || t.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <Link
                            href={getRolePath(role, userRoleSlug, `support/tickets/${t.id}`)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition"
                          >
                            <span>View</span>
                            <ArrowRight className="w-3.5 h-3.5" />
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

