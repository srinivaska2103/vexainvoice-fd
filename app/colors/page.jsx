'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Plus, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { masterService } from '@/services/masterService';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ColorsPage() {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('#3B82F6');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await masterService.getColors();
      const list = res.data?.data || res.data || res || [];
      setColors(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch colors');
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
      await masterService.createColor({ name, code });
      setSuccess('Color created successfully!');
      setName('');
      setCode('#3B82F6');
      setIsModalOpen(false);
      fetchColors();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create color');
    } finally {
      setSaving(false);
    }
  };

  const filtered = colors.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
                <Palette className="w-6 h-6 text-blue-600" />
                <span>Garment & Product Colors</span>
              </h1>
              <p className="text-sm text-slate-500">Manage apparel color variants and hex codes</p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Color</span>
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
              placeholder="Search colors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm outline-none"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading colors...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              No colors found. Add your first color variant above!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map((color) => (
                <div key={color.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3 hover:border-blue-300 transition">
                  <div 
                    className="w-10 h-10 rounded-xl border border-slate-200 shrink-0 shadow-xs"
                    style={{ backgroundColor: color.hex_code || color.code || '#cbd5e1' }}
                  />
                  <div className="truncate">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{color.name}</h3>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">{color.hex_code || color.code || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Add New Color</h2>
                
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Color Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Royal Blue, Crimson Red"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Hex Color Code
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="h-10 w-12 rounded-lg cursor-pointer border border-slate-300 p-1"
                      />
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                      />
                    </div>
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
                      {saving ? 'Creating...' : 'Save Color'}
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
