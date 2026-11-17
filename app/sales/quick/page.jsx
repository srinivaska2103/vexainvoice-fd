'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Search, 
  Scan, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  ChevronUp, 
  Zap, 
  User, 
  UserPlus, 
  Save, 
  Check, 
  Sparkles,
  Percent,
  CreditCard,
  Banknote,
  Receipt,
  Tag,
  ArrowRight,
  ShoppingBag,
  SlidersHorizontal,
  Flame,
  Clock,
  Layers,
  Store,
  BadgeIndianRupee
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import CameraBarcodeScannerModal from '@/components/CameraBarcodeScannerModal';
import InvoicePrintTemplate from '@/components/invoice/InvoicePrintTemplate';
import { useAuth } from '@/hooks/useAuth';
import { getRoleDashboard } from '@/lib/permissions';
import { productService } from '@/services/productService';
import { customerService } from '@/services/customerService';
import { salesService } from '@/services/salesService';

function QuickBillContent() {
  const router = useRouter();
  const { role, userRoleSlug, business } = useAuth();

  // Search and Input state
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState([]);

  // Customer state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Add new customer modal state
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    customer_type: 'RETAIL',
    gst_number: '',
    address: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: ''
  });

  // GST State
  const [applyGst, setApplyGst] = useState(true);

  // Discounts state
  const [isDiscountExpanded, setIsDiscountExpanded] = useState(false);
  const [tradeDiscountType, setTradeDiscountType] = useState('PERCENT');
  const [tradeDiscountValue, setTradeDiscountValue] = useState('');
  const [schemeDiscountType, setSchemeDiscountType] = useState('PERCENT');
  const [schemeDiscountValue, setSchemeDiscountValue] = useState('');
  const [cashDiscountType, setCashDiscountType] = useState('PERCENT');
  const [cashDiscountValue, setCashDiscountValue] = useState('');
  const [lessValue, setLessValue] = useState('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH | UPI | CARD | BANK_TRANSFER | CHEQUE | CREDIT
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');

  // Variant selector modal
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

  // Camera scanner modal
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  // Invoice completed modal
  const [completedSale, setCompletedSale] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mobile Bottom Drawer for Cart & Checkout
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Sequential order / inv numbers
  const [orderNumber, setOrderNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Active Category filter tab
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Refs
  const searchInputRef = useRef(null);

  // Dynamic Date string
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Close & Exit handler
  const handleClose = () => {
    if (typeof window !== 'undefined') {
      try {
        window.close();
      } catch (e) {}
    }
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        const targetDashboard = getRoleDashboard(role, userRoleSlug) || '/dashboard';
        router.push(targetDashboard);
      }
    }, 50);
  };

  // Load initial data
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const [prodRes, custRes, nextNumRes] = await Promise.all([
          productService.getProducts().catch(() => ({ data: [] })),
          customerService.getCustomers().catch(() => ({ data: [] })),
          salesService.getNextNumber().catch(() => ({ data: {} }))
        ]);

        const prodList = prodRes?.data || (Array.isArray(prodRes) ? prodRes : []);
        setProducts(prodList);

        const custList = custRes?.data || (Array.isArray(custRes) ? custRes : []);
        setCustomers(custList);

        const nextData = nextNumRes?.data || nextNumRes || {};
        if (nextData.orderNumber || nextData.order_number) {
          setOrderNumber(nextData.orderNumber || nextData.order_number);
        }
        if (nextData.invoiceNumber || nextData.invoice_number) {
          setInvoiceNumber(nextData.invoiceNumber || nextData.invoice_number);
        }
      } catch (err) {
        console.error('Failed to load Quick Bill data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Unique categories list
  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category?.name || p.category_name).filter(Boolean)))];

  // Filter products by search query and category
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || (p.category?.name || p.category_name) === selectedCategory;
    if (!matchesCat) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const vars = p.product_variants || p.variants || [];
    const variantMatches = vars.some((v) => {
      return (
        (v.sku && v.sku.toLowerCase().includes(q)) ||
        (v.barcode && v.barcode.toLowerCase().includes(q)) ||
        (v.variant_name && v.variant_name.toLowerCase().includes(q)) ||
        (v.colors?.name && v.colors.name.toLowerCase().includes(q)) ||
        (v.sizes?.name && v.sizes.name.toLowerCase().includes(q))
      );
    });

    return (
      p.name?.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      variantMatches
    );
  });

  // Add product to cart (or open variant modal if has variants)
  const handleProductCardClick = (prod) => {
    const vars = prod.product_variants || prod.variants || [];
    if (prod.has_variants || vars.length > 0) {
      setSelectedProductForVariant(prod);
      setIsVariantModalOpen(true);
    } else {
      addToCart(prod, null);
    }
  };

  const addToCart = (product, variant = null) => {
    const target = variant || product;
    const unitPrice = Number(target.retail_price || target.price || product.retail_price || product.price || 0);
    const colorName = variant?.colors?.name || variant?.color || '';
    const sizeName = variant?.sizes?.name || variant?.size || '';
    const varLabel = variant ? (variant.variant_name || [colorName, sizeName].filter(Boolean).join(' / ') || 'Variant') : null;

    const cartKey = variant ? `${product.id}-${variant.id}` : product.id;
    const existingIndex = cart.findIndex((i) => i.cartKey === cartKey);

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          cartKey,
          productId: product.id,
          variantId: variant ? variant.id : null,
          name: product.name,
          variantName: varLabel,
          unitPrice,
          quantity: 1,
          gstPercentage: Number(product.gst_percentage || 5),
          hsnCode: product.hsn_code || '6109'
        }
      ]);
    }
  };

  const handleUpdateQuantity = (cartKey, delta) => {
    setCart(
      cart
        .map((item) => {
          if (item.cartKey === cartKey) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveItem = (cartKey) => {
    setCart(cart.filter((item) => item.cartKey !== cartKey));
  };

  // --- GST, DISCOUNT, & PAYMENT CALCULATIONS ---
  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  // 1. Trade Discount
  const tradeVal = parseFloat(tradeDiscountValue || 0);
  const tradeDiscountAmt = tradeDiscountType === 'PERCENT' ? subtotal * (tradeVal / 100) : tradeVal;
  const remAfterTrade = Math.max(0, subtotal - tradeDiscountAmt);

  // 2. Scheme Discount
  const schemeVal = parseFloat(schemeDiscountValue || 0);
  const schemeDiscountAmt = schemeDiscountType === 'PERCENT' ? remAfterTrade * (schemeVal / 100) : schemeVal;
  const remAfterScheme = Math.max(0, remAfterTrade - schemeDiscountAmt);

  // 3. Cash Discount (only applicable if payment is NOT CREDIT)
  const isCreditPayment = paymentMethod === 'CREDIT';
  const cashVal = parseFloat(cashDiscountValue || 0);
  const cashDiscountAmt = isCreditPayment ? 0 : (cashDiscountType === 'PERCENT' ? remAfterScheme * (cashVal / 100) : cashVal);

  // Total Pre-GST Discount & Taxable Amount
  const totalPreGstDiscount = tradeDiscountAmt + schemeDiscountAmt + cashDiscountAmt;
  const taxableAmount = Math.max(0, subtotal - totalPreGstDiscount);

  // GST calculated on Taxable Amount proportionally
  const taxTotal = applyGst ? cart.reduce((acc, item) => {
    const itemSub = item.unitPrice * item.quantity;
    const itemTaxable = subtotal > 0 ? (itemSub / subtotal) * taxableAmount : 0;
    return acc + itemTaxable * (item.gstPercentage / 100);
  }, 0) : 0;
  const cgstAmount = taxTotal / 2;
  const sgstAmount = taxTotal / 2;

  // Total After GST
  const totalAfterGst = taxableAmount + taxTotal;

  // Less (Post-GST Deduction)
  const lessAmt = parseFloat(lessValue || 0);

  // Grand Total & Round Off
  const rawGrandTotal = Math.max(0, totalAfterGst - lessAmt);
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = (grandTotal - rawGrandTotal).toFixed(2);

  // Amount Paid & Balance Due
  const effectivePaidAmount = isCreditPayment ? 0 : (amountPaid !== '' ? parseFloat(amountPaid) : grandTotal);
  const balanceDue = isCreditPayment ? grandTotal : Math.max(0, grandTotal - effectivePaidAmount);

  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Keyboard shortcut handlers: Enter adds top match, Ctrl+Enter saves
  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      if (cart.length > 0 && !isSubmitting) {
        handleSaveBill();
      }
      return;
    }

    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      if (filteredProducts.length > 0) {
        const topMatch = filteredProducts[0];
        handleProductCardClick(topMatch);
        setSearchQuery('');
      }
    }
  };

  useEffect(() => {
    const handleGlobalKeys = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (cart.length > 0 && !isSubmitting) {
          handleSaveBill();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [cart, isSubmitting, grandTotal, paymentMethod, applyGst, tradeDiscountValue, schemeDiscountValue, cashDiscountValue, lessValue, selectedCustomer]);

  // Save Bill
  const handleSaveBill = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const payload = {
        invoice_type: 'SALE',
        invoice_number: invoiceNumber || undefined,
        order_number: orderNumber || undefined,
        customer_id: selectedCustomer?.id || null,
        paymentMethod: paymentMethod,
        payment_method: paymentMethod,
        payments: [
          {
            payment_method: paymentMethod,
            amount: effectivePaidAmount
          }
        ],
        trade_discount_type: tradeDiscountType,
        trade_discount_value: tradeVal,
        scheme_discount_type: schemeDiscountType,
        scheme_discount_value: schemeVal,
        cash_discount_type: cashDiscountType,
        cash_discount_value: cashVal,
        less_amount: lessAmt,
        discount_amount: totalPreGstDiscount,
        round_off: parseFloat(roundOff),
        notes: notes.trim() || undefined,
        items: cart.map((item) => ({
          product_id: item.productId,
          variant_id: item.variantId || undefined,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          gst_percentage: applyGst ? item.gstPercentage : 0
        }))
      };

      const res = await salesService.createSale(payload);
      const created = res.data || res;
      created.orderNumber = created.orderNumber || created.order_number || orderNumber;
      created.invoiceNumber = created.invoiceNumber || created.invoice_number || invoiceNumber;
      created.tradeDiscount = tradeDiscountAmt;
      created.schemeDiscount = schemeDiscountAmt;
      created.cashDiscount = cashDiscountAmt;
      created.lessAmount = lessAmt;
      created.customer = selectedCustomer || { name: 'Walk-in Customer' };

      setCompletedSale(created);
      setCart([]);
      setSelectedCustomer(null);
      setAmountPaid('');
      setTradeDiscountValue('');
      setSchemeDiscountValue('');
      setCashDiscountValue('');
      setLessValue('');
      setIsMobileCartOpen(false);

      // Increment sequence
      try {
        const nextRes = await salesService.getNextNumber();
        const nextData = nextRes?.data || nextRes;
        if (nextData) {
          if (nextData.orderNumber || nextData.order_number) setOrderNumber(nextData.orderNumber || nextData.order_number);
          if (nextData.invoiceNumber || nextData.invoice_number) setInvoiceNumber(nextData.invoiceNumber || nextData.invoice_number);
        }
      } catch (e) {}
    } catch (err) {
      alert(err.message || 'Failed to complete sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered customers for Customer modal
  const filteredCustomers = customers.filter((c) => {
    if (!customerSearchQuery.trim()) return true;
    const q = customerSearchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.gst_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-900/5 text-slate-800 flex flex-col font-sans select-none antialiased">
      
      {/* ========================================================================= */}
      {/* 1. TOP DYNAMIC NAVBAR                                                    */}
      {/* ========================================================================= */}
      <header className="px-3 sm:px-6 py-2.5 sm:py-3 bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between gap-3 shadow-2xs">
        
        {/* Left: Close Button + Terminal Brand Identity */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
            title="Exit Quick POS"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="font-black text-sm sm:text-base tracking-tight text-slate-900 uppercase">
                {business?.business_name || 'Quick POS'}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                Express
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate">
              {todayFormatted}
            </p>
          </div>
        </div>

        {/* Center/Right: Badges & GST Control */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Order Ref */}
          {orderNumber && (
            <div className="hidden md:flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs font-mono">
              <span className="text-[10px] uppercase font-bold text-slate-400">Ord:</span>
              <span className="font-bold text-slate-700">{orderNumber}</span>
            </div>
          )}

          {/* Invoice Ref */}
          {invoiceNumber && (
            <div className="hidden sm:flex items-center space-x-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-mono">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Inv:</span>
              <span className="font-black text-emerald-700">{invoiceNumber}</span>
            </div>
          )}

          {/* Tax Pill */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 px-1.5 hidden sm:inline">GST</span>
            <button
              type="button"
              onClick={() => setApplyGst(!applyGst)}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center space-x-1 ${
                applyGst 
                  ? 'bg-blue-600 text-white shadow-2xs' 
                  : 'bg-white text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{applyGst ? 'GST ON' : 'GST OFF'}</span>
            </button>
          </div>

          {/* Mobile Cart Floating Trigger Pill */}
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="lg:hidden flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-black text-xs shadow-md"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>₹{grandTotal.toFixed(0)}</span>
            <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-bold">
              {totalItemsCount}
            </span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN SPLIT INTERFACE                                                  */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ======================================================================= */}
        {/* LEFT COLUMN: SEARCH + CATEGORY TABS + CATALOG (7 Cols on desktop)      */}
        {/* ======================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* SEARCH BAR & SCANNER ACTION */}
          <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Scan barcode or type product name, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-11 pl-10 pr-24 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
              <div className="absolute right-2 flex items-center space-x-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCameraScannerOpen(true)}
                  className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                  title="Scan with Camera"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Camera</span>
                </button>
              </div>
            </div>

            {/* Quick Helper Keyboard Prompt */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-medium">
              <span>Press <strong className="text-slate-600 font-bold font-mono">Enter</strong> to select first match</span>
              <span className="hidden sm:inline"><strong className="text-slate-600 font-bold font-mono">Ctrl + Enter</strong> to checkout</span>
            </div>
          </div>

          {/* HORIZONTAL CATEGORY CHIPS */}
          {categories.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'ALL' ? 'All Items' : cat}
                </button>
              ))}
            </div>
          )}

          {/* PRODUCT CATALOG GRID */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Catalog ({filteredProducts.length})</span>
              </h2>
            </div>

            {isLoading ? (
              <div className="p-12 text-center">
                <Spinner size="md" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                No matching products found. Type above or scan a barcode.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                {filteredProducts.map((prod) => {
                  const vars = prod.product_variants || prod.variants || [];
                  const price = Number(prod.retail_price || prod.price || 0);
                  const inCartCount = cart
                    .filter(c => c.productId === prod.id)
                    .reduce((sum, item) => sum + item.quantity, 0);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleProductCardClick(prod)}
                      className={`relative p-3 rounded-2xl bg-white border transition cursor-pointer flex flex-col justify-between group active:scale-[0.98] select-none hover:shadow-md ${
                        inCartCount > 0 ? 'border-blue-500/80 ring-2 ring-blue-500/10' : 'border-slate-200/90'
                      }`}
                    >
                      {/* Top Bar: In-Cart Counter Pill & Category Tag */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[85px] uppercase">
                          {prod.category?.name || prod.brand?.name || 'General'}
                        </span>
                        {inCartCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                            {inCartCount}
                          </span>
                        )}
                      </div>

                      {/* Middle: Product Name */}
                      <div className="min-h-[38px] mb-2">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-tight">
                          {prod.name}
                        </h3>
                        {vars.length > 0 && (
                          <span className="text-[10px] text-blue-600 font-bold block mt-0.5">
                            {vars.length} Options
                          </span>
                        )}
                      </div>

                      {/* Bottom Bar: Price & Add Button */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 font-medium block leading-none">Price</span>
                          <span className="font-black text-xs sm:text-sm text-slate-900">
                            ₹{price.toFixed(0)}
                          </span>
                        </div>

                        <div className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center transition">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: DESKTOP CART & CHECKOUT (5 Cols on desktop)               */}
        {/* ======================================================================= */}
        <div className="hidden lg:block lg:col-span-5 space-y-4 sticky top-18">
          <CartCheckoutPanel
            cart={cart}
            totalItemsCount={totalItemsCount}
            subtotal={subtotal}
            applyGst={applyGst}
            totalPreGstDiscount={totalPreGstDiscount}
            taxableAmount={taxableAmount}
            cgstAmount={cgstAmount}
            sgstAmount={sgstAmount}
            lessAmt={lessAmt}
            roundOff={roundOff}
            grandTotal={grandTotal}
            effectivePaidAmount={effectivePaidAmount}
            balanceDue={balanceDue}
            isCreditPayment={isCreditPayment}
            selectedCustomer={selectedCustomer}
            paymentMethod={paymentMethod}
            amountPaid={amountPaid}
            notes={notes}
            isSubmitting={isSubmitting}
            isDiscountExpanded={isDiscountExpanded}
            tradeDiscountType={tradeDiscountType}
            tradeDiscountValue={tradeDiscountValue}
            schemeDiscountType={schemeDiscountType}
            schemeDiscountValue={schemeDiscountValue}
            cashDiscountType={cashDiscountType}
            cashDiscountValue={cashDiscountValue}
            lessValue={lessValue}
            onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={() => setCart([])}
            onToggleDiscount={() => setIsDiscountExpanded(!isDiscountExpanded)}
            setTradeDiscountType={setTradeDiscountType}
            setTradeDiscountValue={setTradeDiscountValue}
            setSchemeDiscountType={setSchemeDiscountType}
            setSchemeDiscountValue={setSchemeDiscountValue}
            setCashDiscountType={setCashDiscountType}
            setCashDiscountValue={setCashDiscountValue}
            setLessValue={setLessValue}
            setPaymentMethod={setPaymentMethod}
            setAmountPaid={setAmountPaid}
            setNotes={setNotes}
            onSaveBill={handleSaveBill}
            searchInputRef={searchInputRef}
          />
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. MOBILE BOTTOM SLIDE-UP DRAWER FOR CART & CHECKOUT                     */}
      {/* ========================================================================= */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div 
            onClick={() => setIsMobileCartOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />
          <div className="relative bg-white rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl z-10 overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Invoice Cart & Checkout</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 overflow-y-auto space-y-4">
              <CartCheckoutPanel
                cart={cart}
                totalItemsCount={totalItemsCount}
                subtotal={subtotal}
                applyGst={applyGst}
                totalPreGstDiscount={totalPreGstDiscount}
                taxableAmount={taxableAmount}
                cgstAmount={cgstAmount}
                sgstAmount={sgstAmount}
                lessAmt={lessAmt}
                roundOff={roundOff}
                grandTotal={grandTotal}
                effectivePaidAmount={effectivePaidAmount}
                balanceDue={balanceDue}
                isCreditPayment={isCreditPayment}
                selectedCustomer={selectedCustomer}
                paymentMethod={paymentMethod}
                amountPaid={amountPaid}
                notes={notes}
                isSubmitting={isSubmitting}
                isDiscountExpanded={isDiscountExpanded}
                tradeDiscountType={tradeDiscountType}
                tradeDiscountValue={tradeDiscountValue}
                schemeDiscountType={schemeDiscountType}
                schemeDiscountValue={schemeDiscountValue}
                cashDiscountType={cashDiscountType}
                cashDiscountValue={cashDiscountValue}
                lessValue={lessValue}
                onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={() => setCart([])}
                onToggleDiscount={() => setIsDiscountExpanded(!isDiscountExpanded)}
                setTradeDiscountType={setTradeDiscountType}
                setTradeDiscountValue={setTradeDiscountValue}
                setSchemeDiscountType={setSchemeDiscountType}
                setSchemeDiscountValue={setSchemeDiscountValue}
                setCashDiscountType={setCashDiscountType}
                setCashDiscountValue={setCashDiscountValue}
                setLessValue={setLessValue}
                setPaymentMethod={setPaymentMethod}
                setAmountPaid={setAmountPaid}
                setNotes={setNotes}
                onSaveBill={handleSaveBill}
                searchInputRef={searchInputRef}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODALS (Customer Selection, Creation, Variants, Camera Scan, Receipt) */}
      {/* ========================================================================= */}
      {/* CUSTOMER SELECTION MODAL */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Select Customer Profile"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 p-1">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Input
                placeholder="Search by customer name or phone..."
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                icon={Search}
                className="h-10 text-xs"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCustomerModalOpen(false);
                setIsNewCustomerModalOpen(true);
              }}
              className="h-10 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1 shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {/* Walk-in Customer Option */}
            <div
              onClick={() => {
                setSelectedCustomer(null);
                setIsCustomerModalOpen(false);
              }}
              className="p-3 hover:bg-slate-50 flex items-center justify-between cursor-pointer rounded-xl"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                  W
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Walk-in Customer</p>
                  <p className="text-[10px] text-slate-400">Counter Cash Sale</p>
                </div>
              </div>
              {!selectedCustomer && (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Selected
                </span>
              )}
            </div>

            {filteredCustomers.map((cust) => (
              <div
                key={cust.id}
                onClick={() => {
                  setSelectedCustomer(cust);
                  setIsCustomerModalOpen(false);
                }}
                className="p-3 hover:bg-slate-50 flex items-center justify-between cursor-pointer rounded-xl"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    {cust.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{cust.name}</p>
                    <p className="text-[10px] text-slate-400">{cust.phone || 'No phone'}</p>
                  </div>
                </div>
                {selectedCustomer?.id === cust.id && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Selected
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* NEW CUSTOMER MODAL */}
      <Modal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        title="Add New Customer"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newCustomerForm.name.trim()) return;
            setIsSavingCustomer(true);
            try {
              const res = await customerService.createCustomer(newCustomerForm);
              const created = res.data || res;
              setCustomers([created, ...customers]);
              setSelectedCustomer(created);
              setIsNewCustomerModalOpen(false);
              setNewCustomerForm({
                name: '',
                phone: '',
                email: '',
                customer_type: 'RETAIL',
                gst_number: '',
                address: '',
                city: '',
                state: 'Tamil Nadu',
                pincode: ''
              });
            } catch (err) {
              alert(err.message || 'Failed to create customer');
            } finally {
              setIsSavingCustomer(false);
            }
          }}
          className="space-y-3 text-xs"
        >
          <Input
            label="Customer Name *"
            required
            placeholder="John Doe"
            value={newCustomerForm.name}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={newCustomerForm.phone}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
            />
            <Input
              label="Email Address"
              placeholder="customer@example.com"
              value={newCustomerForm.email}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsNewCustomerModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSavingCustomer} className="bg-blue-600 hover:bg-blue-700 text-white">
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* VARIANT SELECTOR MODAL */}
      <Modal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        title={`Select Variant: ${selectedProductForVariant?.name || ''}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-3 p-1">
          <p className="text-xs text-slate-500">Choose a color/size variant to add to the invoice:</p>
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {(selectedProductForVariant?.product_variants || selectedProductForVariant?.variants || []).map((v) => {
              const color = v.colors?.name || v.color || '';
              const size = v.sizes?.name || v.size || '';
              const label = v.variant_name || [color, size].filter(Boolean).join(' / ') || 'Variant';
              const price = Number(v.retail_price || selectedProductForVariant?.retail_price || 0);

              return (
                <div
                  key={v.id}
                  onClick={() => {
                    addToCart(selectedProductForVariant, v);
                    setIsVariantModalOpen(false);
                  }}
                  className="p-3 hover:bg-slate-50 flex items-center justify-between cursor-pointer rounded-xl"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{label}</p>
                    <p className="text-[10px] text-slate-400">SKU: {v.sku || '-'}</p>
                  </div>
                  <span className="text-xs font-black text-blue-600">₹{price.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* CAMERA SCANNER MODAL */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={async (scannedCode) => {
          setIsCameraScannerOpen(false);
          if (!scannedCode) return;
          try {
            const res = await productService.scanCode(scannedCode);
            const item = res.data || res;
            if (item && item.id) {
              const prod = products.find((p) => p.id === item.productId || p.id === item.id);
              if (prod) {
                if (item.variantId) {
                  const vars = prod.product_variants || prod.variants || [];
                  const variant = vars.find((v) => v.id === item.variantId);
                  addToCart(prod, variant || null);
                } else {
                  addToCart(prod, null);
                }
              }
            }
          } catch (e) {
            console.warn('Scan failed:', e);
          }
        }}
        title="Scan Barcode"
      />

      {/* PRINT INVOICE MODAL */}
      <Modal
        isOpen={!!completedSale}
        onClose={() => setCompletedSale(null)}
        title="Sales Invoice Generated"
        maxWidth="max-w-3xl"
      >
        <InvoicePrintTemplate sale={completedSale} onClose={() => setCompletedSale(null)} />
      </Modal>

    </div>
  );
}

// Reusable Cart & Checkout Component (Used for both Desktop Right Col & Mobile Slide-up Drawer)
function CartCheckoutPanel({
  cart,
  totalItemsCount,
  subtotal,
  applyGst,
  totalPreGstDiscount,
  taxableAmount,
  cgstAmount,
  sgstAmount,
  lessAmt,
  roundOff,
  grandTotal,
  effectivePaidAmount,
  balanceDue,
  isCreditPayment,
  selectedCustomer,
  paymentMethod,
  amountPaid,
  notes,
  isSubmitting,
  isDiscountExpanded,
  tradeDiscountType,
  tradeDiscountValue,
  schemeDiscountType,
  schemeDiscountValue,
  cashDiscountType,
  cashDiscountValue,
  lessValue,
  onOpenCustomerModal,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onToggleDiscount,
  setTradeDiscountType,
  setTradeDiscountValue,
  setSchemeDiscountType,
  setSchemeDiscountValue,
  setCashDiscountType,
  setCashDiscountValue,
  setLessValue,
  setPaymentMethod,
  setAmountPaid,
  setNotes,
  onSaveBill,
  searchInputRef
}) {
  return (
    <div className="space-y-3.5">
      
      {/* 1. Customer Assignment Strip */}
      <div 
        onClick={onOpenCustomerModal}
        className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-400 transition cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-[10px] uppercase font-bold text-slate-400">Billed Customer</p>
            <p className="text-xs font-bold text-slate-900 truncate">
              {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer (Cash)'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </div>

      {/* 2. Items List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <ShoppingBag className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-extrabold text-slate-900 uppercase">Items In Bill</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {totalItemsCount}
            </span>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="text-[11px] text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No products added</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click any catalog card or scan barcode</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto no-scrollbar">
            {cart.map((item) => (
              <div key={item.cartKey} className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                  {item.variantName && (
                    <p className="text-[10px] text-blue-600 font-semibold">{item.variantName}</p>
                  )}
                  <p className="text-[10px] text-slate-400 font-mono">₹{item.unitPrice.toFixed(2)} each</p>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.cartKey, -1)}
                      className="p-1 text-slate-600 hover:bg-slate-200 rounded-l-lg cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-xs font-extrabold text-slate-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.cartKey, 1)}
                      className="p-1 text-slate-600 hover:bg-slate-200 rounded-r-lg cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="w-14 text-right text-xs font-black text-slate-900">
                    ₹{(item.unitPrice * item.quantity).toFixed(0)}
                  </span>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.cartKey)}
                    className="text-slate-300 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Trade & Cash Discounts Toggle Accordion */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3">
        <button
          type="button"
          onClick={onToggleDiscount}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Tag className="w-3.5 h-3.5 text-blue-600" />
            <span>Discounts & Schemes</span>
            {totalPreGstDiscount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200">
                -₹{totalPreGstDiscount.toFixed(2)}
              </span>
            )}
          </div>
          <div className="text-slate-400">
            {isDiscountExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isDiscountExpanded && (
          <div className="pt-3 mt-2 border-t border-slate-100 space-y-2 text-xs">
            {/* Trade Discount */}
            <div className="flex items-center justify-between gap-2">
              <label className="text-slate-600 font-semibold text-[11px]">Trade Discount:</label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={tradeDiscountValue}
                  onChange={(e) => setTradeDiscountValue(e.target.value)}
                  className="w-16 px-2 py-1 text-right text-xs border border-slate-200 rounded-lg font-bold bg-slate-50"
                />
                <div className="flex border border-slate-200 rounded-lg overflow-hidden text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setTradeDiscountType('PERCENT')}
                    className={`px-1.5 py-1 ${tradeDiscountType === 'PERCENT' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeDiscountType('AMOUNT')}
                    className={`px-1.5 py-1 ${tradeDiscountType === 'AMOUNT' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    ₹
                  </button>
                </div>
              </div>
            </div>

            {/* Scheme Discount */}
            <div className="flex items-center justify-between gap-2">
              <label className="text-slate-600 font-semibold text-[11px]">Scheme Discount:</label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={schemeDiscountValue}
                  onChange={(e) => setSchemeDiscountValue(e.target.value)}
                  className="w-16 px-2 py-1 text-right text-xs border border-slate-200 rounded-lg font-bold bg-slate-50"
                />
                <div className="flex border border-slate-200 rounded-lg overflow-hidden text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setSchemeDiscountType('PERCENT')}
                    className={`px-1.5 py-1 ${schemeDiscountType === 'PERCENT' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setSchemeDiscountType('AMOUNT')}
                    className={`px-1.5 py-1 ${schemeDiscountType === 'AMOUNT' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    ₹
                  </button>
                </div>
              </div>
            </div>

            {/* Cash Discount */}
            <div className="flex items-center justify-between gap-2">
              <label className="text-slate-600 font-semibold text-[11px]">Cash Discount:</label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="0"
                  step="any"
                  disabled={isCreditPayment}
                  placeholder="0"
                  value={isCreditPayment ? '0' : cashDiscountValue}
                  onChange={(e) => setCashDiscountValue(e.target.value)}
                  className={`w-16 px-2 py-1 text-right text-xs border rounded-lg font-bold ${
                    isCreditPayment ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                <div className="flex border border-slate-200 rounded-lg overflow-hidden text-[10px] font-bold">
                  <button
                    type="button"
                    disabled={isCreditPayment}
                    onClick={() => setCashDiscountType('PERCENT')}
                    className={`px-1.5 py-1 ${cashDiscountType === 'PERCENT' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    disabled={isCreditPayment}
                    onClick={() => setCashDiscountType('AMOUNT')}
                    className={`px-1.5 py-1 ${cashDiscountType === 'AMOUNT' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    ₹
                  </button>
                </div>
              </div>
            </div>

            {/* Less (After GST) */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <label className="text-slate-700 font-bold text-[11px]">Less (Post-GST):</label>
              <div className="flex items-center space-x-1">
                <span className="text-slate-400 font-bold text-[11px]">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={lessValue}
                  onChange={(e) => setLessValue(e.target.value)}
                  className="w-18 px-2 py-1 text-right text-xs border border-slate-200 rounded-lg font-bold bg-slate-50"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Payment Modes Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 space-y-2">
        <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Payment Mode</span>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'CASH', label: 'Cash' },
            { id: 'UPI', label: 'UPI' },
            { id: 'CARD', label: 'Card' },
            { id: 'BANK_TRANSFER', label: 'Bank' },
            { id: 'CHEQUE', label: 'Cheque' },
            { id: 'CREDIT', label: 'Credit' }
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setPaymentMethod(mode.id)}
              className={`py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                paymentMethod === mode.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Amount Tendered / Balance Due */}
        {!isCreditPayment && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Received</span>
              <input
                type="number"
                step="any"
                placeholder={String(grandTotal)}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full h-8 px-2 font-bold text-slate-900 border border-slate-200 rounded-lg bg-slate-50 text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Balance Due</span>
              <div className="h-8 px-2 font-mono font-bold flex items-center bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs">
                ₹{balanceDue.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Summary & Complete Invoice Action Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2.5">
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
          </div>

          {totalPreGstDiscount > 0 && (
            <div className="flex justify-between text-rose-600 text-[11px] font-medium">
              <span>Discounts</span>
              <span>-₹{totalPreGstDiscount.toFixed(2)}</span>
            </div>
          )}

          {applyGst && (
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Taxes (CGST + SGST)</span>
              <span>₹{(cgstAmount + sgstAmount).toFixed(2)}</span>
            </div>
          )}

          {lessAmt > 0 && (
            <div className="flex justify-between text-rose-600 text-[11px] font-medium">
              <span>Less</span>
              <span>-₹{lessAmt.toFixed(2)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Total Bill</span>
              <span className="text-xl font-black text-slate-900 leading-tight">₹{grandTotal.toFixed(0)}</span>
            </div>

            {/* SAVE BILL BUTTON */}
            <button
              type="button"
              disabled={cart.length === 0 || isSubmitting}
              onClick={onSaveBill}
              className={`h-11 px-6 rounded-xl font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 transition shadow-md active:scale-98 cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSubmitting ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Charge ₹{grandTotal.toFixed(0)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuickBillPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-8 text-center"><Spinner size="lg" /></div>}>
        <QuickBillContent />
      </Suspense>
    </ProtectedRoute>
  );
}
