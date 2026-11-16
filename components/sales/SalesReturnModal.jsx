'use client';

import React, { useState } from 'react';
import { 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Banknote, 
  CreditCard, 
  Layers, 
  Receipt, 
  Printer, 
  X,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { salesService } from '@/services/salesService';

export default function SalesReturnModal({ isOpen, onClose, sale, onReturnSuccess }) {
  const { toastSuccess, toastError } = useToast();
  const [returnedQuantities, setReturnedQuantities] = useState({});
  const [returnReason, setReturnReason] = useState('Wrong Size');
  const [refundMethod, setRefundMethod] = useState('CASH');
  const [refundStatus, setRefundStatus] = useState('COMPLETED');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedReceipt, setConfirmedReceipt] = useState(null);

  // Initialize return quantities when modal opens or sale changes
  React.useEffect(() => {
    if (sale) {
      const initialMap = {};
      const items = sale.items || sale.sale_items || [];
      items.forEach((item, idx) => {
        const key = item.id || item.productId || idx;
        initialMap[key] = 0;
      });
      setReturnedQuantities(initialMap);
      setConfirmedReceipt(null);
      setRefundMethod('CASH');
      setRefundStatus('COMPLETED');
      setNotes('');
      setReturnReason('Wrong Size');
    }
  }, [sale, isOpen]);

  if (!isOpen || !sale) return null;

  const items = sale.items || sale.sale_items || [];
  const custName = sale.customer?.name || sale.customers?.name || 'Walk-in Customer';
  const originalPaymentMethod = sale.paymentMethod || sale.payment_method || (sale.sale_payments && sale.sale_payments[0]?.payment_method) || 'CASH';
  const originalTotal = Number(sale.totalAmount || sale.grand_total || sale.total_amount || 0);
  const previouslyReturnedAmount = Number(sale.returnedAmount || 0);

  // Calculate live return summary
  let totalReturnUnits = 0;
  let estimatedRefundAmount = 0;

  const itemsToReturn = items
    .map((item, idx) => {
      const key = item.id || item.productId || idx;
      const qty = returnedQuantities[key] || 0;
      const origQty = Number(item.original_quantity || item.originalQuantity || item.quantity || 1);
      const retQty = Number(item.returned_quantity || item.returnedQuantity || 0);
      const maxReturnable = Math.max(0, origQty - retQty);

      if (qty > 0) {
        totalReturnUnits += qty;
        const lineTotal = Number(item.total_amount || item.totalAmount || (item.unitPrice * origQty));
        const unitRefundRate = origQty > 0 ? (lineTotal / origQty) : Number(item.unitPrice || 0);
        const itemRefund = unitRefundRate * qty;
        estimatedRefundAmount += itemRefund;

        return {
          product_id: item.product_id || item.productId || item.id,
          variant_id: item.variant_id || item.variantId || undefined,
          product_name: item.product_name || item.name,
          quantity: qty,
          unit_price: Number(item.unit_price || item.unitPrice || 0),
          estimated_refund: itemRefund,
          maxReturnable
        };
      }
      return null;
    })
    .filter(Boolean);

  const handleReturnQtyChange = (key, val, maxReturnable) => {
    const parsed = parseInt(val, 10) || 0;
    if (parsed < 0) return;
    if (parsed > maxReturnable) {
      toastError(`Return quantity cannot exceed returnable limit of ${maxReturnable} PCS`);
      return;
    }
    setReturnedQuantities(prev => ({ ...prev, [key]: parsed }));
  };

  const handleConfirmReturnAndRefund = async () => {
    if (itemsToReturn.length === 0) {
      toastError('Please select return quantity (> 0) for at least one item');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        reason: returnReason,
        refund_method: refundMethod,
        refund_status: refundStatus,
        notes: notes.trim() || undefined,
        returned_items: itemsToReturn.map(it => ({
          product_id: it.product_id,
          variant_id: it.variant_id,
          quantity: it.quantity
        }))
      };

      const res = await salesService.returnSale(sale.id, payload);
      const resultData = res?.data || res;

      toastSuccess(`Return processed! Refund: ${formatCurrency(resultData.refundAmount || estimatedRefundAmount)} via ${refundMethod}`);
      setConfirmedReceipt(resultData);
      if (onReturnSuccess) {
        onReturnSuccess(resultData);
      }
    } catch (err) {
      toastError(err.message || 'Failed to process return and refund');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={confirmedReceipt ? 'Sales Return & Refund Confirmed' : 'Sales Return & Customer Refund'}
      maxWidth="max-w-3xl"
    >
      {confirmedReceipt ? (
        /* CONFIRMED RETURN & REFUND RECEIPT VIEW */
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-600/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-emerald-900">Return & Refund Recorded</h3>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Inventory restored & financial transaction completed.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Return Reference</span>
              <span className="font-mono font-black text-slate-900 text-sm">
                {confirmedReceipt.returnReference || `RET-${Date.now().toString().slice(-6)}`}
              </span>
            </div>
          </div>

          {/* Receipt Breakdown Card */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-3 border-b border-slate-100 text-[11px]">
              <div>
                <span className="text-slate-400 block font-bold">Original Invoice:</span>
                <span className="font-mono font-extrabold text-blue-600">{sale.invoiceNumber || sale.invoice_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">Customer:</span>
                <span className="font-extrabold text-slate-800">{custName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">Refund Method:</span>
                <span className="font-extrabold text-slate-900 px-2 py-0.5 bg-slate-100 rounded">
                  {confirmedReceipt.refundMethod || refundMethod}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">Refund Status:</span>
                <span className="font-extrabold text-emerald-700 px-2 py-0.5 bg-emerald-100 rounded">
                  {confirmedReceipt.refundStatus || refundStatus}
                </span>
              </div>
            </div>

            {/* Returned Items List */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Returned Line Items:</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[9.5px]">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Returned Qty</th>
                      <th className="p-2 text-right">Refund Rate</th>
                      <th className="p-2 text-right">Line Refund</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(confirmedReceipt.returnedItems || itemsToReturn).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold text-slate-800">{it.product_name}</td>
                        <td className="p-2 text-center font-bold text-amber-700">{it.quantity} PCS</td>
                        <td className="p-2 text-right font-mono text-slate-600">
                          {formatCurrency(it.unit_refund_price || (it.line_refund_amount / it.quantity) || it.unit_price)}
                        </td>
                        <td className="p-2 text-right font-black text-slate-900 font-mono">
                          {formatCurrency(it.line_refund_amount || it.estimated_refund)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Refunded */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-sm">
              <span className="font-bold text-slate-700">Total Refund Paid to Customer:</span>
              <span className="text-base font-black text-emerald-600 font-mono">
                {formatCurrency(confirmedReceipt.refundAmount || estimatedRefundAmount)}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
              className="text-xs font-bold"
            >
              <Printer className="w-3.5 h-3.5 mr-1 text-slate-600" />
              Print Return Receipt
            </Button>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              onClick={onClose}
            >
              Done / Close
            </Button>
          </div>
        </div>
      ) : (
        /* STEP 1 & 2: RETURN ITEMS SELECTION & REFUND METHOD FORM */
        <div className="space-y-4 text-xs">
          {/* Header Invoice Summary */}
          <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Original Invoice</span>
                <span className="font-mono font-black text-blue-400 text-sm">
                  {sale.invoiceNumber || sale.invoice_number}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                  {sale.invoiceType || 'SALE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Customer: <strong className="text-white">{custName}</strong> | Date: {formatDate(sale.createdAt || sale.invoice_date)}
              </p>
            </div>

            <div className="flex items-center space-x-4 text-right">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Original Total</span>
                <span className="font-black text-white text-xs">{formatCurrency(originalTotal)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Original Payment</span>
                <span className="font-bold text-blue-300 text-xs">{originalPaymentMethod}</span>
              </div>
              {previouslyReturnedAmount > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-400 block">Prev. Returned</span>
                  <span className="font-black text-rose-300 text-xs">-{formatCurrency(previouslyReturnedAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Selection Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[10.5px] font-black uppercase text-slate-600 tracking-wider">
                Select Products & Return Quantities
              </span>
              <span className="text-[10.5px] text-slate-400 font-semibold">
                Remaining returnable quantities enforced by backend
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[9.5px]">
                <tr>
                  <th className="p-2.5">Product & Variant</th>
                  <th className="p-2.5 text-center">Original Qty</th>
                  <th className="p-2.5 text-center">Already Ret.</th>
                  <th className="p-2.5 text-center">Remaining Returnable</th>
                  <th className="p-2.5 text-right">Unit Price</th>
                  <th className="p-2.5 text-right w-28">Return Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const key = item.id || item.productId || idx;
                  const origQty = Number(item.original_quantity || item.originalQuantity || item.quantity || 1);
                  const retQty = Number(item.returned_quantity || item.returnedQuantity || 0);
                  const maxReturnable = Math.max(0, origQty - retQty);
                  const currentReturnQty = returnedQuantities[key] || 0;

                  let varText = 'Standard';
                  if (item.color || item.size) {
                    varText = [item.color, item.size].filter(Boolean).join(' / ');
                  }

                  return (
                    <tr key={key} className={maxReturnable === 0 ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50'}>
                      <td className="p-2.5">
                        <p className="font-bold text-slate-900">{item.product_name || item.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Variant: {varText} {item.sku ? `| SKU: ${item.sku}` : ''}
                        </p>
                      </td>
                      <td className="p-2.5 text-center font-semibold text-slate-700">{origQty} PCS</td>
                      <td className="p-2.5 text-center font-semibold text-slate-500">{retQty} PCS</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10.5px] ${
                          maxReturnable > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {maxReturnable} PCS
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-semibold text-slate-700">
                        {formatCurrency(item.unit_price || item.unitPrice || 0)}
                      </td>
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          min="0"
                          max={maxReturnable}
                          disabled={maxReturnable === 0}
                          value={currentReturnQty}
                          onChange={(e) => handleReturnQtyChange(key, e.target.value, maxReturnable)}
                          className="w-20 px-2 py-1 text-right border border-slate-300 rounded-lg font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Refund Method & Return Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl shadow-xs">
            {/* Refund Method Selector (Mandatory Field) */}
            <div>
              <Select
                label="REFUND METHOD *"
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value)}
                icon={Banknote}
                options={[
                  { value: 'CASH', label: 'Cash Refund' },
                  { value: 'UPI', label: 'UPI Refund' },
                  { value: 'CARD', label: 'Card Payout' },
                  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                  { value: 'CHEQUE', label: 'Cheque Refund' },
                  { value: 'CREDIT', label: 'Customer Ledger Credit' }
                ]}
              />
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                How money/credit is actually handed to the customer.
              </p>
            </div>

            {/* Refund Status Selector */}
            <div>
              <Select
                label="REFUND PAYMENT STATUS *"
                value={refundStatus}
                onChange={(e) => setRefundStatus(e.target.value)}
                icon={CheckCircle2}
                options={[
                  { value: 'COMPLETED', label: 'Completed (Handed over / Settled)' },
                  { value: 'PENDING', label: 'Pending (Cheque / Authorization pending)' }
                ]}
              />
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                Do not mark completed until cash is physically handed over.
              </p>
            </div>

            {/* Return Reason */}
            <div>
              <Select
                label="RETURN REASON *"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                icon={RotateCcw}
                options={[
                  { value: 'Wrong Size', label: 'Wrong Size / Fitting Issue' },
                  { value: 'Damaged', label: 'Damaged / Defective Item' },
                  { value: 'Wrong Product', label: 'Wrong Product Shipped' },
                  { value: 'Quality Issue', label: 'Fabric / Quality Dissatisfaction' },
                  { value: 'Customer Changed Mind', label: 'Customer Changed Mind' },
                  { value: 'Other', label: 'Other / Counter Return' }
                ]}
              />
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                Categorization for returns and defect tracking.
              </p>
            </div>
          </div>

          {/* Remarks input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Remarks / Cheque No / Reference Notes:</label>
            <input
              type="text"
              placeholder="e.g. Cash handed at counter / Cheque #123456"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl text-xs"
            />
          </div>

          {/* Calculation & Confirmation Summary */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-black text-blue-700 tracking-wider block">
                Calculated Refund Summary
              </span>
              <p className="text-xs text-blue-900 font-bold mt-0.5">
                Returning {totalReturnUnits} {totalReturnUnits === 1 ? 'unit' : 'units'} • Method: {refundMethod} ({refundStatus})
              </p>
              <p className="text-[10.5px] text-blue-700/80">
                Accounts for original line item prices, proportional discounts & GST.
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-blue-200 sm:pl-4">
              <span className="text-[10px] uppercase font-bold text-blue-600 block">Eligible Refund Amount</span>
              <span className="text-lg font-black text-blue-900 font-mono">
                {formatCurrency(estimatedRefundAmount)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={totalReturnUnits === 0 || isSubmitting}
              isLoading={isSubmitting}
              onClick={handleConfirmReturnAndRefund}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Confirm Return & Refund ({formatCurrency(estimatedRefundAmount)})
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
