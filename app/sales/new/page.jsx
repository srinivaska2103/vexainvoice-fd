'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  CreditCard, 
  Check, 
  Printer, 
  RotateCcw, 
  Zap, 
  Tag, 
  ArrowLeft, 
  ArrowRight,
  Building, 
  CheckCircle2, 
  Boxes, 
  UserPlus, 
  MapPin, 
  Phone, 
  Mail, 
  Edit3, 
  FileText, 
  ScanBarcode, 
  Save, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal, 
  Info, 
  Percent,
  Calendar,
  Layers,
  Banknote,
  Receipt,
  X,
  Sparkles
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DatePicker } from '@/components/ui/DatePicker';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import CameraBarcodeScannerModal from '@/components/CameraBarcodeScannerModal';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { productService } from '@/services/productService';
import { customerService } from '@/services/customerService';
import { salesService } from '@/services/salesService';
import { quotationService } from '@/services/quotationService';
import { customerOrderService } from '@/services/customerOrderService';
import InvoicePrintTemplate from '@/components/invoice/InvoicePrintTemplate';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';

function NewSaleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoScanCode = searchParams.get('autoScan');
  const { toastSuccess, toastError } = useToast();
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';
  const searchInputRef = useRef(null);

  // Workflow Step Management: 1 = Product Selection, 2 = Customer & Billing
  const [activeStep, setActiveStep] = useState(1);

  // Admin GST Mode Switch
  const [applyGst, setApplyGst] = useState(true);

  // System Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Order Reference & Invoice Number Inputs (Authoritative backend-managed sequential identifiers)
  const currentYear = new Date().getFullYear();
  const [orderNumber, setOrderNumber] = useState(`ORD-${currentYear}-001`);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${currentYear}-001`);
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });

  // Helper to increment formatted sequential string (e.g. ORD-2026-001 -> ORD-2026-002)
  const incrementSeqNumber = (numStr) => {
    if (!numStr) return numStr;
    const match = String(numStr).match(/^(.*-)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const digits = match[2];
      const nextVal = parseInt(digits, 10) + 1;
      return `${prefix}${String(nextVal).padStart(digits.length, '0')}`;
    }
    return numStr;
  };

  // Fetch next sequential numbers from backend on mount
  useEffect(() => {
    const fetchNextNumbers = async () => {
      try {
        const res = await salesService.getNextNumber();
        const data = res?.data || res;
        if (data) {
          const ord = data.orderNumber || data.order_number;
          const inv = data.invoiceNumber || data.invoice_number;
          if (ord) setOrderNumber(ord);
          if (inv) setInvoiceNumber(inv);
        }
      } catch (err) {
        console.error('Failed to fetch next sequential numbers:', err);
      }
    };
    fetchNextNumbers();
  }, []);

  // POS Pricing Mode State (RETAIL | WHOLESALE | PURCHASE | DEALER)
  const [invoiceType, setInvoiceType] = useState('RETAIL');

  // Customer State
  const [selectedCustomer, setSelectedCustomer] = useState(null); // Customer Object or null for walk-in
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // New Customer Modal State
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
    pincode: '',
    opening_balance: '0'
  });

  // Billing Address Snapshot State
  const [billingAddress, setBillingAddress] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    gstin: ''
  });
  const [isEditAddressModalOpen, setIsEditAddressModalOpen] = useState(false);
  const [shouldUpdatePermanentAddress, setShouldUpdatePermanentAddress] = useState(false);

  // Catalog Filters & Cart State
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [cart, setCart] = useState([]);

  // Variant Selector Modal State
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

  // Camera Barcode Scanner State
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  const handleCameraScanSuccess = (decodedText) => {
    handleScanCodeSubmit(decodedText);
    setIsCameraScannerOpen(false);
  };

  // Payment & Checkout State
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  // Discounts & Adjustments Breakdown State
  const [isDiscountExpanded, setIsDiscountExpanded] = useState(true);
  const [tradeDiscountType, setTradeDiscountType] = useState('PERCENT'); // 'PERCENT' | 'AMOUNT'
  const [tradeDiscountValue, setTradeDiscountValue] = useState('0');
  const [schemeDiscountType, setSchemeDiscountType] = useState('PERCENT'); // 'PERCENT' | 'AMOUNT'
  const [schemeDiscountValue, setSchemeDiscountValue] = useState('0');
  const [cashDiscountType, setCashDiscountType] = useState('PERCENT'); // 'PERCENT' | 'AMOUNT'
  const [cashDiscountValue, setCashDiscountValue] = useState('0');
  const [lessValue, setLessValue] = useState('0');

  // Initial Data Loader
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [prodRes, catRes, custRes, brandRes] = await Promise.all([
          productService.getProducts(),
          productService.getCategories(),
          customerService.getCustomers(),
          productService.getBrands ? productService.getBrands().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
        ]);
        const loadedProducts = prodRes.data || prodRes || [];
        const loadedCategories = catRes.data || catRes || [];
        const loadedCustomers = custRes.data || custRes.customers || custRes || [];
        const loadedBrands = brandRes.data || brandRes || [];

        setProducts(loadedProducts);
        setCategories(loadedCategories);
        setCustomers(loadedCustomers);
        setBrands(loadedBrands);
      } catch (err) {
        console.error('Failed to load initial POS data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const quotationId = searchParams.get('quotationId');
  const customerOrderId = searchParams.get('orderId');

  // Quotation & Customer Order Origin Tracking
  const loadedQuotationIdRef = useRef(null);
  const [loadedCustomerOrder, setLoadedCustomerOrder] = useState(null);
  const loadedOrderIdRef = useRef(null);

  // Load Customer Self-Shopping Order data into POS Cart & Billing if customerOrderId is present
  useEffect(() => {
    if (!customerOrderId || products.length === 0) return;
    if (loadedOrderIdRef.current === customerOrderId) return;

    let isMounted = true;
    const loadCustomerOrder = async () => {
      try {
        const res = await customerOrderService.getOrderById(customerOrderId);
        const ord = res.data || res;
        if (!ord || !isMounted) return;

        if (ord.status === 'BILLED') {
          toastError(`Order #${ord.order_number} has already been billed.`);
          return;
        }

        loadedOrderIdRef.current = customerOrderId;
        setLoadedCustomerOrder(ord);

        // Set Order Reference to match customer order number
        if (ord.order_number) {
          setOrderNumber(ord.order_number);
        }

        // Pre-fill Customer details
        if (ord.customer_name || ord.customer_address) {
          setBillingAddress(prev => ({
            ...prev,
            name: ord.customer_name || prev.name,
            phone: ord.customer_phone || prev.phone,
            address: ord.customer_address || prev.address
          }));
        }

        // Preselect the associated Customer record in the customer selector
        let matchedCust = null;
        if (ord.customer_id && customers.length > 0) {
          matchedCust = customers.find(c => c.id === ord.customer_id);
        }
        if (!matchedCust && ord.customers) {
          matchedCust = ord.customers;
        }
        if (!matchedCust && ord.customer_phone && customers.length > 0) {
          matchedCust = customers.find(c => c.phone && c.phone.trim() === ord.customer_phone.trim());
        }
        if (!matchedCust && ord.customer_name && customers.length > 0) {
          matchedCust = customers.find(c => c.name && c.name.toLowerCase().trim() === ord.customer_name.toLowerCase().trim());
        }

        // Fallback: If no existing customer match found in store, use the customer data from the order
        if (!matchedCust && (ord.customer_name || ord.customer_phone)) {
          matchedCust = {
            id: ord.customer_id || null,
            name: ord.customer_name || 'Customer',
            phone: ord.customer_phone || '',
            address: ord.customer_address || '',
            customer_type: 'RETAIL'
          };
        }

        if (matchedCust) {
          setSelectedCustomer(matchedCust);
          setCustomerSearchQuery(matchedCust.name || '');
          if (matchedCust.phone || matchedCust.address) {
            setBillingAddress({
              name: matchedCust.name || '',
              phone: matchedCust.phone || '',
              email: matchedCust.email || '',
              gstin: matchedCust.gst_number || matchedCust.gstin || '',
              address: matchedCust.address || ord.customer_address || '',
              city: matchedCust.city || '',
              state: matchedCust.state || 'Tamil Nadu',
              pincode: matchedCust.pincode || ''
            });
          }
        }

        // Populate Cart with order items
        const orderItems = ord.customer_order_items || [];
        const activeItems = orderItems.filter(i => !i.is_removed);

        if (activeItems.length > 0) {
          const newCartItems = activeItems.map((it) => {
            const cartKey = it.variant_id ? `${it.product_id}-${it.variant_id}` : it.product_id;
            const matchedProduct = products.find(p => p.id === it.product_id);
            const gstRate = matchedProduct ? Number(matchedProduct.gst_percentage || matchedProduct.gstPercentage || 5) : 5;

            return {
              cartKey,
              productId: it.product_id,
              variantId: it.variant_id || null,
              name: it.product_name || 'Product',
              variantName: it.variant_name || null,
              sku: it.sku || 'N/A',
              barcode: it.barcode || '',
              unitPrice: Number(it.unit_price || 0),
              quantity: Number(it.quantity || 1),
              gstPercentage: gstRate,
              hsnCode: matchedProduct?.hsn_code || '6109'
            };
          });

          setCart(newCartItems);
          const noteText = `Self-Shopping Catalogue Order #${ord.order_number}${ord.notes ? ` - ${ord.notes}` : ''}`;
          setNotes(noteText);
          toastSuccess(`Self-Shopping Order #${ord.order_number} loaded into POS! Review & add extra items as needed.`);
        }
      } catch (err) {
        console.error('Failed to pre-populate customer order into POS:', err);
        toastError(err.message || 'Failed to load customer order');
      }
    };

    loadCustomerOrder();

    return () => {
      isMounted = false;
    };
  }, [customerOrderId, products.length, customers.length]);

  // Load Quotation data into POS Cart & Billing if quotationId is present
  useEffect(() => {
    if (!quotationId || products.length === 0) return;
    if (loadedQuotationIdRef.current === quotationId) return;

    let isMounted = true;
    const loadQuotation = async () => {
      try {
        const res = await quotationService.getQuotationById(quotationId);
        const qtn = res.data || res;
        if (!qtn || !isMounted) return;

        if (qtn.status === 'CONVERTED') {
          toastError(`Quotation #${qtn.quotation_number} was already converted to a sale.`);
          return;
        }

        loadedQuotationIdRef.current = quotationId;

        // 1. Populate Customer details accurately
        const rawCustomer = qtn.customer || qtn.customers;
        let matchedCust = null;

        if (rawCustomer) {
          if (rawCustomer.id && customers.length > 0) {
            matchedCust = customers.find(c => c.id === rawCustomer.id);
          }
          if (!matchedCust && rawCustomer.phone && customers.length > 0) {
            matchedCust = customers.find(c => c.phone && c.phone.trim() === rawCustomer.phone.trim());
          }
          if (!matchedCust && rawCustomer.name && customers.length > 0) {
            matchedCust = customers.find(c => c.name && c.name.toLowerCase().trim() === rawCustomer.name.toLowerCase().trim());
          }

          if (!matchedCust) {
            matchedCust = {
              id: rawCustomer.id || null,
              name: rawCustomer.name || 'Quoted Customer',
              phone: rawCustomer.phone || '',
              email: rawCustomer.email || '',
              address: rawCustomer.address || '',
              customer_type: rawCustomer.customer_type || 'RETAIL'
            };
          }

          setSelectedCustomer(matchedCust);
          setCustomerSearchQuery(matchedCust.name || '');

          setBillingAddress({
            name: matchedCust.name || '',
            phone: matchedCust.phone || '',
            email: matchedCust.email || '',
            gstin: matchedCust.gst_number || matchedCust.gstin || '',
            address: matchedCust.address || '',
            city: matchedCust.city || '',
            state: matchedCust.state || 'Tamil Nadu',
            pincode: matchedCust.pincode || ''
          });
        }

        // 2. Populate Discounts
        if (qtn.discounts) {
          if (qtn.discounts.tradeVal !== undefined) {
            setTradeDiscountValue(String(qtn.discounts.tradeVal));
            setTradeDiscountType(qtn.discounts.tradeType || 'PERCENT');
          }
          if (qtn.discounts.schemeVal !== undefined) {
            setSchemeDiscountValue(String(qtn.discounts.schemeVal));
            setSchemeDiscountType(qtn.discounts.schemeType || 'PERCENT');
          }
          if (qtn.discounts.cashVal !== undefined) {
            setCashDiscountValue(String(qtn.discounts.cashVal));
            setCashDiscountType(qtn.discounts.cashType || 'PERCENT');
          }
          if (qtn.discounts.lessAmt !== undefined) {
            setLessValue(String(qtn.discounts.lessAmt));
          }
          if (qtn.discounts.applyGst !== undefined) {
            setApplyGst(qtn.discounts.applyGst);
          }
        }

        // 3. Populate Cart
        const qtnItems = qtn.items || qtn.quotation_items || [];
        if (qtnItems.length > 0) {
          const newCartItems = qtnItems.map((it) => {
            const cartKey = it.variant_id ? `${it.product_id}-${it.variant_id}` : it.product_id;
            const colorName = it.color || it.variant?.colors?.name || '';
            const sizeName = it.size || it.variant?.sizes?.name || '';
            const varLabel = [colorName, sizeName].filter(Boolean).join(' / ') || null;

            return {
              cartKey,
              productId: it.product_id,
              variantId: it.variant_id || null,
              name: it.product_name || it.product?.name || 'Quoted Product',
              variantName: varLabel,
              sku: it.sku || it.product?.sku || 'N/A',
              barcode: it.barcode || '',
              unitPrice: Number(it.unit_price || 0),
              quantity: Number(it.quantity || 1),
              gstPercentage: Number(it.gst_percentage || 0),
              hsnCode: it.product?.hsn_code || '6109'
            };
          });

          setCart(newCartItems);
          setNotes(`Converted from Quotation #${qtn.quotation_number}`);
          toastSuccess(`Quotation #${qtn.quotation_number} items & customer loaded into POS!`);
        }
      } catch (err) {
        console.error('Failed to pre-populate quotation into POS:', err);
        toastError(err.message || 'Failed to load quotation');
      }
    };

    loadQuotation();

    return () => {
      isMounted = false;
    };
  }, [quotationId, products.length, customers.length]);

  useEffect(() => {
    if (autoScanCode) {
      handleScanCodeSubmit(autoScanCode);
    }
  }, [autoScanCode]);

  // Auto focus search box on Step 1
  useEffect(() => {
    if (activeStep === 1 && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeStep]);

  // Update Billing Address snapshot when Customer selection changes
  useEffect(() => {
    if (selectedCustomer) {
      setBillingAddress({
        name: selectedCustomer.name || selectedCustomer.customer_name || '',
        phone: selectedCustomer.phone || '',
        email: selectedCustomer.email || '',
        gstin: selectedCustomer.gst_number || selectedCustomer.gstin || '',
        address: selectedCustomer.address || '',
        city: selectedCustomer.city || '',
        state: selectedCustomer.state || '',
        pincode: selectedCustomer.pincode || ''
      });
    } else {
      setBillingAddress({
        name: 'Walk-in Customer',
        phone: '',
        email: '',
        gstin: '',
        address: 'Counter Cash Sale',
        city: '',
        state: '',
        pincode: ''
      });
    }
  }, [selectedCustomer]);

  // Customer Selection Handlers
  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setCustomerSearchQuery(cust ? cust.name : '');
    setIsCustomerDropdownOpen(false);
  };

  const handleSelectWalkIn = () => {
    setSelectedCustomer(null);
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(false);
  };

  // Create New Customer via Modal
  const handleCreateCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim()) {
      toastError('Customer Name is required');
      return;
    }

    setIsSavingCustomer(true);
    try {
      const payload = {
        ...newCustomerForm,
        opening_balance: parseFloat(newCustomerForm.opening_balance || 0)
      };
      const created = await customerService.createCustomer(payload);
      toastSuccess(`Customer ${created.name || newCustomerForm.name} created successfully!`);
      
      const updatedList = [created, ...customers];
      setCustomers(updatedList);
      
      handleSelectCustomer(created);
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
        pincode: '',
        opening_balance: '0'
      });
    } catch (err) {
      toastError(err.message || 'Failed to create new customer');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // Billing Address Update Handler
  const handleSaveBillingAddressEdit = async () => {
    if (shouldUpdatePermanentAddress && selectedCustomer?.id) {
      try {
        await customerService.updateCustomer(selectedCustomer.id, {
          name: billingAddress.name,
          phone: billingAddress.phone,
          email: billingAddress.email,
          address: billingAddress.address,
          city: billingAddress.city,
          state: billingAddress.state,
          pincode: billingAddress.pincode,
          gst_number: billingAddress.gstin
        });
        toastSuccess('Permanent customer profile address updated!');
      } catch (err) {
        toastError('Failed to update permanent customer profile');
      }
    }
    setIsEditAddressModalOpen(false);
  };

  // Helper to determine product price based on pricing mode
  const getProductPrice = (item, mode) => {
    if (!item) return 0;
    const effMode = mode || (selectedCustomer?.customerType === 'WHOLESALE' ? 'WHOLESALE' : invoiceType);
    if (effMode === 'PURCHASE') {
      return Number(item.purchase_price ?? item.purchasePrice ?? item.retail_price ?? item.retailPrice ?? 0);
    }
    if (effMode === 'DEALER') {
      return Number(item.dealer_price ?? item.dealerPrice ?? item.wholesale_price ?? item.wholesalePrice ?? item.retail_price ?? item.retailPrice ?? 0);
    }
    if (effMode === 'WHOLESALE') {
      return Number(item.wholesale_price ?? item.wholesalePrice ?? item.retail_price ?? item.retailPrice ?? 0);
    }
    return Number(item.retail_price ?? item.retailPrice ?? 0);
  };

  // Cart Management
  const handleProductClick = (prod) => {
    const vars = prod.product_variants || prod.variants || [];
    if (prod.has_variants || vars.length > 0) {
      setSelectedProductForVariant(prod);
      setIsVariantModalOpen(true);
    } else {
      handleAddToCart(prod, null);
    }
  };

  const handleAddToCart = (product, variant = null) => {
    const targetItem = variant || product;
    const unitPrice = getProductPrice(targetItem, invoiceType);
    const colorName = variant?.colors?.name || variant?.color || '';
    const sizeName = variant?.sizes?.name || variant?.size || '';
    const varLabel = variant ? (variant.variant_name || [colorName, sizeName].filter(Boolean).join(' / ') || 'Variant') : null;

    const cartKey = variant ? `${product.id}-${variant.id}` : product.id;
    const existingIndex = cart.findIndex((item) => item.cartKey === cartKey);

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
          sku: variant?.sku || product.sku || 'N/A',
          barcode: variant?.barcode || product.barcode || '',
          unitPrice,
          quantity: 1,
          gstPercentage: Number(product.gst_percentage || product.gstPercentage || 5),
          hsnCode: product.hsn_code || '6109'
        }
      ]);
    }
  };

  const handleQuantityChange = (cartKey, delta) => {
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

  const handleRemoveFromCart = (cartKey) => {
    setCart(cart.filter((item) => item.cartKey !== cartKey));
  };

  const handleClearCart = () => {
    setCart([]);
    setTradeDiscountValue('0');
    setSchemeDiscountValue('0');
    setCashDiscountValue('0');
    setLessValue('0');
    setNotes('');
  };

  // Universal Backend Scanner Resolver
  const [unknownScanCode, setUnknownScanCode] = useState(null);
  const [isUnknownScanModalOpen, setIsUnknownScanModalOpen] = useState(false);
  const [legacyProductName, setLegacyProductName] = useState('');
  const [legacyProductPrice, setLegacyProductPrice] = useState('');

  const handleScanCodeSubmit = async (scannedCode) => {
    if (!scannedCode || !scannedCode.trim()) return;
    const cleanCode = scannedCode.trim();

    try {
      const res = await productService.scanCode(cleanCode);
      const item = res.data || res;

      if (item && item.id) {
        const cartKey = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
        const existingIndex = cart.findIndex((c) => c.cartKey === cartKey);

        if (existingIndex > -1) {
          const updated = [...cart];
          updated[existingIndex].quantity += 1;
          setCart(updated);
          toastSuccess(`Scanned: ${item.name} — Qty updated to ${updated[existingIndex].quantity}`);
        } else {
          setCart([
            ...cart,
            {
              cartKey,
              productId: item.productId,
              variantId: item.variantId || null,
              name: item.name,
              variantName: item.variant_name || (item.color || item.size ? [item.color, item.size].filter(Boolean).join(' / ') : null),
              sku: item.sku || item.uniqueNumber || 'N/A',
              barcode: item.barcode || item.uniqueNumber || '',
              unitPrice: item.unitPrice || 0,
              quantity: 1,
              gstPercentage: Number(item.gstPercentage || 0),
              hsnCode: item.hsnCode || ''
            }
          ]);
          if (item.isAutoCreated) {
            toastSuccess(`Created Legacy Product #${cleanCode} & added to POS!`);
          } else {
            toastSuccess(`Scanned: ${item.name} added to invoice`);
          }
        }
        setProductSearchQuery('');
      }
    } catch (err) {
      toastError(err.message || `Failed to process scan code "${cleanCode}"`);
    }
  };

  // Barcode / SKU scan Enter Key Handler
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && productSearchQuery.trim()) {
      e.preventDefault();
      handleScanCodeSubmit(productSearchQuery);
    }
  };

  // POS Calculation Breakdown (Sequential Discount Order & Less After GST)
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

  // GST calculated on Taxable Amount proportionally (Exempt/0% if applyGst is false)
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
  const effectivePaidAmount = isCreditPayment ? 0 : parseFloat(amountPaid || grandTotal);
  const balanceDue = Math.max(0, grandTotal - effectivePaidAmount);

  // Continue to Billing handler
  const handleContinueToBilling = () => {
    if (cart.length === 0) {
      toastError('Please add at least one product to the cart before continuing.');
      return;
    }
    setActiveStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back to Products handler
  const handleBackToProducts = () => {
    setActiveStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Sale Invoice to Backend API
  const handleConfirmSale = async () => {
    if (cart.length === 0) {
      toastError('Cart is empty. Please add products before confirming sale.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        invoice_type: 'SALE',
        invoice_number: invoiceNumber && invoiceNumber.trim() !== '' ? invoiceNumber.trim() : undefined,
        order_number: orderNumber && orderNumber.trim() !== '' ? orderNumber.trim() : undefined,
        customer_id: selectedCustomer ? selectedCustomer.id : null,
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
      const createdSale = res.data || res;
      
      // Attach detailed breakdown & customer info for print template
      createdSale.orderNumber = createdSale.orderNumber || createdSale.order_number || orderNumber;
      createdSale.invoiceNumber = createdSale.invoiceNumber || createdSale.invoice_number || invoiceNumber;
      createdSale.tradeDiscount = tradeDiscountAmt;
      createdSale.schemeDiscount = schemeDiscountAmt;
      createdSale.cashDiscount = cashDiscountAmt;
      createdSale.lessAmount = lessAmt;
      createdSale.customer = selectedCustomer || {
        name: billingAddress.name,
        phone: billingAddress.phone,
        email: billingAddress.email,
        address: billingAddress.address,
        gstin: billingAddress.gstin
      };

      toastSuccess(`Sale confirmed! Invoice ${createdSale.invoiceNumber || createdSale.invoice_number} generated.`);
      
      // If sale originated from quotation, mark quotation as CONVERTED
      if (quotationId) {
        try {
          await quotationService.updateStatus(quotationId, 'CONVERTED');
        } catch (e) {
          console.warn('Could not update quotation status to CONVERTED:', e);
        }
      }

      // If sale originated from customer online order, link sale and update order status to BILLED
      if (customerOrderId && createdSale.id) {
        try {
          await customerOrderService.linkSale(customerOrderId, createdSale.id);
        } catch (e) {
          console.warn('Could not link sale to customer order:', e);
        }
      }

      setCompletedSale(createdSale);
      handleClearCart();
      setActiveStep(1);

      // Increment Order Reference and Invoice Number for the next sale counter
      setOrderNumber((prev) => incrementSeqNumber(prev));
      setInvoiceNumber((prev) => incrementSeqNumber(prev));

      // Refresh product list and stock levels
      try {
        const prodRes = await productService.getProducts();
        setProducts(prodRes.data || prodRes || []);
      } catch (e) {}

      // Sync next sequential numbers from backend
      try {
        const nextRes = await salesService.getNextNumber();
        const nextData = nextRes?.data || nextRes;
        if (nextData) {
          const ord = nextData.orderNumber || nextData.order_number;
          const inv = nextData.invoiceNumber || nextData.invoice_number;
          if (ord) setOrderNumber(ord);
          if (inv) setInvoiceNumber(inv);
        }
      } catch (e) {}
    } catch (err) {
      toastError(err.message || 'Failed to complete sale transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Catalog supporting Name, SKU, Barcode, Category, Brand, Color, Size
  const filteredProducts = products.filter((p) => {
    const q = productSearchQuery.toLowerCase().trim();
    const vars = p.product_variants || p.variants || [];
    
    // Check variant colors and sizes matching search query
    const variantMatches = vars.some((v) => {
      const vColor = (v.colors?.name || v.color || '').toLowerCase();
      const vSize = (v.sizes?.name || v.size || '').toLowerCase();
      const vSku = (v.sku || '').toLowerCase();
      const vBarcode = (v.barcode || '').toLowerCase();
      const vName = (v.variant_name || '').toLowerCase();
      return (
        vColor.includes(q) ||
        vSize.includes(q) ||
        vSku.includes(q) ||
        vBarcode.includes(q) ||
        vName.includes(q)
      );
    });

    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.brand_name && p.brand_name.toLowerCase().includes(q)) ||
      (p.category_name && p.category_name.toLowerCase().includes(q)) ||
      (p.color && p.color.toLowerCase().includes(q)) ||
      (p.size && p.size.toLowerCase().includes(q)) ||
      variantMatches;

    const matchesCategory = !selectedCategory || p.category_id === selectedCategory || p.categoryId === selectedCategory;
    const matchesBrand = !selectedBrand || p.brand_id === selectedBrand || p.brandId === selectedBrand || p.brand === selectedBrand;

    return matchesQuery && matchesCategory && matchesBrand;
  });

  // Filtered Customer Search
  const filteredCustomers = customers.filter((c) => {
    const q = customerSearchQuery.toLowerCase();
    if (!q) return true;
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.customer_code && c.customer_code.toLowerCase().includes(q)) ||
      (c.gst_number && c.gst_number.toLowerCase().includes(q))
    );
  });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-4 max-w-7xl mx-auto pb-12">
          
          {/* TOP POS HEADER & STEP PROGRESS BAR */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs space-y-2.5">
            {/* Row 1: Title & Order / Inv / GST quick tags */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl text-white shadow-sm shrink-0">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="text-sm sm:text-base font-black tracking-tight uppercase text-slate-900 leading-none">
                      Point of Sale
                    </h1>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      POS
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                    Retail & Garment Billing
                  </p>
                </div>
              </div>

              {/* Badges: Order Ref, Invoice Ref, GST Toggle */}
              <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                {loadedCustomerOrder && (
                  <div className="bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg flex items-center space-x-1 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                    <span className="font-mono font-bold text-indigo-900">#{loadedCustomerOrder.order_number}</span>
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] flex items-center space-x-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Ord:</span>
                  <span className="font-mono font-bold text-blue-700">{orderNumber}</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] flex items-center space-x-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Inv:</span>
                  <span className="font-mono font-bold text-emerald-700">{invoiceNumber}</span>
                </div>

                {isAdmin && (
                  <div className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-lg flex items-center space-x-1 text-[10px]">
                    <span className="text-[9px] uppercase font-bold text-slate-400">GST:</span>
                    <div className="flex bg-white p-0.5 rounded border border-slate-200 space-x-0.5">
                      <button
                        type="button"
                        onClick={() => setApplyGst(true)}
                        className={`px-1.5 py-0.5 text-[9px] font-black rounded transition cursor-pointer ${
                          applyGst ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        ON
                      </button>
                      <button
                        type="button"
                        onClick={() => setApplyGst(false)}
                        className={`px-1.5 py-0.5 text-[9px] font-black rounded transition cursor-pointer ${
                          !applyGst ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        OFF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Unified Step Switcher + Cart Summary */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80 max-w-xs">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                    activeStep === 1
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px]">1</span>
                  <span>Products</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (cart.length > 0) setActiveStep(2);
                    else toastError('Add at least one product to enter Customer & Billing step');
                  }}
                  className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                    activeStep === 2
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px]">2</span>
                  <span>Billing</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-bold flex items-center space-x-1">
                <span>Cart:</span>
                <span className="text-blue-600 font-black">{cart.length}</span>
                <span className="text-slate-800 font-extrabold">({formatCurrency(subtotal)})</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STEP 1: PRODUCT SELECTION UI (Restaurant POS Layout Inspired)             */}
          {/* ========================================================================= */}
          {activeStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* LEFT COLUMN: PRODUCT CATALOG GRID (8 Columns) */}
              <div className="lg:col-span-8 space-y-3.5">
                
                {/* Search Bar, Category & Brand Dropdowns, Pricing Modes */}
                <Card className="p-3 sm:p-3.5 space-y-2.5 bg-white border-slate-200/90 shadow-xs">
                  {/* Top Row: Search & Camera Scan */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        ref={searchInputRef}
                        placeholder="Search products by name, SKU, barcode..."
                        icon={Search}
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className="h-9 text-xs pr-9 bg-slate-50/70 border-slate-200 rounded-xl"
                      />
                      {productSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setProductSearchQuery('')}
                          className="absolute right-7 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleScanCodeSubmit(productSearchQuery)}
                        title="Submit barcode / SKU search"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                      >
                        <ScanBarcode className="w-4 h-4" />
                      </button>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsCameraScannerOpen(true)}
                        className="h-9 px-2.5 sm:px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 shrink-0 transition-all cursor-pointer active:scale-95"
                        title="Open Camera Barcode / QR Scanner"
                      >
                        <ScanBarcode className="w-4 h-4" />
                        <span className="hidden sm:inline">Camera</span>
                      </button>
                    )}
                  </div>

                  {/* Pricing Mode Selector (Retail, Wholesale, Purchase, Dealer) */}
                  <div className="flex items-center justify-between gap-1 overflow-x-auto bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-inner no-scrollbar">
                    {[
                      { id: 'RETAIL', label: 'Retail' },
                      { id: 'WHOLESALE', label: 'Wholesale' },
                      { id: 'PURCHASE', label: 'Purchase' },
                      { id: 'DEALER', label: 'Dealer' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setInvoiceType(mode.id)}
                        className={`flex-1 py-1 px-2 rounded-lg font-black text-[10.5px] sm:text-[11px] text-center transition-all cursor-pointer whitespace-nowrap ${
                          invoiceType === mode.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  {/* Filter Dropdowns & Category Horizontal Pills */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    {/* Category Scrollable Pills */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 no-scrollbar flex-1">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer border ${
                          !selectedCategory
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-100 bg-white'
                        }`}
                      >
                        Show All
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer border ${
                            selectedCategory === cat.id
                              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-100 bg-white'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>

                    {/* Brand Filter Selector */}
                    {brands.length > 0 && (
                      <div className="shrink-0 w-28 sm:w-36">
                        <select
                          value={selectedBrand}
                          onChange={(e) => setSelectedBrand(e.target.value)}
                          className="w-full h-7 sm:h-8 text-[10.5px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">All Brands</option>
                          {brands.map((b) => (
                            <option key={b.id || b.name} value={b.id || b.name}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Product Catalog Grid (Compact Cards with Variant indicators & Prices) */}
                <div className="bg-slate-50/50 p-1 rounded-2xl border border-slate-200/80 min-h-[440px]">
                  {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-24 space-y-2">
                      <Spinner size="lg" className="text-blue-600" />
                      <p className="text-xs font-bold text-slate-500">Loading catalog...</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                      <Boxes className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-bold text-slate-700">No products match your search</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Search by name, SKU, barcode, color, or size, or select a different category.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 p-1">
                      {filteredProducts.map((prod) => {
                        const price = getProductPrice(prod, invoiceType);
                        const vars = prod.product_variants || prod.variants || [];
                        const hasVar = prod.has_variants || vars.length > 0;
                        const stockQty = prod.stock_quantity ?? prod.quantity ?? 0;
                        const isOutOfStock = stockQty <= 0 && !hasVar;

                        return (
                          <div
                            key={prod.id}
                            className="bg-white border border-slate-200/90 hover:border-blue-500 hover:shadow-md rounded-2xl p-3 flex flex-col justify-between transition-all group relative cursor-pointer"
                            onClick={() => handleProductClick(prod)}
                          >
                            {/* Product Header & Variant Tag */}
                            <div>
                              <div className="flex items-start justify-between gap-1 mb-1.5">
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
                                  {prod.sku || 'N/A'}
                                </span>
                                {hasVar ? (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md shrink-0">
                                    {vars.length} Variants
                                  </span>
                                ) : (
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${
                                    stockQty > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700'
                                  }`}>
                                    {stockQty > 0 ? `${stockQty} ${prod.unit || 'PCS'}` : 'Out of Stock'}
                                  </span>
                                )}
                              </div>

                              {/* Product Name */}
                              <h3 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 line-clamp-2 leading-snug">
                                {prod.name}
                              </h3>

                              {/* Attributes: Category, Brand, Color, Size */}
                              <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                                {prod.category?.name && (
                                  <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                                    {prod.category.name}
                                  </span>
                                )}
                                {prod.color && (
                                  <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                                    {prod.color}
                                  </span>
                                )}
                                {prod.size && (
                                  <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                                    {prod.size}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Price & Add Action */}
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                              <div>
                                <span className="text-sm font-black text-slate-900 group-hover:text-blue-600">
                                  {formatCurrency(price)}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProductClick(prod);
                                }}
                                className="w-7 h-7 rounded-full bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                                title="Add to current cart"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: CURRENT CART PANEL (4 Columns) */}
              <div className="lg:col-span-4">
                <Card className="p-4 flex flex-col h-full bg-white border-slate-200 shadow-sm sticky top-20 rounded-2xl">
                  {/* Cart Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 leading-none">
                          Current Cart
                        </h2>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {cart.length} unique {cart.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>

                    {cart.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCart}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center cursor-pointer px-2 py-1 rounded-md hover:bg-rose-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Clear
                      </button>
                    )}
                  </div>

                  {/* Customer Badge in Cart Panel if Customer is pre-selected */}
                  {(selectedCustomer || billingAddress.name) && (
                    <div className="mt-2.5 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0">
                          {(selectedCustomer?.name || billingAddress.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {selectedCustomer?.name || billingAddress.name}
                          </p>
                          {(selectedCustomer?.phone || billingAddress.phone) && (
                            <p className="text-[10px] font-mono text-slate-500">
                              {selectedCustomer?.phone || billingAddress.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 shrink-0">
                        {selectedCustomer?.customer_type || 'Customer'}
                      </span>
                    </div>
                  )}

                  {/* Cart Line Items */}
                  <div className="flex-1 min-h-[220px] max-h-[380px] overflow-y-auto space-y-2 py-2 pr-1 no-scrollbar">
                    {cart.length === 0 ? (
                      <div className="py-16 flex flex-col items-center justify-center text-center text-slate-400">
                        <ShoppingCart className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="text-xs font-bold text-slate-700">Your cart is empty</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Click any product card or scan a barcode to add items.
                        </p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div
                          key={item.cartKey}
                          className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs transition hover:bg-slate-100/70"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-bold text-slate-900 truncate">
                              {item.name}
                            </p>
                            {item.variantName && (
                              <p className="text-[10px] font-extrabold text-blue-600 truncate">
                                {item.variantName}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-500 font-mono">
                              {formatCurrency(item.unitPrice)}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Quantity Controls */}
                            <div className="flex items-center border border-slate-300 bg-white rounded-lg">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.cartKey, -1)}
                                className="p-1 hover:bg-slate-100 text-slate-600 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 font-bold text-slate-900 text-xs">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.cartKey, 1)}
                                className="p-1 hover:bg-slate-100 text-slate-600 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Line Total */}
                            <span className="font-black text-slate-900 w-16 text-right text-xs">
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </span>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(item.cartKey)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Cart Totals & CONTINUE TO BILLING Button */}
                  <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Total Items:</span>
                      <span className="font-bold text-slate-900">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)} units
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Subtotal:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Current Total:</span>
                      <span className="text-base font-black text-blue-600">{formatCurrency(subtotal)}</span>
                    </div>

                    {/* Step 1 Primary Action: CONTINUE TO BILLING */}
                    <Button
                      type="button"
                      className="w-full h-11 text-xs font-black tracking-wider uppercase shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white mt-2 rounded-xl cursor-pointer flex items-center justify-center space-x-1.5 transition-all active:scale-98"
                      disabled={cart.length === 0}
                      onClick={handleContinueToBilling}
                    >
                      <span>CONTINUE TO BILLING</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>

                    <p className="text-[10px] text-center text-slate-400">
                      Step 1 preserves your cart while selecting customer & payment.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: CUSTOMER & BILLING UI                                             */}
          {/* ========================================================================= */}
          {activeStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* LEFT COLUMN: CUSTOMER SELECTION & INVOICE ITEMS REVIEW (7 Columns) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Back to Products Bar */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBackToProducts}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition shadow-2xs cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 text-blue-600" />
                    <span>Back to Products</span>
                  </button>

                  <div className="text-xs text-slate-500 font-medium">
                    Order Ref: <span className="font-mono font-bold text-slate-800">{orderNumber}</span>
                  </div>
                </div>

                {/* CUSTOMER SELECTION CARD */}
                <Card className="p-3 sm:p-4 space-y-2.5 bg-white border-slate-200/90 shadow-xs relative rounded-2xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Customer Details
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsNewCustomerModalOpen(true)}
                      className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center active:scale-98 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1" />
                      <span>+ Customer</span>
                    </button>
                  </div>

                  {/* Customer Search Auto-complete input */}
                  <div className="relative">
                    <Input
                      placeholder="Search customer by name, phone or GSTIN..."
                      icon={Search}
                      value={customerSearchQuery}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        setIsCustomerDropdownOpen(true);
                      }}
                      onFocus={() => setIsCustomerDropdownOpen(true)}
                      className="h-9 text-xs bg-slate-50/70 border-slate-200 rounded-xl"
                    />

                    {isCustomerDropdownOpen && (
                      <div className="absolute z-30 left-0 right-0 top-11 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                        <button
                          type="button"
                          onClick={handleSelectWalkIn}
                          className="w-full p-2.5 text-left hover:bg-blue-50/60 flex items-center justify-between text-xs font-bold text-blue-600 cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span>Walk-in Customer (Counter Cash Sale)</span>
                          </div>
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-extrabold">Select</span>
                        </button>
                        {filteredCustomers.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCustomer(c)}
                            className="w-full p-2.5 text-left hover:bg-slate-50 flex items-center justify-between text-xs transition cursor-pointer"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{c.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                Phone: {c.phone || 'N/A'} {c.gst_number ? `| GST: ${c.gst_number}` : ''}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                              {c.customerType || c.customer_type || 'RETAIL'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Active Selected Customer & Billing Address Summary */}
                  <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                          <span className="font-extrabold text-xs text-slate-900">
                            {billingAddress.name || 'Walk-in Customer'}
                          </span>
                          {selectedCustomer ? (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded uppercase">
                              {selectedCustomer.customer_type || 'RETAIL'}
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded uppercase">
                              Walk-in
                            </span>
                          )}
                          {billingAddress.gstin && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                              GSTIN: {billingAddress.gstin}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {billingAddress.phone ? `${billingAddress.phone} • ` : ''}
                          {billingAddress.address || 'Counter Cash Sale'}
                          {billingAddress.city ? `, ${billingAddress.city}` : ''}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsEditAddressModalOpen(true)}
                        className="px-2 py-1 rounded-lg text-[10.5px] font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 hover:text-blue-600 transition-all flex items-center justify-center shadow-2xs cursor-pointer shrink-0"
                      >
                        <Edit3 className="w-3 h-3 mr-1 text-blue-600" />
                        Edit Address
                      </button>
                    </div>
                  </div>

                  {/* Sale Date & Due Date Fields */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-0.5 block uppercase tracking-wider">Sale Date:</label>
                      <input
                        type="date"
                        value={saleDate}
                        onChange={(e) => setSaleDate(e.target.value)}
                        className="w-full h-8 px-2 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50/70"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-0.5 block uppercase tracking-wider">Due Date:</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full h-8 px-2 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50/70"
                      />
                    </div>
                  </div>
                </Card>

                {/* INVOICE LINE ITEMS TABLE REVIEW */}
                <Card className="p-4 space-y-3 bg-white border-slate-200 shadow-xs rounded-2xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Boxes className="w-3.5 h-3.5" />
                      </div>
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Products & Quantities ({cart.length})
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={handleBackToProducts}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-0.5" /> Modify Products
                    </button>
                  </div>

                  {/* Products Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-extrabold text-[10px] uppercase">
                          <th className="py-2 pr-2">Item</th>
                          <th className="py-2 px-2 text-center">Qty</th>
                          <th className="py-2 px-2 text-right">Unit Price</th>
                          {applyGst && <th className="py-2 px-2 text-center">GST %</th>}
                          <th className="py-2 pl-2 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cart.map((item) => (
                          <tr key={item.cartKey} className="hover:bg-slate-50">
                            <td className="py-2.5 pr-2">
                              <p className="font-bold text-slate-900">{item.name}</p>
                              {item.variantName && (
                                <p className="text-[10px] text-blue-600 font-bold">{item.variantName}</p>
                              )}
                              <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</p>
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <div className="inline-flex items-center border border-slate-200 rounded-lg bg-white">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.cartKey, -1)}
                                  className="px-1.5 py-0.5 hover:bg-slate-100 text-slate-600"
                                >
                                  -
                                </button>
                                <span className="px-2 font-bold text-slate-900">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.cartKey, 1)}
                                  className="px-1.5 py-0.5 hover:bg-slate-100 text-slate-600"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-700">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            {applyGst && (
                              <td className="py-2.5 px-2 text-center">
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                                  {item.gstPercentage}%
                                </span>
                              </td>
                            )}
                            <td className="py-2.5 pl-2 text-right font-bold text-slate-900">
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Order Notes input */}
                  <div className="pt-2">
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Notes / Terms:</label>
                    <input
                      type="text"
                      placeholder="Add any delivery or payment remarks here..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-8.5 px-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50"
                    />
                  </div>
                </Card>
              </div>

              {/* RIGHT COLUMN: DISCOUNTS, BILL SUMMARY & PAYMENT (5 Columns) */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* DISCOUNTS & ADJUSTMENTS ACCORDION CARD */}
                <Card className="p-3.5 bg-white border-slate-200 shadow-xs rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setIsDiscountExpanded(!isDiscountExpanded)}
                    className="w-full flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[11px] font-black uppercase tracking-wider">Discounts & Adjustments</span>
                    </div>
                    <div className="flex items-center space-x-1 text-blue-600 font-semibold text-[11px]">
                      {isDiscountExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </button>

                  {isDiscountExpanded && (
                    <div className="pt-3 mt-2 border-t border-slate-100 space-y-2.5 text-xs">
                      {/* Trade Discount */}
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-slate-700 font-semibold text-[11px] shrink-0">Trade Discount:</label>
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={tradeDiscountValue}
                            onChange={(e) => setTradeDiscountValue(e.target.value)}
                            className="w-16 px-1.5 py-1 text-right text-xs border border-slate-300 rounded-md font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="flex border border-slate-300 rounded-md overflow-hidden text-[10px] font-bold">
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
                        <label className="text-slate-700 font-semibold text-[11px] shrink-0">Scheme Discount:</label>
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={schemeDiscountValue}
                            onChange={(e) => setSchemeDiscountValue(e.target.value)}
                            className="w-16 px-1.5 py-1 text-right text-xs border border-slate-300 rounded-md font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="flex border border-slate-300 rounded-md overflow-hidden text-[10px] font-bold">
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
                        <label className="text-slate-700 font-semibold text-[11px] shrink-0">Cash Discount:</label>
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            disabled={isCreditPayment}
                            value={isCreditPayment ? '0' : cashDiscountValue}
                            onChange={(e) => setCashDiscountValue(e.target.value)}
                            className={`w-16 px-1.5 py-1 text-right text-xs border rounded-md font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              isCreditPayment ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'border-slate-300'
                            }`}
                          />
                          <div className="flex border border-slate-300 rounded-md overflow-hidden text-[10px] font-bold">
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
                        <label className="text-slate-700 font-bold text-[11px] shrink-0">Less (After GST):</label>
                        <div className="flex items-center space-x-1">
                          <span className="text-slate-400 font-bold text-[11px]">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={lessValue}
                            onChange={(e) => setLessValue(e.target.value)}
                            className="w-20 px-1.5 py-1 text-right text-xs border border-slate-300 rounded-md font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* INVOICE BILL SUMMARY & PAYMENT CARD */}
                <Card className="p-4 bg-white border-slate-200 shadow-sm rounded-2xl space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100">
                    Bill Summary & Payment
                  </h3>

                  <div className="space-y-1.5 text-xs font-medium">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
                    </div>

                    {tradeDiscountAmt > 0 && (
                      <div className="flex justify-between text-rose-600 text-[11px]">
                        <span>Trade Discount ({tradeDiscountType === 'PERCENT' ? `${tradeVal}%` : '₹'})</span>
                        <span>-{formatCurrency(tradeDiscountAmt)}</span>
                      </div>
                    )}

                    {schemeDiscountAmt > 0 && (
                      <div className="flex justify-between text-rose-600 text-[11px]">
                        <span>Scheme Discount ({schemeDiscountType === 'PERCENT' ? `${schemeVal}%` : '₹'})</span>
                        <span>-{formatCurrency(schemeDiscountAmt)}</span>
                      </div>
                    )}

                    {cashDiscountAmt > 0 && (
                      <div className="flex justify-between text-rose-600 text-[11px]">
                        <span>Cash Discount ({cashDiscountType === 'PERCENT' ? `${cashVal}%` : '₹'})</span>
                        <span>-{formatCurrency(cashDiscountAmt)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-800 font-bold pt-1.5 border-t border-slate-100">
                      <span>Taxable Amount</span>
                      <span className="text-slate-900 font-black">{formatCurrency(taxableAmount)}</span>
                    </div>

                    {applyGst && (
                      <>
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>CGST</span>
                          <span>{formatCurrency(cgstAmount)}</span>
                        </div>

                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>SGST</span>
                          <span>{formatCurrency(sgstAmount)}</span>
                        </div>
                      </>
                    )}

                    {lessAmt > 0 && (
                      <div className="flex justify-between text-rose-600 text-[11px]">
                        <span>Less (After GST)</span>
                        <span>-{formatCurrency(lessAmt)}</span>
                      </div>
                    )}

                    {roundOff !== '0.00' && (
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Round Off</span>
                        <span>{roundOff > 0 ? `+${roundOff}` : roundOff}</span>
                      </div>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  <div className="pt-3 border-t border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-700 block text-[11px]">Select Payment Mode:</span>
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
                          className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            paymentMethod === mode.id
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Amount & Balance Due */}
                  {!isCreditPayment && (
                    <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Amount Received:
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder={String(grandTotal)}
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          className="w-full h-8.5 px-2.5 font-bold text-slate-900 border border-slate-200 rounded-lg bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Balance Due:
                        </label>
                        <div className="h-8.5 px-2.5 font-bold flex items-center bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-mono">
                          {formatCurrency(balanceDue)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GRAND TOTAL */}
                  <div className="flex justify-between items-center text-base font-black text-slate-900 pt-3 border-t-2 border-slate-300">
                    <div>
                      <span className="block leading-none">GRAND TOTAL</span>
                      <span className="text-[10px] text-slate-400 font-normal">Includes taxes & adjustments</span>
                    </div>
                    <span className="text-xl font-black text-blue-600">{formatCurrency(grandTotal)}</span>
                  </div>

                  {/* COMPLETE SALE PRIMARY BUTTON */}
                  <Button
                    type="button"
                    className="w-full h-12 text-xs font-black tracking-wider uppercase shadow-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white mt-2 rounded-xl cursor-pointer flex items-center justify-center space-x-2 transition-all active:scale-98"
                    disabled={cart.length === 0 || isSubmitting}
                    isLoading={isSubmitting}
                    onClick={handleConfirmSale}
                  >
                    <Zap className="w-4 h-4 mr-1 text-amber-300" />
                    <span>COMPLETE SALE ({formatCurrency(grandTotal)})</span>
                  </Button>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* MODAL 1: NEW CUSTOMER MODAL */}
        <Modal
          isOpen={isNewCustomerModalOpen}
          onClose={() => setIsNewCustomerModalOpen(false)}
          title="Create New Customer Profile"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateCustomerSubmit} className="space-y-3 text-xs">
            <Input
              label="Customer Name *"
              required
              placeholder="e.g. ABC Garments / John Doe"
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
                type="email"
                placeholder="customer@example.com"
                value={newCustomerForm.email}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
              />
            </div>

            <div className={`grid ${newCustomerForm.customer_type === 'BUSINESS' ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
              <Select
                label="Customer Type"
                value={newCustomerForm.customer_type}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, customer_type: e.target.value })}
                options={[
                  { value: 'RETAIL', label: 'Retail Customer' },
                  { value: 'WHOLESALE', label: 'Wholesale Buyer' },
                  { value: 'DEALER', label: 'Dealer / Stockist' },
                  { value: 'BUSINESS', label: 'Shop Customer' }
                ]}
              />
              {newCustomerForm.customer_type !== 'BUSINESS' && (
                <Input
                  label="GSTIN Number"
                  placeholder="33ABCDE1234F1Z5"
                  value={newCustomerForm.gst_number}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, gst_number: e.target.value })}
                />
              )}
            </div>

            <Input
              label="Billing Address"
              placeholder="Street name, landmark..."
              value={newCustomerForm.address}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
            />

            <div className="grid grid-cols-3 gap-2">
              <Input
                label="City"
                placeholder="Madurai"
                value={newCustomerForm.city}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
              />
              <Input
                label="State"
                placeholder="Tamil Nadu"
                value={newCustomerForm.state}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, state: e.target.value })}
              />
              <Input
                label="Pincode"
                placeholder="625001"
                value={newCustomerForm.pincode}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, pincode: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsNewCustomerModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSavingCustomer} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="w-4 h-4 mr-1" />
                Save & Select Customer
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL 2: EDIT BILLING ADDRESS SNAPSHOT MODAL */}
        <Modal
          isOpen={isEditAddressModalOpen}
          onClose={() => setIsEditAddressModalOpen(false)}
          title="Edit Invoice Billing Address Snapshot"
          maxWidth="max-w-md"
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-500 text-[11px]">
              Modifying this address sets the snapshot for this invoice bill without overwriting historic sales.
            </p>

            <Input
              label="Billing Name"
              value={billingAddress.name}
              onChange={(e) => setBillingAddress({ ...billingAddress, name: e.target.value })}
            />

            <Input
              label="Address Line"
              value={billingAddress.address}
              onChange={(e) => setBillingAddress({ ...billingAddress, address: e.target.value })}
            />

            <div className="grid grid-cols-3 gap-2">
              <Input
                label="City"
                value={billingAddress.city}
                onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
              />
              <Input
                label="State"
                value={billingAddress.state}
                onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
              />
              <Input
                label="Pincode"
                value={billingAddress.pincode}
                onChange={(e) => setBillingAddress({ ...billingAddress, pincode: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Phone"
                value={billingAddress.phone}
                onChange={(e) => setBillingAddress({ ...billingAddress, phone: e.target.value })}
              />
              <Input
                label="GSTIN"
                value={billingAddress.gstin}
                onChange={(e) => setBillingAddress({ ...billingAddress, gstin: e.target.value })}
              />
            </div>

            {selectedCustomer && (
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 pt-2 border-t">
                <input
                  type="checkbox"
                  checked={shouldUpdatePermanentAddress}
                  onChange={(e) => setShouldUpdatePermanentAddress(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>Update Customer Permanent Profile Address</span>
              </label>
            )}

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsEditAddressModalOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveBillingAddressEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
                Apply to Invoice
              </Button>
            </div>
          </div>
        </Modal>

        {/* MODAL 3: INVOICE CONFIRMED & PRINT MODAL */}
        <Modal
          isOpen={!!completedSale}
          onClose={() => setCompletedSale(null)}
          title="Sales Invoice Generated"
          maxWidth="max-w-3xl"
        >
          <InvoicePrintTemplate sale={completedSale} onClose={() => setCompletedSale(null)} />
        </Modal>

        {/* MODAL 4: VARIANT SELECTOR MODAL */}
        <Modal
          isOpen={isVariantModalOpen}
          onClose={() => setIsVariantModalOpen(false)}
          title={`Select Variant for ${selectedProductForVariant?.name || 'Product'}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-3 p-1">
            <p className="text-xs text-slate-500 font-medium">
              Select the exact color/size combination to add to the cart:
            </p>
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {(selectedProductForVariant?.product_variants || selectedProductForVariant?.variants || []).map((v) => {
                const colorName = v.colors?.name || v.color || '';
                const sizeName = v.sizes?.name || v.size || '';
                const vLabel = v.variant_name || [colorName, sizeName].filter(Boolean).join(' / ') || `Variant #${v.id.slice(0, 6)}`;
                const price = getProductPrice(v, invoiceType) || getProductPrice(selectedProductForVariant, invoiceType);
                const stock = Number(v.current_stock ?? v.quantity ?? v.stockQuantity ?? 0);

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      handleAddToCart(selectedProductForVariant, v);
                      setIsVariantModalOpen(false);
                      setSelectedProductForVariant(null);
                    }}
                    className="w-full p-3 text-left border border-slate-200/90 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl transition flex items-center justify-between group shadow-2xs cursor-pointer"
                  >
                    <div>
                      <p className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600">
                        {vLabel}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        SKU: {v.sku || selectedProductForVariant?.sku || 'N/A'} {v.barcode ? `| Bar: ${v.barcode}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm text-blue-600">{formatCurrency(price)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        Stock: {stock} {selectedProductForVariant?.unit || 'PCS'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsVariantModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* MODAL 5: UNKNOWN SCAN RESOLVER MODAL */}
        <Modal
          isOpen={isUnknownScanModalOpen}
          onClose={() => setIsUnknownScanModalOpen(false)}
          title="Product Not Found"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 p-1">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-semibold">
              Scanned Value: <span className="font-mono font-bold text-rose-950">{unknownScanCode}</span>
            </div>

            <p className="text-xs text-slate-600">
              No matching product, variant, or unique number was found for this code.
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsUnknownScanModalOpen(false);
                  router.push(`/products/new?barcode=${encodeURIComponent(unknownScanCode || '')}`);
                }}
                className="w-full p-3 text-left border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 rounded-xl transition font-bold text-xs text-indigo-950 flex items-center justify-between cursor-pointer"
              >
                <span>1. Create New Product</span>
                <span className="text-[10px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded font-bold">New Product</span>
              </button>

              <div className="p-3 border border-slate-200 rounded-xl space-y-2 bg-slate-50">
                <span className="text-xs font-bold text-slate-900 block">2. Add as Legacy Product</span>
                <input
                  type="text"
                  placeholder="Legacy Product Name (e.g. Classic Cotton Saree)"
                  value={legacyProductName}
                  onChange={(e) => setLegacyProductName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border text-xs bg-white"
                />
                <input
                  type="number"
                  placeholder="Selling Price (₹)"
                  value={legacyProductPrice}
                  onChange={(e) => setLegacyProductPrice(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!legacyProductName.trim() || !legacyProductPrice) {
                      toastError('Please enter product name and selling price');
                      return;
                    }
                    const cartKey = `LEGACY-${unknownScanCode}-${Date.now()}`;
                    setCart([
                      ...cart,
                      {
                        cartKey,
                        productId: `LEGACY-${Date.now()}`,
                        variantId: null,
                        name: legacyProductName.trim(),
                        variantName: null,
                        sku: unknownScanCode,
                        barcode: unknownScanCode,
                        uniqueNumber: unknownScanCode,
                        unitPrice: parseFloat(legacyProductPrice || '0'),
                        quantity: 1,
                        gstPercentage: 5,
                        hsnCode: '6109'
                      }
                    ]);
                    toastSuccess(`Legacy product ${legacyProductName} added to cart`);
                    setIsUnknownScanModalOpen(false);
                    setLegacyProductName('');
                    setLegacyProductPrice('');
                  }}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Add Legacy Item to Invoice
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsUnknownScanModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* LIVE CAMERA BARCODE & QR SCANNER MODAL */}
        <CameraBarcodeScannerModal
          isOpen={isCameraScannerOpen}
          onClose={() => setIsCameraScannerOpen(false)}
          onScanSuccess={handleCameraScanSuccess}
          title="Scan Product Barcode / QR Code"
          description="Point your camera at a barcode or QR code on the product label. It will be scanned and automatically added to the cart."
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function NewSalePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Spinner size="lg" /></div>}>
      <NewSaleContent />
    </Suspense>
  );
}
