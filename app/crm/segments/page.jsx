'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Filter,
  Users,
  Search,
  Plus,
  Save,
  Trash2,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Gem,
  AlertTriangle,
  Clock,
  Building2
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { crmService } from '@/services/crmService';
import { masterService } from '@/services/masterService';
import { productService } from '@/services/productService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CustomerSegmentsPage() {
  const [filterDefinition, setFilterDefinition] = useState({
    customerType: '',
    minPurchaseValue: '',
    maxPurchaseValue: '',
    lastPurchaseDays: '',
    minOutstanding: '',
    productId: '',
    categoryId: '',
    brandId: ''
  });

  const [matchingCustomers, setMatchingCustomers] = useState([]);
  const [evaluating, setEvaluating] = useState(false);
  const [savedSegments, setSavedSegments] = useState([]);
  const [loadingSegments, setLoadingSegments] = useState(true);

  // Dropdown options
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);

  // Save Modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [segmentName, setSegmentName] = useState('');
  const [segmentDesc, setSegmentDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMasterData();
    loadSavedSegments();
    evaluateFilters();
  }, []);

  const loadMasterData = async () => {
    try {
      const [catRes, brandRes, prodRes] = await Promise.all([
        masterService.getCategories().catch(() => ({ data: [] })),
        masterService.getBrands().catch(() => ({ data: [] })),
        productService.getProducts({ limit: 100 }).catch(() => ({ data: [] }))
      ]);
      setCategories(catRes.data || catRes || []);
      setBrands(brandRes.data || brandRes || []);
      setProducts(prodRes.data || prodRes.products || prodRes || []);
    } catch (err) {
      console.error('Failed to load master filter options:', err);
    }
  };

  const loadSavedSegments = async () => {
    try {
      setLoadingSegments(true);
      const res = await crmService.getSavedSegments();
      setSavedSegments(res.data || res || []);
    } catch (err) {
      console.error('Failed to load saved segments:', err);
    } finally {
      setLoadingSegments(false);
    }
  };

  const evaluateFilters = async () => {
    try {
      setEvaluating(true);
      const res = await crmService.evaluateSegmentFilters(filterDefinition);
      setMatchingCustomers(res.data || res || []);
    } catch (err) {
      console.error('Failed to evaluate segment filters:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    evaluateFilters();
  };

  const handleResetFilters = () => {
    setFilterDefinition({
      customerType: '',
      minPurchaseValue: '',
      maxPurchaseValue: '',
      lastPurchaseDays: '',
      minOutstanding: '',
      productId: '',
      categoryId: '',
      brandId: ''
    });
    setTimeout(evaluateFilters, 100);
  };

  const handleSaveSegmentSubmit = async (e) => {
    e.preventDefault();
    if (!segmentName.trim()) return;
    try {
      setSaving(true);
      await crmService.createSavedSegment({
        name: segmentName,
        description: segmentDesc,
        filter_definition: filterDefinition
      });
      setShowSaveModal(false);
      setSegmentName('');
      setSegmentDesc('');
      loadSavedSegments();
    } catch (err) {
      console.error('Failed to save segment:', err);
      alert('Error saving segment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSegment = async (id) => {
    if (!confirm('Are you sure you want to delete this saved segment?')) return;
    try {
      await crmService.deleteSavedSegment(id);
      loadSavedSegments();
    } catch (err) {
      console.error('Failed to delete segment:', err);
    }
  };

  const applyPredefinedPreset = (type) => {
    let preset = { customerType: '', minPurchaseValue: '', maxPurchaseValue: '', lastPurchaseDays: '', minOutstanding: '', productId: '', categoryId: '', brandId: '' };
    if (type === 'HIGH_VALUE') preset.minPurchaseValue = '50000';
    if (type === 'OUTSTANDING') preset.minOutstanding = '1';
    if (type === 'INACTIVE') preset.lastPurchaseDays = '60';
    if (type === 'WHOLESALE') preset.customerType = 'WHOLESALE';
    if (type === 'RETAIL') preset.customerType = 'RETAIL';
    setFilterDefinition(preset);
    setTimeout(evaluateFilters, 100);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center">
            <Layers className="w-6 h-6 mr-2 text-indigo-600" /> Customer Segments & Audience Builder
          </h1>
          <p className="text-xs text-slate-500">Filter customers based on purchase behavior, total spent, categories, and account balance</p>
        </div>

        <Button onClick={() => setShowSaveModal(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs">
          <Save className="w-4 h-4 mr-1.5" /> Save Current Segment
        </Button>
      </div>

      {/* Predefined Quick Presets */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-400 uppercase mr-1">Quick Presets:</span>
        <button onClick={() => applyPredefinedPreset('HIGH_VALUE')} className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold hover:bg-purple-100 transition cursor-pointer">
          <Gem className="w-3.5 h-3.5 text-purple-600" />
          <span>High Value (₹50k+)</span>
        </button>
        <button onClick={() => applyPredefinedPreset('OUTSTANDING')} className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition cursor-pointer">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>With Outstanding</span>
        </button>
        <button onClick={() => applyPredefinedPreset('INACTIVE')} className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 transition cursor-pointer">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Inactive (60d+)</span>
        </button>
        <button onClick={() => applyPredefinedPreset('WHOLESALE')} className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition cursor-pointer">
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Wholesale Customers</span>
        </button>
      </div>

      {/* Main Filter Form Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
          <Filter className="w-4 h-4 mr-1.5 text-slate-600" /> Filter Criteria Builder
        </h2>

        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Select
              label="Customer Type"
              value={filterDefinition.customerType}
              onChange={(e) => setFilterDefinition({ ...filterDefinition, customerType: e.target?.value !== undefined ? e.target.value : e })}
              placeholder="All Customer Types"
              options={[
                { value: '', label: 'All Customer Types' },
                { value: 'RETAIL', label: 'Retail' },
                { value: 'WHOLESALE', label: 'Wholesale' },
                { value: 'DEALER', label: 'Dealer' },
                { value: 'BUSINESS', label: 'Business' }
              ]}
              size="sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Min Purchase Value (₹)</label>
            <input
              type="number"
              placeholder="e.g. 50000"
              value={filterDefinition.minPurchaseValue}
              onChange={(e) => setFilterDefinition({ ...filterDefinition, minPurchaseValue: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Last Purchase (Days Ago)</label>
            <input
              type="number"
              placeholder="e.g. 60 (Bought within last 60 days)"
              value={filterDefinition.lastPurchaseDays}
              onChange={(e) => setFilterDefinition({ ...filterDefinition, lastPurchaseDays: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Min Outstanding (₹)</label>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={filterDefinition.minOutstanding}
              onChange={(e) => setFilterDefinition({ ...filterDefinition, minOutstanding: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div className="space-y-1">
            <Select
              label="Purchased Category"
              value={filterDefinition.categoryId}
              onChange={(e) => setFilterDefinition({ ...filterDefinition, categoryId: e.target?.value !== undefined ? e.target.value : e })}
              placeholder="All Categories"
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map((c) => ({ value: c.id, label: c.name }))
              ]}
              size="sm"
            />
          </div>

          <div className="space-y-1">
            <Select
              label="Purchased Brand"
              value={filterDefinition.brandId}
              onChange={(e) => setFilterDefinition({ ...filterDefinition, brandId: e.target?.value !== undefined ? e.target.value : e })}
              placeholder="All Brands"
              options={[
                { value: '', label: 'All Brands' },
                ...brands.map((b) => ({ value: b.id, label: b.name }))
              ]}
              size="sm"
            />
          </div>

          {/* Action Buttons spanning remaining 2 grid columns for a balanced 4x2 grid */}
          <div className="sm:col-span-2 lg:col-span-2 flex items-end gap-3 pt-2 sm:pt-0">
            <button
              type="submit"
              disabled={evaluating}
              className="flex-1 inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Filter className="w-4 h-4" />
              <span>{evaluating ? 'Evaluating Filter...' : 'Apply Filters'}</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Segment Result List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center">
            Matching Customers Result
            <Badge className="ml-2 bg-indigo-50 text-indigo-700 border-indigo-200 font-extrabold text-xs">
              {matchingCustomers.length} Found
            </Badge>
          </h2>
        </div>

        {evaluating ? (
          <div className="p-12 text-center">
            <Spinner size="lg" className="text-indigo-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-500 mt-2">Running database dynamic query...</p>
          </div>
        ) : matchingCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No customers match the current segment criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-extrabold uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3 text-center">Orders</th>
                  <th className="px-5 py-3 text-right">Total Spent</th>
                  <th className="px-5 py-3 text-right">Outstanding</th>
                  <th className="px-5 py-3">Last Purchase</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matchingCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5">
                      <Link href={`/crm/customers/${c.id}`} className="font-extrabold text-slate-900 hover:text-indigo-600">
                        {c.name}
                      </Link>
                      {c.phone && <div className="text-[11px] font-mono text-slate-400">{c.phone}</div>}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">{c.customerType}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-800">{c.ordersCount}</td>
                    <td className="px-5 py-3.5 text-right font-black text-slate-900">{formatCurrency(c.totalSpent)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {c.outstanding > 0 ? (
                        <span className="font-black text-rose-600">{formatCurrency(c.outstanding)}</span>
                      ) : (
                        <span className="text-slate-400 font-medium">₹0</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      {c.lastPurchaseDate ? formatDate(c.lastPurchaseDate) : <span className="text-slate-400 italic">No Sales</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/crm/customers/${c.id}`}>
                        <button className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-sm hover:shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>360 View</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Saved Segments List */}
      {savedSegments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900">Your Saved Audience Segments</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedSegments.map((s) => (
              <div key={s.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-sm">{s.name}</h3>
                  {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
                </div>
                <button onClick={() => handleDeleteSegment(s.id)} className="text-slate-400 hover:text-red-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Segment Modal */}
      {showSaveModal && (
        <Modal isOpen={true} onClose={() => setShowSaveModal(false)} title="Save Segment Definition">
          <form onSubmit={handleSaveSegmentSubmit} className="space-y-4 p-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Segment Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. VIP Silk Saree Buyers"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Description</label>
              <textarea
                rows={3}
                placeholder="Description of target customer segment..."
                value={segmentDesc}
                onChange={(e) => setSegmentDesc(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setShowSaveModal(false)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-indigo-600 text-white font-bold rounded-xl">
                {saving ? 'Saving...' : 'Save Segment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
