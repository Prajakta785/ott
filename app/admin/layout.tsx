'use client';

import React from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Radio, Newspaper, Film, Menu } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isAuthLoaded, hasAccessTo, role, isSuperAdmin, getRoleDefaultPath, switchRole } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  // If unauthenticated, redirect to login
  React.useEffect(() => {
    if (isAuthLoaded && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthLoaded, isAuthenticated, router]);

  if (!isAuthLoaded || !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] text-[#2D2522]">
        <div className="w-10 h-10 border-3 border-[#D97706] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#7A6F68]">Loading Gramin Bharat OTT Console...</p>
      </div>
    );
  }

  // Direct URL Access Control - Super Admin has unconditional full access to everything
  const isAllowed = isSuperAdmin || role === 'superadmin' || hasAccessTo(pathname);

  const bottomNavItems = [
    { name: lang === 'mr' ? 'डॅशबोर्ड' : lang === 'hi' ? 'डैशबोर्ड' : 'Home', href: '/admin', icon: LayoutDashboard },
    { name: lang === 'mr' ? 'थेट टीव्ही' : lang === 'hi' ? 'लाइव टीवी' : 'Live', href: '/admin/live-tv', icon: Radio },
    { name: lang === 'mr' ? 'बातम्या' : lang === 'hi' ? 'समाचार' : 'News', href: '/admin/news', icon: Newspaper },
    { name: lang === 'mr' ? 'चित्रपट' : lang === 'hi' ? 'फ़िल्में' : 'Movies', href: '/admin/movies', icon: Film },
  ].filter(item => isSuperAdmin || role === 'superadmin' || hasAccessTo(item.href));

  return (
    <div className="flex min-h-screen bg-background text-[#2D2522]">
      <Sidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header 
          onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)} 
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 sm:pb-8 max-w-7xl w-full mx-auto">
          {isAllowed ? (
            children
          ) : (
            <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in duration-300">
              <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-[#E5DBCA] shadow-soft text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#FFF1F2] border border-[#FFE4E6] text-[#DC2626] flex items-center justify-center mx-auto shadow-xs">
                  <ShieldAlert className="w-8 h-8 text-[#DC2626]" />
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full bg-[#FFF1F2] text-[#DC2626] border border-[#FFE4E6] text-[10px] font-bold uppercase tracking-wider">
                    {lang === 'mr' ? 'प्रवेश प्रतिबंधित' : lang === 'hi' ? 'प्रवेश प्रतिबंधित' : 'Access Restricted'}
                  </span>
                  <h2 className="text-xl font-black text-[#2D2522] mt-2.5">
                    {lang === 'mr' ? 'अनधिकृत प्रवेश' : lang === 'hi' ? 'अनधिकृत प्रवेश' : 'Access Restricted for Current Role'}
                  </h2>
                  <p className="text-xs text-[#7A6F68] mt-2 leading-relaxed">
                    {lang === 'mr' 
                      ? `तुमच्या सध्याच्या भूमिकेला (${role.toUpperCase()}) या विभागात प्रवेश करण्याची परवानगी नाही.`
                      : lang === 'hi'
                      ? `आपकी वर्तमान भूमिका (${role.toUpperCase()}) को इस मॉड्यूल तक पहुंचने की अनुमति नहीं है।`
                      : `Your current role (${role.toUpperCase()}) does not have permission to view or manage this module.`}
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <Link
                    href={getRoleDefaultPath(role)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{lang === 'mr' ? 'माझ्या रोलच्या विभागात जा' : lang === 'hi' ? 'मेरे रोल के मॉड्यूल में जाएं' : 'Go to My Role Workspace'}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      router.push('/admin');
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
                  >
                    <span>{lang === 'mr' ? '🏠 मुख्यपृष्ठावर जा' : lang === 'hi' ? '🏠 मुख्य पृष्ठ पर जाएं' : '🏠 Go to Home'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (phones < 640px) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#E5DBCA] px-2 py-1 flex items-center justify-around shadow-lg">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer min-w-[56px]',
                isActive
                  ? 'text-[#166534] font-black'
                  : 'text-[#6B7280] hover:text-[#0F172A] font-semibold'
              )}
            >
              <div className={cn(
                'p-1 rounded-lg transition-colors',
                isActive ? 'bg-[#EAF5EF] text-[#166534]' : ''
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer min-w-[56px]',
            isMobileSidebarOpen ? 'text-[#166534] font-black' : 'text-[#6B7280] hover:text-[#0F172A] font-semibold'
          )}
        >
          <div className={cn(
            'p-1 rounded-lg transition-colors',
            isMobileSidebarOpen ? 'bg-[#EAF5EF] text-[#166534]' : ''
          )}>
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">{lang === 'mr' ? 'सर्व मेनू' : lang === 'hi' ? 'सभी मेनू' : 'Menu'}</span>
        </button>
      </nav>
    </div>
  );
}
