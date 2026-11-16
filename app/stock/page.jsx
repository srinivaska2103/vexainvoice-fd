'use client';

import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Search, 
  AlertTriangle, 
  SlidersHorizontal, 
  CheckCircle2, 
  ChevronDown,
  ChevronRight,
  Layers,
  Tag,
  Package
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { stockService } from '@/services/stockService';
import { productService } from '@/services/productService';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';

export default function StockManagementPage() {
  const { toastSuccess, toastError } = useToast();
  const { checkPermission, role } = useAuth();
  const canAdjust = role === 'ADMIN' || checkPermission('stock.adjustments');
  const [stockBalances, setStockBalances] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [expandedProductIds, setExpandedProductIds] = useState(new Set());

  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('ADD'); // ADD | REMOVE
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('Physical Count Correction');
  const [notesText, setNotesText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStock = async () => {
    setIsLoading(true);
    try {
      const [stockRes, prodRes] = await Promise.all([
        stockService.getStock({ search }),
        productService.getProducts()
      ]);
      const rawStock = stockRes?.data?.stock || stockRes?.data?.data || stockRes?.data || stockRes?.stock || (Array.isArray(stockRes) ? stockRes : []);
      const rawProds = prodRes?.data?.data || prodRes?.data || (Array.isArray(prodRes) ? prodRes : []);

      const items = Array.isArray(rawStock) ? rawStock : [];
      setStockBalances(items);
      setProducts(Array.isArray(rawProds) ? rawProds : []);

      // If searching, automatically expand matching products
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchingIds = new Set();
        items.forEach((prod) => {
          const nameMatch = prod.name?.toLowerCase().includes(query);
          const brandMatch = (prod.brand || prod.brand_name || '')?.toLowerCase().includes(query);
          const catMatch = (prod.category?.name || '').toLowerCase().includes(query);
          const skuMatch = prod.sku?.toLowerCase().includes(query);
          const barcodeMatch = prod.barcode?.toLowerCase().includes(query);
          const variantMatch = (prod.variants || []).some(v => 
            (v.color || '').toLowerCase().includes(query) ||
            (v.size || '').toLowerCase().includes(query) ||
            (v.sku || '').toLowerCase().includes(query) ||
            (v.barcode || '').toLowerCase().includes(query)
          );

          if (nameMatch || brandMatch || catMatch || skuMatch || barcodeMatch || variantMatch) {
            matchingIds.add(prod.id);
          }
        });
        setExpandedProductIds(matchingIds);
      }
    } catch (err) {
      console.error('Failed to fetch inventory stock:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [search]);

  const toggleExpand = (productId) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const openAdjustmentModal = (prod, variant = null) => {
    setSelectedProduct(prod);
    setSelectedVariantId(variant ? variant.id : '');
    setQuantity('1');
    setReason('Physical Count Correction');
    setNotesText('');
    setIsAdjustModalOpen(true);
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      const adjustmentQty = adjustmentType === 'REMOVE' ? -Math.abs(parseFloat(quantity)) : Math.abs(parseFloat(quantity));
      const finalNotes = notesText ? `${reason}: ${notesText}` : reason;
      await stockService.createAdjustment({
        product_id: selectedProduct.id,
        productId: selectedProduct.id,
        variant_id: selectedVariantId || undefined,
        variantId: selectedVariantId || undefined,
        quantity: adjustmentQty,
        notes: finalNotes,
        reason: finalNotes
      });
      setIsAdjustModalOpen(false);
      setSelectedProduct(null);
      setSelectedVariantId('');
      setQuantity('1');
      setNotesText('');
      toastSuccess('Stock adjustment recorded successfully');
      fetchStock();
    } catch (err) {
      toastError(err.message || 'Failed to record stock adjustment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products by low stock threshold if toggled
  const filteredBalances = stockBalances.filter((prod) => {
    const totalQty = typeof prod.stockQuantity === 'number' ? prod.stockQuantity : (prod.quantity || 0);
    const lowLimit = prod.lowStockWarning || 5;
    const hasVariantLowStock = (prod.variants || []).some(v => v.quantity <= lowLimit);
    
    if (lowStockOnly && totalQty > lowLimit && !hasVariantLowStock) {
      return false;
    }
    return true;
  });

  return (
    <ProtectedRoute permissions={['stock.view']}>
      <DashboardLayout>
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Boxes className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 shrink-0" />
                <span>Stock & Inventory</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Grouped product overview & variant-level real-time stock tracking
              </p>
            </div>
            <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className={`justify-center rounded-xl font-bold text-xs ${lowStockOnly ? 'border-amber-500 bg-amber-50 text-amber-700' : ''}`}
              >
                <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-500" />
                {lowStockOnly ? 'Low Stock' : 'Filter Low'}
              </Button>
              {canAdjust && (
                <Button size="sm" onClick={() => openAdjustmentModal(products[0] || null)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl justify-center shadow-xs">
                  <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                  Adjust Stock
                </Button>
              )}
            </div>
          </div>

          {/* Search */}
          <Card className="p-4 flex items-center justify-between">
            <div className="w-full sm:w-96">
              <Input
                placeholder="Search by product, brand, category, SKU, color, size..."
                icon={Search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </Card>

          {/* Stock Table */}
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Spinner size="lg" className="text-indigo-600" />
            </div>
          ) : filteredBalances.length === 0 ? (
            <Card className="p-8 text-center">
              <EmptyState
                icon={Boxes}
                title="No Inventory Records Found"
                description="Products and stock counts will appear here."
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {/* DESKTOP TREE / EXPANDABLE TABLE */}
              <Card className="hidden md:block overflow-hidden border border-slate-200 shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4 w-10"></th>
                        <th className="py-3.5 px-4">Product & Details</th>
                        <th className="py-3.5 px-4">Brand</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Variants</th>
                        <th className="py-3.5 px-4">Total Stock</th>
                        <th className="py-3.5 px-4">Stock Status</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredBalances.map((prod) => {
                        const hasVariants = Array.isArray(prod.variants) && prod.variants.length > 0;
                        const isExpanded = expandedProductIds.has(prod.id);
                        const totalQty = typeof prod.stockQuantity === 'number' ? prod.stockQuantity : (prod.quantity || 0);
                        const minWarn = prod.lowStockWarning || 5;
                        const unitName = prod.unit || 'PCS';
                        const brandName = prod.brand || prod.brand_name || 'N/A';
                        const catName = prod.category?.name || 'General';
                        
                        const hasLowVariant = hasVariants && prod.variants.some(v => v.quantity <= minWarn);
                        const isOverallLow = totalQty <= minWarn || hasLowVariant;

                        return (
                          <React.Fragment key={prod.id}>
                            {/* PARENT PRODUCT ROW */}
                            <tr 
                              onClick={() => hasVariants && toggleExpand(prod.id)}
                              className={`transition-colors ${hasVariants ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/50'} ${isExpanded ? 'bg-blue-50/30' : ''}`}
                            >
                              <td className="py-3.5 px-4 text-slate-400 text-center">
                                {hasVariants ? (
                                  isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-blue-600 font-bold" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                  )
                                ) : (
                                  <span className="inline-block w-2 h-2 rounded-full bg-slate-200"></span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-extrabold text-slate-900 text-sm">{prod.name}</div>
                                <div className="text-[11px] text-slate-400 font-mono">SKU: {prod.sku || 'N/A'}</div>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-slate-600">
                                {brandName !== 'N/A' ? (
                                  <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700">
                                    {brandName}
                                  </Badge>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <Badge variant="secondary" className="font-semibold text-slate-700">{catName}</Badge>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-600">
                                {hasVariants ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    <Layers className="w-3 h-3 mr-1 text-indigo-500" />
                                    {prod.variants.length} Variants
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-normal">Single Item</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex flex-col">
                                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider text-[9.5px]">
                                    {hasVariants ? 'Total Product Stock' : 'Current Stock'}
                                  </span>
                                  <span className={`text-sm font-black ${isOverallLow ? 'text-rose-600' : 'text-slate-900'}`}>
                                    {totalQty} {unitName}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                {isOverallLow ? (
                                  <Badge variant="danger" className="flex items-center space-x-1 w-fit bg-rose-50 text-rose-700 border-rose-200">
                                    <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                                    {hasLowVariant ? 'Variant Low Stock' : 'Low Stock Alert'}
                                  </Badge>
                                ) : (
                                  <Badge variant="success" className="flex items-center space-x-1 w-fit bg-emerald-50 text-emerald-700 border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                    Healthy
                                  </Badge>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => openAdjustmentModal(prod)}
                                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all shadow-2xs cursor-pointer"
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Adjust Stock</span>
                                </button>
                              </td>
                            </tr>

                            {/* NESTED VARIANT ROWS */}
                            {hasVariants && isExpanded && (
                              <tr>
                                <td colSpan="8" className="p-0 bg-slate-50/60 border-y border-slate-200/80">
                                  <div className="py-3 px-6 pl-14 space-y-2">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                                      <span>Variant Breakdown for {prod.name} ({prod.variants.length} Variants)</span>
                                      <span>Parent Total: {totalQty} {unitName}</span>
                                    </div>
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden overflow-x-auto">
                                      <table className="w-full text-left text-xs min-w-[550px]">
                                        <thead className="bg-slate-100/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                                          <tr>
                                            <th className="py-2.5 px-4">Variant Attributes</th>
                                            <th className="py-2.5 px-4">SKU</th>
                                            <th className="py-2.5 px-4">Price</th>
                                            <th className="py-2.5 px-4">Variant Stock</th>
                                            <th className="py-2.5 px-4">Status</th>
                                            <th className="py-2.5 px-4 text-right">Action</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium">
                                          {prod.variants.map((v) => {
                                            const vQty = v.quantity || 0;
                                            const vLow = vQty <= minWarn;
                                            const colorStr = v.color ? `Color: ${v.color}` : '';
                                            const sizeStr = v.size ? `Size: ${v.size}` : '';
                                            const attrStr = [v.color, v.size].filter(Boolean).join(' / ') || 'Default Variant';
                                            
                                            const searchQuery = search.trim().toLowerCase();
                                            const isMatch = searchQuery && (
                                              (v.color || '').toLowerCase().includes(searchQuery) ||
                                              (v.size || '').toLowerCase().includes(searchQuery) ||
                                              (v.sku || '').toLowerCase().includes(searchQuery)
                                            );

                                            return (
                                              <tr key={v.id} className={`hover:bg-slate-50 transition-colors ${isMatch ? 'bg-amber-50/60' : ''}`}>
                                                <td className="py-2.5 px-4">
                                                  <div className="flex items-center space-x-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                    <span className="font-extrabold text-slate-900">{attrStr}</span>
                                                    {isMatch && (
                                                      <Badge variant="warning" className="text-[9px] py-0 px-1.5">Search Match</Badge>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                                                  {v.sku || prod.sku || 'N/A'}
                                                </td>
                                                <td className="py-2.5 px-4 font-semibold text-slate-700">
                                                  {v.retail_price ? formatCurrency(v.retail_price) : formatCurrency(prod.retail_price || 0)}
                                                </td>
                                                <td className="py-2.5 px-4">
                                                  <span className={`font-black ${vLow ? 'text-rose-600' : 'text-slate-900'}`}>
                                                    {vQty} {unitName}
                                                  </span>
                                                </td>
                                                <td className="py-2.5 px-4">
                                                  {vLow ? (
                                                    <span className="inline-flex items-center text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                                      <AlertTriangle className="w-3 h-3 mr-1 text-rose-500" />
                                                      Low Stock ({vQty})
                                                    </span>
                                                  ) : (
                                                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
                                                      Normal
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="py-2.5 px-4 text-right">
                                                  <button
                                                    type="button"
                                                    onClick={() => openAdjustmentModal(prod, v)}
                                                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs transition-all cursor-pointer"
                                                  >
                                                    <SlidersHorizontal className="w-3 h-3 text-slate-600" />
                                                    <span>Adjust Variant</span>
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* MOBILE EXPANDABLE CARD LAYOUT */}
              <div className="md:hidden space-y-3">
                {filteredBalances.map((prod) => {
                  const hasVariants = Array.isArray(prod.variants) && prod.variants.length > 0;
                  const isExpanded = expandedProductIds.has(prod.id);
                  const totalQty = typeof prod.stockQuantity === 'number' ? prod.stockQuantity : (prod.quantity || 0);
                  const minWarn = prod.lowStockWarning || 5;
                  const unitName = prod.unit || 'PCS';
                  const brandName = prod.brand || prod.brand_name || '';
                  const hasLowVariant = hasVariants && prod.variants.some(v => v.quantity <= minWarn);
                  const isOverallLow = totalQty <= minWarn || hasLowVariant;

                  return (
                    <Card key={prod.id} className="p-4 space-y-3 bg-white border border-slate-200 shadow-xs">
                      {/* Product Header */}
                      <div 
                        onClick={() => hasVariants && toggleExpand(prod.id)}
                        className={`flex items-start justify-between gap-3 ${hasVariants ? 'cursor-pointer' : ''}`}
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-extrabold text-slate-900 text-base">{prod.name}</h3>
                            {hasVariants && (
                              <Badge variant="indigo" className="text-[10px] font-bold">
                                {prod.variants.length} Variants
                              </Badge>
                            )}
                          </div>
                          {brandName && <p className="text-xs text-slate-500 font-semibold">{brandName}</p>}
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Stock</span>
                          <span className={`text-base font-black ${isOverallLow ? 'text-rose-600' : 'text-slate-900'}`}>
                            {totalQty} {unitName}
                          </span>
                        </div>
                      </div>

                      {/* Expand Toggle */}
                      {hasVariants && (
                        <div 
                          onClick={() => toggleExpand(prod.id)}
                          className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-blue-600 font-extrabold cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide Variant Breakdown' : `Show ${prod.variants.length} Variants`}</span>
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                      )}

                      {/* Mobile Variant Cards */}
                      {hasVariants && isExpanded && (
                        <div className="pt-2 space-y-2 border-t border-slate-100">
                          {prod.variants.map((v) => {
                            const vQty = v.quantity || 0;
                            const vLow = vQty <= minWarn;
                            const attrStr = [v.color, v.size].filter(Boolean).join(' / ') || 'Variant';

                            return (
                              <div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                                <div>
                                  <div className="font-black text-slate-900">{attrStr}</div>
                                  <div className="text-[11px] font-mono text-slate-500">SKU: {v.sku || 'N/A'}</div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <span className={`font-black text-sm ${vLow ? 'text-rose-600' : 'text-slate-900'}`}>
                                    {vQty} {unitName}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openAdjustmentModal(prod, v)}
                                    className="p-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg shadow-2xs active:scale-95"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Adjustment Modal */}
          <Modal
            isOpen={isAdjustModalOpen}
            onClose={() => setIsAdjustModalOpen(false)}
            title="Manual Stock Adjustment"
            maxWidth="max-w-md"
          >
            <form onSubmit={handleStockAdjustment} className="space-y-4 text-xs">
              <Select
                label="Select Product *"
                value={selectedProduct ? selectedProduct.id : ''}
                onChange={(e) => {
                  const p = products.find(prod => prod.id === e.target.value);
                  setSelectedProduct(p || null);
                  setSelectedVariantId('');
                }}
                options={[
                  { value: '', label: '-- Select Item --' },
                  ...products.map((p) => ({ value: p.id, label: `${p.name} (Total Stock: ${p.stockQuantity || p.quantity || 0})` }))
                ]}
              />

              {/* Variant Selector if Selected Product Has Variants */}
              {selectedProduct && Array.isArray(selectedProduct.product_variants || selectedProduct.variants) && (selectedProduct.product_variants || selectedProduct.variants).length > 0 && (
                <Select
                  label="Select Specific Variant *"
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  options={[
                    { value: '', label: '-- Entire Product Level --' },
                    ...(selectedProduct.product_variants || selectedProduct.variants).map((v) => {
                      const attr = [v.colors?.name || v.color, v.sizes?.name || v.size].filter(Boolean).join(' / ') || v.sku || 'Variant';
                      return { value: v.id, label: `${attr} (Stock: ${v.current_stock || v.quantity || 0})` };
                    })
                  ]}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Adjustment Type *"
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value)}
                  options={[
                    { value: 'ADD', label: '+ Add Stock (Inward)' },
                    { value: 'REMOVE', label: '- Reduce Stock (Damage/Loss)' }
                  ]}
                />
                <Input
                  label="Quantity *"
                  type="number"
                  required
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <Select
                label="Adjustment Reason *"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                options={[
                  { value: 'Physical Count Correction', label: 'Physical Count Correction' },
                  { value: 'Damaged Stock', label: 'Damaged Stock' },
                  { value: 'Lost Stock', label: 'Lost Stock' },
                  { value: 'Found Stock', label: 'Found Stock' },
                  { value: 'Opening Stock', label: 'Opening Stock' },
                  { value: 'Data Correction', label: 'Data Correction' },
                  { value: 'Other', label: 'Other' }
                ]}
              />

              <Input
                label={reason === 'Other' ? 'Note (Required) *' : 'Additional Notes (Optional)'}
                placeholder="e.g. Physical audit recount details"
                required={reason === 'Other'}
                value={notesText || ''}
                onChange={(e) => setNotesText(e.target.value)}
              />

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsAdjustModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Save Stock Adjustment
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
