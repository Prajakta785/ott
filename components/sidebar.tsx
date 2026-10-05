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
  X
} from 'lucide-react';
import { useAuth, checkRolePermission } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { firestoreService } from '@/lib/firestore-service';
import { useLanguage } from '@/lib/i18n';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, isSuperAdmin, logout, switchRole, hasAccessTo } = useAuth();
  const { t, lang } = useLanguage();
  const isLive = firestoreService.isLive();

  const isSuper = isSuperAdmin || role === 'superadmin' || user?.role === 'superadmin';

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

  const mediaNavigation = [
    { name: t('navDashboard'), href: '/admin', icon: LayoutDashboard },
    { name: t('navLiveTVAdmin'), href: '/admin/live-tv', icon: Radio, badgeKey: 'badgeLiveTV' as const, badgeColor: 'bg-orange-50 text-orange-700 border-orange-200/80' },
    { name: t('navNewsCMS'), href: '/admin/news', icon: Newspaper, badgeKey: 'badgeNews' as const, badgeColor: 'bg-orange-50 text-orange-700 border-orange-200/80' },
    { name: t('navGrievancesAdmin'), href: '/admin/grievances', icon: Megaphone, badgeKey: 'badgeCitizen' as const, badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80' },
    { name: t('navMoviesAdmin'), href: '/admin/movies', icon: Film, badgeKey: 'badge4KVOD' as const, badgeColor: 'bg-rose-50 text-rose-700 border-rose-200/80' },
    { name: t('navSeriesAdmin'), href: '/admin/web-series', icon: Tv, badgeKey: 'badgeSeasons' as const, badgeColor: 'bg-orange-50 text-orange-700 border-orange-200/80' },
    { name: t('navPodcastsAdmin'), href: '/admin/podcasts', icon: Headphones, badgeKey: 'badgePodcast' as const, badgeColor: 'bg-rose-50 text-rose-700 border-rose-200/80' },
  ];

  const operationsNavigation = [
    { name: t('navNotifications'), href: '/admin/notifications', icon: Bell, badgeKey: 'badgeFCM' as const, badgeColor: 'bg-orange-50 text-orange-700 border-orange-200/80' },
    { name: t('navAds'), href: '/admin/ads', icon: IndianRupee, badgeKey: 'badgeMonetization' as const, badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80' },
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
    ? mediaNavigation 
    : mediaNavigation.filter(item => checkRolePermission(role, item.href));
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

      {/* Role Switcher for Super Admin (All Roles Available) OR Assigned Role Display for Sub-Admin */}
      {isSuper ? (
        <div className="px-4 py-3 bg-[#FAF7F2] border-b border-[#E5DBCA]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#0F172A] font-extrabold flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" /> {t('adminRoleLabel')}
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {lang === 'mr' ? 'सर्व ॲक्सेस' : lang === 'hi' ? 'पूर्ण एक्सेस' : 'Full Access'}
            </span>
          </div>
          <select
            value={role}
            onChange={(e) => {
              const newRole = e.target.value as any;
              const targetPath = switchRole(newRole);
              if (pathname !== targetPath) {
                router.push(targetPath);
              }
            }}
            className="w-full bg-white border border-[#E5DBCA] rounded-xl text-xs font-bold px-2.5 py-2 text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#D97706] shadow-xs cursor-pointer"
          >
            <option value="superadmin">👑 {t('roleSuperAdmin')} ({lang === 'mr' ? 'सर्व ॲक्सेस' : 'All Access'})</option>
            <option value="news_editor">📝 {t('roleNewsEditor')}</option>
            <option value="content_manager">🎬 {t('roleContentManager')}</option>
            <option value="video_manager">📹 {t('roleVideoManager')}</option>
            <option value="reporter">🎤 {t('roleReporter')}</option>
            <option value="advertisement_manager">📢 {t('roleAdManager')}</option>
            <option value="finance_manager">💳 {t('roleFinanceManager')}</option>
          </select>

          {role !== 'superadmin' && (
            <button
              type="button"
              onClick={() => {
                const target = switchRole('superadmin');
                router.push(target);
              }}
              className="w-full mt-2 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[11px] font-black flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <span>👑 {lang === 'mr' ? 'सुपर ॲडमिनवर परत जा (सर्व ॲक्सेस)' : 'Restore Super Admin (All Access)'}</span>
            </button>
          )}
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

      {/* Navigation Links - Filtered by Role (Unauthorized items completely hidden) */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {visibleMediaNav.length > 0 && (
          <>
            <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-[#374151]">
              {t('sectionMedia')}
            </div>
            {visibleMediaNav.map((item) => {
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
                      ? 'bg-[#EAF5EF] text-[#166534] border border-[#B7E2CD] font-black shadow-xs'
                      : 'text-[#0F172A] hover:text-black hover:bg-white border border-transparent font-bold'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-[#166534]' : 'text-[#1F2937] group-hover:text-black'
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

        {visibleOperationsNav.length > 0 && (
          <>
            <div className={cn(
              "px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-[#374151]",
              visibleMediaNav.length > 0 && "pt-5"
            )}>
              {t('sectionMonetization')}
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
                      ? 'bg-[#EAF5EF] text-[#166534] border border-[#B7E2CD] font-black shadow-xs'
                      : 'text-[#0F172A] hover:text-black hover:bg-white border border-transparent font-bold'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-[#166534]' : 'text-[#1F2937] group-hover:text-black'
                      )}
                    />
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(item as any).badgeKey && (
                      <span className={cn(
                        'text-[9px] font-bold px-2 py-0.5 rounded-full border',
                        (item as any).badgeColor
                      )}>
                        {t((item as any).badgeKey)}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Engine Status & User Profile Footer */}
      <div className="p-4 border-t border-[#E5DBCA] space-y-3 bg-[#FAF7F2]">
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#EAF5EF] border border-[#B7E2CD] text-xs shadow-xs text-[#166534] font-black">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#166534] animate-pulse" />
            <span className="text-[#166534] font-black text-[11px]">{t('engineStatusText')}</span>
          </div>
          <button
            onClick={handleResetData}
            title={t('cleanCache')}
            className="text-[#166534]/70 hover:text-[#166534] p-1 transition-colors cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#EA580C] to-[#F59E0B] border border-[#E5DBCA] flex items-center justify-center text-xs font-black text-white uppercase overflow-hidden shrink-0 shadow-sm">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
              <div className="truncate">
                <p className="text-xs font-black text-[#0F172A] truncate">{user.name === 'Super Admin' ? t('roleSuperAdmin') : user.name}</p>
                <p className="text-[10px] text-[#374151] font-semibold truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (isMobileDrawer) onClose?.();
                logout();
                router.push('/login');
              }}
              title={t('logoutBtn')}
              className="p-1.5 rounded-lg text-[#374151] hover:text-[#BE123C] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Persistent Screen Sidebar (Always visible on screen with shrink-0) */}
      <aside className="w-72 shrink-0 min-w-[288px] bg-[#FAF7F2] border-r border-[#E5DBCA] flex flex-col h-screen sticky top-0 z-30 select-none shadow-sm text-[#2D2522] max-sm:hidden">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer & Backdrop (for phone screens < 640px) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 sm:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#FAF7F2] border-r border-[#E5DBCA] flex flex-col h-full shadow-2xl z-10 select-none text-[#2D2522] animate-in slide-in-from-left duration-200">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
