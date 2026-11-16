'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { subscriptionService } from '@/services/subscriptionService';
import { useAuthStore } from '@/store/useAuthStore';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  IndianRupee,
  Clock,
  ShieldCheck,
  Building2,
  RefreshCw,
  XCircle,
  HelpCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  QrCode,
  Lock,
  Check,
  Store,
  Crown,
  ShoppingBag,
  Headphones,
  Zap,
  BarChart3,
  Layers,
  FileText,
  Boxes,
  Minus,
  MessageSquare,
  Send,
  Phone,
  Mail,
  User,
  X
} from 'lucide-react';

function SubscriptionBillingContent() {
  const user = useAuthStore((state) => state.user);
  const business = useAuthStore((state) => state.business);
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [history, setHistory] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const updateBusiness = useAuthStore((state) => state.updateBusiness);

  // Contact Sales Modal State
  const [showContactSalesModal, setShowContactSalesModal] = useState(false);
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);
  const [enquiryError, setEnquiryError] = useState(null);
  const [enquiryForm, setEnquiryForm] = useState({
    contact_name: '',
    business_name: '',
    email: '',
    mobile: '',
    business_type: '',
    interested_plan: 'Lifetime – ₹59,999',
    preferred_time: '',
    message: ''
  });

  const openContactSales = () => {
    setEnquirySubmitted(false);
    setEnquiryError(null);
    setEnquiryForm({
      contact_name: user?.name || business?.owner_name || '',
      business_name: business?.business_name || '',
      email: user?.email || business?.email || '',
      mobile: user?.phone || business?.phone || '',
      business_type: business?.business_type || '',
      interested_plan: 'Lifetime – ₹59,999',
      preferred_time: 'Morning (10:00 AM - 1:00 PM)',
      message: 'Hello VEXA Sales Team, I am interested in purchasing the Lifetime Plan (₹59,999) with dedicated server hosting and custom domain setup. Please contact me with further onboarding steps.'
    });
    setShowContactSalesModal(true);
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    if (!enquiryForm.contact_name?.trim()) return setEnquiryError('Please enter contact person name.');
    if (!enquiryForm.business_name?.trim()) return setEnquiryError('Please enter business or company name.');
    if (!enquiryForm.email?.trim()) return setEnquiryError('Please enter a valid email address.');
    if (!enquiryForm.mobile?.trim()) return setEnquiryError('Please enter mobile contact number.');
    if (!enquiryForm.message?.trim()) return setEnquiryError('Please enter your enquiry requirements or message.');

    setEnquirySubmitting(true);
    setEnquiryError(null);
    try {
      const res = await subscriptionService.submitSalesEnquiry({
        ...enquiryForm,
        current_plan: statusData?.subscription?.subscription_plans?.plan_name
          ? `${statusData.subscription.subscription_plans.plan_name} (${statusData.subscription.status})`
          : (business?.subscription_status === 'TRIAL' ? '7-Day Free Trial' : 'Starter')
      });
      setEnquirySubmitted(true);
      setFeedbackMessage({
        type: 'success',
        text: 'Your Lifetime Plan enquiry has been received! Our enterprise sales team will reach out to you shortly.'
      });
    } catch (err) {
      setEnquiryError(err.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setEnquirySubmitting(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        subscriptionService.getCompanyStatus(),
        subscriptionService.getPaymentHistory()
      ]);

      const sData = statusRes?.data || statusRes || null;
      if (sData) {
        setStatusData(sData);
        // Automatically sync latest subscription status into AuthStore & localStorage
        if (sData.company) {
          updateBusiness({
            subscription_status: sData.company.subscription_status,
            license_status: sData.company.license_status,
            self_shopping_status: sData.company.self_shopping_status
          });
        }
      }

      const hData = historyRes?.data || historyRes || [];
      const historyList = Array.isArray(hData) ? hData : (hData?.history || []);
      setHistory(historyList);
    } catch (err) {
      console.error('Error loading subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if return redirect occurred from Razorpay or previous session callback
  useEffect(() => {
    const rzpSubId = searchParams.get('subscription_id') || searchParams.get('razorpay_subscription_id');
    const rzpOrderId = searchParams.get('order_id') || searchParams.get('razorpay_order_id');
    const rzpPaymentId = searchParams.get('razorpay_payment_id');
    const rzpSignature = searchParams.get('razorpay_signature');
    const shouldVerifyMonthly = searchParams.get('verify') === 'true';
    const shouldVerifyLifetime = searchParams.get('verify_lifetime') === 'true';

    const verifyReturnSession = async () => {
      if (rzpOrderId && shouldVerifyLifetime) {
        setProcessing(true);
        setFeedbackMessage({ type: 'info', text: 'Authoritatively verifying Lifetime Plan payment with Razorpay...' });
        try {
          const res = await subscriptionService.verifyLifetime({
            order_id: rzpOrderId,
            razorpay_payment_id: rzpPaymentId,
            razorpay_signature: rzpSignature
          });
          setFeedbackMessage({
            type: 'success',
            text: res?.message || 'Lifetime Plan unlocked! You have permanent access to all core billing modules and Custom Online Shop Store.'
          });
        } catch (err) {
          setFeedbackMessage({
            type: 'warning',
            text: err.response?.data?.message || err.message || 'Payment verification pending. If money was debited, it will activate shortly via webhook.'
          });
        } finally {
          setProcessing(false);
          await loadData();
        }
      } else if (rzpSubId && shouldVerifyMonthly) {
        setProcessing(true);
        setFeedbackMessage({ type: 'info', text: 'Verifying subscription mandate authorization with Razorpay...' });
        try {
          const res = await subscriptionService.verifySubscription({
            subscription_id: rzpSubId,
            razorpay_payment_id: rzpPaymentId,
            razorpay_signature: rzpSignature
          });
          setFeedbackMessage({
            type: 'success',
            text: 'Subscription authorization verified via Razorpay! Your monthly access is now active.'
          });
        } catch (err) {
          setFeedbackMessage({
            type: 'warning',
            text: err.message || 'Authorization is pending or in progress with bank. Status will update automatically.'
          });
        } finally {
          setProcessing(false);
          await loadData();
        }
      } else {
        loadData();
      }
    };

    verifyReturnSession();
  }, [searchParams]);

  // Helper to dynamically load Razorpay Checkout JS SDK
  const loadRazorpaySdk = () => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        return resolve(window.Razorpay);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => reject(new Error('Failed to load Razorpay Payment Checkout SDK'));
      document.body.appendChild(script);
    });
  };

  // Initiate Razorpay Monthly Subscription Mandate Flow (Starter ₹599 or Growth ₹999)
  const handleSubscribeMonthly = async (planType = 'STARTER') => {
    if (processing) return;
    setProcessing(true);
    setFeedbackMessage(null);
    try {
      const isGrowth = String(planType).toUpperCase().includes('GROWTH');
      const planLabel = isGrowth ? 'VEXA Growth (₹999/month)' : 'VEXA Starter (₹599/month)';
      const res = await subscriptionService.subscribe(isGrowth ? 'GROWTH' : 'STARTER');
      const payload = res?.data || res;
      const subscriptionId = payload.subscription_id;
      const keyId = payload.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!subscriptionId) {
        throw new Error('Razorpay subscription session was not generated.');
      }

      setFeedbackMessage({ type: 'info', text: `Opening Razorpay recurring subscription checkout for ${planLabel}...` });
      const RazorpayConstructor = await loadRazorpaySdk();

      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: 'VEXA Invoice',
        description: `${planLabel} - Recurring Subscription`,
        handler: async function (response) {
          setProcessing(true);
          setFeedbackMessage({ type: 'info', text: 'Verifying subscription mandate with Razorpay...' });
          try {
            const verifyRes = await subscriptionService.verifySubscription({
              subscription_id: subscriptionId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            setFeedbackMessage({
              type: 'success',
              text: verifyRes?.message || `${planLabel} activated successfully via Razorpay!`
            });
          } catch (err) {
            setFeedbackMessage({
              type: 'warning',
              text: err.response?.data?.message || err.message || 'Payment received. Subscription authorization status will synchronize automatically.'
            });
          } finally {
            setProcessing(false);
            await loadData();
          }
        },
        prefill: {
          name: payload.customer?.name || business?.name || '',
          email: payload.customer?.email || business?.email || '',
          contact: payload.customer?.contact || business?.phone || ''
        },
        theme: {
          color: isGrowth ? '#059669' : '#2563eb'
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          }
        }
      };

      const rzpInstance = new RazorpayConstructor(options);
      rzpInstance.open();
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to initiate Razorpay subscription mandate'
      });
      setProcessing(false);
    }
  };

  // Initiate Lifetime Purchase Flow (₹59,999 Flat One-Time)
  const handlePurchaseLifetime = async () => {
    if (processing) return;
    setProcessing(true);
    setFeedbackMessage(null);
    try {
      const res = await subscriptionService.purchaseLifetime();
      const payload = res?.data || res;
      const orderId = payload.order_id;
      const keyId = payload.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!orderId) {
        throw new Error('Razorpay order was not generated.');
      }

      setFeedbackMessage({ type: 'info', text: 'Launching Razorpay checkout for ₹59,999 Lifetime Plan...' });
      const RazorpayConstructor = await loadRazorpaySdk();

      const options = {
        key: keyId,
        amount: payload.amount_in_paise || (59999 * 100),
        currency: 'INR',
        name: 'VEXA Invoice',
        description: 'VEXA Invoice Lifetime Plan (Permanent Access & Custom Online Store)',
        order_id: orderId,
        handler: async function (response) {
          setProcessing(true);
          setFeedbackMessage({ type: 'info', text: 'Authoritatively verifying Lifetime Plan payment with Razorpay...' });
          try {
            const verifyRes = await subscriptionService.verifyLifetime({
              order_id: orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            setFeedbackMessage({
              type: 'success',
              text: verifyRes?.message || 'Lifetime Plan unlocked! Permanent access to all modules and Custom Online Shop Store granted.'
            });
          } catch (err) {
            setFeedbackMessage({
              type: 'warning',
              text: err.response?.data?.message || err.message || 'Payment received. Lifetime entitlement verification is finalizing.'
            });
          } finally {
            setProcessing(false);
            await loadData();
          }
        },
        prefill: {
          name: payload.customer?.name || business?.name || '',
          email: payload.customer?.email || business?.email || '',
          contact: payload.customer?.contact || business?.phone || ''
        },
        theme: {
          color: '#7c3aed'
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          }
        }
      };

      const rzpInstance = new RazorpayConstructor(options);
      rzpInstance.open();
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to initiate lifetime plan checkout'
      });
      setProcessing(false);
    }
  };

  // Reconcile / Re-verify with Secured Payment Gateway
  const handleVerifyNow = async () => {
    if (processing) return;
    setProcessing(true);
    setFeedbackMessage({ type: 'info', text: 'Connecting to Secured Payment Gateway to reconcile current status...' });
    try {
      const subId = statusData?.subscription?.provider_subscription_id;
      const res = await subscriptionService.verifySubscription(subId);
      setFeedbackMessage({
        type: 'success',
        text: 'Payment gateway status successfully synchronized!'
      });
      await loadData();
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Verification check failed'
      });
    } finally {
      setProcessing(false);
    }
  };

  // Cancel Monthly Subscription
  const handleCancelSubscription = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await subscriptionService.cancelSubscription(cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
      setFeedbackMessage({
        type: 'success',
        text: res.message || 'Monthly subscription cancellation confirmed. Core access remains active until your current period ends. Lifetime entitlements remain completely unaffected.'
      });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to process cancellation');
    } finally {
      setProcessing(false);
    }
  };

  const subscription = statusData?.subscription;
  const access = statusData?.access || {};
  const selfShopping = statusData?.selfShopping || {};
  const isRazorpayConfigured = statusData?.razorpayConfigured !== false && statusData?.cashfreeConfigured !== false;
  const isLifetimeActive = selfShopping.isLifetime === true || selfShopping.status === 'LIFETIME_ACTIVE' || access.isLifetime === true;

  // Filter payment history to show relevant subscription & lifetime payments
  const relevantHistory = history.filter(
    (tx) => tx.payment_type === 'MONTHLY_SUBSCRIPTION' || tx.payment_type === 'ONE_TIME_LICENSE' || tx.subscription_id || (tx.provider === 'RAZORPAY') || (tx.provider === 'CASHFREE')
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };



  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        
        {/* Breadcrumb & Modern Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-xs">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              <span>Settings</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-blue-600">Subscription & Billing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Choose Your VEXA Invoice Plan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Run your business today. Grow your online store tomorrow.
            </p>
          </div>

          {/* Current Billing Status Indicator Badge */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 p-2.5 px-4 rounded-xl shrink-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Status:</span>
            {isLifetimeActive ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                <Crown className="w-3.5 h-3.5 mr-1 text-blue-600" /> LIFETIME ACTIVE
              </span>
            ) : subscription?.status === 'ACTIVE' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> MONTHLY ACTIVE
              </span>
            ) : subscription?.status === 'TRIALING' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" /> TRIAL ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-200 text-slate-700">
                {subscription?.status || 'PENDING'}
              </span>
            )}

            {subscription && (
              <button
                type="button"
                onClick={handleVerifyNow}
                disabled={processing}
                title="Reconcile with Gateway"
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer disabled:opacity-50 ml-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${processing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMessage && (
          <div
            className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between border ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : feedbackMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : feedbackMessage.type === 'warning'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-xs font-bold underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Payment Gateway Credentials Missing Notice */}
        {!isRazorpayConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-extrabold text-sm text-amber-900">Razorpay Credentials Not Configured</p>
              <p className="mt-1">
                Your payment gateway credentials have not yet been specified in the backend environment. Configure <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">RAZORPAY_KEY_ID</code> and <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">RAZORPAY_KEY_SECRET</code> to enable automated checkout.
              </p>
            </div>
          </div>
        )}

        {/* Grace Period Warning Notice */}
        {access.gracePeriodActive && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 sm:p-5 flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-extrabold text-orange-950">Grace Period Active ({access.daysRemaining} days remaining)</h3>
              <p className="text-xs text-orange-800 mt-1">
                Your monthly renewal payment was past due or declined. Full core access remains enabled during this grace period. Please retry renewal before it expires.
              </p>
            </div>
          </div>
        )}

        {/* 3 PRICING PACKAGE CARDS (STARTER, GROWTH & LIFETIME) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* PACKAGE 1: STARTER — ₹599/month */}
          <div className="bg-white rounded-3xl border border-blue-200/80 p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                  Starter Plan
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                  subscription?.status === 'ACTIVE' && Number(subscription.amount) < 900 && !subscription.subscription_plans?.plan_name?.toUpperCase().includes('GROWTH')
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {subscription?.status === 'ACTIVE' && Number(subscription.amount) < 900 && !subscription.subscription_plans?.plan_name?.toUpperCase().includes('GROWTH') ? 'ACTIVE' : 'AVAILABLE'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-4 tracking-tight">
                VEXA Starter
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                All essential business management features for sales, billing, inventory, customers, finance and reporting.
              </p>

              {/* Price Block: Flat ₹599 / month */}
              <div className="mt-5 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-slate-900">₹599</span>
                  <span className="text-xs font-bold text-blue-700">/ month</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Automated monthly recurring billing mandate. Cancel anytime.
                </p>
              </div>

              {/* Feature List */}
              <div className="mt-5 space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">
                  Starter Inclusions
                </span>
                <ul className="space-y-2 text-xs text-slate-700 font-medium">
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Sales and POS Billing</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Invoices & Proforma Estimates</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Products, Variants & Categories</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Inventory & Stock Management</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Barcodes & Automatic SKU Generation</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>GST & Tax Invoicing</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Customer & Supplier Directory</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Customer Intelligence & CRM</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Customer Payments & Ledgers</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Supplier Payments & Ledgers</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Purchase Orders & Stock Inward</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Sales Returns & Purchase Returns</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Quotations & Estimates</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Payments, Finance & Expense Tracking</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Reports & Financial Analytics</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>WhatsApp Integration & Campaigns</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Employee Management & Roles/Permissions</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Help Center & Support Tickets</span>
                  </li>
                </ul>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                    Not Included in Starter
                  </span>
                  <ul className="space-y-1.5 text-[11px] text-slate-400 font-medium">
                    <li className="flex items-center space-x-2">
                      <Minus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Customer Self-Service Portal</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Minus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Customer Online Shop & QR Shopping</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Minus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Customer Order Management</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions for Starter Plan */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleSubscribeMonthly('STARTER')}
                disabled={processing}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>Choose Starter — ₹599/mo</span>
              </button>
            </div>
          </div>

          {/* PACKAGE 2: GROWTH — ₹999/month */}
          <div className="bg-white rounded-3xl border-2 border-blue-600 p-6 sm:p-7 shadow-lg shadow-blue-500/10 flex flex-col justify-between relative overflow-hidden">
            {/* MOST POPULAR BADGE */}
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-xs">
              MOST POPULAR
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  Growth Plan
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                  subscription?.status === 'ACTIVE' && (Number(subscription.amount) >= 900 || subscription.subscription_plans?.plan_name?.toUpperCase().includes('GROWTH'))
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-blue-50 text-blue-700'
                }`}>
                  {subscription?.status === 'ACTIVE' && (Number(subscription.amount) >= 900 || subscription.subscription_plans?.plan_name?.toUpperCase().includes('GROWTH')) ? 'ACTIVE' : 'UPGRADE'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-4 tracking-tight flex items-center space-x-1.5">
                <span>VEXA Growth</span>
                <Sparkles className="w-5 h-5 text-blue-600 fill-blue-100" />
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Everything in Starter, plus Customer Self-Service Portal, Online Shop and QR Shopping.
              </p>

              {/* Price Block: Flat ₹999 / month */}
              <div className="mt-5 p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-slate-900">₹999</span>
                  <span className="text-xs font-bold text-blue-700">/ month</span>
                </div>
                <p className="text-[11px] text-blue-900 mt-1 font-medium">
                  Automated monthly recurring billing mandate. All portal & shop features unlocked.
                </p>
              </div>

              {/* Feature List */}
              <div className="mt-5 space-y-3">
                <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-800">
                  <div className="flex items-center space-x-2 text-blue-800 font-bold mb-0.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Includes All Starter Plan Features</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                    POS billing, GST invoicing, inventory, stock inward, payments, ledgers, finance, reports, CRM, WhatsApp & employee access.
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block mb-2">
                    Growth Plan Unlocks:
                  </span>
                  <ul className="space-y-2 text-xs text-slate-700 font-medium">
                    <li className="flex items-center space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-slate-900">Customer Self-Service Portal</span>
                    </li>
                    <li className="flex items-center space-x-2.5 pl-6">
                      <span className="text-slate-600">• Customer Registration & Secure Login</span>
                    </li>
                    <li className="flex items-center space-x-2.5 pl-6">
                      <span className="text-slate-600">• Customer Profile & Account Management</span>
                    </li>
                    <li className="flex items-center space-x-2.5 pl-6">
                      <span className="text-slate-600">• Invoice History & Instant PDF Downloads</span>
                    </li>
                    <li className="flex items-center space-x-2.5 pl-6">
                      <span className="text-slate-600">• Payment History & Downloadable Receipts</span>
                    </li>
                    <li className="flex items-center space-x-2.5 pl-6">
                      <span className="text-slate-600">• Customer Ledger & Outstanding Due Tracking</span>
                    </li>
                    <li className="flex items-center space-x-2.5 pl-6">
                      <span className="text-slate-600">• Quotations & Proforma History View</span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-slate-900">Online Shop & QR Shopping</span>
                    </li>
                    <li className="flex items-center space-x-2.5 pl-6">
                      <span className="text-slate-600">• Public Online Shop Storefront (/shop/slug)</span>
                    </li>
                    <li className="flex items-center space-x-2.5 pl-6">
                      <span className="text-slate-600">• QR Code Generation for Counter/Tables</span>
                    </li>
                    <li className="flex items-center space-x-2.5 pl-6">
                      <span className="text-slate-600">• Customer Self-Order Submission & Browsing</span>
                    </li>
                    <li className="flex items-center space-x-2.5 pl-6">
                      <span className="text-slate-600">• Live Order Management & Invoice Conversion</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions for Growth Plan */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleSubscribeMonthly('GROWTH')}
                disabled={processing}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer shadow-md shadow-blue-600/25 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Choose Growth — ₹999/mo</span>
              </button>
            </div>
          </div>

          {/* PACKAGE 3: LIFETIME — ₹59,999 One-Time */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden">
            {/* BEST VALUE Badge */}
            <div className="absolute top-0 right-0 bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-xs">
              BEST VALUE — LIFETIME
            </div>

            <div>
              <div className="flex items-center space-x-1.5 text-blue-700 font-extrabold text-xs uppercase tracking-wider">
                <Crown className="w-4 h-4 text-blue-600" />
                <span>All-Inclusive Lifetime</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-4 tracking-tight">
                VEXA Lifetime
              </h2>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Everything in Growth with lifetime software access, including one year of free custom domain and server hosting.
              </p>

              {/* Price Block: Flat ₹59,999 One-Time */}
              <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-black text-slate-900">₹59,999</span>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">One-Time Payment</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium mt-1">
                  Pay once for perpetual software entitlement. Zero monthly software fees forever.
                </p>
              </div>

              {/* Inclusions Overview */}
              <div className="mt-5 space-y-3">
                <div className="p-2.5 bg-blue-50/40 rounded-xl border border-blue-100 text-xs text-slate-800">
                  <div className="flex items-center space-x-2 text-blue-700 font-bold mb-0.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Includes All Growth Plan Features</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
                    All core billing, customer portal, online shop, QR shopping, order management, and future updates.
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-slate-700 font-medium">
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-bold text-slate-900">Lifetime Software Entitlement</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Customer Self-Service Portal Included</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Online Shop Storefront & QR Shopping Included</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Customer Order Submission & Management Included</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-bold text-slate-900">Custom Business Domain (1st Year Free)</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-bold text-slate-900">Dedicated Server Hosting (1st Year Free)</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Initial Domain & Hosting Setup Assistance</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Lifetime Technical Support & Software Maintenance</span>
                  </li>
                </ul>

                {/* Clear Renewal Condition Notice */}
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-[11px] text-slate-700 leading-relaxed">
                  <p className="font-bold text-blue-950 flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Important Hosting & Domain Terms:</span>
                  </p>
                  Custom domain name and server hosting infrastructure are free for the first year. After the first year, standard third-party domain and server renewal charges apply. The core VEXA Invoice software license remains free for life with zero recurring software fees.
                </div>
              </div>
            </div>

            {/* Actions for Lifetime Plan */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              {isLifetimeActive ? (
                <div className="py-3 px-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-black flex items-center justify-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Lifetime Active — No Renewal</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openContactSales}
                  disabled={processing}
                  className="w-full py-3 px-4 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Phone className="w-4 h-4" />
                  <span>Contact Sales</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* PAYMENT & INVOICING HISTORY TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Payment & Invoicing History</h3>
              <p className="text-xs text-slate-500 mt-0.5">Authoritative transaction records for monthly subscriptions and lifetime purchases</p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              {relevantHistory.length} Record{relevantHistory.length === 1 ? '' : 's'}
            </span>
          </div>

          {relevantHistory.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 border border-slate-200">
                <IndianRupee className="w-5 h-5 text-slate-400" />
              </div>
              No previous payment transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Plan / Product</th>
                    <th className="py-3 px-3">Reference / Order</th>
                    <th className="py-3 px-3">Provider</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {relevantHistory.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 text-slate-700 font-semibold whitespace-nowrap">
                        {formatDate(tx.received_at || tx.created_at)}
                      </td>
                      <td className="py-3 px-3 text-slate-900 font-bold whitespace-nowrap">
                        {tx.payment_type === 'ONE_TIME_LICENSE' ? (
                          <span className="text-blue-700 font-extrabold">VEXA Invoice Lifetime</span>
                        ) : (
                          <span>VEXA Invoice Monthly</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-900 font-bold whitespace-nowrap">
                        {tx.provider_order_id || tx.provider_payment_id || tx.reference_number || tx.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-semibold">
                        {tx.provider || 'RAZORPAY'}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                        ₹{Number(tx.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {tx.status === 'VERIFIED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            SUCCESS
                          </span>
                        ) : tx.status === 'FAILED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                            FAILED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                            {tx.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Contact Sales Enquiry Modal */}
        {showContactSalesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-5 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Contact Sales — Lifetime Plan</h3>
                    <p className="text-xs text-slate-500">Dedicated onboarding, custom domain & lifetime software entitlement</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowContactSalesModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {enquirySubmitted ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">Enquiry Received Successfully!</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                      Thank you for your interest in VEXA Invoice Lifetime Plan. Our sales team has been notified and will contact you via email or phone within 2 business hours.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowContactSalesModal(false)}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer shadow-sm"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="space-y-4">
                  {enquiryError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{enquiryError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Contact Person Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={enquiryForm.contact_name}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, contact_name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Business / Company Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={enquiryForm.business_name}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, business_name: e.target.value })}
                        placeholder="Business name"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={enquiryForm.email}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                        placeholder="you@company.com"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={enquiryForm.mobile}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, mobile: e.target.value })}
                        placeholder="10-digit mobile number"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Interested Plan
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={enquiryForm.interested_plan}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-blue-700 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Business Type / Industry
                      </label>
                      <input
                        type="text"
                        value={enquiryForm.business_type}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, business_type: e.target.value })}
                        placeholder="e.g. Retail, Garments, Wholesale"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Preferred Contact Time (Optional)
                    </label>
                    <input
                      type="text"
                      value={enquiryForm.preferred_time}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, preferred_time: e.target.value })}
                      placeholder="e.g. Tomorrow 11:00 AM, Evening, or anytime"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Message / Requirements <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows="3"
                      required
                      value={enquiryForm.message}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                      placeholder="Please mention any custom requirements, branches, or onboarding assistance needed..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowContactSalesModal(false)}
                      disabled={enquirySubmitting}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={enquirySubmitting}
                      className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{enquirySubmitting ? 'Submitting Enquiry...' : 'Submit Enquiry'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Monthly Cancellation Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="p-2 bg-rose-50 rounded-xl border border-rose-100">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Cancel Monthly Subscription?</h3>
                  <p className="text-xs text-slate-500">Please review policy before confirming</p>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-2">
                <p className="font-extrabold">Effective Cancellation Terms:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Your core software access remains active until the end of the paid period: <strong>{formatDate(subscription?.current_period_end)}</strong>.</li>
                  <li>Future automated monthly charges will be stopped on your Razorpay subscription mandate.</li>
                  <li><strong>Lifetime Plan Protection:</strong> If you purchased the ₹59,999 Lifetime Plan, that entitlement remains permanently active and is NOT affected by monthly subscription cancellation.</li>
                  <li>All your invoice, inventory, and historical product data is safely preserved.</li>
                </ul>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Reason for cancellation (optional):
                </label>
                <textarea
                  rows="3"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Tell us why you are cancelling..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  disabled={processing}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Keep Subscription
                </button>
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  disabled={processing}
                  className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {processing ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function SubscriptionBillingPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <Suspense fallback={
        <DashboardLayout>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-6xl mx-auto">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">Loading subscription details...</p>
          </div>
        </DashboardLayout>
      }>
        <SubscriptionBillingContent />
      </Suspense>
    </ProtectedRoute>
  );
}
