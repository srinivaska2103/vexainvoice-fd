'use client';

import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Plus, 
  Search, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Package,
  Calendar,
  User,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { returnService } from '@/services/returnService';
import { salesService } from '@/services/salesService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export default function SalesReturnsPage() {
  const { toastSuccess, toastError } = useToast();
  const [returns, setReturns] = useState([]);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');

  // Return Processing Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [invoiceSearchText, setInvoiceSearchText] = useState('');
  
  // Return Form State
  const [returnedQuantities, setReturnedQuantities] = useState({});
  const [returnReason, setReturnReason] = useState('Wrong Size');
  const [refundMethod, setRefundMethod] = useState('CASH');
  const [refundStatus, setRefundStatus] = useState('COMPLETED');
  const [notes, setNotes] = useState('');
  const [confirmedReceipt, setConfirmedReceipt] = useState(null);

  const fetchReturnsAndSales = async () => {
    setIsLoading(true);
    try {
      const [retRes, saleRes] = await Promise.all([
        returnService.getSalesReturns().catch(() => ({ data: [] })),
        salesService.getSales({ limit: 100 }).catch(() => ({ data: [] }))
      ]);
      setReturns(retRes.data || retRes || []);
      setSales(saleRes.data || saleRes.sales || saleRes || []);
    } catch (err) {
      console.error('Failed to fetch returns and sales:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnsAndSales();
  }, []);

  // When a sale is selected in return modal, load its item details & calculate returnable qty
  const handleSelectInvoiceForReturn = async (saleObj) => {
    try {
      // Fetch full sale detail from backend to get full item list
      const fullSale = await salesService.getSaleById(saleObj.id);
      const detailedSale = fullSale.data || fullSale || saleObj;
      
      setSelectedSale(detailedSale);

      // Initialize returned quantities map with 0
      const initialQtyMap = {};
      const items = detailedSale.items || detailedSale.sale_items || detailedSale.saleItems || [];
      items.forEach((item, idx) => {
        initialQtyMap[item.id || item.productId || idx] = 0;
      });
      setReturnedQuantities(initialQtyMap);
    } catch (err) {
      toastError('Failed to load invoice items for return validation');
    }
  };

  const handleReturnQtyChange = (itemId, val, maxReturnable) => {
    const parsed = parseInt(val, 10) || 0;
    if (parsed < 0) return;
    if (parsed > maxReturnable) {
      toastError(`Return quantity cannot exceed returnable limit of ${maxReturnable}`);
      return;
    }
    setReturnedQuantities({ ...returnedQuantities, [itemId]: parsed });
  };

  const handleProcessReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSale) {
      toastError('Please select an invoice for return');
      return;
    }

    const items = selectedSale.items || selectedSale.sale_items || selectedSale.saleItems || [];
    const itemsToReturn = items
      .map((item, idx) => {
        const key = item.id || item.productId || idx;
        const qty = returnedQuantities[key] || 0;
        if (qty > 0) {
          return {
            product_id: item.product_id || item.productId || item.id,
            variant_id: item.variant_id || item.variantId || undefined,
            quantity: qty,
            unit_price: Number(item.unit_price || item.unitPrice || 0)
          };
        }
        return null;
      })
      .filter(Boolean);

    if (itemsToReturn.length === 0) {
      toastError('Please specify return quantity (> 0) for at least one item');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await salesService.returnSale(selectedSale.id, {
        reason: returnReason,
        refund_method: refundMethod,
        refund_status: refundStatus,
        notes,
        returned_items: itemsToReturn
      });

      const resData = res?.data || res;
      toastSuccess(`Return processed! Refund: ${formatCurrency(resData.refundAmount || 0)} via ${refundMethod}`);
      setConfirmedReceipt(resData);
      fetchReturnsAndSales();
    } catch (err) {
      toastError(err.message || 'Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter existing sales history by Invoice #, Order #, Customer Name, or Phone
  const matchingSalesForReturnLookup = sales.filter((s) => {
    if (!invoiceSearchText.trim()) return true;
    const q = invoiceSearchText.toLowerCase();
    const invNo = (s.invoiceNumber || s.invoice_number || '').toLowerCase();
    const custName = (s.customer?.name || '').toLowerCase();
    const custPhone = (s.customer?.phone || '').toLowerCase();
    return invNo.includes(q) || custName.includes(q) || custPhone.includes(q);
  });

  // Filter returned list
  const filteredReturns = returns.filter((r) => {
    if (customerTypeFilter) {
      const cType = String(
        r.customer?.customerType ||
        r.customer?.customer_type ||
        r.sale?.customer?.customerType ||
        r.sale?.customer?.customer_type ||
        'RETAIL'
      ).toUpperCase();
      if (cType !== customerTypeFilter.toUpperCase()) return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const retNo = (r.returnNumber || r.id || '').toLowerCase();
    const invNo = (r.sale?.invoiceNumber || r.invoice_number || '').toLowerCase();
    const custName = (r.customer?.name || r.sale?.customer?.name || '').toLowerCase();
    const prodName = (r.product_name || '').toLowerCase();
    const varName = (r.variant_name || '').toLowerCase();
    return retNo.includes(q) || invNo.includes(q) || custName.includes(q) || prodName.includes(q) || varName.includes(q);
  });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                  SALES RETURNS & CREDIT NOTES
                </h1>
                <Badge variant="secondary" className="shrink-0 font-bold">Itemized Validation</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Lookup historic sales by Invoice #, Order #, or Customer Phone to issue returns and restore product stock
              </p>
            </div>
            <Button size="sm" onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs py-3 sm:py-2.5">
              <Plus className="w-4 h-4 mr-2" />
              Process New Sales Return
            </Button>
          </div>

          {/* Filter / Search Bar */}
          <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="w-full sm:w-80">
              <Input
                placeholder="Search returns by Return Ref #, Invoice #, Customer, Product..."
                icon={Search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 text-xs"
              />
            </div>
            <div className="w-full sm:w-64">
              <Select
                value={customerTypeFilter}
                onChange={(e) => setCustomerTypeFilter(e.target.value)}
                options={[
                  { value: '', label: 'Filter: All Customer Types' },
                  { value: 'RETAIL', label: 'Retail Customer' },
                  { value: 'WHOLESALE', label: 'Wholesale Buyer' },
                  { value: 'DEALER', label: 'Dealer / Stockist' },
                  { value: 'BUSINESS', label: 'Shop Customer' }
                ]}
                className="w-full text-xs"
              />
            </div>
          </Card>

          {/* Return Records Table */}
          {isLoading ? (
            <div className="flex justify-center p-16">
              <Spinner size="lg" className="text-blue-600" />
            </div>
          ) : filteredReturns.length === 0 ? (
            <Card className="p-12 text-center">
              <EmptyState
                icon={RotateCcw}
                title="No Sales Returns Recorded"
                description="Use the button above to lookup an invoice and process customer returns."
                action={
                  <Button size="sm" onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    Process Return
                  </Button>
                }
              />
            </Card>
          ) : (
            <Card className="overflow-hidden border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[850px]">
                  <thead className="bg-slate-900 border-b border-slate-800 text-white font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4 whitespace-nowrap min-w-[120px]">Return Ref #</th>
                      <th className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">Original Invoice #</th>
                      <th className="py-3.5 px-4 whitespace-nowrap min-w-[150px]">Customer Details</th>
                      <th className="py-3.5 px-4 whitespace-nowrap min-w-[150px]">Product Name</th>
                      <th className="py-3.5 px-4 whitespace-nowrap min-w-[100px]">Variant</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[90px]">Qty Returned</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[110px]">Refund Amount</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[100px]">Refund Method</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[100px]">Refund Status</th>
                      <th className="py-3.5 px-4 whitespace-nowrap min-w-[100px]">Date</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[100px]">Processed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredReturns.map((ret) => (
                      <tr key={ret.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                          {ret.returnNumber || `RET-${ret.id.substring(0, 8)}`}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {ret.sale?.invoiceNumber || ret.sale?.invoice_number || ret.invoice_number || '-'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">
                            {ret.customer?.name || ret.sale?.customer?.name || 'Walk-in Customer'}
                          </div>
                          {(ret.customer?.phone || ret.sale?.customer?.phone) && (
                            <div className="text-[10px] text-slate-400">
                              {ret.customer?.phone || ret.sale?.customer?.phone}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 max-w-[180px] truncate" title={ret.product_name}>
                            {ret.product_name || 'Product Item'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold text-[11px] border border-blue-100">
                            {ret.variant_name || '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-extrabold text-xs border border-amber-200">
                            {ret.quantity} {ret.quantity === 1 ? 'pc' : 'pcs'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-rose-600 whitespace-nowrap">
                          {formatCurrency(ret.refund_amount || ret.refundAmount || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 text-slate-700 uppercase">
                            {ret.refund_method || ret.refundMethod || 'CASH'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <Badge 
                            variant={(ret.refund_status || ret.refundStatus) === 'COMPLETED' ? 'success' : 'warning'} 
                            className="text-[10px]"
                          >
                            {ret.refund_status || ret.refundStatus || 'COMPLETED'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {formatDate(ret.createdAt || ret.created_at)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-600 whitespace-nowrap">
                          {ret.processed_by || 'Staff'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* PROCESS RETURN MODAL */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedSale(null);
            }}
            title="Lookup Sale Invoice & Process Return"
            maxWidth="max-w-2xl"
          >
            <div className="space-y-4 text-xs">
              {!selectedSale ? (
                /* STEP 1: INVOICE SEARCH & SELECTION */
                <div className="space-y-3">
                  <p className="text-slate-500 text-[11px]">
                    Search original sale invoice by Invoice Number, Order Number, or Customer Name / Phone:
                  </p>
                  <Input
                    placeholder="Enter Invoice Number (e.g. INV-2026-00101) or Customer Name..."
                    icon={Search}
                    value={invoiceSearchText}
                    onChange={(e) => setInvoiceSearchText(e.target.value)}
                    className="h-10 text-xs"
                  />

                  <div className="max-h-80 overflow-y-auto pr-1 space-y-2.5">
                    {matchingSalesForReturnLookup.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                        No matching sales invoice found
                      </div>
                    ) : (
                      matchingSalesForReturnLookup.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => handleSelectInvoiceForReturn(s)}
                          className="group relative p-3.5 bg-white hover:bg-blue-50/60 rounded-2xl border border-slate-200/90 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 active:scale-[0.995]"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-blue-600 font-mono text-xs group-hover:text-blue-700 transition">
                                Invoice: {s.invoiceNumber || s.invoice_number}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase">
                                {s.invoiceType || s.invoice_type || 'SALE'}
                              </span>
                              {(s.items?.length > 0 || s.sale_items?.length > 0) && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                                  {(s.items || s.sale_items).length} {((s.items || s.sale_items).length === 1 ? 'Item' : 'Items')}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-700 font-semibold">
                              Customer: {s.customer?.name || s.customers?.name || 'Walk-in Customer'} {s.customer?.phone || s.customers?.phone ? `(${s.customer?.phone || s.customers?.phone})` : ''}
                            </p>
                            <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-medium">
                              <span>Date: {formatDate(s.createdAt || s.invoice_date || s.created_at)}</span>
                              <span>•</span>
                              <span className="font-extrabold text-slate-900">Total: {formatCurrency(s.totalAmount || s.grand_total)}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 group-hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all duration-200 flex items-center space-x-1.5 shrink-0 group-hover:translate-x-0.5"
                          >
                            <span>Select Invoice</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* STEP 2: RETURN QUANTITY VALIDATION & CONFIRMATION */
                <form onSubmit={handleProcessReturnSubmit} className="space-y-4">
                  {/* Selected Invoice Banner */}
                  <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Selected Invoice</span>
                      <h3 className="font-mono font-extrabold text-blue-400 text-sm">
                        {selectedSale.invoiceNumber || selectedSale.invoice_number}
                      </h3>
                      <p className="text-[10.5px] text-slate-300">
                        Customer: {selectedSale.customer?.name || 'Walk-in'} | Date: {formatDate(selectedSale.createdAt || selectedSale.invoice_date)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => setSelectedSale(null)}
                      className="bg-slate-800 text-slate-200 border-slate-700 text-[10px]"
                    >
                      Change Invoice
                    </Button>
                  </div>

                  {/* Items Return Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[500px]">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[9.5px]">
                        <tr>
                          <th className="p-2.5">Product Item</th>
                          <th className="p-2.5 text-center">Original Qty</th>
                          <th className="p-2.5 text-center">Returnable Qty</th>
                          <th className="p-2.5 text-right w-28">Return Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(selectedSale.items || selectedSale.sale_items || selectedSale.saleItems || []).map((item, idx) => {
                          const key = item.id || item.productId || idx;
                          const origQty = Number(item.quantity || 1);
                          const maxReturnable = origQty; // Backend authoritative limit
                          const currentReturnQty = returnedQuantities[key] || 0;

                          return (
                            <tr key={key} className="hover:bg-slate-50">
                              <td className="p-2.5">
                                <p className="font-bold text-slate-900">{item.product_name || item.name || 'Product Item'}</p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  Price: {formatCurrency(item.unit_price || item.unitPrice || 0)}
                                </p>
                              </td>
                              <td className="p-2.5 text-center font-semibold text-slate-700">{origQty}</td>
                              <td className="p-2.5 text-center font-bold text-emerald-600">{maxReturnable}</td>
                              <td className="p-2.5 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  max={maxReturnable}
                                  value={currentReturnQty}
                                  onChange={(e) => handleReturnQtyChange(key, e.target.value, maxReturnable)}
                                  className="w-20 px-2 py-1 text-right border border-slate-300 rounded font-bold focus:outline-none focus:border-blue-600"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Refund Method & Status Configuration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl shadow-xs">
                    <div>
                      <Select
                        label="REFUND METHOD *"
                        value={refundMethod}
                        onChange={(e) => setRefundMethod(e.target.value)}
                        options={[
                          { value: 'CASH', label: 'Cash Refund' },
                          { value: 'UPI', label: 'UPI Refund' },
                          { value: 'CARD', label: 'Card Payout' },
                          { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                          { value: 'CHEQUE', label: 'Cheque Refund' },
                          { value: 'CREDIT', label: 'Customer Ledger Credit (Balance Offset)' }
                        ]}
                      />
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">
                        How money/credit is actually handed to the customer.
                      </p>
                    </div>

                    <div>
                      <Select
                        label="REFUND STATUS *"
                        value={refundStatus}
                        onChange={(e) => setRefundStatus(e.target.value)}
                        options={[
                          { value: 'COMPLETED', label: 'Completed (Handed over / Settled)' },
                          { value: 'PENDING', label: 'Pending (Cheque / Authorization pending)' }
                        ]}
                      />
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">
                        Do not mark completed until cash is physically handed over.
                      </p>
                    </div>
                  </div>

                  {/* Return Reason & Notes */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Select
                        label="Return Reason *"
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        options={[
                          { value: 'Damaged', label: 'Damaged / Defective Item' },
                          { value: 'Wrong Product', label: 'Wrong Product Shipped' },
                          { value: 'Wrong Size', label: 'Wrong Size / Fitting Issue' },
                          { value: 'Quality Issue', label: 'Quality Issue' },
                          { value: 'Customer Changed Mind', label: 'Customer Changed Mind' },
                          { value: 'Other', label: 'Other Reason' }
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Internal Remarks</label>
                      <input
                        type="text"
                        placeholder="Additional details..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={() => setSelectedSale(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Confirm Return & Refund ({refundMethod})
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
