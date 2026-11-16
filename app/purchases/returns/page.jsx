'use client';

import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Plus, 
  Search, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Package,
  Calendar,
  Building2,
  ArrowRight,
  ShieldAlert,
  ArrowDownLeft
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { purchaseService } from '@/services/purchaseService';
import { supplierService } from '@/services/supplierService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export default function PurchaseReturnsPage() {
  const { toastSuccess, toastError } = useToast();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('');

  // Return Processing Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [purchaseSearchText, setPurchaseSearchText] = useState('');
  
  // Return Form State
  const [returnedQuantities, setReturnedQuantities] = useState({});
  const [returnReason, setReturnReason] = useState('Damaged / Defective Stock');
  const [notes, setNotes] = useState('');
  const [confirmedReceipt, setConfirmedReceipt] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [purchRes, suppRes] = await Promise.all([
        purchaseService.getPurchases({ limit: 100 }).catch(() => ({ data: [] })),
        supplierService.getSuppliers().catch(() => ({ data: [] }))
      ]);
      const purchList = purchRes.data || purchRes.purchases || purchRes || [];
      const suppList = suppRes.data || suppRes.suppliers || suppRes || [];
      setPurchases(Array.isArray(purchList) ? purchList : []);
      setSuppliers(Array.isArray(suppList) ? suppList : []);
    } catch (err) {
      console.error('Failed to load purchases data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectPurchaseForReturn = async (purchObj) => {
    try {
      const fullPurch = await purchaseService.getPurchaseById(purchObj.id);
      const detailed = fullPurch.data || fullPurch || purchObj;
      setSelectedPurchase(detailed);

      const initialQtyMap = {};
      const items = detailed.purchase_items || detailed.items || [];
      items.forEach((item, idx) => {
        initialQtyMap[item.id || item.product_id || idx] = 0;
      });
      setReturnedQuantities(initialQtyMap);
    } catch (err) {
      toastError('Failed to load purchase bill line items');
    }
  };

  const handleQtyChange = (itemId, val, maxReturnable) => {
    const parsed = parseInt(val, 10) || 0;
    if (parsed < 0) return;
    if (parsed > maxReturnable) {
      toastError(`Return quantity cannot exceed purchased quantity of ${maxReturnable}`);
      return;
    }
    setReturnedQuantities(prev => ({ ...prev, [itemId]: parsed }));
  };

  const calculateReturnTotal = () => {
    if (!selectedPurchase) return 0;
    const items = selectedPurchase.purchase_items || selectedPurchase.items || [];
    return items.reduce((sum, item, idx) => {
      const key = item.id || item.product_id || idx;
      const qty = returnedQuantities[key] || 0;
      const rate = Number(item.unit_price || item.unitCost || 0);
      return sum + (qty * rate);
    }, 0);
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!selectedPurchase) {
      toastError('Please select a purchase bill to process return');
      return;
    }

    const items = selectedPurchase.purchase_items || selectedPurchase.items || [];
    const itemsToReturn = [];

    items.forEach((item, idx) => {
      const key = item.id || item.product_id || idx;
      const qty = returnedQuantities[key] || 0;
      if (qty > 0) {
        itemsToReturn.push({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: qty
        });
      }
    });

    if (itemsToReturn.length === 0) {
      toastError('Please specify a return quantity of at least 1 unit');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        returned_items: itemsToReturn,
        reason: `${returnReason}${notes ? ' - ' + notes : ''}`
      };

      const res = await purchaseService.returnPurchase(selectedPurchase.id, payload);
      toastSuccess('Purchase return and debit memo recorded successfully!');
      setConfirmedReceipt({
        ...res,
        totalReturnAmount: calculateReturnTotal(),
        purchaseNumber: selectedPurchase.purchase_number,
        supplierName: selectedPurchase.suppliers?.name || 'Vendor'
      });
      fetchData();
    } catch (err) {
      toastError(err.response?.data?.message || err.message || 'Failed to process purchase return');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered purchases that have returned items or notes
  const returnedPurchases = purchases.filter(p => {
    const hasReturnNotes = (p.notes || '').toLowerCase().includes('return');
    const matchesSearch = !searchQuery || 
      (p.purchase_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.suppliers?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSupplier = !selectedSupplierFilter || p.supplier_id === selectedSupplierFilter;
    return hasReturnNotes && matchesSearch && matchesSupplier;
  });

  return (
    <ProtectedRoute permissions={['purchases.view', 'suppliers.view']}>
      <DashboardLayout>
        <div className="space-y-6 pb-20">
          {/* Header Card */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                  <span>SUPPLIER PURCHASE RETURNS & DEBIT NOTES</span>
                </h1>
                <Badge variant="purple" className="text-[10px] font-black uppercase">
                  Debit Memo
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Return damaged or excess inventory to vendors and debit supplier balances
              </p>
            </div>

            <Button
              onClick={() => {
                setSelectedPurchase(null);
                setConfirmedReceipt(null);
                setIsModalOpen(true);
              }}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Process Supplier Return
            </Button>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Bill # or Supplier..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="w-full sm:w-64">
              <select
                value={selectedSupplierFilter}
                onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Returns Table */}
          <Card className="border-slate-200/80 overflow-hidden">
            {isLoading ? (
              <div className="p-16 text-center text-slate-400">
                <Spinner className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <p className="text-xs">Loading supplier returns...</p>
              </div>
            ) : returnedPurchases.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <RotateCcw className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">No Supplier Returns Recorded</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Use the button above to record inventory returned to vendors and generate debit notes.
                </p>
                <Button
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Process Return Now
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs min-w-[750px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                      <th className="py-3.5 px-4">Purchase Bill #</th>
                      <th className="py-3.5 px-4">Supplier</th>
                      <th className="py-3.5 px-4">Bill Date</th>
                      <th className="py-3.5 px-4">Total Amount</th>
                      <th className="py-3.5 px-4">Outstanding Balance</th>
                      <th className="py-3.5 px-4">Return Notes / Debit Memo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {returnedPurchases.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                          {p.purchase_number || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {p.suppliers?.name || 'Vendor'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {p.purchase_date ? formatDate(p.purchase_date) : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                          {formatCurrency(p.grand_total || 0)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-rose-600 whitespace-nowrap">
                          {formatCurrency(p.balance_amount || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                          <span className="line-clamp-2">{p.notes || 'Purchase return recorded'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Modal: Process Supplier Return */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setConfirmedReceipt(null);
          }}
          title={confirmedReceipt ? "Purchase Return Confirmed" : "Process Supplier Purchase Return"}
          maxWidth="max-w-2xl"
        >
          {confirmedReceipt ? (
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Purchase Return Recorded</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Debit Memo has been created and inventory deducted from stock.
              </p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Return Ref #:</span>
                  <span className="font-mono font-bold text-slate-900">{confirmedReceipt.returnRefNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="font-bold text-slate-900">{confirmedReceipt.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Debit Value:</span>
                  <span className="font-extrabold text-emerald-600">{formatCurrency(confirmedReceipt.totalReturnAmount)}</span>
                </div>
              </div>
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  setConfirmedReceipt(null);
                }}
                className="w-full bg-blue-600 text-white font-bold"
              >
                Close Window
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReturn} className="space-y-4 p-1">
              {!selectedPurchase ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 font-medium">
                    Search and select the original inward purchase bill to return stock to the vendor:
                  </p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={purchaseSearchText}
                      onChange={(e) => setPurchaseSearchText(e.target.value)}
                      placeholder="Search bill number or vendor..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl no-scrollbar">
                    {purchases
                      .filter(p => !purchaseSearchText || 
                        (p.purchase_number || '').toLowerCase().includes(purchaseSearchText.toLowerCase()) ||
                        (p.suppliers?.name || '').toLowerCase().includes(purchaseSearchText.toLowerCase())
                      )
                      .slice(0, 10)
                      .map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectPurchaseForReturn(p)}
                          className="p-3 hover:bg-blue-50/60 cursor-pointer transition flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-blue-600 block">{p.purchase_number || 'Bill #' + p.id.slice(0, 8)}</span>
                            <span className="text-slate-800 font-semibold">{p.suppliers?.name || 'Vendor'}</span>
                            <span className="text-slate-400 text-[11px] block">{p.purchase_date ? formatDate(p.purchase_date) : ''}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-slate-900 block">{formatCurrency(p.grand_total || 0)}</span>
                            <span className="text-[10px] text-blue-600 font-bold">Select Bill →</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Purchase Banner */}
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-600 block">Selected Purchase Bill</span>
                      <span className="font-mono font-bold text-slate-900">{selectedPurchase.purchase_number}</span>
                      <span className="text-slate-600 ml-2">({selectedPurchase.suppliers?.name || 'Vendor'})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPurchase(null)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Change Bill
                    </button>
                  </div>

                  {/* Line Items Qty Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Select Items & Quantities to Return:</label>
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                      {(selectedPurchase.purchase_items || selectedPurchase.items || []).map((item, idx) => {
                        const key = item.id || item.product_id || idx;
                        const returnQty = returnedQuantities[key] || 0;
                        const maxQty = Number(item.quantity || 0);

                        return (
                          <div key={key} className="p-3 flex items-center justify-between gap-3 bg-white">
                            <div className="flex-1">
                              <p className="font-bold text-slate-900">{item.product_name || 'Product'}</p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                Purchased: {maxQty} PCS @ {formatCurrency(item.unit_price || 0)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <span className="text-slate-500 text-xs font-medium">Return Qty:</span>
                              <input
                                type="number"
                                min="0"
                                max={maxQty}
                                value={returnQty}
                                onChange={(e) => handleQtyChange(key, e.target.value, maxQty)}
                                className="w-16 p-1.5 border border-slate-300 rounded-lg text-center font-bold text-xs"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Return Reason */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Return Reason</label>
                      <select
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-xl text-xs font-medium bg-white"
                      >
                        <option value="Damaged / Defective Stock">Damaged / Defective Stock</option>
                        <option value="Incorrect Item Shipped">Incorrect Item Shipped</option>
                        <option value="Excess Quantity / Over-stock">Excess Quantity / Over-stock</option>
                        <option value="Expired / Poor Quality">Expired / Poor Quality</option>
                        <option value="Mutual Vendor Agreement">Mutual Vendor Agreement</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Additional Memo Notes</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Optional memo reference..."
                        className="w-full p-2 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>

                  {/* Total Value Summary */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Total Debit Note Value:</span>
                    <span className="text-base font-extrabold text-blue-700">{formatCurrency(calculateReturnTotal())}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      className="text-xs font-bold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                    >
                      {isSubmitting ? 'Processing...' : 'Confirm Supplier Return'}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          )}
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

