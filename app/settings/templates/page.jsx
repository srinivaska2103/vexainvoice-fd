'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { authService } from '@/services/authService';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { INVOICE_TEMPLATES } from '@/components/invoice/templates';
import A5CustomerShopCopy from '@/components/invoice/templates/A5CustomerShopCopy';
import Thermal80mm from '@/components/invoice/templates/Thermal80mm';
import { FileText, CheckCircle2, Layout, Eye, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function InvoiceTemplatesPage() {
  const { business, updateBusinessState, user } = useAuth();
  const { toastSuccess, toastError } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState(business?.invoice_template || 'DEFAULT_A4');
  const [isSaving, setIsSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const handleSelectTemplate = async (templateId) => {
    setIsSaving(true);
    try {
      const res = await authService.updateBusinessDetails({
        invoice_template: templateId,
      });

      const bizData = res?.data || res?.business || res;
      if (bizData) {
        setSelectedTemplate(templateId);
        if (updateBusinessState) {
          updateBusinessState(bizData);
        }
        toastSuccess(`Invoice template updated to ${INVOICE_TEMPLATES[templateId]?.name || templateId}`);
      } else {
        toastError(res?.message || 'Failed to update invoice template');
      }
    } catch (err) {
      toastError(err.message || 'Error updating template selection');
    } finally {
      setIsSaving(false);
    }
  };

  // Sample actual structure for live preview
  const sampleSale = {
    invoiceNumber: 'INV-2026-001',
    createdAt: new Date().toISOString(),
    paymentMethod: 'CASH',
    items: [
      {
        product_name: 'Sample Product 1',
        quantity: 2,
        unit_price: 250,
        total_amount: 500,
      },
      {
        product_name: 'Sample Product 2',
        quantity: 1,
        unit_price: 500,
        total_amount: 500,
      }
    ],
    totalAmount: 1000,
    paidAmount: 1000,
    discountAmount: 0,
  };

  const sampleBusiness = {
    business_name: business?.business_name || 'My Store / Company',
    address: business?.address || '123 Main Street',
    city: business?.city || 'Madurai',
    state: business?.state || 'Tamil Nadu',
    pin: business?.pin || '625001',
    phone: business?.phone || user?.phone || '+91 98765 43210',
    gstin: business?.gstin || '33ABCDE1234F1Z5',
    logo: business?.logo || null,
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-slate-50 via-indigo-50/40 to-blue-50/50 border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
                <Layout className="w-4 h-4" />
                <span>Settings & Integration</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Invoice Templates</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Choose the invoice format used for printing, downloading, emailing, and WhatsApp sharing.
              </p>
            </div>
            <div className="bg-white border border-indigo-200 px-4 py-2.5 rounded-xl shadow-2xs shrink-0 self-start sm:self-auto">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-600 block">Active Template</span>
              <span className="text-sm font-black text-slate-900">
                {INVOICE_TEMPLATES[business?.invoice_template || 'DEFAULT_A4']?.name || 'Standard A4 Modern'}
              </span>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(INVOICE_TEMPLATES).map((tmpl) => {
              const isSelected = (business?.invoice_template || 'DEFAULT_A4') === tmpl.id;

              return (
                <div
                  key={tmpl.id}
                  className={`bg-white rounded-2xl border-2 transition-all overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-md mb-2">
                          {tmpl.paperSize}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">{tmpl.name}</h3>
                      </div>
                      {isSelected && (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{tmpl.description}</p>

                    {/* Card Graphic Preview */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[160px] text-center">
                      {tmpl.id === 'A5_CUSTOMER_SHOP_COPY' ? (
                        <div className="w-full max-w-[200px] bg-white border border-slate-300 rounded p-2 text-[8px] space-y-1 font-mono shadow-xs text-left">
                          <div className="border-b border-slate-200 pb-1 flex justify-between font-bold text-indigo-950">
                            <span>CUSTOMER COPY</span>
                            <span>TOP</span>
                          </div>
                          <div className="h-4 bg-slate-100 rounded my-1 flex items-center px-1 text-[7px] text-slate-500">
                            Items & Totals
                          </div>
                          <div className="border-t border-dashed border-rose-400 my-1 text-center text-rose-500 text-[7px] font-bold">
                            ✂ CUT HERE
                          </div>
                          <div className="border-b border-slate-200 pb-1 flex justify-between font-bold text-slate-800">
                            <span>SHOP OWNER COPY</span>
                            <span>BOTTOM</span>
                          </div>
                          <div className="h-4 bg-slate-100 rounded my-1 flex items-center px-1 text-[7px] text-slate-500">
                            Same Invoice Information
                          </div>
                        </div>
                      ) : tmpl.id === 'THERMAL_80MM' ? (
                        <div className="w-full max-w-[150px] bg-white border border-slate-300 rounded p-2 text-[8px] space-y-1 font-mono shadow-xs text-center">
                          <div className="font-bold border-b pb-1 text-slate-900 uppercase">RECEIPT 80MM</div>
                          <div className="h-4 bg-slate-100 rounded my-1 text-[7px] flex items-center justify-center text-slate-500">Items & Rates</div>
                          <div className="border-t border-dashed border-slate-400 my-1"></div>
                          <div className="font-extrabold text-[8px] text-slate-900">GRAND TOTAL</div>
                        </div>
                      ) : (
                        <div className="w-full max-w-[200px] bg-white border border-slate-300 rounded p-3 text-[8px] space-y-2 font-mono shadow-xs text-left">
                          <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-1">
                            <span>INVOICE</span>
                            <span>A4 FULL PAGE</span>
                          </div>
                          <div className="h-10 bg-slate-100 rounded my-1"></div>
                          <div className="h-6 bg-slate-50 rounded"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(tmpl.id)}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                      Preview
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl.id)}
                      disabled={isSelected || isSaving}
                      className={`inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-xl transition-colors shadow-xs ${
                        isSelected
                          ? 'bg-emerald-600 text-white cursor-default opacity-90'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      } disabled:opacity-50`}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-white" />
                          Active
                        </>
                      ) : (
                        'Use Template'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Preview Modal */}
          {previewTemplate && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Preview: {INVOICE_TEMPLATES[previewTemplate]?.name}
                    </h2>
                    <p className="text-xs text-slate-500">Structure representation using actual business details</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(null)}
                    className="text-slate-400 hover:text-slate-700 font-bold text-lg px-2"
                  >
                    ✕
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-100 overflow-x-auto">
                  {previewTemplate === 'A5_CUSTOMER_SHOP_COPY' ? (
                    <A5CustomerShopCopy sale={sampleSale} business={sampleBusiness} user={user} />
                  ) : previewTemplate === 'THERMAL_80MM' ? (
                    <Thermal80mm sale={sampleSale} business={sampleBusiness} user={user} />
                  ) : (
                    <div className="w-[700px] mx-auto bg-white p-6 border rounded shadow-xs text-slate-800 text-[11px] font-sans space-y-4">
                      <div className="flex justify-between border-b pb-3">
                        <div>
                          <h1 className="text-xl font-bold">{sampleBusiness.business_name}</h1>
                          <p>{sampleBusiness.address}, {sampleBusiness.city}</p>
                        </div>
                        <div className="text-right">
                          <h2 className="text-2xl font-black">INVOICE</h2>
                          <p>Bill No: INV-2026-001</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded">
                        <p className="font-bold">Billed To: Walk-in Customer</p>
                      </div>
                      <table className="w-full text-left border">
                        <thead className="bg-slate-900 text-white">
                          <tr>
                            <th className="p-2">Item</th>
                            <th className="p-2 text-center">Qty</th>
                            <th className="p-2 text-right">Price</th>
                            <th className="p-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sampleSale.items.map((item, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="p-2">{item.product_name}</td>
                              <td className="p-2 text-center">{item.quantity}</td>
                              <td className="p-2 text-right">₹{item.unit_price}</td>
                              <td className="p-2 text-right">₹{item.total_amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-xs text-slate-500">
                    Paper Size: {INVOICE_TEMPLATES[previewTemplate]?.paperSize}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(null)}
                      className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                    >
                      Close Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectTemplate(previewTemplate);
                        setPreviewTemplate(null);
                      }}
                      className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                    >
                      Use This Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
