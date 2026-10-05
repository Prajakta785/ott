'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Bell, 
  Plus, 
  Radio, 
  Film, 
  Tv, 
  Activity, 
  Newspaper,
  X,
  CheckCheck,
  Clock,
  Sparkles,
  ArrowRight,
  Menu,
  Trash2,
  Check
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { firestoreService } from '@/lib/firestore-service';
import { ContentItem, LiveChannel, NotificationItem } from '@/lib/types';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLanguage } from '@/lib/i18n';

export function Header({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const router = useRouter();
  const { role, canEdit, hasAccessTo } = useAuth();
  const { t, lang } = useLanguage();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hasUnread, setHasUnread] = useState(true);
  const notifContainerRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const handleNotificationSeen = async (id: string, deepLinkUrl?: string) => {
    // 1. Immediately remove from local view with responsive UI
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id);
      if (next.length === 0) setHasUnread(false);
      return next;
    });
    // 2. Automatically delete notification from database/store
    await firestoreService.deleteNotification(id);
    if (deepLinkUrl) {
      setShowNotifications(false);
      router.push(deepLinkUrl);
    }
  };

  const handleClearAllNotifications = async () => {
    setNotifications([]);
    setHasUnread(false);
    await firestoreService.clearAllNotifications();
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    content: ContentItem[];
    liveChannels: LiveChannel[];
  }>({ content: [], liveChannels: [] });
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Load recent notifications
  useEffect(() => {
    async function loadNotifs() {
      try {
        const notifs = await firestoreService.getNotifications();
        setNotifications(notifs);
        if (notifs.length === 0) {
          setHasUnread(false);
        }
      } catch (e) {
        console.warn('Failed to load notifications in header:', e);
      }
    }
    loadNotifs();
  }, []);

  useEffect(() => {
    const handleSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults({ content: [], liveChannels: [] });
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const query = searchQuery.toLowerCase().trim();

      const [allContent, allChannels] = await Promise.all([
        firestoreService.getContent(),
        firestoreService.getLiveChannels(),
      ]);

      const matchedContent = allContent.filter(c => 
        c.title.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query)) ||
        (c.genres && c.genres.some(g => g.toLowerCase().includes(query))) ||
        (c.district && c.district.toLowerCase().includes(query)) ||
        (c.taluka && c.taluka.toLowerCase().includes(query))
      ).slice(0, 6);

      const matchedChannels = allChannels.filter(ch => 
        ch.channelName.toLowerCase().includes(query) ||
        (ch.description && ch.description.toLowerCase().includes(query))
      ).slice(0, 3);

      setSearchResults({
        content: matchedContent,
        liveChannels: matchedChannels,
      });
      setIsSearching(false);
    };

    const timer = setTimeout(handleSearch, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchQuery('');
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalResults = searchResults.content.length + searchResults.liveChannels.length;

  return (
    <header className="h-16 border-b border-[#E5DBCA] bg-[#FAF7F2]/95 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs text-[#2D2522]">
      {/* Search Input & Mobile Menu Toggle */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-md">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 -ml-1 rounded-xl text-[#2D2522] hover:bg-[#E5DBCA]/50 sm:hidden flex items-center justify-center shrink-0 cursor-pointer"
          title={lang === 'mr' ? 'मेनू उघडा' : 'Toggle Menu'}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div ref={searchContainerRef} className="flex-1 relative">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#4B5563] absolute left-3 sm:left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholderAdmin')}
              className="w-full bg-white border border-[#E5DBCA] rounded-full pl-9 sm:pl-11 pr-7 sm:pr-8 py-1.5 sm:py-2 text-xs font-semibold text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#166534] transition-all shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        {/* Global Search Results Dropdown */}
        {searchQuery.trim() && (
          <div className="absolute top-12 left-0 right-0 bg-white border border-[#E5DBCA] rounded-2xl shadow-soft-lg p-3 z-50 max-h-96 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between px-2 pb-1 border-b border-[#E5DBCA] text-[11px] font-bold text-[#7A6F68] uppercase tracking-wider">
              <span>{t('searchResultsTitle')} ({totalResults})</span>
              {isSearching && <span className="animate-spin text-[#EA580C]">●</span>}
            </div>

            {totalResults === 0 && !isSearching && (
              <div className="py-4 text-center text-xs text-[#7A6F68]">
                {t('noSearchResults')} &quot;{searchQuery}&quot;
              </div>
            )}

            {/* Live Channels */}
            {searchResults.liveChannels.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#DC2626] uppercase tracking-wider px-2">🔴 {t('navLiveTVAdmin')}</span>
                {searchResults.liveChannels.map(ch => (
                  <Link
                    key={ch.id}
                    href="/admin/live-tv"
                    onClick={() => setSearchQuery('')}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF7F2] transition text-xs group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <img src={ch.logo} alt={ch.channelName} className="w-6 h-6 rounded-md object-cover border border-[#E5DBCA]" />
                      <span className="font-bold text-[#2D2522] group-hover:text-[#EA580C] truncate">{ch.channelName}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#166534] bg-[#EAF5EF] px-2 py-0.5 rounded-full border border-[#B7E2CD]">
                      {t('badgeLiveTV')}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Content (Movies, Series, News) */}
            {searchResults.content.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#7A6F68] uppercase tracking-wider px-2">{t('sectionMedia')}</span>
                {searchResults.content.map(c => {
                  const targetHref = c.type === 'movie' ? '/admin/movies' : c.type === 'series' ? '/admin/web-series' : '/admin/news';
                  const typeLabel = c.type === 'movie' ? t('badge4KVOD') : c.type === 'series' ? t('badgeSeasons') : t('badgeNews');
                  return (
                    <Link
                      key={c.id}
                      href={targetHref}
                      onClick={() => setSearchQuery('')}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF7F2] transition text-xs group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <img src={c.poster} alt={c.title} className="w-6 h-8 rounded-md object-cover border border-[#E5DBCA]" />
                        <div className="truncate">
                          <p className="font-bold text-[#2D2522] group-hover:text-[#EA580C] truncate">{c.title}</p>
                          <p className="text-[10px] text-[#7A6F68] truncate">{c.genres?.join(', ') || typeLabel}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#7A6F68] border border-[#E5DBCA]">
                        {typeLabel}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

      {/* Action Items */}
      <div className="flex items-center gap-2.5">
        {/* 3 Languages Switcher (Marathi / Hindi / English) */}
        <LanguageSwitcher variant="light" />

        {/* Bunny CDN Health Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF5EF] border border-[#B7E2CD] text-xs text-[#166534] font-bold shadow-xs">
          <Activity className="w-3.5 h-3.5 text-[#166534] animate-pulse" />
          <span>{t('cdnActive')}</span>
        </div>

        {/* Quick Add Content Button */}
        {canEdit && (
          <div className="relative" ref={addMenuRef}>
            {(() => {
              const actions = [
                { href: '/admin/live-tv', base: '/admin/live-tv', label: t('actionLiveTV'), icon: Radio, iconColor: 'text-[#DC2626]', hover: 'hover:text-[#DC2626] hover:bg-[#FFF1F2]' },
                { href: '/admin/news', base: '/admin/news', label: t('actionNews'), icon: Newspaper, iconColor: 'text-[#EA580C]', hover: 'hover:text-[#EA580C] hover:bg-[#FFF1ED]' },
                { href: '/admin/movies?action=create', base: '/admin/movies', label: t('actionMovie'), icon: Film, iconColor: 'text-[#EA580C]', hover: 'hover:text-[#EA580C] hover:bg-[#FFF1ED]' },
                { href: '/admin/web-series?action=create', base: '/admin/web-series', label: t('actionSeries'), icon: Tv, iconColor: 'text-[#D97706]', hover: 'hover:text-[#D97706] hover:bg-[#FFFBEB]' },
                { href: '/admin/ads', base: '/admin/ads', label: t('actionAd'), isRupee: true, hover: 'hover:text-[#166534] hover:bg-[#EAF5EF]' },
              ].filter(a => hasAccessTo(a.base));

              if (actions.length === 0) return null;

              return (
                <>
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="p-2 sm:px-4 sm:py-2 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm active:scale-[0.98] cursor-pointer"
                    title={t('createNew')}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('createNew')}</span>
                  </button>

                  {showAddMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-[#E5DBCA] shadow-soft-lg p-2 z-50 animate-in fade-in zoom-in-95"
                      onClick={() => setShowAddMenu(false)}
                    >
                      {actions.map((act) => {
                        const IconComponent = act.icon;
                        return (
                          <Link
                            key={act.href}
                            href={act.href}
                            className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-[#2D2522] rounded-xl transition-colors cursor-pointer active:scale-95 ${act.hover}`}
                          >
                            {act.isRupee ? (
                              <span className="w-4 h-4 text-[#166534] font-bold">₹</span>
                            ) : (
                              IconComponent && <IconComponent className={`w-4 h-4 ${act.iconColor}`} />
                            )}
                            <span>{act.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Notification Bell */}
        <div className="relative" ref={notifContainerRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) setHasUnread(false);
            }}
            className="relative p-2 rounded-full bg-white text-[#2D2522] hover:bg-[#FAF7F2] border border-[#E5DBCA] transition-colors shadow-xs cursor-pointer active:scale-95"
            title={t('navNotifications') || 'Notifications'}
          >
            <Bell className="w-4 h-4 text-[#2D2522]" />
            {hasUnread && (
              <>
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#DC2626] animate-ping" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#DC2626]" />
              </>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-[#E5DBCA] shadow-soft-lg z-50 overflow-hidden animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="p-3.5 bg-[#FAF7F2] border-b border-[#E5DBCA] flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Bell className="w-4 h-4 text-[#DC2626]" />
                  <span className="text-xs font-bold text-[#2D2522]">{t('navNotifications')}</span>
                  {notifications.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#FEE2E2] text-[#DC2626]">
                      {notifications.length}
                    </span>
                  )}
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ⚡ {lang === 'mr' ? 'पाहिल्यावर ऑटो-डिलीट' : 'Auto-delete on seen'}
                  </span>
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAllNotifications}
                    className="text-[11px] font-bold text-[#DC2626] hover:text-[#991B1B] flex items-center gap-1 transition-colors cursor-pointer"
                    title={lang === 'mr' ? 'सर्व सूचना वाचून डिलीट करा' : 'Clear & delete all'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'सर्व साफ करा' : 'Clear All'}</span>
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-[#E5DBCA]/50 no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-[#FAF7F2] text-[#DC2626] border border-[#E5DBCA] flex items-center justify-center mx-auto mb-2.5">
                      <Sparkles className="w-5 h-5 text-[#EA580C]" />
                    </div>
                    <p className="text-xs font-bold text-[#2D2522]">
                      {lang === 'mr' ? 'सर्व सूचना पाहिल्या आहेत' : lang === 'hi' ? 'सभी सूचनाएं देख ली गई हैं' : 'All caught up!'}
                    </p>
                    <p className="text-[11px] text-[#7A6F68] mt-1">
                      {lang === 'mr' ? 'पाहिलेल्या सूचना आपोआप काढून टाकल्या जातात.' : lang === 'hi' ? 'देखी गई सूचनाएं स्वतः हटा दी जाती हैं।' : 'Seen notifications are automatically deleted.'}
                    </p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => handleNotificationSeen(item.id, item.deepLinkUrl)}
                      className="p-3.5 hover:bg-emerald-50/40 transition-all cursor-pointer group relative active:scale-[0.99]"
                      title={lang === 'mr' ? 'पाहण्यासाठी क्लिक करा (आपोआप डिलीट होईल)' : 'Click to view (will auto-delete)'}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-[#2D2522] leading-snug group-hover:text-[#166534] transition-colors">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#FAF7F2] text-[#7A6F68] border border-[#E5DBCA]">
                            {item.category?.replace('_', ' ') || 'Alert'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationSeen(item.id);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title={lang === 'mr' ? 'पाहिले - डिलीट करा' : 'Seen & Delete'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-[#7A6F68] mt-1 line-clamp-2 leading-relaxed">{item.message}</p>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-[#A89C94]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.sentAt ? item.sentAt.substring(0, 10) : 'Active'}
                        </span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Check className="w-3 h-3" />
                          {lang === 'mr' ? 'क्लिक केल्यावर डिलीट होईल' : 'Auto-deletes on click'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-[#FAF7F2] border-t border-[#E5DBCA]">
                <Link
                  href="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[#EA580C] hover:text-[#C2410C] hover:bg-white transition-colors group"
                >
                  <span>{lang === 'mr' ? 'पुश ॲलर्ट पाठवा व व्यवस्थापित करा' : lang === 'hi' ? 'पुश अलर्ट भेजें और प्रबंधित करें' : 'Send & Manage Push Alerts'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
