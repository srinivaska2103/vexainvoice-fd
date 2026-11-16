'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  History,
  Users,
  Search,
  ChevronRight,
  Clock,
  FileText,
  CreditCard,
  StickyNote,
  CalendarCheck,
  UserPlus
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { crmService } from '@/services/crmService';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';

export default function TimelinePage() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await crmService.getCrmCustomers({ limit: 100 });
      const list = Array.isArray(res) ? res : (res?.data || res?.customers || []);
      setCustomers(list);
      if (list.length > 0) {
        setSelectedCustomerId(list[0].id);
        fetchTimeline(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load customers for timeline:', err);
    }
  };

  const fetchTimeline = async (custId) => {
    if (!custId) return;
    try {
      setLoading(true);
      const res = await crmService.getCustomer360(custId);
      setTimelineEvents(res.timeline || res.data?.timeline || []);
    } catch (err) {
      console.error('Failed to load customer timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (e) => {
    const id = e.target?.value !== undefined ? e.target.value : e;
    setSelectedCustomerId(id);
    fetchTimeline(id);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center">
            <History className="w-6 h-6 mr-2 text-indigo-600" /> Customer Activity Timeline
          </h1>
          <p className="text-xs text-slate-500">Unified chronological event stream of customer touchpoints, sales, payments, and notes</p>
        </div>

        <div className="w-full sm:w-80">
          <Select
            label="Select Customer"
            icon={Users}
            searchable={true}
            value={selectedCustomerId}
            onChange={handleCustomerChange}
            placeholder="Choose customer..."
            options={customers.map((c) => ({
              value: c.id,
              label: `${c.name} (${c.phone || c.customer_code || 'Customer'})`
            }))}
            size="sm"
          />
        </div>
      </div>

      {/* Main Timeline Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center">
              <History className="w-5 h-5 text-indigo-600 mr-2 shrink-0" /> Chronological Event Stream
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{timelineEvents.length} Total Events Recorded</p>
          </div>
          {selectedCustomerId && (
            <Link href={`/crm/customers/${selectedCustomerId}`}>
              <button className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto">
                <span>Customer 360 Full View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Spinner size="lg" className="text-indigo-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-500 mt-2">Loading timeline events...</p>
          </div>
        ) : timelineEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <History className="w-10 h-10 text-slate-300 mx-auto opacity-70" />
            <p className="text-sm font-bold text-slate-700">No activity timeline events recorded for this customer.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200/80 ml-4 pl-6 space-y-5 my-2">
            {timelineEvents.map((evt) => {
              const titleLower = evt.title?.toLowerCase() || '';
              const isInvoice = titleLower.includes('invoice') || evt.type === 'SALE';
              const isPayment = titleLower.includes('payment') || evt.type === 'PAYMENT';
              const isNote = titleLower.includes('note') || evt.type === 'NOTE';
              const isCreated = titleLower.includes('created') || titleLower.includes('registered');

              return (
                <div key={evt.id} className="relative group">
                  {/* Node Dot / Icon Marker */}
                  <div className={`absolute -left-[37px] top-1 p-2 bg-white border-2 rounded-full shadow-xs transition-transform group-hover:scale-110 ${
                    isInvoice ? 'border-blue-600 text-blue-600' :
                    isPayment ? 'border-emerald-600 text-emerald-600' :
                    isNote ? 'border-amber-600 text-amber-600' :
                    isCreated ? 'border-purple-600 text-purple-600' :
                    'border-indigo-600 text-indigo-600'
                  }`}>
                    {isInvoice ? <FileText className="w-3.5 h-3.5" /> :
                     isPayment ? <CreditCard className="w-3.5 h-3.5" /> :
                     isNote ? <StickyNote className="w-3.5 h-3.5" /> :
                     isCreated ? <UserPlus className="w-3.5 h-3.5" /> :
                     <CalendarCheck className="w-3.5 h-3.5" />}
                  </div>

                  {/* Timeline Event Card */}
                  <div className="bg-slate-50/70 border border-slate-200/80 hover:border-indigo-200 hover:bg-white hover:shadow-sm rounded-2xl p-4 transition-all duration-200 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900 text-sm">{evt.title}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          isInvoice ? 'bg-blue-50 text-blue-700 border border-blue-200/70' :
                          isPayment ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' :
                          isNote ? 'bg-amber-50 text-amber-700 border border-amber-200/70' :
                          isCreated ? 'bg-purple-50 text-purple-700 border border-purple-200/70' :
                          'bg-indigo-50 text-indigo-700 border border-indigo-200/70'
                        }`}>
                          {isInvoice ? 'SALE' : isPayment ? 'PAYMENT' : isNote ? 'NOTE' : isCreated ? 'REGISTERED' : 'TASK'}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center shrink-0">
                        <Clock className="w-3 h-3 mr-1 text-slate-400" />
                        {formatDate(evt.timestamp)}
                      </span>
                    </div>

                    {evt.description && evt.description !== 'nill' && (
                      <p className="text-xs font-medium text-slate-700 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-slate-100">
                        {evt.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
