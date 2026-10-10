'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Radio, 
  Newspaper, 
  Tractor, 
  Sprout, 
  Clapperboard, 
  Film, 
  Tv, 
  Music, 
  MapPin, 
  Heart, 
  Camera, 
  CheckCircle2, 
  Plus,
  Headphones,
  Mic
} from 'lucide-react';
import { ContentCategory } from '@/lib/types';
import { firestoreService } from '@/lib/firestore-service';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded?: (category: ContentCategory) => void;
}

const AVAILABLE_ICONS = [
  { name: 'Headphones', icon: Headphones, label: 'Podcast' },
  { name: 'Mic', icon: Mic, label: 'Audio / Mic' },
  { name: 'Radio', icon: Radio, label: 'Radio' },
  { name: 'Newspaper', icon: Newspaper, label: 'News' },
  { name: 'Tractor', icon: Tractor, label: 'Rural' },
  { name: 'Sprout', icon: Sprout, label: 'Agri' },
  { name: 'Clapperboard', icon: Clapperboard, label: 'Shows' },
  { name: 'Film', icon: Film, label: 'Movies' },
  { name: 'Tv', icon: Tv, label: 'Series' },
  { name: 'Music', icon: Music, label: 'Music' },
  { name: 'MapPin', icon: MapPin, label: 'Local' },
  { name: 'Heart', icon: Heart, label: 'Life' },
  { name: 'Camera', icon: Camera, label: 'Media' },
  { name: 'Sparkles', icon: Sparkles, label: 'Special' },
];

