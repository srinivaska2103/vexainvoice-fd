'use client';

import React, { useState, useEffect } from 'react';
import { Languages } from 'lucide-react';
import { HELP_LANG_KEY } from '@/lib/helpTranslations';

export default function HelpLanguageSwitcher({ currentLang, onLangChange, className = '' }) {
  const [lang, setLang] = useState(currentLang || 'en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(HELP_LANG_KEY) || 'en';
      setLang(saved);
      if (onLangChange && saved !== currentLang) {
        onLangChange(saved);
      }
    }
  }, []);

  const handleSelect = (newLang) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(HELP_LANG_KEY, newLang);
      // Dispatch custom event so other components on page re-sync if needed
      window.dispatchEvent(new Event('help-lang-changed'));
    }
    if (onLangChange) {
      onLangChange(newLang);
    }
  };

  return (
    <div
      className={`inline-flex items-center p-1 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner ${className}`}
      role="group"
      aria-label="Help Center Language"
    >
      <div className="flex items-center pl-2 pr-1 text-slate-300 text-xs font-semibold">
        <Languages className="w-4 h-4 mr-1.5 text-blue-400" />
        <span className="hidden sm:inline">Language:</span>
      </div>

      <div className="inline-flex rounded-xl bg-slate-900/40 p-0.5">
        <button
          type="button"
          onClick={() => handleSelect('en')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            lang === 'en'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => handleSelect('ta')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-sans ${
            lang === 'ta'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          தமிழ்
        </button>
      </div>
    </div>
  );
}

