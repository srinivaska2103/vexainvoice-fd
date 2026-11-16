'use client';

import React from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';

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

function SingleCopy({ copyTitle, sale, business, user }) {
  const items = sale?.items || sale?.saleItems || sale?.sale_items || [];
  
  // Calculate exact totals matching tax breakdown
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

  const halfGst = gstTotal / 2;
  const hasGst = gstTotal > 0 || items.some(item => Number(item.gst_percentage || item.tax_rate || item.taxRate || 0) > 0);
  const grandTotal = Number(sale?.totalAmount || sale?.total_amount || sale?.grand_total || (taxableAmount + gstTotal - lessAmount));

  const invoiceNumber = sale?.invoiceNumber || sale?.invoice_number || '';
  const invoiceDate = sale?.createdAt || sale?.created_at || sale?.invoice_date || new Date().toISOString();
  
  const rawPaymentMethod = 
    sale?.paymentMethod || 
    sale?.payment_method || 
    sale?.paymentMode || 
    sale?.payment_mode || 
    sale?.payment_terms || 
    sale?.paymentTerms || 
    (sale?.sale_payments && sale.sale_payments[0]?.payment_method) || 
    (sale?.salePayments && sale.salePayments[0]?.paymentMethod) || 
    (sale?.payments && sale.payments[0]?.payment_method) || 
    null;

  const formatPaymentTerms = (pm) => {
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

  const paymentTermsText = formatPaymentTerms(rawPaymentMethod);
  const amountInWords = grandTotal > 0 ? numberToWordsINR(grandTotal) : '';

  const businessName = business?.business_name || business?.name || '';
  const businessAddress = business?.address || '';
  const businessCity = business?.city || '';
  const businessState = business?.state || '';
  const businessPin = business?.pin || business?.pincode || business?.zip || '';
  const fullCityStatePin = [businessCity, businessState, businessPin].filter(Boolean).join(', ');
  const businessPhone = business?.phone || user?.phone || '';
  const businessGstin = business?.gstin || '';
  const businessLogo = business?.logo || '';

  const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || item.qty || 0), 0);

  return (
    <div className="flex-1 flex flex-col justify-between text-black text-[9.5px] leading-tight font-sans px-1 py-1">
      {/* Top Banner / Copy Title */}
      <div className="flex justify-between items-center border-b border-black pb-0.5 mb-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-black">{copyTitle}</span>
        {businessGstin && <span className="text-[8.5px] font-semibold">GSTIN: {businessGstin}</span>}
      </div>

      {/* Header Info */}
      <div className="flex justify-between items-start mb-1.5 gap-2">
        {/* Left Side: Logo & Business Details */}
        <div className="flex items-start gap-1.5 max-w-[60%]">
          {businessLogo && (
            <img src={businessLogo} alt="Logo" className="h-7 w-auto object-contain shrink-0" style={{ maxHeight: '28px', maxWidth: '80px' }} />
          )}
          <div>
            {businessName && <h1 className="text-xs font-black uppercase text-black leading-none">{businessName}</h1>}
            {businessAddress && <p className="text-[8.5px] text-gray-800 font-normal mt-0.5 leading-snug">{businessAddress}</p>}
            {fullCityStatePin && <p className="text-[8.5px] text-gray-800 font-normal leading-snug">{fullCityStatePin}</p>}
            {businessPhone && <p className="text-[8.5px] text-gray-800 font-medium">Ph: {businessPhone}</p>}
          </div>
        </div>

        {/* Right Side: Invoice Info */}
        <div className="text-right text-[9px] shrink-0">
          <table className="ml-auto text-left border-collapse">
            <tbody>
              {invoiceNumber && (
                <tr>
                  <td className="font-bold text-gray-700 pr-1.5">Bill No / Inv:</td>
                  <td className="font-black text-black">{invoiceNumber}</td>
                </tr>
              )}
              {invoiceDate && (
                <tr>
                  <td className="font-bold text-gray-700 pr-1.5">Date:</td>
                  <td className="font-semibold text-black">{formatDate(invoiceDate)}</td>
                </tr>
              )}
              <tr>
                <td className="font-bold text-gray-700 pr-1.5">Pay Mode:</td>
                <td className="font-semibold text-black">{paymentTermsText}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-1 my-0.5">
        <table className="w-full text-left border-collapse border border-black text-[9px]">
          <thead>
            <tr className="bg-gray-100 text-black font-black border-b border-black uppercase text-[8.5px]">
              <th className="py-0.5 px-1 border-r border-black w-12 text-right">Rate</th>
              <th className="py-0.5 px-1.5 border-r border-black">Particulars</th>
              <th className="py-0.5 px-1 border-r border-black w-10 text-center">Qty</th>
              <th className="py-0.5 px-1 text-right w-16">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {items.map((item, idx) => {
              const productName = item.products?.name || item.product_name || item.product?.name || item.name || item.title || 'Item';
              const uniqueNo = item.unique_number || item.unique_no || item.uniqueNo || item.products?.unique_number || '';
              const brand = item.brand || item.brand_name || item.products?.brand || '';
              const color = item.color || item.color_name || item.variant?.color || item.products?.color || '';
              const size = item.size || item.size_name || item.variant?.size || item.products?.size || '';
              const variantDetails = [brand, color, size, uniqueNo && `#${uniqueNo}`].filter(Boolean).join(' / ');

              const qty = Number(item.quantity || item.qty || 1);
              const rate = Number(item.unitPrice || item.unit_price || item.price || 0);
              const amount = Number(item.total_amount || item.totalPrice || (qty * rate));

              return (
                <tr key={idx} className="align-top">
                  <td className="py-0.5 px-1 border-r border-black text-right font-medium">{rate > 0 ? rate.toFixed(2) : '-'}</td>
                  <td className="py-0.5 px-1.5 border-r border-black">
                    <span className="font-bold text-black">{productName}</span>
                    {variantDetails ? <span className="text-[8px] text-gray-600 ml-1">({variantDetails})</span> : null}
                  </td>
                  <td className="py-0.5 px-1 border-r border-black text-center font-bold">{qty}</td>
                  <td className="py-0.5 px-1 text-right font-black">{amount.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals & Footer Section */}
      <div className="mt-1 pt-1 border-t border-black">
        <div className="flex justify-between items-end text-[9px]">
          {/* Left Column: Count & Words */}
          <div className="max-w-[55%] space-y-0.5">
            <p className="font-bold text-black">Total Items: <span className="font-black">{items.length}</span> (Qty: {totalQty})</p>
            {amountInWords && (
              <p className="text-[8.5px] font-semibold text-gray-900 leading-tight">
                <span className="font-bold uppercase text-[8px] text-gray-700">In Words: </span>{amountInWords}
              </p>
            )}
          </div>

          {/* Right Column: Breakdown & Grand Total */}
          <div className="text-right min-w-[120px]">
            {subtotal !== grandTotal && (
              <div className="flex justify-between text-[8.5px] text-gray-700">
                <span>Subtotal:</span>
                <span className="font-semibold">{subtotal.toFixed(2)}</span>
              </div>
            )}
            {tradeDiscount > 0 && (
              <div className="flex justify-between text-[8.5px] text-gray-700">
                <span>Discount:</span>
                <span className="font-semibold">-{tradeDiscount.toFixed(2)}</span>
              </div>
            )}
            {hasGst && (
              <div className="flex justify-between text-[8.5px] text-gray-700">
                <span>GST Tax:</span>
                <span className="font-semibold">+{gstTotal.toFixed(2)}</span>
              </div>
            )}
            {lessAmount > 0 && (
              <div className="flex justify-between text-[8.5px] text-gray-700">
                <span>Less:</span>
                <span className="font-semibold">-{lessAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] font-black text-black border-t border-black pt-0.5 mt-0.5">
              <span>Grand Total:</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function A5CustomerShopCopy({ sale, business, user }) {
  return (
    <div className="a5-invoice-wrapper w-[148mm] max-w-full h-[210mm] max-h-none overflow-hidden bg-white text-black p-3 mx-auto flex flex-col justify-between box-border shadow-xs border border-slate-200/80 rounded-xl sm:rounded-none shrink-0">
      <style jsx global>{`
        @page {
          size: A5 portrait;
          margin: 0;
        }
        @media print {
          html, body {
            width: 148mm;
            height: 210mm;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .a5-invoice-wrapper {
            width: 148mm !important;
            height: 210mm !important;
            padding: 4mm !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* TOP HALF: CUSTOMER COPY */}
      <div className="h-[48%] flex flex-col">
        <SingleCopy copyTitle="CUSTOMER COPY" sale={sale} business={business} user={user} />
      </div>

      {/* MIDDLE: CUT LINE */}
      <div className="my-1.5 flex items-center justify-center relative">
        <div className="w-full border-t border-dashed border-gray-400"></div>
        <span className="absolute bg-white px-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
          ✂ CUT HERE
        </span>
      </div>

      {/* BOTTOM HALF: SHOP OWNER COPY */}
      <div className="h-[48%] flex flex-col">
        <SingleCopy copyTitle="SHOP OWNER COPY" sale={sale} business={business} user={user} />
      </div>
    </div>
  );
}