const COLOR_PRESETS = [
  { name: 'Purple', class: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Emerald', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'Orange', class: 'bg-orange-50 text-orange-700 border-orange-200' },
  { name: 'Amber', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'Pink', class: 'bg-pink-50 text-pink-700 border-pink-200' },
  { name: 'Rose', class: 'bg-rose-50 text-rose-700 border-rose-200' },
  { name: 'Blue', class: 'bg-blue-50 text-blue-700 border-blue-200' },
];

export function AddCategoryModal({ isOpen, onClose, onCategoryAdded }: AddCategoryModalProps) {
  const { lang } = useLanguage();
  const [nameMarathi, setNameMarathi] = useState('');
  const [nameEnglish, setNameEnglish] = useState('');
  const [badgeText, setBadgeText] = useState('Special');
  const [badgeColor, setBadgeColor] = useState(COLOR_PRESETS[0].class);
  const [iconName, setIconName] = useState('Sparkles');
  const [mediaType, setMediaType] = useState<'video' | 'movie' | 'series' | 'news' | 'live' | 'podcast'>('video');
  const [position, setPosition] = useState<'front' | 'end'>('front');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEnglish.trim()) {
      setError(lang === 'mr' ? 'कृपया कॅटेगरीचे इंग्रजी नाव प्रविष्ट करा.' : 'Please enter English category name.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const slug = nameEnglish.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const fallbackMarathi = nameEnglish.trim().toLowerCase().includes('podcast') ? 'पॉडकास्ट' : nameEnglish.trim();
      const currentCats = await firestoreService.getCategories();
      const nextOrder = currentCats.length > 0 ? Math.max(...currentCats.map(c => c.order || 0), 0) + 1 : 10;
      const assignedOrder = position === 'front' ? 2.5 : nextOrder;

      const newCategory: ContentCategory = {
        id: `cat-${slug}-${Date.now().toString(36)}`,
        nameMarathi: nameMarathi.trim() || fallbackMarathi,
        nameEnglish: nameEnglish.trim(),
        type: mediaType,
        subCategories: [],
        badgeText: badgeText.trim() || 'Special',
        badgeColor,
        iconName,
        slug,
        order: assignedOrder,
      };

      await firestoreService.saveCategory(newCategory);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ott_category_updated', { detail: newCategory }));
        window.dispatchEvent(new Event('storage'));
      }
      if (onCategoryAdded) {
        onCategoryAdded(newCategory);
      }
      onClose();
    } catch (err) {
      console.error('Error saving category:', err);
      setError(lang === 'mr' ? 'कॅटेगरी सेव्ह करताना त्रुटी आली.' : 'Failed to save category.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E5DBCA] shadow-2xl flex flex-col max-h-[92vh] my-auto overflow-hidden animate-in zoom-in-95 text-[#2D2522]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed at Top */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-[#E5DBCA] bg-[#FAF7F2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#1F2937]">
                {lang === 'mr' ? 'नवीन मीडिया कॅटेगरी जोडा' : 'Add New Media Category'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {lang === 'mr' ? 'सायडबार आणि अॅपसाठी नवीन श्रेणी तयार करा' : 'Create new category for sidebar & app'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title={lang === 'mr' ? 'बंद करा' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="overflow-y-auto p-5 sm:p-6 space-y-4 min-h-0 flex-1">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {error}
              </div>
            )}

            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {lang === 'mr' ? 'कॅटेगरी नाव (English)' : 'Category Name (English)'} *
                </label>
                <input
                  type="text"
                  value={nameEnglish}
                  onChange={(e) => setNameEnglish(e.target.value)}
                  placeholder="e.g. Bhakti Sangeet / Youth"
                  required
                  autoFocus
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {lang === 'mr' ? 'मराठी नाव (Marathi)' : 'Marathi Name'}
                </label>
                <input
                  type="text"
                  value={nameMarathi}
                  onChange={(e) => setNameMarathi(e.target.value)}
                  placeholder="उदा. भक्ती संगीत / युवा कट्टा"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* Badge Text & Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {lang === 'mr' ? 'बॅज लेबल (Badge)' : 'Badge Label'}
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="e.g. Special / 4K / Rural"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {lang === 'mr' ? 'बॅज रंग (Color)' : 'Badge Color Theme'}
                </label>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {COLOR_PRESETS.map((cp) => (
                    <button
                      key={cp.name}
                      type="button"
                      onClick={() => setBadgeColor(cp.class)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer',
                        cp.class,
                        badgeColor === cp.class && 'ring-2 ring-black ring-offset-1'
                      )}
                    >
                      {cp.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Icon Selector */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                {lang === 'mr' ? 'आयकॉन निवडा (Select Icon)' : 'Select Icon'}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-1.5 border border-slate-200 rounded-2xl bg-slate-50/40">
                {AVAILABLE_ICONS.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = iconName === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setIconName(item.name)}
                      className={cn(
                        'flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition cursor-pointer',
                        isSelected 
                          ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-xs ring-1 ring-amber-400' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                      )}
                      title={item.label}
                    >
                      <IconComp className={cn('w-4 h-4 mb-0.5', isSelected ? 'text-amber-600' : 'text-slate-600')} />
                      <span className="text-[10px] truncate max-w-full font-bold">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Media Type */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                {lang === 'mr' ? 'मीडिया प्रकार (Media Type)' : 'Content Type'}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { id: 'video', label: 'Video / Show' },
                  { id: 'movie', label: 'Movie' },
                  { id: 'series', label: 'Web Series' },
                  { id: 'podcast', label: 'Podcast' },
                  { id: 'news', label: 'News' },
                  { id: 'live', label: 'Live TV' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMediaType(t.id as any)}
                    className={cn(
                      'py-1.5 px-2 text-center rounded-xl border text-xs font-bold transition cursor-pointer',
                      mediaType === t.id
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Position in Top Bar / Sidebar */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                {lang === 'mr' ? 'अॅपमधील स्थान (App & Sidebar Position)' : 'Display Position'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPosition('front')}
                  className={cn(
                    'py-2 px-3 text-left rounded-xl border text-xs font-bold transition cursor-pointer',
                    position === 'front'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <span className="block font-black text-xs">
                    {lang === 'mr' ? '⭐ सुरुवातीला (ठळक स्थान)' : '⭐ Front (Prominent)'}
                  </span>
                  <span className={cn('text-[10px] block opacity-85', position === 'front' ? 'text-amber-100' : 'text-slate-500')}>
                    {lang === 'mr' ? 'Live व बातम्या नंतर लगेच' : 'Right after Live & News'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPosition('end')}
                  className={cn(
                    'py-2 px-3 text-left rounded-xl border text-xs font-bold transition cursor-pointer',
                    position === 'end'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <span className="block font-black text-xs">
                    {lang === 'mr' ? 'शेवटी (Normal)' : 'At the End'}
                  </span>
                  <span className={cn('text-[10px] block opacity-85', position === 'end' ? 'text-amber-100' : 'text-slate-500')}>
                    {lang === 'mr' ? 'इतर सर्व कॅटेगरींनंतर' : 'After all categories'}
                  </span>
                </button>
              </div>
            </div>

            {/* Live Preview */}
            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA]">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                {lang === 'mr' ? 'पूर्वावलोकन (Sidebar Preview)' : 'Live Preview in Sidebar'}
              </span>
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white border border-[#E5DBCA] shadow-xs">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-900">
                    {nameEnglish || (lang === 'mr' ? 'कॅटेगरी नाव' : 'Category Name')}
                  </span>
                </div>
                <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border', badgeColor)}>
                  {badgeText || 'Special'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer - Fixed at Bottom */}
          <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-[#E5DBCA] bg-[#FAF7F2] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-white transition cursor-pointer"
            >
              {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black shadow-md transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? (lang === 'mr' ? 'जतन करत आहे...' : 'Saving...') : (lang === 'mr' ? 'कॅटेगरी जोडा' : 'Add Category')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
