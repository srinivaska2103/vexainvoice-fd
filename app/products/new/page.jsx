'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Package,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Sparkles,
  Layers3,
  CheckCircle2,
  AlertCircle,
  Tag,
  Palette,
  Ruler,
  Check,
  X,
  RefreshCw,
  ScanBarcode
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import CameraBarcodeScannerModal from '@/components/CameraBarcodeScannerModal';
import { Modal } from '@/components/ui/Modal';
import { masterService } from '@/services/masterService';
import { productService } from '@/services/productService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';

function NewProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBarcode = searchParams?.get('barcode') || '';

  const { business } = useAuth();
  const { toastWarning, toastError, toastSuccess } = useToast();
  const businessType = business?.business_type || 'GARMENT_TEXTILE';

  // Step State: 1 = Basic Info, 2 = Pricing & Stock, 3 = Variants
  const [currentStep, setCurrentStep] = useState(1);

  // Master Data State
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [isLoadingMasters, setIsLoadingMasters] = useState(true);

  // Form Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1 & 2: Basic Info & Base Pricing
  const [basicData, setBasicData] = useState({
    name: '',
    category_id: '',
    brand_id: '',
    unit: 'PCS',
    hsn_code: '',
    gst_percentage: '5',
    sku: '',
    barcode: initialBarcode,
    description: '',

    // Pricing & Stock
    purchase_price: '',
    retail_price: '',
    wholesale_price: '',
    dealer_price: '',
    minimum_stock: '5',
    opening_stock: '0',

    // Variants toggle
    has_variants: true
  });

  // Step 3: Single Variant Builder Input State
  const [singleVariant, setSingleVariant] = useState({
    color_id: '',
    size_id: '',
    sku: '',
    barcode: '',
    purchase_price: '',
    retail_price: '',
    wholesale_price: '',
    dealer_price: '',
    opening_stock: '10'
  });

  // Created Variants List
  const [variantsList, setVariantsList] = useState([]);

  // Inline Quick Modals & Bulk Matrix State
  const [quickModalType, setQuickModalType] = useState(null); // 'brand' | 'color' | 'size' | 'bulk' | null
  const [quickName, setQuickName] = useState('');
  const [quickHexCode, setQuickHexCode] = useState('#3b82f6');
  const [quickSortOrder, setQuickSortOrder] = useState(0);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState('');

  // Bulk Matrix Builder State
  const [bulkColors, setBulkColors] = useState([]);
  const [bulkSizes, setBulkSizes] = useState([]);
  const [generatedCombinations, setGeneratedCombinations] = useState([]);

  // Camera Barcode Scanner State
  const [isProductCameraOpen, setIsProductCameraOpen] = useState(false);
  const [duplicateConflict, setDuplicateConflict] = useState(null);

  const handleProductCameraScan = (decodedText) => {
    setBasicData((prev) => ({ ...prev, barcode: decodedText, sku: prev.sku || decodedText }));
    toastSuccess(`Scanned barcode: ${decodedText}`);
    setIsProductCameraOpen(false);
  };

  // Fetch Master Data
  const fetchMasters = async () => {
    setIsLoadingMasters(true);
    try {
      const [catRes, brandRes, colorRes, sizeRes] = await Promise.all([
        masterService.getCategories(),
        masterService.getBrands(),
        masterService.getColors(),
        masterService.getSizes()
      ]);

      const catList = catRes?.data || catRes || [];
      const brandList = brandRes?.data || brandRes || [];
      const colorList = colorRes?.data || colorRes || [];
      const sizeList = sizeRes?.data || sizeRes || [];

      setCategories(catList);
      setBrands(brandList);
      setColors(colorList);
      setSizes(sizeList);

      if (catList.length > 0 && !basicData.category_id) {
        setBasicData((prev) => ({ ...prev, category_id: catList[0].id }));
      }
      if (brandList.length > 0 && !basicData.brand_id) {
        setBasicData((prev) => ({ ...prev, brand_id: brandList[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMasters(false);
    }
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  // Sync pricing defaults into single variant builder when user changes base prices
  useEffect(() => {
    setSingleVariant((prev) => ({
      ...prev,
      purchase_price: basicData.purchase_price || prev.purchase_price,
      retail_price: basicData.retail_price || prev.retail_price,
      wholesale_price: basicData.wholesale_price || prev.wholesale_price,
      dealer_price: basicData.dealer_price || prev.dealer_price
    }));
  }, [basicData.purchase_price, basicData.retail_price, basicData.wholesale_price, basicData.dealer_price]);

  // Handle Quick Master Attribute Creation (+ Add Brand, + Add Color, + Add Size)
  const handleQuickCreateAttribute = async (e) => {
    e.preventDefault();
    if (!quickName.trim()) {
      setQuickError('Please enter a name.');
      return;
    }
    setQuickError('');
    setQuickSaving(true);
    try {
      if (quickModalType === 'category') {
        const res = await masterService.createCategory({ name: quickName.trim(), is_active: true });
        const newCategory = res?.data || res;
        await fetchMasters();
        if (newCategory?.id) {
          setBasicData((prev) => ({ ...prev, category_id: newCategory.id }));
        }
      } else if (quickModalType === 'brand') {
        const res = await masterService.createBrand({ name: quickName.trim(), is_active: true });
        const newBrand = res?.data || res;
        await fetchMasters();
        if (newBrand?.id) {
          setBasicData((prev) => ({ ...prev, brand_id: newBrand.id }));
        }
      } else if (quickModalType === 'color') {
        const res = await masterService.createColor({ name: quickName.trim(), hex_code: quickHexCode });
        const newColor = res?.data || res;
        await fetchMasters();
        if (newColor?.id) {
          setSingleVariant((prev) => ({ ...prev, color_id: newColor.id }));
        }
      } else if (quickModalType === 'size') {
        const res = await masterService.createSize({ name: quickName.trim(), sort_order: Number(quickSortOrder) || 0 });
        const newSize = res?.data || res;
        await fetchMasters();
        if (newSize?.id) {
          setSingleVariant((prev) => ({ ...prev, size_id: newSize.id }));
        }
      }
      setQuickModalType(null);
      setQuickName('');
    } catch (err) {
      setQuickError(err.message || 'Failed to create attribute.');
    } finally {
      setQuickSaving(false);
    }
  };

  // Helper to sanitize slug
  const sanitizeSlug = (str) => {
    if (!str) return '';
    return str
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Determine product code prefix from brand, category, or product name
  const getDerivedProductCode = () => {
    const selectedBrandObj = brands.find((b) => b.id === basicData.brand_id);
    const selectedCatObj = categories.find((c) => c.id === basicData.category_id);
    const sBrand = sanitizeSlug(selectedBrandObj?.name || '');
    const sCat = sanitizeSlug(selectedCatObj?.name || '');
    const sName = sanitizeSlug(basicData.name || 'PROD');

    if (sBrand && sCat) return `${sBrand}-${sCat}`;
    if (sBrand && sName) {
      if (sName.startsWith(sBrand)) return sName;
      return `${sBrand}-${sName}`;
    }
    return sName || 'PROD';
  };

  // Helper to get next sequence for a size among already added variants in form
  const getNextSequenceForSize = (sizeCode, currentList = variantsList) => {
    const pCode = getDerivedProductCode();
    const prefix = `${pCode}-${sizeCode}`;
    let maxSeq = 0;
    for (const v of currentList) {
      if (!v.sku) continue;
      const regex = new RegExp(`^${prefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}-(\\d+)$`, 'i');
      const match = v.sku.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
    return maxSeq + 1;
  };

  // Single Variant Add
  const handleAddSingleVariant = () => {
    if (!singleVariant.color_id && !singleVariant.size_id) {
      toastWarning('Please select at least a Color or a Size for the variant.');
      return;
    }

    const selectedColorObj = colors.find((c) => c.id === singleVariant.color_id);
    const selectedSizeObj = sizes.find((s) => s.id === singleVariant.size_id);

    const sizeCode = sanitizeSlug(selectedSizeObj?.name || 'STD');
    const productCode = getDerivedProductCode();
    const nextSeq = getNextSequenceForSize(sizeCode, variantsList);
    const seqStr = String(nextSeq).padStart(3, '0');

    const generatedSku = `${productCode}-${sizeCode}-${seqStr}`;
    const autoSku = singleVariant.sku.trim() || generatedSku;

    const newVar = {
      id: 'var-' + Date.now() + '-' + Math.random(),
      color_id: singleVariant.color_id || null,
      color_name: selectedColorObj?.name || 'N/A',
      color_hex: selectedColorObj?.hex_code || '',
      size_id: singleVariant.size_id || null,
      size_name: selectedSizeObj?.name || 'N/A',
      sku: autoSku,
      barcode: singleVariant.barcode.trim() || autoSku,
      purchase_price: parseFloat(singleVariant.purchase_price || basicData.purchase_price || 0),
      retail_price: parseFloat(singleVariant.retail_price || basicData.retail_price || 0),
      wholesale_price: parseFloat(singleVariant.wholesale_price || basicData.wholesale_price || 0),
      dealer_price: parseFloat(singleVariant.dealer_price || basicData.dealer_price || 0),
      opening_stock: parseFloat(singleVariant.opening_stock || 0)
    };

    setVariantsList((prev) => [...prev, newVar]);

    // Reset single variant form
    setSingleVariant({
      color_id: '',
      size_id: '',
      sku: '',
      barcode: '',
      purchase_price: basicData.purchase_price,
      retail_price: basicData.retail_price,
      wholesale_price: basicData.wholesale_price,
      dealer_price: basicData.dealer_price,
      opening_stock: '10'
    });
  };

  const handleRemoveVariant = (index) => {
    setVariantsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateVariantSku = (index, newSku) => {
    setVariantsList((prev) =>
      prev.map((v, i) => {
        if (i === index) {
          const trimmedSku = newSku.toUpperCase();
          return {
            ...v,
            sku: trimmedSku,
            barcode: v.barcode === v.sku || !v.barcode ? trimmedSku : v.barcode
          };
        }
        return v;
      })
    );
  };

  // Generate Bulk Combinations
  const handleGenerateBulkCombinations = () => {
    if (bulkColors.length === 0 || bulkSizes.length === 0) {
      toastWarning('Please select at least one Color and one Size to generate combinations.');
      return;
    }

    const combos = [];
    const productCode = getDerivedProductCode();
    // Keep local tracker per sizeCode
    const sizeSeqTracker = {};

    bulkSizes.forEach((sId) => {
      const sObj = sizes.find((s) => s.id === sId);
      const sizeCode = sanitizeSlug(sObj?.name || 'STD');
      sizeSeqTracker[sizeCode] = getNextSequenceForSize(sizeCode, variantsList);

      bulkColors.forEach((cId) => {
        const cObj = colors.find((c) => c.id === cId);
        const curSeq = sizeSeqTracker[sizeCode];
        sizeSeqTracker[sizeCode] = curSeq + 1;
        const seqStr = String(curSeq).padStart(3, '0');
        const autoSku = `${productCode}-${sizeCode}-${seqStr}`;

        combos.push({
          id: 'combo-' + Math.random(),
          color_id: cId,
          color_name: cObj?.name,
          color_hex: cObj?.hex_code,
          size_id: sId,
          size_name: sObj?.name,
          sku: autoSku,
          barcode: autoSku,
          purchase_price: parseFloat(basicData.purchase_price || 0),
          retail_price: parseFloat(basicData.retail_price || 0),
          wholesale_price: parseFloat(basicData.wholesale_price || 0),
          dealer_price: parseFloat(basicData.dealer_price || 0),
          opening_stock: 10
        });
      });
    });

    setGeneratedCombinations(combos);
  };

  const handleApplyBulkCombinations = () => {
    setVariantsList((prev) => [...prev, ...generatedCombinations]);
    setGeneratedCombinations([]);
    setBulkColors([]);
    setBulkSizes([]);
    setQuickModalType(null);
  };

  // Final Form Submission
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!basicData.name.trim()) {
      setApiError('Product name is required.');
      setCurrentStep(1);
      return;
    }

    setApiError('');
    setIsSubmitting(true);

    try {
      const payload = {
        name: basicData.name.trim(),
        category_id: basicData.category_id || null,
        brand_id: basicData.brand_id || null,
        unit: basicData.unit,
        hsn_code: basicData.hsn_code || null,
        gst_percentage: parseFloat(basicData.gst_percentage || 0),
        sku: basicData.sku || null,
        barcode: basicData.barcode || null,
        description: basicData.description || null,
        purchase_price: parseFloat(basicData.purchase_price || 0),
        retail_price: parseFloat(basicData.retail_price || 0),
        wholesale_price: parseFloat(basicData.wholesale_price || basicData.retail_price || 0),
        dealer_price: parseFloat(basicData.dealer_price || basicData.retail_price || 0),
        minimum_stock: parseFloat(basicData.minimum_stock || 0),
        opening_stock: parseFloat(basicData.opening_stock || 0),
        has_variants: basicData.has_variants && variantsList.length > 0,
        variants: basicData.has_variants
          ? variantsList.map((v) => ({
              color_id: v.color_id || null,
              size_id: v.size_id || null,
              variant_name: `${v.color_name} / ${v.size_name}`,
              sku: v.sku,
              barcode: v.barcode,
              purchase_price: v.purchase_price,
              retail_price: v.retail_price,
              wholesale_price: v.wholesale_price,
              dealer_price: v.dealer_price,
              opening_stock: v.opening_stock
            }))
          : []
      };

      const response = await productService.createProduct(payload);
      if (response.success || response.data) {
        toastSuccess('Product and variants saved successfully!');
        setSuccessMsg('Product created successfully with variants! Redirecting to products list...');
        router.push('/products');
      }
    } catch (err) {
      const existingId = err.data?.data?.existingProductId || err.data?.existingProductId;
      if (existingId) {
        setDuplicateConflict({
          message: err.message || 'This barcode is already registered.',
          productId: existingId
        });
      }
      setApiError(err.message || 'Failed to save product. Please check fields.');
      toastError(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBrandObj = brands.find((b) => b.id === basicData.brand_id);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6 pb-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center space-x-3">
              <Link
                href="/products"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Create New Product</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Step {currentStep} of 3 — Unifying Product Details, Prices & Variant Combinations
                </p>
              </div>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
              {[
                { step: 1, label: '1. Basic Info' },
                { step: 2, label: '2. Pricing' },
                { step: 3, label: '3. Variants' }
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setCurrentStep(s.step)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer text-center ${
                    currentStep === s.step
                      ? 'bg-blue-600 text-white shadow-xs'
                      : currentStep > s.step
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {duplicateConflict && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-bold text-amber-950">Barcode Already Exists</p>
                  <p className="text-amber-800 text-[11px] mt-0.5">{duplicateConflict.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/products/${duplicateConflict.productId}`}
                  className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  Open Existing Product →
                </Link>
                <button
                  type="button"
                  onClick={() => setDuplicateConflict(null)}
                  className="px-2.5 py-1.5 text-amber-700 hover:text-amber-900 font-semibold text-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {apiError && !duplicateConflict && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{apiError}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {isLoadingMasters ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <Spinner className="w-8 h-8 text-blue-600 mx-auto" />
              <p className="text-xs text-slate-500 mt-3">Loading categories, brands, colors & sizes...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitProduct} className="space-y-6">
              {/* STEP 1: BASIC INFORMATION */}
              {currentStep === 1 && (
                <Card className="p-6 sm:p-8 space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      <span>Step 1: Basic Information</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Specify standard details for cataloging your product.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Slim Fit Cotton Formal Shirt"
                        value={basicData.name}
                        onChange={(e) => {
                          setBasicData((prev) => ({
                            ...prev,
                            name: e.target.value
                          }));
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                      />
                    </div>

                    {/* Category with Inline "+ Add Category" button */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Category
                        </label>
                        <button
                          type="button"
                          onClick={() => setQuickModalType('category')}
                          className="text-[11px] font-bold text-blue-600 hover:underline flex items-center space-x-0.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Category</span>
                        </button>
                      </div>
                      <Select
                        placeholder="Select Category..."
                        value={basicData.category_id}
                        onChange={(e) => setBasicData({ ...basicData, category_id: e.target.value })}
                        options={categories.map((c) => ({ value: c.id, label: c.name }))}
                      />
                    </div>

                    {/* Brand with Inline "+ Add Brand" button */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Brand
                        </label>
                        <button
                          type="button"
                          onClick={() => setQuickModalType('brand')}
                          className="text-[11px] font-bold text-blue-600 hover:underline flex items-center space-x-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Brand</span>
                        </button>
                      </div>
                      <Select
                        placeholder="Select Brand..."
                        value={basicData.brand_id}
                        onChange={(e) => setBasicData({ ...basicData, brand_id: e.target.value })}
                        options={brands.map((b) => ({ value: b.id, label: b.name }))}
                      />
                    </div>

                    <Select
                      label="Unit of Measurement"
                      value={basicData.unit}
                      onChange={(e) => setBasicData({ ...basicData, unit: e.target.value })}
                      options={[
                        { value: 'PCS', label: 'Pieces (PCS)' },
                        { value: 'DOZEN', label: 'Dozen (DOZEN)' },
                        { value: 'BOX', label: 'Box (BOX)' },
                        { value: 'BUNDLE', label: 'Bundle' },
                        { value: 'METER', label: 'Meter' },
                        { value: 'ROLL', label: 'Roll' },
                        { value: 'SET', label: 'Set' }
                      ]}
                    />

                    <Input
                      label="HSN Code"
                      placeholder="e.g. 6205"
                      value={basicData.hsn_code}
                      onChange={(e) => setBasicData({ ...basicData, hsn_code: e.target.value })}
                    />

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          GST Tax Rate (%)
                        </label>
                        {['0', '5', '12', '18', '28'].includes(String(basicData.gst_percentage)) ? (
                          <button
                            type="button"
                            onClick={() => setBasicData({ ...basicData, gst_percentage: 'custom' })}
                            className="text-[11px] font-bold text-blue-600 hover:underline flex items-center space-x-0.5 cursor-pointer"
                          >
                            <span>+ Custom %</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setBasicData({ ...basicData, gst_percentage: '5' })}
                            className="text-[11px] font-bold text-slate-500 hover:text-blue-600 hover:underline flex items-center space-x-0.5 cursor-pointer"
                          >
                            <span>Standard Presets</span>
                          </button>
                        )}
                      </div>

                      {['0', '5', '12', '18', '28'].includes(String(basicData.gst_percentage)) ? (
                        <Select
                          value={basicData.gst_percentage}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setBasicData({ ...basicData, gst_percentage: '' });
                            } else {
                              setBasicData({ ...basicData, gst_percentage: e.target.value });
                            }
                          }}
                          options={[
                            { value: '0', label: '0% (Exempted)' },
                            { value: '5', label: '5% GST (Garment/Textile)' },
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
                              value={basicData.gst_percentage === 'custom' ? '' : basicData.gst_percentage}
                              onChange={(e) => setBasicData({ ...basicData, gst_percentage: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-blue-500 ring-2 ring-blue-500/20 text-sm font-semibold focus:outline-none bg-blue-50/20"
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600">% GST</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setBasicData({ ...basicData, gst_percentage: '5' })}
                            className="px-3 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
                            title="Return to standard GST presets"
                          >
                            Presets
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Barcode / EAN Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Barcode / EAN
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsProductCameraOpen(true)}
                          className="text-[11px] font-bold text-blue-600 hover:underline flex items-center space-x-1"
                        >
                          <ScanBarcode className="w-3.5 h-3.5" />
                          <span>Scan with Camera</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. 8901234567890 or scan tag"
                          value={basicData.barcode}
                          onChange={(e) => setBasicData({ ...basicData, barcode: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-semibold"
                        />
                        {basicData.barcode && (
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Prefilled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 pb-2">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs w-full sm:w-auto py-3 sm:py-2.5 rounded-xl shadow-md shadow-blue-500/20 justify-center"
                    >
                      Next: Pricing & Stock
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* STEP 2: PRICING & STOCK */}
              {currentStep === 2 && (
                <Card className="p-6 sm:p-8 space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <Tag className="w-5 h-5 text-blue-600" />
                      <span>Step 2: Base Pricing & Stock</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure baseline purchase, retail, and wholesale pricing.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Purchase Price (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={basicData.purchase_price}
                        onChange={(e) => setBasicData({ ...basicData, purchase_price: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Retail Price (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="0.00"
                        value={basicData.retail_price}
                        onChange={(e) => setBasicData({ ...basicData, retail_price: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Wholesale Price (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={basicData.wholesale_price}
                        onChange={(e) => setBasicData({ ...basicData, wholesale_price: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Dealer Price (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={basicData.dealer_price}
                        onChange={(e) => setBasicData({ ...basicData, dealer_price: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <Input
                      label="Minimum Alert Stock"
                      type="number"
                      value={basicData.minimum_stock}
                      onChange={(e) => setBasicData({ ...basicData, minimum_stock: e.target.value })}
                    />
                    <Input
                      label="Opening Base Stock (pcs)"
                      type="number"
                      value={basicData.opening_stock}
                      onChange={(e) => setBasicData({ ...basicData, opening_stock: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 pb-2 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="text-xs justify-center rounded-xl py-3 sm:py-2">
                      <ArrowLeft className="w-4 h-4 mr-1.5" />
                      Back to Basic Info
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 sm:py-2.5 rounded-xl shadow-md shadow-blue-500/20 justify-center"
                    >
                      Next: Variants Builder
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* STEP 3: VARIANTS BUILDER */}
              {currentStep === 3 && (
                <Card className="p-6 sm:p-8 space-y-6">
                  <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                        <Layers3 className="w-5 h-5 text-blue-600" />
                        <span>Step 3: Variant Management</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Build single or multiple matrix variants (Brand / Color / Size combinations).
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-700 px-2">Does this product have variants?</span>
                      <button
                        type="button"
                        onClick={() => setBasicData({ ...basicData, has_variants: !basicData.has_variants })}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          basicData.has_variants ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600'
                        }`}
                      >
                        {basicData.has_variants ? 'Yes' : 'No'}
                      </button>
                    </div>
                  </div>

                  {basicData.has_variants && (
                    <div className="space-y-6">
                      {/* Top Action Toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/70 p-4 rounded-2xl border border-blue-100">
                        <div>
                          <h3 className="text-xs font-bold text-blue-900">Garment & Textile Matrix Builder</h3>
                          <p className="text-[11px] text-blue-700 mt-0.5">
                            Selected Brand:{' '}
                            <strong className="text-blue-900">{selectedBrandObj?.name || 'Default Brand'}</strong>
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setQuickModalType('bulk')}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                        >
                          <Sparkles className="w-4 h-4 mr-1.5" />
                          Create Multiple Variants (Bulk Matrix)
                        </Button>
                      </div>

                      {/* SINGLE VARIANT FORM BUILDER */}
                      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                          <span>Add Single Variant</span>
                          <span className="text-[11px] font-normal text-slate-500">
                            Or use Bulk Matrix button above for fast generation
                          </span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          {/* Color Select + Inline Add Color */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-semibold text-slate-700">Color</label>
                              <button
                                type="button"
                                onClick={() => setQuickModalType('color')}
                                className="text-[10px] text-blue-600 hover:underline font-bold"
                              >
                                + Add
                              </button>
                            </div>
                            <Select
                              size="sm"
                              placeholder="Select Color..."
                              value={singleVariant.color_id}
                              onChange={(e) => setSingleVariant({ ...singleVariant, color_id: e.target.value })}
                              options={colors.map((c) => ({ value: c.id, label: c.name }))}
                            />
                          </div>

                          {/* Size Select + Inline Add Size */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-semibold text-slate-700">Size</label>
                              <button
                                type="button"
                                onClick={() => setQuickModalType('size')}
                                className="text-[10px] text-blue-600 hover:underline font-bold"
                              >
                                + Add
                              </button>
                            </div>
                            <Select
                              size="sm"
                              placeholder="Select Size..."
                              value={singleVariant.size_id}
                              onChange={(e) => setSingleVariant({ ...singleVariant, size_id: e.target.value })}
                              options={sizes.map((s) => ({ value: s.id, label: s.name }))}
                            />
                          </div>

                          {/* Custom SKU override (Optional) */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-semibold text-slate-700">Custom SKU</label>
                              <span className="text-[10px] text-slate-400">Optional</span>
                            </div>
                            <input
                              type="text"
                              placeholder="Auto-generated if empty"
                              value={singleVariant.sku}
                              onChange={(e) => setSingleVariant({ ...singleVariant, sku: e.target.value.toUpperCase() })}
                              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono uppercase focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>

                          <div className="flex items-end">
                            <Button
                              type="button"
                              onClick={handleAddSingleVariant}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-[38px] rounded-xl font-semibold shadow-xs"
                            >
                              + Add Variant
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* CREATED VARIANTS TABLE */}
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Generated Variants ({variantsList.length})
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase">
                                <th className="py-2.5 px-3">Brand</th>
                                <th className="py-2.5 px-3">Color</th>
                                <th className="py-2.5 px-3">Size</th>
                                <th className="py-2.5 px-3">Auto SKU</th>
                                <th className="py-2.5 px-3">Barcode</th>
                                <th className="py-2.5 px-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {variantsList.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="py-6 text-center text-slate-400">
                                    No variants added yet. Click "+ Add Variant" or use "Create Multiple Variants".
                                  </td>
                                </tr>
                              ) : (
                                variantsList.map((v, idx) => (
                                  <tr key={v.id || idx} className="hover:bg-slate-50/60">
                                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                                      {selectedBrandObj?.name || 'N/A'}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <div className="flex items-center space-x-1.5">
                                        {v.color_hex && (
                                          <span
                                            className="w-3 h-3 rounded-full border border-slate-300"
                                            style={{ backgroundColor: v.color_hex }}
                                          />
                                        )}
                                        <span>{v.color_name}</span>
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-mono text-[11px]">
                                        {v.size_name}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3">
                                      <div className="relative flex items-center">
                                        <input
                                          type="text"
                                          value={v.sku}
                                          onChange={(e) => handleUpdateVariantSku(idx, e.target.value)}
                                          className="w-full max-w-[210px] px-2.5 py-1 text-xs font-mono font-bold text-blue-900 bg-blue-50/70 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 focus:bg-white uppercase transition-all"
                                          title="Click to edit SKU"
                                        />
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                                      {v.barcode}
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveVariant(idx)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submission buttons */}
                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 pb-2 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="text-xs justify-center rounded-xl py-3 sm:py-2">
                      <ArrowLeft className="w-4 h-4 mr-1.5" />
                      Back to Pricing
                    </Button>

                    <Button
                      type="submit"
                      isLoading={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3.5 sm:py-2.5 rounded-xl shadow-md shadow-blue-500/20 justify-center"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Save Product & Variants
                    </Button>
                  </div>
                </Card>
              )}
            </form>
          )}

          {/* INLINE ATTRIBUTE / BULK MATRIX MODAL */}
          {quickModalType && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    {quickModalType === 'bulk'
                      ? 'Bulk Variant Combinations Generator'
                      : `Quick Add ${quickModalType.toUpperCase()}`}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setQuickModalType(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {quickError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                    {quickError}
                  </div>
                )}

                {/* BULK MATRIX GENERATOR MODAL */}
                {quickModalType === 'bulk' ? (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500">
                      Select colors and sizes to auto-generate all possible matrix combinations.
                    </p>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                        Select Colors ({bulkColors.length} selected)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                        {colors.map((c) => {
                          const isChecked = bulkColors.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setBulkColors((prev) =>
                                  isChecked ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                                );
                              }}
                              className={`flex items-center space-x-2 p-2 rounded-xl border text-xs text-left transition-all ${
                                isChecked ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {c.hex_code && (
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                                  style={{ backgroundColor: c.hex_code }}
                                />
                              )}
                              <span className="truncate">{c.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                        Select Sizes ({bulkSizes.length} selected)
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                        {sizes.map((s) => {
                          const isChecked = bulkSizes.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setBulkSizes((prev) =>
                                  isChecked ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                                );
                              }}
                              className={`p-2 rounded-xl border text-xs font-mono text-center transition-all ${
                                isChecked ? 'bg-blue-600 border-blue-600 text-white font-bold' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {s.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="button"
                        onClick={handleGenerateBulkCombinations}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                      >
                        Generate Matrix Combinations ({bulkColors.length * bulkSizes.length})
                      </Button>
                    </div>

                    {generatedCombinations.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-900">
                          Generated ({generatedCombinations.length} combinations)
                        </h4>
                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                          {generatedCombinations.map((combo, idx) => (
                            <div key={idx} className="p-2 flex items-center justify-between hover:bg-slate-50">
                              <span className="font-semibold text-slate-800">
                                {combo.color_name} / {combo.size_name}
                              </span>
                              <span className="font-mono text-slate-500">{combo.sku}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                          <Button
                            type="button"
                            onClick={handleApplyBulkCombinations}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                          >
                            Insert {generatedCombinations.length} Variants
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* SINGLE ATTRIBUTE QUICK ADD FORM */
                  <form onSubmit={handleQuickCreateAttribute} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        {quickModalType === 'category'
                          ? 'Category Name'
                          : quickModalType === 'brand'
                          ? 'Brand Name'
                          : quickModalType === 'color'
                          ? 'Color Name'
                          : 'Size Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={
                          quickModalType === 'category'
                            ? 'e.g. Sarees, Shirts, Chudidhar...'
                            : 'Enter name'
                        }
                        value={quickName}
                        onChange={(e) => setQuickName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    {quickModalType === 'color' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Color Swatch Code
                        </label>
                        <input
                          type="color"
                          value={quickHexCode}
                          onChange={(e) => setQuickHexCode(e.target.value)}
                          className="w-full h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
                        />
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                      <Button type="button" variant="outline" onClick={() => setQuickModalType(null)} className="text-xs">
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        isLoading={quickSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
                      >
                        Save & Select
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* High Performance Camera Barcode & QR Scanner Modal */}
          <CameraBarcodeScannerModal
            isOpen={isProductCameraOpen}
            onClose={() => setIsProductCameraOpen(false)}
            onScanSuccess={handleProductCameraScan}
            title="Scan Product Barcode / EAN"
            description="Point your camera at a physical product barcode. The scanned value will auto-fill into the Base Barcode field."
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Spinner /></div>}>
      <NewProductContent />
    </Suspense>
  );
}
