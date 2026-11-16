'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Search, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { stockService } from '@/services/stockService';

export default function StockMovementsPage() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const res = await stockService.getTransactions();
      setMovements(res.data || res || []);
    } catch (err) {
      console.error('Failed to fetch stock movements', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = movements.filter(m => 
    m.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.reference_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <ArrowLeftRight className="w-6 h-6 text-blue-600 shrink-0" />
                <span>Stock Movements Log</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">Track all stock IN, OUT, Sale, Purchase, and Adjustment transactions</p>
            </div>

            <button
              onClick={fetchMovements}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 sm:py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              <span>Refresh Audit Log</span>
            </button>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by product name, transaction type, or reference number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm outline-none"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading stock audit log...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              No stock movements logged yet.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[850px]">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-4 whitespace-nowrap min-w-[150px]">Date & Time</th>
                      <th className="p-4 whitespace-nowrap min-w-[150px]">Product</th>
                      <th className="p-4 whitespace-nowrap min-w-[100px]">Variant</th>
                      <th className="p-4 whitespace-nowrap min-w-[130px]">Transaction Type</th>
                      <th className="p-4 whitespace-nowrap min-w-[120px]">Reference</th>
                      <th className="p-4 text-center whitespace-nowrap min-w-[80px]">Qty In</th>
                      <th className="p-4 text-center whitespace-nowrap min-w-[80px]">Qty Out</th>
                      <th className="p-4 whitespace-nowrap min-w-[100px]">User</th>
                      <th className="p-4 whitespace-nowrap min-w-[120px]">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filtered.map((m) => {
                      const qty = Number(m.quantity || m.quantity_change || 0);
                      const isPositive = qty >= 0 || ['PURCHASE', 'STOCK_IN', 'SALE_RETURN', 'ADJUSTMENT_IN', 'OPENING'].includes(m.transaction_type || m.type);
                      const typeLabel = m.transaction_type || m.type || 'STOCK_MOVEMENT';
                      const variantStr = [m.product_variants?.colors?.name, m.product_variants?.sizes?.name].filter(Boolean).join(' / ') || '-';
                      const userName = m.users?.name || 'Admin';

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60">
                          <td className="p-4 text-slate-600 whitespace-nowrap">
                            {new Date(m.transaction_date || m.created_at || Date.now()).toLocaleString()}
                          </td>
                          <td className="p-4 font-bold text-slate-900 whitespace-nowrap">
                            {m.products?.name || 'Product Item'}
                            <div className="text-[10px] text-slate-400 font-mono">SKU: {m.products?.sku || 'N/A'}</div>
                          </td>
                          <td className="p-4 text-slate-600 font-medium whitespace-nowrap">
                            {variantStr}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                              isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                              <span>{typeLabel}</span>
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                            {m.reference_number || m.reference_id || '-'}
                          </td>
                          <td className="p-4 text-center font-bold text-emerald-600 whitespace-nowrap">
                            {qty > 0 ? `+${qty}` : '-'}
                          </td>
                          <td className="p-4 text-center font-bold text-rose-600 whitespace-nowrap">
                            {qty < 0 ? Math.abs(qty) : '-'}
                          </td>
                          <td className="p-4 text-slate-700 font-semibold whitespace-nowrap">
                            {userName}
                          </td>
                          <td className="p-4 text-slate-500 whitespace-nowrap">
                            {m.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

