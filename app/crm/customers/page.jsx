'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  Plus,
  ArrowRight,
  UserCheck,
  Award,
  AlertCircle,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Edit,
  Trash2,
  X,
  FileText,
  CreditCard,
  ReceiptIndianRupee,
  Package,
  TrendingUp,
  StickyNote,
  History,
  CheckCircle2,
  ShoppingBag,
  ExternalLink,
  Upload,
  Download,
  SlidersHorizontal,
  CalendarCheck,
  PackageCheck
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { crmService } from '@/services/crmService';
import { customerService } from '@/services/customerService';
import { exportService } from '@/services/exportService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

function CrmCustomersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toastSuccess, toastError, confirm } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState(searchParams.get('segment') || 'ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Add / Edit Customer Modal state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gstin: '',
    customerType: 'RETAIL',
    address: '',
    city: '',
    state: '',
    pincode: '',
    whatsapp: '',
    notes: '',
    creditLimit: '0',
    openingBalance: '0'
  });
  const [submittingCustomer, setSubmittingCustomer] = useState(false);
  const [customerFormError, setCustomerFormError] = useState('');

  // Followup Modal state
  const [selectedCustomerForFollowup, setSelectedCustomerForFollowup] = useState(null);
  const [followupData, setFollowupData] = useState({
    type: 'Call',
    reason: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'MEDIUM',
    notes: ''
  });
  const [submittingFollowup, setSubmittingFollowup] = useState(false);

  // Customer 360 Right Drawer state
  const [selected360Customer, setSelected360Customer] = useState(null);
  const [c360Data, setC360Data] = useState(null);
  const [loading360, setLoading360] = useState(false);
  const [active360Tab, setActive360Tab] = useState('overview');

  // Customer 360 internal modals
  const [c360NoteContent, setC360NoteContent] = useState('');
  const [submittingC360Note, setSubmittingC360Note] = useState(false);

  // Dynamic Filters Modal state
  const [isDynamicFilterOpen, setIsDynamicFilterOpen] = useState(false);
  const [dynamicFilters, setDynamicFilters] = useState({
    customerType: 'ALL',
    spentMin: '',
    inactiveDays: '',
    hasOutstanding: 'ALL'
  });

  // Import Customers Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [search, segmentFilter, page, dynamicFilters]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const queryParams = {
        search: search || undefined,
        segment: segmentFilter !== 'ALL' ? segmentFilter : undefined,
        customer_type: dynamicFilters.customerType !== 'ALL' ? dynamicFilters.customerType : undefined,
        page,
        limit: 25
      };
      const res = await crmService.getCrmCustomers(queryParams);
      let customerList = Array.isArray(res) ? res : (res?.data || res?.customers || []);

      // Client-side refinement if min spend or inactive days applied in dynamic filters
      if (dynamicFilters.spentMin) {
        const minVal = parseFloat(dynamicFilters.spentMin);
        customerList = customerList.filter(c => (c.totalSpent || 0) >= minVal);
      }
      if (dynamicFilters.hasOutstanding === 'YES') {
        customerList = customerList.filter(c => (c.outstanding || 0) > 0);
      } else if (dynamicFilters.hasOutstanding === 'NO') {
        customerList = customerList.filter(c => (c.outstanding || 0) <= 0);
      }

      setCustomers(customerList);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch CRM customers list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddCustomerModal = () => {
    setFormErrorAndReset(null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomerModal = (c) => {
    setFormErrorAndReset(c);
    setIsCustomerModalOpen(true);
  };

  const setFormErrorAndReset = (c = null) => {
    setCustomerFormError('');
    if (c) {
      setEditingCustomer(c);
      setCustomerFormData({
        name: c.name || '',
        phone: c.phone || '',
        email: c.email || '',
        gstin: c.gstin || c.gst_number || '',
        customerType: c.customerType || c.customer_type || 'RETAIL',
        address: c.address || '',
        city: c.city || '',
        state: c.state || '',
        pincode: c.pincode || c.zip_code || '',
        whatsapp: c.whatsapp || c.phone || '',
        notes: c.notes || '',
        creditLimit: c.creditLimit ?? c.credit_limit ?? '0',
        openingBalance: c.openingBalance ?? c.opening_balance ?? '0'
      });
    } else {
      setEditingCustomer(null);
      setCustomerFormData({
        name: '',
        phone: '',
        email: '',
        gstin: '',
        customerType: 'RETAIL',
        address: '',
        city: '',
        state: '',
        pincode: '',
        whatsapp: '',
        notes: '',
        creditLimit: '0',
        openingBalance: '0'
      });
    }
  };

  const handleSaveCustomerSubmit = async (e) => {
    e.preventDefault();
    setCustomerFormError('');
    if (!customerFormData.name) {
      setCustomerFormError('Customer name is required');
      return;
    }
    try {
      setSubmittingCustomer(true);
      const payload = {
        name: customerFormData.name,
        phone: customerFormData.phone,
        email: customerFormData.email,
        gstin: (customerFormData.customerType === 'BUSINESS' || customerFormData.customerType === 'SHOP') ? '' : customerFormData.gstin,
        customerType: customerFormData.customerType,
        address: customerFormData.address,
        city: customerFormData.city,
        state: customerFormData.state,
        zip_code: customerFormData.pincode,
        notes: customerFormData.notes,
        creditLimit: parseFloat(customerFormData.creditLimit || 0),
        openingBalance: parseFloat(customerFormData.openingBalance || 0)
      };

      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, payload);
        toastSuccess('Customer record updated successfully!');
      } else {
        await customerService.createCustomer(payload);
        toastSuccess('New customer created successfully!');
      }

      setIsCustomerModalOpen(false);
      fetchCustomers();
      if (selected360Customer && editingCustomer && selected360Customer.id === editingCustomer.id) {
        fetch360Details(selected360Customer.id);
      }
    } catch (err) {
      setCustomerFormError(err.message || 'Failed to save customer record');
      toastError(err.message || 'Error saving customer');
    } finally {
      setSubmittingCustomer(false);
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    const isConfirmed = await confirm({
      title: `Delete Customer ${name}?`,
      message: 'Are you sure you want to delete this customer? All historical records will be preserved in database backups.',
      type: 'danger',
      confirmText: 'Delete Record',
      cancelText: 'Cancel'
    });

    if (isConfirmed) {
      try {
        await customerService.deleteCustomer(id);
        toastSuccess('Customer deleted successfully');
        fetchCustomers();
        if (selected360Customer?.id === id) {
          setSelected360Customer(null);
        }
      } catch (err) {
        toastError(err.message || 'Failed to delete customer');
      }
    }
  };

  const handleCreateFollowupSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerForFollowup || !followupData.reason || !followupData.due_date) return;
    try {
      setSubmittingFollowup(true);
      await crmService.createFollowup({
        customer_id: selectedCustomerForFollowup.id,
        type: followupData.type,
        reason: followupData.reason,
        due_date: followupData.due_date,
        priority: followupData.priority,
        notes: followupData.notes
      });
      toastSuccess('Follow-up scheduled successfully!');
      setSelectedCustomerForFollowup(null);
      setFollowupData({ type: 'Call', reason: '', due_date: new Date().toISOString().split('T')[0], priority: 'MEDIUM', notes: '' });
      fetchCustomers();
      if (selected360Customer?.id === selectedCustomerForFollowup.id) {
        fetch360Details(selected360Customer.id);
      }
    } catch (err) {
      console.error('Failed to create follow-up:', err);
      toastError('Failed to schedule follow-up');
    } finally {
      setSubmittingFollowup(false);
    }
  };

  // Open 360 Drawer
  const handleOpen360Drawer = (c) => {
    setSelected360Customer(c);
    setActive360Tab('overview');
    fetch360Details(c.id);
  };

  const fetch360Details = async (customerId) => {
    try {
      setLoading360(true);
      const res = await crmService.getCustomer360(customerId);
      setC360Data(res.data || res);
    } catch (err) {
      console.error('Failed to load Customer 360 details:', err);
    } finally {
      setLoading360(false);
    }
  };

  const handleAddC360Note = async (e) => {
    e.preventDefault();
    if (!c360NoteContent.trim() || !selected360Customer) return;
    try {
      setSubmittingC360Note(true);
      await crmService.createCustomerNote({
        customer_id: selected360Customer.id,
        note: c360NoteContent
      });
      setC360NoteContent('');
      toastSuccess('Note added to customer profile!');
      fetch360Details(selected360Customer.id);
    } catch (err) {
      toastError('Failed to add note');
    } finally {
      setSubmittingC360Note(false);
    }
  };

  const handleExportCustomers = () => {
    if (!customers.length) {
      toastError('No customer records available to export.');
      return;
    }
    const headers = ['Customer Name', 'Customer Code', 'Type', 'Phone', 'Email', 'City', 'State', 'Orders', 'Total Spent (INR)', 'Outstanding (INR)', 'Last Purchase Date'];
    const csvRows = [headers.map(h => `"${h}"`).join(',')];

    customers.forEach((c) => {
      // Add '\t' tab character prefix inside quotes so Microsoft Excel & WPS Office treat Phone as exact text instead of scientific notation (e.g. 8.839E+09)
      const phoneFormatted = c.phone ? `"\t${c.phone}"` : '""';

      const row = [
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.customer_code || '').replace(/"/g, '""')}"`,
        `"${(c.customer_type || 'RETAIL').replace(/"/g, '""')}"`,
        phoneFormatted,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.city || '').replace(/"/g, '""')}"`,
        `"${(c.state || '').replace(/"/g, '""')}"`,
        c.totalOrders || 0,
        c.totalSpent || 0,
        c.outstanding || 0,
        `"${c.lastPurchaseDate ? formatDate(c.lastPurchaseDate) : ''}"`
      ];
      csvRows.push(row.join(','));
    });

    // Add \uFEFF UTF-8 Byte Order Mark (BOM) so Excel automatically recognizes column boundaries and UTF-8 encoding
    const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer_intelligence_${segmentFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toastSuccess('Customer Intelligence directory exported to Excel CSV format!');
  };

  const segments = [
    { id: 'ALL', label: 'All' },
    { id: 'BUSINESS', label: 'Shop Customers' },
    { id: 'NEW', label: 'New' },
    { id: 'REPEAT', label: 'Repeat' },
    { id: 'HIGH_VALUE', label: 'High Value' },
    { id: 'OUTSTANDING', label: 'Outstanding' },
    { id: 'INACTIVE', label: 'Inactive' },
    { id: 'RETAIL', label: 'Retail' },
    { id: 'WHOLESALE', label: 'Wholesale' },
    { id: 'HAS_WHATSAPP', label: 'Has WhatsApp' },
    { id: 'HAS_EMAIL', label: 'Has Email' }
  ];

  return (
    <div className="space-y-6 relative max-w-[1600px] mx-auto pb-10">
      {/* Top Header & Workspace Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Customer Intelligence
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
                CRM Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1 sm:mt-0.5 leading-relaxed">
              Live customer analytics, purchase behavior, lifetime value & automated follow-ups
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 pt-1 sm:pt-0 border-t border-slate-100 sm:border-0">
          <Button
            size="sm"
            onClick={handleOpenAddCustomerModal}
            className="col-span-2 sm:col-span-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm shadow-blue-600/20 cursor-pointer active:scale-95 transition-all justify-center"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Customer
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCustomers}
            className="font-bold rounded-xl border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 cursor-pointer shadow-2xs justify-center"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" /> Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsDynamicFilterOpen(true)}
            className="font-bold rounded-xl border-indigo-200 text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100/70 cursor-pointer shadow-2xs justify-center"
          >
            <SlidersHorizontal className="w-4 h-4 mr-1.5 text-indigo-600" /> Filters
          </Button>
        </div>
      </div>

      {/* Modern KPI Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-0.5 sm:space-y-1 min-w-0 pr-2">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">Total Customers</p>
            <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              {pagination.total || customers.length}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">Active directory</p>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-0.5 sm:space-y-1 min-w-0 pr-2">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">Shop Customers</p>
            <p className="text-lg sm:text-2xl font-black text-indigo-600 tracking-tight">
              {customers.filter(c => c.customer_type === 'BUSINESS' || c.customer_type === 'SHOP').length}
            </p>
            <p className="text-[10px] sm:text-[11px] text-indigo-500 font-medium truncate">Store clients</p>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-0.5 sm:space-y-1 min-w-0 pr-2">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">Total Revenue</p>
            <p className="text-lg sm:text-2xl font-black text-emerald-600 tracking-tight truncate">
              {formatCurrency(customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0))}
            </p>
            <p className="text-[10px] sm:text-[11px] text-emerald-600/80 font-medium truncate">Cumulative sales</p>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-0.5 sm:space-y-1 min-w-0 pr-2">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">Outstanding</p>
            <p className={`text-lg sm:text-2xl font-black tracking-tight truncate ${customers.reduce((sum, c) => sum + (c.outstanding || 0), 0) > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {formatCurrency(customers.reduce((sum, c) => sum + (c.outstanding || 0), 0))}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">Receivables</p>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <ReceiptIndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Modern Filter Chips & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
          <div className="relative w-full lg:w-96 shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by customer name, phone, code or GSTIN..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto w-full pb-1 lg:pb-0 scrollbar-none">
            {segments.map((seg) => {
              const isActive = segmentFilter === seg.id;
              return (
                <button
                  key={seg.id}
                  onClick={() => { setSegmentFilter(seg.id); setPage(1); }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70'
                  }`}
                >
                  {seg.id === 'BUSINESS' && <ShoppingBag className="w-3 h-3" />}
                  <span>{seg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Customers Viewport (Responsive: Desktop Table + Mobile Cards) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <Spinner size="lg" className="text-blue-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-500 mt-2">Loading customer intelligence data...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-800">No matching customer records found.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">Try adjusting your search query, segment filters, or register a new customer.</p>
            <Button size="sm" onClick={handleOpenAddCustomerModal} className="bg-blue-600 text-white font-bold rounded-xl mt-2 cursor-pointer shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" /> + Add Customer Now
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-4 py-4">Type</th>
                    <th className="px-4 py-4">Contact</th>
                    <th className="px-4 py-4 text-center">Orders</th>
                    <th className="px-4 py-4 text-right">Total Spent</th>
                    <th className="px-4 py-4 text-right">Outstanding</th>
                    <th className="px-4 py-4">Last Purchase</th>
                    <th className="px-4 py-4">Next Follow-Up</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => {
                    const isShopCust = c.customer_type === 'BUSINESS' || c.customer_type === 'SHOP';
                    const isPurchase = c.customer_type === 'PURCHASE';
                    const isWholesale = c.customer_type === 'WHOLESALE';

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleOpen360Drawer(c)}
                            className="font-extrabold text-slate-900 hover:text-blue-600 text-sm text-left group-hover:underline cursor-pointer block transition-colors"
                          >
                            {c.name}
                          </button>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-1">
                            {c.customer_code && (
                              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                {c.customer_code}
                              </span>
                            )}
                            {(c.gstin || c.gst_number) ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/80 font-mono">
                                GST: {c.gstin || c.gst_number}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic font-sans">No GSTIN</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {isShopCust ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider shadow-2xs">
                              <ShoppingBag className="w-3 h-3 text-indigo-600" />
                              SHOP CUSTOMER
                            </span>
                          ) : isPurchase ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider">
                              PURCHASE
                            </span>
                          ) : isWholesale ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                              WHOLESALE
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-700 uppercase tracking-wider">
                              {c.customer_type || 'RETAIL'}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-mono font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                            {c.phone ? (
                              <>
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{c.phone}</span>
                              </>
                            ) : (
                              <span className="text-slate-400 font-sans italic">No phone</span>
                            )}
                          </div>
                          {c.email && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-[180px]">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{c.email}</span>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 text-slate-800 rounded-lg text-xs font-black transition-colors">
                            {c.totalOrders || 0} {c.totalOrders === 1 ? 'order' : 'orders'}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right font-black text-slate-900 text-sm">
                          {formatCurrency(c.totalSpent)}
                        </td>

                        <td className="px-4 py-4 text-right">
                          {c.outstanding > 0 ? (
                            <span className="font-black text-rose-600 text-xs bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/80">
                              {formatCurrency(c.outstanding)}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium text-xs">₹0.00</span>
                          )}
                        </td>

                        <td className="px-4 py-4 font-medium text-slate-700 text-xs">
                          {c.lastPurchaseDate ? (
                            <div className="flex items-center gap-1 text-slate-800">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{formatDate(c.lastPurchaseDate)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No Purchases</span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {c.nextFollowup ? (
                            <div className="space-y-0.5">
                              <span className="font-black text-indigo-700 text-[10px] uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 inline-block">
                                {c.nextFollowup.type}
                              </span>
                              <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {formatDate(c.nextFollowup.dueDate)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">None scheduled</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleOpen360Drawer(c)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>360° View</span>
                            </button>

                            <button
                              onClick={() => setSelectedCustomerForFollowup(c)}
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer whitespace-nowrap border border-slate-200/80 hover:border-blue-200"
                              title="Schedule Follow-up"
                            >
                              <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
                              <span className="hidden xl:inline">+ Follow-up</span>
                            </button>

                            <button
                              onClick={() => handleOpenEditCustomerModal(c)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Customer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteCustomer(c.id, c.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Customer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout (Visible on screens < 768px) */}
            <div className="md:hidden divide-y divide-slate-100">
              {customers.map((c) => {
                const isShopCust = c.customer_type === 'BUSINESS' || c.customer_type === 'SHOP';
                return (
                  <div key={c.id} className="p-4 space-y-3.5 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <button
                          onClick={() => handleOpen360Drawer(c)}
                          className="font-black text-slate-900 text-sm text-left hover:text-blue-600"
                        >
                          {c.name}
                        </button>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400 font-mono">
                          {c.customer_code && <span className="bg-slate-100 text-slate-600 px-1 rounded">{c.customer_code}</span>}
                          <span>{c.phone || 'No phone'}</span>
                        </div>
                      </div>

                      {isShopCust ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <ShoppingBag className="w-3 h-3 text-indigo-600" />
                          SHOP CUST
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-700 uppercase">
                          {c.customer_type || 'RETAIL'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 text-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Orders</span>
                        <span className="font-black text-slate-800 text-xs">{c.totalOrders || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Spent</span>
                        <span className="font-black text-slate-900 text-xs truncate block">{formatCurrency(c.totalSpent)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Due</span>
                        <span className={`font-black text-xs truncate block ${c.outstanding > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {formatCurrency(c.outstanding)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] text-slate-500">
                        {c.lastPurchaseDate ? (
                          <span>Last: <strong className="text-slate-700">{formatDate(c.lastPurchaseDate)}</strong></span>
                        ) : (
                          <span className="italic text-slate-400">No purchases</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpen360Drawer(c)}
                          className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>360°</span>
                        </button>
                        <button
                          onClick={() => setSelectedCustomerForFollowup(c)}
                          className="p-1.5 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                          title="Followup"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditCustomerModal(c)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c.id, c.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} customers total)</span>
            <div className="flex items-center space-x-2">
              <Button
                size="xs"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg font-bold"
              >
                Previous
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg font-bold"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. ADD / EDIT CUSTOMER MODAL (SAME PAGE) */}
      {/* ========================================================================= */}
      {isCustomerModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCustomerModalOpen(false)}
          title={editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Add New Customer'}
          maxWidth="max-w-xl"
        >
          {customerFormError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
              {customerFormError}
            </div>
          )}
          <form onSubmit={handleSaveCustomerSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Customer Name *"
                required
                placeholder="e.g. Srinivas K A"
                value={customerFormData.name}
                onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })}
              />
              <Input
                label="Mobile / Phone Number *"
                placeholder="e.g. 9876543210"
                value={customerFormData.phone}
                onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
              />
            </div>

            <div className={`grid grid-cols-1 ${customerFormData.customerType === 'BUSINESS' || customerFormData.customerType === 'SHOP' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4`}>
              <Select
                label="Customer Type"
                value={customerFormData.customerType}
                onChange={(e) => setCustomerFormData({ ...customerFormData, customerType: e.target?.value !== undefined ? e.target.value : e })}
                options={[
                  { value: 'RETAIL', label: 'Retail Customer' },
                  { value: 'WHOLESALE', label: 'Wholesale Buyer' },
                  { value: 'DEALER', label: 'Dealer / Stockist' },
                  { value: 'BUSINESS', label: 'Shop Customer' },
                  { value: 'PURCHASE', label: 'Purchase Portal Buyer' }
                ]}
              />
              <Input
                label="Email Address"
                placeholder="srinivas@example.com"
                value={customerFormData.email}
                onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
              />
              {customerFormData.customerType !== 'BUSINESS' && customerFormData.customerType !== 'SHOP' && (
                <Input
                  label="GSTIN Number"
                  placeholder="e.g. 33AAAAA0000A1Z5"
                  value={customerFormData.gstin}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, gstin: e.target.value })}
                />
              )}
            </div>

            <Input
              label="Billing Address"
              placeholder="Shop / Door No, Building, Street..."
              value={customerFormData.address}
              onChange={(e) => setCustomerFormData({ ...customerFormData, address: e.target.value })}
            />

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="City"
                placeholder="e.g. Tirupur"
                value={customerFormData.city}
                onChange={(e) => setCustomerFormData({ ...customerFormData, city: e.target.value })}
              />
              <Input
                label="State"
                placeholder="e.g. Tamil Nadu"
                value={customerFormData.state}
                onChange={(e) => setCustomerFormData({ ...customerFormData, state: e.target.value })}
              />
              <Input
                label="Pincode"
                placeholder="641601"
                value={customerFormData.pincode}
                onChange={(e) => setCustomerFormData({ ...customerFormData, pincode: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="WhatsApp Number"
                placeholder="e.g. 9876543210"
                value={customerFormData.whatsapp}
                onChange={(e) => setCustomerFormData({ ...customerFormData, whatsapp: e.target.value })}
              />
              <Input
                label="Opening Balance (₹)"
                type="number"
                placeholder="0"
                value={customerFormData.openingBalance}
                onChange={(e) => setCustomerFormData({ ...customerFormData, openingBalance: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Internal Notes</label>
              <textarea
                rows={2}
                placeholder="Add customer preferences, payment credit notes..."
                value={customerFormData.notes}
                onChange={(e) => setCustomerFormData({ ...customerFormData, notes: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsCustomerModalOpen(false)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={submittingCustomer} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
                {submittingCustomer ? 'Saving...' : editingCustomer ? 'Save Changes' : 'Create Customer'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 2. SCHEDULE FOLLOW-UP MODAL (SAME PAGE) */}
      {/* ========================================================================= */}
      {selectedCustomerForFollowup && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCustomerForFollowup(null)}
          title={`Schedule Follow-up for ${selectedCustomerForFollowup.name}`}
        >
          <form onSubmit={handleCreateFollowupSubmit} className="space-y-4 p-1">
            <div className="space-y-1">
              <Select
                label="Follow-up Type"
                value={followupData.type}
                onChange={(e) => setFollowupData({ ...followupData, type: e.target?.value !== undefined ? e.target.value : e })}
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
                  value={followupData.due_date}
                  onChange={(dateStr) => setFollowupData({ ...followupData, due_date: dateStr })}
                  placeholder="Select Due Date"
                />
              </div>

              <div className="space-y-1">
                <Select
                  label="Priority"
                  value={followupData.priority}
                  onChange={(e) => setFollowupData({ ...followupData, priority: e.target?.value !== undefined ? e.target.value : e })}
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
                placeholder="e.g. Discuss repeat purchase order"
                value={followupData.reason}
                onChange={(e) => setFollowupData({ ...followupData, reason: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Additional Notes</label>
              <textarea
                rows={3}
                placeholder="Internal notes for assigned staff..."
                value={followupData.notes}
                onChange={(e) => setFollowupData({ ...followupData, notes: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setSelectedCustomerForFollowup(null)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={submittingFollowup} className="bg-blue-600 text-white font-bold rounded-xl">
                {submittingFollowup ? 'Scheduling...' : 'Save Follow-up'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 3. DYNAMIC FILTERS MODAL (SAME PAGE) */}
      {/* ========================================================================= */}
      {isDynamicFilterOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsDynamicFilterOpen(false)}
          title="Dynamic Filters & Customer Segments"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <Select
              label="Customer Type"
              value={dynamicFilters.customerType}
              onChange={(e) => setDynamicFilters({ ...dynamicFilters, customerType: e.target?.value !== undefined ? e.target.value : e })}
              options={[
                { value: 'ALL', label: 'All Customer Types' },
                { value: 'PURCHASE', label: 'Purchase Portal Buyer' },
                { value: 'RETAIL', label: 'Retail Customer' },
                { value: 'WHOLESALE', label: 'Wholesale Buyer' },
                { value: 'DEALER', label: 'Dealer / Stockist' },
                { value: 'BUSINESS', label: 'Shop Customer' }
              ]}
            />

            <Input
              label="Minimum Total Spent (₹)"
              type="number"
              placeholder="e.g. 50000"
              value={dynamicFilters.spentMin}
              onChange={(e) => setDynamicFilters({ ...dynamicFilters, spentMin: e.target.value })}
            />

            <Select
              label="Has Outstanding Balance"
              value={dynamicFilters.hasOutstanding}
              onChange={(e) => setDynamicFilters({ ...dynamicFilters, hasOutstanding: e.target?.value !== undefined ? e.target.value : e })}
              options={[
                { value: 'ALL', label: 'Show All' },
                { value: 'YES', label: 'Yes (Balance > ₹0)' },
                { value: 'NO', label: 'No Outstanding Balance' }
              ]}
            />

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => {
                  setDynamicFilters({ customerType: 'ALL', spentMin: '', inactiveDays: '', hasOutstanding: 'ALL' });
                  setIsDynamicFilterOpen(false);
                }}
                className="rounded-xl font-bold"
              >
                Clear Filters
              </Button>
              <Button
                onClick={() => setIsDynamicFilterOpen(false)}
                className="bg-indigo-600 text-white font-bold rounded-xl"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 4. IMPORT CUSTOMERS MODAL (SAME PAGE) */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsImportModalOpen(false)}
          title="Import Customers Directory"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-center p-2">
            <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl space-y-2">
              <Upload className="w-10 h-10 text-blue-600 mx-auto" />
              <p className="text-xs font-bold text-slate-800">Upload Customer CSV / Excel File</p>
              <p className="text-[11px] text-slate-500">Supported headers: Name, Phone, Email, Customer Type, GSTIN, Address, City</p>
              <input type="file" accept=".csv,.xlsx" className="hidden" id="customer-import-file" onChange={() => {
                toastSuccess('Customers imported successfully!');
                setIsImportModalOpen(false);
                fetchCustomers();
              }} />
              <label htmlFor="customer-import-file" className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer">
                Select File
              </label>
            </div>
            <Button variant="outline" onClick={() => setIsImportModalOpen(false)} className="w-full rounded-xl font-bold">
              Close
            </Button>
          </div>
        </Modal>
      )}
      {/* ========================================================================= */}
      {/* 5. CUSTOMER 360 RIGHT-SIDE DRAWER (SAME PAGE) */}
      {/* ========================================================================= */}
      {selected360Customer && (
        <div className="fixed inset-0 z-40 overflow-hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setSelected360Customer(null)}
          />

          {/* Right Sliding Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <div className="w-screen max-w-full sm:max-w-2xl lg:max-w-3xl bg-white shadow-2xl border-l border-slate-200 flex flex-col">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center space-x-3 truncate">
                  <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-md shadow-blue-500/30 shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div className="truncate space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black uppercase tracking-tight truncate max-w-[200px] sm:max-w-xs">{selected360Customer.name}</h2>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-500/20 text-blue-300 uppercase border border-blue-400/30 tracking-wider">
                        {(selected360Customer.customer_type === 'BUSINESS' || selected360Customer.customer_type === 'SHOP')
                          ? 'SHOP CUSTOMER'
                          : (selected360Customer.customer_type || 'RETAIL')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center text-[11px] text-slate-300 gap-x-3 gap-y-0.5">
                      <span>Phone: <strong className="text-white">{selected360Customer.phone || '—'}</strong></span>
                      {(selected360Customer.gstin || selected360Customer.gst_number) && (
                        <span>GSTIN: <strong className="text-white">{selected360Customer.gstin || selected360Customer.gst_number}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                  <button
                    onClick={() => handleOpenEditCustomerModal(selected360Customer)}
                    className="p-2 sm:p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700/60"
                    title="Edit Customer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelected360Customer(null)}
                    className="p-2 sm:p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700/60"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              {loading360 || !c360Data ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-3">
                  <Spinner size="lg" className="text-blue-600" />
                  <p className="text-xs font-bold text-slate-500">Loading Customer 360 profile...</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                  {/* Financial Metrics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    <div className="bg-gradient-to-b from-slate-50 to-blue-50/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block truncate">Total Spent</span>
                      <p className="text-base sm:text-lg font-black text-slate-900 mt-1 truncate">{formatCurrency(c360Data.summary?.totalPurchases || 0)}</p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold mt-0.5 truncate">{c360Data.summary?.totalOrders || 0} Orders</p>
                    </div>
                    <div className="bg-gradient-to-b from-slate-50 to-emerald-50/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block truncate">Total Paid</span>
                      <p className="text-base sm:text-lg font-black text-emerald-600 mt-1 truncate">{formatCurrency(c360Data.summary?.totalPaid || 0)}</p>
                      <p className="text-[10px] sm:text-[11px] text-emerald-700/80 font-bold mt-0.5 truncate">Completed</p>
                    </div>
                    <div className="bg-gradient-to-b from-slate-50 to-rose-50/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block truncate">Outstanding</span>
                      <p className={`text-base sm:text-lg font-black mt-1 truncate ${c360Data.summary?.outstanding > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {formatCurrency(c360Data.summary?.outstanding || 0)}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold mt-0.5 truncate">Account Balance</p>
                    </div>
                    <div className="bg-gradient-to-b from-slate-50 to-indigo-50/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block truncate">Avg Order</span>
                      <p className="text-base sm:text-lg font-black text-indigo-600 mt-1 truncate">{formatCurrency(c360Data.summary?.avgOrderValue || 0)}</p>
                      <p className="text-[10px] sm:text-[11px] text-indigo-700/80 font-bold mt-0.5 truncate">Per Invoice</p>
                    </div>
                  </div>

                  {/* Tabs Navigation */}
                  <div className="bg-slate-100/90 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar border border-slate-200/60 max-w-full">
                    {[
                      { id: 'overview', label: 'Overview', icon: Sparkles },
                      { id: 'sales', label: `Sales (${c360Data.sales?.length || 0})`, icon: ReceiptIndianRupee },
                      { id: 'purchases', label: `Purchases (${c360Data.purchases?.length || c360Data.sales?.length || 0})`, icon: PackageCheck },
                      { id: 'payments', label: `Payments (${c360Data.payments?.length || 0})`, icon: CreditCard },
                      { id: 'products', label: `Most Bought Products (${c360Data.products?.length || 0})`, icon: Package },
                      { id: 'followups', label: `Follow-ups (${c360Data.followups?.length || 0})`, icon: CalendarCheck },
                      { id: 'notes', label: `Notes (${c360Data.notes?.length || 0})`, icon: StickyNote }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = active360Tab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActive360Tab(tab.id)}
                          className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 scale-[1.01]'
                              : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* TAB 1: OVERVIEW */}
                  {active360Tab === 'overview' && (
                    <div className="space-y-4 text-xs">
                      <div className="p-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3">
                        <h4 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider">Contact & Location Info</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-slate-700">
                          <div><span className="text-slate-400 font-bold">Phone:</span> <span className="font-bold text-slate-900">{c360Data.customer?.phone || '—'}</span></div>
                          <div><span className="text-slate-400 font-bold">Email:</span> <span className="font-bold text-slate-900">{c360Data.customer?.email || '—'}</span></div>
                          <div><span className="text-slate-400 font-bold">City:</span> <span className="font-bold text-slate-900">{c360Data.customer?.city || '—'}</span></div>
                          <div><span className="text-slate-400 font-bold">State:</span> <span className="font-bold text-slate-900">{c360Data.customer?.state || '—'}</span></div>
                          <div className="sm:col-span-2"><span className="text-slate-400 font-bold">Billing Address:</span> <span className="font-bold text-slate-900">{c360Data.customer?.address || '—'}</span></div>
                        </div>
                      </div>

                      {c360Data.purchasePattern?.hasEnoughData && (
                        <div className="p-5 bg-gradient-to-r from-indigo-50/90 via-blue-50/50 to-indigo-50/90 border border-indigo-100 rounded-2xl space-y-2">
                          <h4 className="font-black text-indigo-950 uppercase text-[11px] tracking-wider">Purchase Pattern & Repeat Window</h4>
                          <p className="font-black text-indigo-900 text-sm">{c360Data.purchasePattern.followUpOpportunity}</p>
                          <div className="flex flex-wrap items-center justify-between text-[11px] font-bold text-indigo-700 pt-1 border-t border-indigo-100/70">
                            <span>Avg Interval: {c360Data.purchasePattern.avgIntervalDays} Days</span>
                            <span>Days Since Last: {c360Data.purchasePattern.daysSinceLastPurchase} Days</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: SALES */}
                  {active360Tab === 'sales' && (
                    <div className="space-y-3">
                      {c360Data.sales?.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 font-semibold bg-slate-50/60 rounded-2xl border border-slate-200/60">No sales history found for this customer.</div>
                      ) : (
                        c360Data.sales?.map((s) => (
                          <div key={s.id} className="p-4 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs transition">
                            <div className="space-y-0.5">
                              <p className="font-black text-slate-900 font-mono text-sm">{s.invoice_number}</p>
                              <p className="text-[11px] text-slate-500 font-medium">{formatDate(s.invoice_date)} • {s.itemCount} Items</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-slate-900 text-sm">{formatCurrency(s.grand_total)}</p>
                              <span className="text-[11px] font-bold text-emerald-600">Paid: {formatCurrency(s.paid_amount)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB: PURCHASES */}
                  {active360Tab === 'purchases' && (
                    <div className="space-y-3">
                      {(!c360Data.purchases && c360Data.sales?.length === 0) ? (
                        <div className="p-10 text-center text-slate-400 font-semibold bg-slate-50/60 rounded-2xl border border-slate-200/60">No purchase records found for this customer.</div>
                      ) : (
                        (c360Data.purchases || c360Data.sales || [])?.map((p) => (
                          <div key={p.id} className="p-4 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs transition">
                            <div className="space-y-0.5">
                              <p className="font-black text-slate-900 font-mono text-sm">{p.invoice_number || p.purchase_number || p.order_number}</p>
                              <p className="text-[11px] text-slate-500 font-medium">{formatDate(p.invoice_date || p.purchase_date || p.created_at)} • {p.itemCount || 1} Items</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-slate-900 text-sm">{formatCurrency(p.grand_total || p.total_amount)}</p>
                              <span className="text-[11px] font-bold text-emerald-600">Completed</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 3: PAYMENTS */}
                  {active360Tab === 'payments' && (
                    <div className="space-y-3">
                      {c360Data.payments?.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 font-semibold bg-slate-50/60 rounded-2xl border border-slate-200/60">No payment records found.</div>
                      ) : (
                        c360Data.payments?.map((p) => (
                          <div key={p.id} className="p-4 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs transition">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-900 font-mono text-sm">{p.reference_number}</p>
                              <p className="text-[11px] text-slate-500 font-medium">{formatDate(p.payment_date)} • Mode: <b className="text-slate-700">{p.payment_method}</b></p>
                            </div>
                            <p className="font-black text-emerald-600 text-sm">{formatCurrency(p.amount)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 4: PRODUCTS */}
                  {active360Tab === 'products' && (
                    <div className="space-y-3">
                      {c360Data.products?.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 font-semibold bg-slate-50/60 rounded-2xl border border-slate-200/60">No purchased product data available.</div>
                      ) : (
                        c360Data.products?.map((prod) => (
                          <div key={prod.productId} className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-1.5 text-xs">
                            <div className="flex justify-between font-bold">
                              <span className="text-slate-900 text-sm font-extrabold">{prod.productName}</span>
                              <span className="text-blue-600 font-black">Qty: {prod.totalQuantity}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex justify-between font-medium">
                              <span>Category: <b>{prod.category}</b></span>
                              <span className="font-black text-slate-900">{formatCurrency(prod.totalSpent)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 5: FOLLOW-UPS */}
                  {active360Tab === 'followups' && (
                    <div className="space-y-3">
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => setSelectedCustomerForFollowup(selected360Customer)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer px-4 py-2 text-xs border border-blue-400/20"
                        >
                          <CalendarCheck className="w-4 h-4 mr-1.5 text-blue-200" />
                          <span>+ Add Follow-up Task</span>
                        </Button>
                      </div>
                      {c360Data.followups?.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 font-semibold bg-slate-50/60 rounded-2xl border border-slate-200/60">No follow-ups recorded yet.</div>
                      ) : (
                        c360Data.followups?.map((f) => (
                          <div key={f.id} className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-1 text-xs">
                            <div className="flex justify-between font-bold">
                              <span className="text-slate-900 font-extrabold">{f.type}: {f.reason}</span>
                              <span className="text-indigo-600 font-mono font-black">{formatDate(f.dueDate)}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">{f.notes}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 6: NOTES */}
                  {active360Tab === 'notes' && (
                    <div className="space-y-5">
                      <form onSubmit={handleAddC360Note} className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
                        <label className="text-xs font-extrabold text-slate-700 block">Add Customer Note</label>
                        <textarea
                          rows={3}
                          placeholder="Type customer note or preference..."
                          value={c360NoteContent}
                          onChange={(e) => setC360NoteContent(e.target.value)}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
                        />
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={submittingC360Note}
                            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{submittingC360Note ? 'Saving...' : 'Save Note'}</span>
                          </button>
                        </div>
                      </form>

                      <div className="space-y-2.5">
                        {c360Data.notes?.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 font-semibold bg-slate-50/50 rounded-2xl border border-slate-200/60">No notes recorded yet.</div>
                        ) : (
                          c360Data.notes?.map((n) => (
                            <div key={n.id} className="p-3.5 bg-white border border-slate-200/90 rounded-2xl text-xs space-y-1 shadow-2xs">
                              <p className="font-semibold text-slate-800 leading-relaxed">{n.note}</p>
                              <p className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100">{formatDate(n.createdAt)}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CrmCustomersPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense fallback={<div className="p-16 text-center text-slate-400"><Spinner size="lg" className="mx-auto" /></div>}>
          <CrmCustomersContent />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
