'use client';

import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Search, Plus, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { stockService } from '@/services/stockService';
import { productService } from '@/services/productService';
import { Select } from '@/components/ui/Select';

export default function StockAdjustmentsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [productId, setProductId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [type, setType] = useState('ADD'); // ADD or SUBTRACT
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getProducts({ limit: 100 });
      setProducts(res.data || res || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!productId || !quantity || quantity <= 0) {
      setError('Please select a product and valid positive quantity');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const targetType = type === 'ADD' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';
      const posQty = Math.abs(parseFloat(quantity));
      
      await stockService.createAdjustment({
        product_id: productId,
        variant_id: variantId || undefined,
        transaction_type: targetType,
        quantity: posQty,
        notes: reason.trim() || 'Manual Stock Adjustment'
      });

      setSuccess('Stock adjustment recorded successfully!');
      setProductId('');
      setVariantId('');
      setQuantity('');
      setReason('');
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError(err.message || err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <SlidersHorizontal className="w-6 h-6 text-blue-600 shrink-0" />
              <span>Manual Stock Adjustment</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">Add or deduct inventory quantities for damaged goods, physical audit corrections, or restocks.</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 text-red-700 flex items-center space-x-2 border border-red-200">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 flex items-center space-x-2 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleAdjust} className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 border-b pb-3">Adjustment Entry Form</h2>

            <div className="space-y-4">
              <div>
                <Select
                  label="Select Product *"
                  placeholder="-- Choose Product --"
                  searchable={true}
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    setVariantId('');
                  }}
                  options={products.map((p) => ({
                    value: p.id,
                    label: `${p.name} (SKU: ${p.sku}) — Current Stock: ${p.stockQuantity || p.quantity || p.current_stock || 0}`
                  }))}
                />
              </div>

              {productId && (() => {
                const selectedProd = products.find((p) => p.id === productId);
                const variants = selectedProd?.product_variants || selectedProd?.variants || [];
                return (
                  <>
                    {variants.length > 0 && (
                      <div>
                        <Select
                          label="Select Specific Variant *"
                          placeholder="-- Choose Variant --"
                          value={variantId}
                          onChange={(e) => setVariantId(e.target.value)}
                          options={[
                            { value: '', label: '-- All / Default Variant --' },
                            ...variants.map((v) => {
                              const attr = [v.colors?.name || v.color, v.sizes?.name || v.size].filter(Boolean).join(' / ') || v.sku || 'Variant';
                              return { value: v.id, label: `${attr} (Stock: ${v.current_stock || v.quantity || 0})` };
                            })
                          ]}
                        />
                      </div>
                    )}
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-blue-900 block">{selectedProd?.name}</span>
                        <span className="text-[11px] text-blue-700">Category: {selectedProd?.categories?.name || 'General'}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-blue-800 px-2 py-1 bg-white rounded-lg border border-blue-200 inline-block">
                          SKU: {selectedProd?.sku || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Adjustment Action *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType('ADD')}
                      className={`py-2.5 rounded-xl font-bold text-xs transition border ${
                        type === 'ADD' 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      + Add Stock (IN)
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('SUBTRACT')}
                      className={`py-2.5 rounded-xl font-bold text-xs transition border ${
                        type === 'SUBTRACT' 
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm' 
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      - Deduct Stock (OUT)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reason / Remark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Damaged piece, Annual physical count audit adjustment"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4 mr-1.5" />
                <span>{saving ? 'Saving Adjustment...' : 'Apply Stock Adjustment'}</span>
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

