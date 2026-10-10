'use client';

import React, { useState, useEffect } from 'react';
import { 
  Headphones, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Clock, 
  LayoutGrid, 
  List, 
  Sparkles, 
  Play, 
  Pause,
  X, 
  Check, 
  AlertCircle, 
  ExternalLink,
  Mic,
  Volume2,
  RefreshCw,
  Share2,
  Music,
  Radio,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { BunnyUploader } from '@/components/bunny-uploader';
import { AudioPlayer } from '@/components/audio-player';
import { ConnectAudioModal } from '@/components/connect-audio-modal';
import { firestoreService } from '@/lib/firestore-service';
import { ContentItem } from '@/lib/types';
import { formatDuration, formatViews, slugify, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';

export default function PodcastsPage() {
  const { canEdit, canPublish, canDelete } = useAuth();
  const { t, lang } = useLanguage();
  const [podcasts, setPodcasts] = useState<ContentItem[]>([]);
  const [filteredPodcasts, setFilteredPodcasts] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Audio Preview Player
  const [previewPodcast, setPreviewPodcast] = useState<ContentItem | null>(null);
  const [podcastForAudio, setPodcastForAudio] = useState<ContentItem | null>(null);

  const handlePodcastAudioUpdated = (updated: ContentItem) => {
    setPodcasts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPodcast, setCurrentPodcast] = useState<Partial<ContentItem>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Audio URL validation state in Modal
  const [audioUrlError, setAudioUrlError] = useState<string | null>(null);
  const [audioUrlValid, setAudioUrlValid] = useState<boolean>(false);

  // Delete State
  const [podcastToDelete, setPodcastToDelete] = useState<ContentItem | null>(null);

  // Category List tailored for Regional & Rural Maharashtra OTT Podcast Network
  const podcastCategories = [
    'कृषी व शेती (Agriculture & Farming)',
    'ग्रामीण संस्कृती व लोककला (Rural Culture & Folk)',
    'बातम्या व राजकीय विश्लेषण (News & Politics)',
    'आरोग्य व जीवनशैली (Health & Lifestyle)',
    'शिक्षण व करिअर (Education & Youth)',
    'उद्योग व शेतकरी यशोगाथा (Success Stories & Business)',
    'मनोरंजन व संगीत (Entertainment & Music)',
    'मुलाखती व व्यक्तिविशेष (Interviews & Biographies)',
    'सामाजिक प्रश्न व जनजागृती (Social Awareness)',
  ];

  const podcastLanguages = [
    'मराठी (Marathi)',
    'हिंदी (Hindi)',
    'English',
    'अहिराणी / खानदेशी (Ahirani)',
    'वऱ्हाडी (Varhadi)',
    'कोकणी (Konkani)',
  ];

  const loadPodcasts = async () => {
    setLoading(true);
    try {
      const items = await firestoreService.getContent('podcast');
      setPodcasts(items);
    } catch (e) {
      console.warn('Error loading podcasts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPodcasts();
  }, []);

  // Filter & Search Logic
  useEffect(() => {
    let result = [...podcasts];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        (p.title || '').toLowerCase().includes(term) ||
        (p.host || '').toLowerCase().includes(term) ||
        (p.director || '').toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term) ||
        (p.slug || '').toLowerCase().includes(term) ||
        (p.genres || []).some(g => g.toLowerCase().includes(term))
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(p => (p.genres || []).includes(selectedCategory));
    }

    if (selectedLanguage !== 'all') {
      result = result.filter(p => (p.language || []).includes(selectedLanguage));
    }

    if (selectedStatus !== 'all') {
      result = result.filter(p => p.status === selectedStatus);
    }

    setFilteredPodcasts(result);
  }, [podcasts, searchTerm, selectedCategory, selectedLanguage, selectedStatus]);

  // URL Validation Function
  const validateAudioUrl = (url: string): { isValid: boolean; error: string | null } => {
    if (!url || !url.trim()) {
      return { isValid: false, error: 'Audio URL is required.' };
    }
    const clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      return { isValid: false, error: 'URL must begin with http:// or https://' };
    }
    try {
      new URL(clean);
      return { isValid: true, error: null };
    } catch {
      return { isValid: false, error: 'Please enter a valid URL.' };
    }
  };

  const handleAudioUrlChange = (val: string) => {
    setCurrentPodcast(prev => ({ ...prev, audioUrl: val, audioTrackUrl: val }));
    if (!val.trim()) {
      setAudioUrlError(null);
      setAudioUrlValid(false);
      return;
    }
    const check = validateAudioUrl(val);
    setAudioUrlError(check.error);
    setAudioUrlValid(check.isValid);
  };

  const handleOpenCreate = () => {
    const defaultTitle = '';
    setCurrentPodcast({
      id: 'pod-' + Date.now().toString(36),
      type: 'podcast',
      title: defaultTitle,
      slug: '',
      description: '',
      host: '',
      audioUrl: '',
      audioTrackUrl: '',
      tags: ['पॉडकास्ट', 'ऑडिओ', 'ग्रामीण भारत'],
      genres: [podcastCategories[0]],
      cast: [],
      director: '',
      language: [podcastLanguages[0]],
      releaseDate: new Date().toISOString().split('T')[0],
      poster: '',
      banner: '',
      isPremium: false,
      isFeatured: true,
      status: 'published',
      rating: 'All',
      views: 0,
      likes: 0,
      duration: 1800, // default 30 mins (in seconds)
    });
    setAudioUrlError(null);
    setAudioUrlValid(false);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'create') {
        handleOpenCreate();
      }
    }
  }, []);

  const handleOpenEdit = (item: ContentItem) => {
    setCurrentPodcast({
      ...item,
      audioUrl: item.audioUrl || item.audioTrackUrl || item.videoId || '',
      host: item.host || item.director || '',
    });
    const url = item.audioUrl || item.audioTrackUrl || item.videoId || '';
    if (url) {
      const check = validateAudioUrl(url);
      setAudioUrlError(check.error);
      setAudioUrlValid(check.isValid);
    } else {
      setAudioUrlError(null);
      setAudioUrlValid(false);
    }
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPodcast.title?.trim()) {
      alert(lang === 'mr' ? 'कृपया पॉडकास्टचे नाव प्रविष्ट करा.' : lang === 'hi' ? 'कृपया पॉडकास्ट का शीर्षक दर्ज करें।' : 'Please enter Podcast Title.');
      return;
    }

    const audioUrl = (currentPodcast.audioUrl || '').trim();
    if (!audioUrl) {
      alert(lang === 'mr' ? 'कृपया ऑडिओ URL किंवा Bunny.net CDN URL प्रविष्ट करा.' : lang === 'hi' ? 'कृपया ऑडियो URL या Bunny.net CDN लिंक दर्ज करें।' : 'Please enter an Audio URL or Bunny.net CDN link.');
      return;
    }

    const check = validateAudioUrl(audioUrl);
    if (!check.isValid) {
      alert(check.error || 'Invalid Audio URL.');
      return;
    }

    setIsSaving(true);
    try {
      const podcastId = currentPodcast.id || 'pod-' + Date.now().toString(36);
      const hostName = (currentPodcast.host || '').trim();
      const title = currentPodcast.title.trim();
      const slug = currentPodcast.slug?.trim() || slugify(title);

      const toSave: ContentItem = {
        id: podcastId,
        type: 'podcast',
        title,
        slug,
        description: (currentPodcast.description || '').trim(),
        host: hostName,
        director: hostName, // Mirrored for backward viewer compatibility
        audioUrl,
        audioTrackUrl: audioUrl,
        videoId: audioUrl, // Mirrored for unified players
        poster: currentPodcast.poster || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80',
        banner: currentPodcast.banner || currentPodcast.poster || '',
        genres: currentPodcast.genres && currentPodcast.genres.length > 0 ? currentPodcast.genres : [podcastCategories[0]],
        language: currentPodcast.language && currentPodcast.language.length > 0 ? currentPodcast.language : [podcastLanguages[0]],
        tags: currentPodcast.tags || ['पॉडकास्ट'],
        cast: hostName ? [hostName] : [],
        releaseDate: currentPodcast.releaseDate || new Date().toISOString().split('T')[0],
        duration: Number(currentPodcast.duration) || 1800,
        isFeatured: currentPodcast.isFeatured ?? true,
        isPremium: currentPodcast.isPremium ?? false,
        status: currentPodcast.status || 'published',
        rating: 'All',
        views: currentPodcast.views || 0,
        likes: currentPodcast.likes || 0,
        createdAt: currentPodcast.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await firestoreService.saveContent(toSave);

      setPodcasts(prev => {
        const idx = prev.findIndex(p => p.id === toSave.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = toSave;
          return updated;
        }
        return [toSave, ...prev];
      });

      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving podcast:', err);
      alert('Failed to save podcast. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!podcastToDelete) return;
    try {
      await firestoreService.deleteContent(podcastToDelete.id);
      setPodcasts(prev => prev.filter(p => p.id !== podcastToDelete.id));
      if (previewPodcast?.id === podcastToDelete.id) {
        setPreviewPodcast(null);
      }
    } catch (err) {
      console.error('Error deleting podcast:', err);
    } finally {
      setPodcastToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2D2522] tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-rose-500/10 text-[#E11D48] border border-rose-200 shadow-soft">
              <Headphones className="w-6 h-6" />
            </span>
            {lang === 'mr' ? 'पॉडकास्ट व्यवस्थापन' : lang === 'hi' ? 'पॉडकास्ट प्रबंधन' : 'Podcast Management'}
          </h1>
          <p className="text-sm text-[#7A6F68] mt-1">
            {lang === 'mr' 
              ? 'ग्रामीण आवाज, शेती-मातीचे सल्ले, मुलाखती आणि ऑडिओ पॉडकास्ट थेट Bunny.net CDN द्वारे व्यवस्थापित करा.'
              : lang === 'hi'
              ? 'ग्रामीण आवाज, कृषि मार्गदर्शन और ऑडियो पॉडकास्ट सीधे Bunny.net CDN के साथ प्रबंधित करें।'
              : 'Manage regional voice shows, agriculture guidance, and audio podcasts hosted via Bunny.net CDN.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {canEdit && (
            <Button
              variant="primary"
              onClick={handleOpenCreate}
              className="gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {lang === 'mr' ? 'नवीन पॉडकास्ट जोडा' : lang === 'hi' ? 'नया पॉडकास्ट जोड़ें' : 'Add Podcast'}
            </Button>
          )}

          <button
            onClick={loadPodcasts}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-[#E5DBCA] transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('refreshDataBtn')}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl bg-white border border-[#E5DBCA] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-soft">
        <div className="flex flex-1 items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-[#7A6F68] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                lang === 'mr'
                  ? 'पॉडकास्ट नाव, सादरकर्ता किंवा विषयानुसार शोधा...'
                  : lang === 'hi'
                  ? 'पॉडकास्ट नाम, प्रस्तोता या विषय से खोजें...'
                  : 'Search by podcast title, host, topic...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-full pl-11 pr-4 py-2 text-xs text-[#2D2522] placeholder-[#A89C94] focus:outline-none focus:border-[#F472B6] focus:bg-white transition-all shadow-inner"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#FAF7F2] border border-[#E5DBCA] rounded-full px-3.5 py-2 text-xs font-semibold text-[#6E6259] focus:outline-none focus:border-[#F472B6] cursor-pointer shadow-soft max-w-[200px] truncate"
          >
            <option value="all">
              {lang === 'mr' ? 'सर्व श्रेणी' : lang === 'hi' ? 'सभी श्रेणियां' : 'All Categories'}
            </option>
            {podcastCategories.map(cat => {
              const label = lang === 'mr' || lang === 'hi' ? cat.split(' (')[0] : (cat.match(/\((.*?)\)/)?.[1] || cat);
              return <option key={cat} value={cat}>{label}</option>;
            })}
          </select>

          {/* Language Filter */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-[#FAF7F2] border border-[#E5DBCA] rounded-full px-3.5 py-2 text-xs font-semibold text-[#6E6259] focus:outline-none focus:border-[#F472B6] cursor-pointer shadow-soft"
          >
            <option value="all">
              {lang === 'mr' ? 'सर्व भाषा' : lang === 'hi' ? 'सभी भाषाएं' : 'All Languages'}
            </option>
            {podcastLanguages.map(lng => {
              const label = lang === 'mr' || lang === 'hi' ? lng.split(' (')[0] : (lng.match(/\((.*?)\)/)?.[1] || lng);
              return <option key={lng} value={lng}>{label}</option>;
            })}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#FAF7F2] border border-[#E5DBCA] rounded-full px-3.5 py-2 text-xs font-semibold text-[#6E6259] focus:outline-none focus:border-[#F472B6] cursor-pointer shadow-soft"
          >
            <option value="all">{t('filterAllStatus')}</option>
            <option value="published">{t('statusPublished')}</option>
            <option value="draft">{t('statusDraft')}</option>
            <option value="archived">{lang === 'mr' ? 'संग्रहित' : lang === 'hi' ? 'आर्काइव्ड' : 'Archived'}</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 self-end">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-full border transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-rose-50 border-rose-200 text-[#E11D48] shadow-sm'
                : 'bg-white border-[#E5DBCA] text-[#7A6F68] hover:text-[#2D2522]'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-full border transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-rose-50 border-rose-200 text-[#E11D48] shadow-sm'
                : 'bg-white border-[#E5DBCA] text-[#7A6F68] hover:text-[#2D2522]'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#E11D48] animate-spin" />
          <p className="text-sm font-bold text-[#7A6F68]">Loading Podcasts...</p>
        </div>
      ) : filteredPodcasts.length === 0 ? (
        <div className="rounded-3xl bg-white border border-[#E5DBCA] p-12 text-center shadow-soft">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-[#E11D48] border border-rose-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Headphones className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-[#2D2522]">
            {lang === 'mr' ? 'कोणताही पॉडकास्ट सापडला नाही' : lang === 'hi' ? 'कोई पॉडकास्ट नहीं मिला' : 'No Podcasts Found'}
          </h3>
          <p className="text-xs text-[#7A6F68] max-w-md mx-auto mt-1 leading-relaxed">
            {lang === 'mr'
              ? 'वर दिलेल्या "नवीन पॉडकास्ट जोडा" बटणावर क्लिक करून तुमचा पहिला ऑडिओ पॉडकास्ट Bunny.net CDN लिंकसह प्रसिद्ध करा.'
              : lang === 'hi'
              ? 'ऊपर दिए गए बटन पर क्लिक करके अपना पहला ऑडियो पॉडकास्ट जोड़ें।'
              : 'Add your first audio podcast episode with Bunny.net CDN URL to start broadcasting to your audience.'}
          </p>
          {canEdit && (
            <Button
              variant="primary"
              onClick={handleOpenCreate}
              className="mt-5 gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {lang === 'mr' ? 'नवीन पॉडकास्ट जोडा' : lang === 'hi' ? 'नया पॉडकास्ट जोड़ें' : 'Add New Podcast'}
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPodcasts.map((podcast) => {
            const isPlayingThis = previewPodcast?.id === podcast.id;
            const audioSrc = podcast.audioUrl || podcast.audioTrackUrl || podcast.videoId || '';

            return (
              <div
                key={podcast.id}
                className="group relative rounded-3xl bg-white border border-[#E5DBCA] overflow-hidden hover:border-[#F472B6] hover:shadow-soft-lg transition-all duration-300 flex flex-col shadow-soft"
              >
                {/* Artwork Banner */}
                <div className="relative aspect-square w-full bg-gradient-to-tr from-[#2D2522] to-[#4A3E39] overflow-hidden">
                  <img
                    src={podcast.poster || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80'}
                    alt={podcast.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E11D48]/90 text-white backdrop-blur-md shadow-sm flex items-center gap-1">
                      <Mic className="w-3 h-3" />
                      {podcast.isPremium ? 'VIP Audio' : 'Free Podcast'}
                    </span>
                    <Badge variant={podcast.status === 'published' ? 'matcha' : 'secondary'} size="sm">
                      {podcast.status === 'published' ? t('statusPublished') : podcast.status === 'draft' ? t('statusDraft') : podcast.status}
                    </Badge>
                  </div>

                  {/* Center Interactive Audio Play / Preview Button */}
                  <button
                    onClick={() => {
                      if (isPlayingThis) {
                        setPreviewPodcast(null);
                      } else {
                        setPreviewPodcast(podcast);
                      }
                    }}
                    className={`absolute inset-0 m-auto w-14 h-14 rounded-full flex items-center justify-center transition-all transform shadow-2xl cursor-pointer z-10 ${
                      isPlayingThis
                        ? 'bg-rose-600 text-white scale-105 opacity-100 ring-4 ring-rose-400/50'
                        : 'bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white opacity-0 group-hover:opacity-100 group-hover:scale-110 shadow-glow-crimson'
                    }`}
                    title={isPlayingThis ? 'Pause / Close Preview' : 'Play / Preview Audio'}
                  >
                    {isPlayingThis ? (
                      <Pause className="w-6 h-6 fill-white" />
                    ) : (
                      <Play className="w-6 h-6 fill-white translate-x-0.5" />
                    )}
                  </button>

                  {/* Bottom Duration & Language Tag */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                    <span className="flex items-center gap-1 font-mono text-[11px] bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                      <Clock className="w-3 h-3 text-rose-300" />
                      {formatDuration(podcast.duration || 1800)}
                    </span>
                    <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full">
                      {(podcast.language && podcast.language[0]) || 'मराठी'}
                    </span>
                  </div>
                </div>

                {/* Details Card */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-[#2D2522] text-base truncate group-hover:text-[#E11D48] transition-colors" title={podcast.title}>
                      {podcast.title}
                    </h3>

                    {/* Host Name */}
                    <div className="flex items-center gap-1.5 text-xs text-[#7A6F68] mt-1 font-medium truncate">
                      <Mic className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />
                      <span className="truncate">{podcast.host || podcast.director || 'Gramin Voice Host'}</span>
                    </div>

                    {/* Category Tags */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {(podcast.genres || []).slice(0, 2).map((cat) => {
                        const clean = cat.split(' (')[0];
                        return (
                          <span key={cat} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200/80 text-[#BE123C]">
                            {clean}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-[#E5DBCA] flex items-center justify-between text-xs">
                    <button
                      onClick={() => setPreviewPodcast(podcast)}
                      className="text-xs font-bold text-[#E11D48] hover:text-[#BE123C] flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      {lang === 'mr' ? 'ऐका' : lang === 'hi' ? 'सुनें' : 'Listen'}
                    </button>

                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <button
                          onClick={() => setPodcastForAudio(podcast)}
                          className="p-1.5 rounded-full text-[#7A6F68] hover:text-[#BE123C] hover:bg-rose-50 transition-colors cursor-pointer"
                          title={lang === 'mr' ? 'ऑडिओ जोडा / बदला' : 'Connect Audio'}
                        >
                          <Headphones className="w-4 h-4" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(podcast)}
                          className="p-1.5 rounded-full text-[#7A6F68] hover:text-[#2D2522] hover:bg-[#F5EFE6] transition-colors cursor-pointer"
                          title="Edit Podcast"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setPodcastToDelete(podcast)}
                          className="p-1.5 rounded-full text-[#7A6F68] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Podcast"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-3xl bg-white border border-[#E5DBCA] p-4 overflow-x-auto shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-[#7A6F68] border-b border-[#E5DBCA]">
              <tr>
                <th className="pb-3 font-bold">Podcast Title & Host</th>
                <th className="pb-3 font-bold">Category</th>
                <th className="pb-3 font-bold">Language</th>
                <th className="pb-3 font-bold">Duration</th>
                <th className="pb-3 font-bold">Release Date</th>
                <th className="pb-3 font-bold">Status</th>
                <th className="pb-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DBCA]/60">
              {filteredPodcasts.map((podcast) => (
                <tr key={podcast.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-800 overflow-hidden shrink-0 border border-[#E5DBCA] shadow-sm relative group cursor-pointer" onClick={() => setPreviewPodcast(podcast)}>
                        <img 
                          src={podcast.poster || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80'} 
                          alt={podcast.title} 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 fill-white text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-[#2D2522] hover:text-[#E11D48] transition-colors cursor-pointer" onClick={() => setPreviewPodcast(podcast)}>
                          {podcast.title}
                        </p>
                        <p className="text-xs text-[#7A6F68] flex items-center gap-1 mt-0.5">
                          <Mic className="w-3 h-3 text-[#E11D48]" />
                          {podcast.host || podcast.director || 'Gramin Host'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-xs text-[#6E6259] font-medium">
                    {(podcast.genres || []).map(g => g.split(' (')[0]).join(', ')}
                  </td>
                  <td className="py-3 text-xs text-[#7A6F68] font-medium">
                    {(podcast.language || []).join(', ')}
                  </td>
                  <td className="py-3 text-xs text-[#2D2522] font-mono font-bold">
                    {formatDuration(podcast.duration || 1800)}
                  </td>
                  <td className="py-3 text-xs text-[#7A6F68] font-mono">
                    {formatDate(podcast.releaseDate)}
                  </td>
                  <td className="py-3">
                    <Badge variant={podcast.status === 'published' ? 'matcha' : 'secondary'} size="sm">
                      {podcast.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPreviewPodcast(podcast)}
                        className="gap-1.5 h-8 text-xs cursor-pointer text-[#E11D48] border-rose-200 hover:bg-rose-50"
                        title="Listen to Podcast"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {lang === 'mr' ? 'ऐका' : 'Play'}
                      </Button>
                      {canEdit && (
                        <button
                          onClick={() => setPodcastForAudio(podcast)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title={lang === 'mr' ? 'ऑडिओ जोडा / बदला' : 'Connect Audio'}
                        >
                          <Headphones className="w-4 h-4" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(podcast)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setPodcastToDelete(podcast)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete"
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
      )}

      {/* Add / Edit Podcast Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          isEditing 
            ? (lang === 'mr' ? 'पॉडकास्ट तपशील संपादित करा' : lang === 'hi' ? 'पॉडकास्ट विवरण संपादित करें' : 'Edit Podcast Details')
            : (lang === 'mr' ? 'नवीन पॉडकास्ट जोडा' : lang === 'hi' ? 'नया पॉडकास्ट जोड़ें' : 'Add New Audio Podcast')
        }
        description={
          lang === 'mr' 
            ? 'पॉडकास्टचे नाव, सादरकर्ता, Bunny.net CDN ऑडिओ लिंक आणि कव्हर इमेज प्रविष्ट करा.' 
            : 'Enter podcast title, presenter name, Bunny.net CDN audio URL and artwork.'
        }
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          {/* Row 1: Title & Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'पॉडकास्ट शीर्षक *' : lang === 'hi' ? 'पॉडकास्ट शीर्षक *' : 'Podcast Title *'}
              </label>
              <input
                type="text"
                required
                value={currentPodcast.title || ''}
                onChange={(e) => {
                  const title = e.target.value;
                  setCurrentPodcast(prev => ({
                    ...prev,
                    title,
                    slug: prev.slug ? prev.slug : slugify(title),
                  }));
                }}
                placeholder={lang === 'mr' ? 'उदा. मातीचा गंध - शेतकरी संवाद' : 'e.g. Gramin Voice - Farming Insights'}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-purple-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'URL स्लग' : 'URL Slug'}
              </label>
              <input
                type="text"
                value={currentPodcast.slug || ''}
                onChange={(e) => setCurrentPodcast(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="e.g. maticha-gandh-ep01"
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#7A6F68] font-mono focus:outline-none focus:border-purple-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Row 2: Host / Presenter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'सादरकर्ता / Host' : lang === 'hi' ? 'प्रस्तोता / Host' : 'Host / Presenter *'}
              </label>
              <div className="relative">
                <Mic className="w-4 h-4 text-[#7A6F68] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={currentPodcast.host || ''}
                  onChange={(e) => setCurrentPodcast(prev => ({ ...prev, host: e.target.value }))}
                  placeholder={lang === 'mr' ? 'उदा. अमोल पवार / डॉ. वसंतराव नाईक' : 'e.g. Amol Pawar / Radio Host'}
                  className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl pl-11 pr-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'कालावधी (मिनिटे)' : 'Duration (Minutes)'}
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-[#7A6F68] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={Math.round((currentPodcast.duration || 1800) / 60)}
                  onChange={(e) => {
                    const mins = parseInt(e.target.value, 10) || 1;
                    setCurrentPodcast(prev => ({ ...prev, duration: mins * 60 }));
                  }}
                  className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl pl-11 pr-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-purple-500 focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Description / Synopsis */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
              {lang === 'mr' ? 'कथासार / सविस्तर माहिती' : lang === 'hi' ? 'विवरण / सारांश' : 'Description / Synopsis'}
            </label>
            <textarea
              rows={3}
              value={currentPodcast.description || ''}
              onChange={(e) => setCurrentPodcast(prev => ({ ...prev, description: e.target.value }))}
              placeholder={lang === 'mr' ? 'पॉडकास्टचा विषय, चर्चेतील मुख्य मुद्दे आणि माहिती लिहा...' : 'Describe the podcast episode topic, guest and takeaways...'}
              className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-purple-500 focus:bg-white resize-none"
            />
          </div>

          {/* Bunny.net Audio URL & Validation Box */}
          <div className="p-5 rounded-3xl bg-[#FAF7F2] border border-[#E5DBCA] space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#2D2522] flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#E11D48]" />
                Bunny.net Audio / CDN Stream URL *
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-rose-200 text-[#E11D48] font-bold">
                Direct MP3 / M4A / AAC / HLS
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="url"
                    required
                    value={currentPodcast.audioUrl || ''}
                    onChange={(e) => handleAudioUrlChange(e.target.value)}
                    placeholder="https://vz-92cc7e0f-cd7.b-cdn.net/podcasts/episode_01.mp3"
                    className={`w-full bg-white border rounded-2xl px-4 py-2.5 text-xs font-mono text-[#2D2522] focus:outline-none transition-colors ${
                      audioUrlError 
                        ? 'border-rose-400 focus:border-rose-500' 
                        : audioUrlValid 
                        ? 'border-emerald-500 focus:border-emerald-600' 
                        : 'border-[#E5DBCA] focus:border-[#F472B6]'
                    }`}
                  />
                  {audioUrlValid && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600" title="Valid URL format">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </div>

                {/* Inline Test / Preview Button */}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const url = (currentPodcast.audioUrl || '').trim();
                    if (!url) {
                      alert('Please enter an audio URL first.');
                      return;
                    }
                    const check = validateAudioUrl(url);
                    if (!check.isValid) {
                      alert(check.error);
                      return;
                    }
                    setPreviewPodcast({
                      ...currentPodcast,
                      id: currentPodcast.id || 'preview-temp',
                      type: 'podcast',
                      title: currentPodcast.title || 'Audio Stream Preview',
                      host: currentPodcast.host || 'Audio Test',
                      audioUrl: url,
                      poster: currentPodcast.poster,
                    } as ContentItem);
                  }}
                  className="shrink-0 text-xs flex items-center gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-50 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {lang === 'mr' ? 'तपासा' : 'Test Play'}
                </Button>
              </div>

              {/* Real-time Validation Message */}
              {audioUrlError && (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {audioUrlError}
                </p>
              )}
              {audioUrlValid && (
                <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Valid Audio / CDN Stream URL format
                </p>
              )}

              <p className="text-[10px] text-[#7A6F68]">
                Supports Bunny Storage direct CDN URLs (e.g. <code>https://storage.bunnycdn.com/graminbharat/...</code> or <code>https://vz-92cc7e0f-cd7.b-cdn.net/...</code>) and all standard MP3, AAC, M4A or HLS audio streams.
              </p>
            </div>
          </div>

          {/* Cover Artwork Image */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block">
              {lang === 'mr' ? 'कव्हर इमेज / Artwork (1:1 Square)' : 'Cover Image / Artwork (1:1 Square)'}
            </label>

            <div className="flex items-center gap-4">
              {/* Preview Thumbnail */}
              <div className="w-20 h-20 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA] overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                {currentPodcast.poster ? (
                  <img src={currentPodcast.poster} alt="Cover Preview" className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-7 h-7 text-[#A89C94]" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="url"
                  value={currentPodcast.poster || ''}
                  onChange={(e) => setCurrentPodcast(prev => ({ ...prev, poster: e.target.value, banner: e.target.value }))}
                  placeholder="https://vz-92cc7e0f-cd7.b-cdn.net/podcasts/cover.jpg"
                  className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2 text-xs font-mono text-[#2D2522] focus:outline-none focus:border-purple-500 focus:bg-white"
                />

                <div className="flex items-center gap-2">
                  <BunnyUploader
                    type="image"
                    currentValue={currentPodcast.poster}
                    label="Upload Artwork"
                    onUploadComplete={(res) => {
                      setCurrentPodcast(prev => ({
                        ...prev,
                        poster: res.urlOrGuid,
                        banner: res.urlOrGuid
                      }));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Category & Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'पॉडकास्ट श्रेणी' : 'Category *'}
              </label>
              <select
                value={(currentPodcast.genres && currentPodcast.genres[0]) || podcastCategories[0]}
                onChange={(e) => setCurrentPodcast(prev => ({ ...prev, genres: [e.target.value] }))}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white cursor-pointer"
              >
                {podcastCategories.map(cat => {
                  const label = lang === 'mr' || lang === 'hi' ? cat.split(' (')[0] : cat;
                  return <option key={cat} value={cat}>{label}</option>;
                })}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'भाषा' : 'Language *'}
              </label>
              <select
                value={(currentPodcast.language && currentPodcast.language[0]) || podcastLanguages[0]}
                onChange={(e) => setCurrentPodcast(prev => ({ ...prev, language: [e.target.value] }))}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white cursor-pointer"
              >
                {podcastLanguages.map(lng => {
                  const label = lang === 'mr' || lang === 'hi' ? lng.split(' (')[0] : lng;
                  return <option key={lng} value={lng}>{label}</option>;
                })}
              </select>
            </div>
          </div>

          {/* Release Date & Status & Premium Tier */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'प्रकाशन तारीख' : 'Release Date'}
              </label>
              <input
                type="date"
                value={currentPodcast.releaseDate || ''}
                onChange={(e) => setCurrentPodcast(prev => ({ ...prev, releaseDate: e.target.value }))}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'स्थिती' : 'Status'}
              </label>
              <select
                value={currentPodcast.status || 'published'}
                onChange={(e) => setCurrentPodcast(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white cursor-pointer"
              >
                <option value="published">{lang === 'mr' ? 'प्रसिद्ध' : lang === 'hi' ? 'प्रकाशित' : 'Published'}</option>
                <option value="draft">{lang === 'mr' ? 'मसुदा' : lang === 'hi' ? 'ड्राफ्ट' : 'Draft'}</option>
                <option value="archived">{lang === 'mr' ? 'संग्रहित' : lang === 'hi' ? 'आर्काइव्ड' : 'Archived'}</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl hover:bg-white transition-colors">
                <input
                  type="checkbox"
                  checked={currentPodcast.isPremium || false}
                  onChange={(e) => setCurrentPodcast(prev => ({ ...prev, isPremium: e.target.checked }))}
                  className="rounded text-[#E11D48] focus:ring-[#F472B6] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-[#2D2522]">
                  {lang === 'mr' ? 'VIP वर्गणीदारांसाठी' : 'VIP Premium Access'}
                </span>
              </label>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-4 border-t border-[#E5DBCA] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="cursor-pointer"
            >
              {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              className="shadow-glow-crimson cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                  {lang === 'mr' ? 'जतन करत आहे...' : 'Saving...'}
                </>
              ) : isEditing ? (
                lang === 'mr' ? 'बदल जतन करा' : 'Save Changes'
              ) : (
                lang === 'mr' ? 'पॉडकास्ट प्रसिद्ध करा' : 'Publish Podcast'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!podcastToDelete}
        onClose={() => setPodcastToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={lang === 'mr' ? 'पॉडकास्ट नक्की हटवायचा आहे का?' : 'Delete Podcast?'}
        message={
          lang === 'mr'
            ? `"${podcastToDelete?.title}" हा पॉडकास्ट कायमचा हटवला जाईल. ही क्रिया परत करता येणार नाही.`
            : `Are you sure you want to permanently delete "${podcastToDelete?.title}"? This cannot be undone.`
        }
        confirmText={lang === 'mr' ? 'होय, हटवा' : 'Delete'}
        cancelText={lang === 'mr' ? 'रद्द करा' : 'Cancel'}
        variant="danger"
      />

      {/* Interactive Audio Player Preview Modal */}
      {previewPodcast && (
        <AudioPlayer
          src={previewPodcast.audioUrl || previewPodcast.audioTrackUrl || previewPodcast.videoId || ''}
          poster={previewPodcast.poster}
          title={previewPodcast.title}
          host={previewPodcast.host || previewPodcast.director}
          category={(previewPodcast.genres && previewPodcast.genres[0]) || 'Podcast'}
          onClose={() => setPreviewPodcast(null)}
          autoPlay={true}
        />
      )}

      {/* Connect Audio Modal */}
      {podcastForAudio && (
        <ConnectAudioModal
          isOpen={!!podcastForAudio}
          onClose={() => setPodcastForAudio(null)}
          item={podcastForAudio}
          onAudioUpdated={handlePodcastAudioUpdated}
        />
      )}
    </div>
  );
}
