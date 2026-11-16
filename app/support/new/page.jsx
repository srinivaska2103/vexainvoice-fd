'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LifeBuoy,
  TicketPlus,
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Send,
  Loader2,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supportService } from '@/services/supportService';
import { useToast } from '@/context/ToastContext';
import { getRolePath } from '@/lib/permissions';
import { ModernDropdown } from '@/components/ui/ModernDropdown';

const TICKET_CATEGORIES = [
  { value: 'LOGIN_AUTHENTICATION', label: 'Login & Authentication' },
  { value: 'DASHBOARD', label: 'Dashboard' },
  { value: 'SALES_INVOICES', label: 'Sales & Invoices' },
  { value: 'PRODUCTS_INVENTORY', label: 'Products & Inventory' },
  { value: 'PURCHASES_SUPPLIERS', label: 'Purchases & Suppliers' },
  { value: 'FINANCE_PAYMENTS', label: 'Finance & Payments' },
  { value: 'QUOTATIONS', label: 'Quotations' },
  { value: 'CUSTOMER_PORTAL', label: 'Customer Portal' },
  { value: 'WHATSAPP_INTEGRATION', label: 'WhatsApp Integration' },
  { value: 'SUBSCRIPTION_BILLING', label: 'Subscription & Billing' },
  { value: 'TECHNICAL_ERROR', label: 'Technical Error' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request' },
  { value: 'OTHER', label: 'Other' }
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low', desc: 'General queries and non-urgent cosmetic issues' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Standard business operation question' },
  { value: 'HIGH', label: 'High', desc: 'Feature not functioning as expected' },
  { value: 'CRITICAL', label: 'Critical', desc: 'Complete billing blockage or critical failure' }
];

export default function RaiseSupportTicketPage() {
  const router = useRouter();
  const { user, role, business } = useAuth();
  const userRoleSlug = user?.custom_role?.slug || user?.role_slug;
  const { toastSuccess, toastError } = useToast();

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('SALES_INVOICES');
  const [priority, setPriority] = useState('MEDIUM');
  const [affectedModule, setAffectedModule] = useState('Sales & Invoices');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (attachments.length + files.length > 5) {
      toastError('Maximum 5 attachments allowed per ticket.');
      return;
    }

    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toastError(`File "${file.name}" exceeds 10MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setAttachments((prev) => [
          ...prev,
          {
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
            base64Data: uploadEvent.target.result
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      toastError('Please enter a ticket subject.');
      return;
    }
    if (!description.trim()) {
      toastError('Please provide a detailed issue description.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        subject: subject.trim(),
        category,
        priority,
        affected_module: affectedModule,
        description: description.trim(),
        current_route: typeof window !== 'undefined' ? window.location.pathname : '',
        app_version: '1.0.0',
        attachments
      };

      const res = await supportService.createTicket(payload);
      toastSuccess(res.message || 'Ticket submitted successfully!');
      setSuccessInfo(res);
    } catch (err) {
      console.error('Submit ticket error:', err);
      toastError(err.message || 'Failed to submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successInfo) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Ticket Registered
              </span>
              <h1 className="text-2xl font-black text-slate-900">
                Support Ticket Logged Successfully
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Your issue has been dispatched to <strong>vexatech.connect@gmail.com</strong> and recorded in our support tracking system.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 text-left space-y-3 shadow-xs">
              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
                <span className="text-slate-500">Ticket Number</span>
                <span className="font-mono font-bold text-sm text-blue-600">{successInfo.ticketNumber}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
                <span className="text-slate-500">Subject</span>
                <span className="font-semibold text-slate-800">{subject}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
                <span className="text-slate-500">Company</span>
                <span className="font-semibold text-slate-800">{business?.business_name || 'My Company'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Priority</span>
                <span className="font-bold text-slate-700">{priority}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={getRolePath(role, userRoleSlug, 'support/tickets')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                View My Support Tickets
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSuccessInfo(null);
                  setSubject('');
                  setDescription('');
                  setAttachments([]);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Raise Another Ticket
              </button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link href={getRolePath(role, userRoleSlug, 'help')} className="text-xs text-slate-500 hover:text-blue-600 flex items-center space-x-1 mb-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Help Center</span>
              </Link>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <TicketPlus className="w-6 h-6 text-blue-600 shrink-0" />
                <span>Raise a Support Ticket</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Submit a technical query or bug report directly to VEXA TECH.
              </p>
            </div>

            {/* Read-only Context Badge */}
            <div className="p-3 rounded-2xl bg-white border border-slate-200 text-left sm:text-right space-y-0.5 w-full sm:w-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logged In As</span>
              <p className="text-xs font-bold text-slate-800">{user?.name} ({user?.role})</p>
              <p className="text-[11px] text-slate-500">{business?.business_name || 'Company'}</p>
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Ticket Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="E.g., Unable to print 80mm thermal receipt on Sale #1042"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category & Affected Module */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Issue Category <span className="text-red-500">*</span>
                </label>
                <ModernDropdown
                  value={category}
                  onChange={(val) => {
                    setCategory(val);
                    const catObj = TICKET_CATEGORIES.find((c) => c.value === val);
                    if (catObj) setAffectedModule(catObj.label);
                  }}
                  options={TICKET_CATEGORIES}
                  placeholder="Select Issue Category..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Affected Module
                </label>
                <input
                  type="text"
                  value={affectedModule}
                  onChange={(e) => setAffectedModule(e.target.value)}
                  placeholder="E.g., POS Billing, Inventory, GST Reports"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Priority Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Priority Level <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? p.value === 'CRITICAL'
                            ? 'border-red-500 bg-red-50/60 ring-2 ring-red-500/20'
                            : p.value === 'HIGH'
                            ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                            : 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-black ${
                          p.value === 'CRITICAL' ? 'text-red-700' : p.value === 'HIGH' ? 'text-amber-700' : 'text-blue-700'
                        }`}>
                          {p.label}
                        </span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">{p.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Issue Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Detailed Issue Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe what occurred, the steps taken before the error, and any error messages displayed on your screen..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            {/* File Attachments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Attachments (Screenshots / PDF Logs)
                </label>
                <span className="text-[11px] text-slate-400">Max 5 files (PNG, JPG, WEBP, PDF up to 10MB each)</span>
              </div>

              {/* Upload Dropzone */}
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl bg-slate-50/60 hover:bg-blue-50/20 transition cursor-pointer">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700">Click to upload files</span>
                <span className="text-[11px] text-slate-400">or drag and drop evidence</span>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Uploaded Files Previews */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-slate-800 truncate">{att.fileName}</p>
                          <p className="text-[10px] text-slate-400">{(att.fileSize / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submission Disclaimer & Action */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All tickets are securely scoped to your registered business and logged in audit trails.</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer shadow-md shadow-blue-600/25 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Ticket...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Support Ticket</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

