'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  Eye,
  FileText,
  Layers,
  ArrowLeft,
  Loader2,
  Check,
  X,
  ExternalLink
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supportService } from '@/services/supportService';
import { useToast } from '@/context/ToastContext';

export default function SuperAdminHelpArticlesPage() {
  const { user, role } = useAuth();
  const { toastSuccess, toastError, confirm } = useToast();

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    title_ta: '',
    category_id: '',
    short_description: '',
    short_description_ta: '',
    search_keywords: '',
    is_published: true,
    is_featured: false,
    steps: []
  });
  const [newStep, setNewStep] = useState({ title: '', description: '', caption: '' });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [artsRes, catsRes] = await Promise.all([
        supportService.getSuperAdminArticles({
          status: statusFilter,
          categoryId: categoryFilter,
          search: searchQuery
        }),
        supportService.getHelpCategories()
      ]);
      setArticles(Array.isArray(artsRes) ? artsRes : (artsRes?.data || []));
      setCategories(Array.isArray(catsRes) ? catsRes : (catsRes?.data || []));
    } catch (err) {
      toastError('Failed to load help articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, categoryFilter]);

  const handleOpenAdd = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      title_ta: '',
      category_id: categories[0]?.id || '',
      short_description: '',
      short_description_ta: '',
      search_keywords: '',
      is_published: true,
      is_featured: false,
      steps: [
        { stepNumber: 1, title: 'Step 1 Instructions', description: 'Enter instruction details here.', caption: 'Screen reference' }
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (art) => {
    setEditingArticle(art);
    setFormData({
      title: art.title,
      title_ta: art.title_ta || '',
      category_id: art.category_id,
      short_description: art.short_description,
      short_description_ta: art.short_description_ta || '',
      search_keywords: art.search_keywords || '',
      is_published: art.is_published,
      is_featured: art.is_featured,
      steps: Array.isArray(art.steps) ? art.steps : []
    });
    setIsModalOpen(true);
  };

  const handleAddStep = () => {
    if (!newStep.title.trim()) return;
    setFormData(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          stepNumber: prev.steps.length + 1,
          title: newStep.title.trim(),
          description: newStep.description.trim(),
          caption: newStep.caption.trim()
        }
      ]
    }));
    setNewStep({ title: '', description: '', caption: '' });
  };

  const handleRemoveStep = (idx) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNumber: i + 1 }))
    }));
  };

  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.short_description.trim() || !formData.category_id) {
      toastError('Title, Category and Short Description are required.');
      return;
    }

    setSaving(true);
    try {
      if (editingArticle) {
        await supportService.updateSuperAdminArticle(editingArticle.id, formData);
        toastSuccess('Article updated successfully.');
      } else {
        await supportService.createSuperAdminArticle(formData);
        toastSuccess('Article created and published.');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toastError(err.message || 'Failed to save article.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (art) => {
    const isConfirmed = await confirm({
      title: 'Delete Guide Article?',
      message: `Are you sure you want to delete "${art.title}"? This cannot be undone.`,
      confirmText: 'Delete Article',
      type: 'danger'
    });

    if (isConfirmed) {
      try {
        await supportService.deleteSuperAdminArticle(art.id);
        toastSuccess('Article removed.');
        loadData();
      } catch (err) {
        toastError(err.message || 'Failed to delete article.');
      }
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                Documentation Engine
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                Help Center Articles Management
              </h1>
              <p className="text-xs text-slate-500">
                Create, update, and manage global tutorial documentation displayed across all user roles.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition cursor-pointer shadow-sm shadow-purple-600/25"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Article</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-slate-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2" />
                <p className="text-xs">Loading articles...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="p-16 text-center text-slate-400 text-xs space-y-2">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">No articles found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-5">Title</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Steps</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Featured</th>
                      <th className="py-3.5 px-4">Views</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {articles.map((art) => (
                      <tr key={art.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-5 max-w-xs">
                          <span className="font-bold text-slate-900 block truncate">{art.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">{art.slug}</span>
                        </td>
                        <td className="py-3.5 px-4 text-purple-700 font-bold">
                          {art.category?.name || 'General'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-slate-600">{Array.isArray(art.steps) ? art.steps.length : 0} steps</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            art.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {art.is_published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {art.is_featured ? (
                            <span className="text-amber-500 font-black text-xs">★ Yes</span>
                          ) : (
                            <span className="text-slate-300 text-xs">No</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          {art.view_count || 0}
                        </td>
                        <td className="py-3.5 px-5 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(art)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Article"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteArticle(art)}
                            className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                            title="Delete Article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal / Article Editor */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h2 className="text-lg font-black text-slate-900">
                    {editingArticle ? 'Edit Knowledge Base Guide' : 'Create Knowledge Base Guide'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveArticle} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">English Title *</label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="E.g., How to Generate a GST Invoice"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Tamil Title (தமிழ் தலைப்பு)</span>
                        <span className="text-[10px] text-purple-600 font-normal">Optional</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title_ta}
                        onChange={(e) => setFormData({ ...formData, title_ta: e.target.value })}
                        placeholder="எ.கா., GST விலைப்பட்டியலை எவ்வாறு உருவாக்குவது?"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Category *</label>
                      <select
                        required
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Keywords (Comma-separated)</label>
                      <input
                        type="text"
                        value={formData.search_keywords}
                        onChange={(e) => setFormData({ ...formData, search_keywords: e.target.value })}
                        placeholder="gst, invoice, print, tax"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">English Summary / Intro *</label>
                      <textarea
                        required
                        rows={2}
                        value={formData.short_description}
                        onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                        placeholder="Brief overview of what this guide explains..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Tamil Summary (சுருக்கம்)</span>
                        <span className="text-[10px] text-purple-600 font-normal">Optional</span>
                      </label>
                      <textarea
                        rows={2}
                        value={formData.short_description_ta}
                        onChange={(e) => setFormData({ ...formData, short_description_ta: e.target.value })}
                        placeholder="வழிகாட்டியின் தமிழ் சுருக்கம்..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-sans"
                      />
                    </div>
                  </div>

                  {/* Step-by-Step Instructions Builder */}
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-slate-700 block">Step-by-Step Instructions</label>

                    {formData.steps.map((st, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 relative">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-700">Step {st.stepNumber}: {st.title}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(i)}
                            className="text-red-500 hover:text-red-700 font-bold text-[11px]"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="text-slate-600">{st.description}</p>
                        {st.caption && <span className="text-[10px] text-slate-400 italic block">Screen: {st.caption}</span>}
                      </div>
                    ))}

                    <div className="p-3 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 block">+ Add Tutorial Step</span>
                      <input
                        type="text"
                        value={newStep.title}
                        onChange={(e) => setNewStep({ ...newStep, title: e.target.value })}
                        placeholder="Step Title (e.g. Open Sales > New Sale)"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                      <textarea
                        rows={2}
                        value={newStep.description}
                        onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                        placeholder="Detailed action instructions..."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                      <input
                        type="text"
                        value={newStep.caption}
                        onChange={(e) => setNewStep({ ...newStep, caption: e.target.value })}
                        placeholder="Screenshot caption / screen reference..."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddStep}
                        className="px-3 py-1.5 bg-slate-800 text-white font-bold rounded-lg text-xs"
                      >
                        Add Step
                      </button>
                    </div>
                  </div>

                  {/* Status Toggles */}
                  <div className="flex items-center space-x-6 pt-2">
                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_published}
                        onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      />
                      <span>Published (Live for all users)</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs font-bold text-amber-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      />
                      <span>Feature on Help Center Home</span>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center space-x-1.5"
                    >
                      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{editingArticle ? 'Update Article' : 'Save & Publish'}</span>
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

