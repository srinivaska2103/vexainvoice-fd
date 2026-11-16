'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers3,
  Search,
  Plus,
  Tag,
  Palette,
  Ruler,
  Box,
  CheckCircle2,
  XCircle,
  Sparkles,
  Filter,
  RefreshCw,
  AlertCircle,
  X,
  Trash2
} from 'lucide-react';
import { masterService } from '@/services/masterService';
import { productService } from '@/services/productService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';

export default function VariantsPage() {
  const { business } = useAuth();
  const { confirm, toastSuccess, toastError } = useToast();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'brands' | 'colors' | 'sizes' | 'combinations'
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [brands, setBrands] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // Add Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [attributeType, setAttributeType] = useState('brand'); // 'brand' | 'color' | 'size'
  const [formName, setFormName] = useState('');
  const [formHexCode, setFormHexCode] = useState('#3b82f6');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteAttribute = async (type, id, name) => {
    const isConfirmed = await confirm({
      title: `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      message: `Are you sure you want to delete ${type} "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!isConfirmed) return;

    setDeletingId(id);
    try {
      if (type === 'brand') {
        await masterService.deleteBrand(id);
      } else if (type === 'color') {
        await masterService.deleteColor(id);
      } else if (type === 'size') {
        await masterService.deleteSize(id);
      }
      toastSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} "${name}" deleted successfully.`);
      await fetchData();
    } catch (err) {
      toastError(err.message || `Failed to delete ${type}.`);
    } finally {
      setDeletingId(null);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setApiError('');
    try {
      const [bRes, cRes, sRes, pRes] = await Promise.all([
        masterService.getBrands(),
        masterService.getColors(),
        masterService.getSizes(),
        productService.getProducts()
      ]);

      setBrands(bRes?.data || bRes || []);
      setColors(cRes?.data || cRes || []);
      setSizes(sRes?.data || sRes || []);

      const rawProdData = pRes?.data || pRes;
      const prodList = Array.isArray(rawProdData?.products)
        ? rawProdData.products
        : Array.isArray(rawProdData)
        ? rawProdData
        : [];
      setProducts(prodList);
    } catch (err) {
      setApiError(err.message || 'Failed to load master attributes and product variants.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute all variant combinations across products
  const allCombinations = useMemo(() => {
    const list = [];
    if (!Array.isArray(products)) return list;
    products.forEach((prod) => {
      const vars = prod.product_variants || prod.variants || [];
      if (vars && vars.length > 0) {
        vars.forEach((v) => {
          list.push({
            id: v.id,
            product_id: prod.id,
            product_name: prod.name,
            brand_name: prod.brands?.name || prod.brand?.name || (brands.find((b) => b.id === prod.brand_id)?.name) || 'N/A',
            color_name: v.colors?.name || v.color?.name || (colors.find((c) => c.id === v.color_id)?.name) || '—',
            color_hex: v.colors?.hex_code || v.color?.hex_code || (colors.find((c) => c.id === v.color_id)?.hex_code) || '',
            size_name: v.sizes?.name || v.size?.name || (sizes.find((s) => s.id === v.size_id)?.name) || '—',
            sku: v.sku || prod.sku || 'N/A',
            barcode: v.barcode || prod.barcode || 'N/A',
            retail_price: v.retail_price ?? prod.retail_price ?? 0,
            stock: v.current_stock ?? v.opening_stock ?? v.stock ?? 0,
            is_active: prod.is_active !== false
          });
        });
      }
    });
    return list;
  }, [products, brands, colors, sizes]);

  // Filtered lists based on search query
  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    return brands.filter((b) => b.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [brands, searchQuery]);

  const filteredColors = useMemo(() => {
    if (!searchQuery.trim()) return colors;
    return colors.filter((c) => c.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [colors, searchQuery]);

  const filteredSizes = useMemo(() => {
    if (!searchQuery.trim()) return sizes;
    return sizes.filter((s) => s.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [sizes, searchQuery]);

  const filteredCombinations = useMemo(() => {
    if (!searchQuery.trim()) return allCombinations;
    const q = searchQuery.toLowerCase();
    return allCombinations.filter(
      (c) =>
        c.product_name?.toLowerCase().includes(q) ||
        c.brand_name?.toLowerCase().includes(q) ||
        c.color_name?.toLowerCase().includes(q) ||
        c.size_name?.toLowerCase().includes(q) ||
        c.sku?.toLowerCase().includes(q)
    );
  }, [allCombinations, searchQuery]);

  const handleOpenAddModal = (type = 'brand') => {
    setAttributeType(type);
    setFormName('');
    setFormHexCode('#3b82f6');
    setFormSortOrder(0);
    setModalError('');
    setModalSuccess('');
    setIsAddModalOpen(true);
  };

  const handleCreateAttribute = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setModalError('Please enter a valid name.');
      return;
    }
    setModalError('');
    setModalSuccess('');
    setIsSaving(true);

    try {
      if (attributeType === 'brand') {
        await masterService.createBrand({ name: formName.trim(), is_active: true });
        setModalSuccess('Brand created successfully!');
      } else if (attributeType === 'color') {
        await masterService.createColor({ name: formName.trim(), hex_code: formHexCode });
        setModalSuccess('Color created successfully!');
      } else if (attributeType === 'size') {
        await masterService.createSize({ name: formName.trim(), sort_order: Number(formSortOrder) || 0 });
        setModalSuccess('Size created successfully!');
      }

      await fetchData();
      setTimeout(() => {
        setIsAddModalOpen(false);
      }, 1000);
    } catch (err) {
      setModalError(err.message || 'Failed to save attribute.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to count products for a specific attribute
  const getProductCountForBrand = (brandId) => {
    if (!Array.isArray(products)) return 0;
    return products.filter((p) => p.brand_id === brandId).length;
  };

  const getProductCountForColor = (colorId) => {
    if (!Array.isArray(products)) return 0;
    return products.filter((p) => {
      const vars = p.product_variants || p.variants || [];
      return vars.some((v) => v.color_id === colorId);
    }).length;
  };

  const getProductCountForSize = (sizeId) => {
    if (!Array.isArray(products)) return 0;
    return products.filter((p) => {
      const vars = p.product_variants || p.variants || [];
      return vars.some((v) => v.size_id === sizeId);
    }).length;
  };

  return (
    <ProtectedRoute permissions={['products.variants', 'products.view']}>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0 mt-0.5 sm:mt-0">
            <Layers3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Variants</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage product attributes and create product combinations easily.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <Button
            onClick={() => handleOpenAddModal(activeTab === 'colors' ? 'color' : activeTab === 'sizes' ? 'size' : 'brand')}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 sm:py-2.5 rounded-xl shadow-md shadow-blue-500/20 justify-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Attribute
          </Button>
        </div>
      </div>

      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Control Bar: Search & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto scrollbar-none w-full md:w-auto">
          {[
            { id: 'all', label: 'All', icon: Layers3 },
            { id: 'brands', label: `Brands (${brands.length})`, icon: Tag },
            { id: 'colors', label: `Colors (${colors.length})`, icon: Palette },
            { id: 'sizes', label: `Sizes (${sizes.length})`, icon: Ruler },
            { id: 'combinations', label: `Combinations (${allCombinations.length})`, icon: Box }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search variants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Spinner className="w-8 h-8 text-blue-600 mx-auto" />
          <p className="text-xs text-slate-500 mt-3">Loading product attributes & variants...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: BRANDS */}
          {(activeTab === 'all' || activeTab === 'brands') && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Brands</h2>
                </div>
                <button
                  onClick={() => handleOpenAddModal('brand')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Brand</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 whitespace-nowrap min-w-[120px]">Brand Name</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[90px]">Status</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[140px]">Associated Products</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap min-w-[90px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredBrands.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          No brands found. Click "+ Add Attribute" to create a new brand.
                        </td>
                      </tr>
                    ) : (
                      filteredBrands.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                            <Tag className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{b.name}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-600">
                            {getProductCountForBrand(b.id)} Products
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteAttribute('brand', b.id, b.name)}
                              disabled={deletingId === b.id}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition border border-rose-200 shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{deletingId === b.id ? 'Deleting...' : 'Delete'}</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: COLORS */}
          {(activeTab === 'all' || activeTab === 'colors') && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Palette className="w-4 h-4 text-purple-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Colors</h2>
                </div>
                <button
                  onClick={() => handleOpenAddModal('color')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Color</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 whitespace-nowrap min-w-[120px]">Color Name</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[110px]">Color Preview</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[90px]">Status</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[140px]">Associated Products</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap min-w-[90px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredColors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          No colors found. Click "+ Add Attribute" to create a new color.
                        </td>
                      </tr>
                    ) : (
                      filteredColors.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <span
                                className="w-6 h-6 rounded-full border border-slate-300 shadow-xs inline-block"
                                style={{ backgroundColor: c.hex_code || '#cbd5e1' }}
                              />
                              <span className="text-xs font-mono text-slate-500 uppercase">
                                {c.hex_code || '#—'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-600">
                            {getProductCountForColor(c.id)} Products
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteAttribute('color', c.id, c.name)}
                              disabled={deletingId === c.id}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition border border-rose-200 shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{deletingId === c.id ? 'Deleting...' : 'Delete'}</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SIZES */}
          {(activeTab === 'all' || activeTab === 'sizes') && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Ruler className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Sizes</h2>
                </div>
                <button
                  onClick={() => handleOpenAddModal('size')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Size</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 whitespace-nowrap min-w-[120px]">Size Name</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[90px]">Status</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[140px]">Associated Products</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap min-w-[90px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredSizes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          No sizes found. Click "+ Add Attribute" to create a new size.
                        </td>
                      </tr>
                    ) : (
                      filteredSizes.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-mono">
                              {s.name}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-600">
                            {getProductCountForSize(s.id)} Products
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteAttribute('size', s.id, s.name)}
                              disabled={deletingId === s.id}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition border border-rose-200 shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{deletingId === s.id ? 'Deleting...' : 'Delete'}</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: COMBINATIONS */}
          {(activeTab === 'all' || activeTab === 'combinations') && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Box className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Variant Combinations ({filteredCombinations.length})
                  </h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 whitespace-nowrap min-w-[140px]">Product</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[100px]">Brand</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[110px]">Color</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[80px]">Size</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[170px]">SKU</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[90px]">Stock</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[90px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredCombinations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No variant combinations recorded yet. Create products with variants to see them listed here.
                        </td>
                      </tr>
                    ) : (
                      filteredCombinations.map((c, idx) => (
                        <tr key={c.id || idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{c.product_name}</td>
                          <td className="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">{c.brand_name}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {c.color_hex && (
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                                  style={{ backgroundColor: c.color_hex }}
                                />
                              )}
                              <span>{c.color_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-mono text-[11px]">
                              {c.size_name}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{c.sku}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`font-semibold ${
                                c.stock > 10
                                  ? 'text-emerald-700'
                                  : c.stock > 0
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {c.stock} pcs
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD ATTRIBUTE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add New Attribute</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateAttribute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Attribute Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'brand', label: 'Brand', icon: Tag },
                    { id: 'color', label: 'Color', icon: Palette },
                    { id: 'size', label: 'Size', icon: Ruler }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = attributeType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAttributeType(item.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic inputs based on type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {attributeType === 'brand'
                    ? 'Brand Name'
                    : attributeType === 'color'
                    ? 'Color Name'
                    : 'Size Name'}{' '}
                  *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    attributeType === 'brand'
                      ? 'e.g. Nike, Raymond, Allen Solly'
                      : attributeType === 'color'
                      ? 'e.g. Royal Blue, Crimson Red, Navy'
                      : 'e.g. S, M, L, XL, 32, 34'
                  }
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {attributeType === 'color' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Color Code / Color Swatch
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formHexCode}
                      onChange={(e) => setFormHexCode(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="#0000FF"
                      value={formHexCode}
                      onChange={(e) => setFormHexCode(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 uppercase"
                    />
                  </div>
                </div>
              )}

              {attributeType === 'size' && null}

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm"
                >
                  Save Attribute
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
