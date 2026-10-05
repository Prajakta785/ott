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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2D2522] tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-[#E11D48]" />
            {t('bannersTitle')}
          </h1>
          <p className="text-sm text-[#7A6F68] mt-1">
            {t('bannersSubtitle')}
          </p>
        </div>
        {canEdit && (
          <Button variant="primary" onClick={handleOpenCreate} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> {t('addHeroBanner')}
          </Button>
        )}
      </div>

      {/* Live Preview Simulator */}
      <div className="rounded-3xl bg-white border border-[#E5DBCA] p-6 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#2D2522] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F472B6]" /> {t('liveHeroPreviewTitle')}
          </h3>
          <span className="text-xs text-[#7A6F68] font-medium">{t('autoCyclingSubtitle')}</span>
        </div>

        {banners.filter(b => b.active).length > 0 ? (
          <div className="relative aspect-[21/9] w-full rounded-3xl overflow-hidden border border-[#E5DBCA] shadow-soft-lg">
            <img
              src={banners.filter(b => b.active)[0]?.imageUrl}
              alt="Hero Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-8">
              {localizeBanner(banners.filter(b => b.active)[0]).badge && (
                <span className="text-xs font-bold text-white bg-[#F472B6] px-3 py-1 rounded-full w-fit mb-2 shadow-sm">
                  {localizeBanner(banners.filter(b => b.active)[0]).badge}
                </span>
              )}
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {localizeBanner(banners.filter(b => b.active)[0]).title}
              </h2>
              <p className="text-sm text-zinc-200 max-w-xl mt-1">
                {localizeBanner(banners.filter(b => b.active)[0]).subtitle}
              </p>
              <div className="flex items-center gap-3 mt-4">
                <button className="px-5 py-2.5 rounded-full bg-white text-[#2D2522] font-extrabold text-sm flex items-center gap-2 shadow-soft hover:bg-[#FAF7F2]">
                  <Play className="w-4 h-4 fill-[#2D2522]" /> {t('watchNow')}
                </button>
                <button className="px-5 py-2.5 rounded-full bg-black/40 backdrop-blur-md text-white font-bold text-sm border border-white/30 hover:bg-black/60">
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
      <div className="rounded-3xl bg-white border border-[#E5DBCA] p-6 shadow-soft space-y-4">
        <h3 className="text-base font-extrabold text-[#2D2522]">{t('configuredBannersQueue')} ({banners.length})</h3>

        <div className="space-y-3">
          {banners.map((banner, index) => {
            const linked = contentList.find(c => c.id === banner.contentId);
            const loc = localizeBanner(banner);
            return (
              <div
                key={banner.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA] hover:border-[#F472B6] transition-colors"
              >
                <div className="flex items-center gap-4">
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

                  <div className="w-24 h-14 rounded-xl overflow-hidden bg-[#F5EFE6] border border-[#E5DBCA] shrink-0 shadow-sm">
                    <img src={banner.imageUrl} alt={loc.title} className="w-full h-full object-cover" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#2D2522] text-sm">{loc.title}</h4>
                      {loc.badge && <Badge variant="sakura" size="sm">{loc.badge}</Badge>}
                      <Badge variant={banner.active ? 'matcha' : 'secondary'} size="sm">
                        {banner.active ? t('bannerActive') : t('bannerDisabled')}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#7A6F68] mt-0.5 line-clamp-1">{loc.subtitle}</p>
                    <p className="text-[11px] text-[#A89C94] mt-1">
                      {t('linkedToContent')} <span className="text-[#BE123C] font-semibold">{linked?.title || banner.contentId}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
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
