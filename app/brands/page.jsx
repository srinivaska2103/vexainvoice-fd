'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { masterService } from '@/services/masterService';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await masterService.getBrands();
      const list = res.data?.data || res.data || res || [];
      setBrands(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch brands');
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
      await masterService.createBrand({ name, description });
      setSuccess('Brand created successfully!');
      setName('');
      setDescription('');
      setIsModalOpen(false);
      fetchBrands();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create brand');
    } finally {
      setSaving(false);
    }
  };

  const filtered = brands.filter(b => 
    b.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
                <Tag className="w-6 h-6 text-blue-600" />
                <span>Product Brands</span>
              </h1>
              <p className="text-sm text-slate-500">Manage apparel manufacturers & product brands</p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Brand</span>
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

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm outline-none"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading brands...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              No brands found. Create your first brand above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((brand) => (
                <div key={brand.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-blue-300 transition">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{brand.name}</h3>
                      <span className="text-xs text-slate-400">ID: {brand.id?.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Add New Brand</h2>
                
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Raymond, Allen Solly, VEXA Silk"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                      {saving ? 'Creating...' : 'Save Brand'}
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
