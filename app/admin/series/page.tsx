'use client';

import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Plus, 
  Search, 
  ChevronRight, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Lock, 
  Unlock, 
  Layers, 
  Play,
  Film,
  X,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { BunnyUploader } from '@/components/bunny-uploader';
import { VideoPlayer } from '@/components/video-player';
import { firestoreService } from '@/lib/firestore-service';
import { ContentItem, Season, Episode } from '@/lib/types';
import { formatDuration, formatViews, slugify } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { getSafeImageUrl, handleImageError, DEFAULT_SERIES_POSTER } from '@/lib/image-utils';

export default function SeriesPage() {
  const { canEdit, canPublish, canDelete } = useAuth();
  const { t, lang } = useLanguage();
  const [seriesList, setSeriesList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Drill-down navigation state
  const [selectedSeries, setSelectedSeries] = useState<ContentItem | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  // Series Modal
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [currentSeries, setCurrentSeries] = useState<Partial<ContentItem>>({});
  const [isEditingSeries, setIsEditingSeries] = useState(false);

  // Season Modal
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [currentSeason, setCurrentSeason] = useState<Partial<Season>>({});
  const [isEditingSeason, setIsEditingSeason] = useState(false);

  // Episode Modal
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<Partial<Episode>>({});
  const [isEditingEpisode, setIsEditingEpisode] = useState(false);

  // Video Preview Modal State
  const [previewVideo, setPreviewVideo] = useState<{
    url: string;
    title: string;
    poster?: string;
  } | null>(null);

  // Saving State
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'series' | 'season' | 'episode';
    item: any;
  } | null>(null);

  const loadSeries = async () => {
    setLoading(true);
    const items = await firestoreService.getContent('series');
    setSeriesList(items);
    setLoading(false);
  };

  useEffect(() => {
    loadSeries();
  }, []);

  const handleSelectSeries = async (series: ContentItem) => {
    setSelectedSeries(series);
    const loadedSeasons = await firestoreService.getSeasons(series.id);
    setSeasons(loadedSeasons);
    if (loadedSeasons.length > 0) {
      handleSelectSeason(series.id, loadedSeasons[0]);
    } else {
      setSelectedSeason(null);
      setEpisodes([]);
    }
  };

  const handleSelectSeason = async (seriesId: string, season: Season) => {
    setSelectedSeason(season);
    const loadedEpisodes = await firestoreService.getEpisodes(seriesId, season.id);
    setEpisodes(loadedEpisodes);
  };

  const handleOpenCreateSeries = () => {
    setCurrentSeries({
      id: 'ser-' + Date.now().toString(36),
      type: 'series',
      title: '',
      slug: '',
      description: '',
      tags: ['ग्रामीण कथा', 'Web Series', 'OTT'],
      genres: ['ग्रामीण कथा', 'Web Series'],
      cast: [],
      director: '',
      language: ['मराठी'],
      releaseDate: new Date().toISOString().split('T')[0],
      poster: '',
      banner: '',
      videoId: '',
      trailerUrl: '',
      duration: 0,
      videoStatus: 'ready',
      resolution: '4K UHD HDR',
      isPremium: false,
      isFeatured: true,
      status: 'published',
      rating: 'All',
      imdbScore: 0,
      views: 0,
    });
    setIsEditingSeries(false);
    setIsSeriesModalOpen(true);
  };

  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSeries.title?.trim()) {
      alert(lang === 'mr' ? 'कृपया मालिकेचे नाव प्रविष्ट करा' : 'Please enter a series title');
      return;
    }

    setIsSaving(true);
    try {
      const seriesToSave: ContentItem = {
        id: currentSeries.id || 'ser-' + Date.now().toString(36),
        type: 'series',
        title: currentSeries.title.trim(),
        slug: currentSeries.slug || slugify(currentSeries.title.trim()),
        description: currentSeries.description || '',
        tags: currentSeries.tags || ['ग्रामीण कथा', 'Web Series'],
        genres: currentSeries.genres || ['ग्रामीण कथा', 'Web Series'],
        cast: currentSeries.cast || [],
        director: currentSeries.director || '',
        language: currentSeries.language || ['मराठी'],
        releaseDate: currentSeries.releaseDate || new Date().toISOString().split('T')[0],
        poster: currentSeries.poster || '',
        banner: currentSeries.banner || currentSeries.poster || '',
        videoId: currentSeries.videoId || '',
        trailerUrl: currentSeries.trailerUrl || '',
        duration: Number(currentSeries.duration) || 0,
        videoStatus: currentSeries.videoId ? 'ready' : (currentSeries.videoStatus || 'ready'),
        resolution: currentSeries.resolution || '4K UHD HDR',
        isPremium: currentSeries.isPremium ?? false,
        isFeatured: currentSeries.isFeatured ?? true,
        status: currentSeries.status || 'published',
        rating: currentSeries.rating || 'All',
        imdbScore: Number(currentSeries.imdbScore) || 0,
        views: currentSeries.views || 0,
        createdAt: currentSeries.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await firestoreService.saveContent(seriesToSave);
      setIsSeriesModalOpen(false);
      await loadSeries();
      if (selectedSeries && selectedSeries.id === seriesToSave.id) {
        setSelectedSeries(seriesToSave);
      }
    } catch (err) {
      console.error('Save series error:', err);
      alert(lang === 'mr' ? 'मालिका जतन करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.' : 'Could not save series. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCreateSeason = () => {
    if (!selectedSeries) return;
    const nextSeasonNum = (seasons.length > 0 ? Math.max(...seasons.map(s => s.seasonNumber)) : 0) + 1;
    setCurrentSeason({
      id: `seas-${selectedSeries.slug || selectedSeries.id}-s${nextSeasonNum}`,
      contentId: selectedSeries.id,
      seasonNumber: nextSeasonNum,
      title: `Season ${nextSeasonNum}`,
      poster: selectedSeries.poster,
      overview: '',
      releaseDate: new Date().toISOString().split('T')[0],
      episodeCount: 0,
    });
    setIsEditingSeason(false);
    setIsSeasonModalOpen(true);
  };

  const handleSaveSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeries || !currentSeason.title?.trim()) {
      alert('Please enter a season title');
      return;
    }

    setIsSaving(true);
    try {
      const seasonToSave: Season = {
        id: currentSeason.id || `seas-${Date.now().toString(36)}`,
        contentId: selectedSeries.id,
        seriesId: selectedSeries.id,
        seasonNumber: Number(currentSeason.seasonNumber) || 1,
        title: currentSeason.title.trim(),
        poster: currentSeason.poster || selectedSeries.poster,
        overview: currentSeason.overview || '',
        releaseDate: currentSeason.releaseDate || new Date().toISOString().split('T')[0],
        episodeCount: currentSeason.episodeCount || 0,
        createdAt: currentSeason.createdAt || new Date().toISOString(),
      };

      await firestoreService.saveSeason(seasonToSave);
      setIsSeasonModalOpen(false);
      const updatedSeasons = await firestoreService.getSeasons(selectedSeries.id);
      setSeasons(updatedSeasons);
      setSelectedSeason(seasonToSave);
    } catch (err) {
      console.error('Save season error:', err);
      alert('Could not save season. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCreateEpisode = () => {
    if (!selectedSeries || !selectedSeason) return;
    const nextEpNum = (episodes.length > 0 ? Math.max(...episodes.map(e => e.episodeNumber)) : 0) + 1;

    setCurrentEpisode({
      id: `ep-${selectedSeries.slug}-s${selectedSeason.seasonNumber}-e${nextEpNum}`,
      seasonId: selectedSeason.id,
      contentId: selectedSeries.id,
      seriesId: selectedSeries.id,
      episodeNumber: nextEpNum,
      title: `Episode ${nextEpNum}`,
      description: '',
      videoId: '',
      duration: 3000,
      thumbnail: selectedSeason.poster || selectedSeries.poster,
      isFreePreview: nextEpNum === 1,
      videoStatus: 'ready',
      resolution: '4K UHD HDR',
    });
    setIsEditingEpisode(false);
    setIsEpisodeModalOpen(true);
  };

  const handleSaveEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeries || !selectedSeason || !currentEpisode.title?.trim()) {
      alert('Please enter an episode title');
      return;
    }

    setIsSaving(true);
    try {
      const epToSave: Episode = {
        id: currentEpisode.id || `ep-${Date.now().toString(36)}`,
        seasonId: selectedSeason.id,
        contentId: selectedSeries.id,
        seriesId: selectedSeries.id,
        episodeNumber: Number(currentEpisode.episodeNumber) || 1,
        title: currentEpisode.title.trim(),
        description: currentEpisode.description || '',
        videoId: currentEpisode.videoId || '',
        duration: Number(currentEpisode.duration) || 3000,
        thumbnail: currentEpisode.thumbnail || selectedSeason.poster || selectedSeries.poster,
        isFreePreview: !!currentEpisode.isFreePreview,
        videoStatus: currentEpisode.videoStatus || 'ready',
        resolution: currentEpisode.resolution || '4K UHD',
        createdAt: currentEpisode.createdAt || new Date().toISOString(),
      };

      await firestoreService.saveEpisode(epToSave);
      setIsEpisodeModalOpen(false);
      const updatedEpisodes = await firestoreService.getEpisodes(selectedSeries.id, selectedSeason.id);
      setEpisodes(updatedEpisodes);
    } catch (err) {
      console.error('Save episode error:', err);
      alert('Could not save episode. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'series') {
      await firestoreService.deleteContent(deleteTarget.item.id);
      setSelectedSeries(null);
      loadSeries();
    } else if (deleteTarget.type === 'season' && selectedSeries) {
      await firestoreService.deleteSeason(selectedSeries.id, deleteTarget.item.id);
      const updatedSeasons = await firestoreService.getSeasons(selectedSeries.id);
      setSeasons(updatedSeasons);
      if (updatedSeasons.length > 0) {
        handleSelectSeason(selectedSeries.id, updatedSeasons[0]);
      } else {
        setSelectedSeason(null);
        setEpisodes([]);
      }
    } else if (deleteTarget.type === 'episode' && selectedSeries && selectedSeason) {
      await firestoreService.deleteEpisode(selectedSeries.id, selectedSeason.id, deleteTarget.item.id);
      const updatedEpisodes = await firestoreService.getEpisodes(selectedSeries.id, selectedSeason.id);
      setEpisodes(updatedEpisodes);
    }

    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#7A6F68] mb-1">
            <span
              onClick={() => { setSelectedSeries(null); setSelectedSeason(null); }}
              className="hover:text-[#2D2522] cursor-pointer transition-colors"
            >
              {t('navSeries')}
            </span>
            {selectedSeries && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span
                  onClick={() => setSelectedSeason(null)}
                  className="hover:text-[#2D2522] cursor-pointer text-[#2D2522] truncate max-w-[160px]"
                >
                  {selectedSeries.title}
                </span>
              </>
            )}
            {selectedSeason && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#BE123C] font-black">
                  {selectedSeason.title}
                </span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#2D2522] tracking-tight flex items-center gap-2.5">
            <Tv className="w-7 h-7 text-[#E07A5F]" />
            {selectedSeries ? selectedSeries.title : t('pageTitleSeries')}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {selectedSeries && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setSelectedSeries(null); setSelectedSeason(null); }}
              className="gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> {lang === 'mr' ? 'सर्व मालिका' : lang === 'hi' ? 'सभी सीरीज़' : 'All Series'}
            </Button>
          )}

          {canEdit && (
            <Button
              variant="primary"
              onClick={selectedSeason ? handleOpenCreateEpisode : selectedSeries ? handleOpenCreateSeason : handleOpenCreateSeries}
              className="gap-2 shadow-glow-sakura"
            >
              <Plus className="w-4 h-4" />
              {selectedSeason 
                ? (lang === 'mr' ? 'नवीन भाग जोडा' : lang === 'hi' ? 'नया एपिसोड जोड़ें' : 'Upload Episode') 
                : selectedSeries 
                ? (lang === 'mr' ? 'नवीन सीझन जोडा' : lang === 'hi' ? 'नया सीज़न जोड़ें' : 'Add Season') 
                : (lang === 'mr' ? 'नवीन वेब मालिका' : lang === 'hi' ? 'नई वेब सीरीज़' : 'New Web Series')}
            </Button>
          )}
        </div>
      </div>

      {/* VIEW 1: All Web Series Cards */}
      {!selectedSeries ? (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white border border-[#E5DBCA] p-4 flex items-center justify-between shadow-soft">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[#7A6F68] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={lang === 'mr' ? 'मालिकेच्या नावाने शोधा...' : lang === 'hi' ? 'सीरीज़ के नाम से खोजें...' : 'Search web series by title...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-full pl-11 pr-4 py-2 text-xs text-[#2D2522] placeholder-[#A89C94] focus:outline-none focus:border-[#F472B6] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {seriesList
              .filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((series) => (
                <div
                  key={series.id}
                  onClick={() => handleSelectSeries(series)}
                  className="group rounded-3xl bg-white border border-[#E5DBCA] overflow-hidden hover:border-[#E07A5F] hover:shadow-soft-lg transition-all duration-300 cursor-pointer flex flex-col shadow-soft"
                >
                  <div className="relative aspect-[16/9] w-full bg-[#F5EFE6] overflow-hidden">
                    <img
                      src={getSafeImageUrl(series.banner || series.poster, DEFAULT_SERIES_POSTER)}
                      alt={series.title}
                      onError={(e) => handleImageError(e, DEFAULT_SERIES_POSTER)}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2D2522]/80 via-transparent to-black/30" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <Badge variant={series.isPremium ? 'sakura' : 'secondary'} size="sm">
                        {series.isPremium ? t('tierPremium') : t('tierFree')}
                      </Badge>
                      <span className="text-xs font-black text-[#D97706] bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-sm">
                        ★ {series.imdbScore}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                      <span className="font-bold">{series.releaseDate?.substring(0, 4)}</span>
                      <span className="flex items-center gap-1 text-[#FDBA74] font-bold group-hover:translate-x-1 transition-transform">
                        {lang === 'mr' ? 'सीझन व भाग व्यवस्थापित करा' : lang === 'hi' ? 'सीज़न और एपिसोड प्रबंधित करें' : 'Manage Seasons & Episodes'} <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-extrabold text-[#2D2522] text-lg group-hover:text-[#BE123C] transition-colors">
                        {series.title}
                      </h3>
                      <p className="text-xs text-[#7A6F68] mt-1 line-clamp-2">
                        {series.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#E5DBCA] text-xs">
                      <span className="text-[#A89C94] font-medium">{formatViews(series.views)} views</span>
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentSeries(series);
                              setIsEditingSeries(true);
                              setIsSeriesModalOpen(true);
                            }}
                            className="p-1.5 rounded-full text-[#7A6F68] hover:text-[#2D2522] hover:bg-[#F5EFE6]"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({ type: 'series', item: series });
                            }}
                            className="p-1.5 rounded-full text-[#7A6F68] hover:text-[#BE123C] hover:bg-[#FEE2E2]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        /* VIEW 2: Series Nested Drilldown (Seasons & Episodes) */
        <div className="space-y-8">
          {/* Series Hero Banner Card */}
          <div className="relative rounded-3xl bg-white border border-[#E5DBCA] p-6 shadow-soft flex flex-col md:flex-row gap-6 items-start">
            <div className="w-32 h-44 rounded-2xl overflow-hidden bg-[#F5EFE6] shrink-0 border border-[#E5DBCA] shadow-md">
              <img 
                src={getSafeImageUrl(selectedSeries.poster || selectedSeries.banner, DEFAULT_SERIES_POSTER)} 
                alt={selectedSeries.title} 
                onError={(e) => handleImageError(e, DEFAULT_SERIES_POSTER)}
                className="w-full h-full object-cover" 
              />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="sakura" size="sm">{lang === 'mr' ? 'वेब मालिका' : lang === 'hi' ? 'वेब सीरीज़' : 'Web Series'}</Badge>
                <Badge variant={selectedSeries.status === 'published' ? 'matcha' : 'secondary'} size="sm">
                  {selectedSeries.status === 'published' ? (lang === 'mr' ? 'प्रकाशित' : lang === 'hi' ? 'प्रकाशित' : 'Published') : selectedSeries.status}
                </Badge>
                <span className="text-xs text-[#7A6F68]">{lang === 'mr' ? 'वय मर्यादा:' : lang === 'hi' ? 'आयु सीमा:' : 'Rating:'} {selectedSeries.rating}</span>
                <span className="text-xs text-[#D97706] font-bold">★ {selectedSeries.imdbScore}</span>
              </div>

              <h2 className="text-2xl font-black text-[#2D2522]">{selectedSeries.title}</h2>
              <p className="text-sm text-[#6E6259] max-w-3xl leading-relaxed">{selectedSeries.description}</p>

              <div className="flex flex-wrap gap-4 text-xs text-[#7A6F68] pt-2 border-t border-[#E5DBCA]">
                <div><span className="font-bold text-[#2D2522]">{lang === 'mr' ? 'दिग्दर्शक:' : lang === 'hi' ? 'निर्देशक:' : 'Director:'}</span> {selectedSeries.director || 'N/A'}</div>
                <div><span className="font-bold text-[#2D2522]">{lang === 'mr' ? 'कलाकार:' : lang === 'hi' ? 'कलाकार:' : 'Cast:'}</span> {selectedSeries.cast.join(', ') || 'N/A'}</div>
                <div><span className="font-bold text-[#2D2522]">{lang === 'mr' ? 'भाषा:' : lang === 'hi' ? 'भाषा:' : 'Languages:'}</span> {selectedSeries.language.join(', ')}</div>
              </div>

              {/* Series Video Action Buttons */}
              <div className="pt-2 flex items-center gap-3 flex-wrap">
                {(selectedSeries.videoId || selectedSeries.trailerUrl) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setPreviewVideo({
                        url: selectedSeries.videoId || selectedSeries.trailerUrl!,
                        title: `${selectedSeries.title} - ${selectedSeries.videoId ? 'Video' : 'Trailer'}`,
                        poster: selectedSeries.banner || selectedSeries.poster,
                      });
                    }}
                    className="gap-2 font-bold shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {lang === 'mr' ? 'व्हिडिओ / ट्रेलर प्ले करा' : lang === 'hi' ? 'वीडियो / ट्रेलर चलाएं' : 'Play Video / Trailer'}
                  </Button>
                )}
                {selectedSeries.videoId && selectedSeries.trailerUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPreviewVideo({
                        url: selectedSeries.trailerUrl!,
                        title: `${selectedSeries.title} - Trailer`,
                        poster: selectedSeries.banner || selectedSeries.poster,
                      });
                    }}
                    className="border-[#EA580C] text-[#EA580C] hover:bg-[#FFF7ED] gap-1.5 font-bold"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {lang === 'mr' ? 'ट्रेलर' : 'Trailer'}
                  </Button>
                )}
                {canEdit && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setCurrentSeries(selectedSeries);
                      setIsEditingSeries(true);
                      setIsSeriesModalOpen(true);
                    }}
                    className="gap-1.5 font-bold"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    {lang === 'mr' ? 'मालिकेत बदल करा' : lang === 'hi' ? 'सीरीज़ संपादित करें' : 'Edit Series'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Season Selector Tabs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DBCA] pb-3">
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                {seasons.map((season) => (
                  <button
                    key={season.id}
                    onClick={() => handleSelectSeason(selectedSeries.id, season)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 shadow-soft ${
                      selectedSeason?.id === season.id
                        ? 'bg-gradient-to-r from-[#F472B6] to-[#E07A5F] text-white shadow-glow-sakura'
                        : 'bg-white border border-[#E5DBCA] text-[#6E6259] hover:text-[#2D2522] hover:bg-[#F5EFE6]'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>{season.title}</span>
                  </button>
                ))}
              </div>

              {canEdit && (
                <Button variant="primary" size="sm" onClick={handleOpenCreateSeason} className="gap-1.5 shadow-sm">
                  <Plus className="w-3.5 h-3.5" /> {lang === 'mr' ? 'नवीन सीझन' : lang === 'hi' ? 'नया सीज़न' : 'New Season'}
                </Button>
              )}
            </div>

            {/* Episodes List for Selected Season */}
            {selectedSeason ? (
              <div className="rounded-3xl bg-white border border-[#E5DBCA] p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[#2D2522] flex items-center gap-2">
                      {selectedSeason.title} — {lang === 'mr' ? 'भाग' : lang === 'hi' ? 'एपिसोड' : 'Episodes'} ({episodes.length})
                    </h3>
                    <p className="text-xs text-[#7A6F68]">{selectedSeason.overview || (lang === 'mr' ? 'व्हिडिओ अपलोड, थंबनेल व मोफत पूर्वावलोकन व्यवस्थापित करा.' : lang === 'hi' ? 'वीडियो अपलोड, थंबनेल और मुफ़्त पूर्वावलोकन प्रबंधित करें।' : 'Manage episode video uploads, thumbnails and free preview flags.')}</p>
                  </div>
                  {canEdit && (
                    <Button variant="primary" size="sm" onClick={handleOpenCreateEpisode} className="gap-2 shadow-sm">
                      <Plus className="w-4 h-4" /> {lang === 'mr' ? 'नवीन भाग जोडा' : lang === 'hi' ? 'नया एपिसोड जोड़ें' : 'Add Episode'}
                    </Button>
                  )}
                </div>

                {/* Episodes Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-wider text-[#7A6F68] border-b border-[#E5DBCA]">
                      <tr>
                        <th className="pb-3 font-bold w-16">{lang === 'mr' ? 'भाग #' : lang === 'hi' ? 'एपिसोड #' : 'Ep #'}</th>
                        <th className="pb-3 font-bold">{lang === 'mr' ? 'थंबनेल आणि शीर्षक' : lang === 'hi' ? 'थंबनेल और शीर्षक' : 'Thumbnail & Title'}</th>
                        <th className="pb-3 font-bold">{lang === 'mr' ? 'कालावधी' : lang === 'hi' ? 'अवधि' : 'Duration'}</th>
                        <th className="pb-3 font-bold">Bunny Video GUID</th>
                        <th className="pb-3 font-bold">{lang === 'mr' ? 'प्रवेश' : lang === 'hi' ? 'प्रवेश' : 'Preview Access'}</th>
                        <th className="pb-3 font-bold">{lang === 'mr' ? 'स्थिती' : lang === 'hi' ? 'स्थिति' : 'Encoding Status'}</th>
                        <th className="pb-3 font-bold text-right">{lang === 'mr' ? 'कृती' : lang === 'hi' ? 'कार्रवाई' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5DBCA]/60">
                      {episodes.map((ep) => (
                        <tr key={ep.id} className="hover:bg-[#FAF7F2] transition-colors">
                          <td className="py-3.5 font-bold text-[#7A6F68] text-center">
                            {ep.episodeNumber}
                          </td>
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-3">
                              <div 
                                onClick={() => {
                                  if (ep.videoId) {
                                    setPreviewVideo({
                                      url: ep.videoId,
                                      title: `${selectedSeries?.title} - Ep ${ep.episodeNumber}: ${ep.title}`,
                                      poster: ep.thumbnail,
                                    });
                                  }
                                }}
                                className={`w-16 h-10 rounded-xl overflow-hidden bg-[#F5EFE6] shrink-0 border border-[#E5DBCA] relative shadow-sm ${ep.videoId ? 'cursor-pointer hover:ring-2 hover:ring-[#EA580C]' : ''}`}
                              >
                                <img 
                                  src={getSafeImageUrl(ep.thumbnail || (ep.videoId ? `/api/bunny/thumbnail?videoId=${ep.videoId}` : ''), DEFAULT_SERIES_POSTER)} 
                                  alt={ep.title} 
                                  onError={(e) => handleImageError(e, DEFAULT_SERIES_POSTER)}
                                  className="w-full h-full object-cover" 
                                />
                                <div className="absolute inset-0 bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors">
                                  <Play className="w-3.5 h-3.5 text-white fill-white" />
                                </div>
                              </div>
                              <div>
                                <p className="font-bold text-[#2D2522]">{ep.title}</p>
                                <p className="text-xs text-[#7A6F68] line-clamp-1 max-w-md">{ep.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 font-mono text-xs text-[#2D2522] font-bold">
                            {formatDuration(ep.duration)}
                          </td>
                          <td className="py-3.5 font-mono text-xs text-[#7A6F68]">
                            {ep.videoId || 'Pending upload'}
                          </td>
                          <td className="py-3.5">
                            {ep.isFreePreview ? (
                              <Badge variant="matcha" size="sm" className="gap-1">
                                <Unlock className="w-3 h-3" /> {lang === 'mr' ? 'मोफत पूर्वावलोकन' : lang === 'hi' ? 'मुफ़्त पूर्वावलोकन' : 'Free Preview'}
                              </Badge>
                            ) : (
                              <Badge variant="sakura" size="sm" className="gap-1">
                                <Lock className="w-3 h-3" /> {lang === 'mr' ? 'केवळ सदस्यांसाठी' : lang === 'hi' ? 'केवल सदस्यों के लिए' : 'Subscribers Only'}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3.5">
                            <Badge variant="matcha" size="sm">
                              {ep.videoStatus || (lang === 'mr' ? 'तयार' : lang === 'hi' ? 'तैयार' : 'Ready')}
                            </Badge>
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canEdit && (
                                <button
                                  onClick={() => {
                                    setCurrentEpisode(ep);
                                    setIsEditingEpisode(true);
                                    setIsEpisodeModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-full text-[#7A6F68] hover:text-[#2D2522] hover:bg-[#F5EFE6]"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => setDeleteTarget({ type: 'episode', item: ep })}
                                  className="p-1.5 rounded-full text-[#7A6F68] hover:text-[#BE123C] hover:bg-[#FEE2E2]"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-[#E5DBCA] rounded-3xl bg-white">
                <Layers className="w-10 h-10 text-[#A89C94] mx-auto mb-3" />
                <p className="text-[#2D2522] font-bold">
                  {lang === 'mr' ? 'अद्याप कोणतेही सीझन तयार केलेले नाहीत.' : lang === 'hi' ? 'अभी तक कोई सीज़न नहीं बनाया गया है।' : 'No seasons created yet.'}
                </p>
                <p className="text-xs text-[#7A6F68] mt-1">
                  {lang === 'mr' ? 'भाग अपलोड करण्यासाठी सीझन १ जोडा.' : lang === 'hi' ? 'एपिसोड अपलोड करने के लिए सीज़न १ जोड़ें।' : 'Create Season 1 to start uploading episodes.'}
                </p>
                <Button size="sm" variant="primary" onClick={handleOpenCreateSeason} className="mt-4">
                  {lang === 'mr' ? 'सीझन १ जोडा' : lang === 'hi' ? 'सीज़न १ जोड़ें' : 'Add Season 1'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT SERIES MODAL */}
      <Modal
        isOpen={isSeriesModalOpen}
        onClose={() => setIsSeriesModalOpen(false)}
        title={isEditingSeries ? (lang === 'mr' ? 'वेब मालिका संपादित करा' : lang === 'hi' ? 'वेब सीरीज़ संपादित करें' : 'Edit Web Series') : (lang === 'mr' ? 'नवीन वेब मालिका जोडा' : lang === 'hi' ? 'नई वेब सीरीज़ जोड़ें' : 'Create New Web Series')}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveSeries} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1">
              {lang === 'mr' ? 'मालिकेचे नाव *' : lang === 'hi' ? 'सीरीज़ का नाम *' : 'Series Title *'}
            </label>
            <input
              type="text"
              required
              value={currentSeries.title || ''}
              onChange={(e) => setCurrentSeries({ ...currentSeries, title: e.target.value, slug: slugify(e.target.value) })}
              placeholder={lang === 'mr' ? 'उदा. गावाकडच्या गोष्टी' : lang === 'hi' ? 'उदा. गांव की कहानियां' : 'e.g. Village Stories'}
              className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2 text-sm text-[#2D2522] focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1">
              {lang === 'mr' ? 'कथासार / सारांश' : lang === 'hi' ? 'कथासार / विवरण' : 'Synopsis'}
            </label>
            <textarea
              rows={3}
              value={currentSeries.description || ''}
              onChange={(e) => setCurrentSeries({ ...currentSeries, description: e.target.value })}
              placeholder={lang === 'mr' ? 'मालिकेचा कथासार आणि थोडक्यात माहिती...' : 'Series synopsis and summary...'}
              className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2 text-sm text-[#2D2522] focus:outline-none focus:border-[#EA580C] resize-none"
            />
          </div>

          {/* Video Direct Upload to Bunny Stream for Web Series */}
          <div className="p-4 rounded-3xl bg-[#FAF7F2] border border-[#E5DBCA] space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#2D2522] flex items-center gap-2">
                <Film className="w-4 h-4 text-[#EA580C]" /> {lang === 'mr' ? 'व्हिडिओ / पायलट फाईल अपलोड (Bunny Stream)' : lang === 'hi' ? 'वीडियो / पायलट फ़ाइल अपलोड (Bunny Stream)' : 'Web Series Video / Pilot Stream'}
              </h4>
              <div className="flex items-center gap-1.5 text-[10px] text-[#7A6F68] font-bold">
                <span className="px-2 py-0.5 rounded-full bg-white border border-[#E5DBCA]">Lib: 767488</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">ABR 4K/HD</span>
              </div>
            </div>

            <BunnyUploader
              type="video"
              currentValue={currentSeries.videoId}
              label={lang === 'mr' ? 'वेब मालिका मुख्य व्हिडिओ / पायलट फाईल' : lang === 'hi' ? 'वेब सीरीज़ मुख्य वीडियो / पायलट फ़ाइल' : 'Web Series Main Video / Pilot File'}
              onUploadComplete={(res) => {
                setCurrentSeries({
                  ...currentSeries,
                  videoId: res.urlOrGuid,
                  duration: res.duration || currentSeries.duration,
                  resolution: res.resolution || currentSeries.resolution,
                  videoStatus: 'ready',
                });
              }}
            />

            {/* Direct Video ID / URL Input with Test Preview */}
            <div className="pt-2 border-t border-[#E5DBCA]/60 space-y-1.5">
              <label className="text-[11px] font-bold text-[#7A6F68] block">
                {lang === 'mr' ? 'व्हिडिओ ID / Bunny Video GUID / थेट Stream URL' : lang === 'hi' ? 'वीडियो ID / Bunny Video GUID / डायरेक्ट Stream URL' : 'Bunny Video GUID, Embed Code or Direct Stream URL'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentSeries.videoId || ''}
                  onChange={(e) => {
                    const rawVal = e.target.value.trim();
                    const iframeMatch = rawVal.match(/src=["']([^"']+)["']/i);
                    setCurrentSeries({ ...currentSeries, videoId: iframeMatch ? iframeMatch[1] : e.target.value });
                  }}
                  placeholder="e.g. 767488-guid, https://iframe.mediadelivery.net/embed/..., or .m3u8/.mp4"
                  className="flex-1 bg-white border border-[#E5DBCA] rounded-2xl px-4 py-2 text-xs font-mono text-[#2D2522] focus:outline-none focus:border-[#EA580C]"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!currentSeries.videoId) {
                      alert(lang === 'mr' ? 'कृपया आधी Video ID किंवा URL प्रविष्ट करा.' : 'Please enter Video ID or URL first.');
                      return;
                    }
                    setPreviewVideo({
                      url: currentSeries.videoId,
                      title: currentSeries.title || 'Web Series Video Preview',
                      poster: currentSeries.poster || currentSeries.banner,
                    });
                  }}
                  className="shrink-0 text-xs flex items-center gap-1.5 border-[#EA580C] text-[#EA580C] hover:bg-[#FFF7ED]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {lang === 'mr' ? 'तपासा' : lang === 'hi' ? 'टेस्ट करें' : 'Test Play'}
                </Button>
              </div>
              <p className="text-[10px] text-[#A89C94]">
                Accepts Bunny Video GUID, Mediadelivery embed iframe link, CDN HLS playlist, or direct MP4 URL.
              </p>
            </div>
          </div>

          {/* Official Trailer / Teaser Link */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68]">
                {lang === 'mr' ? 'अधिकृत ट्रेलर / टीझर लिंक' : lang === 'hi' ? 'आधिकारिक ट्रेलर / टीज़र लिंक' : 'Official Trailer / Teaser URL'}
              </label>
              {currentSeries.trailerUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewVideo({
                      url: currentSeries.trailerUrl!,
                      title: `${currentSeries.title || 'Series'} Trailer`,
                      poster: currentSeries.banner || currentSeries.poster,
                    });
                  }}
                  className="text-[11px] text-[#EA580C] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" /> {lang === 'mr' ? 'ट्रेलर प्ले करा' : 'Play Trailer'}
                </button>
              )}
            </div>
            <input
              type="url"
              value={currentSeries.trailerUrl || ''}
              onChange={(e) => setCurrentSeries({ ...currentSeries, trailerUrl: e.target.value })}
              placeholder={lang === 'mr' ? 'उदा. https://www.youtube.com/watch?v=... किंवा थेट व्हिडिओ URL' : 'e.g. https://www.youtube.com/watch?v=... or direct video link'}
              className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2 text-sm text-[#2D2522] focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BunnyUploader
              type="image"
              currentValue={currentSeries.poster}
              label={lang === 'mr' ? 'पोस्टर आर्ट' : lang === 'hi' ? 'पोस्टर आर्ट' : 'Poster Art (Portrait)'}
              onUploadComplete={(res) => setCurrentSeries({ ...currentSeries, poster: res.urlOrGuid })}
            />
            <BunnyUploader
              type="image"
              currentValue={currentSeries.banner}
              label={lang === 'mr' ? 'बॅनर (16:9)' : lang === 'hi' ? 'बैनर (16:9)' : 'Backdrop Banner (16:9)'}
              onUploadComplete={(res) => setCurrentSeries({ ...currentSeries, banner: res.urlOrGuid })}
            />
          </div>

          <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-4 pb-1 border-t border-[#E5DBCA] -mx-1 px-1 flex items-center justify-end gap-3 z-10">
            <Button type="button" variant="secondary" onClick={() => setIsSeriesModalOpen(false)} disabled={isSaving}>{t('cancelBtn')}</Button>
            <Button type="submit" variant="primary" loading={isSaving}>
              {isEditingSeries ? (lang === 'mr' ? 'मालिका जतन करा' : lang === 'hi' ? 'सीरीज़ सहेजें' : 'Save Series') : (lang === 'mr' ? 'मालिका प्रसिद्ध करा' : lang === 'hi' ? 'सीरीज़ प्रकाशित करें' : 'Publish Series')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE / EDIT SEASON MODAL */}
      <Modal
        isOpen={isSeasonModalOpen}
        onClose={() => setIsSeasonModalOpen(false)}
        title={isEditingSeason ? (lang === 'mr' ? 'सीझन संपादित करा' : lang === 'hi' ? 'सीज़न संपादित करें' : 'Edit Season') : (lang === 'mr' ? 'नवीन सीझन जोडा' : lang === 'hi' ? 'नया सीज़न जोड़ें' : 'Add New Season')}
        maxWidth="md"
      >
        <form onSubmit={handleSaveSeason} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1">
              {lang === 'mr' ? 'सीझनचे नाव *' : lang === 'hi' ? 'सीज़न का नाम *' : 'Season Title *'}
            </label>
            <input
              type="text"
              required
              value={currentSeason.title || ''}
              onChange={(e) => setCurrentSeason({ ...currentSeason, title: e.target.value })}
              placeholder={lang === 'mr' ? 'उदा. सीझन १' : lang === 'hi' ? 'उदा. सीज़न १' : 'e.g. Season 1'}
              className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2 text-sm text-[#2D2522] focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1">
                {lang === 'mr' ? 'सीझन क्रमांक' : lang === 'hi' ? 'सीज़न संख्या' : 'Season Number'}
              </label>
              <input
                type="number"
                min="1"
                value={currentSeason.seasonNumber || 1}
                onChange={(e) => setCurrentSeason({ ...currentSeason, seasonNumber: Number(e.target.value) })}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2 text-sm text-[#2D2522] focus:outline-none focus:border-[#EA580C]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1">
                {lang === 'mr' ? 'प्रदर्शित तारीख' : lang === 'hi' ? 'रिलीज़ तिथि' : 'Release Date'}
              </label>
              <input
                type="date"
                value={currentSeason.releaseDate || ''}
                onChange={(e) => setCurrentSeason({ ...currentSeason, releaseDate: e.target.value })}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2 text-sm text-[#2D2522] focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1">
              {lang === 'mr' ? 'सीझन सारांश' : lang === 'hi' ? 'सीज़न विवरण' : 'Season Overview'}
            </label>
            <textarea
              rows={2}
              value={currentSeason.overview || ''}
              onChange={(e) => setCurrentSeason({ ...currentSeason, overview: e.target.value })}
              className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2 text-sm text-[#2D2522] focus:outline-none focus:border-[#EA580C] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5DBCA]">
            <Button type="button" variant="secondary" onClick={() => setIsSeasonModalOpen(false)} disabled={isSaving}>{t('cancelBtn')}</Button>
            <Button type="submit" variant="primary" loading={isSaving}>
              {isEditingSeason ? (lang === 'mr' ? 'सीझन जतन करा' : lang === 'hi' ? 'सीज़न सहेजें' : 'Save Season') : (lang === 'mr' ? 'सीझन जोडा' : lang === 'hi' ? 'सीज़न जोड़ें' : 'Add Season')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE / EDIT EPISODE MODAL */}
      <Modal
        isOpen={isEpisodeModalOpen}
        onClose={() => setIsEpisodeModalOpen(false)}
        title={isEditingEpisode ? (lang === 'mr' ? 'भाग संपादित करा' : lang === 'hi' ? 'एपिसोड संपादित करें' : 'Edit Episode') : (lang === 'mr' ? 'नवीन भाग Bunny Stream वर अपलोड करा' : lang === 'hi' ? 'नया एपिसोड अपलोड करें' : 'Upload Episode to Bunny Stream')}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveEpisode} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1">
                {lang === 'mr' ? 'भागाचे नाव *' : lang === 'hi' ? 'एपिसोड का नाम *' : 'Episode Title *'}
              </label>
              <input
                type="text"
                required
                value={currentEpisode.title || ''}
                onChange={(e) => setCurrentEpisode({ ...currentEpisode, title: e.target.value })}
                placeholder={lang === 'mr' ? 'उदा. भाग १ - सुरुवात' : lang === 'hi' ? 'उदा. एपिसोड १' : 'e.g. Episode 1'}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2 text-sm text-[#2D2522] focus:outline-none focus:border-[#EA580C]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1">
                {lang === 'mr' ? 'भाग क्रमांक' : lang === 'hi' ? 'एपिसोड संख्या' : 'Episode Number'}
              </label>
              <input
                type="number"
                min="1"
                value={currentEpisode.episodeNumber || 1}
                onChange={(e) => setCurrentEpisode({ ...currentEpisode, episodeNumber: Number(e.target.value) })}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2 text-sm text-[#2D2522] focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1">
              {lang === 'mr' ? 'भागाचे वर्णन' : lang === 'hi' ? 'एपिसोड विवरण' : 'Episode Description'}
            </label>
            <textarea
              rows={2}
              value={currentEpisode.description || ''}
              onChange={(e) => setCurrentEpisode({ ...currentEpisode, description: e.target.value })}
              className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2 text-sm text-[#2D2522] focus:outline-none focus:border-[#EA580C] resize-none"
            />
          </div>

          {/* Bunny Video Upload */}
          <div className="p-4 rounded-3xl bg-[#FAF7F2] border border-[#E5DBCA] space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#2D2522] flex items-center gap-2">
                <Film className="w-4 h-4 text-[#EA580C]" /> {lang === 'mr' ? 'भाग व्हिडिओ फाईल अपलोड (Bunny Stream)' : 'Episode Video Stream File'}
              </h4>
              <div className="flex items-center gap-1.5 text-[10px] text-[#7A6F68] font-bold">
                <span className="px-2 py-0.5 rounded-full bg-white border border-[#E5DBCA]">Lib: 767488</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">ABR 4K/HD</span>
              </div>
            </div>

            <BunnyUploader
              type="video"
              currentValue={currentEpisode.videoId}
              label={lang === 'mr' ? 'Bunny Stream भाग व्हिडिओ फाईल' : lang === 'hi' ? 'Bunny Stream एपिसोड वीडियो फ़ाइल' : 'Bunny Stream Episode Video'}
              onUploadComplete={(res) => {
                setCurrentEpisode({
                  ...currentEpisode,
                  videoId: res.urlOrGuid,
                  duration: res.duration || currentEpisode.duration,
                  resolution: res.resolution || currentEpisode.resolution,
                  videoStatus: 'ready',
                });
              }}
            />

            {/* Direct Video ID / URL Input with Test Preview */}
            <div className="pt-2 border-t border-[#E5DBCA]/60 space-y-1.5">
              <label className="text-[11px] font-bold text-[#7A6F68] block">
                {lang === 'mr' ? 'व्हिडिओ ID / Bunny Video GUID / थेट Stream URL' : lang === 'hi' ? 'वीडियो ID / Bunny Video GUID / डायरेक्ट Stream URL' : 'Bunny Video GUID, Embed Code or Direct Stream URL'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentEpisode.videoId || ''}
                  onChange={(e) => {
                    const rawVal = e.target.value.trim();
                    const iframeMatch = rawVal.match(/src=["']([^"']+)["']/i);
                    setCurrentEpisode({ ...currentEpisode, videoId: iframeMatch ? iframeMatch[1] : e.target.value });
                  }}
                  placeholder="e.g. 767488-guid, https://iframe.mediadelivery.net/embed/..., or .m3u8/.mp4"
                  className="flex-1 bg-white border border-[#E5DBCA] rounded-2xl px-4 py-2 text-xs font-mono text-[#2D2522] focus:outline-none focus:border-[#EA580C]"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!currentEpisode.videoId) {
                      alert(lang === 'mr' ? 'कृपया आधी Video ID किंवा URL प्रविष्ट करा.' : 'Please enter Video ID or URL first.');
                      return;
                    }
                    setPreviewVideo({
                      url: currentEpisode.videoId,
                      title: currentEpisode.title || 'Episode Video Preview',
                      poster: currentEpisode.thumbnail,
                    });
                  }}
                  className="shrink-0 text-xs flex items-center gap-1.5 border-[#EA580C] text-[#EA580C] hover:bg-[#FFF7ED]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {lang === 'mr' ? 'तपासा' : lang === 'hi' ? 'टेस्ट करें' : 'Test Play'}
                </Button>
              </div>
              <p className="text-[10px] text-[#A89C94]">
                Accepts Bunny Video GUID, Mediadelivery embed iframe link, CDN HLS playlist, or direct MP4 URL.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BunnyUploader
              type="image"
              currentValue={currentEpisode.thumbnail}
              label={lang === 'mr' ? 'भागाचे थंबनेल' : lang === 'hi' ? 'एपिसोड थंबनेल' : 'Episode Thumbnail'}
              onUploadComplete={(res) => setCurrentEpisode({ ...currentEpisode, thumbnail: res.urlOrGuid })}
            />

            <div className="p-4 rounded-3xl bg-[#FAF7F2] border border-[#E5DBCA] flex flex-col justify-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!currentEpisode.isFreePreview}
                  onChange={(e) => setCurrentEpisode({ ...currentEpisode, isFreePreview: e.target.checked })}
                  className="w-4 h-4 rounded-full text-[#EA580C] focus:ring-[#EA580C]"
                />
                <div>
                  <span className="text-sm font-bold text-[#2D2522] block">
                    {lang === 'mr' ? 'मोफत पूर्वावलोकन भाग' : lang === 'hi' ? 'मुफ़्त पूर्वावलोकन एपिसोड' : 'Free Preview Episode'}
                  </span>
                  <span className="text-xs text-[#7A6F68]">
                    {lang === 'mr' ? 'विना-सबस्क्रिप्शन वापरकर्त्यांना हा भाग पाहण्याची अनुमती द्या' : lang === 'hi' ? 'गैर-सब्सक्राइबर्स को यह एपिसोड देखने की अनुमति दें' : 'Allow non-subscribed users to stream this episode as a teaser'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-4 pb-1 border-t border-[#E5DBCA] -mx-1 px-1 flex items-center justify-end gap-3 z-10">
            <Button type="button" variant="secondary" onClick={() => setIsEpisodeModalOpen(false)} disabled={isSaving}>{t('cancelBtn')}</Button>
            <Button type="submit" variant="primary" loading={isSaving}>
              {isEditingEpisode ? (lang === 'mr' ? 'भाग जतन करा' : lang === 'hi' ? 'एपिसोड सहेजें' : 'Save Episode') : (lang === 'mr' ? 'भाग प्रसिद्ध करा' : lang === 'hi' ? 'एपिसोड प्रकाशित करें' : 'Publish Episode')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={lang === 'mr' ? `${deleteTarget?.type === 'series' ? 'वेब मालिका' : deleteTarget?.type === 'season' ? 'सीझन' : 'एपिसोड'} हटवायचा?` : lang === 'hi' ? `${deleteTarget?.type === 'series' ? 'वेब सीरीज़' : deleteTarget?.type === 'season' ? 'सीज़न' : 'एपिसोड'} हटाएं?` : `Delete ${deleteTarget?.type}?`}
        message={t('deleteConfirmSeries')}
        confirmText={lang === 'mr' ? 'हटवा' : lang === 'hi' ? 'हटाएं' : 'Delete'}
      />

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-4xl bg-black rounded-3xl border border-[#E5DBCA]/30 shadow-2xl overflow-hidden p-3 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-white px-2">
              <h3 className="font-bold text-sm truncate flex items-center gap-2">
                <Film className="w-4 h-4 text-[#EA580C]" /> {previewVideo.title}
              </h3>
              <button 
                onClick={() => setPreviewVideo(null)} 
                className="p-1.5 rounded-full bg-white/10 hover:bg-[#EA580C] text-white transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <VideoPlayer
              src={previewVideo.url}
              poster={previewVideo.poster}
              autoPlay={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
