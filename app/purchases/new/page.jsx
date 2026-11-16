'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Building2, 
  Calendar, 
  FileText, 
  Search,
  PackageCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { supplierService } from '@/services/supplierService';
import { productService } from '@/services/productService';
import { purchaseService } from '@/services/purchaseService';

export default function NewPurchasePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);

  // Search product dropdown modal/state
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [suppliersRes, productsRes] = await Promise.all([
        supplierService.getSuppliers(),
        productService.getProducts({ limit: 100 })
      ]);
      setSuppliers(suppliersRes.data || suppliersRes || []);
      setProducts(productsRes.data || productsRes || []);
    } catch (err) {
      console.error('Failed to fetch purchase dependencies', err);
      setError('Failed to load initial data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addItem = (product, selectedVariant = null) => {
    const variantId = selectedVariant ? selectedVariant.id : null;
    const existing = items.find(i => i.product_id === product.id && i.variant_id === variantId);
    
    if (existing) {
      setError(`Item "${product.name}${selectedVariant ? ` (${selectedVariant.variant_name || selectedVariant.sku})` : ''}" is already added to the purchase order. You can adjust quantity below.`);
      setTimeout(() => setError(null), 4000);
      setSearchTerm('');
      return;
    }

    const currentStock = selectedVariant 
      ? Number(selectedVariant.current_stock || 0) 
      : Number(product.current_stock || 0);

    const brandName = product.brands?.name || selectedVariant?.colors?.name || '—';
    const colorName = selectedVariant?.colors?.name || '—';
    const sizeName = selectedVariant?.sizes?.name || '—';

    setItems([
      ...items,
      {
        product_id: product.id,
        variant_id: variantId,
        name: product.name,
        sku: selectedVariant?.sku || product.sku || 'N/A',
        brand: brandName,
        color: colorName,
        size: sizeName,
        variant_name: selectedVariant?.variant_name || '',
        current_stock: currentStock,
        quantity: 1,
        unit_price: Number(selectedVariant?.purchase_price || product.purchase_price || 0),
        tax_rate: Number(product.gst_percentage || 0)
      }
    ]);
    setSearchTerm('');
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = parseFloat(value) || 0;
    setItems(updated);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateTax = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.tax_rate / 100)), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      setError('Please select a supplier');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one product to the purchase order');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        supplier_id: supplierId,
        purchase_date: purchaseDate,
        supplier_invoice_number: referenceNo || `PO-${Date.now().toString().slice(-6)}`,
        notes,
        items: items.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id || undefined,
          quantity: item.quantity,
          unit_price: item.unit_price,
          gst_percentage: item.tax_rate
        }))
      };

      await purchaseService.createPurchase(payload);
      setSuccess('Purchase recorded successfully! Stock and inventory movements automatically updated.');
      setTimeout(() => {
        router.push('/purchases');
      }, 1200);
    } catch (err) {
      console.error('Create purchase error', err);
      setError(err.response?.data?.message || err.message || 'Failed to create purchase order');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Top Header */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-xs shrink-0 cursor-pointer"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">New Purchase Order</h1>
                <p className="text-xs text-slate-500 mt-0.5">Record incoming stock and supplier invoice details</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Purchase Entry'}</span>
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-xs font-semibold">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="text-xs font-semibold">{success}</span>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Form Details & Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Details Card */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Supplier & Invoice Details</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Select
                      label="Select Supplier *"
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      placeholder="-- Choose Supplier --"
                      options={suppliers.map((s) => ({
                        value: s.id,
                        label: `${s.name} ${s.company_name ? `(${s.company_name})` : ''}`
                      }))}
                    />
                  </div>

                    <DatePicker
                      label="Purchase Date"
                      value={purchaseDate}
                      onChange={(val) => setPurchaseDate(val)}
                    />

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Supplier Invoice / Ref No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. INV-90481"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Notes / Remarks
                    </label>
                    <input
                      type="text"
                      placeholder="Additional invoice notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Product Items Table */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                    <PackageCheck className="w-4 h-4 text-blue-600" />
                    <span>Purchase Items</span>
                  </h2>

                  {/* Product & Variant Quick Search */}
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search product, SKU or barcode..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 sm:py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                    {searchTerm && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50">
                        {filteredProducts.length === 0 ? (
                          <div className="p-3 text-xs text-slate-500 text-center">No matching products found</div>
                        ) : (
                          filteredProducts.map(p => {
                            const hasVariants = p.product_variants && p.product_variants.length > 0;
                            return (
                              <div key={p.id} className="border-b border-slate-100 last:border-0">
                                {!hasVariants ? (
                                  <button
                                    type="button"
                                    onClick={() => addItem(p)}
                                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <div className="font-semibold text-slate-800">{p.name}</div>
                                      <div className="text-[10px] text-slate-400">SKU: {p.sku || 'N/A'}</div>
                                    </div>
                                    <span className="font-bold text-blue-600">₹{p.purchase_price || 0}</span>
                                  </button>
                                ) : (
                                  <div className="p-2 bg-slate-50/50">
                                    <div className="font-bold text-slate-800 text-xs px-1 mb-1">{p.name}</div>
                                    <div className="space-y-1">
                                      {p.product_variants.map(v => (
                                        <button
                                          key={v.id}
                                          type="button"
                                          onClick={() => addItem(p, v)}
                                          className="w-full px-2 py-1 text-left bg-white hover:bg-blue-50 rounded border border-slate-200 flex items-center justify-between text-[11px]"
                                        >
                                          <span className="font-medium text-slate-700">
                                            {v.variant_name || `${v.colors?.name || ''} ${v.sizes?.name || ''}`.trim() || v.sku}
                                          </span>
                                          <span className="font-bold text-blue-600">₹{v.purchase_price || p.purchase_price || 0}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <p className="text-sm font-semibold text-slate-600">No items added to purchase order yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Use the search box above to search by Product Name, SKU, or Barcode.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full text-left text-xs min-w-[700px]">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3 whitespace-nowrap min-w-[160px]">Product</th>
                          <th className="p-3 whitespace-nowrap min-w-[90px]">Brand</th>
                          <th className="p-3 whitespace-nowrap min-w-[80px]">Color</th>
                          <th className="p-3 whitespace-nowrap min-w-[70px]">Size</th>
                          <th className="p-3 text-center whitespace-nowrap min-w-[100px]">Stock</th>
                          <th className="p-3 text-center w-24 whitespace-nowrap">Qty</th>
                          <th className="p-3 text-right w-28 whitespace-nowrap">Purchase Price (₹)</th>
                          <th className="p-3 text-right w-28 whitespace-nowrap">Total (₹)</th>
                          <th className="p-3 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {items.map((item, idx) => {
                          const lineTotal = item.quantity * item.unit_price * (1 + item.tax_rate / 100);
                          const newStockPreview = item.current_stock + item.quantity;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/60">
                              <td className="p-3 whitespace-nowrap">
                                <div className="font-semibold text-slate-900">{item.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>
                              </td>
                              <td className="p-3 text-slate-600 font-semibold whitespace-nowrap">{item.brand}</td>
                              <td className="p-3 text-slate-600 whitespace-nowrap">{item.color}</td>
                              <td className="p-3 text-slate-600 font-bold whitespace-nowrap">{item.size}</td>
                              <td className="p-3 text-center whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                                  {item.current_stock} → <span className="text-emerald-700">{newStockPreview}</span>
                                </span>
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                  className="w-full text-center py-1 border border-slate-200 rounded-lg text-xs font-bold"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="0"
                                  value={item.unit_price}
                                  onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                                  className="w-full text-right py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                                />
                              </td>
                              <td className="p-3 text-right font-extrabold text-slate-900 text-sm whitespace-nowrap">
                                ₹{lineTotal.toFixed(2)}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeItem(idx)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Light Theme Financial Summary */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-white to-blue-50/40 border border-slate-200/90 text-slate-900 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Purchase Summary
                </h3>

                <div className="space-y-3 border-b border-slate-200 pb-4 text-xs font-medium">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Items:</span>
                    <span className="font-bold text-slate-900">{items.reduce((s, i) => s + i.quantity, 0)} pcs</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-900">₹{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Estimated Tax (GST):</span>
                    <span className="font-bold text-slate-900">₹{calculateTax().toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm font-bold pt-1">
                  <span className="text-slate-700">Grand Total:</span>
                  <span className="text-2xl text-blue-600 font-extrabold">₹{calculateTotal().toFixed(2)}</span>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50 mt-4 text-xs uppercase tracking-wider"
                >
                  {saving ? 'Processing Entry...' : 'Confirm & Save Purchase'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

