'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES, Language } from '@/lib/i18n';

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark' | 'glass';
  mode?: 'segmented' | 'dropdown';
  className?: string;
}

export function LanguageSwitcher({ 
  variant = 'light', 
  mode = 'segmented',
  className = '' 
}: LanguageSwitcherProps) {
  const { lang, setLang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const currentOption = SUPPORTED_LANGUAGES.find(l => l.code === lang) || SUPPORTED_LANGUAGES[0];

  // DIRECT CLICKABLE BUTTONS: मराठी | हिंदी | English / EN
  if (mode === 'segmented') {
    const getSegmentedContainerStyle = () => {
      switch (variant) {
        case 'dark':
          return 'bg-slate-900/90 border-slate-700/80';
        case 'glass':
          return 'bg-white/10 backdrop-blur-md border-white/20';
        case 'light':
        default:
          return 'bg-white border-[#E5DBCA] rounded-full shadow-xs';
      }
    };

    const getInactiveButtonStyle = () => {
      switch (variant) {
        case 'dark':
          return 'text-slate-400 hover:text-white hover:bg-slate-800/60';
        case 'glass':
          return 'text-white/80 hover:text-white hover:bg-white/10';
        case 'light':
        default:
          return 'text-[#6E6259] hover:text-[#2D2522] hover:bg-amber-50/70';
      }
    };

    return (
      <div 
        className={`inline-flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-full border transition-all ${getSegmentedContainerStyle()} ${className}`}
        role="group"
        aria-label="Language selection"
      >
        <div className="pl-1 sm:pl-2 pr-0.5 text-[#D97706] hidden sm:block">
          <Globe className="w-3.5 h-3.5" />
        </div>
        {SUPPORTED_LANGUAGES.map((opt) => {
          const isSelected = opt.code === lang;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLang(opt.code);
              }}
              className={`px-2 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                isSelected
                  ? 'bg-[#166534] text-white font-black shadow-xs ring-1 ring-[#166534]'
                  : getInactiveButtonStyle()
              }`}
              title={`${opt.label} (${opt.nativeLabel})`}
            >
              <span className="sm:hidden">{opt.code === 'en' ? 'EN' : opt.nativeLabel}</span>
              <span className="hidden sm:inline">{opt.nativeLabel}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // DROPDOWN MODE (ALTERNATIVE)
  const getButtonStyles = () => {
    switch (variant) {
      case 'dark':
        return 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:border-rose-500';
      case 'glass':
        return 'bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20';
      case 'light':
      default:
        return 'bg-white border-[#E5DBCA] text-slate-800 hover:bg-slate-50 hover:border-amber-400 shadow-xs';
    }
  };

  const getDropdownStyles = () => {
    switch (variant) {
      case 'dark':
      case 'glass':
        return 'bg-slate-950 border-slate-800 text-white shadow-2xl';
      case 'light':
      default:
        return 'bg-white border-[#E5DBCA] text-slate-800 shadow-lg';
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-xs font-bold ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${getButtonStyles()}`}
        title={t('changeLanguage')}
      >
        <Globe className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span className="font-extrabold">{currentOption.nativeLabel}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className={`absolute right-0 mt-1.5 w-36 rounded-2xl border p-1.5 z-50 animate-in fade-in space-y-0.5 ${getDropdownStyles()}`}
        >
          <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            {t('selectLanguage')}
          </div>
          {SUPPORTED_LANGUAGES.map((opt) => {
            const isSelected = opt.code === lang;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLang(opt.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-[#166534] text-white font-black shadow-xs'
                    : variant === 'dark' || variant === 'glass'
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-700 hover:bg-amber-50'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="font-bold">{opt.nativeLabel}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {opt.label}
                  </span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
