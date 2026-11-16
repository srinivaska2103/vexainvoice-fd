'use client';

import React, { useState, useEffect } from 'react';
import { Boxes, Plus, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { masterService } from '@/services/masterService';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await masterService.getCategories();
      const list = res.data?.data || res.data || res || [];
      setCategories(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Fetch categories error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      setError(null);
      await masterService.createCategory({ name, description });
      setSuccess('Category created successfully!');
      setName('');
      setDescription('');
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const filtered = categories.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute permissions={['products.categories', 'products.view']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2 tracking-tight">
                <Boxes className="w-6 h-6 text-blue-600 shrink-0" />
                <span>Product Categories</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">Manage apparel & product item classifications</p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-3 sm:py-2.5 rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Category</span>
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 text-red-700 flex items-center space-x-2 border border-red-200">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 flex items-center space-x-2 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm outline-none"
            />
          </div>

          {/* Grid List */}
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading categories...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              No categories found. Create your first category above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((cat) => (
                <div key={cat.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-blue-300 transition">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{cat.name}</h3>
                      <span className="text-xs text-slate-400">ID: {cat.id?.slice(0, 8)}</span>
                    </div>
                  </div>
                  {cat.description && (
                    <p className="text-xs text-slate-500 pl-1">{cat.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Add New Category</h2>
                
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Menswear, Cotton Sarees"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Description
                    </label>
                    <textarea
                      placeholder="Optional category description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows="3"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md disabled:opacity-50"
                    >
                      {saving ? 'Creating...' : 'Save Category'}
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
