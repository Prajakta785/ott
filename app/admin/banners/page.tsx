'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Edit, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Sparkles,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { BunnyUploader } from '@/components/bunny-uploader';
import { firestoreService } from '@/lib/firestore-service';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { Banner, ContentItem } from '@/lib/types';

export default function BannersPage() {
  const { canEdit, canDelete } = useAuth();
  const { t, lang } = useLanguage();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const localizeBanner = (banner?: Partial<Banner> | null) => {
    if (!banner) return { title: '', subtitle: '', badge: '' };
    let title = banner.title || '';
    let subtitle = banner.subtitle || '';
    let badge = banner.badge || '';

    if (lang === 'mr') {
      if (badge === 'Trending #1 Movie' || badge.includes('Trending')) {
        badge = 'ट्रेंडिंग #१ चित्रपट';
      } else if (badge === 'Featured') {
        badge = 'विशेष';
      }
    } else if (lang === 'hi') {
      if (badge === 'Trending #1 Movie' || badge.includes('Trending')) {
        badge = 'ट्रेंडिंग #१ फ़िल्म';
      } else if (badge === 'Featured') {
        badge = 'विशेष';
      }
    }
    return { title, subtitle, badge };
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<Partial<Banner>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [b, c] = await Promise.all([
      firestoreService.getBanners(),
      firestoreService.getContent(),
    ]);
    setBanners(b);
    setContentList(c);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setCurrentBanner({
      id: 'ban-' + Date.now().toString(36),
      title: '',
      subtitle: '',
      imageUrl: '',
      contentId: contentList[0]?.id || '',
      order: banners.length + 1,
      active: true,
      badge: 'Featured',
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setCurrentBanner({ ...banner });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBanner.title?.trim()) {
      alert(t('bannerTitleRequired'));
      return;
    }

    setIsSaving(true);
    try {
      const bannerToSave: Banner = {
        id: currentBanner.id || 'ban-' + Date.now().toString(36),
        title: currentBanner.title.trim(),
        subtitle: currentBanner.subtitle || '',
        imageUrl: currentBanner.imageUrl || '',
        contentId: currentBanner.contentId || '',
        order: Number(currentBanner.order) || 1,
        active: currentBanner.active !== undefined ? currentBanner.active : true,
        badge: currentBanner.badge || 'Featured',
      };

      await firestoreService.saveBanner(bannerToSave);
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Save banner error:', err);
      alert(t('saveBannerError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newBanners = [...banners];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBanners.length) return;

    const temp = newBanners[index].order;
    newBanners[index].order = newBanners[targetIndex].order;
    newBanners[targetIndex].order = temp;

    // Swap
    const swapped = newBanners[index];
    newBanners[index] = newBanners[targetIndex];
    newBanners[targetIndex] = swapped;

    setBanners(newBanners);
    await Promise.all([
      firestoreService.saveBanner(newBanners[index]),
      firestoreService.saveBanner(newBanners[targetIndex]),
    ]);
  };

  const handleToggleActive = async (banner: Banner) => {
    const updated = { ...banner, active: !banner.active };
    await firestoreService.saveBanner(updated);
    loadData();
  };

  const handleDeleteConfirm = async () => {
    if (!bannerToDelete) return;
    await firestoreService.deleteBanner(bannerToDelete.id);
    setBannerToDelete(null);
    loadData();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-[#2D2522] tracking-tight flex items-center gap-2 sm:gap-2.5">
            <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-[#E11D48]" />
            {t('bannersTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6F68] mt-1">
            {t('bannersSubtitle')}
          </p>
        </div>
        {canEdit && (
          <Button variant="primary" onClick={handleOpenCreate} className="gap-2 shadow-sm w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4" /> {t('addHeroBanner')}
          </Button>
        )}
      </div>

      {/* Live Preview Simulator */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#E5DBCA] p-3.5 sm:p-6 shadow-soft space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#2D2522] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F472B6]" /> {t('liveHeroPreviewTitle')}
          </h3>
          <span className="text-[11px] sm:text-xs text-[#7A6F68] font-medium">{t('autoCyclingSubtitle')}</span>
        </div>

        {banners.filter(b => b.active).length > 0 ? (
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E5DBCA] shadow-soft-lg">
            <img
              src={banners.filter(b => b.active)[0]?.imageUrl}
              alt="Hero Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-8">
              {localizeBanner(banners.filter(b => b.active)[0]).badge && (
                <span className="text-[10px] sm:text-xs font-bold text-white bg-[#F472B6] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full w-fit mb-1.5 sm:mb-2 shadow-sm">
                  {localizeBanner(banners.filter(b => b.active)[0]).badge}
                </span>
              )}
              <h2 className="text-lg sm:text-4xl font-black text-white tracking-tight line-clamp-1 sm:line-clamp-none">
                {localizeBanner(banners.filter(b => b.active)[0]).title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-200 max-w-xl mt-1 line-clamp-2">
                {localizeBanner(banners.filter(b => b.active)[0]).subtitle}
              </p>
              <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                <button className="px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-white text-[#2D2522] font-extrabold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-soft hover:bg-[#FAF7F2]">
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#2D2522]" /> {t('watchNow')}
                </button>
                <button className="px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-black/40 backdrop-blur-md text-white font-bold text-xs sm:text-sm border border-white/30 hover:bg-black/60">
                  {t('moreInfo')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-[#7A6F68] text-xs">{t('noActiveBanners')}</div>
        )}
      </div>

      {/* Banners Reorderable List */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#E5DBCA] p-3 sm:p-6 shadow-soft space-y-4">
        <h3 className="text-sm sm:text-base font-extrabold text-[#2D2522]">{t('configuredBannersQueue')} ({banners.length})</h3>

        <div className="space-y-3">
          {banners.map((banner, index) => {
            const linked = contentList.find(c => c.id === banner.contentId);
            const loc = localizeBanner(banner);
            return (
              <React.Fragment key={banner.id}>
                {/* MOBILE VIEW CARD (< 640px) */}
                <div className="sm:hidden flex flex-col gap-3 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA] hover:border-[#F472B6] transition-all shadow-xs">
                  {/* Top Bar: Order & Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 bg-white border border-[#E5DBCA] rounded-xl px-2 py-1 shadow-2xs">
                      <span className="text-[10px] font-bold text-[#7A6F68] uppercase tracking-wider">{lang === 'mr' ? 'क्रम' : 'Order'}:</span>
                      <span className="font-mono text-xs font-black text-[#2D2522]">#{banner.order}</span>
                      <div className="flex items-center gap-0.5 ml-1 border-l border-[#E5DBCA] pl-1">
                        <button
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className="hover:text-[#2D2522] disabled:opacity-20 p-0.5 rounded hover:bg-[#FAF7F2] active:scale-90"
                          title="Move up"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === banners.length - 1}
                          className="hover:text-[#2D2522] disabled:opacity-20 p-0.5 rounded hover:bg-[#FAF7F2] active:scale-90"
                          title="Move down"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {loc.badge && (
                        <Badge variant="sakura" size="sm" className="text-[10px] px-2 py-0.5 font-bold">
                          {loc.badge}
                        </Badge>
                      )}
                      <Badge variant={banner.active ? 'matcha' : 'secondary'} size="sm" className="text-[10px] px-2 py-0.5 font-bold">
                        {banner.active ? t('bannerActive') : t('bannerDisabled')}
                      </Badge>
                    </div>
                  </div>

                  {/* Banner Artwork Preview */}
                  <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#F5EFE6] border border-[#E5DBCA] shadow-2xs relative">
                    <img src={banner.imageUrl} alt={loc.title} className="w-full h-full object-cover" />
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-[#2D2522] text-base leading-tight">
                      {loc.title}
                    </h4>
                    {loc.subtitle && (
                      <p className="text-xs text-[#7A6F68] leading-relaxed line-clamp-2">
                        {loc.subtitle}
                      </p>
                    )}
                    <p className="text-[11px] text-[#A89C94] pt-0.5 truncate">
                      {t('linkedToContent')}: <span className="text-[#BE123C] font-semibold">{linked?.title || banner.contentId}</span>
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-[#E5DBCA]/70">
                    <Button
                      size="sm"
                      variant={banner.active ? 'outline' : 'secondary'}
                      onClick={() => handleToggleActive(banner)}
                      className="text-xs h-8 px-3.5 font-bold cursor-pointer"
                    >
                      {banner.active ? t('deactivateAction') : t('activateAction')}
                    </Button>
                    <div className="flex items-center gap-1.5">
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(banner)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-[#2D2522] bg-white border border-[#E5DBCA] hover:bg-[#FAF7F2] active:scale-95 transition cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-[#7A6F68]" />
                          <span>{lang === 'mr' ? 'संपादन' : 'Edit'}</span>
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setBannerToDelete(banner)}
                          className="p-1.5 rounded-xl text-[#BE123C] bg-red-50 border border-red-200 hover:bg-red-100 active:scale-95 transition cursor-pointer"
                          title={t('deleteBannerTitle')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* DESKTOP VIEW ROW (>= 640px) */}
                <div className="hidden sm:flex sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA] hover:border-[#F472B6] transition-all shadow-xs">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Order handle */}
                    <div className="flex flex-col items-center gap-1 text-[#7A6F68]">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="hover:text-[#2D2522] disabled:opacity-20 p-1"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-xs font-bold text-[#2D2522]">{banner.order}</span>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === banners.length - 1}
                        className="hover:text-[#2D2522] disabled:opacity-20 p-1"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-28 h-16 rounded-xl overflow-hidden bg-[#F5EFE6] border border-[#E5DBCA] shrink-0 shadow-sm">
                      <img src={banner.imageUrl} alt={loc.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#2D2522] text-sm truncate">{loc.title}</h4>
                        {loc.badge && <Badge variant="sakura" size="sm" className="shrink-0">{loc.badge}</Badge>}
                        <Badge variant={banner.active ? 'matcha' : 'secondary'} size="sm" className="shrink-0">
                          {banner.active ? t('bannerActive') : t('bannerDisabled')}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#7A6F68] mt-0.5 line-clamp-1">{loc.subtitle}</p>
                      <p className="text-[11px] text-[#A89C94] mt-1 truncate">
                        {t('linkedToContent')} <span className="text-[#BE123C] font-semibold">{linked?.title || banner.contentId}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant={banner.active ? 'outline' : 'secondary'}
                      onClick={() => handleToggleActive(banner)}
                      className="text-xs h-8"
                    >
                      {banner.active ? t('deactivateAction') : t('activateAction')}
                    </Button>
                    {canEdit && (
                      <button
                        onClick={() => handleOpenEdit(banner)}
                        className="p-2 rounded-full text-[#7A6F68] hover:text-[#2D2522] hover:bg-white"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setBannerToDelete(banner)}
                        className="p-2 rounded-full text-[#7A6F68] hover:text-[#BE123C] hover:bg-[#FEE2E2]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* CREATE / EDIT BANNER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? t('editHeroBanner') : t('createHeroBanner')}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1">{t('bannerTitleLabel')}</label>
            <input
              type="text"
              required
              value={currentBanner.title || ''}
              onChange={(e) => setCurrentBanner({ ...currentBanner, title: e.target.value })}
              className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1">{t('bannerSubtitleLabel')}</label>
            <input
              type="text"
              value={currentBanner.subtitle || ''}
              onChange={(e) => setCurrentBanner({ ...currentBanner, subtitle: e.target.value })}
              className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1">{t('badgePillLabel')}</label>
              <input
                type="text"
                value={currentBanner.badge || ''}
                onChange={(e) => setCurrentBanner({ ...currentBanner, badge: e.target.value })}
                placeholder={t('badgePillPlaceholder')}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1">{t('linkedContentLabel')}</label>
              <select
                value={currentBanner.contentId || ''}
                onChange={(e) => setCurrentBanner({ ...currentBanner, contentId: e.target.value })}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6]"
              >
                {contentList.map(c => (
                  <option key={c.id} value={c.id}>
                    [{c.type.toUpperCase()}] {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <BunnyUploader
            type="image"
            currentValue={currentBanner.imageUrl}
            label={t('bannerArtworkLabel')}
            onUploadComplete={(res) => setCurrentBanner({ ...currentBanner, imageUrl: res.urlOrGuid })}
          />

          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA]">
            <label className="flex items-center gap-2 text-xs font-bold text-[#2D2522] cursor-pointer">
              <input
                type="checkbox"
                checked={currentBanner.active}
                onChange={(e) => setCurrentBanner({ ...currentBanner, active: e.target.checked })}
                className="rounded-full text-[#E11D48] focus:ring-[#F472B6]"
              />
              {t('showInCarouselLabel')}
            </label>
          </div>

          <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-4 pb-1 border-t border-[#E5DBCA] -mx-1 px-1 flex items-center justify-end gap-3 z-10">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>{t('cancelBtn')}</Button>
            <Button type="submit" variant="primary" loading={isSaving}>{t('saveBannerBtn')}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!bannerToDelete}
        onClose={() => setBannerToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={t('deleteBannerTitle')}
        message={bannerToDelete ? `${t('deleteBannerMsg')} "${bannerToDelete.title}"?` : ''}
      />
    </div>
  );
}
