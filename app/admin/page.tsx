'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Film, 
  Tv, 
  Radio, 
  Users, 
  CreditCard, 
  Play, 
  HardDrive,
  ArrowUpRight,
  Activity,
  Globe,
  Newspaper,
  Sparkles,
  RadioTower,
  ShieldCheck,
  Zap,
  Trash2,
  Headphones,
  VolumeX,
  Music
} from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ConnectAudioModal } from '@/components/connect-audio-modal';
import { firestoreService } from '@/lib/firestore-service';
import { ContentItem, User, Subscription } from '@/lib/types';
import { formatCurrency, formatViews } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { getSafeImageUrl, handleImageError } from '@/lib/image-utils';

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const { canDelete, hasAccessTo } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);
  const [itemForAudio, setItemForAudio] = useState<ContentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAudioUpdated = (updated: ContentItem) => {
    setContent(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await firestoreService.deleteContent(itemToDelete.id);
      setContent(prev => prev.filter(c => c.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (err) {
      console.error('Failed to delete catalog item:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      const [items, userList, subList] = await Promise.all([
        firestoreService.getContent(),
        firestoreService.getUsers(),
        firestoreService.getSubscriptions(),
      ]);
      setContent(items);
      setUsers(userList);
      setSubscriptions(subList);
      setLoading(false);
    }
    loadData();
  }, []);

  const activeSubsCount = subscriptions.filter(s => s.status === 'active').length || users.filter(u => u.subscriptionStatus === 'active').length;
  const totalRevenue = subscriptions.filter(s => s.status === 'active').reduce((acc, s) => acc + (s.amount || 0), 0);
  const totalViews = content.reduce((acc, c) => acc + (c.views || 0), 0);
  const bandwidthGB = (totalViews * 0.45).toFixed(1);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Signature Brand Hero Banner - Softer Dark Navy Slate */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#1E293B] border border-slate-700/60 p-5 sm:p-8 shadow-xl text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="px-3 py-1 rounded-full bg-[#DC2626] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                {t('liveBroadcastEdge')}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-900/60 text-[#4ADE80] border border-emerald-500/30 text-xs font-bold">
                {lang === 'mr' ? 'नामदार महाराष्ट्र' : lang === 'hi' ? 'नामदार महाराष्ट्र' : 'Namdar Maharashtra • Gramin Bharat TV'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t('heroStudioTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl font-medium leading-relaxed">
              {t('heroStudioDesc')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {hasAccessTo('/live') && (
              <Link href="/live">
                <button className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95">
                  <Radio className="w-3.5 h-3.5 text-white" /> {t('actionLiveTV')}
                </button>
              </Link>
            )}
            {hasAccessTo('/news') && (
              <Link href="/news">
                <button className="px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95">
                  <Newspaper className="w-3.5 h-3.5 text-white" /> {t('actionNews')}
                </button>
              </Link>
            )}
            {hasAccessTo('/movies') && (
              <Link href="/movies?action=create">
                <button className="px-4 py-2 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95">
                  {t('actionMovie')}
                </button>
              </Link>
            )}
            {hasAccessTo('/series') && (
              <Link href="/series?action=create">
                <button className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-bold flex items-center gap-2 transition active:scale-95">
                  <Tv className="w-3.5 h-3.5 text-slate-200" /> {t('actionSeries')}
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Live KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title={t('statActiveSubscribers')}
          value={activeSubsCount.toLocaleString()}
          change={activeSubsCount > 0 ? `+${activeSubsCount} ${t('statLiveMetric')}` : `0 ${t('statLiveMetric')}`}
          isPositive={activeSubsCount > 0}
          icon={<Users className="w-5 h-5" />}
          color="peach"
        />
        <StatsCard
          title={t('statMonthlyRevenue')}
          value={formatCurrency(totalRevenue)}
          change={totalRevenue > 0 ? `₹${totalRevenue.toLocaleString('en-IN')}` : '₹0.00'}
          isPositive={totalRevenue > 0}
          icon={<CreditCard className="w-5 h-5" />}
          color="matcha"
        />
        <StatsCard
          title={t('statStreamingViews')}
          value={formatViews(totalViews)}
          change={totalViews > 0 ? `+${totalViews} ${t('statViews')}` : `0 ${t('statViews')}`}
          isPositive={totalViews > 0}
          icon={<Play className="w-5 h-5" />}
          color="rose"
        />
        <StatsCard
          title={t('statBunnyBandwidth')}
          value={totalViews > 0 ? `${bandwidthGB} GB` : '0.0 GB'}
          change={totalViews > 0 ? t('statOptimalEdge') : t('statStandby')}
          isPositive={true}
          icon={<HardDrive className="w-5 h-5" />}
          color="latte"
        />
      </div>

      {/* Bunny CDN & Edge Infrastructure Telemetry Grid */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#E5DBCA] p-5 sm:p-7 shadow-soft space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#2D2522] flex items-center gap-2">
              <RadioTower className="w-5 h-5 text-[#166534]" /> {t('telemetryTitle')}
            </h3>
            <p className="text-xs text-[#7A6F68] mt-0.5">{t('telemetryDesc')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-[#EAF5EF] border border-[#B7E2CD] text-[#166534] text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#166534]" />
              {t('clustersOperational')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A6F68]">{t('latencyTitle')}</p>
            <p className="text-xl font-black text-[#2D2522] mt-1">18 ms</p>
            <span className="text-[10px] text-[#166534] font-semibold">{t('cacheRatio')}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A6F68]">{t('hlsTitle')}</p>
            <p className="text-xl font-black text-[#DC2626] mt-1">4K UHD + HDR</p>
            <span className="text-[10px] text-[#7A6F68] font-semibold">{t('adaptiveBitrate')}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A6F68]">{t('securityTitle')}</p>
            <p className="text-xl font-black text-[#D97706] mt-1">HMAC SHA-256</p>
            <span className="text-[10px] text-[#166534] font-semibold">{t('tokenAuth')}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A6F68]">{t('dbTitle')}</p>
            <p className="text-xl font-black text-[#166534] mt-1">{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'graminbharattv-f8994'}</p>
            <span className="text-[10px] text-[#166534] font-semibold">{t('syncConnected')}</span>
          </div>
        </div>
      </div>

      {/* Content Catalog Management Card */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#E5DBCA] p-5 sm:p-7 shadow-soft">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-[#2D2522]">{t('catalogTitle')}</h3>
            <p className="text-xs text-[#7A6F68] mt-0.5">{t('catalogDesc')}</p>
          </div>
          <Link href="/movies" className="text-xs font-bold text-[#EA580C] hover:text-[#C2410C] flex items-center gap-1">
            {t('viewFullCatalog')} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {content.length === 0 ? (
          <div className="py-14 text-center rounded-2xl bg-[#FAF7F2] border border-dashed border-[#E5DBCA]">
            <Sparkles className="w-8 h-8 text-[#EA580C] mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-[#2D2522]">{t('noCatalogItems')}</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <Link href="/movies?action=create">
                <button className="px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5">
                  {t('actionMovie')}
                </button>
              </Link>
              <Link href="/news">
                <button className="px-4 py-2 bg-white hover:bg-[#FAF7F2] text-[#2D2522] border border-[#E5DBCA] text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm">
                  <Newspaper className="w-3.5 h-3.5 text-[#166534]" /> {t('actionNews')}
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-[#7A6F68] border-b border-[#E5DBCA]">
                <tr>
                  <th className="pb-3 font-bold">{t('colTitle')}</th>
                  <th className="pb-3 font-bold">{t('colType')}</th>
                  <th className="pb-3 font-bold">{t('colCategory')}</th>
                  <th className="pb-3 font-bold">{t('colViews')}</th>
                  <th className="pb-3 font-bold">{t('colTier')}</th>
                  <th className="pb-3 font-bold">{t('colStatus')}</th>
                  <th className="pb-3 font-bold text-right">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DBCA]/60">
                {content.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={getSafeImageUrl(item.poster || item.banner || (item.videoId ? `/api/bunny/thumbnail?videoId=${item.videoId}` : ''))} 
                          alt={item.title} 
                          onError={(e) => handleImageError(e)}
                          className="w-12 h-16 rounded-lg object-cover border border-[#E5DBCA] shrink-0 shadow-sm bg-slate-100" 
                        />
                        <div>
                          <p className="font-bold text-[#2D2522] text-sm">{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-[#7A6F68]">{item.director || 'ग्रामीण भारत'} · {item.releaseDate?.substring(0, 4)}</p>
                            {item.audioUrl ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full shadow-2xs">
                                <Headphones className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{lang === 'mr' ? 'ऑडिओ जोडला' : 'Audio Connected'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full shadow-2xs">
                                <VolumeX className="w-2.5 h-2.5 text-amber-600" />
                                <span>{lang === 'mr' ? 'ऑडिओ नाही' : 'No Audio'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-xs font-semibold text-[#7A6F68] capitalize">{item.type}</td>
                    <td className="py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {item.genres.slice(0, 2).map((g) => (
                          <span key={g} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#2D2522] border border-[#E5DBCA]">
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 font-bold text-[#2D2522]" title={`${item.views || 0} views`}>
                      {formatViews(item.views || 0)}
                    </td>
                    <td className="py-3.5">
                      <span className="text-xs font-bold text-[#EA580C]">{item.isPremium ? t('tierPremium') : t('tierFree')}</span>
                    </td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#EAF5EF] text-[#166534] border border-[#B7E2CD]">
                        {item.status === 'published' ? t('statusPublished') : item.status === 'draft' ? t('statusDraft') : item.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setItemForAudio(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#EA580C] border border-orange-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                          title={lang === 'mr' ? 'या व्हिडिओला ऑडिओ कनेक्ट करा' : 'Connect Audio to Video'}
                        >
                          <Headphones className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{lang === 'mr' ? 'ऑडिओ जोडा' : 'Audio'}</span>
                        </button>

                        {canDelete && (
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-2 rounded-xl text-[#A89C94] hover:text-[#DC2626] hover:bg-[#FEE2E2] border border-transparent hover:border-[#FCA5A5] transition-all inline-flex items-center justify-center group cursor-pointer"
                            title={t('deleteMovie') || 'Delete'}
                          >
                            <Trash2 className="w-4 h-4 text-[#A89C94] group-hover:text-[#DC2626] transition-colors" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={t('deleteMovie')}
        message={itemToDelete ? `${t('deleteConfirmMovie')} (${itemToDelete.title})` : t('deleteConfirmMovie')}
        confirmText={t('deleteMovie')}
        loading={isDeleting}
      />

      {/* Connect Audio Modal */}
      <ConnectAudioModal
        isOpen={!!itemForAudio}
        onClose={() => setItemForAudio(null)}
        item={itemForAudio}
        onAudioUpdated={handleAudioUpdated}
      />
    </div>
  );
}
