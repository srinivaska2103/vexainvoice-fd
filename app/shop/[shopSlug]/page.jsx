'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  Store,
  Search,
  Tag,
  Layers,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Package,
  Boxes,
  Shirt,
  Sparkles,
  Barcode,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  ArrowRight,
  ShieldCheck,
  Check,
  Calendar,
  Clock,
  User,
  Send,
  FileCheck,
  RefreshCw,
  ReceiptIndianRupee,
  XCircle,
  Award,
  Filter,
  Grid3X3,
  Palette,
  Heart,
  Headphones,
  Armchair,
  Sparkle,
  Watch,
  Footprints,
  Flame,
  LayoutGrid,
  Crown
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { getApiBaseUrl } from '@/lib/axios';

export default function CustomerShopCataloguePage() {
  const params = useParams();
  const shopSlug = params?.shopSlug;

  const [shopData, setShopData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [entitlement, setEntitlement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedSize, setSelectedSize] = useState('ALL');
  const [selectedColor, setSelectedColor] = useState('ALL');
  const [activeFilterTab, setActiveFilterTab] = useState('ALL'); // 'ALL' | 'CATEGORY' | 'BRAND' | 'VARIANT'

  // Selected variant state per product: { [productId]: variantId }
  const [selectedVariants, setSelectedVariants] = useState({});

  // Quantity selector per product: { [productId]: quantity }
  const [selectedQuantities, setSelectedQuantities] = useState({});

  // Cart State (Preserved in sessionStorage for this specific store)
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customer order submission form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  // Order Success Screen State & Last Submitted Order for Customer Reference
  const [submittedOrderSuccess, setSubmittedOrderSuccess] = useState(null);
  const [lastSubmittedOrder, setLastSubmittedOrder] = useState(null);
  const [isRecentOrderDrawerOpen, setIsRecentOrderDrawerOpen] = useState(false);

  // Unique session token to track customer cart
  const [sessionToken, setSessionToken] = useState('');

  useEffect(() => {
    // Generate or read session token
    let token = sessionStorage.getItem('vexa_cart_session_token');
    if (!token) {
      token = 'cust_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
      sessionStorage.setItem('vexa_cart_session_token', token);
    }
    setSessionToken(token);
  }, []);

  // Load store cart and recent submitted order from sessionStorage (strictly store isolated)
  useEffect(() => {
    if (!shopSlug) return;
    const cartStorageKey = `vexa_cart_${encodeURIComponent(shopSlug)}`;
    const orderStorageKey = `vexa_last_order_${encodeURIComponent(shopSlug)}`;
    try {
      const savedCart = sessionStorage.getItem(cartStorageKey);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      const savedOrder = sessionStorage.getItem(orderStorageKey);
      if (savedOrder) {
        setLastSubmittedOrder(JSON.parse(savedOrder));
      }
    } catch (e) {
      console.warn('Could not read from sessionStorage:', e);
    }
  }, [shopSlug]);

  // Live order tracking state
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  // Poll for live status of submitted order (e.g. status transition from PENDING_REVIEW -> BILLED)
  const refreshLiveOrderStatus = async (orderRef) => {
    const targetOrder = orderRef || lastSubmittedOrder;
    if (!targetOrder || !targetOrder.orderNumber || !shopSlug) return;
    setIsRefreshingStatus(true);
    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/shop/${encodeURIComponent(shopSlug)}/order/${encodeURIComponent(targetOrder.orderNumber)}`);
      const json = await res.json();
      if (res.ok && json.success && json.data?.order) {
        const liveOrder = json.data.order;
        setLastSubmittedOrder((prev) => {
          const merged = { ...prev, ...liveOrder };
          const orderStorageKey = `vexa_last_order_${encodeURIComponent(shopSlug)}`;
          try {
            sessionStorage.setItem(orderStorageKey, JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    } catch (err) {
      console.warn('Could not poll order live status:', err);
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  // Auto-poll live order status every 5 seconds if order is not BILLED, REJECTED, or CANCELLED
  useEffect(() => {
    if (!lastSubmittedOrder?.orderNumber || !shopSlug) return;
    const currentStatus = lastSubmittedOrder.status || 'PENDING_REVIEW';
    if (['BILLED', 'REJECTED', 'CANCELLED'].includes(currentStatus)) {
      return;
    }

    // Immediate check
    refreshLiveOrderStatus();

    const intervalId = setInterval(() => {
      refreshLiveOrderStatus();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [lastSubmittedOrder?.orderNumber, lastSubmittedOrder?.status, shopSlug]);

  // Persist cart to sessionStorage whenever it changes
  useEffect(() => {
    if (!shopSlug) return;
    const storageKey = `vexa_cart_${encodeURIComponent(shopSlug)}`;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(cart));
    } catch (e) {
      console.warn('Could not write cart to sessionStorage:', e);
    }
  }, [cart, shopSlug]);

  useEffect(() => {
    if (!shopSlug) return;
    fetchShopCatalogue();
  }, [shopSlug]);

  const fetchShopCatalogue = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/shop/${encodeURIComponent(shopSlug)}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Shop could not be found or is currently inactive.');
      }

      setShopData(json.data?.shop || null);
      setCategories(json.data?.categories || []);
      setBrands(json.data?.brands || []);
      setEntitlement(json.data?.entitlement || null);
      const prods = json.data?.products || [];
      setProducts(prods);

      // Initialize default selected variants for products with variants
      const initVariants = {};
      const initQtys = {};
      prods.forEach((p) => {
        if (p.variants && p.variants.length > 0) {
          initVariants[p.id] = p.variants[0].id;
        }
        initQtys[p.id] = 1;
      });
      setSelectedVariants(initVariants);
      setSelectedQuantities(initQtys);
    } catch (err) {
      console.error('Failed to load shop catalogue:', err);
      setErrorMessage(err.message || 'Unable to connect to the shop catalogue. Please verify the URL.');
    } finally {
      setIsLoading(false);
    }
  };

  // Extract all distinct available sizes and colors across all products for variant filtering
  const availableVariantSizes = useMemo(() => {
    const sizeSet = new Set();
    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        if (v.size && v.size.trim()) sizeSet.add(v.size.trim());
      });
    });
    return Array.from(sizeSet).sort();
  }, [products]);

  const availableVariantColors = useMemo(() => {
    const colorMap = new Map();
    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        if (v.color && v.color.trim()) {
          const colorName = v.color.trim();
          if (!colorMap.has(colorName)) {
            colorMap.set(colorName, v.colorHex || null);
          }
        }
      });
    });
    return Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));
  }, [products]);

  // Helper to render user-friendly status badge & banner
  const getOrderStatusDisplay = (status) => {
    switch (status) {
      case 'BILLED':
        return {
          label: 'Invoiced / Ready',
          badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          dotClass: 'bg-indigo-600',
          pulse: false,
          icon: <ReceiptIndianRupee className="w-4 h-4 text-indigo-600" />,
          description: 'Your order has been verified & invoiced by the shop owner!'
        };
      case 'ACCEPTED':
        return {
          label: 'Accepted by Admin',
          badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
          dotClass: 'bg-blue-500',
          pulse: true,
          icon: <CheckCircle2 className="w-4 h-4 text-blue-600" />,
          description: 'Admin has accepted your order and is preparing the final bill.'
        };
      case 'READY_FOR_BILLING':
        return {
          label: 'Ready for Billing',
          badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          dotClass: 'bg-indigo-500',
          pulse: true,
          icon: <CheckCircle2 className="w-4 h-4 text-indigo-600" />,
          description: 'Items confirmed in stock. Final billing in progress.'
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
          dotClass: 'bg-rose-500',
          pulse: false,
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
          description: 'Order was rejected by shop admin.'
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
          dotClass: 'bg-slate-400',
          pulse: false,
          icon: <XCircle className="w-4 h-4 text-slate-500" />,
          description: 'Order was cancelled.'
        };
      case 'PENDING_REVIEW':
      default:
        return {
          label: 'Pending Review',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          dotClass: 'bg-amber-500',
          pulse: true,
          icon: <Clock className="w-4 h-4 text-amber-600" />,
          description: 'Dispatched to shop owner. Awaiting review & stock check.'
        };
    }
  };

  // Client-side instant search, category, brand, and variant filtering
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Category filter
      if (selectedCategory !== 'ALL' && prod.categoryId !== selectedCategory) {
        return false;
      }

      // Brand filter
      if (selectedBrand !== 'ALL') {
        if (selectedBrand === 'UNBRANDED') {
          if (prod.brandId) return false;
        } else if (prod.brandId !== selectedBrand) {
          return false;
        }
      }

      // Variant Size filter
      if (selectedSize !== 'ALL') {
        const hasMatchingSize = prod.variants?.some((v) => v.size && v.size.toLowerCase() === selectedSize.toLowerCase());
        if (!hasMatchingSize) return false;
      }

      // Variant Color filter
      if (selectedColor !== 'ALL') {
        const hasMatchingColor = prod.variants?.some((v) => v.color && v.color.toLowerCase() === selectedColor.toLowerCase());
        if (!hasMatchingColor) return false;
      }

      // Keyword Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = prod.name?.toLowerCase().includes(q);
        const matchesSku = prod.sku?.toLowerCase().includes(q);
        const matchesBarcode = prod.barcode?.toLowerCase().includes(q);
        const matchesCategory = prod.categoryName?.toLowerCase().includes(q);
        const matchesBrand = prod.brandName?.toLowerCase().includes(q);
        const matchesVariant = prod.variants?.some(
          (v) =>
            v.variantName?.toLowerCase().includes(q) ||
            v.color?.toLowerCase().includes(q) ||
            v.size?.toLowerCase().includes(q) ||
            v.sku?.toLowerCase().includes(q) ||
            v.barcode?.toLowerCase().includes(q)
        );

        if (!matchesName && !matchesSku && !matchesBarcode && !matchesCategory && !matchesBrand && !matchesVariant) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, selectedBrand, selectedSize, selectedColor, searchQuery]);

  // Category icon mapping for circular category chips and product badges
  const getCategoryDetails = (categoryName) => {
    const cat = (categoryName || '').toLowerCase();
    
    // 1. Specific match for Ladies / Women's fashion - Professional Crown / Sparkle
    if (cat.includes('ladie') || cat.includes('women') || cat.includes('chudidhar') || cat.includes('saree') || cat.includes('kurti') || cat.includes('female')) {
      return {
        icon: <Crown className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200" />,
        bg: 'bg-purple-50 text-purple-600 border-purple-200/70 hover:bg-purple-600 hover:text-white hover:border-purple-600',
        activeBg: 'bg-purple-600 text-white border-purple-600'
      };
    }

    // 2. Specific match for Pant / Trousers / Bottomwear (Layers / Apparel icon)
    if (cat.includes('pant') || cat.includes('trouser') || cat.includes('jean') || cat.includes('bottom') || cat.includes('track')) {
      return {
        icon: <Layers className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200" />,
        bg: 'bg-sky-50 text-sky-600 border-sky-200/70 hover:bg-sky-600 hover:text-white hover:border-sky-600',
        activeBg: 'bg-sky-600 text-white border-sky-600'
      };
    }

    // 3. Specific match for Shirt / T-shirt / Tops
    if (cat.includes('shirt') || cat.includes('top') || cat.includes('tshirt') || cat.includes('t-shirt') || cat.includes('polo')) {
      return {
        icon: <Shirt className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200" />,
        bg: 'bg-indigo-50 text-indigo-600 border-indigo-200/70 hover:bg-indigo-600 hover:text-white hover:border-indigo-600',
        activeBg: 'bg-indigo-600 text-white border-indigo-600'
      };
    }

    // 4. Footwear & Shoes
    if (cat.includes('shoe') || cat.includes('footwear') || cat.includes('sport') || cat.includes('sneaker')) {
      return {
        icon: <Footprints className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200" />,
        bg: 'bg-emerald-50 text-emerald-600 border-emerald-200/70 hover:bg-emerald-600 hover:text-white hover:border-emerald-600',
        activeBg: 'bg-emerald-600 text-white border-emerald-600'
      };
    }

    // 5. Watches & Accessories
    if (cat.includes('watch') || cat.includes('accessori') || cat.includes('jewel')) {
      return {
        icon: <Watch className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200" />,
        bg: 'bg-amber-50 text-amber-600 border-amber-200/70 hover:bg-amber-600 hover:text-white hover:border-amber-600',
        activeBg: 'bg-amber-600 text-white border-amber-600'
      };
    }

    // 6. Electronics & Audio
    if (cat.includes('elec') || cat.includes('headphone') || cat.includes('gadget') || cat.includes('audio')) {
      return {
        icon: <Headphones className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200" />,
        bg: 'bg-blue-50 text-blue-600 border-blue-200/70 hover:bg-blue-600 hover:text-white hover:border-blue-600',
        activeBg: 'bg-blue-600 text-white border-blue-600'
      };
    }

    // 7. Home & Living
    if (cat.includes('home') || cat.includes('kitchen') || cat.includes('furni')) {
      return {
        icon: <Armchair className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200" />,
        bg: 'bg-orange-50 text-orange-600 border-orange-200/70 hover:bg-orange-600 hover:text-white hover:border-orange-600',
        activeBg: 'bg-orange-600 text-white border-orange-600'
      };
    }

    // 8. Beauty & Cosmetics
    if (cat.includes('beauty') || cat.includes('cosmetic') || cat.includes('care')) {
      return {
        icon: <Sparkle className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200" />,
        bg: 'bg-pink-50 text-pink-600 border-pink-200/70 hover:bg-pink-600 hover:text-white hover:border-pink-600',
        activeBg: 'bg-pink-600 text-white border-pink-600'
      };
    }

    // 9. General Apparel / Garments fallback
    if (cat.includes('textile') || cat.includes('cloth') || cat.includes('garment') || cat.includes('apparel') || cat.includes('fashion')) {
      return {
        icon: <Tag className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200" />,
        bg: 'bg-indigo-50 text-indigo-600 border-indigo-200/70 hover:bg-indigo-600 hover:text-white hover:border-indigo-600',
        activeBg: 'bg-indigo-600 text-white border-indigo-600'
      };
    }

    // 10. Sensible Generic Fallback for Unknown Categories
    return {
      icon: <Package className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200" />,
      bg: 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-800 hover:text-white hover:border-slate-800',
      activeBg: 'bg-slate-800 text-white border-slate-800'
    };
  };

  const getProductIcon = (categoryName) => {
    return getCategoryDetails(categoryName).icon;
  };

  // Cart operations
  const handleAddToCart = (product) => {
    const hasVariants = product.variants && product.variants.length > 0;
    const selectedVariantId = hasVariants ? (selectedVariants[product.id] || product.variants[0]?.id) : null;
    const selectedVariant = hasVariants ? product.variants.find(v => v.id === selectedVariantId) : null;
    const quantityToAdd = selectedQuantities[product.id] || 1;

    const unitPrice = Number(selectedVariant?.purchasePrice ?? selectedVariant?.price ?? product.purchasePrice ?? product.sellingPrice ?? 0);
    const cartItemId = selectedVariantId ? `${product.id}-${selectedVariantId}` : product.id;

    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantityToAdd;
        return updated;
      }
      return [
        ...prev,
        {
          cartItemId,
          productId: product.id,
          variantId: selectedVariantId,
          name: product.name,
          variantName: selectedVariant ? selectedVariant.variantName : null,
          color: selectedVariant?.color || null,
          size: selectedVariant?.size || null,
          sku: selectedVariant?.sku || product.sku || null,
          unitPrice,
          unit: product.unit || 'PCS',
          quantity: quantityToAdd
        }
      ];
    });

    // Reset local card quantity back to 1
    setSelectedQuantities((prev) => ({ ...prev, [product.id]: 1 }));
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (cartItemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveCartItem = (cartItemId) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCart([]);
    if (shopSlug) {
      sessionStorage.removeItem(`vexa_cart_${encodeURIComponent(shopSlug)}`);
    }
  };

  // Total cart items count & estimated subtotal
  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cart]);

  const estimatedSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.quantity || 1) * Number(item.unitPrice || 0), 0);
  }, [cart]);

  // Submit Order to Shop
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmittingOrder(true);
    setSubmissionError('');

    try {
      const idempotencyKey = `${sessionToken}_${Date.now()}`;
      const apiUrl = getApiBaseUrl();

      const payload = {
        items: cart.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity
        })),
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || null,
        customerEmail: customerEmail.trim() || null,
        customerAddress: customerAddress.trim() || null,
        notes: orderNotes.trim() || null,
        sessionToken,
        idempotencyKey
      };

      const res = await fetch(`${apiUrl}/shop/${encodeURIComponent(shopSlug)}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to submit order. Please check item availability.');
      }

      // Order created successfully
      const createdOrderData = json.data?.order || {};
      setSubmittedOrderSuccess(createdOrderData);
      setLastSubmittedOrder(createdOrderData);
      if (shopSlug) {
        try {
          sessionStorage.setItem(`vexa_last_order_${encodeURIComponent(shopSlug)}`, JSON.stringify(createdOrderData));
        } catch (e) {}
      }
      handleClearCart();
      setIsCartOpen(false);
    } catch (err) {
      console.error('Order submission failed:', err);
      setSubmissionError(err.message || 'Network error while submitting order. Please try again.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      
      {/* 2. Responsive Modern Shop Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6">
          <div className="py-2.5 sm:py-3.5 flex items-center justify-between gap-2.5">
            
            {/* Left: Shop Logo & Name */}
            <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
              {shopData?.logoUrl ? (
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-1 overflow-hidden shrink-0">
                  <img
                    src={shopData.logoUrl}
                    alt={shopData.name || 'Shop Logo'}
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.parentElement) {
                        e.currentTarget.parentElement.innerHTML = `
                          <div class="w-full h-full rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Store className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <h1 className="text-sm sm:text-lg md:text-xl font-extrabold text-slate-900 tracking-tight leading-snug truncate">
                    {shopData?.name || (isLoading ? 'Loading Shop...' : 'Public Product Catalogue')}
                  </h1>
                  {shopData?.companyId && (
                    <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/80 shrink-0">
                      {shopData.companyId}
                    </span>
                  )}
                </div>
                {shopData && (
                  <div className="hidden sm:flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                    {shopData.type && (
                      <span className="font-bold text-indigo-600 uppercase tracking-wider text-[10px]">
                        {shopData.type.replace(/_/g, ' ')}
                      </span>
                    )}
                    {shopData.phone && (
                      <span className="inline-flex items-center text-slate-500">
                        <Phone className="w-3 h-3 mr-1 text-slate-400" />
                        {shopData.phone}
                      </span>
                    )}
                    {shopData.address && (
                      <span className="hidden md:inline-flex items-center truncate max-w-xs text-slate-400">
                        <MapPin className="w-3 h-3 mr-1 shrink-0 text-slate-400" />
                        <span className="truncate">{shopData.address}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions (Official Badge + My Order + My Cart) */}
            <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
              <span className="hidden lg:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50/80 text-indigo-700 border border-indigo-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                <span>Official Catalogue</span>
              </span>

              {/* Customer Self-Service Portal Link */}
              <a
                href={`/shop/${encodeURIComponent(shopSlug)}/portal`}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-all cursor-pointer shadow-2xs"
                title="Customer Portal: Invoices, Receipts, Outstanding & Account"
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Customer Portal</span>
              </a>

              {/* Submitted Order / Invoice Rounded Circular Icon in Nav */}
              {lastSubmittedOrder && (
                <button
                  type="button"
                  onClick={() => setIsRecentOrderDrawerOpen(true)}
                  className="relative group p-2 sm:px-3 sm:py-2 rounded-full sm:rounded-full flex items-center space-x-1.5 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all cursor-pointer shadow-xs hover:shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Click to view submitted invoice & order details"
                  aria-label="View submitted invoice and order details"
                >
                  {/* Rounded circular icon container */}
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    {lastSubmittedOrder.invoice ? (
                      <ReceiptIndianRupee className="w-3.5 h-3.5" />
                    ) : (
                      <FileCheck className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <span className="hidden sm:inline font-bold text-xs text-indigo-900">
                    {lastSubmittedOrder.invoice ? 'Invoice' : 'Order'}
                  </span>
                  <span className="font-mono text-[10px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">
                    {lastSubmittedOrder.invoice?.invoiceNumber 
                      ? lastSubmittedOrder.invoice.invoiceNumber.split('-').pop() 
                      : (lastSubmittedOrder.orderNumber ? lastSubmittedOrder.orderNumber.split('-').pop() : 'REF')}
                  </span>
                  {/* Subtle live pulse indicator */}
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                </button>
              )}

              {/* My Cart Button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs shadow-indigo-600/25 cursor-pointer active:scale-95"
              >
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Cart</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  totalCartCount > 0 ? 'bg-white text-indigo-700' : 'bg-indigo-700/80 text-white'
                }`}>
                  {totalCartCount}
                </span>
              </button>
            </div>
          </div>

          {/* Compact Mobile Secondary Sub-Bar */}
          {shopData && (
            <div className="sm:hidden pb-2.5 pt-0 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 mt-1 pt-1.5">
              <span className="font-bold text-indigo-600 uppercase text-[9.5px] truncate mr-2">
                {shopData.type ? shopData.type.replace(/_/g, ' ') : 'RETAIL STORE'}
              </span>
              {shopData.phone && (
                <span className="inline-flex items-center text-slate-600 font-medium">
                  <Phone className="w-2.5 h-2.5 mr-1 text-slate-400" />
                  {shopData.phone}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main E-commerce Catalogue Body */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 flex-1 w-full space-y-4 sm:space-y-5">
        
        {/* Entitlement Shop Notice (Text-only, no images) */}
        {entitlement && !entitlement.allowed && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <span className="font-extrabold text-amber-900">Shop Notice: Self-Shopping Catalogue Preview Only</span>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Online order submission is currently disabled for this store. You may browse prices and product codes in-store.
                </p>
              </div>
            </div>
            <span className="shrink-0 px-2.5 py-1 bg-amber-200/80 text-amber-900 font-black rounded-lg text-[10px] uppercase tracking-wider">
              Preview Mode
            </span>
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Spinner size="lg" className="text-indigo-600" />
            <p className="text-sm font-bold text-slate-600">Loading verified product catalogue...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMessage && (
          <div className="bg-white rounded-3xl border border-rose-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight mb-2">Shop Not Available</h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">{errorMessage}</p>
            <button
              type="button"
              onClick={fetchShopCatalogue}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {/* Modern Floating Notification Toast & Interactive Modal for Order Submission */}
        {submittedOrderSuccess && (
          <>
            {/* Top-Right / Mobile Top Floating Toast Notification */}
            <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-[440px] z-50 animate-in slide-in-from-top-4 duration-300">
              <div className="bg-slate-900/95 text-white backdrop-blur-xl border border-indigo-500/30 p-4 rounded-2xl shadow-2xl flex items-start space-x-3.5 relative overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30 mt-0.5">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-500/30">
                      Order Placed
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-300">
                      #{submittedOrderSuccess.orderNumber}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white mt-1 leading-snug">
                    Submitted to {submittedOrderSuccess.shop?.name || shopData?.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Estimated total: <strong className="text-indigo-300 font-mono font-bold">₹{Number(submittedOrderSuccess.estimatedTotal || 0).toFixed(2)}</strong>. Shop ADMIN will review & bill your invoice.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmittedOrderSuccess(null)}
                  className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                  title="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Backdrop Centered Order Summary Modal Card */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200 space-y-5">
                <button
                  type="button"
                  onClick={() => setSubmittedOrderSuccess(null)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header Icon & Title */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/25">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                    Order Submitted Successfully
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Order Reference #{submittedOrderSuccess.orderNumber}
                  </h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Your self-shopping cart has been safely dispatched to <strong>{submittedOrderSuccess.shop?.name || shopData?.name}</strong>.
                  </p>
                </div>

                {/* Status & Estimated Subtotal Pill Container */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Review Status:</span>
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>PENDING ADMIN REVIEW</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Estimated Subtotal:</span>
                    <span className="font-mono font-black text-slate-900 text-base">
                      ₹{Number(submittedOrderSuccess.estimatedTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {submittedOrderSuccess.customerName && (
                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <span>Customer:</span>
                      <span className="font-bold text-slate-700">{submittedOrderSuccess.customerName}</span>
                    </div>
                  )}

                  {/* Submitted Items Breakdown */}
                  {submittedOrderSuccess.items && submittedOrderSuccess.items.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                      <span className="font-bold text-slate-700 block text-[11px]">
                        Items ({submittedOrderSuccess.items.length}):
                      </span>
                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                        {submittedOrderSuccess.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] py-1 px-2 rounded-lg bg-white border border-slate-100">
                            <span className="truncate pr-2 font-medium text-slate-800">
                              <strong className="text-indigo-600 font-bold">{it.quantity}x</strong> {it.productName} {it.variantName ? `(${it.variantName})` : ''}
                            </span>
                            <span className="font-mono font-bold text-slate-900 shrink-0">
                              ₹{Number(it.lineTotal).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 text-center leading-normal">
                  Our company ADMIN will review product stock and generate your official tax invoice using VEXA Invoice billing.
                </div>

                <button
                  type="button"
                  onClick={() => setSubmittedOrderSuccess(null)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-slate-900/10 transition cursor-pointer active:scale-95 flex items-center justify-center space-x-2"
                >
                  <span>Continue Browsing Catalogue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Content Section when loaded successfully */}
        {!isLoading && !errorMessage && (
          <>
            {/* 2. Search Field and Catalogue Filters Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, brand, barcode, size, or color..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-14 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Secondary Filters: Brands, Colors & Sizes */}
              {(brands.length > 1 || availableVariantColors.length > 1 || availableVariantSizes.length > 1) && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {/* Brands */}
                  {brands.length > 1 && (
                    <div className="flex items-center space-x-1 shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center">
                        <Award className="w-3 h-3 mr-0.5" />
                        Brand:
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedBrand('ALL')}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                          selectedBrand === 'ALL'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All
                      </button>
                      {brands.map((b) => {
                        const isSelected = selectedBrand === b.id;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setSelectedBrand(isSelected ? 'ALL' : b.id)}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {b.name}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Colors */}
                  {availableVariantColors.length > 1 && (
                    <div className="flex items-center space-x-1 shrink-0 pl-2 border-l border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center">
                        <Palette className="w-3 h-3 mr-0.5" />
                        Color:
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedColor('ALL')}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                          selectedColor === 'ALL' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        All
                      </button>
                      {availableVariantColors.map((col) => {
                        const isSelected = selectedColor === col.name;
                        return (
                          <button
                            key={col.name}
                            type="button"
                            onClick={() => setSelectedColor(isSelected ? 'ALL' : col.name)}
                            className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                              isSelected ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {col.hex && (
                              <span
                                className="w-2 h-2 rounded-full mr-1 shrink-0 border border-black/20"
                                style={{ backgroundColor: col.hex }}
                              />
                            )}
                            <span>{col.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Sizes */}
                  {availableVariantSizes.length > 1 && (
                    <div className="flex items-center space-x-1 shrink-0 pl-2 border-l border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                        Size:
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedSize('ALL')}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                          selectedSize === 'ALL' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        All
                      </button>
                      {availableVariantSizes.map((sz) => {
                        const isSelected = selectedSize === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedSize(selectedSize === sz ? 'ALL' : sz)}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all shrink-0 cursor-pointer ${
                              isSelected ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Active Applied Filter Badges & Reset */}
              {(selectedCategory !== 'ALL' || selectedBrand !== 'ALL' || selectedSize !== 'ALL' || selectedColor !== 'ALL' || searchQuery) && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Active:</span>
                    {selectedCategory !== 'ALL' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                        {categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}
                        <button onClick={() => setSelectedCategory('ALL')} className="ml-1 cursor-pointer">×</button>
                      </span>
                    )}
                    {selectedBrand !== 'ALL' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                        {brands.find((b) => b.id === selectedBrand)?.name || selectedBrand}
                        <button onClick={() => setSelectedBrand('ALL')} className="ml-1 cursor-pointer">×</button>
                      </span>
                    )}
                    {selectedColor !== 'ALL' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                        Color: {selectedColor}
                        <button onClick={() => setSelectedColor('ALL')} className="ml-1 cursor-pointer">×</button>
                      </span>
                    )}
                    {selectedSize !== 'ALL' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                        Size: {selectedSize}
                        <button onClick={() => setSelectedSize('ALL')} className="ml-1 cursor-pointer">×</button>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setSelectedBrand('ALL');
                      setSelectedSize('ALL');
                      setSelectedColor('ALL');
                      setSearchQuery('');
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer flex items-center"
                  >
                    <RotateCcw className="w-2.5 h-2.5 mr-1" />
                    Reset All
                  </button>
                </div>
              )}
            </div>

            {/* 3. Shop by Categories (Reference Image Circular Category Row) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Shop by Categories
                  </h2>
                  <span className="text-xs font-semibold text-slate-400">
                    ({categories.length + 1})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center space-x-1 cursor-pointer"
                >
                  <span>View All Categories</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Circular Category Icons with text labels underneath */}
              <div className="flex items-center gap-4 sm:gap-7 overflow-x-auto py-2 px-1 no-scrollbar">
                {/* All Categories circular item */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className="flex flex-col items-center group cursor-pointer shrink-0 focus:outline-none"
                >
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                      selectedCategory === 'ALL'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-4 ring-indigo-500/25 ring-offset-2 scale-105'
                        : 'bg-indigo-50/70 text-indigo-600 border border-indigo-200/60 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-md hover:scale-105'
                    }`}
                  >
                    <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200" />
                  </div>
                  <span
                    className={`mt-2 text-xs font-bold text-center transition-colors truncate max-w-[80px] ${
                      selectedCategory === 'ALL' ? 'text-indigo-600 font-extrabold' : 'text-slate-700 group-hover:text-indigo-600'
                    }`}
                  >
                    All Items
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {products.length}
                  </span>
                </button>

                {/* Individual Categories from shop data */}
                {categories.map((cat) => {
                  const count = products.filter((p) => p.categoryId === cat.id).length;
                  const isSelected = selectedCategory === cat.id;
                  const catDetails = getCategoryDetails(cat.name);

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(isSelected ? 'ALL' : cat.id)}
                      className="flex flex-col items-center group cursor-pointer shrink-0 focus:outline-none"
                    >
                      <div
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 border ${
                          isSelected
                            ? `${catDetails.activeBg} shadow-lg shadow-indigo-600/25 ring-4 ring-indigo-500/25 ring-offset-2 scale-105`
                            : `${catDetails.bg} hover:scale-105 hover:shadow-md`
                        }`}
                      >
                        <div className={isSelected ? 'text-white' : ''}>
                          {catDetails.icon}
                        </div>
                      </div>
                      <span
                        className={`mt-2 text-xs font-bold text-center transition-colors truncate max-w-[85px] ${
                          isSelected ? 'text-indigo-600 font-extrabold' : 'text-slate-700 group-hover:text-indigo-600'
                        }`}
                      >
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {count} items
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Best Selling Products / Catalogue Section Heading (Reference Layout) */}
            <div className="pt-2">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center">
                    <Flame className="w-4 h-4 text-amber-500 mr-1.5" />
                    Best Selling Products
                  </h2>
                  <span className="text-xs font-bold text-slate-400">
                    ({filteredProducts.length})
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {(selectedCategory !== 'ALL' || selectedBrand !== 'ALL' || selectedSize !== 'ALL' || selectedColor !== 'ALL' || searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('ALL');
                        setSelectedBrand('ALL');
                        setSelectedSize('ALL');
                        setSelectedColor('ALL');
                        setSearchQuery('');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                    >
                      View All Products →
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-md mx-auto shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Boxes className="w-6 h-6" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800">No matching products found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {searchQuery
                    ? `No items match "${searchQuery}". Try a different keyword or reset filters.`
                    : 'There are no active products matching your selected category/filter.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setSelectedBrand('ALL');
                    setSelectedSize('ALL');
                    setSelectedColor('ALL');
                  }}
                  className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              /* 4 & 5. Responsive E-commerce Product Grid: 2 columns on mobile, 3 on tablet, 4 on desktop */
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
                {filteredProducts.map((prod) => {
                  const hasVariants = prod.variants && prod.variants.length > 0;
                  const currentSelectedVariantId = hasVariants ? (selectedVariants[prod.id] || prod.variants[0]?.id) : null;
                  const activeVariant = hasVariants ? prod.variants.find(v => v.id === currentSelectedVariantId) : null;
                  const displayPrice = Number(activeVariant?.purchasePrice ?? prod.purchasePrice ?? activeVariant?.price ?? prod.sellingPrice ?? 0);
                  const currentQty = selectedQuantities[prod.id] || 1;

                  return (
                    <div
                      key={prod.id}
                      className="bg-white border border-slate-200/90 hover:border-indigo-400/80 rounded-2xl p-3 sm:p-4 flex flex-col justify-between transition-all duration-150 hover:shadow-xs group"
                    >
                      {/* Top Meta: Category Badge, Brand Badge & Icon (strictly text & icons, NO IMAGES) */}
                      <div>
                        <div className="flex items-start justify-between gap-1.5 mb-2">
                          <div className="flex items-center gap-1 flex-wrap min-w-0">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/70 truncate">
                              {prod.categoryName || 'General'}
                            </span>
                            {prod.brandName && prod.brandName !== 'General' && prod.brandName !== 'N/A' && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] sm:text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 truncate">
                                {prod.brandName}
                              </span>
                            )}
                          </div>
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-50/70 border border-indigo-100/80 flex items-center justify-center shrink-0">
                            {getProductIcon(prod.categoryName)}
                          </div>
                        </div>

                        {/* Product Title */}
                        <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 tracking-tight group-hover:text-indigo-600 transition-colors">
                          {prod.name}
                        </h3>

                        {/* SKU / Barcode */}
                        <div className="mt-1.5 space-y-0.5">
                          {(activeVariant?.sku || prod.sku) && (
                            <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 truncate">
                              <span className="text-slate-400 font-semibold mr-1">SKU:</span>
                              <span className="font-bold text-slate-600">
                                {activeVariant?.sku || prod.sku}
                              </span>
                            </div>
                          )}
                          {(activeVariant?.barcode || prod.barcode) && (
                            <div className="hidden sm:flex items-center text-[10px] font-mono text-slate-400 truncate">
                              <Barcode className="w-2.5 h-2.5 text-slate-400 mr-1 shrink-0" />
                              <span className="truncate">{activeVariant?.barcode || prod.barcode}</span>
                            </div>
                          )}
                        </div>

                        {/* Size / Color Variants Selector */}
                        {hasVariants && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
                            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center">
                              <Layers className="w-2.5 h-2.5 mr-1" />
                              Select ({prod.variants.length}):
                            </span>
                            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto no-scrollbar">
                              {prod.variants.map((v) => {
                                const isSelected = currentSelectedVariantId === v.id;
                                return (
                                  <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => setSelectedVariants((prev) => ({ ...prev, [prod.id]: v.id }))}
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] sm:text-[10px] font-bold border transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {v.colorHex && (
                                      <span
                                        className="w-2 h-2 rounded-full mr-1 shrink-0 border border-black/10"
                                        style={{ backgroundColor: v.colorHex }}
                                      />
                                    )}
                                    <span className="truncate max-w-[85px]">{v.variantName}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Bottom: Price, Stock & Add to Cart Controls */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                        <div className="flex items-baseline justify-between gap-1 flex-wrap">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">
                              Purchase Price
                            </span>
                            <div className="text-sm sm:text-base md:text-lg font-black text-slate-900 tracking-tight">
                              ₹{displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              <span className="text-[10px] font-bold text-slate-400 ml-0.5">/{prod.unit}</span>
                            </div>
                          </div>

                          {/* Stock status */}
                          {typeof prod.totalStock === 'number' && (
                            <div className="text-right shrink-0">
                              {prod.totalStock > 0 ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  In Stock ({prod.totalStock})
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                  On Order
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Quantity Counter + Add to Cart Button */}
                        <div className="flex items-center gap-1.5">
                          <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const nextVal = Math.max(1, currentQty - 1);
                                setSelectedQuantities((prev) => ({ ...prev, [prod.id]: nextVal }));
                              }}
                              className="px-1.5 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="px-1.5 sm:px-2 text-[11px] sm:text-xs font-bold text-slate-900 select-none">
                              {currentQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedQuantities((prev) => ({ ...prev, [prod.id]: currentQty + 1 }));
                              }}
                              className="px-1.5 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(prod)}
                            className="flex-1 inline-flex items-center justify-center space-x-1 px-2 sm:px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span className="truncate">Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* 6. Responsive Cart Experience: Bottom Sheet on Mobile, Slide Drawer on Desktop */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Drawer / Mobile Bottom Sheet Content */}
          <div className="relative w-full sm:max-w-md bg-white h-full sm:h-full max-h-screen shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom sm:slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-3.5 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">Your Cart</h2>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold">{totalCartCount} items selected</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="text-[11px] font-bold text-slate-400 hover:text-rose-600 px-2 py-1 rounded cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="py-20 text-center space-y-2.5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <ShoppingCart className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">Your cart is empty</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Browse the catalogue and click "Add" on products to prepare your order.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.cartItemId} className="pt-3 first:pt-0 flex items-start justify-between gap-2.5">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
                        {item.name}
                      </h4>
                      {item.variantName && (
                        <span className="inline-block mt-0.5 text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.variantName}
                        </span>
                      )}
                      <div className="text-[11px] text-slate-500 font-mono mt-1">
                        ₹{Number(item.unitPrice).toFixed(2)} × {item.quantity} = <strong className="text-slate-900 font-bold">₹{(Number(item.unitPrice) * item.quantity).toFixed(2)}</strong>
                      </div>
                    </div>

                    {/* Quantity Adjustment + Remove */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(item.cartItemId, -1)}
                          className="px-1.5 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="px-1.5 text-xs font-bold text-slate-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(item.cartItemId, 1)}
                          className="px-1.5 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveCartItem(item.cartItemId)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Submission Form & Checkout Footer */}
            {cart.length > 0 && (
              <div className="p-3.5 sm:p-5 border-t border-slate-200 bg-slate-50/80 space-y-3 max-h-[50vh] sm:max-h-none overflow-y-auto">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-slate-600">Estimated Subtotal:</span>
                  <span className="font-extrabold text-slate-900 text-base sm:text-lg">
                    ₹{estimatedSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-400 leading-tight">
                  * Official GST and final bill details will be verified by the shop upon review.
                </p>

                {/* Customer Contact Details */}
                <form onSubmit={handleSubmitOrder} className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                      Your Name (Required):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Kumar"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                        Phone (Optional):
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 9840123456"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                        Email (Optional):
                      </label>
                      <input
                        type="email"
                        placeholder="customer@email.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                      Delivery Address / Notes:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Address or special notes for packing..."
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  {submissionError && (
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      <span>{submissionError}</span>
                    </div>
                  )}

                  {entitlement && !entitlement.allowed ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-1 text-xs">
                      <p className="font-bold text-amber-900">Online Ordering Currently Inactive</p>
                      <p className="text-[11px] text-amber-700">This store is currently in catalogue-only mode. Please present your selected items to shop staff directly.</p>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmittingOrder || cart.length === 0}
                      className="w-full py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold uppercase tracking-wide flex items-center justify-center space-x-2 shadow-xs transition cursor-pointer"
                    >
                      {isSubmittingOrder ? (
                        <>
                          <Spinner size="sm" className="text-white" />
                          <span>Submitting Order...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Order to Shop</span>
                        </>
                      )}
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Redesigned My Order Drawer */}
      {isRecentOrderDrawerOpen && lastSubmittedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsRecentOrderDrawerOpen(false)}
          />

          <div className="relative w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom sm:slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-3.5 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                  <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">Your Order Details</h2>
                  <p className="text-[10px] sm:text-[11px] font-mono text-indigo-600 font-bold">
                    Ref: #{lastSubmittedOrder.orderNumber}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRecentOrderDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Summary */}
            {(() => {
              const statusInfo = getOrderStatusDisplay(lastSubmittedOrder.status);
              return (
                <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/70 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Shop:</span>
                    <span className="font-extrabold text-slate-900">{lastSubmittedOrder.shop?.name || shopData?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium flex items-center space-x-1">
                      <span>Status:</span>
                      <button
                        type="button"
                        onClick={() => refreshLiveOrderStatus()}
                        disabled={isRefreshingStatus}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"
                        title="Refresh Status"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRefreshingStatus ? 'animate-spin text-indigo-600' : ''}`} />
                      </button>
                    </span>
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass} ${statusInfo.pulse ? 'animate-pulse' : ''}`} />
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>

                  {lastSubmittedOrder.invoice && (
                    <div className="p-3 bg-indigo-50/80 border border-indigo-200/90 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center text-indigo-950 font-bold text-xs">
                        <span className="flex items-center space-x-1.5">
                          <ReceiptIndianRupee className="w-4 h-4 text-indigo-600" />
                          <span>Official Invoice:</span>
                        </span>
                        <span className="font-mono font-black text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                          #{lastSubmittedOrder.invoice.invoiceNumber}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-600">
                        <span>Invoice Total:</span>
                        <span className="font-mono font-black text-indigo-950 text-sm">
                          ₹{Number(lastSubmittedOrder.invoice.grandTotal).toFixed(2)}
                        </span>
                      </div>
                      {lastSubmittedOrder.invoice.paymentStatus && (
                        <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-indigo-200/60">
                          <span className="text-slate-500 font-medium">Payment Status:</span>
                          <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            lastSubmittedOrder.invoice.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : lastSubmittedOrder.invoice.paymentStatus === 'PARTIALLY_PAID'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {lastSubmittedOrder.invoice.paymentStatus}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {lastSubmittedOrder.customerName && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-medium">Customer:</span>
                      <span className="font-bold text-slate-800">{lastSubmittedOrder.customerName}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Ordered Products List */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-2.5 divide-y divide-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 flex items-center justify-between">
                <span>Ordered Products ({(lastSubmittedOrder.items || []).length})</span>
                {lastSubmittedOrder.invoice && (
                  <span className="text-[10px] text-indigo-600 font-bold">Authoritative Billed Items</span>
                )}
              </div>
              {(lastSubmittedOrder.items || []).map((item, idx) => (
                <div key={idx} className="pt-2.5 first:pt-0 flex items-start justify-between gap-2.5">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {item.productName}
                    </h4>
                    {item.variantName && (
                      <span className="inline-block mt-0.5 text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {item.variantName}
                      </span>
                    )}
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      ₹{Number(item.unitPrice).toFixed(2)} × {item.quantity} = <strong className="text-slate-900 font-bold">₹{Number(item.lineTotal).toFixed(2)}</strong>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold shrink-0">
                    Qty: {item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-700">
                  {lastSubmittedOrder.invoice ? 'Final Bill Amount:' : 'Estimated Total:'}
                </span>
                <span className={`text-base font-mono font-black ${
                  lastSubmittedOrder.invoice ? 'text-indigo-700 text-lg' : 'text-slate-900'
                }`}>
                  ₹{Number(lastSubmittedOrder.invoice?.grandTotal ?? lastSubmittedOrder.estimatedTotal ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsRecentOrderDrawerOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close & Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Modern Public Footer */}
      <footer className="mt-auto py-5 border-t border-slate-200/80 bg-white text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {shopData?.name || 'Shop'} • Official Product Catalogue
          </span>
          <span className="font-semibold text-slate-500">
            Powered by VEXA Invoice
          </span>
        </div>
      </footer>
    </div>
  );
}
