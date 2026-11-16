'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Ticket,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Shield,
  Send,
  Download,
  Lock,
  MessageSquare,
  FileText,
  UserCheck
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supportService } from '@/services/supportService';
import { useToast } from '@/context/ToastContext';

export default function SuperAdminSupportTicketsPage() {
  const { user, role } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [tickets, setTickets] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    waiting: 0,
    resolved: 0,
    critical: 0
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected ticket modal / drawer
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await supportService.getSuperAdminTickets({
        status: statusFilter,
        priority: priorityFilter,
        search: searchQuery
      });
      setTickets(res.data || []);
      if (res.metrics) setMetrics(res.metrics);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      toastError(err.message || 'Failed to fetch support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTickets();
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, priorityFilter, searchQuery]);

  const openTicketDrawer = async (ticketItem) => {
    try {
      const res = await supportService.getSuperAdminTicketDetails(ticketItem.id);
      setSelectedTicket(res.data);
      setUpdatingStatus(res.data.status);
    } catch (err) {
      toastError(err.message || 'Could not load ticket details.');
    }
  };

  const handleSendAdminReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setActionLoading(true);
    try {
      await supportService.updateSuperAdminTicket(selectedTicket.id, {
        action: 'REPLY',
        message: replyText.trim(),
        isInternalNote,
        status: updatingStatus
      });
      toastSuccess(isInternalNote ? 'Internal note added.' : 'Reply sent to customer.');
      setReplyText('');
      // Reload ticket details
      const refreshed = await supportService.getSuperAdminTicketDetails(selectedTicket.id);
      setSelectedTicket(refreshed.data);
      loadTickets();
    } catch (err) {
      toastError(err.message || 'Failed to send reply.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      await supportService.updateSuperAdminTicket(selectedTicket.id, {
        action: 'UPDATE_STATUS',
        status: newStatus
      });
      toastSuccess(`Ticket marked as ${newStatus}`);
      const refreshed = await supportService.getSuperAdminTicketDetails(selectedTicket.id);
      setSelectedTicket(refreshed.data);
      loadTickets();
    } catch (err) {
      toastError(err.message || 'Status update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                VEXA TECH Technical Operations
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                Support Tickets Administration
              </h1>
              <p className="text-xs text-slate-500">
                Manage, assign, and respond to incoming customer tickets across all subscribed companies.
              </p>
            </div>
          </div>

          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{metrics.total}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Open</span>
              <span className="text-xl font-black text-blue-700 mt-1 block">{metrics.open}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">In Progress</span>
              <span className="text-xl font-black text-amber-700 mt-1 block">{metrics.inProgress}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Waiting User</span>
              <span className="text-xl font-black text-purple-700 mt-1 block">{metrics.waiting}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Resolved</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">{metrics.resolved}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Critical</span>
              <span className="text-xl font-black text-red-700 mt-1 block">{metrics.critical}</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket #, company name, subject..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_FOR_CUSTOMER">Waiting For Customer</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-slate-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2" />
                <p className="text-xs">Loading support tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-16 text-center text-slate-400 text-xs">
                No support tickets found matching the specified filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-5">Ticket #</th>
                      <th className="py-3.5 px-5">Company</th>
                      <th className="py-3.5 px-5">Subject</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Submitter</th>
                      <th className="py-3.5 px-4">Created Date</th>
                      <th className="py-3.5 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {tickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-5 font-mono font-bold text-purple-700">
                          {t.ticket_number}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-slate-900 block">{t.businesses?.business_name || 'N/A'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{t.businesses?.company_id || t.business_id.slice(0, 8)}</span>
                        </td>
                        <td className="py-3.5 px-5 max-w-xs">
                          <span className="font-semibold text-slate-800 block truncate">{t.subject}</span>
                          <span className="text-[10px] text-slate-400">{t.category}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            t.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' : t.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block">{t.users?.name}</span>
                          <span className="text-[10px] text-slate-400">{t.users?.email}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => openTicketDrawer(t)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition cursor-pointer shadow-xs"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detailed Ticket Management Modal / Drawer */}
          {selectedTicket && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                        {selectedTicket.ticket_number}
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100">
                        {selectedTicket.status}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mt-2">{selectedTicket.subject}</h2>
                    <p className="text-xs text-slate-500">
                      Company: <strong>{selectedTicket.businesses?.business_name}</strong> • Submitter: {selectedTicket.users?.name} ({selectedTicket.users?.email})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg text-sm font-bold"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Status Quick Updater */}
                <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-2xl text-xs">
                  <span className="font-bold text-slate-600">Quick Status:</span>
                  {['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatus(st)}
                      disabled={actionLoading}
                      className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                        selectedTicket.status === st
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>

                {/* Initial Description */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                  <span className="font-bold text-slate-900 block">Issue Description:</span>
                  <p className="whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                </div>

                {/* Attachments */}
                {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-2">Customer Attachments:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedTicket.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={supportService.getAttachmentDownloadUrl(att.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-purple-700 font-bold hover:border-purple-400 shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{att.file_name}</span>
                          <Download className="w-3 h-3 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message History & Internal Notes */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-slate-700 block">Conversation & Internal Notes:</span>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {selectedTicket.messages?.map((m) => (
                      <div
                        key={m.id}
                        className={`p-4 rounded-2xl text-xs space-y-1.5 border ${
                          m.is_internal_note
                            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                            : m.sender_type === 'ADMIN'
                            ? 'bg-purple-50/70 border-purple-200 text-purple-950'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] pb-1 border-b border-black/5">
                          <span className="font-bold">
                            {m.sender_name} {m.is_internal_note ? '(INTERNAL NOTE - PRIVATE)' : `(${m.sender_type})`}
                          </span>
                          <span className="text-slate-400">
                            {new Date(m.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{m.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reply / Internal Note Input */}
                <form onSubmit={handleSendAdminReply} className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center space-x-4 text-xs font-bold">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={!isInternalNote}
                        onChange={() => setIsInternalNote(false)}
                      />
                      <span className="text-purple-700">Customer Reply (Sends Email)</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={isInternalNote}
                        onChange={() => setIsInternalNote(true)}
                      />
                      <span className="text-amber-700 flex items-center space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>Private Internal Note (Hidden from Customer)</span>
                      </span>
                    </label>
                  </div>

                  <textarea
                    rows={3}
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={isInternalNote ? 'Write internal note for support engineering staff...' : 'Type response to customer...'}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />

                  <div className="flex justify-end space-x-3">
                    <button
                      type="submit"
                      disabled={actionLoading || !replyText.trim()}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition cursor-pointer flex items-center space-x-2 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isInternalNote ? 'Save Internal Note' : 'Send Customer Reply'}</span>
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

