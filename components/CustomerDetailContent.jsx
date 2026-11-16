'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Phone, Mail, MapPin, Receipt, CreditCard, Clock, FileText, Printer, RotateCcw } from 'lucide-react';
import { customerService } from '@/services/customerService';
import { salesService } from '@/services/salesService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import InvoicePrintTemplate from '@/components/invoice/InvoicePrintTemplate';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CustomerDetailContent({ customerId: propCustomerId }) {
  const params = useParams();
  const id = propCustomerId || params?.id;
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState(null);

  useEffect(() => {
    if (id && id !== 'placeholder') {
      fetchCustomerDetails();
    }
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const [custRes, salesRes, ledgerRes] = await Promise.all([
        customerService.getCustomerById(id),
        salesService.getSales({ customer_id: id, limit: 100 }).catch(() => ({ data: [] })),
        customerService.getCustomerLedger(id).catch(() => ({ data: [] }))
      ]);

      setCustomer(custRes.data || custRes);
      setSalesHistory(salesRes.data || salesRes.sales || salesRes || []);
      setLedger(ledgerRes.data || ledgerRes || []);
    } catch (err) {
      console.error('Failed to fetch customer detail:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading customer profile & sales history...</div>;
  }

  if (!customer) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-slate-500">Customer profile not found.</p>
        <button onClick={() => router.push('/customers')} className="text-blue-600 font-semibold underline">
          Back to Customers List
        </button>
      </div>
    );
  }

  const currentBal = Number(customer.current_balance || customer.currentBalance || customer.outstandingBalance || 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{customer.name}</h1>
            <p className="text-xs text-slate-500">Customer Profile, Sales History & Account Ledger</p>
          </div>
        </div>

        <Link href="/sales/new">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md">
            + New Sale for Customer
          </Button>
        </Link>
      </div>

      {/* Customer Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl font-extrabold">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900">{customer.name}</h2>
              <span className="text-xs text-slate-500 font-mono">
                GSTIN: {customer.gst_number || customer.gstin || 'Retail / Unregistered'}
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{customer.phone || 'No phone recorded'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{customer.email || 'No email recorded'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{customer.address || 'No address recorded'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Account Balance</span>
          <div className={`text-3xl font-black ${currentBal > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatCurrency(currentBal)}
          </div>
          <p className="text-xs text-slate-400">
            {currentBal > 0 ? 'Outstanding balance owed by customer' : 'Customer account is clear'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales Invoices</span>
          <div className="text-3xl font-black text-slate-900">
            {salesHistory.length}
          </div>
          <p className="text-xs text-slate-400">Completed invoices on record</p>
        </div>
      </div>

      {/* Customer Sales History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-extrabold text-slate-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <span className="uppercase text-xs tracking-wider">Customer Sales History</span>
          </div>
          <Badge variant="indigo">{salesHistory.length} Sales</Badge>
        </div>

        {salesHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No past sales invoices found for this customer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase font-semibold tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Sale Date</th>
                  <th className="p-4 text-right">Invoice Amount</th>
                  <th className="p-4 text-right">Amount Paid</th>
                  <th className="p-4 text-right">Balance Due</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {salesHistory.map((s) => {
                  const tot = Number(s.totalAmount || s.total_amount || s.grand_total || 0);
                  const paid = Number(s.paidAmount || s.paid_amount || 0);
                  const bal = Number(s.balanceAmount || s.balance_amount || (tot - paid));
                  const isPaid = bal <= 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-mono font-bold text-blue-600">
                        {s.invoiceNumber || s.invoice_number}
                      </td>
                      <td className="p-4 text-slate-500">
                        {formatDate(s.createdAt || s.invoice_date)}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900">
                        {formatCurrency(tot)}
                      </td>
                      <td className="p-4 text-right font-semibold text-emerald-600">
                        {formatCurrency(paid)}
                      </td>
                      <td className="p-4 text-right font-bold text-rose-600">
                        {formatCurrency(bal)}
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant={isPaid ? 'success' : 'danger'} className="text-[10px]">
                          {isPaid ? 'PAID' : 'DUE'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => setSelectedSaleForPrint(s)}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200/80 rounded-lg transition-all shadow-xs hover:shadow-sm"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                            View / Print
                          </button>
                          <Link href="/sales/returns">
                            <button
                              type="button"
                              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50/80 hover:bg-rose-100 active:bg-rose-200 border border-rose-200/80 rounded-lg transition-all shadow-xs hover:shadow-sm"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                              Return
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Print Modal */}
      <Modal
        isOpen={!!selectedSaleForPrint}
        onClose={() => setSelectedSaleForPrint(null)}
        title={`Invoice Details - ${selectedSaleForPrint?.invoiceNumber || selectedSaleForPrint?.invoice_number}`}
        maxWidth="max-w-3xl"
      >
        <InvoicePrintTemplate sale={selectedSaleForPrint} onClose={() => setSelectedSaleForPrint(null)} />
      </Modal>
    </div>
  );
}
