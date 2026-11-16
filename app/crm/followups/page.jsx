'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  User,
  Trash2,
  Edit2,
  ChevronRight,
  RefreshCw,
  Building2,
  Mail
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { crmService } from '@/services/crmService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function FollowupsPage() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');

  // New Followup Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    type: 'Call',
    reason: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'MEDIUM',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Complete Modal
  const [completingFollowup, setCompletingFollowup] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');

  // Customer List for Select Dropdown
  const [customersList, setCustomersList] = useState([]);

  useEffect(() => {
    fetchFollowups();
  }, [statusFilter, priorityFilter, search]);

  useEffect(() => {
    fetchCustomersForDropdown();
  }, []);

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      const res = await crmService.getFollowups({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        priority: priorityFilter || undefined,
        search: search || undefined
      });
      setFollowups(res.data || res || []);
    } catch (err) {
      console.error('Failed to fetch followups:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersForDropdown = async () => {
    try {
      const res = await crmService.getCrmCustomers({ limit: 100 });
      setCustomersList(res.customers || res.data || []);
    } catch (err) {
      console.error('Failed to load customers for dropdown:', err);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.reason || !formData.due_date) return;
    try {
      setSubmitting(true);
      await crmService.createFollowup(formData);
      setShowAddModal(false);
      setFormData({
        customer_id: '',
        type: 'Call',
        reason: '',
        due_date: new Date().toISOString().split('T')[0],
        priority: 'MEDIUM',
        notes: ''
      });
      fetchFollowups();
    } catch (err) {
      console.error('Failed to create follow-up:', err);
      alert('Error saving follow-up record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completingFollowup) return;
    try {
      await crmService.updateFollowup(completingFollowup.id, {
        status: 'COMPLETED',
        completion_notes: completionNotes || 'Completed'
      });
      setCompletingFollowup(null);
      setCompletionNotes('');
      fetchFollowups();
    } catch (err) {
      console.error('Failed to complete followup:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this follow-up record?')) return;
    try {
      await crmService.deleteFollowup(id);
      fetchFollowups();
    } catch (err) {
      console.error('Failed to delete followup:', err);
    }
  };

  const statusTabs = [
    { id: 'ALL', label: 'All Follow-ups' },
    { id: 'TODAY', label: "Today's Tasks" },
    { id: 'OVERDUE', label: 'Overdue' },
    { id: 'UPCOMING', label: 'Upcoming' },
    { id: 'COMPLETED', label: 'Completed' }
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center">
            <CalendarCheck className="w-6 h-6 mr-2 text-blue-600" /> Customer Follow-ups & Tasks
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Internal team task workspace to schedule and complete customer callbacks and reminders</p>
        </div>

        <Button onClick={() => setShowAddModal(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4 mr-1.5" /> Schedule Follow-up
        </Button>
      </div>

      {/* Filter Tabs & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-center gap-3 w-full md:w-auto">
            <div className="w-full md:w-40">
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target?.value !== undefined ? e.target.value : e)}
                placeholder="All Priorities"
                options={[
                  { value: '', label: 'All Priorities' },
                  { value: 'URGENT', label: 'Urgent' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'LOW', label: 'Low' }
                ]}
                size="sm"
              />
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reason, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Follow-ups List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <Spinner size="lg" className="text-blue-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-500 mt-2">Loading follow-ups workspace...</p>
          </div>
        ) : followups.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No follow-up tasks match criteria.</p>
            <p className="text-xs text-slate-400">All customer follow-up actions are completed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-extrabold uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Type & Reason</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Assigned To</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {followups.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/crm/customers/${f.customer_id}`} className="font-extrabold text-slate-900 hover:text-indigo-600 text-sm">
                        {f.customerName}
                      </Link>
                      {f.customerPhone && <div className="text-[11px] font-mono text-slate-400">{f.customerPhone}</div>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-black text-slate-900 text-xs uppercase tracking-tight flex items-center mb-0.5">
                        {f.type === 'CALL' ? (
                          <Phone className="w-3.5 h-3.5 text-blue-600 mr-1.5 shrink-0" />
                        ) : f.type === 'MEETING' ? (
                          <Building2 className="w-3.5 h-3.5 text-indigo-600 mr-1.5 shrink-0" />
                        ) : f.type === 'EMAIL' ? (
                          <Mail className="w-3.5 h-3.5 text-amber-600 mr-1.5 shrink-0" />
                        ) : (
                          <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 mr-1.5 shrink-0" />
                        )}
                        {f.type}
                      </span>
                      <div className="text-xs text-slate-700 font-semibold leading-snug">{f.reason}</div>
                      {f.notes && f.notes !== 'Nill' && f.notes !== 'Nill ' && (
                        <div className="text-[11px] text-slate-500 font-medium truncate max-w-[220px] mt-0.5 bg-slate-100/70 px-2 py-0.5 rounded-md">
                          {f.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 font-extrabold text-slate-800 text-xs">
                      {formatDate(f.dueDate)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                          f.priority === 'URGENT'
                            ? 'bg-rose-100 text-rose-800'
                            : f.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : f.priority === 'MEDIUM'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {f.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-700 text-xs">
                      {f.assignedTo || 'Unassigned'}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          f.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : f.status === 'OVERDUE'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          f.status === 'COMPLETED' ? 'bg-emerald-500' : f.status === 'OVERDUE' ? 'bg-rose-500' : 'bg-amber-500'
                        }`} />
                        {f.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center justify-end space-x-2">
                        {f.status !== 'COMPLETED' && (
                          <button
                            onClick={() => setCompletingFollowup(f)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-extrabold shadow-2xs hover:shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Complete</span>
                          </button>
                        )}
                        <Link href={`/crm/customers/${f.customer_id}`}>
                          <button className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-extrabold active:scale-95 transition-all cursor-pointer whitespace-nowrap">
                            <span>360 View</span>
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Follow-up Modal */}
      {showAddModal && (
        <Modal isOpen={true} onClose={() => setShowAddModal(false)} title="Schedule New Follow-up">
          <form onSubmit={handleCreateSubmit} className="space-y-4 p-1">
            <div className="space-y-1">
              <Select
                label="Select Customer *"
                searchable={true}
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target?.value !== undefined ? e.target.value : e })}
                placeholder="-- Choose Customer --"
                options={customersList.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.phone || c.customer_code || 'No phone'})`
                }))}
                size="sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Select
                  label="Follow-up Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target?.value !== undefined ? e.target.value : e })}
                  placeholder="Select Type..."
                  options={[
                    { value: 'Call', label: 'Call' },
                    { value: 'Visit', label: 'Visit' },
                    { value: 'Payment Follow-up', label: 'Payment Follow-up' },
                    { value: 'Product Follow-up', label: 'Product Follow-up' },
                    { value: 'Order Follow-up', label: 'Order Follow-up' },
                    { value: 'General', label: 'General' }
                  ]}
                  size="sm"
                />
              </div>

              <div className="space-y-1">
                <DatePicker
                  label="Due Date *"
                  value={formData.due_date}
                  onChange={(dateStr) => setFormData({ ...formData, due_date: dateStr })}
                  placeholder="Select Due Date"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Select
                  label="Priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target?.value !== undefined ? e.target.value : e })}
                  placeholder="Select Priority..."
                  options={[
                    { value: 'LOW', label: 'Low' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'HIGH', label: 'High' },
                    { value: 'URGENT', label: 'Urgent' }
                  ]}
                  size="sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Reason / Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="Subject of follow-up..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Notes</label>
              <textarea
                rows={3}
                placeholder="Additional instructions..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-blue-600 text-white font-bold rounded-xl">
                {submitting ? 'Saving...' : 'Save Follow-up'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Complete Follow-up Modal */}
      {completingFollowup && (
        <Modal isOpen={true} onClose={() => setCompletingFollowup(null)} title="Complete Follow-up Task">
          <form onSubmit={handleCompleteSubmit} className="space-y-4 p-1">
            <p className="text-xs text-slate-600">
              Completing follow-up task for <b>{completingFollowup.customerName}</b> ({completingFollowup.reason}).
            </p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Completion Notes</label>
              <textarea
                rows={3}
                placeholder="Outcome of call/visit..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setCompletingFollowup(null)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 text-white font-bold rounded-xl">
                Mark Task Completed
              </Button>
            </div>
          </form>
        </Modal>
      )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
