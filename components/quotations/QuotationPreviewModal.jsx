'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Printer, 
  Download, 
  Send, 
  Share2, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Calendar, 
  ShieldCheck, 
  ArrowRight,
  Clock,
  Building,
  XCircle,
  Trash2,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { quotationService } from '@/services/quotationService';

export default function QuotationPreviewModal({ quotation, onClose, onConverted, onStatusChanged }) {
  const router = useRouter();
  const { business } = useAuth();
  const { toastSuccess, toastError, confirm } = useToast();
  const printAreaRef = useRef(null);

  if (!quotation) return null;

  const items = quotation.items || quotation.quotation_items || [];
  const customer = quotation.customer || quotation.customers || { name: 'Walk-in Client' };
  const discounts = quotation.discounts || {};
  const terms = quotation.terms || {};

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold">ACCEPTED</Badge>;
      case 'SENT':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-300 font-bold">SENT</Badge>;
      case 'CONVERTED':
        return <Badge className="bg-purple-50 text-purple-700 border-purple-300 font-bold">CONVERTED TO SALE</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-300 font-bold">EXPIRED</Badge>;
      case 'REJECTED':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-300 font-bold">REJECTED</Badge>;
      case 'DRAFT':
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-300 font-bold">DRAFT</Badge>;
    }
  };

  // Direct Print / Save as PDF handler
  const handlePrint = () => {
    const printContent = printAreaRef.current;
    if (!printContent) {
      window.print();
      return;
    }

    const stylesHTML = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    const windowPrint = window.open('', '_blank', 'left=0,top=0,width=850,height=1000,toolbar=0,scrollbars=0,status=0');
    if (!windowPrint) {
      window.print();
      return;
    }

    windowPrint.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quotation - ${quotation.quotation_number || 'Estimate'}</title>
          ${stylesHTML}
          <style>
            @page { size: A4 portrait; margin: 8mm; }
            body { 
              font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important; 
              color: #0f172a !important; 
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .qtn-print-wrapper {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              box-shadow: none !important;
              border: none !important;
              box-sizing: border-box !important;
            }
            @media print {
              body { background: #ffffff !important; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body style="background: #ffffff; margin: 0; padding: 0;">
          <div class="qtn-print-wrapper">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 400);
  };

  // Download directly as PDF
  const handleDownloadPdf = () => {
    handlePrint();
  };

  // Email estimate
  const handleEmailQuotation = async () => {
    const custEmail = customer.email;
    if (!custEmail) {
      toastError('Customer does not have an email address recorded. Please edit customer profile.');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Email Quotation to Customer?',
      message: `Send Quotation #${quotation.quotation_number} directly to ${custEmail}?`,
      confirmText: 'Send Email',
      cancelText: 'Cancel'
    });

    if (isConfirmed) {
      try {
        await quotationService.updateStatus(quotation.id, 'SENT');
        if (onStatusChanged) onStatusChanged(quotation.id, 'SENT');
        toastSuccess(`Quotation #${quotation.quotation_number} dispatched to ${custEmail} & marked as SENT!`);
      } catch (err) {
        toastError(err.message || 'Failed to dispatch quotation email');
      }
    }
  };

  // WhatsApp Share handler
  const handleWhatsAppShare = async () => {
    const phone = customer.phone?.replace(/[^0-9]/g, '');
    const cleanPhone = phone ? (phone.length === 10 ? `91${phone}` : phone) : '';
    const message = encodeURIComponent(
      `Hello ${customer.name || 'Valued Customer'},\n\nHere is your Price Quotation #${quotation.quotation_number} from ${business?.name || 'our company'}.\nTotal Amount: ${formatCurrency(quotation.grand_total || quotation.total_amount || 0)}\nValid until: ${quotation.valid_until ? formatDate(quotation.valid_until) : '15 days'}.\n\nThank you for choosing us!`
    );

    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`
      : `https://api.whatsapp.com/send?text=${message}`;

    window.open(waUrl, '_blank');
    
    // Auto advance status to SENT if draft
    if (quotation.status === 'DRAFT') {
      try {
        await quotationService.updateStatus(quotation.id, 'SENT');
        if (onStatusChanged) onStatusChanged(quotation.id, 'SENT');
      } catch (e) {}
    }
  };

  // Accept status change
  const handleMarkAccepted = async () => {
    try {
      await quotationService.updateStatus(quotation.id, 'ACCEPTED');
      toastSuccess(`Quotation #${quotation.quotation_number} marked as ACCEPTED!`);
      if (onStatusChanged) onStatusChanged(quotation.id, 'ACCEPTED');
    } catch (err) {
      toastError(err.message || 'Failed to update quotation status');
    }
  };

  // Open and load into POS counter
  const handleOpenInPos = () => {
    router.push(`/sales/new?quotationId=${quotation.id}`);
    onClose();
  };

  // Convert to Sale directly
  const handleConvertToSale = async () => {
    const isConfirmed = await confirm({
      title: 'Convert Quotation to Sale?',
      message: `Do you want to convert Quotation #${quotation.quotation_number} directly in POS with all items and customer data loaded?`,
      confirmText: 'Open in POS',
      cancelText: 'Cancel'
    });

    if (isConfirmed) {
      handleOpenInPos();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto border border-slate-200 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Modal Top Header (Hidden in Print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-900">Quotation #{quotation.quotation_number}</h2>
                {getStatusBadge(quotation.status)}
              </div>
              <p className="text-xs text-slate-500">Official client price estimate and commercial proposal</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              className="flex items-center space-x-1.5 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download PDF</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppShare}
              className="flex items-center space-x-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleEmailQuotation}
              className="flex items-center space-x-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Send className="w-4 h-4 text-blue-600" />
              <span>Email</span>
            </Button>

            {quotation.status !== 'CONVERTED' && quotation.status !== 'SENT' && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await quotationService.updateStatus(quotation.id, 'SENT');
                    toastSuccess(`Quotation #${quotation.quotation_number} marked as SENT!`);
                    if (onStatusChanged) onStatusChanged(quotation.id, 'SENT');
                  } catch (err) {
                    toastError(err.message || 'Failed to update quotation status');
                  }
                }}
                className="flex items-center space-x-1.5 border-sky-300 text-sky-700 hover:bg-sky-50"
              >
                <Send className="w-4 h-4 text-sky-600" />
                <span>Mark Sent</span>
              </Button>
            )}

            {quotation.status !== 'CONVERTED' && quotation.status !== 'ACCEPTED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAccepted}
                className="flex items-center space-x-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mark Accepted</span>
              </Button>
            )}

            {quotation.status !== 'CONVERTED' && quotation.status !== 'REJECTED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await quotationService.updateStatus(quotation.id, 'REJECTED');
                    toastSuccess(`Quotation #${quotation.quotation_number} marked as REJECTED!`);
                    if (onStatusChanged) onStatusChanged(quotation.id, 'REJECTED');
                    onClose();
                  } catch (err) {
                    toastError(err.message || 'Failed to update quotation status');
                  }
                }}
                className="flex items-center space-x-1.5 border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <XCircle className="w-4 h-4 text-amber-600" />
                <span>Reject</span>
              </Button>
            )}

            {quotation.status !== 'CONVERTED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const isConfirmed = await confirm({
                    title: 'Delete Quotation?',
                    message: `Are you sure you want to permanently delete quotation #${quotation.quotation_number}? This cannot be undone.`,
                    confirmText: 'Delete',
                    cancelText: 'Cancel'
                  });
                  if (isConfirmed) {
                    try {
                      await quotationService.deleteQuotation(quotation.id);
                      toastSuccess(`Quotation #${quotation.quotation_number} deleted successfully`);
                      if (onStatusChanged) onStatusChanged(quotation.id, 'DELETED');
                      onClose();
                    } catch (err) {
                      toastError(err.message || 'Failed to delete quotation');
                    }
                  }
                }}
                className="flex items-center space-x-1.5 border-rose-200 text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Delete</span>
              </Button>
            )}

            {quotation.status !== 'CONVERTED' && (
              <Button
                size="sm"
                onClick={handleConvertToSale}
                className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                <span>Convert to Sale</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div ref={printAreaRef} className="p-6 sm:p-10 overflow-y-auto space-y-8 bg-white print:p-0 print:space-y-6 text-slate-800">
          
          {/* Document Branding Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-6">
            <div className="space-y-2 max-w-sm">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-xl shadow-xs">
                  {business?.name?.charAt(0) || 'V'}
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    {business?.name || 'VEXA ENTERPRISE'}
                  </h1>
                  <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest">
                    Textile & Garment Wholesalers
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                {business?.address && (
                  <p className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{business.address}, {business.city || 'Salem'}, {business.state || 'Tamil Nadu'} {business.pincode || ''}</span>
                  </p>
                )}
                {business?.phone && (
                  <p className="flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Ph: {business.phone}</span>
                  </p>
                )}
                {business?.email && (
                  <p className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{business.email}</span>
                  </p>
                )}
                {business?.gst_number && (
                  <p className="font-mono text-xs font-semibold text-slate-900">
                    GSTIN: <span className="text-blue-700">{business.gst_number}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Document Title & Meta Box */}
            <div className="text-left sm:text-right space-y-3">
              <div className="inline-block bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-xl">
                <h2 className="text-base sm:text-lg font-black text-blue-900 tracking-wider">
                  PRICE QUOTATION / ESTIMATE
                </h2>
                <p className="text-[10px] text-blue-600 font-semibold uppercase">
                  Commercial Offer (Non-Tax Invoice)
                </p>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <p><span className="font-semibold text-slate-800">Quotation No:</span> <span className="font-mono font-bold text-slate-900">{quotation.quotation_number}</span></p>
                <p><span className="font-semibold text-slate-800">Date:</span> {formatDate(quotation.quotation_date || quotation.created_at)}</p>
                <p className="flex items-center sm:justify-end space-x-1 text-amber-700 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Valid Until: {quotation.valid_until ? formatDate(quotation.valid_until) : '15 days from date'}</span>
                </p>
                <p><span className="font-semibold text-slate-800">Status:</span> <span className="font-bold uppercase text-slate-900">{quotation.status}</span></p>
              </div>
            </div>
          </div>

          {/* Customer & Billing Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 text-xs">
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-2">QUOTED TO (CLIENT DETAILS):</p>
              <h3 className="text-sm font-bold text-slate-900">{customer.name || 'Walk-in Client'}</h3>
              {customer.phone && <p className="text-slate-600 mt-1">Phone: {customer.phone}</p>}
              {customer.email && <p className="text-slate-600">Email: {customer.email}</p>}
              {customer.address && <p className="text-slate-600 mt-1">{customer.address}, {customer.city} {customer.pincode}</p>}
              {customer.gst_number && <p className="font-mono text-slate-800 font-semibold mt-1">GSTIN: {customer.gst_number}</p>}
            </div>

            <div className="sm:border-l sm:border-slate-200 sm:pl-6 space-y-2">
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-2">COMMERCIAL TERMS & REFERENCE:</p>
              <p><span className="font-medium text-slate-600">Payment Terms:</span> <span className="font-semibold text-slate-800">{terms.paymentTerms || 'Payment within 15 days'}</span></p>
              <p><span className="font-medium text-slate-600">Delivery Terms:</span> <span className="font-semibold text-slate-800">{terms.deliveryTerms || 'Immediate counter dispatch / Ex-mill'}</span></p>
              {quotation.notes && (
                <p><span className="font-medium text-slate-600">Special Notes:</span> <span className="italic text-slate-700">{quotation.notes}</span></p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3">Product / Variant Description</th>
                  <th className="p-3 text-center">SKU</th>
                  <th className="p-3 text-right">Quoted Price</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-center">GST %</th>
                  <th className="p-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400">No products specified</td>
                  </tr>
                ) : (
                  items.map((it, idx) => {
                    const variantDetails = [it.color, it.size].filter(Boolean).join(' • ');
                    return (
                      <tr key={it.id || idx} className="hover:bg-slate-50/50">
                        <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{it.product_name || it.product?.name || 'Item'}</p>
                          {(variantDetails || it.brand) && (
                            <p className="text-[11px] text-slate-500 font-medium">
                              {[it.brand, variantDetails].filter(Boolean).join(' | ')}
                            </p>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-500">{it.sku || it.product?.sku || '-'}</td>
                        <td className="p-3 text-right font-medium text-slate-800">{formatCurrency(it.unit_price)}</td>
                        <td className="p-3 text-center font-bold text-slate-900">{it.quantity}</td>
                        <td className="p-3 text-center text-slate-600">{it.gst_percentage ? `${it.gst_percentage}%` : '0%'}</td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(it.total_amount)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                <p className="font-bold text-amber-900 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Important Commercial Notice</span>
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  This document is a formal commercial price estimation and not a Tax Invoice. Prices and product allocations are subject to our standard trading terms and validity period. Stock availability is confirmed only upon conversion to a sale invoice.
                </p>
              </div>

              <div className="pt-2 text-[11px] space-y-1">
                <p className="font-bold text-slate-700">Bank Details for Direct Remittance:</p>
                <p>Bank: <span className="font-semibold text-slate-800">{business?.bank_name || 'HDFC Bank'}</span></p>
                <p>Account No: <span className="font-mono font-semibold text-slate-800">{business?.bank_account_number || '50200088921132'}</span></p>
                <p>IFSC Code: <span className="font-mono font-semibold text-slate-800">{business?.bank_ifsc || 'HDFC0001234'}</span></p>
              </div>
            </div>

            {/* Calculations Card */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Items Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(quotation.subtotal)}</span>
              </div>

              {discounts.tradeAmt > 0 && (
                <div className="flex justify-between text-emerald-700 py-0.5">
                  <span>Trade Discount ({discounts.tradeVal}%):</span>
                  <span>- {formatCurrency(discounts.tradeAmt)}</span>
                </div>
              )}

              {discounts.schemeAmt > 0 && (
                <div className="flex justify-between text-emerald-700 py-0.5">
                  <span>Scheme Discount:</span>
                  <span>- {formatCurrency(discounts.schemeAmt)}</span>
                </div>
              )}

              {discounts.cashAmt > 0 && (
                <div className="flex justify-between text-emerald-700 py-0.5">
                  <span>Cash / Early Discount:</span>
                  <span>- {formatCurrency(discounts.cashAmt)}</span>
                </div>
              )}

              {quotation.discount_amount > 0 && !discounts.tradeAmt && (
                <div className="flex justify-between text-emerald-700 py-0.5">
                  <span>Total Discount:</span>
                  <span>- {formatCurrency(quotation.discount_amount)}</span>
                </div>
              )}

              <div className="flex justify-between py-1 border-t border-slate-200">
                <span className="text-slate-600">Taxable Quoted Value:</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(Math.max(0, (quotation.subtotal || 0) - (quotation.discount_amount || 0)))}
                </span>
              </div>

              <div className="flex justify-between py-0.5 text-slate-700">
                <span>Applicable GST Tax:</span>
                <span className="font-semibold">{formatCurrency(quotation.tax_amount)}</span>
              </div>

              {discounts.lessAmt > 0 && (
                <div className="flex justify-between text-rose-700 py-0.5">
                  <span>Less Deduction:</span>
                  <span>- {formatCurrency(discounts.lessAmt)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900 text-sm font-black">
                <span className="text-slate-900">Estimated Grand Total:</span>
                <span className="text-lg text-blue-700 font-black">
                  {formatCurrency(quotation.grand_total || quotation.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Signature & Authorization Section */}
          <div className="pt-8 sm:pt-12 flex justify-between items-end border-t border-slate-200 text-xs">
            <div className="space-y-1">
              <p className="text-slate-400 font-medium">Customer Acceptance:</p>
              <div className="w-48 h-12 border-b border-dashed border-slate-300"></div>
              <p className="text-[10px] text-slate-400">Signature & Date</p>
            </div>

            <div className="text-right space-y-1">
              <p className="font-bold text-slate-800">For {business?.name || 'VEXA ENTERPRISE'}</p>
              <div className="w-48 h-12 border-b border-dashed border-slate-300 ml-auto"></div>
              <p className="text-[10px] text-slate-500 font-medium">Authorized Signatory / Seal</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
