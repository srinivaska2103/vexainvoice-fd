'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  ArrowLeft,
  Calendar,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Share2,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Sparkles,
  Maximize2
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supportService } from '@/services/supportService';
import { useToast } from '@/context/ToastContext';
import { getRolePath } from '@/lib/permissions';
import HelpLanguageSwitcher from '@/components/help/HelpLanguageSwitcher';
import { helpTranslations, HELP_LANG_KEY } from '@/lib/helpTranslations';

export default function HelpArticleDetailPage({ params: propParams }) {
  const router = useRouter();
  const rawParams = useParams() || propParams;
  const slug = rawParams?.slug || (Array.isArray(rawParams?.subpath) ? rawParams.subpath[1] : null);

  const { user, role } = useAuth();
  const userRoleSlug = user?.custom_role?.slug || user?.role_slug;
  const { toastSuccess, toastError } = useToast();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
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

  useEffect(() => {
    if (!slug) return;
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await supportService.getArticleBySlug(slug);
        const data = res?.data || res;
        setArticle(data);
      } catch (err) {
        console.error('Error loading article:', err);
        setError(err.message || 'Article not found');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  const handleFeedback = async (isHelpful) => {
    if (feedbackSent || !slug) return;
    try {
      await supportService.recordArticleFeedback(slug, isHelpful);
      setFeedbackSent(true);
      toastSuccess(t.thankYouFeedback);
    } catch (err) {
      toastError('Could not record feedback.');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="max-w-4xl mx-auto py-16 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
            <p className="text-xs">{t.loadingGuides}</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !article) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-800">{t.guideNotFound}</h2>
            <p className="text-xs text-slate-500">{error || t.guideNotFoundDesc}</p>
            <Link
              href={getRolePath(role, userRoleSlug, 'help')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.backToHelpCenter}</span>
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Localized article fields
  const title = (lang === 'ta' && article.title_ta) ? article.title_ta : article.title;
  const shortDescription = (lang === 'ta' && article.short_description_ta) ? article.short_description_ta : article.short_description;
  const categoryName = (lang === 'ta' && article.category?.name_ta) ? article.category.name_ta : (article.category?.name || 'Guide');
  const importantNotes = (lang === 'ta' && Array.isArray(article.important_notes_ta) && article.important_notes_ta.length > 0)
    ? article.important_notes_ta
    : (Array.isArray(article.important_notes) ? article.important_notes : []);
  const steps = (lang === 'ta' && Array.isArray(article.steps_ta) && article.steps_ta.length > 0)
    ? article.steps_ta
    : (Array.isArray(article.steps) ? article.steps : []);

  const prevTitle = (lang === 'ta' && article.prevArticle?.title_ta) ? article.prevArticle.title_ta : article.prevArticle?.title;
  const nextTitle = (lang === 'ta' && article.nextArticle?.title_ta) ? article.nextArticle.title_ta : article.nextArticle?.title;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
          {/* Header Row: Breadcrumb & Language Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-500 truncate">
              <Link href={getRolePath(role, userRoleSlug, 'help')} className="hover:text-blue-600 flex items-center space-x-1 font-medium shrink-0">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'ta' ? 'உதவி மையம்' : 'Help Center'}</span>
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              <span className="text-slate-500 truncate">{categoryName}</span>
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              <span className="text-slate-900 font-bold truncate max-w-[200px]">{title}</span>
            </div>

            {/* Language Switcher */}
            <div className="self-end sm:self-auto">
              <HelpLanguageSwitcher currentLang={lang} onLangChange={setLang} className="bg-slate-100 border-slate-200" />
            </div>
          </div>

          {/* Article Header Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                {categoryName}
              </span>
              <div className="flex items-center space-x-4 text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t.updated} {new Date(article.updated_at || article.created_at).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{article.view_count || 1} {t.views}</span>
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
              {shortDescription}
            </p>
          </div>

          {/* Important Notes Callout */}
          {importantNotes.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wider text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>{t.operationalNotes}</span>
              </div>
              <ul className="space-y-1.5 text-xs text-amber-900/90 list-disc pl-5">
                {importantNotes.map((note, idx) => (
                  <li key={idx} className="leading-relaxed">{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Step-by-Step Instructions */}
          {steps.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <span>{t.instructions}</span>
              </h2>

              <div className="space-y-6">
                {steps.map((st) => (
                  <div
                    key={st.stepNumber}
                    className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/30">
                        {st.stepNumber}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <h3 className="text-base font-bold text-slate-900">
                          {st.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {st.description}
                        </p>
                      </div>
                    </div>

                    {/* Step Screen Reference / Screenshot */}
                    {st.caption && (
                      <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700">{t.screenVerification}</span>
                          <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                            VEXA Invoice Workspace
                          </span>
                        </div>
                        <p className="text-slate-600 italic">{st.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Article Helpful Feedback Widget */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs text-center space-y-3">
            <h3 className="text-sm font-bold text-slate-900">{t.wasHelpful}</h3>
            <p className="text-xs text-slate-500">{t.feedbackSubtitle}</p>
            {feedbackSent ? (
              <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.thankYouFeedback}</span>
              </span>
            ) : (
              <div className="flex items-center justify-center space-x-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleFeedback(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 transition cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{t.yesHelped}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedback(false)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-300 border border-slate-200 transition cursor-pointer"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>{t.noNeedMore}</span>
                </button>
              </div>
            )}
          </div>

          {/* Previous / Next Article Navigation */}
          {(article.prevArticle || article.nextArticle) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {article.prevArticle ? (
                <Link
                  href={getRolePath(role, userRoleSlug, `help/${article.prevArticle.slug}`)}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 transition text-left group space-y-1 shadow-2xs"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.previousGuide}</span>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate">{prevTitle}</p>
                </Link>
              ) : <div />}

              {article.nextArticle ? (
                <Link
                  href={getRolePath(role, userRoleSlug, `help/${article.nextArticle.slug}`)}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 transition text-right group space-y-1 shadow-2xs"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.nextGuide}</span>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate">{nextTitle}</p>
                </Link>
              ) : <div />}
            </div>
          )}

          {/* Related Articles & Support Footer */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3">
              <h3 className="font-bold text-sm text-slate-900">{t.stillHaveQuestions}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t.supportEngineersHelp}
              </p>
              <Link
                href={getRolePath(role, userRoleSlug, 'support/new')}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer shadow-sm"
              >
                <span>{t.raiseSupportTicket}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3">
              <h3 className="font-bold text-sm text-slate-900">{t.faqsTitle}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t.faqsSubtitle}
              </p>
              <Link
                href={getRolePath(role, userRoleSlug, 'support/faq')}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                <span>{t.browseFaqs}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
