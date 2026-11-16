'use client';

import React, { useState, useEffect } from 'react';
import { Ruler, Plus, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { masterService } from '@/services/masterService';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SizesPage() {
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchSizes();
  }, []);

  const fetchSizes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await masterService.getSizes();
      const list = res.data?.data || res.data || res || [];
      setSizes(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch sizes');
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
      await masterService.createSize({ name });
      setSuccess('Size created successfully!');
      setName('');
      setIsModalOpen(false);
      fetchSizes();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create size');
    } finally {
      setSaving(false);
    }
  };

  const filtered = sizes.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
                <Ruler className="w-6 h-6 text-blue-600" />
                <span>Garment Sizes</span>
              </h1>
              <p className="text-sm text-slate-500">Manage textile and apparel size dimensions (S, M, L, XL, 38, 40, etc.)</p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Size</span>
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
              placeholder="Search sizes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm outline-none"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading sizes...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              No sizes found. Add your first size variant above!
            </div>
          ) : (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
              {filtered.map((size) => (
                <div key={size.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-1 hover:border-blue-300 transition">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 font-bold text-lg flex items-center justify-center">
                    {size.name}
                  </div>
                  <span className="text-[10px] text-slate-400">ID: {size.id?.slice(0, 6)}</span>
                </div>
              ))}
            </div>
          )}

          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Add New Size</h2>
                
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Size Identifier / Label *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. S, M, L, XL, XXL, 38, 40, Free Size"
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
                      {saving ? 'Creating...' : 'Save Size'}
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
