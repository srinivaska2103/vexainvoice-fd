'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Package, ArrowLeft, Layers3, Box, AlertTriangle, CheckCircle2, Tag, Palette, Ruler, Barcode, Printer, Edit2
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import BarcodeSVG from '@/components/ui/BarcodeSVG';
import { productService } from '@/services/productService';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';

export default function ProductDetailContent({ productId: propProductId }) {
  const params = useParams();
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();
  const { role, checkPermission } = useAuth();
  const canEdit = role === 'ADMIN' || checkPermission('products.edit');
  
  // Resolve product ID from prop or URL params
  let resolvedId = propProductId || params?.id;
  if (!resolvedId && params?.subpath) {
    const sub = Array.isArray(params.subpath) ? params.subpath.join('/') : String(params.subpath);
    if (sub.startsWith('products/')) {
      resolvedId = sub.replace('products/', '');
    }
  }

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Edit Product Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    hsnCode: '',
    categoryId: '',
    brandId: '',
    gstPercentage: '5',
    retailPrice: '',
    wholesalePrice: '',
    dealerPrice: '',
    purchasePrice: '',
    lowStockWarning: '5'
  });

  const fetchProductAndVariants = async () => {
    if (!resolvedId || resolvedId === 'placeholder') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [pRes, vRes] = await Promise.all([
        productService.getProductById(resolvedId),
        productService.getVariants(resolvedId).catch(() => ({ data: [] }))
      ]);

      const prodData = pRes?.data || pRes;
      setProduct(prodData);

      const varList = vRes?.data || vRes || prodData?.product_variants || prodData?.variants || [];
      setVariants(varList);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load product details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductAndVariants();
  }, [resolvedId]);

  const handleOpenEditModal = async () => {
    if (!product) return;
    try {
      const [catsRes, brandsRes] = await Promise.all([
        productService.getCategories().catch(() => []),
        productService.getBrands().catch(() => [])
      ]);
      setCategories(Array.isArray(catsRes) ? catsRes : catsRes?.data || []);
      setBrands(Array.isArray(brandsRes) ? brandsRes : brandsRes?.data || []);
    } catch (e) {
      console.warn('Could not load categories/brands for edit modal');
    }

    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      hsnCode: product.hsn_code || product.hsnCode || '',
      categoryId: product.category_id || product.categoryId || product.categories?.id || '',
      brandId: product.brand_id || product.brandId || product.brands?.id || '',
      gstPercentage: String(product.gst_percentage ?? '5'),
      retailPrice: String(product.retail_price ?? ''),
      wholesalePrice: String(product.wholesale_price ?? ''),
      dealerPrice: String(product.dealer_price ?? ''),
      purchasePrice: String(product.purchase_price ?? ''),
      lowStockWarning: String(product.low_stock_warning ?? product.lowStockWarning ?? '5')
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toastError('Product name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku?.trim() || undefined,
        hsnCode: formData.hsnCode?.trim() || undefined,
        categoryId: formData.categoryId || undefined,
        brandId: formData.brandId || undefined,
        gstPercentage: parseFloat(formData.gstPercentage) || 0,
        retailPrice: parseFloat(formData.retailPrice) || 0,
        wholesalePrice: parseFloat(formData.wholesalePrice) || 0,
        dealerPrice: formData.dealerPrice ? parseFloat(formData.dealerPrice) : undefined,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        lowStockWarning: formData.lowStockWarning ? parseInt(formData.lowStockWarning, 10) : 5
      };

      await productService.updateProduct(resolvedId, payload);
      toastSuccess('Product updated successfully!');
      setIsEditModalOpen(false);
      fetchProductAndVariants();
    } catch (err) {
      toastError(err.response?.data?.message || err.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center space-x-3">
              <Link href="/products" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{product?.name || 'Product Details'}</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Brand: {product?.brands?.name || 'N/A'} • Category: {product?.categories?.name || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {canEdit && (
                <Button
                  onClick={handleOpenEditModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                  Edit Product
                </Button>
              )}
              <Link href="/products/barcodes">
                <Button variant="secondary" className="text-xs font-semibold">
                  <Printer className="w-4 h-4 mr-1.5" />
                  Print Barcodes
                </Button>
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <Spinner className="w-8 h-8 text-blue-600 mx-auto" />
              <p className="text-xs text-slate-500 mt-3">Loading product details...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
              {errorMsg}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Product Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 md:col-span-2 space-y-4">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>Product Specifications</span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Product SKU</span>
                      <span className="font-mono font-bold text-slate-900 block truncate">{product?.sku || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Barcode / EAN</span>
                      <span className="font-mono font-bold text-blue-700 block truncate">{product?.barcode || product?.sku || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Unit</span>
                      <span className="font-semibold text-slate-800">{product?.unit || 'PCS'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">HSN Code</span>
                      <span className="font-semibold text-slate-800">{product?.hsn_code || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">GST Rate</span>
                      <span className="font-semibold text-slate-800">{product?.gst_percentage || 0}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Retail Price</span>
                      <span className="font-extrabold text-blue-600">{formatCurrency(product?.retail_price || 0)}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Barcode</h3>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <BarcodeSVG value={product?.barcode || product?.sku || 'N/A'} height={60} unitWidth={1.8} fontSize={12} />
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">Scan in POS & Scanner module</p>
                </Card>
              </div>

              {/* Product Variants Matrix */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <Layers3 className="w-4 h-4 text-purple-600" />
                    <span>Product Variants ({variants.length})</span>
                  </h2>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-4 font-bold">Variant Name</th>
                        <th className="py-2.5 px-4 font-bold">Color</th>
                        <th className="py-2.5 px-4 font-bold">Size</th>
                        <th className="py-2.5 px-4 font-bold">SKU</th>
                        <th className="py-2.5 px-4 font-bold">Barcode</th>
                        <th className="py-2.5 px-4 font-bold">Retail Price</th>
                        <th className="py-2.5 px-4 font-bold">Stock</th>
                        <th className="py-2.5 px-4 font-bold text-center">Barcode Tag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {variants.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            No variant items mapped. Base product stock is tracked individually.
                          </td>
                        </tr>
                      ) : (
                        variants.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {v.variant_name || `${v.color || v.colors?.name || ''} / ${v.size || v.sizes?.name || ''}`}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center space-x-1.5">
                                {(v.colors?.hex_code) && (
                                  <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: v.colors.hex_code }} />
                                )}
                                <span>{v.color || v.colors?.name || '—'}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-mono text-[11px] font-semibold">
                                {v.size || v.sizes?.name || '—'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-blue-700">
                              {v.sku}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {v.barcode || v.sku}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {formatCurrency(v.retail_price ?? product?.retail_price ?? 0)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-emerald-700">
                                {v.current_stock ?? v.opening_stock ?? 0} {product?.unit || 'PCS'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="inline-block p-1 bg-white rounded border border-slate-200">
                                <BarcodeSVG value={v.barcode || v.sku} height={20} unitWidth={1.5} showText={false} />
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Edit Product Modal */}
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Edit Product Details"
            maxWidth="max-w-2xl"
          >
            <form onSubmit={handleSaveEditProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Product Name *"
                  required
                  placeholder="e.g. Cotton Shirt - Full Sleeve"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  label="SKU / Barcode"
                  placeholder="Leave blank or type SKU"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Select
                  label="Category *"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  options={[{ value: '', label: '-- Select Category --' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                />
                <Select
                  label="Brand Name"
                  value={formData.brandId}
                  onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                  options={[{ value: '', label: '-- Select Brand --' }, ...brands.map((b) => ({ value: b.id, label: b.name }))]}
                />
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Tax Rate (GST) *
                    </label>
                  </div>
                  <Select
                    value={formData.gstPercentage}
                    onChange={(e) => setFormData({ ...formData, gstPercentage: e.target.value })}
                    options={[
                      { value: '0', label: '0% (Exempted)' },
                      { value: '5', label: '5% GST (Garments/Textile)' },
                      { value: '12', label: '12% GST' },
                      { value: '18', label: '18% GST' },
                      { value: '28', label: '28% GST' }
                    ]}
                  />
                </div>
                <Input
                  label="HSN Code"
                  placeholder="e.g. 6205"
                  value={formData.hsnCode}
                  onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Input
                  label="Retail Price (₹) *"
                  type="number"
                  step="0.01"
                  required
                  placeholder="1200"
                  value={formData.retailPrice}
                  onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                />
                <Input
                  label="Wholesale Price (₹) *"
                  type="number"
                  step="0.01"
                  required
                  placeholder="950"
                  value={formData.wholesalePrice}
                  onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                />
                <Input
                  label="Dealer Price (₹)"
                  type="number"
                  step="0.01"
                  placeholder="850"
                  value={formData.dealerPrice}
                  onChange={(e) => setFormData({ ...formData, dealerPrice: e.target.value })}
                />
                <Input
                  label="Purchase Cost (₹)"
                  type="number"
                  step="0.01"
                  placeholder="700"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Low Stock Warning Limit"
                  type="number"
                  placeholder="5"
                  value={formData.lowStockWarning}
                  onChange={(e) => setFormData({ ...formData, lowStockWarning: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  Update Product
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
