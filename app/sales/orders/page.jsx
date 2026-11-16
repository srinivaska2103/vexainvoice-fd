'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Boxes,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Search,
  Filter,
  User,
  Phone,
  Calendar,
  IndianRupee,
  ReceiptIndianRupee,
  FileCheck,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Building2,
  Trash2,
  Edit3,
  Lock
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { customerOrderService } from '@/services/customerOrderService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { getRolePath } from '@/lib/permissions';

export default function CustomerOrdersPage() {
  const router = useRouter();
  const { role, user } = useAuth();
  const isAdmin = role === 'ADMIN';
  const { toastSuccess, toastError } = useToast();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [entitlement, setEntitlement] = useState(null);

  // Detail & Review Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Item adjustments in modal
  const [orderItemsState, setOrderItemsState] = useState([]);
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchEntitlement();
  }, [selectedStatus]);

  const fetchEntitlement = async () => {
    try {
      const { subscriptionService } = await import('@/services/subscriptionService');
      const res = await subscriptionService.getCompanyStatus();
      const data = res?.data || res;
      if (data?.selfShopping) {
        setEntitlement(data.selfShopping);
      }
    } catch (e) {
      console.warn('Could not load entitlement in orders page:', e);
    }
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await customerOrderService.getOrders({
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: searchQuery.trim() || undefined
      });
      const data = res?.data || res || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch customer orders:', err);
      toastError(err.message || 'Failed to fetch customer orders.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDetail = async (orderId) => {
    setIsLoadingDetail(true);
    setIsDetailModalOpen(true);
    try {
      const res = await customerOrderService.getOrderById(orderId);
      const data = res?.data || res;
      setSelectedOrder(data);
      setOrderItemsState(data.customer_order_items || []);
      setAdjustmentNotes(data.adjustment_notes || '');
    } catch (err) {
      toastError(err.message || 'Failed to load order details');
      setIsDetailModalOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus, reason = null) => {
    setActionLoading(true);
    try {
      await customerOrderService.updateStatus(orderId, {
        status: newStatus,
        rejectionReason: reason,
        adjustmentNotes: adjustmentNotes,
        updatedItems: orderItemsState
      });
      toastSuccess(`Order status updated to ${newStatus}`);
      setIsDetailModalOpen(false);
      setIsRejectModalOpen(false);
      fetchOrders();
    } catch (err) {
      toastError(err.message || 'Failed to update order status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProceedToBilling = (order) => {
    // Navigate directly into POS billing preloaded with this order
    const userRoleSlug = user?.custom_role?.slug || user?.role_slug || null;
    const targetUrl = getRolePath(role, userRoleSlug, 'sales/new', `orderId=${encodeURIComponent(order.id)}`);
    router.push(targetUrl);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return <Badge variant="warning" className="bg-amber-50 text-amber-700 border-amber-200">Pending Review</Badge>;
      case 'ACCEPTED':
        return <Badge variant="info" className="bg-blue-50 text-blue-700 border-blue-200">Accepted</Badge>;
      case 'READY_FOR_BILLING':
        return <Badge variant="primary" className="bg-indigo-50 text-indigo-700 border-indigo-200">Ready For Billing</Badge>;
      case 'BILLED':
        return <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">Billed / Invoiced</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" className="bg-rose-50 text-rose-700 border-rose-200">Rejected</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (o.order_number && o.order_number.toLowerCase().includes(q)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
      (o.customer_phone && o.customer_phone.toLowerCase().includes(q))
    );
  });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl text-white shadow-md shadow-indigo-600/20">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">Customer Portal Orders</h1>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    ADMIN Billing Panel
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review incoming self-shopping customer carts and proceed to final billing through VEXA Invoice.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrders}
                disabled={isLoading}
                className="text-xs font-bold rounded-xl"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Full Module Lock if company does not have LIFETIME_ACTIVE entitlement */}
          {entitlement && entitlement.status !== 'LIFETIME_ACTIVE' && (
            <div className="bg-gradient-to-b from-amber-50 to-orange-50/50 p-8 rounded-3xl border-2 border-amber-200 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-amber-200 text-amber-900 border border-amber-300">
                  LOCKED FEATURE
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  Customer Orders Module is Locked
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The Customer Orders module, public shop catalogue, and shop QR generation require the <strong className="text-slate-900">₹59,999 Lifetime Plan</strong>. Unlock it once to get lifetime permanent access with zero recurring fees.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/settings/subscription"
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/25 transition flex items-center space-x-2"
                >
                  <span>Unlock Lifetime Access — ₹59,999</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/sales"
                  className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Go to Invoices & POS
                </Link>
              </div>
            </div>
          )}

          {/* If Lifetime Active, show active banner */}
          {entitlement && entitlement.status === 'LIFETIME_ACTIVE' && (
            <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 px-3.5 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-800">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Lifetime Access Active — Permanent Custom Online Shop Store Entitlement</span>
              </div>
              <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                LIFETIME VERIFIED
              </span>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Order #, Customer, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
              {['ALL', 'PENDING_REVIEW', 'ACCEPTED', 'READY_FOR_BILLING', 'BILLED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <Card className="border-slate-200 overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Spinner size="lg" className="text-indigo-600" />
                <p className="text-xs font-bold text-slate-500 mt-2">Loading customer orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Boxes className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No Customer Orders Found</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Customer carts submitted from your public shop catalogue will appear here for ADMIN review.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Order Reference</th>
                      <th className="py-3 px-4">Submitted At</th>
                      <th className="py-3 px-4">Customer Details</th>
                      <th className="py-3 px-4">Items & Variants</th>
                      <th className="py-3 px-4">Estimated Total</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredOrders.map((ord) => {
                      const itemCount = (ord.customer_order_items || []).reduce(
                        (sum, item) => sum + (!item.is_removed ? Number(item.quantity || 1) : 0),
                        0
                      );

                      return (
                        <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-900 block">{ord.order_number}</span>
                            {ord.session_token && (
                              <span className="text-[10px] text-slate-400 font-mono">Session: {ord.session_token.slice(0, 8)}...</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            <div className="flex items-center text-[11px]">
                              <Clock className="w-3 h-3 text-slate-400 mr-1" />
                              {formatDate(ord.created_at)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{ord.customer_name || 'Walk-in Customer'}</div>
                            {ord.customer_phone && (
                              <div className="text-[11px] text-slate-500 flex items-center mt-0.5 font-mono">
                                <Phone className="w-2.5 h-2.5 text-slate-400 mr-1" />
                                {ord.customer_phone}
                              </div>
                            )}
                            {ord.customer_address && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5" title={ord.customer_address}>
                                📍 {ord.customer_address}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            <span className="font-bold text-indigo-700">{itemCount} items</span>
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">
                              {(ord.customer_order_items || [])
                                .map((i) => `${i.product_name}${i.variant_name ? ` (${i.variant_name})` : ''}`)
                                .join(', ')}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-black text-slate-900 text-sm">
                            ₹{Number(ord.estimated_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {getStatusBadge(ord.status)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenDetail(ord.id)}
                                className="text-xs font-bold rounded-lg px-2.5 py-1"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                                Review
                              </Button>

                              {ord.status !== 'BILLED' && ord.status !== 'REJECTED' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleProceedToBilling(ord)}
                                  className="text-xs font-bold rounded-lg px-3 py-1 bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                                >
                                  <ReceiptIndianRupee className="w-3.5 h-3.5 mr-1" />
                                  Bill Sale
                                </Button>
                              )}
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

          {/* ORDER REVIEW & ADJUSTMENT MODAL */}
          <Modal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            title={`Customer Order Review — ${selectedOrder?.order_number || ''}`}
            size="xl"
          >
            {isLoadingDetail ? (
              <div className="py-16 text-center">
                <Spinner size="lg" className="text-indigo-600 mx-auto" />
                <p className="text-xs font-bold text-slate-500 mt-2">Loading full order details & live inventory...</p>
              </div>
            ) : selectedOrder ? (
              <div className="space-y-5">
                {/* Meta details banner */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Customer</span>
                    <span className="font-extrabold text-slate-900">{selectedOrder.customer_name || 'Walk-in Customer'}</span>
                    {selectedOrder.customer_phone && <span className="block text-[11px] font-mono text-slate-600">{selectedOrder.customer_phone}</span>}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Submitted Date</span>
                    <span className="font-bold text-slate-800">{formatDate(selectedOrder.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Current Status</span>
                    <div className="mt-0.5">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Estimated Subtotal</span>
                    <span className="font-black text-slate-900 text-sm">₹{Number(selectedOrder.estimated_total || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Delivery / Billing Address */}
                {selectedOrder.customer_address && (
                  <div className="bg-indigo-50/60 border border-indigo-200/80 p-3 rounded-xl text-xs text-indigo-950">
                    <strong className="font-bold block text-[10px] uppercase text-indigo-700 tracking-wider">
                      Customer Delivery / Billing Address:
                    </strong>
                    <p className="mt-0.5 whitespace-pre-line font-medium text-slate-800">
                      {selectedOrder.customer_address}
                    </p>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-xs text-amber-900">
                    <strong className="font-bold block text-[10px] uppercase text-amber-700">Customer Note:</strong>
                    {selectedOrder.notes}
                  </div>
                )}

                {/* Items List with Live Stock Validation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Submitted Products ({orderItemsState.length})</span>
                    <span className="text-[11px] text-slate-400">ADMIN can adjust quantity or remove unavailable items</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                    {orderItemsState.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          item.is_removed ? 'bg-slate-100/70 opacity-60' : 'bg-white'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className={`font-bold ${item.is_removed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                              {item.product_name}
                            </span>
                            {item.variant_name && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {item.variant_name}
                              </span>
                            )}
                            {item.is_removed && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                Removed ({item.removal_reason || 'Out of stock'})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-mono">
                            {item.sku && <span>SKU: {item.sku}</span>}
                            <span>Price: ₹{Number(item.unit_price).toFixed(2)}</span>
                          </div>

                          {/* Stock Warning Badge */}
                          {!item.is_removed && (
                            <div className="pt-1 flex items-center space-x-2 text-[10px]">
                              {item.liveStock < Number(item.quantity) ? (
                                <span className="inline-flex items-center text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Current Stock ({item.liveStock}) is less than ordered ({item.quantity})
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Verified in Stock ({item.liveStock})
                                </span>
                              )}

                              {item.priceChanged && (
                                <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  Notice: Current retail price is ₹{item.livePrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Quantity and Controls */}
                        <div className="flex items-center space-x-3 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Line Total</span>
                            <span className="font-black text-slate-900 text-sm">
                              ₹{Number(item.line_total || 0).toFixed(2)}
                            </span>
                          </div>

                          {!item.is_removed ? (
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 1;
                                  const updated = [...orderItemsState];
                                  updated[idx].quantity = val;
                                  updated[idx].line_total = val * Number(updated[idx].unit_price);
                                  setOrderItemsState(updated);
                                }}
                                className="w-16 px-2 py-1 text-center font-bold bg-slate-50 border border-slate-200 rounded-lg text-xs"
                              />
                              <button
                                type="button"
                                title="Remove item"
                                onClick={() => {
                                  const updated = [...orderItemsState];
                                  updated[idx].is_removed = true;
                                  updated[idx].removal_reason = 'Unavailable in stock';
                                  updated[idx].line_total = 0;
                                  setOrderItemsState(updated);
                                }}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...orderItemsState];
                                updated[idx].is_removed = false;
                                updated[idx].removal_reason = null;
                                updated[idx].line_total = Number(updated[idx].quantity) * Number(updated[idx].unit_price);
                                setOrderItemsState(updated);
                              }}
                              className="text-xs font-bold text-indigo-600 hover:underline px-2 py-1"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Adjustment Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Internal ADMIN Notes / Adjustment Reason:</label>
                  <textarea
                    rows="2"
                    placeholder="e.g., Customer phoned to substitute size L with M..."
                    value={adjustmentNotes}
                    onChange={(e) => setAdjustmentNotes(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Actions Footer */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    {selectedOrder.status !== 'REJECTED' && selectedOrder.status !== 'BILLED' && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsRejectModalOpen(true)}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-bold rounded-xl"
                      >
                        Reject Order
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {selectedOrder.status === 'PENDING_REVIEW' && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() => handleStatusChange(selectedOrder.id, 'ACCEPTED')}
                        className="text-xs font-bold rounded-xl text-blue-700 border-blue-200 hover:bg-blue-50"
                      >
                        Mark as Accepted
                      </Button>
                    )}

                    {selectedOrder.status !== 'BILLED' && (
                      <Button
                        type="button"
                        onClick={() => handleProceedToBilling(selectedOrder)}
                        className="text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
                      >
                        <ReceiptIndianRupee className="w-3.5 h-3.5 mr-1.5" />
                        Proceed to Final POS Billing
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </Modal>

          {/* REJECT CONFIRMATION MODAL */}
          <Modal
            isOpen={isRejectModalOpen}
            onClose={() => setIsRejectModalOpen(false)}
            title="Reject Customer Order"
            size="md"
          >
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Please provide a recorded reason for rejecting order <strong>#{selectedOrder?.order_number}</strong>.
              </p>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Rejection:</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Items out of stock, duplicate submission, customer cancelled..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsRejectModalOpen(false)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!rejectionReason.trim() || actionLoading}
                  onClick={() => handleStatusChange(selectedOrder.id, 'REJECTED', rejectionReason)}
                  className="bg-rose-600 text-white hover:bg-rose-700 rounded-xl text-xs font-bold"
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </Modal>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
