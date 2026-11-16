'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PackageCheck, 
  Plus, 
  Search, 
  Trash2, 
  Calendar, 
  FileText,
  Mail,
  ChevronDown,
  ChevronRight,
  Building2,
  DollarSign,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye
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
import { DatePicker } from '@/components/ui/DatePicker';
import { purchaseService } from '@/services/purchaseService';
import { supplierService } from '@/services/supplierService';
import { productService } from '@/services/productService';
import { paymentService } from '@/services/paymentService';
import { emailService } from '@/services/emailService';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/utils';
import { usePermission } from '@/hooks/usePermission';

export default function PurchasesPage() {
  const router = useRouter();
  const { toastSuccess, toastError, confirm } = useToast();
  const { can } = usePermission();

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sendingPurId, setSendingPurId] = useState(null);

  // Group Expansion States
  const [expandedSupplierIds, setExpandedSupplierIds] = useState(new Set());
  const [expandedPurchaseIds, setExpandedPurchaseIds] = useState(new Set());

  // Record Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentSupplier, setPaymentSupplier] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    referenceNumber: '',
    notes: ''
  });
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);

  // New Purchase Entry Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Purchase Form
  const [supplierId, setSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseItems, setPurchaseItems] = useState([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [purRes, supRes, prodRes] = await Promise.all([
        purchaseService.getPurchases({ search }),
        supplierService.getSuppliers(),
        productService.getProducts()
      ]);
      const purList = purRes.data || purRes.purchases || purRes || [];
      const items = Array.isArray(purList) ? purList : [];
      setPurchases(items);
      setSuppliers(supRes.data || supRes || []);
      setProducts(prodRes.data || prodRes || []);

      // Auto-expand all suppliers when searching
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const autoSuppIds = new Set();
        const autoPurIds = new Set();

        items.forEach((pur) => {
          const supp = pur.suppliers || pur.supplier;
          const suppName = (supp?.name || '').toLowerCase();
          const suppCode = (supp?.supplier_code || '').toLowerCase();
          const purNum = (pur.purchase_number || pur.purchaseNumber || '').toLowerCase();

          const hasMatchingItem = (pur.purchase_items || []).some(it => 
            (it.product_name || '').toLowerCase().includes(query)
          );

          if (suppName.includes(query) || suppCode.includes(query) || purNum.includes(query) || hasMatchingItem) {
            const sId = supp?.id || pur.supplier_id || 'UNASSIGNED';
            autoSuppIds.add(sId);
            autoPurIds.add(pur.id);
          }
        });

        setExpandedSupplierIds(autoSuppIds);
        setExpandedPurchaseIds(autoPurIds);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  // Group purchases by Parent Supplier
  const groupedSuppliers = useMemo(() => {
    const map = new Map();

    purchases.forEach((pur) => {
      const supp = pur.suppliers || pur.supplier;
      const suppId = supp?.id || pur.supplier_id || 'UNASSIGNED';
      const suppName = supp?.name || 'Unassigned Vendor';
      const suppEmail = supp?.email || '';
      const suppPhone = supp?.phone || '';
      const suppGstin = supp?.gst_number || supp?.gstin || '';
      const suppCode = supp?.supplier_code || '';

      if (!map.has(suppId)) {
        map.set(suppId, {
          supplierId: suppId,
          supplierName: suppName,
          supplierEmail: suppEmail,
          supplierPhone: suppPhone,
          supplierGstin: suppGstin,
          supplierCode: suppCode,
          supplierObj: supp,
          purchases: [],
          totalCost: 0,
          totalPaid: 0,
          totalBalance: 0
        });
      }

      const group = map.get(suppId);
      group.purchases.push(pur);
      group.totalCost += Number(pur.grand_total ?? pur.subtotal ?? 0);
      group.totalPaid += Number(pur.paid_amount ?? 0);
      group.totalBalance += Number(pur.balance_amount ?? (pur.grand_total - pur.paid_amount) ?? 0);
    });

    return Array.from(map.values());
  }, [purchases]);

  const toggleSupplierExpand = (suppId) => {
    setExpandedSupplierIds((prev) => {
      const next = new Set(prev);
      if (next.has(suppId)) next.delete(suppId);
      else next.add(suppId);
      return next;
    });
  };

  const togglePurchaseExpand = (purId) => {
    setExpandedPurchaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(purId)) next.delete(purId);
      else next.add(purId);
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedSupplierIds(new Set(groupedSuppliers.map(g => g.supplierId)));
    setExpandedPurchaseIds(new Set(purchases.map(p => p.id)));
  };

  const handleCollapseAll = () => {
    setExpandedSupplierIds(new Set());
    setExpandedPurchaseIds(new Set());
  };

  const handleEmailSupplier = async (pur, suppEmail) => {
    const isConfirmed = await confirm({
      title: 'Email Purchase Order to Supplier?',
      message: `Send purchase order ${pur.purchase_number || pur.purchaseNumber || 'PUR'} to ${suppEmail}?`,
      confirmText: 'Send Email',
      cancelText: 'Cancel'
    });

    if (isConfirmed) {
      setSendingPurId(pur.id);
      try {
        await emailService.resendPurchaseOrder(pur.id);
        toastSuccess(`Purchase order email sent successfully to ${suppEmail}`);
      } catch (err) {
        toastError(err.message || 'Failed to send purchase order email');
      } finally {
        setSendingPurId(null);
      }
    }
  };

  const handleOpenPaymentModal = (supp, pur = null) => {
    setPaymentSupplier(supp);
    setSelectedPurchase(pur);
    setPaymentData({
      amount: pur ? String(pur.balance_amount || pur.grand_total || 0) : String(supp.totalBalance || 0),
      paymentMethod: 'CASH',
      referenceNumber: '',
      notes: pur ? `Payment for Bill #${pur.purchase_number}` : 'Supplier Account Settlement'
    });
    setIsPaymentModalOpen(true);
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toastError('Please enter a valid payment amount');
      return;
    }

    setIsPaymentSubmitting(true);
    try {
      await paymentService.createSupplierPayment({
        supplier_id: paymentSupplier?.supplierId || paymentSupplier?.id,
        purchase_id: selectedPurchase?.id || null,
        amount: parseFloat(paymentData.amount),
        payment_method: paymentData.paymentMethod,
        reference_number: paymentData.referenceNumber,
        notes: paymentData.notes
      });

      toastSuccess(`Payment of ${formatCurrency(paymentData.amount)} recorded successfully`);
      setIsPaymentModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toastError(err.message || 'Failed to record supplier payment');
    } finally {
      setIsPaymentSubmitting(false);
    }
  };

  // Purchase Form Handlers
  const handleAddItemRow = () => {
    if (products.length === 0) return;
    const firstProd = products[0];
    const vars = firstProd.product_variants || firstProd.variants || [];
    const firstVar = vars.length > 0 ? vars[0] : null;

    setPurchaseItems([
      ...purchaseItems,
      {
        productId: firstProd.id,
        variantId: firstVar ? firstVar.id : '',
        quantity: 10,
        unitCost: firstVar?.purchase_price ?? firstVar?.cost_price ?? firstProd.purchasePrice ?? firstProd.costPrice ?? 100,
        taxRate: firstProd.taxRate ? (firstProd.taxRate.rate || firstProd.taxRate) : 0
      }
    ]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...purchaseItems];
    updated[index][field] = value;

    if (field === 'productId') {
      const prod = products.find((p) => String(p.id) === String(value));
      if (prod) {
        const vars = prod.product_variants || prod.variants || [];
        const firstVar = vars.length > 0 ? vars[0] : null;
        updated[index].variantId = firstVar ? firstVar.id : '';
        updated[index].unitCost = firstVar?.purchase_price ?? firstVar?.cost_price ?? prod.purchasePrice ?? prod.costPrice ?? 100;
        updated[index].taxRate = prod.taxRate ? (prod.taxRate.rate || prod.taxRate) : 0;
      }
    } else if (field === 'variantId') {
      const prod = products.find((p) => String(p.id) === String(updated[index].productId));
      if (prod) {
        const vars = prod.product_variants || prod.variants || [];
        const selectedVar = vars.find((v) => String(v.id) === String(value));
        if (selectedVar) {
          updated[index].unitCost = selectedVar.purchase_price ?? selectedVar.cost_price ?? updated[index].unitCost;
        }
      }
    }

    setPurchaseItems(updated);
  };

  const handleRemoveItemRow = (index) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () =>
    purchaseItems.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.unitCost || 0)), 0);

  const calculateTax = () =>
    purchaseItems.reduce((sum, item) => {
      const sub = parseFloat(item.quantity || 0) * parseFloat(item.unitCost || 0);
      return sum + (sub * (parseFloat(item.taxRate || 0) / 100));
    }, 0);

  const totalAmount = calculateSubtotal() + calculateTax();

  const handleSavePurchase = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!supplierId) {
      setFormError('Please select a supplier');
      return;
    }
    if (purchaseItems.length === 0) {
      setFormError('Please add at least one item to purchase bill');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        supplierId,
        supplierInvoiceNumber: supplierInvoiceNumber || `PUR-${Date.now()}`,
        purchaseDate,
        items: purchaseItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: parseFloat(item.quantity),
          unitCost: parseFloat(item.unitCost),
          taxRate: parseFloat(item.taxRate || 0)
        }))
      };

      await purchaseService.createPurchase(payload);
      toastSuccess('Purchase Inward recorded! Stock automatically increased.');
      setIsModalOpen(false);
      setPurchaseItems([]);
      setSupplierInvoiceNumber('');
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Failed to record purchase entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute permissions={['purchases.view', 'purchases.read']}>
      <DashboardLayout>
        <div className="p-3 sm:p-6 max-w-[1600px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <PackageCheck className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 shrink-0" />
                <span>Purchases & Vendor Stocking</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Grouped by Parent Supplier → Purchase Bills → Variant Stocking
              </p>
            </div>
            {can('purchases.create') && (
              <Button onClick={() => {
                setIsModalOpen(true);
                if (purchaseItems.length === 0 && products.length > 0) handleAddItemRow();
              }} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-xs justify-center font-bold rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                New Purchase Entry
              </Button>
            )}
          </div>

          {/* Search & Group Expansion Controls */}
          <Card className="p-4 bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-96">
              <Input
                placeholder="Search supplier, bill #, product, or SKU..."
                icon={Search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-50 border-slate-200 text-xs"
              />
            </div>
          </Card>

          {/* Grouped Supplier List */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" className="text-blue-600" />
            </div>
          ) : groupedSuppliers.length === 0 ? (
            <Card className="p-12 text-center bg-white border border-slate-200">
              <EmptyState
                icon={PackageCheck}
                title="No Purchases Recorded"
                description="Record inward purchase bills to automatically update supplier payables and variant stock."
                action={
                  can('purchases.create') && (
                    <Button size="sm" onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      New Purchase Entry
                    </Button>
                  )
                }
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {groupedSuppliers.map((group) => {
                const isSupplierExpanded = expandedSupplierIds.has(group.supplierId);

                return (
                  <Card key={group.supplierId} className="bg-white border border-slate-200/80 shadow-sm overflow-hidden transition">
                    
                    {/* PARENT SUPPLIER ROW */}
                    <div 
                      onClick={() => toggleSupplierExpand(group.supplierId)}
                      className="p-3 sm:p-4 bg-slate-50/80 hover:bg-slate-100/80 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 border-b border-slate-200/80 select-none"
                    >
                      <div className="flex items-center space-x-2.5 sm:space-x-3">
                        <button className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 transition shrink-0">
                          {isSupplierExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{group.supplierName}</h3>
                            <Badge variant="secondary" className="text-[9px] sm:text-[10px] font-bold">
                              {group.purchases.length} Purchase Bill(s)
                            </Badge>
                          </div>
                          <div className="text-[11px] sm:text-xs text-slate-500 font-mono mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            {group.supplierCode && <span>Code: {group.supplierCode}</span>}
                            {group.supplierGstin && <span>GSTIN: {group.supplierGstin}</span>}
                            {group.supplierPhone && <span>Phone: {group.supplierPhone}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Financial Totals Summary for Supplier */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:flex items-center gap-2 sm:gap-4 md:gap-6 text-xs text-left sm:text-right pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                        <div className="bg-white md:bg-transparent p-2 md:p-0 rounded-xl border md:border-0 border-slate-100">
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase block">Total Purchases</span>
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{formatCurrency(group.totalCost)}</span>
                        </div>
                        <div className="bg-white md:bg-transparent p-2 md:p-0 rounded-xl border md:border-0 border-slate-100">
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase block">Paid</span>
                          <span className="font-extrabold text-emerald-600 text-xs sm:text-sm">{formatCurrency(group.totalPaid)}</span>
                        </div>
                        <div className="bg-white md:bg-transparent p-2 md:p-0 rounded-xl border md:border-0 border-slate-100">
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase block">Outstanding</span>
                          <span className={`font-extrabold text-xs sm:text-sm ${group.totalBalance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            {formatCurrency(group.totalBalance)}
                          </span>
                        </div>
                        <div onClick={(e) => e.stopPropagation()} className="col-span-3 sm:col-span-1 md:col-span-auto flex items-center md:pl-2">
                          {group.supplierId !== 'UNASSIGNED' && (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => router.push(`/suppliers/${group.supplierId}`)}
                              className="w-full sm:w-auto text-[11px] text-blue-600 border-blue-200 hover:bg-blue-50 justify-center h-7 rounded-lg"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Profile
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SUB-CHILD PURCHASES LIST (RESPONSIVE CARDS ON MOBILE, TABLE ON DESKTOP) */}
                    {isSupplierExpanded && (
                      <div className="bg-white">
                        {/* MOBILE PURCHASES CARD LIST (< md screens) */}
                        <div className="block md:hidden divide-y divide-slate-100 p-2.5 space-y-2.5">
                          {group.purchases.map((pur) => {
                            const isPurExpanded = expandedPurchaseIds.has(pur.id);
                            const suppEmail = group.supplierEmail;
                            const purNum = pur.purchase_number || pur.purchaseNumber || pur.supplierInvoiceNumber || `PUR-${pur.id}`;
                            const purDate = pur.purchase_date || pur.createdAt;
                            const items = pur.purchase_items || pur.items || [];
                            const totalCost = Number(pur.grand_total ?? pur.totalAmount ?? 0);
                            const paidAmt = Number(pur.paid_amount ?? 0);
                            const balanceAmt = Number(pur.balance_amount ?? (totalCost - paidAmt) ?? 0);

                            return (
                              <div
                                key={pur.id}
                                className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3 space-y-2.5 transition shadow-2xs"
                              >
                                {/* Mobile Card Header */}
                                <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                                  <div className="flex items-center space-x-1.5 flex-wrap">
                                    <span className="font-mono font-bold text-xs text-blue-600">
                                      #{purNum}
                                    </span>
                                    <Badge variant="outline" className="bg-white text-slate-700 text-[9px]">
                                      {items.length} Item(s)
                                    </Badge>
                                  </div>
                                  <div className="text-[11px] font-semibold text-slate-500">
                                    {new Date(purDate || Date.now()).toLocaleDateString()}
                                  </div>
                                </div>

                                {/* Financial row */}
                                <div className="grid grid-cols-3 gap-1.5 text-xs bg-white p-2 rounded-xl border border-slate-200/60">
                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Cost</span>
                                    <span className="font-extrabold text-slate-900 text-xs">{formatCurrency(totalCost)}</span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Paid</span>
                                    <span className="font-extrabold text-emerald-600 text-xs">{formatCurrency(paidAmt)}</span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Balance</span>
                                    <span className={`font-extrabold text-xs ${balanceAmt > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                      {formatCurrency(balanceAmt)}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions & Items Toggle Button */}
                                <div className="flex items-center justify-between gap-2 pt-1">
                                  <button
                                    onClick={() => togglePurchaseExpand(pur.id)}
                                    className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-blue-600 transition py-1 px-2 rounded-lg bg-white border border-slate-200"
                                  >
                                    {isPurExpanded ? <ChevronDown className="w-3.5 h-3.5 text-blue-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                    <span>{isPurExpanded ? 'Hide Items' : `View ${items.length} Item(s)`}</span>
                                  </button>

                                  <div className="flex items-center gap-1.5">
                                    {suppEmail && (
                                      <Button
                                        size="xs"
                                        variant="outline"
                                        onClick={() => handleEmailSupplier(pur, suppEmail)}
                                        isLoading={sendingPurId === pur.id}
                                        className="text-[11px] text-indigo-600 border-indigo-200 hover:bg-indigo-50 h-7 rounded-lg"
                                      >
                                        <Mail className="w-3 h-3 mr-1" />
                                        Email
                                      </Button>
                                    )}

                                    {can('payments.create') && balanceAmt > 0 && (
                                      <Button
                                        size="xs"
                                        onClick={() => handleOpenPaymentModal(group, pur)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-3 rounded-lg font-bold"
                                      >
                                        Pay
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Mobile Grandchild Items Cards */}
                                {isPurExpanded && (
                                  <div className="pt-2 border-t border-slate-200/60 space-y-2">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                      Inward Items Breakdown
                                    </div>
                                    <div className="space-y-1.5">
                                      {items.map((item, idx) => {
                                        const variant = item.product_variants;
                                        let varText = 'Standard';
                                        if (variant) {
                                          const cName = variant.colors?.name || '';
                                          const sName = variant.sizes?.name || '';
                                          if (cName && sName) varText = `${cName} / ${sName}`;
                                          else if (cName) varText = cName;
                                          else if (sName) varText = sName;
                                          else if (variant.variant_name) varText = variant.variant_name;
                                        }

                                        return (
                                          <div key={idx} className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                                            <div className="min-w-0 pr-2">
                                              <p className="font-bold text-slate-900 text-xs truncate">{item.product_name}</p>
                                              <p className="text-[10px] text-slate-500 mt-0.5">
                                                {varText} • <span className="font-extrabold text-blue-600">{Number(item.quantity)} PCS</span>
                                              </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                              <p className="font-mono text-[11px] text-slate-500">@{formatCurrency(item.unit_price)}</p>
                                              <p className="font-extrabold text-slate-900 text-xs">
                                                {formatCurrency(item.total_amount || (item.quantity * item.unit_price))}
                                              </p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* DESKTOP PURCHASES TABLE (>= md screens) */}
                        <div className="hidden md:block overflow-x-auto divide-y divide-slate-100">
                          <table className="w-full text-left text-xs min-w-[700px]">
                          <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-4 w-10"></th>
                              <th className="py-2.5 px-4">Purchase Bill #</th>
                              <th className="py-2.5 px-4">Bill Date</th>
                              <th className="py-2.5 px-4">Products / Items</th>
                              <th className="py-2.5 px-4 text-right">Total Cost</th>
                              <th className="py-2.5 px-4 text-right">Paid</th>
                              <th className="py-2.5 px-4 text-right">Balance</th>
                              <th className="py-2.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {group.purchases.map((pur) => {
                              const isPurExpanded = expandedPurchaseIds.has(pur.id);
                              const suppEmail = group.supplierEmail;
                              const purNum = pur.purchase_number || pur.purchaseNumber || pur.supplierInvoiceNumber || `PUR-${pur.id}`;
                              const purDate = pur.purchase_date || pur.createdAt;
                              const items = pur.purchase_items || pur.items || [];
                              const totalCost = Number(pur.grand_total ?? pur.totalAmount ?? 0);
                              const paidAmt = Number(pur.paid_amount ?? 0);
                              const balanceAmt = Number(pur.balance_amount ?? (totalCost - paidAmt) ?? 0);

                              return (
                                <React.Fragment key={pur.id}>
                                  <tr className="hover:bg-slate-50/80 transition">
                                    <td className="py-3 px-4">
                                      <button
                                        onClick={() => togglePurchaseExpand(pur.id)}
                                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                                      >
                                        {isPurExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                      </button>
                                    </td>

                                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                                      #{purNum}
                                    </td>

                                    <td className="py-3 px-4 font-semibold text-slate-700">
                                      {new Date(purDate || Date.now()).toLocaleDateString()}
                                    </td>

                                    <td className="py-3 px-4">
                                      <Badge variant="outline" className="bg-slate-50 text-slate-700 text-[10px]">
                                        {items.length} Item(s)
                                      </Badge>
                                    </td>

                                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                                      {formatCurrency(totalCost)}
                                    </td>

                                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                                      {formatCurrency(paidAmt)}
                                    </td>

                                    <td className="py-3 px-4 text-right font-extrabold text-rose-600">
                                      {formatCurrency(balanceAmt)}
                                    </td>

                                    <td className="py-3 px-4 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        {suppEmail ? (
                                          <Button
                                            size="xs"
                                            variant="outline"
                                            onClick={() => handleEmailSupplier(pur, suppEmail)}
                                            isLoading={sendingPurId === pur.id}
                                            className="text-[11px] text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                          >
                                            <Mail className="w-3 h-3 mr-1" />
                                            Email
                                          </Button>
                                        ) : (
                                          <span className="text-[10px] text-slate-400 italic">No email</span>
                                        )}

                                        {can('payments.create') && balanceAmt > 0 && (
                                          <Button
                                            size="xs"
                                            onClick={() => handleOpenPaymentModal(group, pur)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px]"
                                          >
                                            Pay
                                          </Button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>

                                  {/* GRANDCHILD PURCHASE ITEMS (PRODUCT + VARIANT BREAKDOWN) */}
                                  {isPurExpanded && (
                                    <tr className="bg-slate-50/90">
                                      <td colSpan={8} className="p-3 pl-12 border-b border-slate-200">
                                        <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 shadow-inner">
                                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                                            <span>Purchased Products & Variant Stocking Breakdown</span>
                                            <span className="font-mono text-blue-600">Bill Ref: #{purNum}</span>
                                          </div>
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs min-w-[600px]">
                                              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                                              <tr>
                                                <th className="p-2">Product Name</th>
                                                <th className="p-2">Variant / Specs</th>
                                                <th className="p-2 text-right">Inward Qty</th>
                                                <th className="p-2 text-right">Unit Purchase Price</th>
                                                <th className="p-2 text-right">Total Line Amount</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                              {items.map((item, idx) => {
                                                const variant = item.product_variants;
                                                let varText = 'Standard';
                                                if (variant) {
                                                  const cName = variant.colors?.name || '';
                                                  const sName = variant.sizes?.name || '';
                                                  if (cName && sName) varText = `${cName} / ${sName}`;
                                                  else if (cName) varText = cName;
                                                  else if (sName) varText = sName;
                                                  else if (variant.variant_name) varText = variant.variant_name;
                                                }
                                                return (
                                                  <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="p-2 font-bold text-slate-800">{item.product_name}</td>
                                                    <td className="p-2 text-slate-600">{varText}</td>
                                                    <td className="p-2 text-right font-extrabold text-blue-600">{Number(item.quantity)} PCS</td>
                                                    <td className="p-2 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                                                    <td className="p-2 text-right font-extrabold text-slate-900">{formatCurrency(item.total_amount || (item.quantity * item.unit_price))}</td>
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
                    </div>
                  )}
                </Card>
              );
              })}
            </div>
          )}

          {/* Record Supplier Payment Modal */}
          <Modal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            title={`Record Payment to ${paymentSupplier?.supplierName}`}
            size="md"
          >
            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="font-bold text-slate-900">{paymentSupplier?.supplierName}</span>
                </div>
                {selectedPurchase && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Selected Purchase Bill:</span>
                    <span className="font-bold text-blue-600">#{selectedPurchase.purchase_number}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Outstanding Balance:</span>
                  <span className="font-extrabold text-rose-600">
                    {formatCurrency(selectedPurchase ? (selectedPurchase.balance_amount || selectedPurchase.grand_total) : paymentSupplier?.totalBalance)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  placeholder="Enter payment amount"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="text-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <Select
                  value={paymentData.paymentMethod}
                  onChange={(val) => setPaymentData({ ...paymentData, paymentMethod: val })}
                  options={[
                    { value: 'CASH', label: 'Cash' },
                    { value: 'UPI', label: 'UPI / GooglePay / PhonePe' },
                    { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT / RTGS)' },
                    { value: 'CHEQUE', label: 'Cheque' },
                    { value: 'CARD', label: 'Debit / Credit Card' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction Reference / UTR Number
                </label>
                <Input
                  placeholder="e.g. UTR9823749283 / Cheque No"
                  value={paymentData.referenceNumber}
                  onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Notes / Remarks
                </label>
                <Input
                  placeholder="Optional notes"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPaymentSubmitting} className="bg-emerald-600 text-white min-w-[120px]">
                  {isPaymentSubmitting ? <Spinner className="w-4 h-4 mr-2" /> : "Record Payment"}
                </Button>
              </div>
            </form>
          </Modal>

          {/* New Purchase Entry Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Record New Purchase Inward"
            size="2xl"
          >
            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}
            <form onSubmit={handleSavePurchase} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Select Supplier *"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  options={[
                    { value: '', label: '-- Select Vendor --' },
                    ...suppliers.map((s) => ({ value: s.id, label: s.name }))
                  ]}
                />
                <Input
                  label="Supplier Bill / Ref #"
                  placeholder="e.g. INV-2024-889"
                  value={supplierInvoiceNumber}
                  onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                />
                <DatePicker
                  label="Purchase Date"
                  value={purchaseDate}
                  onChange={(val) => setPurchaseDate(val)}
                />
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1.5 border-b border-slate-100 gap-2">
                  <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight leading-snug">Inward Product Items & Variant Stocking</h3>
                  <Button type="button" size="xs" variant="outline" onClick={handleAddItemRow} className="self-end sm:self-auto border-blue-200 text-blue-700 hover:bg-blue-50 font-bold shrink-0">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Row
                  </Button>
                </div>

                <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                  {purchaseItems.map((item, idx) => {
                    const prod = products.find((p) => String(p.id) === String(item.productId));
                    const vars = prod ? (prod.product_variants || prod.variants || []) : [];
                    const selectedVar = vars.find((v) => String(v.id) === String(item.variantId));
                    const currentStock = selectedVar ? (selectedVar.current_stock ?? selectedVar.stock ?? 0) : (prod?.current_stock ?? prod?.stock ?? 0);
                    const qty = parseFloat(item.quantity || 0);
                    const newStock = currentStock + qty;

                    return (
                      <div key={idx} className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/90 space-y-3 shadow-2xs">
                        <div className="grid grid-cols-12 gap-3 items-end">
                          {/* Product Selection */}
                          <div className="col-span-12 sm:col-span-4">
                            <label className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Product</label>
                            <Select
                              value={item.productId}
                              onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                              options={products.map((p) => ({
                                value: p.id,
                                label: `${p.name} ${p.sku ? `(${p.sku})` : ''}`
                              }))}
                            />
                          </div>

                          {/* Variant Selection (Brand / Color / Size) */}
                          <div className="col-span-12 sm:col-span-4">
                            <label className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Variant (Brand / Color / Size)</label>
                            {vars.length > 0 ? (
                              <Select
                                value={item.variantId}
                                onChange={(e) => handleItemChange(idx, 'variantId', e.target.value)}
                                options={vars.map((v) => {
                                  const brandName = v.brands?.name || v.brand?.name || v.brand || '';
                                  const colorName = v.colors?.name || v.color?.name || v.color || '';
                                  const sizeName = v.sizes?.name || v.size?.name || v.size || '';
                                  const labelParts = [brandName, colorName, sizeName].filter(Boolean).join(' / ') || v.sku || `Variant #${v.id}`;
                                  return {
                                    value: v.id,
                                    label: `${labelParts} (Stock: ${v.current_stock ?? v.stock ?? 0})`
                                  };
                                })}
                              />
                            ) : (
                              <div className="text-[11px] text-slate-400 italic py-2">Standard (No Variants)</div>
                            )}
                          </div>

                          {/* Quantity */}
                          <div className="col-span-6 sm:col-span-2">
                            <label className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Inward Qty</label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            />
                          </div>

                          {/* Unit Purchase Price */}
                          <div className="col-span-6 sm:col-span-2">
                            <label className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Purchase Price (₹)</label>
                            <Input
                              type="number"
                              placeholder="Cost Price"
                              value={item.unitCost}
                              onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Subtotal & Stock Change Preview Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] border-t border-slate-200/80">
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-500 font-semibold">Stock Change Preview:</span>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold px-2 py-0.5">
                              Current: {currentStock} Pcs → New: {newStock} Pcs
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-slate-600 font-medium">
                              Total: <span className="font-extrabold text-slate-900 text-xs ml-1">{formatCurrency((item.quantity || 0) * (item.unitCost || 0))}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals Summary */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-700">
                <div>
                  <span className="text-xs font-bold text-slate-600">Total Bill Amount: </span>
                  <span className="text-lg font-black text-blue-700 ml-2">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <span className="text-[11px] text-blue-900/80 font-bold bg-white px-3 py-1 rounded-xl border border-blue-200/60 shadow-2xs">
                  ⚡ Stock credited & recorded automatically
                </span>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto justify-center font-semibold">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white min-w-[150px] shadow-md shadow-blue-600/20 font-bold">
                  {isSubmitting ? <Spinner className="w-4 h-4 mr-2" /> : "Save Purchase Inward"}
                </Button>
              </div>
            </form>
          </Modal>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
