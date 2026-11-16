'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Mail, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileText,
  ShieldCheck,
  Search,
  RotateCcw,
  Users,
  Zap,
  Megaphone,
  History,
  Plus,
  Edit,
  Eye,
  Filter,
  Layers,
  Settings,
  Check,
  X,
  ChevronRight,
  Sparkles,
  Bell,
  LayoutDashboard,
  Building,
  CreditCard,
  AlertTriangle,
  UserPlus,
  Receipt,
  ShoppingCart
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { emailService } from '@/services/emailService';
import { customerService } from '@/services/customerService';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';

export default function EmailSettingsPage() {
  const { user, business } = useAuth();
  const { toastSuccess, toastError, confirm } = useToast();

  // Active Tab State: 'overview' | 'auto_emails' | 'customers' | 'messages' | 'campaigns' | 'history'
  const [activeTab, setActiveTab] = useState('overview');

  // Overview / Stats & Logs Data
  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [emailTypeFilter, setEmailTypeFilter] = useState('');
  const [retryingId, setRetryingId] = useState(null);

  // Customer Data State
  const [customers, setCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [emailStatusFilter, setEmailStatusFilter] = useState('');

  // Test Email State
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccessNotice, setTestSuccessNotice] = useState(false);

  // Automatic Emails & Service Status States
  const [autoEmailSettings, setAutoEmailSettings] = useState(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [smtpStatus, setSmtpStatus] = useState({ configured: false, status: 'CHECKING', sender: '' });

  // Message Templates State
  const [templates, setTemplates] = useState({
    sale_invoice: {
      id: 'sale_invoice',
      name: 'Sales Invoice',
      description: 'Send the invoice to the customer after a sale.',
      subject: 'Invoice {{invoice_number}} from {{business_name}}',
      message: 'Hello {{customer_name}},\n\nThank you for your purchase from {{business_name}}.\n\nYour invoice {{invoice_number}} for {{invoice_total}} is ready.\n\nRegards,\n{{business_name}}'
    },
    purchase_update: {
      id: 'purchase_update',
      name: 'Purchase Update',
      description: 'Send purchase details to your supplier.',
      subject: 'Purchase Order {{order_number}} from {{business_name}}',
      message: 'Hello,\n\nPlease find purchase order {{order_number}} from {{business_name}}.\n\nRegards,\n{{business_name}}'
    },
    low_stock: {
      id: 'low_stock',
      name: 'Low Stock Alert',
      description: 'Get an alert when products are running low.',
      subject: 'Low Stock Alert for {{business_name}}',
      message: 'Attention Team,\n\nThe stock for several items is running low. Please check your inventory dashboard.\n\nRegards,\n{{business_name}}'
    },
    customer_payment: {
      id: 'customer_payment',
      name: 'Customer Payment Receipt',
      description: 'Send a payment receipt to customers.',
      subject: 'Payment Receipt from {{business_name}}',
      message: 'Hello {{customer_name}},\n\nWe have received your payment of {{paid_amount}} on {{payment_date}}.\n\nYour remaining balance is {{balance}}.\n\nThank you!\n{{business_name}}'
    },
    supplier_payment: {
      id: 'supplier_payment',
      name: 'Supplier Payment Confirmation',
      description: 'Send payment confirmation to suppliers.',
      subject: 'Payment Confirmation from {{business_name}}',
      message: 'Hello,\n\nPayment of {{paid_amount}} has been issued on {{payment_date}}.\n\nRegards,\n{{business_name}}'
    },
    campaign: {
      id: 'campaign',
      name: 'Campaign Emails',
      description: 'Send special offers and updates to your customers.',
      subject: 'New Special Offer from {{business_name}}!',
      message: 'Hello {{customer_name}},\n\nDiscover our latest products and exclusive offers tailored just for you.\n\nVisit us or reply to learn more!\n\nRegards,\n{{business_name}}'
    }
  });

  // Modal States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCustomerViewModalOpen, setIsCustomerViewModalOpen] = useState(false);
  
  const [editingCustomerEmail, setEditingCustomerEmail] = useState(null);
  const [customerEmailInput, setCustomerEmailInput] = useState('');
  const [isSavingCustomerEmail, setIsSavingCustomerEmail] = useState(false);

  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateMessage, setTemplateMessage] = useState('');

  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [viewLogDetail, setViewLogDetail] = useState(null);

  // Campaigns State
  const [campaignsList, setCampaignsList] = useState([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [selectedCampaignDetail, setSelectedCampaignDetail] = useState(null);
  const [isCampaignDetailModalOpen, setIsCampaignDetailModalOpen] = useState(false);

  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [campaignStep, setCampaignStep] = useState(1); // 1: Info, 2: Audience, 3: Content, 4: Confirm
  const [newCampaignData, setNewCampaignData] = useState({
    name: '',
    audienceType: 'ALL', // 'ALL' | 'RETAIL' | 'WHOLESALE' | 'DEALER' | 'BUSINESS'
    subject: '',
    message: ''
  });

  // Fetch Email Logs
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await emailService.getEmailLogs({ email_type: emailTypeFilter });
      setLogs(res.data || res || []);
    } catch (err) {
      console.error('Failed to load email logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Fetch Customers
  const fetchCustomersData = async () => {
    setIsLoadingCustomers(true);
    try {
      const res = await customerService.getCustomers();
      const list = res.data || res || [];
      setCustomers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // Fetch Email Preferences, Templates & SMTP Status
  const fetchEmailSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const [settingsRes, templatesRes, statusRes] = await Promise.allSettled([
        emailService.getEmailSettings(),
        emailService.getEmailTemplates(),
        emailService.getEmailStatus()
      ]);
      const valS = settingsRes.status === 'fulfilled' ? (settingsRes.value?.data || settingsRes.value) : null;
      if (valS && typeof valS === 'object') {
        setAutoEmailSettings(valS);
      }
      const valT = templatesRes.status === 'fulfilled' ? (templatesRes.value?.data || templatesRes.value) : null;
      if (valT && typeof valT === 'object') {
        setTemplates((prev) => ({ ...prev, ...valT }));
      }
      const valSt = statusRes.status === 'fulfilled' ? (statusRes.value?.data || statusRes.value) : null;
      if (valSt && typeof valSt === 'object') {
        setSmtpStatus(valSt);
      }
    } catch (err) {
      console.error('Failed to load email settings & templates:', err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Fetch Real Campaigns
  const fetchCampaigns = async () => {
    setIsLoadingCampaigns(true);
    try {
      const res = await emailService.getCampaigns();
      const list = res.data || res || [];
      setCampaignsList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchCustomersData();
    fetchEmailSettings();
    fetchCampaigns();
  }, [emailTypeFilter]);

  // Derived Customer Stats
  const customersWithEmailCount = useMemo(() => {
    return customers.filter((c) => c.email && c.email.trim() !== '').length;
  }, [customers]);

  const customersWithoutEmailCount = useMemo(() => {
    return customers.length - customersWithEmailCount;
  }, [customers, customersWithEmailCount]);

  // Derived Email Log Stats
  const emailsSentThisMonthCount = useMemo(() => {
    return logs.filter((l) => l.status === 'SENT').length;
  }, [logs]);

  // Filtered Customer List
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (customerSearch.trim()) {
        const q = customerSearch.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }
      if (customerTypeFilter && c.customer_type !== customerTypeFilter) {
        return false;
      }
      if (emailStatusFilter === 'AVAILABLE' && (!c.email || c.email.trim() === '')) {
        return false;
      }
      if (emailStatusFilter === 'NO_EMAIL' && c.email && c.email.trim() !== '') {
        return false;
      }
      return true;
    });
  }, [customers, customerSearch, customerTypeFilter, emailStatusFilter]);

  // Handle Send Test Email
  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      toastError('Please enter a valid email address');
      return;
    }
    setIsTesting(true);
    setTestSuccessNotice(false);
    try {
      await emailService.sendTestEmail(testEmail.trim());
      setTestSuccessNotice(true);
      toastSuccess('Test email sent successfully');
      fetchLogs();
    } catch (err) {
      toastError(err.message || 'Failed to send test email');
    } finally {
      setIsTesting(false);
    }
  };

  // Handle Trigger Low Stock Email Alert
  const [isTriggeringLowStock, setIsTriggeringLowStock] = useState(false);
  const handleTriggerLowStockAlert = async () => {
    setIsTriggeringLowStock(true);
    try {
      const res = await emailService.triggerLowStockAlert();
      toastSuccess(res.message || 'Low stock alert email scan triggered successfully!');
      fetchLogs();
    } catch (err) {
      toastError(err.message || 'Failed to trigger low stock alert');
    } finally {
      setIsTriggeringLowStock(false);
    }
  };

  // Handle Toggle Automatic Email Setting with Backend Persistence & Fallback
  const handleToggleAutoEmail = async (key) => {
    const previousState = { ...autoEmailSettings };
    const nextState = { ...autoEmailSettings, [key]: !autoEmailSettings[key] };
    
    // Optimistic UI update
    setAutoEmailSettings(nextState);

    try {
      await emailService.updateEmailSettings(nextState);
      toastSuccess('Email settings updated successfully.');
    } catch (err) {
      console.error('Failed to update email settings:', err);
      setAutoEmailSettings(previousState);
      toastError('Unable to update email settings. Please try again.');
    }
  };


  // Handle Edit Customer Email Modal Open
  const handleOpenEditEmailModal = (customer) => {
    setEditingCustomerEmail(customer);
    setCustomerEmailInput(customer.email || '');
  };

  // Handle Save Customer Email
  const handleSaveCustomerEmail = async (e) => {
    e.preventDefault();
    if (!editingCustomerEmail) return;
    setIsSavingCustomerEmail(true);
    try {
      await customerService.updateCustomer(editingCustomerEmail.id, {
        ...editingCustomerEmail,
        email: customerEmailInput.trim()
      });
      toastSuccess('Customer email updated successfully');
      setEditingCustomerEmail(null);
      fetchCustomersData();
    } catch (err) {
      toastError(err.message || 'Failed to update customer email');
    } finally {
      setIsSavingCustomerEmail(false);
    }
  };

  // Handle Template Edit
  const handleOpenEditTemplate = (key) => {
    const t = templates[key];
    if (!t) return;
    setEditingTemplate(t);
    setTemplateSubject(t.subject);
    setTemplateMessage(t.message);
    setIsTemplateModalOpen(true);
  };

  // Handle Save Template
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!editingTemplate) return;

    const updated = {
      ...templates,
      [editingTemplate.id]: {
        ...templates[editingTemplate.id],
        subject: templateSubject,
        message: templateMessage,
        lastUpdated: new Date().toLocaleDateString()
      }
    };

    setTemplates(updated);

    try {
      await emailService.updateEmailTemplates(updated);
      toastSuccess('Email message template updated');
    } catch (err) {
      console.error('Failed to save email template:', err);
      toastError('Failed to save template to database.');
    }
    setIsTemplateModalOpen(false);
  };

  // Handle Retry Email
  const handleRetryEmail = async (log) => {
    const isConfirmed = await confirm({
      title: 'Resend Email?',
      message: `Are you sure you want to resend this email to ${log.recipient_email}?`,
      confirmText: 'Resend Email',
      cancelText: 'Cancel',
      type: 'blue'
    });

    if (isConfirmed) {
      setRetryingId(log.id);
      try {
        await emailService.retryEmail(log.id);
        toastSuccess('Email resent successfully');
        fetchLogs();
      } catch (err) {
        toastError(err.message || 'Failed to resend email');
      } finally {
        setRetryingId(null);
      }
    }
  };

  // Handle Create New Campaign Submit
  const handleCreateCampaignSubmit = async (e) => {
    e.preventDefault();
    if (!newCampaignData.name.trim()) {
      toastError('Please enter a campaign name');
      return;
    }
    try {
      const res = await emailService.createCampaign({
        name: newCampaignData.name.trim(),
        audienceType: newCampaignData.audienceType,
        subject: newCampaignData.subject,
        message: newCampaignData.message
      });
      toastSuccess(res.message || 'Campaign created and sent successfully!');
      fetchCampaigns();
      fetchLogs();
      setIsNewCampaignModalOpen(false);
      setCampaignStep(1);
      setNewCampaignData({ name: '', audienceType: 'ALL', subject: '', message: '' });
    } catch (err) {
      toastError(err.message || 'Failed to dispatch campaign');
    }
  };

  // Format status badge helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'SENT':
      case 'Sent':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Sent
          </Badge>
        );
      case 'FAILED':
      case 'Failed':
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200">
            <XCircle className="w-3 h-3 mr-1 text-rose-600" /> Failed
          </Badge>
        );
      case 'PENDING':
      case 'Pending':
      case 'Draft':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="w-3 h-3 mr-1 text-amber-600" /> Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'SALE_INVOICE':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-[11px] px-2.5 py-1">
            <Receipt className="w-3 h-3 mr-1 text-blue-600" /> Sale Invoice
          </Badge>
        );
      case 'PURCHASE_ORDER':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-[11px] px-2.5 py-1">
            <ShoppingCart className="w-3 h-3 mr-1 text-blue-600" /> Purchase PO
          </Badge>
        );
      case 'LOW_STOCK':
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-bold text-[11px] px-2.5 py-1">
            <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" /> Low Stock
          </Badge>
        );
      case 'CUSTOMER_PAYMENT':
      case 'SUPPLIER_PAYMENT':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[11px] px-2.5 py-1">
            <CreditCard className="w-3 h-3 mr-1 text-emerald-600" /> Payment
          </Badge>
        );
      case 'CAMPAIGN':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-[11px] px-2.5 py-1">
            <Megaphone className="w-3 h-3 mr-1 text-blue-600" /> Campaign
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-bold bg-slate-50 border-slate-200 text-slate-700 text-[11px] px-2.5 py-1">
            {type}
          </Badge>
        );
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
          {/* Top Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Email & Notifications Hub</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage automatic transactional emails, message templates, customer contacts, promotional campaigns, and history logs.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchLogs();
                  fetchCustomersData();
                  fetchEmailSettings();
                  fetchCampaigns();
                }}
                className="text-xs font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Data
              </Button>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('auto_emails')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'auto_emails'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Automatic Emails</span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'customers'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers ({customers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'campaigns'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Campaigns ({campaignsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History ({logs.length})</span>
            </button>
          </div>

          {/* ==================================================================== */}
          {/* TAB 1: OVERVIEW */}
          {/* ==================================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 bg-white border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Customers</p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">{customers.length}</p>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                </Card>

                <Card className="p-5 bg-white border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Opt-in Rate</p>
                    <p className="text-2xl font-extrabold text-blue-700 mt-1">
                      {customers.length > 0 ? Math.round((customersWithEmailCount / customers.length) * 100) : 0}%
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </Card>

                <Card className="p-5 bg-white border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Emails Dispatched</p>
                    <p className="text-2xl font-extrabold text-emerald-700 mt-1">{emailsSentThisMonthCount}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Send className="w-6 h-6" />
                  </div>
                </Card>

                <Card className="p-5 bg-white border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending/Failed Logs</p>
                    <p className="text-2xl font-extrabold text-amber-700 mt-1">
                      {logs.filter((l) => l.status === 'FAILED' || l.status === 'PENDING').length}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </Card>
              </div>

              {/* SMTP Test Card */}
              <Card className="p-6 bg-white border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                      <Send className="w-4 h-4 text-blue-600" />
                      <span>SMTP Email Connection Test</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Send a instant test email to verify your SMTP configuration setup.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:w-80">
                    <Input
                      placeholder="enter.test@email.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    isLoading={isTesting}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                  >
                    <Send className="w-4 h-4 mr-1.5" /> Send Test Email
                  </Button>
                </form>

                {testSuccessNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Test email sent successfully! Check your inbox or system email log.</span>
                  </div>
                )}
              </Card>

              {/* Recent History Preview */}
              <Card className="p-6 bg-white border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <History className="w-4 h-4 text-blue-600" />
                    <span>Recent Dispatched Logs</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1"
                  >
                    <span>View All History</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isLoadingLogs ? (
                  <div className="py-8 text-center">
                    <Spinner size="md" className="text-blue-600 mx-auto" />
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No email logs dispatched yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[650px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3 whitespace-nowrap min-w-[90px]">Date</th>
                          <th className="py-2.5 px-3 whitespace-nowrap min-w-[100px]">Type</th>
                          <th className="py-2.5 px-3 whitespace-nowrap min-w-[150px]">Recipient</th>
                          <th className="py-2.5 px-3 whitespace-nowrap min-w-[150px]">Subject / Reference</th>
                          <th className="py-2.5 px-3 whitespace-nowrap min-w-[90px]">Status</th>
                          <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[80px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {logs.slice(0, 5).map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-slate-500 font-mono whitespace-nowrap">
                              {new Date(log.created_at || log.sent_at).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {getTypeBadge(log.email_type)}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">{log.recipient_email}</td>
                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{log.reference_number || log.subject}</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">{getStatusBadge(log.status)}</td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setViewLogDetail(log)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs transition-all hover:border-slate-300 active:scale-95 cursor-pointer whitespace-nowrap"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>View</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 2: AUTOMATIC EMAILS */}
          {/* ==================================================================== */}
          {activeTab === 'auto_emails' && (
            <div className="space-y-6">
              <Card className="p-6 bg-white border-slate-200/80 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <span>Automatic Notification Preferences</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enable or disable automatic email triggers when sales, purchase orders, low stock, or payments occur.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-500">Service Status:</span>
                    {smtpStatus.configured ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Connected
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-bold">
                        <AlertCircle className="w-3 h-3 mr-1 text-amber-600" /> SMTP Unconfigured
                      </Badge>
                    )}
                  </div>
                </div>

                {isLoadingSettings || !autoEmailSettings ? (
                  <div className="py-12 text-center">
                    <Spinner size="lg" className="text-blue-600 mx-auto" />
                    <p className="text-xs font-semibold text-slate-500 mt-3">Loading automatic email settings from server...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        key: 'sale_invoice',
                        title: 'Sales Invoice Email',
                        desc: 'Automatically send a tax invoice copy to the customer email upon sale completion.'
                      },
                      {
                        key: 'purchase_update',
                        title: 'Supplier Purchase Order',
                        desc: 'Send purchase order details automatically to the supplier when restock orders are created.'
                      },
                      {
                        key: 'low_stock',
                        title: 'Low Stock Alerts',
                        desc: 'Notify business admins automatically when product inventory drops below minimum threshold.'
                      },
                      {
                        key: 'customer_payment',
                        title: 'Customer Payment Receipt',
                        desc: 'Send an instant payment confirmation receipt to customers when payments are logged.'
                      },
                      {
                        key: 'supplier_payment',
                        title: 'Supplier Payment Advice',
                        desc: 'Send payment remittance advice to suppliers when outgoing payments are completed.'
                      },
                      {
                        key: 'campaign_emails',
                        title: 'Promotional Campaign Broadcasts',
                        desc: 'Allow bulk promotional emails and special discount offers to be dispatched to customers.'
                      }
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-start justify-between space-x-4 hover:border-blue-200 transition"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-slate-900">{item.title}</span>
                            {item.key === 'low_stock' && (
                              <button
                                type="button"
                                onClick={handleTriggerLowStockAlert}
                                disabled={isTriggeringLowStock}
                                className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-100 hover:bg-amber-200 text-amber-900 transition flex items-center shadow-2xs"
                                title="Scan low stock items and dispatch alert email immediately"
                              >
                                {isTriggeringLowStock ? 'Scanning...' : '⚡ Scan & Send Now'}
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleAutoEmail(item.key)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            autoEmailSettings[item.key] ? 'bg-blue-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              autoEmailSettings[item.key] ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 3: CUSTOMERS */}
          {/* ==================================================================== */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              {/* Top Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-5 bg-white border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Customer Records</p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">{customers.length}</p>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                </Card>

                <Card className="p-5 bg-white border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customers with Email</p>
                    <p className="text-2xl font-extrabold text-emerald-700 mt-1">{customersWithEmailCount}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </Card>

                <Card className="p-5 bg-white border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Missing Email</p>
                    <p className="text-2xl font-extrabold text-amber-700 mt-1">{customersWithoutEmailCount}</p>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </Card>
              </div>

              {/* Filters & Search */}
              <Card className="p-4 bg-white border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="w-full md:w-80">
                  <Input
                    placeholder="Search Customer by name, email, phone..."
                    icon={Search}
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <Select
                    value={customerTypeFilter}
                    onChange={(e) => setCustomerTypeFilter(e.target.value)}
                    options={[
                      { value: '', label: 'All Customer Types' },
                      { value: 'RETAIL', label: 'Retail' },
                      { value: 'WHOLESALE', label: 'Wholesale' },
                      { value: 'DEALER', label: 'Dealer' },
                      { value: 'BUSINESS', label: 'Business' }
                    ]}
                    className="w-full sm:w-44 text-xs font-medium"
                  />

                  <Select
                    value={emailStatusFilter}
                    onChange={(e) => setEmailStatusFilter(e.target.value)}
                    options={[
                      { value: '', label: 'All Email Statuses' },
                      { value: 'AVAILABLE', label: '✓ Email Available' },
                      { value: 'NO_EMAIL', label: '⚠ No Email' }
                    ]}
                    className="w-full sm:w-44 text-xs font-medium"
                  />
                </div>
              </Card>

              {/* Customer Email List Table */}
              <Card className="bg-white border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Customer Email List ({filteredCustomers.length})
                  </h2>
                </div>

                {isLoadingCustomers ? (
                  <div className="py-12 text-center">
                    <Spinner size="lg" className="text-blue-600 mx-auto" />
                    <p className="text-xs text-slate-500 mt-2">Loading customer email records...</p>
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No customer email addresses found"
                    description="Add email addresses to your customers so invoices and payment receipts can be sent automatically."
                    action={
                      <Button onClick={() => handleOpenEditEmailModal({ name: '', email: '' })} className="bg-blue-600 text-white">
                        <UserPlus className="w-4 h-4 mr-1.5" /> Add Customer Email
                      </Button>
                    }
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/50">
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Phone</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Customer Type</th>
                          <th className="py-3 px-4">Email Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filteredCustomers.map((cust) => {
                          const hasEmail = cust.email && cust.email.trim() !== '';
                          return (
                            <tr key={cust.id} className="hover:bg-slate-50/60 transition">
                              <td className="py-3 px-4 font-bold text-slate-900">{cust.name}</td>
                              <td className="py-3 px-4 font-mono text-slate-600">{cust.phone || '—'}</td>
                              <td className="py-3 px-4 font-medium text-slate-800">{hasEmail ? cust.email : '—'}</td>
                              <td className="py-3 px-4">
                                <Badge variant="secondary" className="font-semibold">{cust.customer_type || 'RETAIL'}</Badge>
                              </td>
                              <td className="py-3 px-4">
                                {hasEmail ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Available
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> No Email
                                  </Badge>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCustomer(cust);
                                      setIsCustomerViewModalOpen(true);
                                    }}
                                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs active:scale-95 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                                    <span>View</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditEmailModal(cust)}
                                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100/80 text-blue-700 border border-blue-200/80 shadow-2xs transition-all hover:border-blue-300 hover:shadow-xs active:scale-95 cursor-pointer"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{hasEmail ? 'Edit' : 'Add Email'}</span>
                                  </button>
                                </div>
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
          )}



          {/* ==================================================================== */}
          {/* TAB 5: CAMPAIGNS */}
          {/* ==================================================================== */}
          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              <Card className="p-6 bg-white border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <Megaphone className="w-5 h-5 text-blue-600" />
                      <span>Promotional Campaigns</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Send special offers, updates and new collection announcements to your customer base.
                    </p>
                  </div>

                  <Button
                    onClick={() => setIsNewCampaignModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    New Campaign
                  </Button>
                </div>

                {isLoadingCampaigns ? (
                  <div className="py-12 text-center">
                    <Spinner size="lg" className="text-blue-600 mx-auto" />
                    <p className="text-xs text-slate-500 mt-2">Loading promotional campaigns...</p>
                  </div>
                ) : campaignsList.length === 0 ? (
                  <EmptyState
                    icon={Megaphone}
                    title="No campaigns yet"
                    description="Create your first campaign to share offers and updates with your customers."
                    action={
                      <Button onClick={() => setIsNewCampaignModalOpen(true)} className="bg-blue-600 text-white">
                        <Plus className="w-4 h-4 mr-1.5" /> Create Campaign
                      </Button>
                    }
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/50">
                          <th className="py-3 px-4">Campaign Name</th>
                          <th className="py-3 px-4">Channel</th>
                          <th className="py-3 px-4">Recipients</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Created By</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {campaignsList.map((camp) => (
                          <tr key={camp.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-900">{camp.name}</td>
                            <td className="py-3.5 px-4">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {camp.channel || 'Email'}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">{camp.recipientsCount || camp.sentCount || 0} customers</td>
                            <td className="py-3.5 px-4">{getStatusBadge(camp.status)}</td>
                            <td className="py-3.5 px-4 text-slate-500 font-mono">{camp.date}</td>
                            <td className="py-3.5 px-4 font-semibold text-slate-700">{camp.createdBy || 'Admin'}</td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCampaignDetail(camp);
                                  setIsCampaignDetailModalOpen(true);
                                }}
                                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 shadow-2xs transition active:scale-95 cursor-pointer ml-auto"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>View Details</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 6: HISTORY */}
          {/* ==================================================================== */}
          {activeTab === 'history' && (
            <Card className="p-6 bg-white border-slate-200/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                      <History className="w-5 h-5" />
                    </div>
                    <span>Email History & Audit Logs</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Complete transaction logs for automated invoices, payment receipts, low stock alerts, and test dispatches.
                  </p>
                </div>

                <div className="w-full sm:w-64">
                  <Select
                    placeholder="All Email Types"
                    value={emailTypeFilter}
                    onChange={(e) => setEmailTypeFilter(e.target.value)}
                    options={[
                      { value: '', label: 'All Email Types' },
                      { value: 'SALE_INVOICE', label: 'Sale Invoices' },
                      { value: 'PURCHASE_ORDER', label: 'Purchase Orders' },
                      { value: 'LOW_STOCK', label: 'Low Stock Alerts' },
                      { value: 'CUSTOMER_PAYMENT', label: 'Customer Payments' },
                      { value: 'SUPPLIER_PAYMENT', label: 'Supplier Payments' },
                      { value: 'CAMPAIGN', label: 'Campaign Broadcasts' },
                      { value: 'TEST', label: 'Test Emails' }
                    ]}
                  />
                </div>
              </div>

              {isLoadingLogs ? (
                <div className="py-12 text-center">
                  <Spinner size="lg" className="text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-500 mt-2">Loading email history logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <EmptyState
                  icon={Mail}
                  title="No email history found"
                  description="Automated invoice, low-stock, and payment emails will appear here when dispatched."
                />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider bg-slate-50/80">
                        <th className="py-3.5 px-4">Date & Time</th>
                        <th className="py-3.5 px-4">Type</th>
                        <th className="py-3.5 px-4">Recipient</th>
                        <th className="py-3.5 px-4">Related To / Subject</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-blue-50/30 transition">
                          <td className="py-3.5 px-4 text-slate-600 font-mono whitespace-nowrap">
                            {new Date(log.created_at || log.sent_at).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </td>
                          <td className="py-3.5 px-4">
                            {getTypeBadge(log.email_type)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{log.recipient_email}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">{log.reference_number || log.subject}</div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(log.status)}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => setViewLogDetail(log)}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs active:scale-95 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                disabled={retryingId === log.id}
                                onClick={() => handleRetryEmail(log)}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100/80 text-blue-700 border border-blue-200/80 shadow-2xs transition-all hover:border-blue-300 hover:shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                              >
                                {retryingId === log.id ? (
                                  <Spinner size="xs" className="text-blue-600" />
                                ) : (
                                  <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                                )}
                                <span>{retryingId === log.id ? 'Retrying...' : 'Retry'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* ==================================================================== */}
          {/* MODALS & DRAWERS */}
          {/* ==================================================================== */}

          {/* 1. View Customer Profile Modal */}
          <Modal
            isOpen={isCustomerViewModalOpen}
            onClose={() => setIsCustomerViewModalOpen(false)}
            title="Customer Details"
          >
            {selectedCustomer && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{selectedCustomer.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedCustomer.customer_type || 'RETAIL'} Customer</p>
                  </div>
                  <Badge variant="secondary" className="text-xs font-bold font-mono">
                    {selectedCustomer.phone || 'No phone'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Email Address:</span>
                    <span className="font-bold text-slate-900">{selectedCustomer.email || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">GSTIN Number:</span>
                    <span className="font-mono text-slate-800">{selectedCustomer.gstin || 'Unregistered'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Outstanding Balance:</span>
                    <span className="font-extrabold text-amber-700">{formatCurrency(selectedCustomer.outstanding_balance || 0)}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsCustomerViewModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* 2. Edit Customer Email Modal */}
          <Modal
            isOpen={!!editingCustomerEmail}
            onClose={() => setEditingCustomerEmail(null)}
            title={editingCustomerEmail?.email ? 'Edit Customer Email' : 'Add Customer Email'}
          >
            <form onSubmit={handleSaveCustomerEmail} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Update recipient email address for <strong>{editingCustomerEmail?.name}</strong>:
              </p>
              <Input
                type="email"
                required
                placeholder="customer@company.com"
                value={customerEmailInput}
                onChange={(e) => setCustomerEmailInput(e.target.value)}
              />
              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingCustomerEmail(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={isSavingCustomerEmail} className="bg-blue-600 text-white font-bold">
                  Save Email Address
                </Button>
              </div>
            </form>
          </Modal>

          {/* 3. Edit Message Template Modal */}
          <Modal
            isOpen={isTemplateModalOpen}
            onClose={() => setIsTemplateModalOpen(false)}
            title={`Edit Template: ${editingTemplate?.name || ''}`}
            maxWidth="max-w-xl"
          >
            {editingTemplate && (
              <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
                <Input
                  label="Email Subject Line *"
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                  required
                />

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Message Body *</label>
                  <textarea
                    rows={6}
                    value={templateMessage}
                    onChange={(e) => setTemplateMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-sans"
                    required
                  />
                  <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] space-y-1 text-slate-600">
                    <p className="font-bold text-slate-800">Supported Backend Placeholders:</p>
                    <div className="flex flex-wrap gap-1.5 font-mono text-blue-700">
                      {['{{customer_name}}', '{{supplier_name}}', '{{business_name}}', '{{invoice_number}}', '{{order_number}}', '{{invoice_total}}', '{{paid_amount}}', '{{balance}}', '{{payment_date}}', '{{product_name}}', '{{sku}}', '{{current_stock}}'].map(tag => (
                        <span key={tag} className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => setIsTemplateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 text-white font-bold">
                    Save Message
                  </Button>
                </div>
              </form>
            )}
          </Modal>

          {/* 4. Preview Message Template Modal */}
          <Modal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            title={`Preview: ${previewTemplate?.name || 'Template'}`}
            maxWidth="max-w-xl"
          >
            {previewTemplate && (
              <div className="space-y-4">
                <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
                  <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 space-y-4 text-xs text-slate-800">
                    <div className="border-b border-slate-100 pb-3">
                      <p className="text-[11px] text-slate-400 uppercase font-mono">From: {business?.business_name || 'VEXA Business'}</p>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        Subject: {previewTemplate.subject.replace('{{invoice_number}}', 'INV-88219').replace('{{business_name}}', business?.business_name || 'VEXA Invoice')}
                      </p>
                    </div>

                    <div className="whitespace-pre-line font-sans text-slate-700 leading-relaxed">
                      {previewTemplate.message
                        .replace(/\{\{customer_name\}\}/g, 'ABC Garments')
                        .replace(/\{\{business_name\}\}/g, business?.business_name || 'VEXA Garments')
                        .replace(/\{\{invoice_number\}\}/g, 'INV-88219')
                        .replace(/\{\{order_number\}\}/g, 'ORD-99102')
                        .replace(/\{\{invoice_total\}\}/g, '₹4,500.00')
                        .replace(/\{\{paid_amount\}\}/g, '₹4,500.00')
                        .replace(/\{\{balance\}\}/g, '₹0.00')
                        .replace(/\{\{payment_date\}\}/g, new Date().toLocaleDateString())}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center font-mono">
                      Sent automatically via VEXA Customer Communication Center
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setIsPreviewModalOpen(false)}>
                    Close Preview
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* 5. View Email Log Detail Modal */}
          <Modal
            isOpen={!!viewLogDetail}
            onClose={() => setViewLogDetail(null)}
            title="Email History Record"
          >
            {viewLogDetail && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Recipient:</span>
                    <span className="font-bold text-slate-900">{viewLogDetail.recipient_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email Type:</span>
                    <Badge variant="outline">{viewLogDetail.email_type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date & Time:</span>
                    <span className="font-mono text-slate-700">{new Date(viewLogDetail.created_at || viewLogDetail.sent_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    {getStatusBadge(viewLogDetail.status)}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-800">Subject:</span>
                  <p className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium mt-1">{viewLogDetail.subject}</p>
                </div>

                {viewLogDetail.status === 'FAILED' && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>Couldn't send this email.</span>
                    </div>
                    <p className="text-[11px] text-rose-700">Please verify customer email or check server dispatch connection.</p>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setViewLogDetail(null)}>
                    Close
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const logToRetry = viewLogDetail;
                      setViewLogDetail(null);
                      handleRetryEmail(logToRetry);
                    }}
                    className="bg-blue-600 text-white font-bold"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Resend Email
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* 6. New Campaign Modal */}
          <Modal
            isOpen={isNewCampaignModalOpen}
            onClose={() => setIsNewCampaignModalOpen(false)}
            title="Create Promotional Campaign"
            maxWidth="max-w-xl"
          >
            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4 text-xs">
              <Input
                label="Campaign Name *"
                required
                placeholder="e.g. Festival Special Discount Offer"
                value={newCampaignData.name}
                onChange={(e) => setNewCampaignData({ ...newCampaignData, name: e.target.value })}
              />

              <Select
                label="Target Audience *"
                value={newCampaignData.audienceType}
                onChange={(e) => setNewCampaignData({ ...newCampaignData, audienceType: e.target.value })}
                options={[
                  { value: 'ALL', label: `All Customers with Email (${customersWithEmailCount})` },
                  { value: 'RETAIL', label: 'Retail Customers' },
                  { value: 'WHOLESALE', label: 'Wholesale Customers' },
                  { value: 'DEALER', label: 'Dealers' },
                  { value: 'BUSINESS', label: 'Business Customers' }
                ]}
              />

              <Input
                label="Email Subject *"
                required
                placeholder="e.g. Exclusive 10% Off New Garment Collection"
                value={newCampaignData.subject}
                onChange={(e) => setNewCampaignData({ ...newCampaignData, subject: e.target.value })}
              />

              <div>
                <label className="block font-bold text-slate-700 mb-1">Campaign Message *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Hello {{customer_name}}, check out our latest arrival..."
                  value={newCampaignData.message}
                  onChange={(e) => setNewCampaignData({ ...newCampaignData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-900">Channel: Email</span>
                  <p className="text-[11px] text-blue-700">Will be sent to valid opt-in customer email addresses.</p>
                </div>
                <Badge className="bg-blue-600 text-white font-bold">{customersWithEmailCount} Recipients</Badge>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsNewCampaignModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md">
                  <Send className="w-4 h-4 mr-1.5" /> Send Campaign Now
                </Button>
              </div>
            </form>
          </Modal>

          {/* 7. View Campaign Detail Modal */}
          <Modal
            isOpen={isCampaignDetailModalOpen}
            onClose={() => setIsCampaignDetailModalOpen(false)}
            title="Campaign Details"
            maxWidth="max-w-xl"
          >
            {selectedCampaignDetail && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-slate-900">{selectedCampaignDetail.name}</h3>
                    {getStatusBadge(selectedCampaignDetail.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px] pt-1 border-t border-blue-100">
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Target Audience</span>
                      <span className="font-bold text-blue-900">{selectedCampaignDetail.audienceType || 'All Customers'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Recipients Count</span>
                      <span className="font-bold text-slate-900">{selectedCampaignDetail.recipientsCount || selectedCampaignDetail.sentCount || 0} customers</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Date Sent</span>
                      <span className="font-mono text-slate-700">{selectedCampaignDetail.date}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Created By</span>
                      <span className="font-bold text-slate-800">{selectedCampaignDetail.createdBy || 'Admin'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Email Subject</span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900">
                    {selectedCampaignDetail.subject || selectedCampaignDetail.name}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Message Content</span>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl whitespace-pre-line leading-relaxed text-slate-800 shadow-2xs font-sans">
                    {selectedCampaignDetail.message || 'No custom body recorded.'}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setIsCampaignDetailModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </Modal>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
