'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supportService } from '@/services/supportService';
import { getRolePath } from '@/lib/permissions';
import HelpLanguageSwitcher from '@/components/help/HelpLanguageSwitcher';
import { helpTranslations, HELP_LANG_KEY } from '@/lib/helpTranslations';

const FAQ_CATEGORIES = [
  'All',
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

const FAQ_CATEGORIES_TA = {
  'All': 'அனைத்தும்',
  'Getting Started': 'தொடங்குதல்',
  'Sales & Billing': 'விற்பனை & பில்லிங்',
  'Products & Inventory': 'பொருட்கள் & சரக்கு இருப்பு',
  'Customers & CRM': 'வாடிக்கையாளர்கள் & CRM',
  'Purchases & Suppliers': 'கொள்முதல் & சப்ளையர்கள்',
  'Payments & Finance': 'கொடுப்பனவுகள் & நிதி',
  'Quotations & Estimates': 'மேற்கோள்கள் & மதிப்பீடுகள்',
  'Online Shop & Customer Portal': 'ஆன்லைன் கடை & போர்டல்',
  'WhatsApp & Notifications': 'WhatsApp & அறிவிப்புகள்',
  'Subscription & Billing': 'சந்தா & பில்லிங்',
  'Account & Technical Support': 'கணக்கு & ஆதரவு'
};

export default function FaqsPage() {
  const { user, role } = useAuth();
  const userRoleSlug = user?.custom_role?.slug || user?.role_slug;

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackSent, setFeedbackSent] = useState({});
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

  const loadFaqs = async () => {
    try {
      setLoading(true);
      const res = await supportService.getFaqs();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setFaqs(list);
    } catch (err) {
      console.error('Failed to load faqs:', err);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  const toggleAccordion = (id) => {
    setActiveAccordion((prev) => (prev === id ? null : id));
  };

  const handleFeedback = async (id, isHelpful) => {
    if (feedbackSent[id]) return;
    try {
      await supportService.recordFaqFeedback(id, isHelpful);
      setFeedbackSent((prev) => ({ ...prev, [id]: isHelpful ? 'helpful' : 'unhelpful' }));
    } catch (err) {
      console.error('Error submitting FAQ feedback:', err);
    }
  };

  const filteredFaqs = faqs.filter((f) => {
    const matchesCategory =
      activeCategory === 'All' ||
      (f.category || '').toLowerCase() === activeCategory.toLowerCase();

    const matchesSearch =
      !searchQuery.trim() ||
      (f.question || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.question_ta || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.answer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.answer_ta || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.category || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
          {/* Header & Language Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link
              href={getRolePath(role, userRoleSlug, 'help')}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.backToHelpCenter}</span>
            </Link>

            <HelpLanguageSwitcher currentLang={lang} onLangChange={setLang} className="bg-slate-100 border-slate-200" />
          </div>

          <div className="text-center space-y-3">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t.faqBadge}</span>
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {t.faqHeroTitle}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              {t.faqHeroSubtitle}
            </p>

            {/* Search Input */}
            <div className="max-w-md mx-auto relative pt-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchFaqPlaceholder}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs shadow-2xs transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
                >
                  {t.clearSearch}
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex sm:flex-wrap items-center overflow-x-auto no-scrollbar gap-1.5 sm:justify-center -mx-3 px-3 sm:mx-0 sm:px-0 py-1">
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {lang === 'ta' ? (FAQ_CATEGORIES_TA[cat] || cat) : cat}
              </button>
            ))}
          </div>

          {/* Accordion FAQ List */}
          <div className="space-y-3">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
                <p className="text-xs">{t.loadingGuides}</p>
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">{t.noFaqsFound}</p>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = activeAccordion === faq.id;
                const question = (lang === 'ta' && faq.question_ta) ? faq.question_ta : faq.question;
                const answer = (lang === 'ta' && faq.answer_ta) ? faq.answer_ta : faq.answer;
                const categoryLabel = lang === 'ta' ? (FAQ_CATEGORIES_TA[faq.category] || faq.category) : faq.category;

                return (
                  <div
                    key={faq.id}
                    className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden transition"
                  >
                    <button
                      type="button"
                      onClick={() => toggleAccordion(faq.id)}
                      className="w-full p-5 text-left flex items-center justify-between space-x-4 hover:bg-slate-50/50 transition cursor-pointer"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {categoryLabel}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900">{question}</h3>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 text-xs sm:text-sm text-slate-600 space-y-4">
                        <p className="leading-relaxed whitespace-pre-line">{answer}</p>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                          <span>{t.wasHelpful}</span>
                          <div className="flex items-center space-x-2">
                            {feedbackSent[faq.id] ? (
                              <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{t.thankYouFeedback}</span>
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(faq.id, true)}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition font-bold"
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                  <span>{t.yesHelped}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(faq.id, false)}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 transition font-bold"
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                  <span>{t.noNeedMore}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Need help footer */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-bold text-sm">{t.stillHaveQuestions}</h4>
              <p className="text-slate-400 text-xs">{t.supportEngineersHelp}</p>
            </div>
            <Link
              href={getRolePath(role, userRoleSlug, 'support/new')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 transition shrink-0"
            >
              <span>{t.raiseSupportTicket}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
