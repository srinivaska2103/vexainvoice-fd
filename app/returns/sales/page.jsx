'use client';

import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Plus, 
  Search, 
  FileText 
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { returnService } from '@/services/returnService';
import { salesService } from '@/services/salesService';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export default function SalesReturnsPage() {
  const { toastSuccess, toastError } = useToast();
  const [returns, setReturns] = useState([]);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [saleId, setSaleId] = useState('');
  const [reason, setReason] = useState('Size Fitting Issue / Exchange');
  const [refundAmount, setRefundAmount] = useState('0');

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const [retRes, saleRes] = await Promise.all([
        returnService.getSalesReturns(),
        salesService.getSales({ limit: 50 })
      ]);
      setReturns(retRes.data || retRes || []);
      setSales(saleRes.data || saleRes.sales || saleRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleCreateReturn = async (e) => {
    e.preventDefault();
    if (!saleId) return;
    setIsSubmitting(true);
    try {
      const saleObj = sales.find((s) => s.id === saleId);
      const items = (saleObj?.saleItems || saleObj?.items || []).map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }));

      await returnService.createSalesReturn({
        saleId,
        reason,
        refundAmount: parseFloat(refundAmount || 0),
        items
      });
      setIsModalOpen(false);
      toastSuccess('Sales return processed successfully');
      fetchReturns();
    } catch (err) {
      toastError(err.message || 'Failed to process sales return');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Sales Returns & Credit Notes</h1>
              <p className="text-xs text-slate-500 mt-1">
                Process customer product exchanges, garment size returns & credit notes
              </p>
            </div>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Return Credit Note
            </Button>
          </div>

          {/* Return Records Table */}
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Spinner size="lg" className="text-indigo-600" />
            </div>
          ) : returns.length === 0 ? (
            <Card className="p-8 text-center">
              <EmptyState
                icon={RotateCcw}
                title="No Sales Returns Recorded"
                description="Process returns to restore product stock and issue refunds."
                action={
                  <Button size="sm" onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Return
                  </Button>
                }
              />
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Return Ref #</th>
                      <th className="py-3.5 px-4">Original Invoice #</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Return Reason</th>
                      <th className="py-3.5 px-4">Refund Amount</th>
                      <th className="py-3.5 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {returns.map((ret) => (
                      <tr key={ret.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-bold text-indigo-600">
                          {ret.returnNumber || `RET-${ret.id.substring(0, 6)}`}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {ret.sale?.invoiceNumber || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          {ret.customer?.name || ret.sale?.customer?.name || 'Walk-in Customer'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{ret.reason || 'Customer Return'}</td>
                        <td className="py-3.5 px-4 font-bold text-rose-600">
                          {formatCurrency(ret.refundAmount || ret.totalAmount || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(ret.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* New Sales Return Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Process Sales Return & Exchange"
            maxWidth="max-w-md"
          >
            <form onSubmit={handleCreateReturn} className="space-y-4 text-xs">
              <div>
                <Select
                  label="Select Original Invoice *"
                  value={saleId}
                  onChange={(e) => {
                    setSaleId(e.target.value);
                    const s = sales.find((x) => String(x.id) === String(e.target.value));
                    if (s) setRefundAmount(s.totalAmount);
                  }}
                  placeholder="-- Select Bill --"
                  options={sales.map((s) => ({
                    value: s.id,
                    label: `${s.invoiceNumber} - ${s.customer?.name || 'Walk-in'} (${formatCurrency(s.totalAmount)})`
                  }))}
                />
              </div>

              <Input
                label="Return Reason"
                placeholder="Size defective / fitting issue"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              <Input
                label="Refund Amount (₹)"
                type="number"
                step="0.01"
                required
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Process Return
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
