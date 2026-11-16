'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  ChevronRight,           
  LifeBuoy,
  FileText,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Tag,
  ArrowRight,
  Clock,
  Layers,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supportService } from '@/services/supportService';
import { getRolePath } from '@/lib/permissions';
import HelpLanguageSwitcher from '@/components/help/HelpLanguageSwitcher';
import { helpTranslations, HELP_LANG_KEY } from '@/lib/helpTranslations';

export default function HelpCenterPage() {
  const { user, role } = useAuth();
  const userRoleSlug = user?.custom_role?.slug || user?.role_slug;

  const [categories, setCategories] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [latestArticles, setLatestArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('ALL');
  const [lang, setLang] = useState('en');

  // Initialize Language from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(HELP_LANG_KEY) || 'en';
      setLang(saved);
      const listener = () => {
        const updated = localStorage.getItem(HELP_LANG_KEY) || 'en';
        setLang(updated);
      };
      window.addEventListener('help-lang-changed', listener);
      return () => window.removeEventListener('help-lang-changed', listener);
    }
  }, []);

  const t = helpTranslations[lang] || helpTranslations.en;

  const loadData = async (query = '') => {
    try {
      setLoading(true);
      const [catsRes, featRes, latRes] = await Promise.all([
        supportService.getHelpCategories(query),
        supportService.getFeaturedGuides(),
        supportService.getLatestGuides()
      ]);

      const catList = Array.isArray(catsRes) ? catsRes : (catsRes?.data || []);
      const featList = Array.isArray(featRes) ? featRes : (featRes?.data || []);
      const latList = Array.isArray(latRes) ? latRes : (latRes?.data || []);

      setCategories(catList);
      setFeaturedArticles(featList);
      setLatestArticles(latList);
    } catch (err) {
      console.error('Failed to load help center:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Localized helper functions
  const getCatName = (cat) => (lang === 'ta' && cat.name_ta ? cat.name_ta : cat.name);
  const getCatDesc = (cat) => (lang === 'ta' && cat.description_ta ? cat.description_ta : cat.description);
  const getArtTitle = (art) => (lang === 'ta' && art.title_ta ? art.title_ta : art.title);
  const getArtDesc = (art) => (lang === 'ta' && art.short_description_ta ? art.short_description_ta : art.short_description);

  // Aggregate all articles across categories for "Browse All Articles" tab
  const allArticles = categories.flatMap(c => (c.articles || []).map(a => ({
    ...a,
    categoryName: getCatName(c),
    categorySlug: c.slug
  })));

  const filteredAllArticles = selectedCategoryTab === 'ALL'
    ? allArticles
    : allArticles.filter(a => a.category_id === selectedCategoryTab || a.categorySlug === selectedCategoryTab);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
          {/* 1. HERO BANNER */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-5 sm:p-12 text-white border border-slate-800 shadow-xl">
            {/* Header row with Badge & Language Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit">
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>{t.heroBadge}</span>
              </span>

              {/* Language Switcher UI [ English ] [ தமிழ் ] */}
              <div className="self-start sm:self-auto">
                <HelpLanguageSwitcher currentLang={lang} onLangChange={setLang} />
              </div>
            </div>

            <div className="relative z-10 max-w-2xl space-y-4">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {t.heroTitle}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {t.heroSubtitle}
              </p>

              {/* Search Bar */}
              <div className="relative pt-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm transition shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    {t.clearSearch}
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="mt-8 pt-6 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <Link
                href={getRolePath(role, userRoleSlug, 'support/new')}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition group"
              >
                <div>
                  <p className="font-bold text-white group-hover:text-blue-400">{t.needImmediateHelp}</p>
                  <p className="text-slate-400 text-[11px]">{t.raiseTicket}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href={getRolePath(role, userRoleSlug, 'support/tickets')}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition group"
              >
                <div>
                  <p className="font-bold text-white group-hover:text-blue-400">{t.myTickets}</p>
                  <p className="text-slate-400 text-[11px]">{t.trackTickets}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href={getRolePath(role, userRoleSlug, 'support/faq')}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition group"
              >
                <div>
                  <p className="font-bold text-white group-hover:text-blue-400">{t.frequentQuestions}</p>
                  <p className="text-slate-400 text-[11px]">{t.instantAnswers}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* 2. SECTION A: BROWSE BY CATEGORY */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  <span>{t.browseByCategory}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  {t.browseSubtitle}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                {categories.length} {t.topics}
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
                <p className="text-xs">{t.loadingGuides}</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  {t.noArticlesMatch.replace('{query}', searchQuery)}
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  {t.clearAndViewAll}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-400/50 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                          {cat.articles?.length || 0} {t.guides}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                          {getCatName(cat)}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {getCatDesc(cat)}
                        </p>
                      </div>

                      {/* Top Articles in this category */}
                      <div className="space-y-1.5 pt-3 border-t border-slate-100">
                        {cat.articles && cat.articles.slice(0, 3).map((art) => (
                          <Link
                            key={art.id}
                            href={getRolePath(role, userRoleSlug, `help/${art.slug}`)}
                            className="flex items-center justify-between text-xs text-slate-600 hover:text-blue-600 py-1 transition group/link truncate"
                          >
                            <span className="truncate pr-2 font-medium">{getArtTitle(art)}</span>
                            <ChevronRight className="w-3 h-3 text-slate-300 group-hover/link:translate-x-0.5 transition-transform shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-blue-600 flex items-center justify-between">
                      <span>{t.viewAllGuides.replace('{count}', cat.articles?.length || 0)}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. SECTION B: POPULAR ARTICLES */}
          {!searchQuery && featuredArticles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{t.popularGuides}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredArticles.map((art) => (
                  <Link
                    key={art.id}
                    href={getRolePath(role, userRoleSlug, `help/${art.slug}`)}
                    className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-400/50 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                          {art.category ? getCatName(art.category) : 'Guide'}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{t.minRead}</span>
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 text-sm leading-snug">
                        {getArtTitle(art)}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {getArtDesc(art)}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-bold">
                      <span>{t.stepByStepTutorial}</span>
                      <span className="flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform">
                        <span>{t.readGuide}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 4. SECTION C: LATEST ARTICLES */}
          {!searchQuery && latestArticles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{t.recentlyPublished}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {latestArticles.slice(0, 3).map((art) => (
                  <Link
                    key={art.id}
                    href={getRolePath(role, userRoleSlug, `help/${art.slug}`)}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 transition flex items-center justify-between space-x-3 group shadow-2xs"
                  >
                    <div className="space-y-1 truncate">
                      <span className="text-[10px] font-bold text-indigo-600 block">
                        {art.category ? getCatName(art.category) : 'Guide'}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                        {getArtTitle(art)}
                      </h4>
                      <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(art.created_at).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { month: 'short', day: 'numeric' })}</span>
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 5. SECTION D: BROWSE ALL ARTICLES WITH CATEGORY FILTERS */}
          <div className="space-y-6 pt-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {t.browseAllArticles} ({allArticles.length})
                </h2>
                <p className="text-xs text-slate-500">{t.filterArticlesSubtitle}</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedCategoryTab === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.all} ({allArticles.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategoryTab(c.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedCategoryTab === c.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {getCatName(c)} ({c.articles?.length || 0})
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAllArticles.map((art) => (
                <Link
                  key={art.id}
                  href={getRolePath(role, userRoleSlug, `help/${art.slug}`)}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 transition flex items-center justify-between space-x-4 group shadow-2xs"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 shrink-0 transition">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                        {art.categoryName || 'General'}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                        {getArtTitle(art)}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">{getArtDesc(art)}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
