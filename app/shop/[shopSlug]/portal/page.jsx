'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  FileText,
  CreditCard,
  BookOpen,
  ShoppingBag,
  Clock,
  Download,
  Printer,
  ChevronRight,
  LogOut,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Receipt,
  IndianRupee,
  ReceiptIndianRupee,
  Store,
  ShieldCheck,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { portalService } from '@/services/portalService';
import { Spinner } from '@/components/ui/Spinner';

export default function CustomerPortalPage() {
  const params = useParams();
  const shopSlug = params?.shopSlug;

  const [isLoading, setIsLoading] = useState(true);
  const [portalInfo, setPortalInfo] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'payments' | 'ledger' | 'quotations' | 'orders' | 'profile'
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginName, setLoginName] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Tab Data States
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [ledger, setLedger] = useState({ customer: null, entries: [] });
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Invoice / Receipt Preview Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gst_number: ''
  });

  // Load portal information and check saved customer session
  useEffect(() => {
    if (!shopSlug) return;

    const initialize = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const infoRes = await portalService.getPortalInfo(shopSlug);
        setPortalInfo(infoRes?.data || infoRes);

        const storedCust = portalService.getCurrentStoredCustomer(shopSlug);
        if (storedCust) {
          try {
            const profileRes = await portalService.getProfile(shopSlug);
            const verifiedCustomer = profileRes?.data?.customer || profileRes?.customer || storedCust;
            setCustomer(verifiedCustomer);
            setProfileForm({
              name: verifiedCustomer.name || '',
              email: verifiedCustomer.email || '',
              phone: verifiedCustomer.phone || '',
              address: verifiedCustomer.address || '',
              city: verifiedCustomer.city || '',
              state: verifiedCustomer.state || '',
              pincode: verifiedCustomer.pincode || '',
              gst_number: verifiedCustomer.gst_number || ''
            });
          } catch (e) {
            // Token expired or invalid
            portalService.logoutCustomer(shopSlug);
            setCustomer(null);
          }
        }
      } catch (err) {
        setErrorMessage(
          err.response?.data?.message ||
          'Customer Portal is currently unavailable for this company. Please ensure Growth or Lifetime Plan is active.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [shopSlug]);

  // Load active tab data when customer is signed in
  useEffect(() => {
    if (!customer || !shopSlug) return;

    const loadTabData = async () => {
      setIsDataLoading(true);
      try {
        if (activeTab === 'invoices') {
          const res = await portalService.getInvoices(shopSlug);
          setInvoices(res?.data || []);
        } else if (activeTab === 'payments') {
          const res = await portalService.getPayments(shopSlug);
          setPayments(res?.data || []);
        } else if (activeTab === 'ledger') {
          const res = await portalService.getLedger(shopSlug);
          setLedger(res?.data || { customer, entries: [] });
        } else if (activeTab === 'quotations') {
          const res = await portalService.getQuotations(shopSlug);
          setQuotations(res?.data || []);
        } else if (activeTab === 'orders') {
          const res = await portalService.getOrders(shopSlug);
          setOrders(res?.data || []);
        }
      } catch (err) {
        console.error('Error loading tab data:', err);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadTabData();
  }, [customer, activeTab, shopSlug]);

  // Handle Customer Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your phone number or email.');
      return;
    }

    setIsLoggingIn(true);
    setErrorMessage('');
    try {
      const res = await portalService.loginCustomer(shopSlug, {
        identifier: loginIdentifier,
        name: loginName
      });
      const data = res?.data || res;
      setCustomer(data.customer);
      setProfileForm({
        name: data.customer.name || '',
        email: data.customer.email || '',
        phone: data.customer.phone || '',
        address: data.customer.address || '',
        city: data.customer.city || '',
        state: data.customer.state || '',
        pincode: data.customer.pincode || '',
        gst_number: data.customer.gst_number || ''
      });
      setSuccessMessage('Welcome to your customer portal!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    portalService.logoutCustomer(shopSlug);
    setCustomer(null);
    setInvoices([]);
    setPayments([]);
    setLedger({ customer: null, entries: [] });
    setQuotations([]);
    setOrders([]);
  };

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsDataLoading(true);
    setErrorMessage('');
    try {
      const res = await portalService.updateProfile(shopSlug, profileForm);
      const updated = res?.data || res;
      setCustomer(prev => ({ ...prev, ...updated }));
      setIsEditingProfile(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsDataLoading(false);
    }
  };

  const company = portalInfo?.company;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500">
        <Spinner className="w-8 h-8 text-blue-600 mb-3" />
        <p className="text-xs font-semibold uppercase tracking-wider">Loading Customer Portal...</p>
      </div>
    );
  }

  if (errorMessage && !customer && !portalInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Portal Not Available</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{errorMessage}</p>
          <Link
            href={`/shop/${shopSlug}`}
            className="mt-6 inline-flex items-center space-x-2 text-xs font-bold text-white bg-slate-900 px-4 py-2.5 rounded-xl hover:bg-slate-800 transition"
          >
            <Store className="w-4 h-4" />
            <span>Visit Online Shop</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 font-sans text-slate-800 antialiased">
      {/* Top Brand Banner */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {company?.logoUrl || company?.logo ? (
              <img
                src={company.logoUrl || company.logo || '/logo.png'}
                alt={company.name}
                className="w-10 h-10 rounded-xl object-contain border border-slate-200 bg-white p-0.5 shadow-2xs"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/logo.png';
                }}
              />
            ) : (
              <img
                src="/logo.png"
                alt="Company Logo"
                className="w-10 h-10 rounded-xl object-contain border border-slate-200 bg-white p-0.5 shadow-2xs"
              />
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-black text-slate-900">{company?.name || 'Customer Portal'}</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                  Customer Self-Service
                </span>
              </div>
              <p className="text-xs text-slate-400">Account, Invoices, Ledgers & Estimates</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href={`/shop/${shopSlug}`}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition flex items-center space-x-1.5"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Online Store</span>
            </Link>

            {customer && (
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Flash Messages */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!customer ? (
          /* ================================================================ */
          /* CUSTOMER SIGN IN / REGISTRATION CARD                             */
          /* ================================================================ */
          <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-100">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Sign in to your Account</h2>
              <p className="text-xs text-slate-500 mt-1">
                Access your purchase history, invoices, quotations and live account balance with {company?.name}.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Phone or Email *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210 or yourname@gmail.com"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Full Name (optional for new customers)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 px-4 rounded-xl text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <Spinner className="w-4 h-4 text-white" />
                ) : (
                  <>
                    <span>Enter Customer Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                Need help? Call {company?.phone || 'our customer care team'}.
              </p>
            </div>
          </div>
        ) : (
          /* ================================================================ */
          /* AUTHENTICATED CUSTOMER SELF-SERVICE DASHBOARD                    */
          /* ================================================================ */
          <div className="space-y-6">
            {/* Top Customer Balance Card */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Customer Portal</span>
                </div>
                <h2 className="text-2xl font-black">{customer.name}</h2>
                <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {customer.phone && (
                    <span className="inline-flex items-center space-x-1.5 text-slate-200">
                      <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{customer.phone}</span>
                    </span>
                  )}
                  {customer.email && (
                    <span className="inline-flex items-center space-x-1.5 text-slate-200">
                      <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{customer.email}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10 text-right min-w-[200px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                  Outstanding Balance
                </span>
                <span className={`text-2xl font-black block mt-0.5 ${Number(customer.current_balance) > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                  ₹{Number(customer.current_balance || 0).toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-300">
                  {Number(customer.current_balance) > 0 ? 'Amount Due' : 'All Clear / Paid'}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto space-x-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              {[
                { id: 'invoices', label: 'Invoices', icon: FileText, count: invoices.length },
                { id: 'payments', label: 'Payments', icon: CreditCard, count: payments.length },
                { id: 'ledger', label: 'Customer Ledger', icon: BookOpen },
                { id: 'quotations', label: 'Quotations', icon: IndianRupee, count: quotations.length },
                { id: 'orders', label: 'Shop Orders', icon: ShoppingBag, count: orders.length },
                { id: 'profile', label: 'My Profile', icon: User }
              ].map(tab => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs min-h-[350px]">
              {isDataLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <Spinner className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-xs">Loading records...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: INVOICES */}
                  {activeTab === 'invoices' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-base font-black text-slate-900">Invoice History</h3>
                        <span className="text-xs text-slate-500 font-bold">{invoices.length} Invoices</span>
                      </div>

                      {invoices.length === 0 ? (
                        <div className="py-16 text-center text-xs text-slate-400">
                          No invoices recorded yet under your account.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                                <th className="py-3 px-3">Invoice #</th>
                                <th className="py-3 px-3">Date</th>
                                <th className="py-3 px-3">Total Amount</th>
                                <th className="py-3 px-3">Paid</th>
                                <th className="py-3 px-3">Due</th>
                                <th className="py-3 px-3">Status</th>
                                <th className="py-3 px-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {invoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                                  <td className="py-3 px-3 font-bold text-slate-900">{inv.invoice_number}</td>
                                  <td className="py-3 px-3 text-slate-600 font-medium">
                                    {new Date(inv.invoice_date || inv.created_at).toLocaleDateString('en-IN', {
                                      day: 'numeric', month: 'short', year: 'numeric'
                                    })}
                                  </td>
                                  <td className="py-3 px-3 font-black text-slate-900">₹{Number(inv.grand_total).toFixed(2)}</td>
                                  <td className="py-3 px-3 font-bold text-blue-600">₹{Number(inv.paid_amount || 0).toFixed(2)}</td>
                                  <td className="py-3 px-3 font-bold text-amber-600">₹{Number(inv.due_amount || 0).toFixed(2)}</td>
                                  <td className="py-3 px-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                                      Number(inv.due_amount) <= 0
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}>
                                      {Number(inv.due_amount) <= 0 ? 'PAID' : 'PARTIAL / DUE'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const res = await portalService.getInvoiceById(shopSlug, inv.id);
                                          setSelectedInvoice(res?.data || res);
                                          setIsInvoiceModalOpen(true);
                                        } catch (err) {
                                          alert('Could not load invoice details.');
                                        }
                                      }}
                                      className="inline-flex items-center space-x-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 transition cursor-pointer"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      <span>View / Print PDF</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: PAYMENTS */}
                  {activeTab === 'payments' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-base font-black text-slate-900">Payment Receipts</h3>
                        <span className="text-xs text-slate-500 font-bold">{payments.length} Payments</span>
                      </div>

                      {payments.length === 0 ? (
                        <div className="py-16 text-center text-xs text-slate-400">
                          No payment transactions recorded yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                                <th className="py-3 px-3">Date</th>
                                <th className="py-3 px-3">Receipt / Ref</th>
                                <th className="py-3 px-3">Payment Mode</th>
                                <th className="py-3 px-3">Amount</th>
                                <th className="py-3 px-3">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {payments.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                                  <td className="py-3 px-3 text-slate-700 font-medium">
                                    {new Date(p.payment_date || p.created_at).toLocaleDateString('en-IN', {
                                      day: 'numeric', month: 'short', year: 'numeric'
                                    })}
                                  </td>
                                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{p.receipt_number || p.reference_number || p.id.slice(0, 8)}</td>
                                  <td className="py-3 px-3 text-slate-600 font-bold">{p.payment_mode || 'Cash'}</td>
                                  <td className="py-3 px-3 font-black text-blue-600">₹{Number(p.amount).toFixed(2)}</td>
                                  <td className="py-3 px-3 text-slate-500 text-[11px]">{p.notes || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: LEDGER */}
                  {activeTab === 'ledger' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-base font-black text-slate-900">Customer Statement of Account (Ledger)</h3>
                          <p className="text-xs text-slate-500">Chronological transaction debits and credits</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Statement</span>
                        </button>
                      </div>

                      {(!ledger.entries || ledger.entries.length === 0) ? (
                        <div className="py-16 text-center text-xs text-slate-400">
                          No ledger activity recorded yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                                <th className="py-3 px-3">Date</th>
                                <th className="py-3 px-3">Reference / Details</th>
                                <th className="py-3 px-3 text-right">Debit (Invoice)</th>
                                <th className="py-3 px-3 text-right">Credit (Payment)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {ledger.entries.map((entry, idx) => (
                                <tr key={entry.id || idx} className="hover:bg-slate-50/80 transition">
                                  <td className="py-3 px-3 text-slate-600 font-medium">
                                    {new Date(entry.date || entry.createdAt).toLocaleDateString('en-IN', {
                                      day: 'numeric', month: 'short', year: 'numeric'
                                    })}
                                  </td>
                                  <td className="py-3 px-3 font-semibold text-slate-800">
                                    {entry.invoiceNumber || entry.reference}
                                  </td>
                                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                                    {Number(entry.debit) > 0 ? `₹${Number(entry.debit).toFixed(2)}` : '-'}
                                  </td>
                                  <td className="py-3 px-3 text-right font-bold text-blue-600">
                                    {Number(entry.credit) > 0 ? `₹${Number(entry.credit).toFixed(2)}` : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: QUOTATIONS */}
                  {activeTab === 'quotations' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-base font-black text-slate-900">Estimates & Quotations</h3>
                        <span className="text-xs text-slate-500 font-bold">{quotations.length} Estimates</span>
                      </div>

                      {quotations.length === 0 ? (
                        <div className="py-16 text-center text-xs text-slate-400">
                          No quotations or estimates on record.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                                <th className="py-3 px-3">Quotation #</th>
                                <th className="py-3 px-3">Date</th>
                                <th className="py-3 px-3">Estimated Total</th>
                                <th className="py-3 px-3">Valid Until</th>
                                <th className="py-3 px-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {quotations.map(q => (
                                <tr key={q.id} className="hover:bg-slate-50/80 transition">
                                  <td className="py-3 px-3 font-bold text-slate-900">{q.quotation_number}</td>
                                  <td className="py-3 px-3 text-slate-600 font-medium">
                                    {new Date(q.created_at).toLocaleDateString('en-IN', {
                                      day: 'numeric', month: 'short', year: 'numeric'
                                    })}
                                  </td>
                                  <td className="py-3 px-3 font-black text-slate-900">₹{Number(q.grand_total).toFixed(2)}</td>
                                  <td className="py-3 px-3 text-slate-600 text-[11px]">
                                    {q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-IN') : 'Open'}
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                                      {q.status || 'ACTIVE'}
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

                  {/* TAB 5: SHOP ORDERS */}
                  {activeTab === 'orders' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-base font-black text-slate-900">Your Online Shop Orders</h3>
                        <Link
                          href={`/shop/${shopSlug}`}
                          className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Shop More Products</span>
                        </Link>
                      </div>

                      {orders.length === 0 ? (
                        <div className="py-16 text-center text-xs text-slate-400">
                          You have not placed any online store orders yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                                <th className="py-3 px-3">Order #</th>
                                <th className="py-3 px-3">Date</th>
                                <th className="py-3 px-3">Items</th>
                                <th className="py-3 px-3">Total Estimated</th>
                                <th className="py-3 px-3">Order Status</th>
                                <th className="py-3 px-3 text-right">Invoice / PDF</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {orders.map(o => (
                                <tr key={o.id} className="hover:bg-slate-50/80 transition">
                                  <td className="py-3 px-3 font-bold text-slate-900">{o.order_number}</td>
                                  <td className="py-3 px-3 text-slate-600 font-medium">
                                    {new Date(o.created_at).toLocaleDateString('en-IN', {
                                      day: 'numeric', month: 'short', year: 'numeric'
                                    })}
                                  </td>
                                  <td className="py-3 px-3 text-slate-700 font-semibold">
                                    {(o.customer_order_items || []).length} item(s)
                                  </td>
                                  <td className="py-3 px-3 font-black text-slate-900">₹{Number(o.estimated_total).toFixed(2)}</td>
                                  <td className="py-3 px-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                                      o.status === 'BILLED'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : o.status === 'CANCELLED'
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}>
                                      {o.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    {o.sale_id ? (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            const res = await portalService.getInvoiceById(shopSlug, o.sale_id);
                                            setSelectedInvoice(res?.data || res);
                                            setIsInvoiceModalOpen(true);
                                          } catch (err) {
                                            alert('Could not load invoice details.');
                                          }
                                        }}
                                        className="inline-flex items-center space-x-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 transition cursor-pointer"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>View Invoice PDF</span>
                                      </button>
                                    ) : (
                                      <span className="text-slate-400 text-[11px] italic">Not Billed Yet</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 6: PROFILE */}
                  {activeTab === 'profile' && (
                    <div className="space-y-6 max-w-xl">
                      <div className="flex justify-between items-center">
                        <h3 className="text-base font-black text-slate-900">Personal Account Information</h3>
                        {!isEditingProfile && (
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(true)}
                            className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Details</span>
                          </button>
                        )}
                      </div>

                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                            <input
                              type="text"
                              disabled={!isEditingProfile}
                              value={profileForm.name}
                              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 disabled:bg-slate-50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                            <input
                              type="text"
                              disabled={!isEditingProfile}
                              value={profileForm.phone}
                              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 disabled:bg-slate-50"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                          <input
                            type="email"
                            disabled={!isEditingProfile}
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            className="w-full text-xs p-3 rounded-xl border border-slate-200 disabled:bg-slate-50"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Delivery / Street Address</label>
                          <input
                            type="text"
                            disabled={!isEditingProfile}
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                            className="w-full text-xs p-3 rounded-xl border border-slate-200 disabled:bg-slate-50"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                            <input
                              type="text"
                              disabled={!isEditingProfile}
                              value={profileForm.city}
                              onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 disabled:bg-slate-50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                            <input
                              type="text"
                              disabled={!isEditingProfile}
                              value={profileForm.state}
                              onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 disabled:bg-slate-50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
                            <input
                              type="text"
                              disabled={!isEditingProfile}
                              value={profileForm.pincode}
                              onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 disabled:bg-slate-50"
                            />
                          </div>
                        </div>

                        {isEditingProfile && (
                          <div className="flex justify-end space-x-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setIsEditingProfile(false)}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer flex items-center space-x-1.5"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Changes</span>
                            </button>
                          </div>
                        )}
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Invoice PDF Print Modal */}
      {isInvoiceModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Tax Invoice</h3>
                <p className="text-xs text-slate-500 font-mono">Invoice #{selectedInvoice.invoice_number}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Invoice Card */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-6 text-xs text-slate-800">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-sm text-slate-900">{company?.name}</h4>
                  <p className="text-slate-500">{company?.address}</p>
                  <p className="text-slate-500">{company?.city}, {company?.state}</p>
                  <p className="text-slate-500">Phone: {company?.phone}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-xs text-slate-900 block">Date: {new Date(selectedInvoice.invoice_date || selectedInvoice.created_at).toLocaleDateString('en-IN')}</span>
                  <span className="text-[10px] font-bold text-slate-400 block mt-1">Billed To:</span>
                  <p className="font-bold text-slate-900">{selectedInvoice.customer_name || customer.name}</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {(selectedInvoice.sale_items || []).map((si, i) => (
                    <tr key={si.id || i}>
                      <td className="py-2 font-medium">{si.product_name}</td>
                      <td className="py-2 text-center">{Number(si.quantity)}</td>
                      <td className="py-2 text-right">₹{Number(si.unit_price).toFixed(2)}</td>
                      <td className="py-2 text-right font-bold">₹{Number(si.total_amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center font-black text-sm">
                <span>Grand Total:</span>
                <span className="text-blue-700">₹{Number(selectedInvoice.grand_total).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

