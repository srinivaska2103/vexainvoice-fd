'use client';

import React, { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { productService } from '@/services/productService';
import BarcodeSVG from '@/components/ui/BarcodeSVG';
import { Printer, Search, Tag, Layers, CheckCircle2, Box, Sparkles, Loader2, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

export default function BarcodeLabelsPage() {
  const { business, user } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [labelQuantity, setLabelQuantity] = useState(1);
  const [labelSize, setLabelSize] = useState('50x25'); // 50x25mm, 50x30mm, 80x50mm
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const printRef = useRef(null);
  const [printMode, setPrintMode] = useState('single'); // 'single' | 'all'
  const allLabelsPrintRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await productService.getProducts({ limit: 200 });
      const raw = res?.data !== undefined ? res.data : res;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.products)
        ? raw.products
        : Array.isArray(res?.products)
        ? res.products
        : [];
      setProducts(list);
      if (list.length > 0) {
        handleProductSelect(list[0]);
      }
    } catch (err) {
      toastError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = async (prod) => {
    setSelectedProduct(prod);
    setSelectedVariant(null);

    // If product already contains populated variants, use them right away
    const initialVariants = prod.product_variants || prod.variants || [];
    if (initialVariants.length > 0) {
      setVariants(initialVariants);
      setSelectedVariant(initialVariants[0]);
      return;
    }

    if (prod.has_variants) {
      try {
        const vRes = await productService.getVariants(prod.id);
        const vRaw = vRes?.data !== undefined ? vRes.data : vRes;
        const vList = Array.isArray(vRaw)
          ? vRaw
          : Array.isArray(vRaw?.variants)
          ? vRaw.variants
          : Array.isArray(vRes?.variants)
          ? vRes.variants
          : [];
        setVariants(vList);
        if (vList.length > 0) {
          setSelectedVariant(vList[0]);
        }
      } catch (e) {
        setVariants(prod.product_variants || prod.variants || []);
        if (prod.product_variants?.length > 0) {
          setSelectedVariant(prod.product_variants[0]);
        }
      }
    } else {
      setVariants([]);
    }
  };

  const isLegacy = selectedProduct && !selectedProduct.has_variants && (!variants || variants.length === 0) && (selectedProduct.sku || selectedProduct.barcode);

  const businessName = business?.business_name || business?.name || 'VEXA STORE';
  const productName = selectedProduct?.name || selectedProduct?.item_name || 'Select Product';

  const brandName = selectedProduct?.brands?.name || selectedProduct?.brand?.name || selectedProduct?.brand || '';
  const colorName = selectedVariant?.colors?.name || selectedVariant?.color?.name || selectedVariant?.color || '';
  const sizeName = selectedVariant?.sizes?.name || selectedVariant?.size?.name || selectedVariant?.size || '';
  const variantInfo = [brandName, colorName, sizeName].filter(Boolean).join(' / ');

  const sku = selectedVariant?.sku || selectedProduct?.sku || '';

  // Helper to get true barcode value (prioritizing product or variant numeric barcode over SKU)
  const getEffectiveBarcode = (v, prod) => {
    const vBarcode = v?.barcode ? String(v.barcode).trim() : '';
    const vSku = v?.sku ? String(v.sku).trim() : '';
    const prodBarcode = prod?.barcode ? String(prod.barcode).trim() : '';
    const prodSku = prod?.sku ? String(prod.sku).trim() : '';

    // If variant has its own unique barcode distinct from sku
    if (vBarcode && vBarcode !== vSku) return vBarcode;
    // If product has a barcode (e.g. numeric barcode: 0836000291452)
    if (prodBarcode) return prodBarcode;
    // Fallback to variant barcode if present
    if (vBarcode) return vBarcode;
    // Final fallback to SKU or default code
    return vSku || prodSku || '102458';
  };

  const barcodeValue = getEffectiveBarcode(selectedVariant, selectedProduct);

  const price = selectedVariant?.retail_price ?? selectedProduct?.retail_price ?? selectedProduct?.price ?? 0;

  const getLabelDimensions = () => {
    switch (labelSize) {
      case '50x30': 
        return { 
          width: '50mm', 
          height: '30mm', 
          widthPx: 250, 
          heightPx: 150, 
          barcodeHeight: 38,
          barcodeUnitWidth: 1.5,
          barcodeFontSize: 11,
          headerFontSize: 'text-[11px]',
          titleFontSize: 'text-[12px]',
          variantFontSize: 'text-[10px]',
          priceFontSize: 'text-[13px]',
          padding: 'p-2'
        };
      case '80mm': 
        return { 
          width: '80mm', 
          height: '50mm', 
          widthPx: 360, 
          heightPx: 225, 
          barcodeHeight: 65,
          barcodeUnitWidth: 2,
          barcodeFontSize: 13,
          headerFontSize: 'text-[13px]',
          titleFontSize: 'text-[15px]',
          variantFontSize: 'text-[12px]',
          priceFontSize: 'text-[16px]',
          padding: 'p-3.5'
        };
      case '80x50': 
        return { 
          width: '80mm', 
          height: '50mm', 
          widthPx: 360, 
          heightPx: 225, 
          barcodeHeight: 65,
          barcodeUnitWidth: 2,
          barcodeFontSize: 13,
          headerFontSize: 'text-[13px]',
          titleFontSize: 'text-[15px]',
          variantFontSize: 'text-[12px]',
          priceFontSize: 'text-[16px]',
          padding: 'p-3.5'
        };
      case '50x25':
      default: 
        return { 
          width: '50mm', 
          height: '25mm', 
          widthPx: 250, 
          heightPx: 125, 
          barcodeHeight: 30,
          barcodeUnitWidth: 1.4,
          barcodeFontSize: 10,
          headerFontSize: 'text-[10px]',
          titleFontSize: 'text-[11px]',
          variantFontSize: 'text-[9px]',
          priceFontSize: 'text-[12px]',
          padding: 'p-1.5'
        };
    }
  };

  // Flatten all printable labels across all products (product or each variant)
  const allProductLabels = React.useMemo(() => {
    const list = [];
    (products || []).forEach(prod => {
      const pVars = prod.product_variants || prod.variants || [];
      if (pVars.length > 0) {
        pVars.forEach(v => {
          const bName = prod.brands?.name || prod.brand?.name || prod.brand || '';
          const cName = v.colors?.name || v.color?.name || v.color || '';
          const sName = v.sizes?.name || v.size?.name || v.size || '';
          const vStr = [bName, cName, sName].filter(Boolean).join(' / ');
          list.push({
            id: `${prod.id}-${v.id}`,
            productName: prod.name,
            variantInfo: vStr,
            barcodeValue: getEffectiveBarcode(v, prod),
            price: v.retail_price ?? prod.retail_price ?? 0
          });
        });
      } else {
        const bName = prod.brands?.name || prod.brand?.name || prod.brand || '';
        list.push({
          id: prod.id,
          productName: prod.name,
          variantInfo: bName,
          barcodeValue: getEffectiveBarcode(null, prod),
          price: prod.retail_price ?? prod.price ?? 0
        });
      }
    });
    return list;
  }, [products]);

  const dims = getLabelDimensions();

  const handlePrintLabels = (targetMode = printMode) => {
    const isPrintAll = targetMode === 'all';
    const printContent = isPrintAll ? allLabelsPrintRef.current : printRef.current;
    if (!printContent) return;

    const stylesHTML = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    const windowPrint = window.open('', '_blank', 'left=0,top=0,width=700,height=800,toolbar=0,scrollbars=0,status=0');
    if (!windowPrint) return;

    let bodyHTML = '';
    if (isPrintAll) {
      // Print 1 or labelQuantity copies of EACH product / variant
      const copies = Math.max(1, parseInt(labelQuantity, 10));
      const childNodes = Array.from(printContent.children);
      const allItemsHTML = childNodes.map(node => {
        return Array.from({ length: copies }).map(() => `
          <div class="label-item">
            ${node.innerHTML}
          </div>
        `).join('');
      }).join('');

      bodyHTML = `<div class="labels-container">${allItemsHTML}</div>`;
    } else {
      // Print labelQuantity copies of the selected product
      bodyHTML = `
        <div class="labels-container">
          ${Array.from({ length: Math.max(1, parseInt(labelQuantity, 10)) }).map(() => `
            <div class="label-item">
              ${printContent.innerHTML}
            </div>
          `).join('')}
        </div>
      `;
    }

    windowPrint.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode Labels (${isPrintAll ? `All Products × ${labelQuantity}` : `${labelQuantity} Copies`})</title>
          ${stylesHTML}
          <style>
            @page {
              size: ${dims.width} ${dims.height};
              margin: 0;
            }
            body { 
              font-family: system-ui, -apple-system, sans-serif !important; 
              color: #000000 !important; 
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .label-item {
              width: ${dims.width} !important;
              height: ${dims.height} !important;
              page-break-after: always;
              box-sizing: border-box !important;
              padding: 1.5mm !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              align-items: center !important;
              text-align: center !important;
              overflow: hidden !important;
            }
            .label-item > div {
              width: 100% !important;
              height: 100% !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
            }
            @media print {
              body { background: #ffffff !important; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body style="background: #ffffff; margin: 0; padding: 0;">
          ${bodyHTML}
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

  const filteredProducts = products.filter(p => {
    const nameStr = (p.name || '').toLowerCase();
    const skuStr = (p.sku || '').toLowerCase();
    const bcStr = (p.barcode || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return nameStr.includes(q) || skuStr.includes(q) || bcStr.includes(q);
  });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
          {/* Header */}
          <div className="bg-white border border-slate-200/80 p-4 sm:p-6 rounded-2xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
                <Tag className="w-4 h-4" />
                <span>Inventory & Label Printing</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">Barcode Label Printing</h1>
              <p className="text-slate-500 text-xs mt-1">
                Print high-clarity barcode stickers for individual products, specific variants, or batch generate for your entire inventory catalog.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto">
              {allProductLabels.length > 0 && (
                <button
                  type="button"
                  onClick={() => handlePrintLabels('all')}
                  className="inline-flex items-center justify-center px-4 py-3 sm:py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer text-center"
                  title="Print one barcode sticker for every product and variant in inventory"
                >
                  <ListChecks className="w-4 h-4 mr-1.5 text-indigo-400 shrink-0" />
                  <span>Print All ({allProductLabels.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handlePrintLabels('single')}
                disabled={!selectedProduct}
                className="inline-flex items-center justify-center px-4 py-3 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-center"
              >
                <Printer className="w-4 h-4 mr-1.5 shrink-0" />
                <span>Print Selected ({labelQuantity})</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls Column */}
            <div className="lg:col-span-7 space-y-5">
              {/* Product Selection Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-2 flex items-center gap-2">
                  <Box className="w-4 h-4 text-indigo-600" />
                  <span>1. Select Product & Variant</span>
                </h2>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search product by name, SKU, or barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 min-h-[90px] flex flex-col justify-start">
                  {isLoading ? (
                    <div className="p-6 flex flex-col items-center justify-center text-slate-400 space-y-2 m-auto">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                      <span className="text-xs font-medium">Loading products...</span>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs font-medium m-auto">
                      {searchQuery ? 'No products match your search' : 'No products found'}
                    </div>
                  ) : (
                    filteredProducts.map(prod => {
                      const isSel = selectedProduct?.id === prod.id;
                      const isLeg = !prod.has_variants && (!prod.product_variants || prod.product_variants.length === 0);

                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleProductSelect(prod)}
                          className={`p-2.5 text-xs flex justify-between items-center cursor-pointer transition-colors ${
                            isSel ? 'bg-indigo-50 text-indigo-900 font-bold' : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{prod.name}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${isLeg ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                                {isLeg ? 'LEGACY' : 'MODERN'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              SKU: {prod.sku || '-'} | Barcode: {prod.barcode || '-'}
                            </p>
                          </div>
                          <span className="font-bold text-slate-900">₹{Number(prod.retail_price || 0).toFixed(2)}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Variant Selector if modern product has variants */}
                {variants.length > 0 && (
                  <div>
                    <Select
                      label="Select Variant"
                      value={selectedVariant?.id || ''}
                      onChange={(e) => {
                        const v = variants.find(x => String(x.id) === String(e.target.value));
                        setSelectedVariant(v || null);
                      }}
                      options={variants.map(v => {
                        const colorVal = v.colors?.name || v.color?.name || v.color || '';
                        const sizeVal = v.sizes?.name || v.size?.name || v.size || '';
                        const vName = v.variant_name || [colorVal, sizeVal].filter(Boolean).join(' / ') || 'Variant';
                        const vCode = getEffectiveBarcode(v, selectedProduct);
                        return {
                          value: v.id,
                          label: `${vName} — Barcode: ${vCode} — ₹${Number(v.retail_price || selectedProduct?.retail_price || 0).toFixed(2)}`
                        };
                      })}
                    />
                  </div>
                )}
              </div>

              {/* Quantity & Label Size Settings */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>2. Label Printing Configuration</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Select
                      label="Label Size"
                      value={labelSize}
                      onChange={(e) => setLabelSize(e.target.value)}
                      options={[
                        { value: '50x25', label: '50mm × 25mm (Standard Sticker)' },
                        { value: '50x30', label: '50mm × 30mm (Medium Sticker)' },
                        { value: '80mm', label: '80mm (Thermal Roll / 80mm Label)' },
                        { value: '80x50', label: '80mm × 50mm (Large Label)' }
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Number of Labels
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={labelQuantity}
                      onChange={(e) => setLabelQuantity(Math.max(1, parseInt(e.target.value || '1', 10)))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  {[1].map(qty => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setLabelQuantity(qty)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        labelQuantity === qty ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {qty} Label
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Live Preview Column */}
            <div className="lg:col-span-5">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 sticky top-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-2 flex items-center justify-between">
                  <span>Label Live Preview</span>
                  <span className="text-[10px] text-indigo-600 font-extrabold uppercase bg-indigo-50 px-2 py-0.5 rounded">
                    {dims.width} × {dims.height}
                  </span>
                </h2>

                {/* Printable Canvas Box */}
                <div className="bg-slate-100 p-3 sm:p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center min-h-[220px] overflow-x-auto">
                  <div
                    ref={printRef}
                    style={{ width: `${dims.widthPx}px`, height: `${dims.heightPx}px`, maxWidth: '100%' }}
                    className={`bg-white border-2 border-slate-800 rounded-lg ${dims.padding} flex flex-col justify-between items-center text-center text-black font-sans box-border shadow-md transition-all duration-200 shrink-0`}
                  >
                    {/* Business Header */}
                    <div className={`${dims.headerFontSize} font-black uppercase tracking-tight text-slate-900 leading-tight truncate w-full`}>
                      {businessName}
                    </div>

                    {/* Product Name */}
                    <div className={`${dims.titleFontSize} font-extrabold uppercase leading-tight text-black line-clamp-1 w-full mt-0.5`}>
                      {productName}
                    </div>

                    {/* Variant details if modern */}
                    {variantInfo ? (
                      <div className={`${dims.variantFontSize} font-semibold text-gray-700 truncate w-full`}>
                        {variantInfo}
                      </div>
                    ) : null}

                    {/* Barcode SVG */}
                    <div className="my-0.5 flex justify-center w-full overflow-hidden">
                      <BarcodeSVG 
                        value={barcodeValue} 
                        height={dims.barcodeHeight} 
                        unitWidth={dims.barcodeUnitWidth}
                        fontSize={dims.barcodeFontSize}
                        margin={2}
                        textMargin={2}
                        showText={true} 
                        containerClassName="p-0 border-0 shadow-none bg-transparent flex flex-col items-center justify-center max-w-full"
                      />
                    </div>

                    {/* Price */}
                    <div className={`${dims.priceFontSize} font-black text-black leading-none`}>
                      ₹{Number(price).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <Button
                    onClick={() => handlePrintLabels('single')}
                    disabled={!selectedProduct}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm py-2.5 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Selected ({labelQuantity} {labelQuantity === 1 ? 'Sticker' : 'Stickers'})
                  </Button>

                  {allProductLabels.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handlePrintLabels('all')}
                      className="w-full border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs py-2.5 transition-all cursor-pointer"
                    >
                      <ListChecks className="w-4 h-4 mr-2 text-indigo-600" />
                      Generate & Print For All Products ({allProductLabels.length} Items)
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Off-screen hidden container for batch printing all catalog items */}
          <div className="hidden" aria-hidden="true">
            <div ref={allLabelsPrintRef}>
              {allProductLabels.map(item => (
                <div
                  key={item.id}
                  style={{ width: `${dims.widthPx}px`, height: `${dims.heightPx}px` }}
                  className={`bg-white border-2 border-slate-800 rounded-lg ${dims.padding} flex flex-col justify-between items-center text-center text-black font-sans box-border shadow-md`}
                >
                  <div className={`${dims.headerFontSize} font-black uppercase tracking-tight text-slate-900 leading-tight truncate w-full`}>
                    {businessName}
                  </div>
                  <div className={`${dims.titleFontSize} font-extrabold uppercase leading-tight text-black line-clamp-1 w-full mt-0.5`}>
                    {item.productName}
                  </div>
                  {item.variantInfo ? (
                    <div className={`${dims.variantFontSize} font-semibold text-gray-700 truncate w-full`}>
                      {item.variantInfo}
                    </div>
                  ) : null}
                  <div className="my-0.5 flex justify-center w-full overflow-hidden">
                    <BarcodeSVG 
                      value={item.barcodeValue} 
                      height={dims.barcodeHeight} 
                      unitWidth={dims.barcodeUnitWidth}
                      fontSize={dims.barcodeFontSize}
                      margin={2}
                      textMargin={2}
                      showText={true} 
                      containerClassName="p-0 border-0 shadow-none bg-transparent flex flex-col items-center justify-center max-w-full"
                    />
                  </div>
                  <div className={`${dims.priceFontSize} font-black text-black leading-none`}>
                    ₹{Number(item.price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
