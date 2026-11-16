'use client';

import React, { useRef } from 'react';
import { Printer, Download, CheckCircle2, Phone, Mail, Globe, MapPin, QrCode, RotateCcw, MessageSquare, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { salesService } from '@/services/salesService';
import { getTemplateComponent } from './templates';

// Helper to convert number to words (Indian Rupees)
function numberToWordsINR(num) {
  if (isNaN(num) || num <= 0) return 'Zero Only';
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

  return str.trim() + ' Only';
}

export default function InvoicePrintTemplate({ sale: initialSale, onClose }) {
  const { business, user } = useAuth();
  const { toastSuccess, toastError, confirm } = useToast();
  const printRef = useRef(null);
  const [isSendingEmail, setIsSendingEmail] = React.useState(false);
  const [isRetryingWhatsApp, setIsRetryingWhatsApp] = React.useState(false);
  const [whatsAppStatus, setWhatsAppStatus] = React.useState(null);
  const [sale, setSale] = React.useState(initialSale);

  const fetchWhatsAppStatus = React.useCallback((saleId) => {
    if (!saleId) return;
    salesService.getSaleWhatsAppStatus(saleId).then(res => {
      const msg = res?.data?.receiptMessage;
      if (msg) {
        setWhatsAppStatus(msg.status || 'SENT');
      }
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    setSale(initialSale);
    if (initialSale?.id) {
      salesService.getSaleById(initialSale.id).then((res) => {
        const fullData = res.data || res.sale || res;
        if (fullData && (fullData.items || fullData.sale_items)) {
          setSale(prev => ({ ...prev, ...fullData }));
        }
      }).catch(err => {
        console.warn('Could not fetch full sale details for print:', err);
      });
      fetchWhatsAppStatus(initialSale.id);
    }
  }, [initialSale, fetchWhatsAppStatus]);

  if (!sale) return null;

  const handleRetryWhatsApp = async () => {
    const custPhone = sale.customer?.phone || sale.customer_phone;
    if (!custPhone) {
      toastError('Customer does not have a valid mobile number recorded');
      return;
    }

    setIsRetryingWhatsApp(true);
    try {
      const res = await salesService.retryWhatsAppReceipt(sale.id);
      if (res?.data?.success) {
        toastSuccess(`WhatsApp order receipt sent with PDF to ${custPhone}!`);
        setWhatsAppStatus('SENT');
      } else {
        toastError(res?.data?.error || 'Failed to send WhatsApp receipt');
      }
    } catch (err) {
      toastError(err?.response?.data?.message || err.message || 'WhatsApp delivery error');
    } finally {
      setIsRetryingWhatsApp(false);
    }
  };

  const handleEmailInvoice = async () => {
    const custEmail = sale.customer?.email;
    if (!custEmail) {
      toastError('Customer does not have an email address recorded');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Email Invoice to Customer?',
      message: `Send invoice ${sale.invoiceNumber || sale.invoice_number} to ${custEmail}?`,
      confirmText: 'Send Email',
      cancelText: 'Cancel'
    });

    if (isConfirmed) {
      setIsSendingEmail(true);
      try {
        await emailService.resendSaleInvoice(sale.id);
        toastSuccess(`Invoice email sent successfully to ${custEmail}`);
      } catch (err) {
        toastError(err.message || 'Failed to send invoice email');
      } finally {
        setIsSendingEmail(false);
      }
    }
  };

  const items = sale.items || sale.saleItems || sale.sale_items || [];
  
  // Calculate exact totals matching tax breakdown
  const subtotal = items.reduce((sum, item) => sum + (Number(item.unitPrice || item.unit_price || 0) * Number(item.quantity || 0)), 0);
  const discountVal = Number(sale.discountAmount || sale.discount_amount || 0);

  // Parse discount breakdown
  let tradeDiscount = sale.tradeDiscount || 0;
  let schemeDiscount = sale.schemeDiscount || 0;
  let cashDiscount = sale.cashDiscount || 0;
  let lessAmount = sale.lessAmount || 0;

  if (sale.notes && sale.notes.includes('DISCOUNTS:')) {
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
  
  // Tax calculations (assuming 50-50 split CGST/SGST if intra-state)
  const gstTotal = items.reduce((acc, item) => {
    const itemTotal = Number(item.unitPrice || item.unit_price || 0) * Number(item.quantity || 0);
    const rate = Number(item.gst_percentage || item.taxRate || 0);
    return acc + (itemTotal * (rate / 100));
  }, 0);

  const halfGst = gstTotal / 2;
  const hasGst = gstTotal > 0 || items.some(item => Number(item.gst_percentage || item.tax_rate || item.taxRate || 0) > 0);
  const grandTotal = Number(sale.totalAmount || sale.total_amount || sale.grand_total || (taxableAmount + gstTotal - lessAmount));
  const paidAmount = Number(sale.paidAmount || sale.paid_amount || grandTotal);
  const balanceDue = Math.max(0, grandTotal - paidAmount);

  const invoiceNumber = sale.invoiceNumber || sale.invoice_number || 'INV-2026-00101';
  const isReturned = sale.status === 'RETURNED' || sale.is_return || Boolean(sale.notes?.toLowerCase().includes('return'));
  const invoiceDate = sale.createdAt || sale.created_at || sale.invoice_date || new Date().toISOString();
  const dueDate = sale.dueDate || sale.due_date || new Date(new Date(invoiceDate).getTime() + 15 * 86400000).toISOString();

  const rawPaymentMethod = 
    sale.paymentMethod || 
    sale.payment_method || 
    sale.paymentMode || 
    sale.payment_mode || 
    sale.payment_terms || 
    sale.paymentTerms || 
    (sale.sale_payments && sale.sale_payments[0]?.payment_method) || 
    (sale.salePayments && sale.salePayments[0]?.paymentMethod) || 
    (sale.payments && sale.payments[0]?.payment_method) || 
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
  const amountInWords = numberToWordsINR(grandTotal);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    // Collect all stylesheets from main document (including Tailwind CSS)
    const stylesHTML = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    const windowPrint = window.open('', '_blank', 'left=0,top=0,width=850,height=1000,toolbar=0,scrollbars=0,status=0');
    if (!windowPrint) return;

    const templateId = business?.invoice_template || 'DEFAULT_A4';
    let pageCss = '@page { size: A4 portrait; margin: 0; }';
    let wrapperCss = '.inv-print-wrapper { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 8mm !important; background: #ffffff !important; box-shadow: none !important; border: none !important; box-sizing: border-box !important; }';

    if (templateId === 'A5_CUSTOMER_SHOP_COPY') {
      pageCss = '@page { size: A5 portrait; margin: 0; }';
      wrapperCss = '.inv-print-wrapper { width: 148mm !important; height: 210mm !important; max-width: 148mm !important; max-height: 210mm !important; margin: 0 auto !important; background: #ffffff !important; box-shadow: none !important; border: none !important; box-sizing: border-box !important; overflow: hidden !important; }';
    } else if (templateId === 'THERMAL_80MM') {
      pageCss = '@page { size: 80mm auto; margin: 0; }';
      wrapperCss = '.inv-print-wrapper { width: 80mm !important; margin: 0 auto !important; background: #ffffff !important; box-shadow: none !important; border: none !important; }';
    }

    windowPrint.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoiceNumber}</title>
          ${stylesHTML}
          <style>
            ${pageCss}
            body { 
              font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important; 
              color: #0f172a !important; 
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            img {
              max-height: 48px !important;
              max-width: 180px !important;
              object-fit: contain !important;
            }
            ${wrapperCss}
            @media print {
              body { background: #ffffff !important; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body style="background: #ffffff; margin: 0; padding: 0;">
          <div class="inv-print-wrapper">
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

  const businessName = business?.business_name || business?.name || 'Sai textiles';
  const businessAddress = business?.address || '123, West Masi Street, Madurai - 625001, Tamil Nadu, India';
  const businessPhone = business?.phone || user?.phone || '+91 98765 43210';
  const businessEmail = user?.email || business?.email || 'saitextiles@gmail.com';
  const businessWebsite = business?.website || 'www.saitextiles.in';
  const businessGstin = business?.gstin || '33ABCDE1234F1Z5';

  const customerName = sale.customer?.name || (sale.customer_name ? sale.customer_name : 'Walk-in Customer');
  const customerPhone = sale.customer?.phone || sale.customer_phone || '';
  const customerEmail = sale.customer?.email || sale.customer_email || '';
  const customerAddress = sale.customer?.address || sale.customer_address || 'Counter Cash Sale';
  const customerGstin = sale.customer?.gstin || sale.customer?.gst_number || sale.customer_gstin || '';

  const SelectedTemplateComponent = getTemplateComponent(business?.invoice_template);

  return (
    <div className="space-y-4">
      {/* Print Action Header - Modern Light Theme & Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/40 border border-slate-200/90 rounded-2xl shadow-xs gap-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
          <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <span className="text-slate-900 font-extrabold block sm:inline">GST Invoice Ready</span>
            <span className="text-[11px] font-semibold text-slate-500 sm:ml-1.5 block sm:inline font-mono">
              ({business?.invoice_template || 'DEFAULT_A4'})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* WhatsApp Order Receipt Action */}
          <button
            type="button"
            onClick={handleRetryWhatsApp}
            disabled={isRetryingWhatsApp}
            title="Resend WhatsApp Order Receipt with Invoice PDF"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3.5 py-2 text-xs font-extrabold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-300 rounded-xl transition-all shadow-2xs disabled:opacity-50 active:scale-95"
          >
            {isRetryingWhatsApp ? (
              <RefreshCw className="w-4 h-4 mr-1.5 text-emerald-600 animate-spin" />
            ) : (
              <MessageSquare className="w-4 h-4 mr-1.5 text-emerald-600" />
            )}
            {isRetryingWhatsApp ? 'Sending...' : whatsAppStatus === 'SENT' ? 'WhatsApp Sent' : 'Send WhatsApp'}
          </button>

          {sale.customer?.email && (
            <button
              type="button"
              onClick={handleEmailInvoice}
              disabled={isSendingEmail}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3.5 py-2 text-xs font-extrabold text-blue-700 bg-white hover:bg-blue-50 active:bg-blue-100 border border-blue-200 rounded-xl transition-all shadow-2xs disabled:opacity-50 active:scale-95"
            >
              <Mail className="w-4 h-4 mr-1.5 text-blue-600" />
              {isSendingEmail ? 'Sending...' : 'Email Invoice'}
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-md shadow-blue-500/25 active:scale-95"
          >
            <Printer className="w-4 h-4 mr-1.5 text-white" />
            Print / Save PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-xl transition-all shadow-2xs active:scale-95"
          >
            Close
          </button>
        </div>
      </div>

      {/* Invoice Layout Container - Mobile Scrollable & Centered */}
      <div className="p-1 sm:p-2 overflow-x-auto max-w-full flex justify-center">
        <div ref={printRef} className="w-full max-w-full overflow-x-auto">
          {SelectedTemplateComponent ? (
            <SelectedTemplateComponent sale={sale} business={business} user={user} />
          ) : (
            <div className="w-full bg-white p-5 sm:p-8 border border-slate-200 rounded-2xl shadow-sm text-slate-800 text-[11px] font-sans">
          {/* Header Row */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center space-x-3 mb-1.5">
                {business?.logo ? (
                  <img src={business.logo} alt="Logo" className="h-10 w-auto object-contain" style={{ maxHeight: '40px', maxWidth: '160px', objectFit: 'contain' }} />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                    S
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-none">{businessName}</h1>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">QUALITY WEARS FOR EVERYONE</p>
                </div>
              </div>

              <div className="text-[10.5px] text-slate-600 space-y-0.5 font-medium pl-1">
                <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {businessAddress}</p>
                <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400 shrink-0" /> {businessPhone}</p>
                <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400 shrink-0" /> {businessEmail}</p>
              </div>


              <div className="flex gap-2 text-[9.5px] font-bold text-slate-600 uppercase tracking-widest mt-2.5 pt-1.5 border-t-2 border-slate-200">
                <span>GARMENTS</span> <span className="text-slate-300">|</span> 
                <span>TEXTILES</span> <span className="text-slate-300">|</span> 
                <span>WHOLESALE</span> <span className="text-slate-300">|</span> 
                <span>RETAIL</span>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end space-x-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-wider">INVOICE</h2>
                {isReturned && (
                  <span className="bg-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-md tracking-wider shadow-xs">
                    RETURNED
                  </span>
                )}
              </div>

              <table className="mt-2 text-[11px] text-left ml-auto border-separate border-spacing-y-1">
                <tbody>
                  <tr>
                    <td className="font-semibold text-slate-500 pr-3">Invoice No</td>
                    <td className="font-bold text-slate-900 pr-1">:</td>
                    <td className="font-bold text-slate-900">{invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-500 pr-3">Invoice Date</td>
                    <td className="font-bold text-slate-900 pr-1">:</td>
                    <td className="font-semibold text-slate-800">{formatDate(invoiceDate)}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-500 pr-3">Order No</td>
                    <td className="font-bold text-slate-900 pr-1">:</td>
                    <td className="font-semibold text-slate-800">{sale.orderNumber || sale.order_number || `ORD-${new Date().getFullYear()}-00001`}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-500 pr-3">Payment Mode</td>
                    <td className="font-bold text-slate-900 pr-1">:</td>
                    <td className="font-semibold text-slate-800">{paymentTermsText}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-500 pr-3">Due Date</td>
                    <td className="font-bold text-slate-900 pr-1">:</td>
                    <td className="font-semibold text-slate-800">{formatDate(dueDate)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* RETURNED BANNER IF RETURNED */}
          {isReturned && (
            <div className="my-3 p-3 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-center justify-between text-rose-900">
              <div className="flex items-center space-x-2.5">
                <RotateCcw className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-extrabold text-xs uppercase tracking-wide text-rose-900">THIS PRODUCT HAS BEEN RETURNED & INVENTORY RESTOCKED</p>
                  <p className="text-[10.5px] text-rose-700 font-medium">{sale.notes || 'Customer Return recorded and restocked to inventory.'}</p>
                </div>
              </div>
              <span className="text-[11px] font-black bg-rose-600 text-white px-2.5 py-1 rounded-md shrink-0">RETURNED</span>
            </div>
          )}

          {/* Single Billed To Customer Section */}
          <div className="my-4">
            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4">
              <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">BILLED TO CUSTOMER</h3>
              <h4 className="text-sm font-extrabold text-slate-900 mb-1">{customerName}</h4>
              <p className="text-[10.5px] text-slate-600 leading-relaxed font-medium">{customerAddress}</p>
              {customerPhone && <p className="text-[10.5px] text-slate-700 font-semibold mt-1">{customerPhone}</p>}
              {customerEmail && <p className="text-[10.5px] text-slate-600">{customerEmail}</p>}
              {customerGstin && <p className="text-[10.5px] font-bold text-slate-900 mt-1">GSTIN : {customerGstin}</p>}
            </div>
          </div>


          {/* Items Table */}
          <table className="w-full text-left border-collapse rounded-xl overflow-hidden my-3">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-3 w-8 text-center">#</th>
                <th className="py-2.5 px-3">Product Description</th>
                <th className="py-2.5 px-3 text-center">HSN</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                <th className="py-2.5 px-3 text-center">Discount (%)</th>
                {hasGst && <th className="py-2.5 px-3 text-center">GST (%)</th>}
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {items.map((item, idx) => {
                const productName = item.products?.name || item.product_name || item.product?.name || item.name || item.title || 'Product Item';
                const hsn = item.products?.hsn_code || item.hsn_code || item.hsnCode || item.hsn || '-';
                const qty = Number(item.quantity || item.qty || 1);
                const rate = Number(item.unitPrice || item.unit_price || item.price || 0);
                const totalItemAmount = Number(item.total_amount || item.totalPrice || (qty * rate));
                const gstRate = Number(item.gst_percentage || item.tax_rate || item.taxRate || item.products?.tax_rate || 0);
                const discountPerc = Number(item.discount_percentage || item.discountPercent || 0);

                const color = item.color || item.color_name || item.variant?.color || item.products?.color || '';
                const size = item.size || item.size_name || item.variant?.size || item.products?.size || '';
                const variantDetails = [color && `Color: ${color}`, size && `Size: ${size}`].filter(Boolean).join(' | ');

                return (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                    <td className="py-2.5 px-3 text-center font-medium text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{productName}</div>
                      {variantDetails ? (
                        <div className="text-[9.5px] text-slate-500 font-medium mt-0.5">{variantDetails}</div>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">{hsn}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">{qty} PCS</td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-800">{rate.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{discountPerc}%</td>
                    {hasGst && <td className="py-2.5 px-3 text-center font-medium text-slate-700">{gstRate}%</td>}
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{totalItemAmount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Bottom Grid: Words, Notes & Totals */}
          <div className="grid grid-cols-12 gap-4 mt-4 items-start">
            <div className="col-span-7 space-y-3">
              {/* Amount In Words Box */}
              <div className="bg-slate-50 border-l-4 border-indigo-500 p-3 rounded-r-xl">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block">Amount In Words</span>
                <p className="text-xs font-extrabold text-slate-900 capitalize mt-0.5">{amountInWords}</p>
              </div>

              {/* Terms & Notes */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                <h4 className="text-[11px] font-bold text-slate-900 mb-1.5 uppercase tracking-wider">
                  Notes
                </h4>
                <ol className="list-decimal pl-4 text-[10px] text-slate-600 space-y-1 font-medium">
                  <li>Goods once sold will not be taken back or exchanged.</li>
                  <li>Please make the payment within the credit period.</li>
                  <li>Subject to Madurai jurisdiction only.</li>
                  <li>Thank You for Your Business</li>
                </ol>
              </div>

            </div>

            {/* Subtotals & Tax Breakdown Table */}
            <div className="col-span-5 bg-white rounded-xl overflow-hidden border border-slate-100 text-[11px]">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="py-1.5 px-3 text-slate-600">Subtotal (₹)</td>
                    <td className="py-1.5 px-3 text-right font-bold text-slate-900">{subtotal.toFixed(2)}</td>
                  </tr>
                  {tradeDiscount > 0 && (
                    <tr>
                      <td className="py-1.5 px-3 text-slate-600">Trade Discount (₹)</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-rose-600">-{tradeDiscount.toFixed(2)}</td>
                    </tr>
                  )}
                  {schemeDiscount > 0 && (
                    <tr>
                      <td className="py-1.5 px-3 text-slate-600">Scheme Discount (₹)</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-rose-600">-{schemeDiscount.toFixed(2)}</td>
                    </tr>
                  )}
                  {cashDiscount > 0 && (
                    <tr>
                      <td className="py-1.5 px-3 text-slate-600">Cash Discount (₹)</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-rose-600">-{cashDiscount.toFixed(2)}</td>
                    </tr>
                  )}
                  {hasGst && (
                    <>
                      <tr className="bg-slate-50/50">
                        <td className="py-1.5 px-3 text-slate-700 font-semibold">Taxable Amount (₹)</td>
                        <td className="py-1.5 px-3 text-right font-bold text-slate-900">{taxableAmount.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 text-slate-600">CGST @ 2.5% (₹)</td>
                        <td className="py-1.5 px-3 text-right font-semibold text-slate-800">{halfGst.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 text-slate-600">SGST @ 2.5% (₹)</td>
                        <td className="py-1.5 px-3 text-right font-semibold text-slate-800">{halfGst.toFixed(2)}</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="py-1.5 px-3 text-slate-700 font-semibold">Total After GST (₹)</td>
                        <td className="py-1.5 px-3 text-right font-bold text-slate-900">{(taxableAmount + gstTotal).toFixed(2)}</td>
                      </tr>
                    </>
                  )}
                  {lessAmount > 0 && (
                    <tr>
                      <td className="py-1.5 px-3 text-slate-600">Less (After GST) (₹)</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-rose-600">-{lessAmount.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="bg-purple-50/80 text-purple-950 font-black text-xs">
                    <td className="py-2.5 px-3 text-purple-900">Grand Total (₹)</td>
                    <td className="py-2.5 px-3 text-right text-purple-900 text-sm font-extrabold">{grandTotal.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-emerald-50 text-emerald-900 font-bold">
                    <td className="py-1.5 px-3 text-emerald-800">Amount Paid (₹)</td>
                    <td className="py-1.5 px-3 text-right text-emerald-800">{paidAmount.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-rose-50 text-rose-900 font-bold">
                    <td className="py-1.5 px-3 text-rose-800">Balance Due (₹)</td>
                    <td className="py-1.5 px-3 text-right text-rose-800">{balanceDue.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sub-footer Branding */}
          <div className="text-center border-t border-slate-100 mt-6 pt-3 text-[9px] text-slate-400 font-medium">
            <span>VEXA INVOICE | Digital Billing System</span>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

