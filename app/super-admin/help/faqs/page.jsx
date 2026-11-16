'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  Check,
  X,
  BookOpen
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supportService } from '@/services/supportService';
import { useToast } from '@/context/ToastContext';

const FAQ_CATEGORIES = [
  'Getting Started',
  'Sales & Billing',
  'Products & Inventory',
  'Customers & CRM',
  'Purchases & Suppliers',
  'Payments & Finance',
  'Quotations & Estimates',
  'Online Shop & Customer Portal',
  'WhatsApp & Notifications',
  'Subscription & Billing',
  'Account & Technical Support'
];

export default function SuperAdminFaqsPage() {
  const { user, role } = useAuth();
  const { toastSuccess, toastError, confirm } = useToast();

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    question_ta: '',
    answer: '',
    answer_ta: '',
    category: 'Getting Started',
    sort_order: 1,
    is_published: true
  });
  const [saving, setSaving] = useState(false);

  const loadFaqs = async () => {
    try {
      setLoading(true);
      const res = await supportService.getFaqs(categoryFilter, searchQuery);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setFaqs(list);
    } catch (err) {
      toastError('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFaqs();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, categoryFilter]);

  const handleOpenAdd = () => {
    setEditingFaq(null);
    setFormData({
      question: '',
      question_ta: '',
      answer: '',
      answer_ta: '',
      category: FAQ_CATEGORIES[0],
      sort_order: faqs.length + 1,
      is_published: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question || '',
      question_ta: faq.question_ta || '',
      answer: faq.answer || '',
      answer_ta: faq.answer_ta || '',
      category: faq.category || FAQ_CATEGORIES[0],
      sort_order: faq.sort_order || 0,
      is_published: faq.is_published !== false
    });
    setIsModalOpen(true);
  };

  const handleSaveFaq = async (e) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      toastError('Please fill in both the Question and Answer fields.');
      return;
    }

    try {
      setSaving(true);
      if (editingFaq) {
        await supportService.updateSuperAdminFaq(editingFaq.id, formData);
        toastSuccess('FAQ updated successfully!');
      } else {
        await supportService.createSuperAdminFaq(formData);
        toastSuccess('FAQ created successfully!');
      }
      setIsModalOpen(false);
      loadFaqs();
    } catch (err) {
      toastError(err?.response?.data?.message || 'Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFaq = async (id, question) => {
    const ok = await confirm({
      title: 'Delete FAQ?',
      message: `Are you sure you want to delete "${question}"? This action cannot be undone.`
    });
    if (!ok) return;

    try {
      await supportService.deleteSuperAdminFaq(id);
      toastSuccess('FAQ deleted successfully.');
      loadFaqs();
    } catch (err) {
      toastError('Failed to delete FAQ');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
      <DashboardLayout>
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
          {/* Top Bar / Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <Link href="/super-admin/dashboard" className="hover:text-blue-600 transition">Super Admin</Link>
                <span>/</span>
                <Link href="/super-admin/help/articles" className="hover:text-blue-600 transition">Help Center</Link>
                <span>/</span>
                <span className="text-slate-800 font-semibold">FAQs Knowledge Base</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <HelpCircle className="w-6 h-6 text-blue-600" />
                <span>Frequently Asked Questions Management</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage, publish, and update self-service knowledge base questions accessible to all tenant companies.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/super-admin/help/articles"
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>Articles Manager</span>
              </Link>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New FAQ</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FAQs by question, answer..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Categories ({faqs.length})</option>
                {FAQ_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* FAQs List Table */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                <p className="text-xs">Loading FAQs...</p>
              </div>
            ) : faqs.length === 0 ? (
              <div className="p-16 text-center text-slate-500 space-y-2">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">No FAQs Found</h3>
                <p className="text-xs text-slate-400">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4 w-44">Category</th>
                      <th className="py-3 px-4">Question & Answer</th>
                      <th className="py-3 px-4 w-28 text-center">Helpful / Unhelpful</th>
                      <th className="py-3 px-4 w-24 text-center">Status</th>
                      <th className="py-3 px-4 w-24 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {faqs.map((faq, idx) => (
                      <tr key={faq.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {faq.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 space-y-1">
                          <p className="font-bold text-slate-900 leading-snug">{faq.question}</p>
                          <p className="text-slate-500 line-clamp-2 leading-relaxed text-[11px]">{faq.answer}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center text-[11px]">
                          <span className="text-emerald-600 font-bold">{faq.helpful_count || 0} 👍</span>
                          <span className="mx-1 text-slate-300">/</span>
                          <span className="text-rose-500 font-bold">{faq.unhelpful_count || 0} 👎</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {faq.is_published ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Live</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                              <XCircle className="w-3 h-3" />
                              <span>Draft</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(faq)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Edit FAQ"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFaq(faq.id, faq.question)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                              title="Delete FAQ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add / Edit FAQ Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      {editingFaq ? 'Edit FAQ Entry' : 'Create New FAQ Entry'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveFaq} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {FAQ_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Question (English) *</label>
                      <input
                        type="text"
                        value={formData.question}
                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                        placeholder="e.g. How do I generate a GST invoice?"
                        required
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Question (Tamil - தமிழ்)</label>
                      <input
                        type="text"
                        value={formData.question_ta}
                        onChange={(e) => setFormData({ ...formData, question_ta: e.target.value })}
                        placeholder="எ.கா., GST விலைப்பட்டியலை எவ்வாறு உருவாக்குவது?"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Answer (English) *</label>
                      <textarea
                        rows={4}
                        value={formData.answer}
                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                        placeholder="Provide clear, step-by-step guidance..."
                        required
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Answer (Tamil - தமிழ்)</label>
                      <textarea
                        rows={4}
                        value={formData.answer_ta}
                        onChange={(e) => setFormData({ ...formData, answer_ta: e.target.value })}
                        placeholder="தமிழ் வழிகாட்டல் மற்றும் பதில்..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Sort Order</label>
                      <input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Publish Status</label>
                      <select
                        value={formData.is_published ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, is_published: e.target.value === 'true' })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="true">Published (Live to users)</option>
                        <option value="false">Draft (Hidden)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{editingFaq ? 'Save Changes' : 'Create FAQ'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

