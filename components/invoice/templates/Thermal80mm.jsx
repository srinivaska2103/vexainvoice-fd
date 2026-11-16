'use client';

import React from 'react';
import { formatDate } from '@/lib/utils';

// Helper to convert number to words (Indian Rupees)
function numberToWordsINR(num) {
  if (isNaN(num) || num <= 0) return '';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : ' ');
  };

  let rupees = Math.floor(num);
  let str = '';

  if (Math.floor(rupees / 10000000) > 0) {
    str += inWords(Math.floor(rupees / 10000000)) + 'Crore ';
    rupees %= 10000000;
  }
  if (Math.floor(rupees / 100000) > 0) {
    str += inWords(Math.floor(rupees / 100000)) + 'Lakh ';
    rupees %= 100000;
  }
  if (Math.floor(rupees / 1000) > 0) {
    str += inWords(Math.floor(rupees / 1000)) + 'Thousand ';
    rupees %= 1000;
  }
  if (Math.floor(rupees / 100) > 0) {
    str += inWords(Math.floor(rupees / 100)) + 'Hundred ';
    rupees %= 100;
  }
  if (rupees > 0) {
    str += inWords(rupees);
  }

  return str.trim() ? str.trim() + ' Only' : '';
}

export default function Thermal80mm({ sale, business, user }) {
  const items = sale?.items || sale?.saleItems || sale?.sale_items || [];

  const subtotal = items.reduce((sum, item) => sum + (Number(item.unitPrice || item.unit_price || item.price || 0) * Number(item.quantity || item.qty || 0)), 0);
  const discountVal = Number(sale?.discountAmount || sale?.discount_amount || 0);

  let tradeDiscount = sale?.tradeDiscount || 0;
  let schemeDiscount = sale?.schemeDiscount || 0;
  let cashDiscount = sale?.cashDiscount || 0;
  let lessAmount = sale?.lessAmount || 0;

  if (sale?.notes && sale.notes.includes('DISCOUNTS:')) {
    try {
      const jsonStr = sale.notes.split('DISCOUNTS:')[1];
      const parsed = JSON.parse(jsonStr);
      if (parsed) {
        tradeDiscount = parsed.tradeDiscount || tradeDiscount;
        schemeDiscount = parsed.schemeDiscount || schemeDiscount;
        cashDiscount = parsed.cashDiscount || cashDiscount;
        lessAmount = parsed.lessAmount || lessAmount;
      }
    } catch (e) {}
  }
  if (!tradeDiscount && !schemeDiscount && !cashDiscount && discountVal > 0) {
    tradeDiscount = discountVal;
  }

  const taxableAmount = Math.max(0, subtotal - (tradeDiscount + schemeDiscount + cashDiscount));
  
  const gstTotal = items.reduce((acc, item) => {
    const itemTotal = Number(item.unitPrice || item.unit_price || item.price || 0) * Number(item.quantity || item.qty || 0);
    const rate = Number(item.gst_percentage || item.tax_rate || item.taxRate || 0);
    return acc + (itemTotal * (rate / 100));
  }, 0);

  const hasGst = gstTotal > 0 || items.some(item => Number(item.gst_percentage || item.tax_rate || item.taxRate || 0) > 0);
  const grandTotal = Number(sale?.totalAmount || sale?.total_amount || sale?.grand_total || (taxableAmount + gstTotal - lessAmount));

  const invoiceNumber = sale?.invoiceNumber || sale?.invoice_number || 'INV-001';
  const invoiceDate = sale?.createdAt || sale?.created_at || sale?.invoice_date || new Date().toISOString();

  const rawPaymentMethod = 
    sale?.paymentMethod || 
    sale?.payment_method || 
    sale?.paymentMode || 
    sale?.payment_mode || 
    (sale?.sale_payments && sale.sale_payments[0]?.payment_method) || 
    null;

  const formatPayment = (pm) => {
    if (!pm) return 'Not specified';
    const upper = String(pm).toUpperCase();
    switch (upper) {
      case 'CASH': return 'Cash';
      case 'UPI': return 'UPI';
      case 'CARD': return 'Card';
      case 'BANK_TRANSFER': return 'Bank Transfer';
      case 'CHEQUE': return 'Cheque';
      case 'CREDIT': return 'Credit';
      default: return upper.replace(/_/g, ' ');
    }
  };

  const paymentText = formatPayment(rawPaymentMethod);
  const amountInWords = grandTotal > 0 ? numberToWordsINR(grandTotal) : '';

  const businessName = business?.business_name || business?.name || 'VEXA Store';
  const businessAddress = business?.address || '';
  const businessPhone = business?.phone || user?.phone || '';
  const businessGstin = business?.gstin || '';
  const customerName = sale?.customer?.name || sale?.customer_name || 'Walk-in Customer';

  const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || item.qty || 0), 0);

  return (
    <div className="thermal-invoice-wrapper w-[80mm] min-h-auto bg-white text-black p-2 mx-auto text-[10px] font-mono leading-tight box-border border border-gray-200 shadow-xs">
      <style jsx global>{`
        @page {
          size: 80mm auto;
          margin: 0;
        }
        @media print {
          html, body {
            width: 80mm;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .thermal-invoice-wrapper {
            width: 80mm !important;
            padding: 2mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="text-center pb-1">
        <h1 className="text-xs font-black uppercase tracking-wider">{businessName}</h1>
        {businessAddress && <p className="text-[9px] mt-0.5">{businessAddress}</p>}
        {businessPhone && <p className="text-[9px]">Ph: {businessPhone}</p>}
        {businessGstin && <p className="text-[9px] font-bold">GSTIN: {businessGstin}</p>}
      </div>

      <div className="border-t border-dashed border-black my-1" />

      {/* Invoice Meta */}
      <div className="space-y-0.5 text-[9.5px]">
        <div className="flex justify-between">
          <span className="font-bold">Bill No:</span>
          <span>{invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Date:</span>
          <span>{formatDate(invoiceDate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Customer:</span>
          <span className="truncate max-w-[130px]">{customerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Pay Mode:</span>
          <span>{paymentText}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-1" />

      {/* Item Table Header */}
      <div className="grid grid-cols-12 font-bold text-[9px] border-b border-black pb-0.5 uppercase">
        <span className="col-span-6">Item</span>
        <span className="col-span-2 text-center">Qty</span>
        <span className="col-span-2 text-right">Rate</span>
        <span className="col-span-2 text-right">Amt</span>
      </div>

      {/* Item Rows */}
      <div className="divide-y divide-gray-200 my-0.5">
        {items.map((item, idx) => {
          const pName = item.products?.name || item.product_name || item.name || 'Item';
          const qty = Number(item.quantity || item.qty || 1);
          const rate = Number(item.unitPrice || item.unit_price || item.price || 0);
          const amount = Number(item.total_amount || item.totalPrice || (qty * rate));
          const uniqueNo = item.unique_number || item.unique_no || item.uniqueNo || '';
          const color = item.color || item.color_name || '';
          const size = item.size || item.size_name || '';
          const variantStr = [color, size, uniqueNo && `#${uniqueNo}`].filter(Boolean).join('/');

          return (
            <div key={idx} className="py-1 text-[9.5px]">
              <div className="font-bold truncate">{pName}</div>
              {variantStr && <div className="text-[8.5px] text-gray-600">({variantStr})</div>}
              <div className="grid grid-cols-12 text-gray-900 mt-0.5">
                <span className="col-span-6 text-gray-500 text-[8.5px]">Item #{idx+1}</span>
                <span className="col-span-2 text-center font-bold">{qty}</span>
                <span className="col-span-2 text-right">{rate.toFixed(2)}</span>
                <span className="col-span-2 text-right font-bold">{amount.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-dashed border-black my-1" />

      {/* Totals Breakdown */}
      <div className="space-y-0.5 text-[9.5px]">
        <div className="flex justify-between">
          <span>Items / Total Qty:</span>
          <span className="font-bold">{items.length} / {totalQty}</span>
        </div>
        {subtotal !== grandTotal && (
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
        )}
        {tradeDiscount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-₹{tradeDiscount.toFixed(2)}</span>
          </div>
        )}
        {hasGst && (
          <div className="flex justify-between">
            <span>GST Tax:</span>
            <span>+₹{gstTotal.toFixed(2)}</span>
          </div>
        )}
        {lessAmount > 0 && (
          <div className="flex justify-between">
            <span>Less:</span>
            <span>-₹{lessAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-black pt-1 mt-1 flex justify-between text-xs font-black">
          <span>GRAND TOTAL:</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {amountInWords && (
        <div className="mt-1 pt-1 border-t border-dotted border-gray-400 text-[8.5px]">
          <span className="font-bold">Words: </span>{amountInWords}
        </div>
      )}

      {/* Footer Thank You */}
      <div className="text-center border-t border-dashed border-black mt-2 pt-1.5 text-[9px] font-bold">
        <p>*** THANK YOU! COME AGAIN ***</p>
        <p className="text-[8px] font-normal mt-0.5">VEXA Invoice System</p>
      </div>
    </div>
  );
}
