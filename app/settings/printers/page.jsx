'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { authService } from '@/services/authService';
import { Printer, Save, CheckCircle2, Sliders, HardDrive, Wifi, Sparkles, FileText, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

export default function PrinterSettingsPage() {
  const { business, updateBusinessState } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [invoicePrinter, setInvoicePrinter] = useState('80mm Thermal Printer');
  const [invoiceTemplate, setInvoiceTemplate] = useState(business?.invoice_template || 'THERMAL_80MM');

  const [barcodePrinter, setBarcodePrinter] = useState('Barcode Label Printer');
  const [labelSize, setLabelSize] = useState('50x25');

  const [autoPrint, setAutoPrint] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    if (business?.invoice_template) {
      setInvoiceTemplate(business.invoice_template);
    }
  }, [business]);

  const handleSavePrinterSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess('');

    try {
      const res = await authService.updateBusinessDetails({
        invoice_template: invoiceTemplate,
        printer_settings: JSON.stringify({
          invoicePrinter,
          invoiceTemplate,
          barcodePrinter,
          labelSize,
          autoPrint
        })
      });

      if (res.success || res.business) {
        if (updateBusinessState && res.business) {
          updateBusinessState(res.business);
        }
        toastSuccess('Printer profiles and configuration saved successfully!');
        setSaveSuccess('Printer settings updated in business profile!');
        setTimeout(() => setSaveSuccess(''), 3500);
      } else {
        toastError(res.message || 'Failed to save printer settings');
      }
    } catch (err) {
      toastError(err.message || 'Error saving printer configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6 pb-16">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 via-indigo-50/40 to-blue-50/50 border border-slate-200/90 p-6 rounded-2xl shadow-2xs">
            <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Printer className="w-4 h-4" />
              <span>Settings & Integration</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Printer Profiles & Settings</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Configure default invoice printers, barcode sticker printers, paper sizes, and local print agent settings.
            </p>
          </div>

          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSavePrinterSettings} className="space-y-6">
            {/* 1. INVOICE PRINTER PROFILE */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Invoice Printer Profile</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Select
                    label="Default Invoice Template"
                    value={invoiceTemplate}
                    onChange={(e) => setInvoiceTemplate(e.target.value)}
                    options={[
                      { value: 'THERMAL_80MM', label: 'Thermal 80mm POS Receipt' },
                      { value: 'A5_CUSTOMER_SHOP_COPY', label: 'A5 Customer + Shop Copy (Two Copies on A5)' },
                      { value: 'DEFAULT_A4', label: 'Standard A4 Modern Full Page' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Selected Invoice Printer Name
                  </label>
                  <input
                    type="text"
                    value={invoicePrinter}
                    onChange={(e) => setInvoicePrinter(e.target.value)}
                    placeholder="e.g. POS-80 Thermal Printer or HP LaserJet"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            {/* 2. BARCODE STICKER PRINTER PROFILE */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center space-x-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Barcode Sticker Printer Profile</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Select
                    label="Default Barcode Label Size"
                    value={labelSize}
                    onChange={(e) => setLabelSize(e.target.value)}
                    options={[
                      { value: '50x25', label: '50mm × 25mm (Standard Sticker Roll)' },
                      { value: '50x30', label: '50mm × 30mm (Medium Label)' },
                      { value: '80x50', label: '80mm × 50mm (Large Product Tag)' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Selected Barcode Printer Name
                  </label>
                  <input
                    type="text"
                    value={barcodePrinter}
                    onChange={(e) => setBarcodePrinter(e.target.value)}
                    placeholder="e.g. Zebra ZD420 or Xprinter Barcode Printer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            {/* 3. AUTO-PRINT & ONLINE PRINT AGENT ARCHITECTURE */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Automation & Online Print Bridge</span>
              </h2>

              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="autoPrintCheck"
                  checked={autoPrint}
                  onChange={(e) => setAutoPrint(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="autoPrintCheck" className="text-xs font-bold text-slate-900 cursor-pointer">
                  Automatically open print dialog after completing a sale in POS
                </label>
              </div>

              {/* Local Print Bridge Architecture Info */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 space-y-2 text-xs text-indigo-950">
                <div className="flex items-center space-x-2 font-bold text-indigo-900">
                  <Wifi className="w-4 h-4 text-indigo-600" />
                  <span>VEXA Local Windows Print Bridge</span>
                </div>
                <p className="text-[11px] leading-relaxed text-indigo-800">
                  When running VEXA Online in the web browser, direct local USB thermal and barcode printers are communicated with via browser native printing or the secure VEXA Local Print Agent. Print payloads remain company-isolated and authorized.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                isLoading={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm px-6 py-2.5"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Printer Profiles & Settings
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
