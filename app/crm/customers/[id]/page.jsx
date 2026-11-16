'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Phone,
  Mail,
  MapPin,
  ReceiptIndianRupee,
  CreditCard,
  Clock,
  FileText,
  Printer,
  CalendarCheck,
  TrendingUp,
  Package,
  Layers,
  StickyNote,
  History,
  ArrowLeft,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  BarChart3,
  UserCheck,
  Building2
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

export default function Customer360Page() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Followup Modal state
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [followupForm, setFollowupForm] = useState({
    type: 'Call',
    reason: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'MEDIUM',
    notes: ''
  });
  const [submittingFollowup, setSubmittingFollowup] = useState(false);

  // Note Modal state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    if (id && id !== 'placeholder') {
      fetch360Data();
    }
  }, [id]);

  const fetch360Data = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await crmService.getCustomer360(id);
      setData(res.data || res);
    } catch (err) {
      console.error('Failed to load Customer 360 data:', err);
      setError('Failed to load customer profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFollowup = async (e) => {
    e.preventDefault();
    if (!followupForm.reason || !followupForm.due_date) return;
    try {
      setSubmittingFollowup(true);
      await crmService.createFollowup({
        customer_id: id,
        ...followupForm
      });
      setShowFollowupModal(false);
      setFollowupForm({ type: 'Call', reason: '', due_date: new Date().toISOString().split('T')[0], priority: 'MEDIUM', notes: '' });
      fetch360Data();
    } catch (err) {
      console.error('Failed to create follow-up:', err);
      alert('Error creating follow-up record.');
    } finally {
      setSubmittingFollowup(false);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    try {
      setSubmittingNote(true);
      await crmService.createCustomerNote({
        customer_id: id,
        note: noteContent
      });
      setShowNoteModal(false);
      setNoteContent('');
      fetch360Data();
    } catch (err) {
      console.error('Failed to add note:', err);
      alert('Error adding note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleCompleteFollowup = async (followupId) => {
    try {
      await crmService.updateFollowup(followupId, { status: 'COMPLETED', completion_notes: 'Completed from Customer 360' });
      fetch360Data();
    } catch (err) {
      console.error('Failed to complete followup:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Spinner size="lg" className="text-blue-600" />
        <p className="text-sm font-semibold text-slate-500">Loading Customer 360 profile & analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700">
          <p className="font-bold">{error || 'Customer profile not found.'}</p>
        </div>
        <Button onClick={() => router.push('/crm/customers')} className="bg-blue-600 text-white font-bold rounded-xl">
          Back to CRM Customers List
        </Button>
      </div>
    );
  }

  const { customer, summary, sales, payments, products, topCategories, topBrands, purchasePattern, followups, notes, timeline } = data;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'sales', label: `Sales (${sales.length})`, icon: ReceiptIndianRupee },
    { id: 'payments', label: `Payments (${payments.length})`, icon: CreditCard },
    { id: 'products', label: `Products (${products.length})`, icon: Package },
    { id: 'pattern', label: 'Purchase Pattern', icon: TrendingUp },
    { id: 'followups', label: `Follow-ups (${followups.length})`, icon: CalendarCheck },
    { id: 'notes', label: `Notes (${notes.length})`, icon: StickyNote },
    { id: 'timeline', label: 'Timeline', icon: History }
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-xs shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{customer.name}</h1>
              <Badge variant="outline" className="font-bold text-xs uppercase bg-blue-50 text-blue-700 border-blue-200 rounded-lg">
                {customer.customer_type}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Code: {customer.customer_code || 'N/A'} • GSTIN: {customer.gst_number || 'Unregistered / Retail'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button onClick={() => setShowFollowupModal(true)} size="sm" variant="outline" className="font-bold rounded-xl border-slate-300 shadow-xs">
            <CalendarCheck className="w-4 h-4 mr-1.5 text-indigo-600" /> Schedule Follow-up
          </Button>
          <Button onClick={() => setShowNoteModal(true)} size="sm" variant="outline" className="font-bold rounded-xl border-slate-300 shadow-xs">
            <StickyNote className="w-4 h-4 mr-1.5 text-blue-600" /> Add Note
          </Button>
          <Link href="/sales/new">
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-sm">
              + New Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* Customer Header Info & Top Financial Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Contact Info Card */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact & Location</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center text-slate-700 font-semibold">
              <Phone className="w-4 h-4 mr-2 text-blue-600 shrink-0" /> {customer.phone || 'No phone number'}
            </div>
            {customer.email && (
              <div className="flex items-center text-slate-700 font-semibold truncate">
                <Mail className="w-4 h-4 mr-2 text-indigo-600 shrink-0" /> <span className="truncate">{customer.email}</span>
              </div>
            )}
            <div className="flex items-start text-slate-700 font-semibold">
              <MapPin className="w-4 h-4 mr-2 text-rose-500 mt-0.5 shrink-0" />
              <span>{customer.city ? `${customer.city}${customer.state ? `, ${customer.state}` : ''}` : 'Location unconfigured'}</span>
            </div>
          </div>
        </div>

        {/* Financial Metrics Cards (4 Cols Responsive) */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Purchases</p>
            <p className="text-xl font-black text-slate-900 mt-1">{formatCurrency(summary.totalPurchases)}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{summary.totalOrders} Orders Total</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Paid</p>
            <p className="text-xl font-black text-emerald-600 mt-1">{formatCurrency(summary.totalPaid)}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Authoritative Backend Record</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Outstanding</p>
            <p className={`text-xl font-black mt-1 ${summary.outstanding > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {formatCurrency(summary.outstanding)}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Current Account Balance</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Order Value</p>
            <p className="text-xl font-black text-indigo-600 mt-1">{formatCurrency(summary.avgOrderValue)}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {summary.lastPurchaseDate ? `Last: ${formatDate(summary.lastPurchaseDate)}` : 'No Sales Yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-1.5 flex items-center space-x-1.5 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Purchase Pattern Highlight */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center">
                <TrendingUp className="w-4.5 h-4.5 mr-2 text-indigo-600" /> Purchase Pattern & Frequency
              </h2>
              <Badge variant="outline" className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50/80 border-indigo-200 rounded-lg">
                CRM Intelligence
              </Badge>
            </div>

            {purchasePattern.hasEnoughData ? (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-indigo-50/80 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-indigo-950 block">{purchasePattern.followUpOpportunity}</span>
                    <p className="text-[11px] text-indigo-700 font-medium">{purchasePattern.notice}</p>
                  </div>
                  <button
                    onClick={() => setShowFollowupModal(true)}
                    className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl transition shadow-xs hover:shadow-indigo-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    Schedule Reminder
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-center">
                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Purchase Interval</span>
                    <p className="text-lg font-black text-slate-900 mt-1">{purchasePattern.avgIntervalDays} Days</p>
                  </div>
                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days Since Last Sale</span>
                    <p className="text-lg font-black text-slate-900 mt-1">{purchasePattern.daysSinceLastPurchase} Days</p>
                  </div>
                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Repeat Window</span>
                    <p className="text-sm font-black text-slate-900 mt-2">{formatDate(purchasePattern.expectedNextPurchaseDate)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">{purchasePattern.reason}</p>
              </div>
            )}
          </div>

          {/* Top Brands & Categories */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center border-b border-slate-100 pb-3">
              <ShoppingBag className="w-4 h-4 mr-2 text-blue-600" /> Favorite Categories & Brands
            </h2>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Top Purchased Categories</span>
                {topCategories.length === 0 ? (
                  <p className="text-xs text-slate-400 mt-1">No category history.</p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {topCategories.slice(0, 3).map((cat, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-medium bg-slate-50 p-2 rounded-lg">
                        <span className="font-bold text-slate-800">{cat.name}</span>
                        <span className="font-black text-slate-900">{formatCurrency(cat.totalSpent)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Top Purchased Brands</span>
                {topBrands.length === 0 ? (
                  <p className="text-xs text-slate-400 mt-1">No brand history.</p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {topBrands.slice(0, 3).map((brand, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-medium bg-slate-50 p-2 rounded-lg">
                        <span className="font-bold text-slate-800">{brand.name}</span>
                        <span className="font-black text-slate-900">{formatCurrency(brand.totalSpent)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SALES HISTORY TAB */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Customer Sales & Invoices</h2>
            <Link href="/sales/new">
              <button className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-blue-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0">
                <Plus className="w-3.5 h-3.5" />
                <span>New Sale</span>
              </button>
            </Link>
          </div>

          {sales.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No sales history available yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 font-extrabold uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Invoice Number</th>
                    <th className="px-5 py-3">Items Purchased</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">Paid</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 font-medium text-slate-700">{formatDate(s.invoice_date)}</td>
                      <td className="px-5 py-3.5 font-bold font-mono text-slate-900">{s.invoice_number}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-slate-800">{s.itemCount} Items</span>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {s.items.map(i => i.productName).join(', ')}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-slate-900">{formatCurrency(s.grand_total)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">{formatCurrency(s.paid_amount)}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={s.status === 'CONFIRMED' ? 'success' : s.status === 'CANCELLED' ? 'danger' : 'warning'}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href={`/sales?search=${s.invoice_number}`}>
                          <Button size="xs" variant="outline" className="rounded-lg text-[11px] font-bold">
                            View Sale <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. PAYMENT HISTORY TAB */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Payment Transactions</h2>
            <Link href="/payments">
              <button className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0">
                <Plus className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            </Link>
          </div>

          {payments.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No payment transaction records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 font-extrabold uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Payment Date</th>
                    <th className="px-5 py-3">Reference / Receipt</th>
                    <th className="px-5 py-3">Invoice</th>
                    <th className="px-5 py-3">Payment Mode</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 font-medium text-slate-700">{formatDate(p.payment_date)}</td>
                      <td className="px-5 py-3.5 font-bold font-mono text-slate-900">{p.reference_number}</td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">{p.invoice_number}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className="font-bold text-[10px] text-slate-700 uppercase">
                          {p.payment_method}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-emerald-600 text-sm">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. PRODUCT ANALYSIS TAB (Variant Hierarchy preserved for Garments & Textile) */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Purchased Products & Variant Hierarchy</h2>
            <p className="text-xs text-slate-500">Breakdown of products, colors, sizes, and quantities purchased by customer</p>
          </div>

          {products.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No product purchase history available yet.</div>
          ) : (
            <div className="space-y-4">
              {products.map((prod) => (
                <div key={prod.productId} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">{prod.productName}</h3>
                      <div className="text-[11px] text-slate-500 space-x-2">
                        <span>Category: <b>{prod.category}</b></span>
                        <span>• Brand: <b>{prod.brand}</b></span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-xs font-bold text-slate-900">
                      <span>Total Qty: <b className="text-blue-600 font-black">{prod.totalQuantity}</b></span>
                      <span>Spent: <b className="text-emerald-600 font-black">{formatCurrency(prod.totalSpent)}</b></span>
                    </div>
                  </div>

                  {/* Garment / Textile Variant Breakdown */}
                  {prod.variants && prod.variants.length > 0 && (
                    <div className="pl-4 border-l-2 border-indigo-300 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Garment / Variant Breakdown:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {prod.variants.map((v, vIdx) => (
                          <div key={vIdx} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-800">{v.variantName}</span>
                              <div className="text-[10px] text-slate-500">
                                {v.color && <span>Color: {v.color} </span>}
                                {v.size && <span>| Size: {v.size}</span>}
                              </div>
                            </div>
                            <span className="font-black text-indigo-600">Qty {v.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. PURCHASE PATTERN TAB */}
      {activeTab === 'pattern' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" /> Historical Purchase Pattern & Follow-up Window
            </h2>
            <p className="text-xs text-slate-500">Calculates historical order frequency, interval patterns, and repeat window opportunity</p>
          </div>

          {purchasePattern.hasEnoughData ? (
            <div className="space-y-6">
              {/* Insight Banner */}
              <div className="p-5 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 border border-indigo-100/80 rounded-2xl space-y-1.5 shadow-2xs">
                <span className="text-[11px] font-black text-indigo-700 uppercase tracking-wider block">Historical Insight Result</span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">{purchasePattern.followUpOpportunity}</h3>
                <p className="text-xs font-semibold text-slate-600">{purchasePattern.notice}</p>
              </div>

              {/* 1. Cycle Progress Gauge Chart */}
              {(() => {
                const elapsed = purchasePattern.daysSinceLastPurchase || 0;
                const interval = purchasePattern.avgIntervalDays || 1;
                const percentage = Math.min(100, Math.round((elapsed / Math.max(1, interval)) * 100));
                const isOverdue = elapsed > interval;

                return (
                  <div className="p-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Repeat Purchase Cycle Gauge</span>
                      </div>
                      <span className={`text-xs font-extrabold px-3 py-1 rounded-xl self-start sm:self-auto ${isOverdue ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                        {percentage}% of Typical Cycle Elapsed
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200/90 h-4 rounded-full overflow-hidden p-0.5 relative">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isOverdue ? 'bg-gradient-to-r from-amber-500 to-rose-600 shadow-sm' : 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-sm'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] font-bold text-slate-500 pt-1">
                      <span>0 Days (Last Purchase)</span>
                      <span className="text-indigo-600 font-extrabold">{interval} Days Avg Cycle Target</span>
                      <span className={isOverdue ? 'text-rose-600 font-extrabold' : 'text-slate-700'}>{elapsed} Days Current Elapsed</span>
                    </div>
                  </div>
                );
              })()}

              {/* 2. Historical Orders Visual Bar Graph */}
              {sales && sales.length > 0 && (() => {
                const sortedSales = [...sales].reverse();
                const maxSpent = Math.max(...sortedSales.map(s => Number(s.grand_total) || 0), 1);

                return (
                  <div className="p-5 bg-white border border-slate-200/90 rounded-2xl space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4.5 h-4.5 text-blue-600" />
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Historical Order Value Trend</h3>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">Total {sortedSales.length} Orders</span>
                    </div>

                    <div className="h-44 flex items-end justify-between gap-2.5 pt-6 pb-2 px-2">
                      {sortedSales.map((s, idx) => {
                        const val = Number(s.grand_total) || 0;
                        const heightPct = Math.max(15, Math.round((val / maxSpent) * 100));

                        return (
                          <div key={s.id || idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            {/* Hover Value Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 z-10 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg whitespace-nowrap pointer-events-none shadow-md">
                              {s.invoice_number}: {formatCurrency(val)}
                            </div>

                            {/* Gradient Bar */}
                            <div
                              className="w-full max-w-[36px] bg-gradient-to-t from-indigo-600 via-blue-500 to-indigo-400 rounded-t-xl group-hover:from-indigo-700 group-hover:to-blue-600 transition-all duration-300 shadow-xs cursor-pointer"
                              style={{ height: `${heightPct}%` }}
                            />

                            {/* Label */}
                            <span className="text-[10px] font-bold text-slate-500 truncate w-full text-center mt-2">
                              {formatDate(s.invoice_date).split(' ')[0]} {formatDate(s.invoice_date).split(' ')[1]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* 3. Metric Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">First Purchase</span>
                  <p className="text-xs font-black text-slate-900 mt-1">{formatDate(purchasePattern.firstPurchaseDate)}</p>
                </div>
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Purchase</span>
                  <p className="text-xs font-black text-slate-900 mt-1">{formatDate(purchasePattern.lastPurchaseDate)}</p>
                </div>
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Interval</span>
                  <p className="text-base font-black text-indigo-600 mt-1">{purchasePattern.avgIntervalDays} Days</p>
                </div>
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days Elapsed</span>
                  <p className="text-base font-black text-slate-900 mt-1">{purchasePattern.daysSinceLastPurchase} Days</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">{purchasePattern.reason}</p>
              <p className="text-xs text-slate-400">Minimum 2 completed sales required to analyze interval frequency.</p>
            </div>
          )}
        </div>
      )}

      {/* 6. FOLLOW-UPS TAB */}
      {activeTab === 'followups' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center">
                <CalendarCheck className="w-5 h-5 text-indigo-600 mr-2 shrink-0" /> Customer Follow-up Tasks
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Scheduled team reminders and interaction tasks</p>
            </div>
            <button
              onClick={() => setShowFollowupModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Schedule Follow-up</span>
            </button>
          </div>

          {followups.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
              <p className="text-sm font-bold text-slate-700">No follow-ups scheduled for this customer.</p>
              <p className="text-xs text-slate-400">Click Schedule Follow-up above to add a task.</p>
            </div>
          ) : (
            <div className="p-5 space-y-4 bg-slate-50/40">
              {followups.map((f) => (
                <div
                  key={f.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2.5 flex-1 min-w-0">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-900 text-sm tracking-tight capitalize flex items-center">
                        {f.type === 'CALL' ? (
                          <Phone className="w-4 h-4 text-blue-600 mr-1.5 shrink-0" />
                        ) : f.type === 'MEETING' ? (
                          <Building2 className="w-4 h-4 text-indigo-600 mr-1.5 shrink-0" />
                        ) : f.type === 'EMAIL' ? (
                          <Mail className="w-4 h-4 text-amber-600 mr-1.5 shrink-0" />
                        ) : (
                          <CalendarCheck className="w-4 h-4 text-emerald-600 mr-1.5 shrink-0" />
                        )}
                        {f.type}
                      </span>

                      {/* Status Chip */}
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

                      {/* Priority Chip */}
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
                        {f.priority} PRIORITY
                      </span>
                    </div>

                    {/* Content Details */}
                    {f.reason && (
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                        {f.reason}
                      </p>
                    )}

                    {f.notes && f.notes !== 'Nill' && f.notes !== 'Nill ' && (
                      <div className="text-xs text-slate-600 bg-slate-50/80 border border-slate-100 p-2.5 rounded-xl font-medium">
                        {f.notes}
                      </div>
                    )}

                    {/* Metadata Footer */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Due: <strong className="text-slate-800 font-bold">{formatDate(f.dueDate)}</strong></span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Assigned to: <strong className="text-slate-800 font-bold">{f.assignedTo || 'Unassigned'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Button */}
                  {f.status !== 'COMPLETED' && (
                    <div className="shrink-0 self-start md:self-center">
                      <button
                        onClick={() => handleCompleteFollowup(f.id)}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs hover:shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Complete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. NOTES TAB */}
      {activeTab === 'notes' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 bg-slate-50/50 -mx-6 -mt-6 p-6 rounded-t-2xl">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center">
                <StickyNote className="w-5 h-5 text-amber-600 mr-2 shrink-0" /> Internal Customer Notes
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Private team annotations and customer communication logs</p>
            </div>
            <button
              onClick={() => setShowNoteModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-amber-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Internal Note</span>
            </button>
          </div>

          {notes.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <StickyNote className="w-10 h-10 text-amber-400 mx-auto opacity-70" />
              <p className="text-sm font-bold text-slate-700">No internal notes added for this customer.</p>
              <p className="text-xs text-slate-400">Click Add Internal Note above to capture internal observations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="bg-amber-50/30 border border-amber-200/60 hover:border-amber-300 hover:shadow-sm rounded-2xl p-5 transition-all duration-200 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center uppercase shrink-0">
                        {n.createdBy ? n.createdBy.charAt(0) : 'U'}
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-900">{n.createdBy || 'Team Member'}</span>
                        <span className="text-[10px] text-amber-800 font-bold bg-amber-100/80 px-2 py-0.5 rounded-md ml-2 uppercase">Internal Note</span>
                      </div>
                    </div>
                    <div className="flex items-center text-[11px] font-semibold text-slate-400">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                      <span>{formatDate(n.createdAt)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-800 font-semibold leading-relaxed whitespace-pre-wrap pl-1">
                    {n.note}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 8. TIMELINE TAB */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center">
                <History className="w-5 h-5 text-indigo-600 mr-2 shrink-0" /> Unified Customer Activity Timeline
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Chronological record of sales, payments, notes, and follow-ups</p>
            </div>
            <span className="text-xs font-black px-3 py-1 bg-slate-100 text-slate-700 rounded-xl self-start sm:self-auto shrink-0">
              {timeline.length} Total Events
            </span>
          </div>

          {timeline.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <History className="w-10 h-10 text-slate-300 mx-auto opacity-70" />
              <p className="text-sm font-bold text-slate-700">No activity events logged yet.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200/80 ml-4 pl-6 space-y-5 my-2">
              {timeline.map((evt) => {
                const isInvoice = evt.title?.toLowerCase().includes('invoice') || evt.type === 'SALE';
                const isPayment = evt.title?.toLowerCase().includes('payment') || evt.type === 'PAYMENT';
                const isNote = evt.title?.toLowerCase().includes('note') || evt.type === 'NOTE';
                const isFollowup = evt.title?.toLowerCase().includes('follow-up') || evt.type === 'FOLLOWUP';

                return (
                  <div key={evt.id} className="relative group">
                    {/* Node Dot / Icon Marker */}
                    <div className={`absolute -left-[37px] top-1 p-2 bg-white border-2 rounded-full shadow-xs transition-transform group-hover:scale-110 ${
                      isInvoice ? 'border-blue-600 text-blue-600' :
                      isPayment ? 'border-emerald-600 text-emerald-600' :
                      isNote ? 'border-amber-600 text-amber-600' :
                      'border-indigo-600 text-indigo-600'
                    }`}>
                      {isInvoice ? <FileText className="w-3.5 h-3.5" /> :
                       isPayment ? <CreditCard className="w-3.5 h-3.5" /> :
                       isNote ? <StickyNote className="w-3.5 h-3.5" /> :
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
                            'bg-indigo-50 text-indigo-700 border border-indigo-200/70'
                          }`}>
                            {isInvoice ? 'SALE' : isPayment ? 'PAYMENT' : isNote ? 'NOTE' : 'TASK'}
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
      )}

      {/* Create Follow-up Modal */}
      {showFollowupModal && (
        <Modal isOpen={true} onClose={() => setShowFollowupModal(false)} title="Schedule Customer Follow-up">
          <form onSubmit={handleCreateFollowup} className="space-y-4 p-1">
            <div className="space-y-1">
              <Select
                label="Follow-up Type"
                value={followupForm.type}
                onChange={(e) => setFollowupForm({ ...followupForm, type: e.target?.value !== undefined ? e.target.value : e })}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <DatePicker
                  label="Due Date *"
                  value={followupForm.due_date}
                  onChange={(dateStr) => setFollowupForm({ ...followupForm, due_date: dateStr })}
                  placeholder="Select Due Date"
                />
              </div>

              <div className="space-y-1">
                <Select
                  label="Priority"
                  value={followupForm.priority}
                  onChange={(e) => setFollowupForm({ ...followupForm, priority: e.target?.value !== undefined ? e.target.value : e })}
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
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Reason / Subject *</label>
              <input
                type="text"
                required
                placeholder="Reason for follow-up call/visit..."
                value={followupForm.reason}
                onChange={(e) => setFollowupForm({ ...followupForm, reason: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Notes</label>
              <textarea
                rows={3}
                placeholder="Additional instructions..."
                value={followupForm.notes}
                onChange={(e) => setFollowupForm({ ...followupForm, notes: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setShowFollowupModal(false)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={submittingFollowup} className="bg-blue-600 text-white font-bold rounded-xl">
                {submittingFollowup ? 'Saving...' : 'Save Follow-up'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Note Modal */}
      {showNoteModal && (
        <Modal isOpen={true} onClose={() => setShowNoteModal(false)} title="Add Internal Note">
          <form onSubmit={handleCreateNote} className="space-y-4 p-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Note Content *</label>
              <textarea
                rows={4}
                required
                placeholder="Enter customer preference, payment promise, or special request..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setShowNoteModal(false)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={submittingNote} className="bg-blue-600 text-white font-bold rounded-xl">
                {submittingNote ? 'Saving...' : 'Save Note'}
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
