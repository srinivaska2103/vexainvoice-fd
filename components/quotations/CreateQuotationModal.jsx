'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Trash2, 
  User, 
  UserPlus, 
  Building, 
  Calendar, 
  FileText, 
  Sparkles, 
  Percent, 
  Tag, 
  Boxes,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { productService } from '@/services/productService';
import { customerService } from '@/services/customerService';
import { quotationService } from '@/services/quotationService';

export default function CreateQuotationModal({ isOpen, onClose, onCreated, initialQuotation = null }) {
  const { toastSuccess, toastError } = useToast();

  const isEditing = Boolean(initialQuotation && initialQuotation.id);

  // Form State
  const [quotationNumber, setQuotationNumber] = useState('');
  const [quotationDate, setQuotationDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [applyGst, setApplyGst] = useState(true);
  const [paymentTerms, setPaymentTerms] = useState('Payment within 15 days of invoice date');
  const [deliveryTerms, setDeliveryTerms] = useState('Ex-mill / Immediate counter dispatch');
  const [notes, setNotes] = useState('');

  // Customer State
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // Inline Quick Add Customer Modal
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    customer_type: 'RETAIL',
    gst_number: '',
    address: '',
    city: 'Salem',
    state: 'Tamil Nadu',
    pincode: ''
  });

  // Product Catalog & Line Items
  const [products, setProducts] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [lineItems, setLineItems] = useState([]);

  // Multi-tier Discounts
  const [tradeDiscountType, setTradeDiscountType] = useState('PERCENT');
  const [tradeDiscountValue, setTradeDiscountValue] = useState('0');
  const [schemeDiscountType, setSchemeDiscountType] = useState('PERCENT');
  const [schemeDiscountValue, setSchemeDiscountValue] = useState('0');
  const [cashDiscountType, setCashDiscountType] = useState('PERCENT');
  const [cashDiscountValue, setCashDiscountValue] = useState('0');
  const [lessValue, setLessValue] = useState('0');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load products and customers on mount
  useEffect(() => {
    if (!isOpen) return;

    async function loadCatalog() {
      try {
        const [prodRes, custRes] = await Promise.all([
          productService.getProducts(),
          customerService.getCustomers()
        ]);
        setProducts(prodRes.data || prodRes || []);
        setCustomers(custRes.data || custRes.customers || custRes || []);
      } catch (err) {
        console.error('Failed to load catalog for quotation:', err);
      }
    }

    loadCatalog();
  }, [isOpen]);

  // Prepopulate if editing
  useEffect(() => {
    if (initialQuotation && isOpen) {
      setQuotationNumber(initialQuotation.quotation_number || '');
      setQuotationDate(
        initialQuotation.quotation_date
          ? new Date(initialQuotation.quotation_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setValidUntil(
        initialQuotation.valid_until
          ? new Date(initialQuotation.valid_until).toISOString().split('T')[0]
          : ''
      );
      setNotes(initialQuotation.notes || '');

      if (initialQuotation.customer || initialQuotation.customers) {
        const c = initialQuotation.customer || initialQuotation.customers;
        setSelectedCustomer(c);
        setCustomerSearchQuery(c.name || '');
      }

      if (initialQuotation.terms) {
        setPaymentTerms(initialQuotation.terms.paymentTerms || 'Payment within 15 days');
        setDeliveryTerms(initialQuotation.terms.deliveryTerms || 'Immediate counter dispatch');
      }

      if (initialQuotation.discounts) {
        setTradeDiscountValue(String(initialQuotation.discounts.tradeVal || 0));
        setTradeDiscountType(initialQuotation.discounts.tradeType || 'PERCENT');
        setSchemeDiscountValue(String(initialQuotation.discounts.schemeVal || 0));
        setSchemeDiscountType(initialQuotation.discounts.schemeType || 'PERCENT');
        setCashDiscountValue(String(initialQuotation.discounts.cashVal || 0));
        setCashDiscountType(initialQuotation.discounts.cashType || 'PERCENT');
        setLessValue(String(initialQuotation.discounts.lessAmt || 0));
        if (initialQuotation.discounts.applyGst !== undefined) {
          setApplyGst(initialQuotation.discounts.applyGst);
        }
      }

      const qItems = initialQuotation.items || initialQuotation.quotation_items || [];
      setLineItems(
        qItems.map((it) => ({
          cartKey: it.variant_id ? `${it.product_id}-${it.variant_id}` : it.product_id,
          productId: it.product_id,
          variantId: it.variant_id || null,
          productName: it.product_name || it.product?.name || 'Item',
          brand: it.brand || it.product?.brands?.name || '',
          color: it.color || it.variant?.colors?.name || '',
          size: it.size || it.variant?.sizes?.name || '',
          sku: it.sku || it.product?.sku || '-',
          quantity: Number(it.quantity || 1),
          unitPrice: Number(it.unit_price || 0),
          gstPercentage: Number(it.gst_percentage || 5)
        }))
      );
    } else if (isOpen) {
      // Reset for New
      setQuotationNumber('');
      setQuotationDate(new Date().toISOString().split('T')[0]);
      const d = new Date();
      d.setDate(d.getDate() + 15);
      setValidUntil(d.toISOString().split('T')[0]);
      setSelectedCustomer(null);
      setCustomerSearchQuery('');
      setLineItems([]);
      setTradeDiscountValue('0');
      setSchemeDiscountValue('0');
      setCashDiscountValue('0');
      setLessValue('0');
      setNotes('');
    }
  }, [initialQuotation, isOpen]);

  // Customer Filtering
  const filteredCustomers = customers.filter((c) => {
    const q = customerSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.customer_code || '').toLowerCase().includes(q)
    );
  });

  // Product Filtering
  const filteredProducts = products.filter((p) => {
    const q = productSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.barcode || '').includes(q)
    );
  });

  // Add Product to Quotation
  const handleSelectProduct = (product, variant = null) => {
    const cartKey = variant ? `${product.id}-${variant.id}` : product.id;
    const existingIndex = lineItems.findIndex((it) => it.cartKey === cartKey);

    const price = variant
      ? Number(variant.retail_price || variant.retailPrice || product.retail_price || product.retailPrice || 0)
      : Number(product.retail_price || product.retailPrice || 0);

    const colorName = variant?.colors?.name || variant?.color || '';
    const sizeName = variant?.sizes?.name || variant?.size || '';

    if (existingIndex > -1) {
      const updated = [...lineItems];
      updated[existingIndex].quantity += 1;
      setLineItems(updated);
    } else {
      setLineItems([
        ...lineItems,
        {
          cartKey,
          productId: product.id,
          variantId: variant ? variant.id : null,
          productName: product.name,
          brand: product.brands?.name || '',
          color: colorName,
          size: sizeName,
          sku: variant?.sku || product.sku || '-',
          quantity: 1,
          unitPrice: price,
          gstPercentage: Number(product.gst_percentage || 5)
        }
      ]);
    }

    setIsProductDropdownOpen(false);
    setProductSearchQuery('');
  };

  // Modify line item
  const handleUpdateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const handleRemoveLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Quick Customer Creation
  const handleCreateCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim()) {
      toastError('Customer name is required');
      return;
    }

    setIsSavingCustomer(true);
    try {
      const created = await customerService.createCustomer({
        ...newCustomerForm,
        opening_balance: 0
      });
      toastSuccess(`Customer ${created.name} created successfully!`);
      setCustomers([created, ...customers]);
      setSelectedCustomer(created);
      setCustomerSearchQuery(created.name);
      setIsNewCustomerModalOpen(false);
      setNewCustomerForm({
        name: '',
        phone: '',
        email: '',
        customer_type: 'RETAIL',
        gst_number: '',
        address: '',
        city: 'Salem',
        state: 'Tamil Nadu',
        pincode: ''
      });
    } catch (err) {
      toastError(err.message || 'Failed to create customer');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // Calculations
  const subtotal = lineItems.reduce((acc, it) => acc + (Number(it.unitPrice || 0) * Number(it.quantity || 1)), 0);

  // 1. Trade Discount
  const tradeVal = parseFloat(tradeDiscountValue || 0);
  const tradeAmt = tradeDiscountType === 'PERCENT' ? subtotal * (tradeVal / 100) : tradeVal;
  const remAfterTrade = Math.max(0, subtotal - tradeAmt);

  // 2. Scheme Discount
  const schemeVal = parseFloat(schemeDiscountValue || 0);
  const schemeAmt = schemeDiscountType === 'PERCENT' ? remAfterTrade * (schemeVal / 100) : schemeVal;
  const remAfterScheme = Math.max(0, remAfterTrade - schemeAmt);

  // 3. Cash Discount
  const cashVal = parseFloat(cashDiscountValue || 0);
  const cashAmt = cashDiscountType === 'PERCENT' ? remAfterScheme * (cashVal / 100) : cashVal;

  const totalPreGstDiscount = tradeAmt + schemeAmt + cashAmt;
  const taxableAmount = Math.max(0, subtotal - totalPreGstDiscount);

  // GST Calculation
  const taxTotal = applyGst
    ? lineItems.reduce((acc, it) => {
        const itemSub = Number(it.unitPrice || 0) * Number(it.quantity || 1);
        const itemTaxable = subtotal > 0 ? (itemSub / subtotal) * taxableAmount : 0;
        return acc + itemTaxable * (Number(it.gstPercentage || 0) / 100);
      }, 0)
    : 0;

  const lessAmt = parseFloat(lessValue || 0);
  const rawGrandTotal = Math.max(0, taxableAmount + taxTotal - lessAmt);
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = (grandTotal - rawGrandTotal).toFixed(2);

  // Submit Quotation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lineItems.length === 0) {
      toastError('Please add at least one line item to the quotation');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        quotation_number: quotationNumber.trim() || undefined,
        quotation_date: quotationDate,
        valid_until: validUntil || undefined,
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        customer_snapshot: selectedCustomer
          ? {
              name: selectedCustomer.name,
              phone: selectedCustomer.phone,
              email: selectedCustomer.email,
              address: selectedCustomer.address,
              gstin: selectedCustomer.gst_number
            }
          : null,
        apply_gst: applyGst,
        payment_terms: paymentTerms,
        delivery_terms: deliveryTerms,
        notes: notes.trim(),
        trade_discount_type: tradeDiscountType,
        trade_discount_value: tradeVal,
        scheme_discount_type: schemeDiscountType,
        scheme_discount_value: schemeVal,
        cash_discount_type: cashDiscountType,
        cash_discount_value: cashVal,
        less_amount: lessAmt,
        round_off: parseFloat(roundOff),
        items: lineItems.map((it) => ({
          product_id: it.productId,
          variant_id: it.variantId || undefined,
          product_name: it.productName,
          quantity: Number(it.quantity),
          unit_price: Number(it.unitPrice),
          gst_percentage: applyGst ? Number(it.gstPercentage) : 0
        }))
      };

      let result;
      if (isEditing) {
        result = await quotationService.updateQuotation(initialQuotation.id, payload);
        toastSuccess(`Quotation #${result.quotation_number || quotationNumber} updated successfully!`);
      } else {
        result = await quotationService.createQuotation(payload);
        toastSuccess(`Quotation #${result.quotation_number} generated successfully!`);
      }

      if (onCreated) onCreated(result);
      onClose();
    } catch (err) {
      console.error(err);
      toastError(err.response?.data?.message || err.message || 'Failed to save quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {isEditing ? `Edit Quotation #${initialQuotation?.quotation_number}` : 'Create Price Quotation / Estimate'}
              </h2>
              <p className="text-xs text-slate-500">Produce client price estimates with complete variant, GST & discount pricing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          
          {/* Section 1: Customer Selection & Details */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>1. Customer Selection</span>
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                <span>+ New Customer</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Customer Search & Select */}
              <div className="relative sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Search Customer (Name, Mobile, or Code)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search customer name or phone..."
                    value={customerSearchQuery}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    className="w-full text-xs"
                  />
                  {selectedCustomer && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerSearchQuery('');
                      }}
                      className="absolute right-3 top-2.5 text-xs text-rose-500 font-bold hover:text-rose-700"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Dropdown suggestions */}
                {isCustomerDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerSearchQuery('Walk-in Client');
                        setIsCustomerDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Walk-in Client (Counter Sale)</span>
                    </button>
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerSearchQuery(c.name);
                          setIsCustomerDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex justify-between items-center transition"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-[10px] text-slate-500">{c.phone || 'No phone'} • {c.customer_type || 'RETAIL'}</p>
                        </div>
                        {c.gst_number && (
                          <Badge className="text-[9px] bg-slate-100 text-slate-600 font-mono">
                            GST: {c.gst_number}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* GST Mode Toggle */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  GST Billing Mode
                </label>
                <div className="flex items-center space-x-2 h-10">
                  <button
                    type="button"
                    onClick={() => setApplyGst(true)}
                    className={`flex-1 h-full rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
                      applyGst
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>With GST</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplyGst(false)}
                    className={`flex-1 h-full rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
                      !applyGst
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Without GST</span>
                  </button>
                </div>
              </div>
            </div>

            {selectedCustomer && (
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs flex flex-wrap gap-4 text-slate-600">
                <span className="font-semibold text-slate-900">Client: {selectedCustomer.name}</span>
                {selectedCustomer.phone && <span>Phone: {selectedCustomer.phone}</span>}
                {selectedCustomer.email && <span>Email: {selectedCustomer.email}</span>}
                {selectedCustomer.gst_number && <span className="font-mono">GSTIN: {selectedCustomer.gst_number}</span>}
              </div>
            )}
          </div>

          {/* Section 2: Quotation Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Quotation # (Auto if blank)
              </label>
              <Input
                type="text"
                placeholder="e.g. QTN-2026-00001"
                value={quotationNumber}
                onChange={(e) => setQuotationNumber(e.target.value)}
                className="text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Quotation Date
              </label>
              <DatePicker
                value={quotationDate}
                onChange={(val) => setQuotationDate(val)}
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Valid Until Date
              </label>
              <DatePicker
                value={validUntil}
                onChange={(val) => setValidUntil(val)}
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Payment Terms
              </label>
              <Input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. Net 15 days"
                className="text-xs"
              />
            </div>
          </div>

          {/* Section 3: Product Search & Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-blue-600" />
                <span>3. Quoted Products & Variants</span>
              </h3>
              <span className="text-xs text-slate-500 font-semibold">{lineItems.length} items added</span>
            </div>

            {/* Product Selector */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Type product name, SKU or barcode to add items..."
                value={productSearchQuery}
                onChange={(e) => {
                  setProductSearchQuery(e.target.value);
                  setIsProductDropdownOpen(true);
                }}
                onFocus={() => setIsProductDropdownOpen(true)}
                className="w-full text-xs"
              />

              {isProductDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 z-30 max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No products match your search</div>
                  ) : (
                    filteredProducts.slice(0, 15).map((p) => {
                      const variants = p.product_variants || p.variants || [];
                      return (
                        <div key={p.id} className="p-2 hover:bg-slate-50 transition">
                          <div className="flex justify-between items-center px-2 py-1">
                            <div>
                              <p className="text-xs font-bold text-slate-900">{p.name}</p>
                              <p className="text-[10px] text-slate-500">
                                SKU: {p.sku || '-'} • Retail: {formatCurrency(p.retail_price || 0)}
                              </p>
                            </div>
                            {variants.length === 0 ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleSelectProduct(p, null)}
                                className="text-[10px] h-7 px-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                + Add
                              </Button>
                            ) : (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                                {variants.length} Variants
                              </span>
                            )}
                          </div>

                          {/* Variant rows if present */}
                          {variants.length > 0 && (
                            <div className="mt-1 pl-4 space-y-1">
                              {variants.map((v) => {
                                const colorName = v.colors?.name || v.color || '';
                                const sizeName = v.sizes?.name || v.size || '';
                                const varLabel = [colorName, sizeName].filter(Boolean).join(' / ') || 'Variant';
                                return (
                                  <div
                                    key={v.id}
                                    className="flex justify-between items-center bg-slate-50 px-2.5 py-1 rounded-lg text-xs"
                                  >
                                    <span className="font-medium text-slate-700">
                                      {varLabel} <span className="font-mono text-[10px] text-slate-400">({v.sku})</span>
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs font-bold text-slate-900">
                                        {formatCurrency(v.retail_price || p.retail_price || 0)}
                                      </span>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSelectProduct(p, v)}
                                        className="text-[9px] h-6 px-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
                                      >
                                        + Add
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <th className="p-3 whitespace-nowrap min-w-[150px]">Product Description</th>
                    <th className="p-3 whitespace-nowrap min-w-[120px]">Variant (Color / Size)</th>
                    <th className="p-3 text-center w-24 whitespace-nowrap">Qty</th>
                    <th className="p-3 text-right w-32 whitespace-nowrap">Quoted Unit Price (₹)</th>
                    <th className="p-3 text-center w-20 whitespace-nowrap">GST %</th>
                    <th className="p-3 text-right w-28 whitespace-nowrap">Total (₹)</th>
                    <th className="p-3 text-center w-12 whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 whitespace-nowrap">
                        No products selected yet. Search above to add items to quotation.
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((it, idx) => {
                      const lineTotal = Number(it.unitPrice || 0) * Number(it.quantity || 1);
                      return (
                        <tr key={it.cartKey || idx} className="hover:bg-slate-50">
                          <td className="p-3 whitespace-nowrap">
                            <p className="font-bold text-slate-900">{it.productName}</p>
                            <p className="text-[10px] text-slate-500 font-mono">SKU: {it.sku}</p>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="text-xs font-semibold text-slate-700">
                              {[it.color, it.size].filter(Boolean).join(' • ') || 'Standard'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={it.quantity}
                              onChange={(e) => handleUpdateLineItem(idx, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                              className="w-16 text-center border border-slate-200 rounded-lg py-1 font-bold text-xs"
                            />
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={it.unitPrice}
                              onChange={(e) => handleUpdateLineItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-24 text-right border border-slate-200 rounded-lg py-1 px-1.5 font-bold text-xs"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-semibold text-slate-700">
                              {applyGst ? `${it.gstPercentage}%` : '0%'}
                            </span>
                          </td>
                          <td className="p-3 text-right font-black text-slate-900">
                            {formatCurrency(lineTotal)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(idx)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Discount & Calculation Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200">
            {/* Multi-tier discount inputs */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>Multi-tier Discounts & Deductions</span>
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Trade Discount</label>
                  <div className="flex mt-1">
                    <select
                      value={tradeDiscountType}
                      onChange={(e) => setTradeDiscountType(e.target.value)}
                      className="border border-r-0 border-slate-200 rounded-l-lg bg-slate-100 text-[10px] px-1 font-bold"
                    >
                      <option value="PERCENT">%</option>
                      <option value="AMOUNT">₹</option>
                    </select>
                    <Input
                      type="number"
                      step="0.01"
                      value={tradeDiscountValue}
                      onChange={(e) => setTradeDiscountValue(e.target.value)}
                      className="rounded-l-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Scheme Discount</label>
                  <div className="flex mt-1">
                    <select
                      value={schemeDiscountType}
                      onChange={(e) => setSchemeDiscountType(e.target.value)}
                      className="border border-r-0 border-slate-200 rounded-l-lg bg-slate-100 text-[10px] px-1 font-bold"
                    >
                      <option value="PERCENT">%</option>
                      <option value="AMOUNT">₹</option>
                    </select>
                    <Input
                      type="number"
                      step="0.01"
                      value={schemeDiscountValue}
                      onChange={(e) => setSchemeDiscountValue(e.target.value)}
                      className="rounded-l-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Cash / Early Discount</label>
                  <div className="flex mt-1">
                    <select
                      value={cashDiscountType}
                      onChange={(e) => setCashDiscountType(e.target.value)}
                      className="border border-r-0 border-slate-200 rounded-l-lg bg-slate-100 text-[10px] px-1 font-bold"
                    >
                      <option value="PERCENT">%</option>
                      <option value="AMOUNT">₹</option>
                    </select>
                    <Input
                      type="number"
                      step="0.01"
                      value={cashDiscountValue}
                      onChange={(e) => setCashDiscountValue(e.target.value)}
                      className="rounded-l-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Less (Post-GST Deduction)</label>
                  <div className="flex mt-1">
                    <span className="border border-r-0 border-slate-200 rounded-l-lg bg-slate-100 text-[10px] px-2 flex items-center font-bold">₹</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={lessValue}
                      onChange={(e) => setLessValue(e.target.value)}
                      className="rounded-l-none text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                  Notes & Special Instructions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes for client proposal..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>
            </div>

            {/* Calculations Summary */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>

              {tradeAmt > 0 && (
                <div className="flex justify-between text-emerald-700 py-0.5">
                  <span>Trade Discount:</span>
                  <span>- {formatCurrency(tradeAmt)}</span>
                </div>
              )}

              {schemeAmt > 0 && (
                <div className="flex justify-between text-emerald-700 py-0.5">
                  <span>Scheme Discount:</span>
                  <span>- {formatCurrency(schemeAmt)}</span>
                </div>
              )}

              {cashAmt > 0 && (
                <div className="flex justify-between text-emerald-700 py-0.5">
                  <span>Cash Discount:</span>
                  <span>- {formatCurrency(cashAmt)}</span>
                </div>
              )}

              <div className="flex justify-between py-1 border-t border-slate-100">
                <span className="text-slate-600">Taxable Amount:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(taxableAmount)}</span>
              </div>

              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">Applicable GST ({applyGst ? 'Calculated' : '0%'}):</span>
                <span className="font-semibold text-slate-900">{formatCurrency(taxTotal)}</span>
              </div>

              {lessAmt > 0 && (
                <div className="flex justify-between text-rose-700 py-0.5">
                  <span>Less Amount:</span>
                  <span>- {formatCurrency(lessAmt)}</span>
                </div>
              )}

              <div className="flex justify-between py-0.5 text-slate-400 text-[10px]">
                <span>Round Off:</span>
                <span>{roundOff >= 0 ? `+₹${roundOff}` : `-₹${Math.abs(roundOff)}`}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t-2 border-slate-900 font-black text-sm">
                <span className="text-slate-900">Estimated Total:</span>
                <span className="text-base text-blue-700 font-black">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Quotation' : 'Save Quotation / Estimate'}
            </Button>
          </div>
        </form>

        {/* Quick Add Customer Modal */}
        <Modal
          isOpen={isNewCustomerModalOpen}
          onClose={() => setIsNewCustomerModalOpen(false)}
          title="Quick Add Customer"
        >
          <form onSubmit={handleCreateCustomerSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
              <Input
                type="text"
                required
                value={newCustomerForm.name}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                placeholder="e.g. Sri Balaji Textiles"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <Input
                  type="text"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  placeholder="10-digit mobile"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  placeholder="client@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN</label>
                <Input
                  type="text"
                  value={newCustomerForm.gst_number}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, gst_number: e.target.value })}
                  placeholder="33AAAAA0000A1Z5"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Type</label>
                <select
                  value={newCustomerForm.customer_type}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, customer_type: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-xl"
                >
                  <option value="RETAIL">Retail</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="DEALER">Dealer</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsNewCustomerModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingCustomer} className="bg-blue-600 text-white">
                {isSavingCustomer ? 'Saving...' : 'Add Customer'}
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </div>
  );
}
