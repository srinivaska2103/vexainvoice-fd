'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Tag, 
  Layers, 
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  LayoutGrid,
  List,
  Barcode,
  Boxes
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
import { productService } from '@/services/productService';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';

export default function ProductsPage() {
  const { checkPermission, role } = useAuth();
  const canCreate = role === 'ADMIN' || checkPermission('products.create');
  const canEdit = role === 'ADMIN' || checkPermission('products.edit');
  const canDelete = role === 'ADMIN' || checkPermission('products.deactivate');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('GRID'); // 'GRID' | 'TABLE'

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');

  // Product Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    hsnCode: '',
    categoryId: '',
    brandId: '',
    gstPercentage: '5',
    unit: 'PCS',
    retailPrice: '',
    wholesalePrice: '',
    purchasePrice: '',
    minSalePrice: '',
    openingStock: '0',
    lowStockWarning: '5',
    size: '',
    color: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, brandRes, taxRes] = await Promise.all([
        productService.getProducts({ search, categoryId: selectedCategory }),
        productService.getCategories(),
        productService.getBrands(),
        productService.getTaxRates()
      ]);
      setProducts(prodRes.data || prodRes || []);
      setCategories(catRes.data || catRes || []);
      setBrands(brandRes.data || brandRes || []);
      setTaxRates(taxRes.data || taxRes || [0, 5, 12, 18, 28]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory]);

  const handleOpenAddModal = (product = null) => {
    setFormError('');
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        hsnCode: product.hsn_code || product.hsnCode || '',
        categoryId: product.category_id || product.categoryId || '',
        brandId: product.brand_id || product.brandId || '',
        gstPercentage: String(product.gst_percentage ?? product.gstPercentage ?? 5),
        unit: product.unit || 'PCS',
        retailPrice: product.retail_price ?? product.retailPrice ?? '',
        wholesalePrice: product.wholesale_price ?? product.wholesalePrice ?? '',
        purchasePrice: product.purchase_price ?? product.purchasePrice ?? '',
        dealerPrice: product.dealer_price ?? product.dealerPrice ?? '',
        minSalePrice: product.min_sale_price ?? product.minSalePrice ?? '',
        openingStock: product.opening_stock ?? product.stockQuantity ?? '0',
        lowStockWarning: product.low_stock_warning ?? product.lowStockWarning ?? '5',
        size: product.size || '',
        color: product.color || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        hsnCode: '',
        categoryId: categories[0]?.id || '',
        brandId: '',
        gstPercentage: '5',
        unit: 'PCS',
        retailPrice: '',
        wholesalePrice: '',
        purchasePrice: '',
        dealerPrice: '',
        minSalePrice: '',
        openingStock: '0',
        lowStockWarning: '5',
        size: '',
        color: ''
      });
    }
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        sku: formData.sku,
        hsn_code: formData.hsnCode,
        category_id: formData.categoryId || null,
        brand_id: formData.brandId || null,
        gst_percentage: parseFloat(formData.gstPercentage || 0),
        unit: formData.unit,
        retail_price: parseFloat(formData.retailPrice || 0),
        wholesale_price: parseFloat(formData.wholesalePrice || 0),
        purchase_price: parseFloat(formData.purchasePrice || 0),
        dealer_price: parseFloat(formData.dealerPrice || formData.wholesalePrice || 0),
        minimum_stock: parseFloat(formData.lowStockWarning || 5),
        opening_stock: parseFloat(formData.openingStock || 0)
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, payload);
      } else {
        await productService.createProduct(payload);
      }

      setIsAddModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { confirm, toastSuccess, toastError } = useToast();

  const handleDeleteProduct = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Product?',
      message: 'Are you sure you want to delete this product? It will be removed from your catalog.',
      confirmText: 'Delete Product',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (isConfirmed) {
      try {
        await productService.deleteProduct(id);
        toastSuccess('Product deleted successfully');
        fetchData();
      } catch (err) {
        toastError(err.message || 'Failed to delete product');
      }
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await productService.createCategory({ name: newCatName });
      setNewCatName('');
      setIsCategoryModalOpen(false);
      toastSuccess('Category created successfully');
      fetchData();
    } catch (err) {
      toastError(err.message || 'Failed to create category');
    }
  };

  return (
    <ProtectedRoute permissions={['products.view']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Products & Inventory</h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage garment/textile catalog, prices, GST tax rates & stock levels
              </p>
            </div>
            {canCreate && (
              <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={() => setIsCategoryModalOpen(true)} className="justify-center rounded-xl font-bold">
                  <Layers className="w-4 h-4 mr-1.5" />
                  Add Category
                </Button>
                <Link href="/products/new" className="w-full sm:w-auto">
                  <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl justify-center shadow-xs">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add New Product
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Search & Filter Bar */}
          <Card className="p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
            <div className="w-full sm:w-80">
              <Input
                placeholder="Search by name, SKU/Barcode..."
                icon={Search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="flex-1 sm:w-48">
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target?.value !== undefined ? e.target.value : e)}
                  options={[
                    { value: '', label: 'All Categories' },
                    ...categories.map((cat) => ({ value: cat.id, label: cat.name }))
                  ]}
                  size="sm"
                />
              </div>
              <Button variant="outline" size="sm" onClick={fetchData} title="Refresh catalog" className="rounded-xl">
                <RefreshCw className="w-4 h-4" />
              </Button>
              {/* Layout Switcher (Square Grid vs Table) */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('GRID')}
                  title="Square Cards Grid View"
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'GRID'
                      ? 'bg-white text-blue-600 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('TABLE')}
                  title="Compact Table View"
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'TABLE'
                      ? 'bg-white text-blue-600 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>

          {/* Product List */}
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Spinner size="lg" className="text-indigo-600" />
            </div>
          ) : products.length === 0 ? (
            <Card className="p-8 text-center">
              <EmptyState
                icon={Package}
                title="No Products Found"
                description="Get started by adding your first product catalog or item."
                action={
                  <Link href="/products/new">
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </Link>
                }
              />
            </Card>
          ) : viewMode === 'GRID' ? (
            /* Responsive Square Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product, index) => {
                const prodKey = product.id || product.product_id || product.sku || `prod-${index}`;
                const categoryName = product.categories?.name || product.category?.name || 'General';
                const brandName = product.brands?.name || product.brand?.name || (brands.find((b) => b.id === (product.brand_id || product.brandId))?.name) || 'Generic';
                const firstVariant = (product.product_variants && product.product_variants.length > 0) ? product.product_variants[0] : null;
                const displaySku = (product.sku && !product.sku.startsWith('SKU-179') && !product.sku.startsWith('SKU-178'))
                  ? product.sku
                  : (firstVariant?.sku || product.sku || '—');
                const retailPrice = product.retail_price ?? product.retailPrice ?? firstVariant?.retail_price ?? 0;
                const wholesalePrice = product.wholesale_price ?? product.wholesalePrice ?? firstVariant?.wholesale_price ?? 0;
                const purchasePrice = product.purchase_price ?? product.purchasePrice ?? firstVariant?.purchase_price ?? 0;
                const dealerPrice = product.dealer_price ?? product.dealerPrice ?? firstVariant?.dealer_price ?? 0;
                const stockQty = typeof product.stockQuantity === 'number' ? product.stockQuantity :
                  (typeof product.current_stock === 'number' ? product.current_stock :
                  (typeof product.opening_stock === 'number' ? product.opening_stock :
                  (product.product_variants && product.product_variants.length > 0
                    ? product.product_variants.reduce((sum, v) => sum + Number(v.current_stock || v.opening_stock || 0), 0)
                    : 0)));
                const gstRate = product.gst_percentage ?? (product.taxRate ? product.taxRate.rate : 5);
                const isLowStock = Number(stockQty) <= (product.low_stock_warning || product.lowStockWarning || product.minimum_stock || 5);
                const variantCount = product.product_variants?.length || 0;

                return (
                  <div
                    key={prodKey}
                    className="group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 hover:shadow-lg transition-all duration-200 p-4 flex flex-col justify-between aspect-square relative overflow-hidden"
                  >
                    {/* Top Badges & Actions */}
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 truncate max-w-[65%]">
                          {categoryName}
                        </span>
                        <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                          <Link
                            href={`/products/${product.id}`}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="View Details"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </Link>
                          {canEdit && (
                            <button
                              onClick={() => handleOpenAddModal(product)}
                              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              title="Edit Product"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Product Name & Brand */}
                      <Link href={`/products/${product.id}`} className="block">
                        <h3 className="font-black text-slate-900 text-sm group-hover:text-blue-600 transition line-clamp-2 leading-tight">
                          {product.name}
                        </h3>
                      </Link>

                      <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700 truncate">{brandName}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px] text-slate-500 font-semibold truncate">{displaySku}</span>
                      </div>

                      {/* Variant details if any */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {variantCount > 0 ? (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {variantCount} Variants
                          </span>
                        ) : (product.size || product.color) ? (
                          <span className="text-[10px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                            {[product.size, product.color].filter(Boolean).join(' / ')}
                          </span>
                        ) : null}

                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-200">
                          GST: {gstRate}%
                        </span>
                      </div>
                    </div>

                    {/* Bottom: Pricing & Stock status */}
                    <div className="pt-2 border-t border-slate-100 flex items-end justify-between mt-auto">
                      <div className="space-y-0.5">
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-400">Retail Price</p>
                          <p className="text-base font-black text-slate-900 leading-none">
                            {formatCurrency(retailPrice)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                          {wholesalePrice > 0 && (
                            <span>WS: <strong className="text-slate-700">{formatCurrency(wholesalePrice)}</strong></span>
                          )}
                          {dealerPrice > 0 && (
                            <span>DLR: <strong className="text-slate-700">{formatCurrency(dealerPrice)}</strong></span>
                          )}
                        </div>
                        {purchasePrice > 0 && (
                          <p className="text-[9px] text-slate-400">
                            Cost: <span className="font-semibold text-slate-600">{formatCurrency(purchasePrice)}</span>
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <span className={`text-xs font-black ${isLowStock ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {stockQty} {product.unit || 'PCS'}
                          </span>
                          {isLowStock && (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" title="Low stock warning" />
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 uppercase font-semibold">Available</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[750px]">
                  <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4 whitespace-nowrap min-w-[170px]">Item & Code</th>
                      <th className="py-3.5 px-4 whitespace-nowrap min-w-[110px]">Brand</th>
                      <th className="py-3.5 px-4 whitespace-nowrap min-w-[120px]">Category</th>
                      <th className="py-3.5 px-4 whitespace-nowrap min-w-[110px]">Size/Color</th>
                      <th className="py-3.5 px-4 whitespace-nowrap min-w-[100px]">Retail Price</th>
                      <th className="py-3.5 px-4 whitespace-nowrap min-w-[110px]">Wholesale Price</th>
                      <th className="py-3.5 px-4 whitespace-nowrap min-w-[90px]">GST Rate</th>
                      <th className="py-3.5 px-4 whitespace-nowrap min-w-[90px]">Stock</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-right min-w-[110px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {products.map((product, index) => {
                      const prodKey = product.id || product.product_id || product.sku || `prod-${index}`;
                      const categoryName = product.categories?.name || product.category?.name || 'General';
                      const brandName = product.brands?.name || product.brand?.name || (brands.find((b) => b.id === (product.brand_id || product.brandId))?.name) || '—';
                      const firstVariant = (product.product_variants && product.product_variants.length > 0) ? product.product_variants[0] : null;
                      const displaySku = (product.sku && !product.sku.startsWith('SKU-179') && !product.sku.startsWith('SKU-178'))
                        ? product.sku
                        : (firstVariant?.sku || product.sku || '—');
                      const retailPrice = product.retail_price ?? product.retailPrice ?? firstVariant?.retail_price ?? 0;
                      const wholesalePrice = product.wholesale_price ?? product.wholesalePrice ?? firstVariant?.wholesale_price ?? 0;
                      const stockQty = typeof product.stockQuantity === 'number' ? product.stockQuantity :
                        (typeof product.current_stock === 'number' ? product.current_stock :
                        (typeof product.opening_stock === 'number' ? product.opening_stock :
                        (product.product_variants && product.product_variants.length > 0
                          ? product.product_variants.reduce((sum, v) => sum + Number(v.current_stock || v.opening_stock || 0), 0)
                          : 0)));
                      const gstRate = product.gst_percentage ?? (product.taxRate ? product.taxRate.rate : 5);
                      const isLowStock = Number(stockQty) <= (product.low_stock_warning || product.lowStockWarning || product.minimum_stock || 5);

                      return (
                        <tr key={prodKey} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap min-w-[170px]">
                            <Link href={`/products/${product.id}`} className="font-bold text-slate-900 hover:text-blue-600 hover:underline block leading-snug whitespace-nowrap">
                              {product.name}
                            </Link>
                            <div className="text-[11px] text-slate-500 font-mono font-medium mt-0.5 whitespace-nowrap">SKU: {displaySku}</div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-semibold">
                              {brandName}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <Badge variant="secondary">{categoryName}</Badge>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {product.product_variants && product.product_variants.length > 0 ? (
                              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                {product.product_variants.length} Variants
                              </Badge>
                            ) : product.size || product.color ? (
                              <span>{product.size || '-'} / {product.color || '-'}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-indigo-600 whitespace-nowrap">
                            {formatCurrency(retailPrice)}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                            {formatCurrency(wholesalePrice)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <Badge variant="outline">{gstRate}%</Badge>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              <span className={`font-bold ${isLowStock ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {stockQty} {product.unit || 'PCS'}
                              </span>
                              {isLowStock && (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" title="Low Stock Warning" />
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                            <Link
                              href={`/products/${product.id}`}
                              className="inline-flex p-1 text-slate-400 hover:text-blue-600 transition"
                              title="View Product & Variants"
                            >
                              <Layers className="w-4 h-4" />
                            </Link>
                            {canEdit && (
                              <button
                                onClick={() => handleOpenAddModal(product)}
                                className="p-1 text-slate-400 hover:text-indigo-600 transition"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add/Edit Product Modal */}
          <Modal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title={editingProduct ? 'Edit Product' : 'Create New Product'}
            maxWidth="max-w-2xl"
          >
            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {formError}
              </div>
            )}
            <form onSubmit={handleSaveProduct} className="space-y-4">
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
                  placeholder="Leave blank to auto-generate or type custom SKU"
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
                    {['0', '5', '12', '18', '28'].includes(String(formData.gstPercentage)) ? (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, gstPercentage: 'custom' })}
                        className="text-[11px] font-bold text-blue-600 hover:underline flex items-center space-x-0.5 cursor-pointer"
                      >
                        <span>+ Custom %</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, gstPercentage: '5' })}
                        className="text-[11px] font-bold text-slate-500 hover:text-blue-600 hover:underline flex items-center space-x-0.5 cursor-pointer"
                      >
                        <span>Standard Presets</span>
                      </button>
                    )}
                  </div>
                  {['0', '5', '12', '18', '28'].includes(String(formData.gstPercentage)) ? (
                    <Select
                      value={formData.gstPercentage}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setFormData({ ...formData, gstPercentage: '' });
                        } else {
                          setFormData({ ...formData, gstPercentage: e.target.value });
                        }
                      }}
                      options={[
                        { value: '0', label: '0% (Exempted)' },
                        { value: '5', label: '5% GST (Garments/Textile)' },
                        { value: '12', label: '12% GST' },
                        { value: '18', label: '18% GST' },
                        { value: '28', label: '28% GST' },
                        { value: 'custom', label: '⚡ Enter Custom GST Rate...' }
                      ]}
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="e.g. 7.5 or 3"
                          autoFocus
                          value={formData.gstPercentage === 'custom' ? '' : formData.gstPercentage}
                          onChange={(e) => setFormData({ ...formData, gstPercentage: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-blue-500 ring-2 ring-blue-500/20 text-sm font-semibold focus:outline-none bg-blue-50/20"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600">% GST</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, gstPercentage: '5' })}
                        className="px-3 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
                        title="Return to standard GST presets"
                      >
                        Presets
                      </button>
                    </div>
                  )}
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

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Input
                  label="Size (e.g. XL, 40)"
                  placeholder="XL"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                />
                <Input
                  label="Color"
                  placeholder="Blue"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
                <Input
                  label="Opening Stock"
                  type="number"
                  placeholder="50"
                  disabled={!!editingProduct}
                  value={formData.openingStock}
                  onChange={(e) => setFormData({ ...formData, openingStock: e.target.value })}
                />
                <Input
                  label="Low Warning"
                  type="number"
                  placeholder="5"
                  value={formData.lowStockWarning}
                  onChange={(e) => setFormData({ ...formData, lowStockWarning: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Create Category Modal */}
          <Modal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            title="Create Product Category"
          >
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <Input
                label="Category Name *"
                required
                placeholder="e.g. Men Readymade, Sarees, Fabrics"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <div className="flex justify-end space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Category</Button>
              </div>
            </form>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
