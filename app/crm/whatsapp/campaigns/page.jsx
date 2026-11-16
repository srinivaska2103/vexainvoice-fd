'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wallet,
  Users,
  Eye,
  XCircle,
  Filter,
  Sparkles,
  Search,
  History,
  Tag,
  Check,
  ShoppingBag,
  Receipt,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Phone,
  Store,
  DollarSign,
  Layers,
  HelpCircle,
  Calendar,
  Smartphone,
  CheckCheck
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { whatsappService } from '@/services/whatsappService';
import { productService } from '@/services/productService';
import { customerService } from '@/services/customerService';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

function UnifiedWhatsAppWorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { business, user, role } = useAuth();
  const { toastSuccess, toastError, toastWarning } = useToast();

  const userRoleSlug = user?.custom_role?.slug || user?.role_slug || (role === 'ADMIN' ? 'admin' : 'user');

  // Tab state: 'overview' | 'wallet' | 'create' | 'history' | 'messages'
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab === 'templates' ? 'overview' : initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'wallet', 'create', 'history', 'messages'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (tabParam === 'templates') {
      setActiveTab('overview');
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('tab', tab);
    router.replace(`?${newParams.toString()}`);
  };

  // Global State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [rates, setRates] = useState({ MARKETING: 0.85, UTILITY: 0.35 });
  const [campaigns, setCampaigns] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [templatesStatus, setTemplatesStatus] = useState([]);

  // Fetch Master Data
  const loadWorkspaceData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const [walletRes, ratesRes, campRes, txRes, msgRes, tplRes] = await Promise.all([
        whatsappService.getWallet().catch(() => ({ data: { current_balance: 0, reserved_balance: 0, available_balance: 0 } })),
        whatsappService.getRates().catch(() => ({ data: { MARKETING: 0.85, UTILITY: 0.35 } })),
        whatsappService.listCampaigns({ limit: 50 }).catch(() => ({ data: [] })),
        whatsappService.getTransactions({ limit: 50 }).catch(() => ({ data: [] })),
        whatsappService.listMessages({ limit: 50 }).catch(() => ({ data: [] })),
        whatsappService.getTemplatesStatus().catch(() => ({ templates: [] }))
      ]);

      setWallet(walletRes.data || walletRes);
      setRates(ratesRes.data || { MARKETING: 0.85, UTILITY: 0.35 });
      setCampaigns(campRes.data || []);
      setTransactions(txRes.data || []);
      setMessages(msgRes.data || []);
      setTemplatesStatus(tplRes.templates || []);
    } catch (err) {
      toastError(err.message || 'Failed to sync WhatsApp data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  // ----------------------------------------------------
  // RECHARGE / WALLET LOGIC
  // ----------------------------------------------------
  const [selectedTopupPreset, setSelectedTopupPreset] = useState('500');
  const [customTopupAmount, setCustomTopupAmount] = useState('');
  const [isRecharging, setIsRecharging] = useState(false);
  const [rechargeSuccessReceipt, setRechargeSuccessReceipt] = useState(null);

  const getEffectiveRechargeAmount = () => {
    if (selectedTopupPreset === 'CUSTOM') {
      return parseFloat(customTopupAmount) || 0;
    }
    return parseFloat(selectedTopupPreset) || 0;
  };

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

  const handleInitiateRecharge = async () => {
    const amount = getEffectiveRechargeAmount();
    if (isNaN(amount) || amount < 5) {
      toastError('Minimum recharge amount is ₹5');
      return;
    }

    setIsRecharging(true);
    try {
      const orderData = await whatsappService.createRechargeOrder(amount);
      const data = orderData.data || orderData;

      // Dynamically load Razorpay SDK
      const RazorpayConstructor = await loadRazorpaySdk().catch(() => null);

      if (RazorpayConstructor && data.order_id && !data.order_id.startsWith('order_sim_')) {
        const options = {
          key: data.key_id,
          amount: data.amount_in_paise,
          currency: data.currency || 'INR',
          name: 'VEXA TECH WhatsApp Wallet',
          description: `Wallet Top-up of ${formatCurrency(amount)}`,
          image: '/logo.png',
          order_id: data.order_id,
          prefill: {
            name: data.business_name || business?.business_name,
            email: data.business_email || user?.email,
            contact: data.business_phone || user?.phone || ''
          },
          theme: {
            color: '#2563EB'
          },
          handler: async function (response) {
            try {
              await whatsappService.verifyRechargePayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount
              });
              toastSuccess(`Recharge successful! Credited ${formatCurrency(amount)}`);
              setRechargeSuccessReceipt({
                amount,
                id: response.razorpay_payment_id,
                time: new Date().toLocaleTimeString()
              });
              loadWorkspaceData(true);
            } catch (vErr) {
              toastError(vErr.message || 'Payment verification failed');
            }
          },
          modal: {
            ondismiss: function () {
              setIsRecharging(false);
            }
          }
        };

        const rzpInstance = new RazorpayConstructor(options);
        rzpInstance.open();
      } else {
        // Fallback / Sandbox direct verification
        await whatsappService.verifyRechargePayment({
          razorpay_order_id: data.order_id || `order_sim_${Date.now()}`,
          razorpay_payment_id: `pay_direct_${Date.now()}`,
          razorpay_signature: 'sandbox_auth',
          amount
        });
        toastSuccess(`Recharge successful! Credited ${formatCurrency(amount)}`);
        setRechargeSuccessReceipt({
          amount,
          id: `PAY_SANDBOX_${Date.now()}`,
          time: new Date().toLocaleTimeString()
        });
        loadWorkspaceData(true);
      }
    } catch (err) {
      toastError(err.message || 'Failed to initiate recharge');
    } finally {
      setIsRecharging(false);
    }
  };

  // ----------------------------------------------------
  // CREATE CAMPAIGN WIZARD LOGIC
  // ----------------------------------------------------
  const [createStep, setCreateStep] = useState(1);
  const [campaignType, setCampaignType] = useState('vexa_new_offers_campaign'); // or 'vexa_new_product_announcement'
  const [campaignName, setCampaignName] = useState('');

  // Offer fields
  const [offerIntro, setOfferIntro] = useState('Exclusive seasonal discount for our valued customers!');
  const [offerDetails, setOfferDetails] = useState('Flat 20% off on all new arrivals this festive weekend.');
  const [offerValidUntil, setOfferValidUntil] = useState('Sunday, 30-Nov-2026');

  // Product fields
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');

  // Customer selection fields
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSegmentFilter, setCustomerSegmentFilter] = useState('ALL'); // ALL, WITH_PHONE, REPEAT, NEW
  const [previewCustomerIndex, setPreviewCustomerIndex] = useState(0);

  // Marketing consent confirmation
  const [hasMarketingConsent, setHasMarketingConsent] = useState(false);
  const [isLaunchingCampaign, setIsLaunchingCampaign] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(null);

  // Load products for product announcement
  useEffect(() => {
    productService.getProducts({ limit: 100 })
      .then((res) => {
        const list = res.data?.products || res.data || res.products || [];
        setCatalogProducts(list);
        if (list.length > 0 && !selectedProductId) {
          const first = list[0];
          setSelectedProductId(first.id);
          setProductName(first.name);
          setProductDescription(first.description || `${first.name} - Premium Quality Collection`);
          setProductPrice(String(first.retail_price || first.price || 0));
        }
      })
      .catch(() => {});
  }, []);

  // Load real customer database
  useEffect(() => {
    customerService.getCustomers({ limit: 500 })
      .then((res) => {
        const list = res.data || res.customers || (Array.isArray(res) ? res : []);
        setAllCustomers(list);
        // Preselect all eligible by default
        const eligibleIds = list
          .filter((c) => c.phone && c.phone.replace(/[^\d]/g, '').length >= 10)
          .map((c) => c.id);
        setSelectedCustomerIds(eligibleIds);
      })
      .catch(() => {});
  }, []);

  const handleSelectProduct = (prodId) => {
    setSelectedProductId(prodId);
    const prod = catalogProducts.find((p) => p.id === prodId);
    if (prod) {
      setProductName(prod.name);
      setProductDescription(prod.description || `${prod.name} - Premium Quality Collection`);
      setProductPrice(String(prod.retail_price || prod.price || 0));
    }
  };

  // Filtered customers for Step 3
  const filteredCustomers = useMemo(() => {
    return allCustomers.filter((c) => {
      const cleanPhone = (c.phone || '').replace(/[^\d]/g, '');
      const hasValidPhone = cleanPhone.length >= 10;

      if (customerSegmentFilter === 'WITH_PHONE' && !hasValidPhone) return false;
      if (customerSegmentFilter === 'NO_PHONE' && hasValidPhone) return false;

      if (customerSearch) {
        const q = customerSearch.toLowerCase();
        const matchesName = (c.name || '').toLowerCase().includes(q);
        const matchesPhone = (c.phone || '').includes(q);
        return matchesName || matchesPhone;
      }
      return true;
    });
  }, [allCustomers, customerSearch, customerSegmentFilter]);

  // Recipient statistics
  const eligibleSelectedCount = useMemo(() => {
    return allCustomers.filter((c) => {
      if (!selectedCustomerIds.includes(c.id)) return false;
      const clean = (c.phone || '').replace(/[^\d]/g, '');
      return clean.length >= 10;
    }).length;
  }, [allCustomers, selectedCustomerIds]);

  const marketingRate = rates.MARKETING || 0.85;
  const estimatedCampaignCost = Number((eligibleSelectedCount * marketingRate).toFixed(2));
  const availableBalance = wallet?.available_balance || 0;
  const isBalanceSufficient = availableBalance >= estimatedCampaignCost;
  const balanceShortfall = Math.max(0, Number((estimatedCampaignCost - availableBalance).toFixed(2)));
  const estimatedRemainingBalance = isBalanceSufficient ? Number((availableBalance - estimatedCampaignCost).toFixed(2)) : 0;

  // Selected customer for preview
  const previewCustomers = useMemo(() => {
    return allCustomers.filter((c) => selectedCustomerIds.includes(c.id) && (c.phone || '').replace(/[^\d]/g, '').length >= 10);
  }, [allCustomers, selectedCustomerIds]);

  const currentPreviewCustomer = previewCustomers[previewCustomerIndex] || {
    name: 'Valued Customer',
    phone: '+91 98765 43210'
  };

  const handleLaunchCampaign = async () => {
    if (!campaignName.trim()) {
      toastError('Please enter a campaign name');
      setCreateStep(2);
      return;
    }
    if (eligibleSelectedCount === 0) {
      toastError('No eligible customers with valid WhatsApp numbers selected');
      setCreateStep(3);
      return;
    }
    if (!isBalanceSufficient) {
      toastError(`Insufficient wallet balance. Please add at least ${formatCurrency(balanceShortfall)}.`);
      return;
    }
    if (!hasMarketingConsent) {
      toastWarning('Please confirm promotional marketing consent authorization.');
      return;
    }

    setIsLaunchingCampaign(true);
    setSendingProgress({ current: 0, total: eligibleSelectedCount });

    try {
      const audienceFilter = {
        selectedCustomerIds,
        offer_intro: offerIntro,
        offer_details: offerDetails,
        valid_until: offerValidUntil,
        product_name: productName,
        product_description: productDescription,
        product_price: productPrice
      };

      await whatsappService.createCampaign({
        name: campaignName.trim(),
        templateName: campaignType,
        category: 'MARKETING',
        audienceFilter
      });

      toastSuccess(`🎉 Campaign "${campaignName}" launched successfully! Processing dispatches in background.`);
      loadWorkspaceData(true);
      // Reset wizard & switch to history
      setCampaignName('');
      setCreateStep(1);
      setHasMarketingConsent(false);
      handleTabChange('history');
    } catch (err) {
      toastError(err.message || 'Failed to dispatch campaign');
    } finally {
      setIsLaunchingCampaign(false);
      setSendingProgress(null);
    }
  };

  // ----------------------------------------------------
  // CANCEL CAMPAIGN ACTION
  // ----------------------------------------------------
  const handleCancelCampaign = async (id) => {
    if (!confirm('Are you sure you want to cancel this queued campaign? Unused reserved balance will be refunded.')) return;
    try {
      await whatsappService.cancelCampaign(id);
      toastSuccess('Campaign cancelled and reservation released.');
      loadWorkspaceData(true);
    } catch (err) {
      toastError(err.message || 'Failed to cancel campaign');
    }
  };

  // ----------------------------------------------------
  // MESSAGE LOGS FILTERS
  // ----------------------------------------------------
  const [logCategoryFilter, setLogCategoryFilter] = useState('ALL');
  const [logStatusFilter, setLogStatusFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');

  const filteredLogs = useMemo(() => {
    return messages.filter((m) => {
      if (logCategoryFilter !== 'ALL' && m.category !== logCategoryFilter) return false;
      if (logStatusFilter !== 'ALL' && m.status !== logStatusFilter) return false;
      if (logSearch) {
        const q = logSearch.toLowerCase();
        const phoneMatch = (m.recipient_phone || '').toLowerCase().includes(q);
        const tplMatch = (m.template_name || '').toLowerCase().includes(q);
        const custMatch = (m.customers?.name || '').toLowerCase().includes(q);
        return phoneMatch || tplMatch || custMatch;
      }
      return true;
    });
  }, [messages, logCategoryFilter, logStatusFilter, logSearch]);

  const tabsConfig = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'wallet', label: 'WhatsApp Wallet', icon: Wallet, badge: formatCurrency(wallet?.available_balance || 0) },
    { id: 'create', label: 'Create Campaign', icon: Plus },
    { id: 'history', label: 'Campaign History', icon: History, count: campaigns.length },
    { id: 'messages', label: 'Message Logs', icon: MessageSquare, count: messages.length }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start space-x-3 sm:space-x-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-2xs shrink-0 mt-0.5 sm:mt-0">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                WhatsApp Marketing Workspace
              </h1>
              <Badge variant="blue" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 shrink-0">
                PAY & USE
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Launch targeted customer marketing campaigns & monitor automated business dispatches.
            </p>
          </div>
        </div>

        {/* Global Wallet Indicator & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          <div className="flex items-center justify-between sm:justify-start space-x-3 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/80 rounded-xl px-4 py-2.5 shadow-2xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                  Available Wallet
                </span>
                <span className="text-base md:text-lg font-black text-slate-900">
                  {formatCurrency(wallet?.available_balance || 0)}
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => loadWorkspaceData(true)}
              disabled={isRefreshing}
              className="h-9 text-xs font-semibold px-2.5 text-slate-700 bg-white hover:bg-slate-50 border-slate-200 sm:hidden"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 mr-1', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadWorkspaceData(true)}
              disabled={isRefreshing}
              className="hidden sm:inline-flex h-10 text-xs font-semibold px-3 text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>

            <Button
              size="sm"
              onClick={() => handleTabChange('wallet')}
              className="w-full sm:w-auto h-10 text-xs font-bold px-3.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs justify-center rounded-xl"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Funds
            </Button>

            <Button
              size="sm"
              onClick={() => handleTabChange('create')}
              className="w-full sm:w-auto h-10 text-xs font-bold px-4 bg-slate-900 hover:bg-slate-800 text-white shadow-xs justify-center rounded-xl"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              New Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Segmented Horizontal Navigation Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-slate-200 no-scrollbar">
        {tabsConfig.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={cn(
                'flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 bg-white border border-slate-200/70'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{t.label}</span>
              {t.badge && (
                <span
                  className={cn(
                    'text-[11px] px-2 py-0.5 rounded-md font-extrabold',
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200/50'
                  )}
                >
                  {t.badge}
                </span>
              )}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border-slate-200/80 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Balance</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatCurrency(wallet?.available_balance || 0)}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                <span>Reserved: {formatCurrency(wallet?.reserved_balance || 0)}</span>
              </div>
            </Card>

            <Card className="p-5 border-slate-200/80 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Recharged</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatCurrency(
                  transactions
                    .filter((t) => t.type === 'CREDIT')
                    .reduce((acc, curr) => acc + (curr.amount || 0), 0)
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">
                {transactions.filter((t) => t.type === 'CREDIT').length} total top-ups completed
              </div>
            </Card>

            <Card className="p-5 border-slate-200/80 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marketing Campaigns</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">{campaigns.length}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">
                {campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0)} customer dispatches
              </div>
            </Card>

            <Card className="p-5 border-slate-200/80 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Messages Logged</span>
                <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">{messages.length}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">
                {messages.filter((m) => m.category === 'UTILITY').length} Utility · {messages.filter((m) => m.category === 'MARKETING').length} Marketing
              </div>
            </Card>
          </div>

          {/* Pricing Rates and Architecture Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-5 border-slate-200/80 lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Configured Message Rates
                </h3>
                <Badge variant="outline" className="text-[10px]">Authoritative</Badge>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">Marketing Messages</span>
                    <span className="text-[11px] text-blue-700 font-medium">Manual Pay & Use Campaigns</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-blue-700">₹{rates.MARKETING?.toFixed(2) || '0.85'}</span>
                    <span className="text-[10px] text-slate-500 block">/ message</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">Utility Messages</span>
                    <span className="text-[11px] text-slate-500 font-medium">Automatic Business Triggers</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-700">₹{rates.UTILITY?.toFixed(2) || '0.35'}</span>
                    <span className="text-[10px] text-slate-500 block">/ message</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200/70 text-[11px] text-amber-900 leading-relaxed font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 inline mr-1" />
                Automatic business triggers (Receipts, Overdue, Low Stock) operate autonomously without depleting promotional wallet balances.
              </div>
            </Card>

            {/* Recent Campaigns Table Preview */}
            <Card className="p-5 border-slate-200/80 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Recent Customer Campaigns
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Latest broadcast dispatches</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTabChange('history')}
                  className="text-xs font-bold"
                >
                  View All History
                </Button>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                  <Tag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No marketing campaigns launched yet</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Create your first New Offers or Product Announcement campaign</p>
                  <Button
                    size="sm"
                    onClick={() => handleTabChange('create')}
                    className="mt-3 text-xs bg-blue-600 text-white"
                  >
                    Create First Campaign
                  </Button>
                </div>
              ) : (
                /* Section 1: Overview Table */
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3 font-bold whitespace-nowrap min-w-[140px]">Campaign Name</th>
                        <th className="py-2.5 px-3 font-bold whitespace-nowrap min-w-[120px]">Template</th>
                        <th className="py-2.5 px-3 font-bold whitespace-nowrap min-w-[90px]">Recipients</th>
                        <th className="py-2.5 px-3 font-bold whitespace-nowrap min-w-[90px]">Cost</th>
                        <th className="py-2.5 px-3 font-bold whitespace-nowrap min-w-[90px]">Status</th>
                        <th className="py-2.5 px-3 font-bold whitespace-nowrap min-w-[100px]">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {campaigns.slice(0, 5).map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">{c.name}</td>
                          <td className="py-3 px-3 text-slate-600 text-[11px] whitespace-nowrap">{c.template_name}</td>
                          <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                            {c.sent_count || 0} / {c.eligible_count || 0}
                          </td>
                          <td className="py-3 px-3 font-extrabold text-blue-700 whitespace-nowrap">
                            {formatCurrency(c.actual_cost || c.estimated_cost || 0)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <Badge
                              variant={c.status === 'COMPLETED' ? 'emerald' : c.status === 'SENDING' ? 'blue' : 'amber'}
                              className="text-[10px] px-2 py-0.5 whitespace-nowrap"
                            >
                              {c.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                            {new Date(c.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: WHATSAPP WALLET */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Wallet Balance & Topup Card */}
            <Card className="p-6 border-slate-200/80 lg:col-span-1 space-y-6 bg-gradient-to-br from-white to-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Wallet Balance</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>

              {/* Wallet Balance Card with Theme-based Blue Styling */}
              <div className="p-5 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white rounded-2xl shadow-xl shadow-blue-900/20 space-y-2 border border-blue-600/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Available to Spend</span>
                  <div className="p-1.5 bg-blue-500/25 rounded-lg border border-blue-400/30">
                    <Wallet className="w-4 h-4 text-blue-200" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-black tracking-tight text-white">
                  {formatCurrency(wallet?.available_balance || 0)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-blue-200/90 pt-3 border-t border-blue-600/40 font-semibold">
                  <span>Gross Balance: {formatCurrency(wallet?.current_balance || 0)}</span>
                  <span>Reserved: {formatCurrency(wallet?.reserved_balance || 0)}</span>
                </div>
              </div>

              {/* Recharge Amount Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                    Select Recharge Amount
                  </label>
                  <span className="text-[11px] font-bold text-blue-600">Min: ₹5</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {['100', '250', '500', '1000', '2000', 'CUSTOM'].map((amt) => {
                    const isSelected = selectedTopupPreset === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setSelectedTopupPreset(amt)}
                        className={cn(
                          'py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center',
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                        )}
                      >
                        {amt === 'CUSTOM' ? 'Custom' : `₹${amt}`}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount Input always visible or expandable with dedicated quick input */}
                {selectedTopupPreset === 'CUSTOM' ? (
                  <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
                    <label className="text-[11px] font-bold text-slate-600">Enter Custom Recharge Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm font-black text-slate-400">₹</span>
                      <Input
                        type="number"
                        min="5"
                        max="50000"
                        autoFocus
                        placeholder="e.g. 50"
                        value={customTopupAmount}
                        onChange={(e) => setCustomTopupAmount(e.target.value)}
                        className="pl-7 text-sm font-black text-slate-900 border-blue-300 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <Button
                onClick={handleInitiateRecharge}
                disabled={isRecharging}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/25 cursor-pointer"
              >
                {isRecharging ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Opening Razorpay Checkout...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Continue to Payment — {formatCurrency(getEffectiveRechargeAmount())}
                  </>
                )}
              </Button>

              {rechargeSuccessReceipt && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                  <div className="font-extrabold flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                    Payment Confirmed
                  </div>
                  <div>Credited {formatCurrency(rechargeSuccessReceipt.amount)}</div>
                  <div className="text-[10px] text-emerald-600">Ref: {rechargeSuccessReceipt.id}</div>
                </div>
              )}

              <p className="text-[11px] text-slate-400 text-center font-medium leading-relaxed">
                Payments processed securely by Razorpay. Unused reserved funds for cancelled campaigns are released automatically.
              </p>
            </Card>

            {/* Wallet Ledger / Transactions */}
            <Card className="p-6 border-slate-200/80 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Transaction Ledger
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Authoritative wallet credit & deduction logs</p>
                </div>
                <Badge variant="blue" className="text-xs">{transactions.length} Transactions</Badge>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                  <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No transactions recorded yet</p>
                  <p className="text-[11px] text-slate-500">Top-up your wallet or launch a campaign to generate transaction logs</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0 no-scrollbar">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] whitespace-nowrap">
                        <th className="py-2.5 font-bold">Type</th>
                        <th className="py-2.5 font-bold">Description</th>
                        <th className="py-2.5 font-bold">Amount</th>
                        <th className="py-2.5 font-bold">Balance</th>
                        <th className="py-2.5 font-bold">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {transactions.map((tx) => {
                        const isCredit = tx.type === 'CREDIT' || tx.type === 'CAMPAIGN_RESERVATION_RELEASE';
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/70">
                            <td className="py-3 whitespace-nowrap">
                              <Badge
                                variant={isCredit ? 'emerald' : tx.type.includes('RESERVATION') ? 'amber' : 'blue'}
                                className="text-[10px] px-2 py-0.5 whitespace-nowrap"
                              >
                                {tx.type.replace(/_/g, ' ')}
                              </Badge>
                            </td>
                            <td className="py-3 text-slate-700 max-w-xs truncate whitespace-nowrap">
                              {tx.description || tx.reference}
                            </td>
                            <td className={cn('py-3 font-extrabold text-xs whitespace-nowrap', isCredit ? 'text-emerald-600' : 'text-slate-900')}>
                              {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                            </td>
                            <td className="py-3 text-slate-600 font-bold whitespace-nowrap">
                              {formatCurrency(tx.balance_after)}
                            </td>
                            <td className="py-3 text-slate-500 text-[11px] whitespace-nowrap">
                              {new Date(tx.created_at).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: CREATE CAMPAIGN WIZARD */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {[
                { s: 1, label: 'Select Template' },
                { s: 2, label: 'Campaign Details' },
                { s: 3, label: 'Select Customers' },
                { s: 4, label: 'Confirm & Send' }
              ].map((stepItem, idx) => (
                <React.Fragment key={stepItem.s}>
                  <div className="flex items-center space-x-2">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs transition-all',
                        createStep === stepItem.s
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                          : createStep > stepItem.s
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {createStep > stepItem.s ? <Check className="w-4 h-4" /> : stepItem.s}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-bold hidden sm:inline',
                        createStep === stepItem.s ? 'text-blue-700' : 'text-slate-600'
                      )}
                    >
                      {stepItem.label}
                    </span>
                  </div>
                  {idx < 3 && <div className="flex-1 h-0.5 bg-slate-200 mx-2 sm:mx-4" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Multi-Step Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* STEP 1: SELECT TEMPLATE */}
              {createStep === 1 && (
                <Card className="p-6 border-slate-200/80 space-y-5">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Step 1 — Choose Marketing Template</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Select one of the two Meta-approved promotional marketing templates.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Template Card A: New Offers */}
                    <div
                      onClick={() => setCampaignType('vexa_new_offers_campaign')}
                      className={cn(
                        'p-5 rounded-2xl border-2 transition-all cursor-pointer relative',
                        campaignType === 'vexa_new_offers_campaign'
                          ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      )}
                    >
                      {campaignType === 'vexa_new_offers_campaign' && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                        <Tag className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900">New Offers Campaign</h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                        Promote seasonal deals, flat discounts, festival offers, and store announcements.
                      </p>
                      <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-bold text-blue-700">
                        <span>vexa_new_offers_campaign</span>
                        <span>₹{marketingRate.toFixed(2)}/msg</span>
                      </div>
                    </div>

                    {/* Template Card B: New Product Announcement */}
                    <div
                      onClick={() => setCampaignType('vexa_new_product_announcement')}
                      className={cn(
                        'p-5 rounded-2xl border-2 transition-all cursor-pointer relative',
                        campaignType === 'vexa_new_product_announcement'
                          ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      )}
                    >
                      {campaignType === 'vexa_new_product_announcement' && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900">New Product Announcement</h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                        Showcase catalog arrivals, new arrivals, pricing, and specs directly from your store.
                      </p>
                      <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-bold text-purple-700">
                        <span>vexa_new_product_announcement</span>
                        <span>₹{marketingRate.toFixed(2)}/msg</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <Button
                      onClick={() => setCreateStep(2)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5"
                    >
                      Continue to Details
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* STEP 2: CAMPAIGN DETAILS */}
              {createStep === 2 && (
                <Card className="p-6 border-slate-200/80 space-y-5">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Step 2 — Campaign Details</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Configure message parameters for the selected template.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Campaign Name *
                      </label>
                      <Input
                        placeholder="e.g. Diwali Mega Weekend Sale 2026"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        className="text-sm font-semibold"
                      />
                    </div>

                    {campaignType === 'vexa_new_offers_campaign' ? (
                      <>
                        <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                            Offer Introduction (Variable 3) *
                          </label>
                          <Input
                            placeholder="e.g. Exclusive seasonal discount for our valued customers!"
                            value={offerIntro}
                            onChange={(e) => setOfferIntro(e.target.value)}
                            className="text-sm font-semibold"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                            Offer Details (Variable 4) *
                          </label>
                          <textarea
                            rows={3}
                            placeholder="e.g. Flat 20% off on all garments, sarees and festive collections."
                            value={offerDetails}
                            onChange={(e) => setOfferDetails(e.target.value)}
                            className="w-full text-sm font-semibold p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                            Valid Until Date (Variable 5) *
                          </label>
                          <Input
                            placeholder="e.g. Sunday, 30-Nov-2026"
                            value={offerValidUntil}
                            onChange={(e) => setOfferValidUntil(e.target.value)}
                            className="text-sm font-semibold"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                            Select Product from Catalogue
                          </label>
                          <select
                            value={selectedProductId}
                            onChange={(e) => handleSelectProduct(e.target.value)}
                            className="w-full text-sm font-semibold p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {catalogProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} — ₹{p.retail_price || p.price || 0}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                            Product Name (Variable 3) *
                          </label>
                          <Input
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            className="text-sm font-semibold"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                            Campaign Description (Variable 4) *
                          </label>
                          <textarea
                            rows={2}
                            value={productDescription}
                            onChange={(e) => setProductDescription(e.target.value)}
                            className="w-full text-sm font-semibold p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                            Selling Price (Variable 5) *
                          </label>
                          <Input
                            placeholder="e.g. 1499.00"
                            value={productPrice}
                            onChange={(e) => setProductPrice(e.target.value)}
                            className="text-sm font-semibold"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-between pt-3">
                    <Button
                      variant="outline"
                      onClick={() => setCreateStep(1)}
                      className="text-xs font-bold"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        if (!campaignName.trim()) {
                          toastError('Please enter a campaign name');
                          return;
                        }
                        setCreateStep(3);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5"
                    >
                      Select Customers
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* STEP 3: SELECT CUSTOMERS */}
              {createStep === 3 && (
                <Card className="p-6 border-slate-200/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Step 3 — Target Audience</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Choose eligible customer recipients with valid WhatsApp phone numbers.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const eligible = allCustomers
                            .filter((c) => (c.phone || '').replace(/[^\d]/g, '').length >= 10)
                            .map((c) => c.id);
                          setSelectedCustomerIds(eligible);
                        }}
                        className="text-xs font-bold h-8"
                      >
                        Select All Eligible
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCustomerIds([])}
                        className="text-xs font-bold h-8 text-slate-600"
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <Input
                        placeholder="Search by customer name or phone..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-9 text-xs"
                      />
                    </div>
                    <select
                      value={customerSegmentFilter}
                      onChange={(e) => setCustomerSegmentFilter(e.target.value)}
                      className="p-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    >
                      <option value="ALL">All Customers ({allCustomers.length})</option>
                      <option value="WITH_PHONE">Eligible with Phone</option>
                      <option value="NO_PHONE">Missing Phone Number</option>
                    </select>
                  </div>

                  {/* Customer Select List */}
                  <div className="border border-slate-200 rounded-xl max-h-72 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No customers match this filter.
                      </div>
                    ) : (
                      filteredCustomers.map((cust) => {
                        const clean = (cust.phone || '').replace(/[^\d]/g, '');
                        const isEligible = clean.length >= 10;
                        const isChecked = selectedCustomerIds.includes(cust.id);

                        return (
                          <div
                            key={cust.id}
                            onClick={() => {
                              if (!isEligible) return;
                              if (isChecked) {
                                setSelectedCustomerIds(selectedCustomerIds.filter((id) => id !== cust.id));
                              } else {
                                setSelectedCustomerIds([...selectedCustomerIds, cust.id]);
                              }
                            }}
                            className={cn(
                              'p-3 flex items-center justify-between text-xs transition-colors cursor-pointer',
                              !isEligible ? 'opacity-50 bg-slate-50 cursor-not-allowed' : 'hover:bg-blue-50/50',
                              isChecked && isEligible && 'bg-blue-50/30'
                            )}
                          >
                            <div className="flex items-center space-x-3 truncate">
                              <input
                                type="checkbox"
                                checked={isChecked && isEligible}
                                disabled={!isEligible}
                                readOnly
                                className="rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                              />
                              <div className="truncate">
                                <span className="font-extrabold text-slate-900 block truncate">{cust.name}</span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {cust.phone || 'No Phone Number'}
                                </span>
                              </div>
                            </div>

                            <div>
                              {isEligible ? (
                                <Badge variant="emerald" className="text-[10px] px-2 py-0.5">Eligible</Badge>
                              ) : (
                                <Badge variant="rose" className="text-[10px] px-2 py-0.5">No WhatsApp</Badge>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="flex justify-between pt-3">
                    <Button
                      variant="outline"
                      onClick={() => setCreateStep(2)}
                      className="text-xs font-bold"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                      Back
                    </Button>
                    <Button
                      onClick={() => setCreateStep(4)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5"
                    >
                      Review & Estimate
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* STEP 4: REVIEW & CONFIRM */}
              {createStep === 4 && (
                <Card className="p-6 border-slate-200/80 space-y-5">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Step 4 — Final Review & Confirmation</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Confirm wallet deduction and authorize campaign execution.
                    </p>
                  </div>

                  {/* Summary Breakdown */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Campaign Name:</span>
                      <span className="text-slate-900 font-black">{campaignName || 'Unnamed Campaign'}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Template:</span>
                      <span className="text-blue-700">{campaignType}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Eligible Recipients:</span>
                      <span className="text-slate-900 font-black">{eligibleSelectedCount} Customers</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Rate per Message:</span>
                      <span>₹{marketingRate.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                      <span>Estimated Campaign Cost:</span>
                      <span className="text-blue-700 text-base">{formatCurrency(estimatedCampaignCost)}</span>
                    </div>
                  </div>

                  {/* Wallet Check */}
                  <div className="p-4 rounded-2xl border space-y-2 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-600">Available Wallet Balance:</span>
                      <span className="font-extrabold text-slate-900">{formatCurrency(availableBalance)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-600">Balance After Campaign:</span>
                      <span className={cn('font-extrabold', isBalanceSufficient ? 'text-emerald-700' : 'text-rose-700')}>
                        {formatCurrency(estimatedRemainingBalance)}
                      </span>
                    </div>

                    {!isBalanceSufficient && (
                      <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-2">
                        <div className="font-extrabold flex items-center">
                          <AlertTriangle className="w-4 h-4 text-rose-600 mr-1.5" />
                          Insufficient Wallet Balance
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          You need at least {formatCurrency(balanceShortfall)} more to execute this campaign.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => handleTabChange('wallet')}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add Funds in Wallet
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Consent Checkbox */}
                  <div className="flex items-start space-x-3 p-3.5 bg-blue-50/50 border border-blue-200/60 rounded-xl">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={hasMarketingConsent}
                      onChange={(e) => setHasMarketingConsent(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="consent" className="text-xs font-semibold text-slate-700 leading-relaxed cursor-pointer">
                      I confirm that the selected recipients have provided promotional WhatsApp marketing consent and I authorize this campaign and its estimated wallet deduction.
                    </label>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setCreateStep(3)}
                      disabled={isLaunchingCampaign}
                      className="text-xs font-bold"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                      Back
                    </Button>

                    <Button
                      onClick={handleLaunchCampaign}
                      disabled={isLaunchingCampaign || !isBalanceSufficient || !hasMarketingConsent}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-6 shadow-md shadow-blue-500/20"
                    >
                      {isLaunchingCampaign ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Dispatching Messages...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1.5" />
                          PAY & SEND CAMPAIGN ({formatCurrency(estimatedCampaignCost)})
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column: Realistic WhatsApp Phone Mockup Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center">
                  <Smartphone className="w-4 h-4 mr-1.5 text-blue-600" />
                  Live WhatsApp Preview
                </span>
                {previewCustomers.length > 1 && (
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={previewCustomerIndex === 0}
                      onClick={() => setPreviewCustomerIndex((prev) => Math.max(0, prev - 1))}
                      className="h-7 w-7 p-0"
                    >
                      ‹
                    </Button>
                    <span className="text-[11px] font-bold text-slate-600 px-1">
                      {previewCustomerIndex + 1}/{previewCustomers.length}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={previewCustomerIndex >= previewCustomers.length - 1}
                      onClick={() => setPreviewCustomerIndex((prev) => Math.min(previewCustomers.length - 1, prev + 1))}
                      className="h-7 w-7 p-0"
                    >
                      ›
                    </Button>
                  </div>
                )}
              </div>

              {/* Realistic Mobile Device Container */}
              <div className="max-w-[340px] mx-auto rounded-[38px] bg-slate-900 p-3 shadow-2xl border-4 border-slate-800">
                {/* Speaker Notch */}
                <div className="w-20 h-3.5 bg-slate-800 rounded-full mx-auto mb-2" />

                {/* WhatsApp Chat Screen */}
                <div className="bg-[#EFEAE2] rounded-[28px] overflow-hidden flex flex-col h-[520px] border border-slate-300">
                  {/* WhatsApp App Header */}
                  <div className="bg-[#075E54] text-white px-3.5 py-2.5 flex items-center justify-between shrink-0 shadow-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <div className="w-8 h-8 rounded-full bg-white text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">
                        V
                      </div>
                      <div className="truncate">
                        <span className="font-extrabold text-xs block truncate leading-tight">VEXA TECH</span>
                        <span className="text-[9px] text-emerald-200 block truncate">Official Business Account</span>
                      </div>
                    </div>
                    <Badge className="bg-emerald-700/80 text-[9px] text-white border-0 px-1.5 py-0.2">
                      Verified
                    </Badge>
                  </div>

                  {/* Chat Area with Background Texture */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-3 no-scrollbar text-xs">
                    {/* Timestamp Bubble */}
                    <div className="text-center my-1">
                      <span className="bg-white/80 text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded-md shadow-2xs">
                        TODAY
                      </span>
                    </div>

                    {/* WhatsApp Message Bubble */}
                    <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm space-y-2 border border-slate-200/60 max-w-[90%]">
                      {/* Message Body */}
                      {campaignType === 'vexa_new_offers_campaign' ? (
                        <div className="space-y-2 text-[12px] text-slate-800 leading-relaxed font-sans">
                          <p>
                            Hello <span className="font-black text-slate-900">{currentPreviewCustomer.name}</span>,
                          </p>
                          <p>
                            Greetings from <span className="font-extrabold text-emerald-800">{business?.business_name || 'Our Store'}</span>!
                          </p>
                          <p className="font-semibold text-slate-900 bg-amber-50/60 p-2 rounded-lg border border-amber-200/50">
                            {offerIntro}
                          </p>
                          <p className="text-slate-700 font-medium">
                            {offerDetails}
                          </p>
                          <p className="text-[11px] text-slate-600 font-bold">
                            Valid until: <span className="text-red-700">{offerValidUntil}</span>. Visit us today!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 text-[12px] text-slate-800 leading-relaxed font-sans">
                          <p>
                            Hello <span className="font-black text-slate-900">{currentPreviewCustomer.name}</span>,
                          </p>
                          <p>
                            New arrival at <span className="font-extrabold text-emerald-800">{business?.business_name || 'Our Store'}</span>!
                          </p>
                          <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
                            <span className="font-black text-slate-900 block text-xs">{productName || 'Featured Collection'}</span>
                            <span className="text-[11px] text-purple-900 font-medium block leading-snug">{productDescription}</span>
                            <span className="text-xs font-black text-emerald-700 block pt-1">
                              Price: ₹{productPrice ? Number(productPrice).toFixed(2) : '0.00'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium">
                            Visit our store or order online to get yours today!
                          </p>
                        </div>
                      )}

                      {/* Footer & Read Timestamp */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Powered by VEXA TECH</span>
                        <span className="flex items-center space-x-1">
                          <span>12:30 PM</span>
                          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fake Chat Input Bar */}
                  <div className="p-2 bg-slate-100 border-t border-slate-200 flex items-center space-x-2 shrink-0">
                    <div className="flex-1 bg-white h-8 rounded-full px-3 text-[11px] text-slate-400 flex items-center border border-slate-200">
                      Reply to message...
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#075E54] text-white flex items-center justify-center shrink-0">
                      <Send className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: CAMPAIGN HISTORY */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'history' && (
        <Card className="p-6 border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Campaign History</h3>
              <p className="text-xs text-slate-500 font-medium">Past promotional broadcasts and delivery metrics</p>
            </div>
            <Button
              size="sm"
              onClick={() => handleTabChange('create')}
              className="bg-blue-600 text-white font-bold text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Campaign
            </Button>
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No campaigns found</p>
              <p className="text-xs text-slate-500 mt-1">Start by creating an offer or product broadcast</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0 no-scrollbar">
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] whitespace-nowrap">
                    <th className="py-3 font-bold">Campaign Name</th>
                    <th className="py-3 font-bold">Template</th>
                    <th className="py-3 font-bold">Recipients</th>
                    <th className="py-3 font-bold">Delivered</th>
                    <th className="py-3 font-bold">Failed</th>
                    <th className="py-3 font-bold">Total Cost</th>
                    <th className="py-3 font-bold">Status</th>
                    <th className="py-3 font-bold">Date</th>
                    <th className="py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 font-bold text-slate-900 whitespace-nowrap">{camp.name}</td>
                      <td className="py-3.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">{camp.template_name}</td>
                      <td className="py-3.5 text-slate-800 font-semibold whitespace-nowrap">{camp.eligible_count || 0}</td>
                      <td className="py-3.5 text-emerald-700 font-bold whitespace-nowrap">{camp.delivered_count || camp.sent_count || 0}</td>
                      <td className="py-3.5 text-rose-600 font-bold whitespace-nowrap">{camp.failed_count || 0}</td>
                      <td className="py-3.5 font-extrabold text-blue-700 whitespace-nowrap">
                        {formatCurrency(camp.actual_cost || camp.estimated_cost || 0)}
                      </td>
                      <td className="py-3.5 whitespace-nowrap">
                        <Badge
                          variant={
                            camp.status === 'COMPLETED'
                              ? 'emerald'
                              : camp.status === 'SENDING'
                              ? 'blue'
                              : camp.status === 'CANCELLED'
                              ? 'rose'
                              : 'amber'
                          }
                          className="text-[10px] px-2 py-0.5 whitespace-nowrap"
                        >
                          {camp.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(camp.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right whitespace-nowrap">
                        {camp.status === 'QUEUED' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelCampaign(camp.id)}
                            className="h-7 text-[10px] font-bold px-2 whitespace-nowrap"
                          >
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: MESSAGE LOGS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'messages' && (
        <Card className="p-6 border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Unified Message Logs</h3>
              <p className="text-xs text-slate-500 font-medium">
                Live delivery status for Marketing campaigns and automatic Utility triggers
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadWorkspaceData(true)}
                className="h-8 text-xs font-bold"
              >
                <RefreshCw className={cn('w-3.5 h-3.5 mr-1', isRefreshing && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search phone or template..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <select
              value={logCategoryFilter}
              onChange={(e) => setLogCategoryFilter(e.target.value)}
              className="p-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
            >
              <option value="ALL">All Message Categories</option>
              <option value="MARKETING">Marketing (Campaigns)</option>
              <option value="UTILITY">Utility (Automated Triggers)</option>
            </select>
            <select
              value={logStatusFilter}
              onChange={(e) => setLogStatusFilter(e.target.value)}
              className="p-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
            >
              <option value="ALL">All Delivery Statuses</option>
              <option value="SENT">Sent</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No message logs found</p>
              <p className="text-xs text-slate-500 mt-1">Sent WhatsApp messages will appear here in real-time</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0 no-scrollbar">
              <table className="w-full text-left text-xs min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] whitespace-nowrap">
                    <th className="py-3 font-bold">Category</th>
                    <th className="py-3 font-bold">Template Name</th>
                    <th className="py-3 font-bold">Recipient</th>
                    <th className="py-3 font-bold">Cost</th>
                    <th className="py-3 font-bold">Status</th>
                    <th className="py-3 font-bold">Message ID</th>
                    <th className="py-3 font-bold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredLogs.map((msg) => (
                    <tr key={msg.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 whitespace-nowrap">
                        <Badge
                          variant={msg.category === 'MARKETING' ? 'purple' : 'blue'}
                          className="text-[10px] px-2 py-0.5 whitespace-nowrap"
                        >
                          {msg.category}
                        </Badge>
                      </td>
                      <td className="py-3.5 font-mono text-[11px] text-slate-800 whitespace-nowrap">{msg.template_name}</td>
                      <td className="py-3.5 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">{msg.customers?.name || 'Shop User'}</span>
                        <span className="text-[11px] text-slate-500">{msg.recipient_phone}</span>
                      </td>
                      <td className="py-3.5 font-extrabold text-slate-700 whitespace-nowrap">
                        {msg.cost ? formatCurrency(msg.cost) : '₹0.00'}
                      </td>
                      <td className="py-3.5 whitespace-nowrap">
                        <Badge
                          variant={
                            msg.status === 'DELIVERED' || msg.status === 'SENT'
                              ? 'emerald'
                              : msg.status === 'FAILED'
                              ? 'rose'
                              : 'amber'
                          }
                          className="text-[10px] px-2 py-0.5 whitespace-nowrap"
                        >
                          {msg.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 font-mono text-[10px] text-slate-400 max-w-[150px] truncate whitespace-nowrap">
                        {msg.provider_msg_id || '-'}
                      </td>
                      <td className="py-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(msg.sent_at || msg.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default function UnifiedWhatsAppCampaignsPage() {
  return (
    <ProtectedRoute permissions={['campaigns.view']}>
      <DashboardLayout>
        <Suspense fallback={<LoadingScreen message="Loading WhatsApp Workspace..." />}>
          <UnifiedWhatsAppWorkspaceContent />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function LoadingScreen({ message }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
      <Spinner size="lg" className="text-blue-600" />
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{message}</span>
    </div>
  );
}
