'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Film, 
  Tv, 
  Layers, 
  CreditCard, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  LogOut, 
  RefreshCcw, 
  Newspaper, 
  Megaphone, 
  BarChart3, 
  Radio, 
  IndianRupee, 
  Bell, 
  Building2, 
  Headphones, 
  Plus, 
  X,
  Tractor,
  Sprout,
  Clapperboard,
  MapPin,
  Music,
  Mic,
  Heart,
  Camera,
  Trash2
} from 'lucide-react';
import { useAuth, checkRolePermission } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { firestoreService } from '@/lib/firestore-service';
import { useLanguage } from '@/lib/i18n';
import { ContentCategory } from '@/lib/types';
import { AddCategoryModal } from '@/components/add-category-modal';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

// Custom silhouette map icon for Namdar Maharashtra
function MaharashtraIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      stroke="none" 
      className={className}
      aria-label="Maharashtra Regional"
    >
      <path d="M5.5 8.2l3.2-3.5 5.1 1.2 4.8 2.8 2.4 2.1-2.1 3.4-3.2 2.5-4.5 3.3-3.8-1.5-2.2-3.8.5-3.5-.2-3z" />
    </svg>
  );
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, isSuperAdmin, logout, switchRole, hasAccessTo } = useAuth();
  const { t, lang } = useLanguage();
  const isLive = firestoreService.isLive();

  const isSuper = isSuperAdmin || role === 'superadmin' || user?.role === 'superadmin';

  const [showAddMediaMenu, setShowAddMediaMenu] = React.useState(false);
  const addMediaRef = React.useRef<HTMLDivElement>(null);
  const [showAddOpsMenu, setShowAddOpsMenu] = React.useState(false);
  const addOpsRef = React.useRef<HTMLDivElement>(null);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [dynamicCategories, setDynamicCategories] = React.useState<ContentCategory[]>([]);
  const [currentQuery, setCurrentQuery] = React.useState('');

  React.useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setCurrentQuery(window.location.search);
      try {
        const saved = localStorage.getItem('ott_admin_categories_v12_wiped');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const deletedIds = ['cat-podcast-mv1wwjtt', 'cat-dram-mv1y46sk', 'cat-podcast'];
            const filtered = parsed.filter(c => !deletedIds.includes(c.id));
            setDynamicCategories(filtered);
            localStorage.setItem('ott_admin_categories_v12_wiped', JSON.stringify(filtered));
          }
        }
      } catch {}
    }
  }, [pathname]);

  const loadCategories = React.useCallback(() => {
    firestoreService.getCategories().then(cats => {
      if (Array.isArray(cats)) {
        const deletedIds = ['cat-podcast-mv1wwjtt', 'cat-dram-mv1y46sk', 'cat-podcast'];
        const filtered = cats.filter(c => !deletedIds.includes(c.id));
        setDynamicCategories(filtered);
        try {
          localStorage.setItem('ott_admin_categories_v12_wiped', JSON.stringify(filtered));
        } catch {}
      }
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    loadCategories();
    const handleCategoryUpdate = () => {
      loadCategories();
    };
    window.addEventListener('ott_category_updated', handleCategoryUpdate);
    window.addEventListener('storage', handleCategoryUpdate);
    return () => {
      window.removeEventListener('ott_category_updated', handleCategoryUpdate);
      window.removeEventListener('storage', handleCategoryUpdate);
    };
  }, [loadCategories]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addMediaRef.current && !addMediaRef.current.contains(event.target as Node)) {
        setShowAddMediaMenu(false);
      }
      if (addOpsRef.current && !addOpsRef.current.contains(event.target as Node)) {
        setShowAddOpsMenu(false);
      }
    }
    if (showAddMediaMenu || showAddOpsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAddMediaMenu, showAddOpsMenu]);

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'superadmin': return t('roleSuperAdmin');
      case 'news_editor': return t('roleNewsEditor');
      case 'content_manager': return t('roleContentManager');
      case 'video_manager': return t('roleVideoManager');
      case 'reporter': return t('roleReporter');
      case 'advertisement_manager': return t('roleAdManager');
      case 'finance_manager': return t('roleFinanceManager');
      default: return r;
    }
  };

  const getMediaNavName = (key: string) => {
    switch (key) {
      case 'Live':
        return lang === 'mr' ? 'लाईव्ह टीव्ही' : lang === 'hi' ? 'लाइव टीवी' : 'Live';
      case 'News':
        return lang === 'mr' ? 'बातम्या' : lang === 'hi' ? 'समाचार' : 'News';
      case 'Namdar Maharashtra':
      case 'Nammad Maharashtra':
        return lang === 'mr' ? 'नामदार महाराष्ट्र' : lang === 'hi' ? 'नामदार महाराष्ट्र' : 'Namdar Maharashtra';
      case 'Gramin Bharat TV':
        return lang === 'mr' ? 'ग्रामीण भारत TV' : lang === 'hi' ? 'ग्रामीण भारत TV' : 'Gramin Bharat TV';
      case 'Entertainment':
        return lang === 'mr' ? 'मनोरंजन' : lang === 'hi' ? 'मनोरंजन' : 'Entertainment';
      case 'Movies':
        return lang === 'mr' ? 'चित्रपट' : lang === 'hi' ? 'फ़िल्में' : 'Movies';
      case 'Web Series':
        return lang === 'mr' ? 'वेब मालिका' : lang === 'hi' ? 'वेब सीरीज़' : 'Web Series';
      case 'Podcast':
      case 'Podcasts':
        return lang === 'mr' ? 'पॉडकास्ट' : lang === 'hi' ? 'पॉडकास्ट' : 'Podcast';
      default: {
        const found = dynamicCategories.find(c => c.nameEnglish.toLowerCase() === key.toLowerCase());
        if (found) {
          if (lang === 'mr' && found.nameMarathi) return found.nameMarathi;
          if (lang === 'hi' && found.nameMarathi) return found.nameMarathi;
          return found.nameEnglish;
        }
        return key;
      }
    }
  };

  const getMediaNavBadge = (badge: string) => {
    switch (badge) {
      case 'Live TV':
        return lang === 'mr' ? 'थेट' : lang === 'hi' ? 'लाइव' : 'Live TV';
      case 'News':
        return lang === 'mr' ? 'बातम्या' : lang === 'hi' ? 'समाचार' : 'News';
      case 'Regional':
        return lang === 'mr' ? 'प्रादेशिक' : lang === 'hi' ? 'क्षेत्रीय' : 'Regional';
      case 'Rural':
        return lang === 'mr' ? 'ग्रामीण' : lang === 'hi' ? 'ग्रामीण' : 'Rural';
      case 'Shows':
        return lang === 'mr' ? 'कार्यक्रम' : lang === 'hi' ? 'शोज़' : 'Shows';
      case '4K VOD':
        return lang === 'mr' ? '४K व्हीओडी' : lang === 'hi' ? '4K वीओडी' : '4K VOD';
      case 'Series':
        return lang === 'mr' ? 'मालिका' : lang === 'hi' ? 'सीरीज़' : 'Series';
      case 'Audio':
        return lang === 'mr' ? 'ऑडिओ' : lang === 'hi' ? 'ऑडियो' : 'Audio';
      case 'Special':
        return lang === 'mr' ? 'खास' : lang === 'hi' ? 'विशेष' : 'Special';
      case 'New':
        return lang === 'mr' ? 'नवीन' : lang === 'hi' ? 'नया' : 'New';
      default:
        return badge;
    }
  };

  // Exactly matching requested OTT Media & Broadcasting section (excluding "All")
  const defaultMediaNav = [
    { 
      name: 'Live', 
      href: '/admin/live-tv', 
      icon: Radio, 
      iconColor: 'text-black', 
      badgeText: 'Live TV', 
      badgeColor: 'bg-red-50 text-red-600 border-red-200' 
    },
    { 
      name: 'News', 
      href: '/admin/news', 
      icon: Newspaper, 
      iconColor: 'text-black', 
      badgeText: 'News', 
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' 
    },
    { 
      name: 'Namdar Maharashtra', 
      href: '/admin/media?category=Namdar+Maharashtra', 
      icon: MaharashtraIcon, 
      iconColor: 'text-black', 
      badgeText: 'Regional', 
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' 
    },
    { 
      name: 'Gramin Bharat TV', 
      href: '/admin/media?category=Gramin+Bharat+TV', 
      icon: Tractor, 
      iconColor: 'text-black', 
      badgeText: 'Rural', 
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
    },
    { 
      name: 'Entertainment', 
      href: '/admin/media?category=Entertainment', 
      icon: Clapperboard, 
      iconColor: 'text-black', 
      badgeText: 'Shows', 
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' 
    },
    { 
      name: 'Movies', 
      href: '/admin/movies', 
      icon: Film, 
      iconColor: 'text-black', 
      badgeText: '4K VOD', 
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200' 
    },
    { 
      name: 'Web Series', 
      href: '/admin/web-series', 
      icon: Tv, 
      iconColor: 'text-black', 
      badgeText: 'Series', 
      badgeColor: 'bg-pink-50 text-pink-700 border-pink-200' 
    },
  ];

  // Helper to map icon string to Lucide component
  const getDynamicIcon = (name?: string) => {
    switch (name) {
      case 'Radio': return Radio;
      case 'Newspaper': return Newspaper;
      case 'Tractor': return Tractor;
      case 'Sprout': return Sprout;
      case 'Clapperboard': return Clapperboard;
      case 'Film': return Film;
      case 'Tv': return Tv;
      case 'Music': return Music;
      case 'MapPin': return MapPin;
      case 'Headphones': return Headphones;
      case 'Mic': return Mic;
      case 'Heart': return Heart;
      case 'Camera': return Camera;
      case 'Sparkles': return Sparkles;
      default: return Sparkles;
    }
  };

  // Only exclude existing default items to prevent duplicate sidebar rows
  const existingNames = new Set([
    ...defaultMediaNav.map(d => d.name.toLowerCase().trim()),
    'nammad maharashtra',
    'namdar maharashtra'
  ]);
  const customNavItems = isMounted ? dynamicCategories
    .filter(c => {
      const lowerName = c.nameEnglish.toLowerCase().trim();
      if (lowerName === 'all' || existingNames.has(lowerName)) return false;
      existingNames.add(lowerName); // Add to set to prevent duplicates in customNavItems
      return true;
    })
    .map(c => ({
      name: c.nameEnglish,
      href: `/admin/media?category=${encodeURIComponent(c.nameEnglish)}`,
      icon: getDynamicIcon(c.iconName),
      iconColor: 'text-black',
      badgeText: c.badgeText || 'Special',
      badgeColor: c.badgeColor || 'bg-amber-50 text-amber-700 border-amber-200',
      isCustom: true,
      categoryId: c.id,
    })) : [];

  const handleDeleteCustomCategory = async (e: React.MouseEvent, categoryId: string, categoryName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(lang === 'mr' ? `"${categoryName}" ही कॅटेगरी नक्की हटवायची आहे का?` : `Are you sure you want to delete "${categoryName}" category?`)) {
      await firestoreService.deleteCategory(categoryId);
      setDynamicCategories(prev => prev.filter(c => c.id !== categoryId));
      window.dispatchEvent(new CustomEvent('ott_category_updated'));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const fullMediaNav = [...defaultMediaNav, ...customNavItems];

  const operationsNavigation = [
    { name: t('navGrievancesAdmin'), href: '/admin/grievances', icon: Megaphone, badgeKey: 'badgeCitizen' as const, badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80' },
    { name: t('navNotifications'), href: '/admin/notifications', icon: Bell, badgeKey: 'badgeFCM' as const, badgeColor: 'bg-orange-50 text-orange-700 border-orange-200/80' },
    { name: t('navAds'), href: '/admin/ads', icon: IndianRupee, badgeKey: 'badgeMonetization' as const, badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80' },
    { name: t('navBanners'), href: '/admin/banners', icon: Layers },
    { name: t('navPlansAdmin'), href: '/admin/plans', icon: CreditCard },
    { name: t('navUsers'), href: '/admin/users', icon: Users },
    { name: t('navReports'), href: '/admin/reports', icon: BarChart3, badgeKey: 'badgeReports' as const, badgeColor: 'bg-rose-50 text-rose-700 border-rose-200/80' },
    { name: t('navCompanyInfo'), href: '/admin/company', icon: Building2 },
    { name: t('navAdmins'), href: '/admin/admins', icon: ShieldCheck }
  ];

  const handleResetData = () => {
    if (confirm(lang === 'mr' ? 'सर्व डेटा रीसेट करायचा आहे का?' : lang === 'hi' ? 'क्या आप सभी डेटा रीसेट करना चाहते हैं?' : 'Reset all demo data back to clean records?')) {
      firestoreService.resetDemoData();
      window.location.reload();
    }
  };

  const visibleMediaNav = role === 'superadmin' 
    ? fullMediaNav 
    : fullMediaNav.filter(item => checkRolePermission(role, item.href));
  const visibleOperationsNav = role === 'superadmin' 
    ? operationsNavigation 
    : operationsNavigation.filter(item => checkRolePermission(role, item.href));

  const renderContent = (isMobileDrawer: boolean = false) => (
    <>
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-[#E5DBCA] bg-[#FAF7F2] flex items-center justify-between">
        <Link 
          href="/admin" 
          onClick={() => isMobileDrawer && onClose?.()}
          className="flex items-center group flex-1"
        >
          <div className="overflow-hidden flex-1 flex items-center">
            <img 
              src="/brand-horizontal.png" 
              alt="ग्रामीण भारत TV" 
              style={{ maxHeight: '54px', maxWidth: '230px', width: 'auto', height: 'auto' }}
              className="h-10 sm:h-12 w-auto object-contain max-w-[210px] sm:max-w-[230px] group-hover:scale-[1.02] transition-transform"
            />
          </div>
        </Link>
        {isMobileDrawer && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 rounded-xl text-[#2D2522] hover:bg-[#E5DBCA]/60 transition-colors cursor-pointer"
            title={lang === 'mr' ? 'मेनू बंद करा' : 'Close Menu'}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role Switcher for Super Admin */}
      {isSuper ? (
        <div className="px-4 py-2.5 bg-[#FAF7F2] border-b border-[#E5DBCA]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#0F172A] font-extrabold flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" /> {t('adminRoleLabel')}
            </span>
            <div className="flex items-center gap-1.5">
              <select
                value={role}
                onChange={(e) => {
                  switchRole(e.target.value as any);
                  const path = (checkRolePermission as any)(e.target.value, pathname) ? pathname : '/admin';
                  router.push(path);
                }}
                className="bg-white border border-[#E5DBCA] rounded-xl text-[11px] font-black px-2.5 py-1 text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#166534] shadow-xs cursor-pointer max-w-[170px]"
                title={lang === 'mr' ? 'प्रशासकीय रोल बदला' : 'Switch Admin Role'}
              >
                <option value="superadmin">👑 Super Admin (सर्व अधिकार)</option>
                <option value="news_editor">📰 News Editor (बातम्या)</option>
                <option value="content_manager">🎬 Content Manager (कंटेंट)</option>
                <option value="video_manager">🎥 Video Manager (व्हिडिओ)</option>
                <option value="reporter">🎤 Reporter (रिपोर्टर)</option>
                <option value="advertisement_manager">💰 Ad Manager (जाहिरात)</option>
                <option value="finance_manager">💳 Finance Manager (वित्त)</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-2.5 bg-[#FAF7F2] border-b border-[#E5DBCA]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#0F172A] font-extrabold flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" /> {t('adminRoleLabel')}
            </span>
            <div 
              className="bg-white border border-[#E5DBCA] rounded-xl text-[11px] font-black px-2.5 py-1 text-[#0F172A] flex items-center gap-1.5 shadow-xs max-w-[170px]"
              title={lang === 'mr' ? 'असाइन केलेला प्रशासकीय रोल' : 'Assigned Role'}
            >
              <span className="truncate">{getRoleLabel(role)}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-100" />
            </div>
          </div>
        </div>
      )}


      {/* Navigation Links - Filtered by Role */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto no-scrollbar">
        {visibleMediaNav.length > 0 && (
          <>
            {/* OTT Media Section Header with Quick "+ Add" Option */}
            <div className="px-3 pb-2 flex items-center justify-between relative" ref={addMediaRef}>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#374151]">
                {t('sectionMedia')}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsAddCategoryModalOpen(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-all cursor-pointer shadow-xs active:scale-95"
                title={lang === 'mr' ? 'नवीन कॅटेगरी जोडा' : 'Add Category'}
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>{lang === 'mr' ? '+ कॅटेगरी' : '+ Category'}</span>
              </button>
            </div>

            {/* Primary Dashboard Link - Exactly at position in user image */}
            <Link
              href="/admin"
              onClick={() => isMobileDrawer && onClose?.()}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all group cursor-pointer active:scale-[0.98] mb-1',
                pathname === '/admin'
                  ? 'bg-white text-[#0F172A] font-black shadow-md border border-white/50'
                  : 'text-[#0F172A] hover:text-black hover:bg-white border border-transparent font-bold'
              )}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard
                  className={cn(
                    'w-4 h-4 transition-colors',
                    pathname === '/admin' ? 'text-black' : 'text-black group-hover:text-black'
                  )}
                />
                <span>{lang === 'mr' ? 'डॅशबोर्ड' : 'Dashboard'}</span>
              </div>
            </Link>

            {/* Media navigation items - Matches Image 1 */}
            {visibleMediaNav.map((item) => {
              const isMediaRoute = pathname === '/admin/media';
              const queryMatch = isMediaRoute && currentQuery.includes(encodeURIComponent(item.name).replace(/%20/g, '+'));
              const queryExactMatch = isMediaRoute && currentQuery.includes(encodeURIComponent(item.name));
              const isActive = (pathname === item.href) || 
                (queryMatch || queryExactMatch) ||
                (item.href !== '/admin' && item.href !== '/admin/media' && pathname.startsWith(item.href));
              
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => isMobileDrawer && onClose?.()}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all group cursor-pointer active:scale-[0.98]',
                    isActive
                      ? 'bg-white text-[#0F172A] font-black shadow-md border border-white/50'
                      : 'text-[#0F172A] hover:text-black hover:bg-white border border-transparent font-bold'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-black' : 'text-black'
                      )}
                    />
                    <span>{getMediaNavName(item.name)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {((item as any).badgeText || (item as any).badgeKey) && (
                      <span className={cn(
                        'text-[9px] font-bold px-2 py-0.5 rounded-full border',
                        (item as any).badgeColor
                      )}>
                        {getMediaNavBadge((item as any).badgeText || t((item as any).badgeKey))}
                      </span>
                    )}
                    {(item as any).isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomCategory(e, (item as any).categoryId, item.name)}
                        className="opacity-0 group-hover:opacity-100 p-1 -mr-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                        title={lang === 'mr' ? 'कॅटेगरी हटवा' : 'Delete Category'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </Link>
              );
            })}

            {/* Quick "+ Add Category" button in Media List */}
            <button
              type="button"
              onClick={() => {
                if (isMobileDrawer) onClose?.();
                setIsAddCategoryModalOpen(true);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50/70 hover:bg-amber-100/90 border border-amber-200/80 transition-all cursor-pointer active:scale-[0.98] mt-1.5"
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4 text-amber-700 stroke-[2.5]" />
                <span>{lang === 'mr' ? '+ नवीन कॅटेगरी जोडा' : lang === 'hi' ? '+ नई श्रेणी जोड़ें' : '+ Add Category'}</span>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                {lang === 'mr' ? 'नवीन' : 'New'}
              </span>
            </button>
          </>
        )}

        {visibleOperationsNav.length > 0 && (
          <>
            <div className={cn(
              "px-3 pb-2 flex items-center justify-between relative",
              visibleMediaNav.length > 0 && "pt-5"
            )} ref={addOpsRef}>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#374151]">
                {t('sectionMonetization')}
              </span>
              

            </div>
            {visibleOperationsNav.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => isMobileDrawer && onClose?.()}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all group cursor-pointer active:scale-[0.98]',
                    isActive
                      ? 'bg-white text-[#0F172A] font-black shadow-md border border-white/50'
                      : 'text-[#0F172A] hover:text-black hover:bg-white border border-transparent font-bold'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-black' : 'text-black'
                      )}
                    />
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {((item as any).badgeText || (item as any).badgeKey) && (
                      <span className={cn(
                        'text-[9px] font-bold px-2 py-0.5 rounded-full border',
                        (item as any).badgeColor
                      )}>
                        {(item as any).badgeText || t((item as any).badgeKey)}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Cloud Status, Reset, Logout Footer */}
      <div className="p-3 border-t border-[#E5DBCA] space-y-1 bg-[#FAF7F2]">
        <div className="px-3 py-1 flex items-center justify-between text-[11px] text-[#7A6F68]">
          <span className="flex items-center gap-1.5 font-bold">
            <span className={cn(
              "w-2 h-2 rounded-full",
              isLive ? "bg-emerald-500 animate-pulse" : "bg-emerald-500"
            )} />
            {isLive ? (lang === 'mr' ? 'क्लाउड कनेक्टेड' : 'Cloud Connected') : 'Active Storage'}
          </span>
          <span className="text-[10px] font-mono text-[#D97706] font-extrabold uppercase">
            {isLive ? 'FIRESTORE' : 'LOCAL'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleResetData}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-[#7A6F68] hover:text-[#2D2522] hover:bg-white transition cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4 text-[#D97706]" />
          <span>{lang === 'mr' ? 'डेटा रीसेट करा' : lang === 'hi' ? 'डेटा रीसेट करें' : 'Reset Demo Data'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (confirm(lang === 'mr' ? 'तुम्ही खात्रीने लॉगआउट करू इच्छिता?' : lang === 'hi' ? 'क्या आप निश्चित रूप से लॉगआउट करना चाहते हैं?' : 'Are you sure you want to sign out?')) {
              logout();
              router.push('/login');
            }
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{lang === 'mr' ? 'लॉगआउट' : lang === 'hi' ? 'लॉगआउट' : 'Sign Out'}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 border-r border-[#E5DBCA] bg-[#FAF7F2] flex-col shrink-0 h-full hidden sm:flex select-none">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer (with Backdrop overlay) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex sm:hidden bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={onClose}
        >
          <aside 
            className="w-72 max-w-[85vw] border-r border-[#E5DBCA] bg-[#FAF7F2] flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {renderContent(true)}
          </aside>
        </div>
      )}

      {/* Add Custom Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onCategoryAdded={(newCat) => {
          setDynamicCategories(prev => [...prev, newCat]);
          router.push(`/admin/media?category=${encodeURIComponent(newCat.nameEnglish)}`);
        }}
      />
    </>
  );
}
