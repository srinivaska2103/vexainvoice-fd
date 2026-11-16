'use client';

import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Package,
  ShoppingBag,
  Tag,
  Layers,
  ArrowRight,
  TrendingUp,
  Sparkles,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { crmService } from '@/services/crmService';
import { masterService } from '@/services/masterService';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Select } from '@/components/ui/Select';
import { formatCurrency } from '@/lib/utils';

export default function ProductInsightsPage() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [categoryId, brandId]);

  const loadFilters = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        masterService.getCategories().catch(() => ({ data: [] })),
        masterService.getBrands().catch(() => ({ data: [] }))
      ]);
      setCategories(catRes.data || catRes || []);
      setBrands(brandRes.data || brandRes || []);
    } catch (err) {
      console.error('Failed to load filters:', err);
    }
  };

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await crmService.getProductInsights({
        category_id: categoryId || undefined,
        brand_id: brandId || undefined
      });
      setInsights(res.data || res);
    } catch (err) {
      console.error('Failed to fetch product insights:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Top Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-indigo-50/60 to-blue-50/80 p-5 sm:p-6 rounded-2xl shadow-xs border border-indigo-100">
            <div>
              <div className="flex items-center space-x-2 text-indigo-700 font-extrabold text-[11px] uppercase tracking-wider mb-1">
                <PieChart className="w-4 h-4 text-indigo-600" />
                <span>Analytics & Intelligent Insights</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center">
                Product Insights & Cross-Sell Engine
              </h1>
              <p className="text-xs text-slate-600 mt-1 max-w-xl font-medium">
                Analyze purchasing velocity, revenue distribution, and product co-occurrence patterns.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
              <div className="w-full sm:w-48">
                <Select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  placeholder="All Categories"
                  options={[
                    { value: '', label: 'All Categories' },
                    ...categories.map((c) => ({ value: c.id, label: c.name }))
                  ]}
                  size="sm"
                  className="bg-white text-slate-900 border-indigo-200 font-semibold shadow-2xs hover:border-indigo-400"
                />
              </div>

              <div className="w-full sm:w-48">
                <Select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  placeholder="All Brands"
                  options={[
                    { value: '', label: 'All Brands' },
                    ...brands.map((b) => ({ value: b.id, label: b.name }))
                  ]}
                  size="sm"
                  className="bg-white text-slate-900 border-indigo-200 font-semibold shadow-2xs hover:border-indigo-400"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <Spinner size="lg" className="text-indigo-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-500 mt-2">Computing sales aggregation & co-occurrence metrics...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Summary Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-4.5 text-white shadow-sm border border-indigo-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-200 block">Total Revenue</span>
                    <span className="text-xl sm:text-2xl font-black mt-1 block tracking-tight">
                      {formatCurrency(insights?.topProducts?.reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0) || 0)}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-4.5 text-white shadow-sm border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 block">Items Sold</span>
                    <span className="text-xl sm:text-2xl font-black mt-1 block tracking-tight">
                      {insights?.topProducts?.reduce((acc, curr) => acc + Number(curr.totalQuantity || 0), 0) || 0} Pcs
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                    <Package className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4.5 text-white shadow-sm border border-amber-400/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-100 block">Top Cross-Sells</span>
                    <span className="text-xl sm:text-2xl font-black mt-1 block tracking-tight">
                      {insights?.frequentlyBoughtTogether?.length || 0} Pairs
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl p-4.5 text-white shadow-sm border border-purple-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-200 block">Active Categories</span>
                    <span className="text-xl sm:text-2xl font-black mt-1 block tracking-tight">
                      {insights?.topCategories?.length || 0} Categories
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Top Row: Most Purchased Products Visual Bar Chart & Frequently Bought Together */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Products Bar Chart & Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="text-base font-extrabold text-slate-900 flex items-center">
                          <Package className="w-5 h-5 mr-2 text-indigo-600" /> Top Products Revenue Chart
                        </h2>
                        <p className="text-[11px] text-slate-500 mt-0.5">Visual sales volume and revenue proportion analysis</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border-indigo-200 px-3 py-1">
                        By Revenue
                      </Badge>
                    </div>

                    {insights?.topProducts?.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">No product sales history recorded.</div>
                    ) : (
                      <div className="p-4 sm:p-5 space-y-5">
                        {/* Modern Visual Bar Graph */}
                        <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Revenue Performance Graph</h3>
                            <span className="text-[11px] font-bold text-indigo-600">Live Breakdown</span>
                          </div>
                          {(() => {
                            const maxVal = Math.max(...(insights?.topProducts?.map(p => Number(p.totalAmount || 0)) || [1]));
                            const barGradients = [
                              'from-indigo-600 to-blue-600',
                              'from-blue-600 to-sky-500',
                              'from-sky-500 to-teal-500',
                              'from-teal-500 to-emerald-500',
                              'from-emerald-500 to-green-500'
                            ];
                            return (
                              <div className="space-y-3">
                                {insights?.topProducts?.slice(0, 5).map((p, idx) => {
                                  const pct = Math.round((Number(p.totalAmount || 0) / (maxVal || 1)) * 100);
                                  return (
                                    <div key={idx} className="space-y-1">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold text-slate-800 gap-0.5">
                                        <span className="truncate max-w-full sm:max-w-[220px] text-slate-900">{p.name}</span>
                                        <span className="font-mono text-indigo-900 text-[11px] sm:text-xs">
                                          {formatCurrency(p.totalAmount)} <span className="text-slate-400 font-normal">({p.totalQuantity} Qty)</span>
                                        </span>
                                      </div>
                                      <div className="w-full h-3.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/40">
                                        <div
                                          className={`h-full bg-gradient-to-r ${barGradients[idx % barGradients.length]} transition-all duration-700 rounded-full shadow-2xs`}
                                          style={{ width: `${Math.max(pct, 4)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Responsive Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                          <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-100/80 border-b border-slate-200 font-extrabold uppercase text-slate-600 text-[10px]">
                              <tr>
                                <th className="px-4 py-2.5">Product Name</th>
                                <th className="px-4 py-2.5 text-center">Qty Sold</th>
                                <th className="px-4 py-2.5 text-right">Total Revenue</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {insights?.topProducts?.map((p, idx) => (
                                <tr key={p.id || idx} className="hover:bg-slate-50/80 transition">
                                  <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                                  <td className="px-4 py-3 text-center font-black text-indigo-600">{p.totalQuantity}</td>
                                  <td className="px-4 py-3 text-right font-black text-slate-900">{formatCurrency(p.totalAmount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Frequently Bought Together (Cross-Sell Engine) */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center border-b border-slate-100 pb-3">
                    <Sparkles className="w-5 h-5 mr-2 text-amber-500 shrink-0" /> Frequently Bought Together
                  </h2>
                  <p className="text-xs text-slate-500">Product combinations frequently purchased together in the same sale</p>

                  {insights?.frequentlyBoughtTogether?.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Not enough multi-item sales data to generate co-occurrence pairings.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {insights?.frequentlyBoughtTogether?.map((pair, idx) => (
                        <div key={idx} className="p-3.5 bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/40 border border-amber-200/90 rounded-xl space-y-2 shadow-2xs">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-extrabold text-slate-900 gap-1.5">
                            <span className="bg-white px-2.5 py-1 rounded-lg border border-amber-200/80 shadow-2xs text-slate-900 font-bold truncate max-w-full">
                              {pair.productA}
                            </span>
                            <span className="text-amber-600 font-black text-sm self-center sm:self-auto">+</span>
                            <span className="bg-white px-2.5 py-1 rounded-lg border border-amber-200/80 shadow-2xs text-slate-900 font-bold truncate max-w-full">
                              {pair.productB}
                            </span>
                          </div>
                          <div className="text-[11px] text-amber-800 font-bold flex items-center justify-end gap-1.5 pt-1 border-t border-amber-200/50">
                            <TrendingUp className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Bought together in <strong className="text-slate-900 font-black">{pair.count} Orders</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Top Categories Pie/Donut Chart & Top Brands Pie/Donut Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Categories Pie / Donut Visual Chart */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center">
                      <Layers className="w-5 h-5 mr-2 text-indigo-600 shrink-0" /> Category Share Pie & Breakdown
                    </h2>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                      Pie Chart
                    </span>
                  </div>

                  {insights?.topCategories?.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">No category data.</div>
                  ) : (
                    <div className="space-y-4">
                      {/* SVG Conic Pie Chart Visual */}
                      {(() => {
                        const totalCatRevenue = insights?.topCategories?.reduce((sum, c) => sum + Number(c.totalAmount || 0), 0) || 1;
                        const catColors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#9333ea', '#0284c7'];
                        
                        let currentAngle = 0;
                        const pieSlices = insights?.topCategories?.map((cat, idx) => {
                          const pct = Number(cat.totalAmount || 0) / totalCatRevenue;
                          const angle = pct * 360;
                          const startAngle = currentAngle;
                          currentAngle += angle;
                          return { name: cat.name, pct: Math.round(pct * 100), color: catColors[idx % catColors.length], startAngle, angle };
                        });

                        const conicStyle = pieSlices.map(s => `${s.color} ${s.startAngle}deg ${s.startAngle + s.angle}deg`).join(', ');

                        return (
                          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
                            {/* Donut graphic */}
                            <div className="relative w-28 h-28 rounded-full shrink-0 flex items-center justify-center shadow-xs" style={{ background: `conic-gradient(${conicStyle})` }}>
                              <div className="w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center text-center shadow-inner">
                                <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">Total</span>
                                <span className="text-[11px] font-black text-slate-900 leading-tight mt-0.5">{insights?.topCategories?.length} Cats</span>
                              </div>
                            </div>

                            {/* Legend & Breakdown */}
                            <div className="flex-1 w-full space-y-2">
                              {pieSlices?.map((cat, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                                  <div className="flex items-center space-x-2 truncate">
                                    <span className="w-3 h-3 rounded-md shrink-0 shadow-2xs" style={{ backgroundColor: cat.color }}></span>
                                    <span className="text-slate-800 font-extrabold truncate max-w-[120px]">{cat.name}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-mono font-black text-slate-900">{cat.pct}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Progress Bar List with Distinct Colors */}
                      <div className="space-y-2.5">
                        {insights?.topCategories?.map((cat, idx) => {
                          const totalCatRevenue = insights?.topCategories?.reduce((sum, c) => sum + Number(c.totalAmount || 0), 0) || 1;
                          const catPct = Math.round((Number(cat.totalAmount || 0) / totalCatRevenue) * 100);
                          const barColors = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-500', 'bg-rose-600', 'bg-purple-600', 'bg-sky-500'];
                          return (
                            <div key={idx} className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/70 space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${barColors[idx % barColors.length]}`}></span>
                                  {cat.name}
                                </span>
                                <span className="font-mono font-black text-slate-900">{formatCurrency(cat.totalAmount)} ({cat.totalQuantity} Qty)</span>
                              </div>
                              <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${barColors[idx % barColors.length]} transition-all duration-700 rounded-full`}
                                  style={{ width: `${Math.max(catPct, 4)}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Top Brands Pie / Donut Visual Chart */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center">
                      <Tag className="w-5 h-5 mr-2 text-purple-600 shrink-0" /> Brand Distribution Pie & Breakdown
                    </h2>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                      Pie Chart
                    </span>
                  </div>

                  {insights?.topBrands?.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">No brand data.</div>
                  ) : (
                    <div className="space-y-4">
                      {/* SVG Conic Pie Chart Visual */}
                      {(() => {
                        const totalBrandRevenue = insights?.topBrands?.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0) || 1;
                        const brandColors = ['#9333ea', '#0284c7', '#ea580c', '#10b981', '#ec4899', '#6366f1'];
                        
                        let currentAngle = 0;
                        const pieSlices = insights?.topBrands?.map((brand, idx) => {
                          const pct = Number(brand.totalAmount || 0) / totalBrandRevenue;
                          const angle = pct * 360;
                          const startAngle = currentAngle;
                          currentAngle += angle;
                          return { name: brand.name, pct: Math.round(pct * 100), color: brandColors[idx % brandColors.length], startAngle, angle };
                        });

                        const conicStyle = pieSlices.map(s => `${s.color} ${s.startAngle}deg ${s.startAngle + s.angle}deg`).join(', ');

                        return (
                          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
                            {/* Donut graphic */}
                            <div className="relative w-28 h-28 rounded-full shrink-0 flex items-center justify-center shadow-xs" style={{ background: `conic-gradient(${conicStyle})` }}>
                              <div className="w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center text-center shadow-inner">
                                <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">Total</span>
                                <span className="text-[11px] font-black text-slate-900 leading-tight mt-0.5">{insights?.topBrands?.length} Brands</span>
                              </div>
                            </div>

                            {/* Legend & Breakdown */}
                            <div className="flex-1 w-full space-y-2">
                              {pieSlices?.map((b, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                                  <div className="flex items-center space-x-2 truncate">
                                    <span className="w-3 h-3 rounded-md shrink-0 shadow-2xs" style={{ backgroundColor: b.color }}></span>
                                    <span className="text-slate-800 font-extrabold truncate max-w-[120px]">{b.name}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-mono font-black text-slate-900">{b.pct}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Progress Bar List with Distinct Colors */}
                      <div className="space-y-2.5">
                        {insights?.topBrands?.map((brand, idx) => {
                          const totalBrandRevenue = insights?.topBrands?.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0) || 1;
                          const brandPct = Math.round((Number(brand.totalAmount || 0) / totalBrandRevenue) * 100);
                          const barColors = ['bg-purple-600', 'bg-sky-600', 'bg-orange-600', 'bg-emerald-500', 'bg-pink-500', 'bg-indigo-500'];
                          return (
                            <div key={idx} className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/70 space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${barColors[idx % barColors.length]}`}></span>
                                  {brand.name}
                                </span>
                                <span className="font-mono font-black text-slate-900">{formatCurrency(brand.totalAmount)} ({brand.totalQuantity} Qty)</span>
                              </div>
                              <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${barColors[idx % barColors.length]} transition-all duration-700 rounded-full`}
                                  style={{ width: `${Math.max(brandPct, 4)}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
