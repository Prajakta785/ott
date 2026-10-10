'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Play, 
  Headphones, 
  Sparkles, 
  LayoutGrid, 
  List,
  Radio,
  Newspaper,
  Tractor,
  Film,
  Tv,
  Clapperboard,
  MapPin,
  User,
  CheckCircle2,
  X
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { BunnyUploader } from '@/components/bunny-uploader';
import { VideoPlayer } from '@/components/video-player';
import { ConnectAudioModal } from '@/components/connect-audio-modal';
import { AddCategoryModal } from '@/components/add-category-modal';
import { firestoreService } from '@/lib/firestore-service';
import { ContentCategory, ContentItem, ContentType } from '@/lib/types';
import { formatDuration, slugify, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { getSafeImageUrl, handleImageError, DEFAULT_MOVIE_POSTER } from '@/lib/image-utils';

const MAHARASHTRA_DISTRICTS = [
  'All Maharashtra (सर्व महाराष्ट्र)',
  'Ahmednagar (अहमदनगर / अहिल्यानगर)',
  'Akola (अकोला)',
  'Amravati (अमरावती)',
  'Chhatrapati Sambhajinagar (छत्रपती संभाजीनगर / औरंगाबाद)',
  'Beed (बीड)',
  'Bhandara (भंडारा)',
  'Buldhana (बुलढाणा)',
  'Chandrapur (चंद्रपूर)',
  'Dhule (धुळे)',
  'Gadchiroli (गडचिरोली)',
  'Gondia (गोंदिया)',
  'Hingoli (हिंगोली)',
  'Jalgaon (जळगाव)',
  'Jalna (जालना)',
  'Kolhapur (कोल्हापूर)',
  'Latur (लातूर)',
  'Mumbai City (मुंबई शहर)',
  'Mumbai Suburban (मुंबई उपनगर)',
  'Nagpur (नागपूर)',
  'Nanded (नांदेड)',
  'Nandurbar (नंदुरबार)',
  'Nashik (नाशिक)',
  'Dharashiv (धाराशिव / उस्मानाबाद)',
  'Palghar (पालघर)',
  'Parbhani (परभणी)',
  'Pune (पुणे)',
  'Raigad (रायगड)',
  'Ratnagiri (रत्नागिरी)',
  'Sangli (सांगली)',
  'Satara (सातारा)',
  'Sindhudurg (सिंधुदुर्ग)',
  'Solapur (सोलापूर)',
  'Thane (ठाणे)',
  'Wardha (वर्धा)',
  'Washim (वाशीम)',
  'Yavatmal (यवतमाळ)',
];

function MediaContentPageInner() {
  const { canEdit, canPublish, canDelete } = useAuth();
  const { t, lang } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawCategoryQuery = searchParams.get('category');
  const currentCategoryQuery = (rawCategoryQuery === 'Nammad Maharashtra' || !rawCategoryQuery) 
    ? 'Namdar Maharashtra' 
    : rawCategoryQuery;

  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(currentCategoryQuery);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [itemForAudio, setItemForAudio] = useState<ContentItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [currentItem, setCurrentItem] = useState<Partial<ContentItem>>({});
  const [tagsInput, setTagsInput] = useState('');

  // Load Categories & Content
  const loadData = async () => {
    setLoading(true);
    try {
      const [allCats, allContent] = await Promise.all([
        firestoreService.getCategories(),
        firestoreService.getContent(),
      ]);
      setCategories(allCats);
      setItems(allContent);
    } catch (err) {
      console.error('Failed to load media data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentCategoryQuery) {
      setSelectedCategory(currentCategoryQuery);
    }
  }, [currentCategoryQuery]);

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      handleOpenCreate();
    }
  }, [searchParams, selectedCategory]);

  // Filter items matching current category, search, and district
  useEffect(() => {
    let result = items.filter(item => {
      if (!selectedCategory || selectedCategory === 'all') return true;
      const catLower = selectedCategory.toLowerCase().trim();
      const inGenres = item.genres?.some(g => g.toLowerCase().includes(catLower));
      const inTags = item.tags?.some(t => t.toLowerCase().includes(catLower));
      const inSubCategory = item.subCategory?.toLowerCase().includes(catLower);
      const inType = item.type?.toLowerCase() === catLower;
      return inGenres || inTags || inSubCategory || inType;
    });

    if (selectedDistrict !== 'All') {
      result = result.filter(i => i.district?.toLowerCase().includes(selectedDistrict.toLowerCase()));
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(i => 
        i.title.toLowerCase().includes(term) ||
        (i.description && i.description.toLowerCase().includes(term)) ||
        (i.district && i.district.toLowerCase().includes(term)) ||
        (i.reporterName && i.reporterName.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(i => i.status === statusFilter);
    }

    setFilteredItems(result);
  }, [items, selectedCategory, searchTerm, selectedDistrict, statusFilter]);

  const handleOpenCreate = () => {
    const isPodcastCat = selectedCategory.toLowerCase().includes('podcast') || selectedCategory.includes('पॉडकास्ट');
    setCurrentItem({
      id: (isPodcastCat ? 'pod-' : 'media-') + Date.now().toString(36),
      type: (isPodcastCat ? 'podcast' : 'video') as ContentType,
      title: '',
      slug: '',
      description: '',
      tags: [selectedCategory, isPodcastCat ? 'पॉडकास्ट' : 'ग्रामीण भारत', isPodcastCat ? 'ऑडिओ' : ''].filter(Boolean),
      genres: [selectedCategory, isPodcastCat ? 'Podcast' : 'Video'],
      language: ['मराठी (Marathi)'],
      releaseDate: new Date().toISOString().split('T')[0],
      poster: isPodcastCat ? 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800' : '',
      banner: isPodcastCat ? 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1200' : '',
      trailerUrl: '',
      isPremium: false,
      isFeatured: true,
      status: 'published',
      rating: 'U',
      views: 0,
      duration: isPodcastCat ? 1800 : 600,
      videoStatus: 'ready',
      resolution: isPodcastCat ? 'HD Audio' : '1080p Full HD',
      videoId: '',
      videoUrl: '',
      audioUrl: '',
      audioTrackUrl: '',
      subCategory: selectedCategory,
      district: 'Pune (पुणे)',
      taluka: '',
      reporterName: isPodcastCat ? 'पॉडकास्ट निवेदक' : 'विशेष प्रतिनिधी',
    });
    setTagsInput(selectedCategory + (isPodcastCat ? ', पॉडकास्ट, ऑडिओ' : ''));
    setIsEditing(false);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (item: ContentItem) => {
    setCurrentItem({ ...item });
    setTagsInput(item.tags?.join(', ') || item.genres?.join(', ') || '');
    setIsEditing(true);
    setIsCreateModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem.title?.trim()) {
      alert(lang === 'mr' ? 'कृपया शीर्षक प्रविष्ट करा.' : 'Please enter title.');
      return;
    }
    setIsSaving(true);

    try {
      const isPodcastItem = currentItem.type === 'podcast' || 
                            selectedCategory.toLowerCase().includes('podcast') || 
                            selectedCategory.includes('पॉडकास्ट');
      const tagList = tagsInput.split(',').map(s => s.trim()).filter(Boolean);
      const toSave: ContentItem = {
        id: currentItem.id || ((isPodcastItem ? 'pod-' : 'media-') + Date.now().toString(36)),
        type: (isPodcastItem ? 'podcast' : (currentItem.type as ContentType) || 'video'),
        title: currentItem.title.trim(),
        slug: currentItem.slug || slugify(currentItem.title.trim()),
        description: currentItem.description || '',
        tags: Array.from(new Set([...tagList, selectedCategory, isPodcastItem ? 'पॉडकास्ट' : '', isPodcastItem ? 'Podcast' : '', isPodcastItem ? 'ऑडिओ' : '', currentItem.district].filter(Boolean) as string[])),
        genres: Array.from(new Set([selectedCategory, isPodcastItem ? 'Podcast' : '', isPodcastItem ? 'पॉडकास्ट' : '', ...(currentItem.genres || [])].filter(Boolean))),
        cast: currentItem.cast || [currentItem.reporterName || (isPodcastItem ? 'पॉडकास्ट निवेदक' : 'विशेष प्रतिनिधी')],
        director: currentItem.director || (isPodcastItem ? 'ग्रामीण भारत पॉडकास्ट नेटवर्क' : 'ग्रामीण भारत TV / नामदार महाराष्ट्र'),
        language: currentItem.language || ['मराठी (Marathi)'],
        releaseDate: currentItem.releaseDate || new Date().toISOString().split('T')[0],
        poster: currentItem.poster || (isPodcastItem ? 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800' : 'https://vz-92cc7e0f-cd7.b-cdn.net/e6eb731d-a1b1-4885-a40b-54c4e860c78e/thumbnail.jpg'),
        banner: currentItem.banner || currentItem.poster || (isPodcastItem ? 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1200' : 'https://vz-92cc7e0f-cd7.b-cdn.net/e6eb731d-a1b1-4885-a40b-54c4e860c78e/thumbnail.jpg'),
        trailerUrl: currentItem.trailerUrl || '',
        isPremium: !!currentItem.isPremium,
        isFeatured: currentItem.isFeatured ?? true,
        status: currentItem.status || 'published',
        rating: currentItem.rating || 'U',
        views: currentItem.views || 0,
        duration: currentItem.duration || (isPodcastItem ? 1800 : 600),
        durationMinutes: Math.round((currentItem.duration || (isPodcastItem ? 1800 : 600)) / 60),
        videoId: currentItem.videoId || currentItem.audioUrl || '',
        videoUrl: currentItem.videoUrl || currentItem.audioUrl || '',
        audioUrl: currentItem.audioUrl || currentItem.audioTrackUrl || currentItem.videoUrl || '',
        audioTrackUrl: currentItem.audioTrackUrl || currentItem.audioUrl || '',
        videoStatus: 'ready',
        resolution: currentItem.resolution || (isPodcastItem ? 'HD Audio' : '1080p Full HD'),
        subCategory: selectedCategory || (isPodcastItem ? 'पॉडकास्ट' : 'सामान्य'),
        reporterName: currentItem.reporterName || (isPodcastItem ? 'पॉडकास्ट निवेदक' : 'विशेष प्रतिनिधी'),
        district: currentItem.district || 'Pune (पुणे)',
        taluka: currentItem.taluka || '',
        createdAt: currentItem.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await firestoreService.saveContent(toSave);
      setItems(prev => {
        const idx = prev.findIndex(i => i.id === toSave.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = toSave;
          return updated;
        }
        return [toSave, ...prev];
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('ott_content_updated'));
      }

      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Error saving content:', err);
      alert(lang === 'mr' ? 'कन्टेन्ट सेव्ह करताना त्रुटी आली.' : 'Failed to save content.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await firestoreService.deleteContent(itemToDelete.id);
      setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert(lang === 'mr' ? 'हटवताना त्रुटी आली.' : 'Failed to delete.');
    }
  };

  // Get active category details
  const activeCatMeta = categories.find(
    c => c.nameEnglish.toLowerCase() === selectedCategory.toLowerCase() ||
         c.nameMarathi.toLowerCase() === selectedCategory.toLowerCase()
  );

  const getCategoryIcon = (catName: string) => {
    const lower = catName.toLowerCase();
    if (lower.includes('podcast') || lower.includes('audio') || lower.includes('पॉडकास्ट')) return <Headphones className="w-6 h-6 text-rose-600" />;
    if (lower.includes('live')) return <Radio className="w-6 h-6 text-rose-600" />;
    if (lower.includes('news') || lower.includes('बातमी')) return <Newspaper className="w-6 h-6 text-rose-600" />;
    if (lower.includes('movie') || lower.includes('चित्रपट')) return <Film className="w-6 h-6 text-rose-600" />;
    if (lower.includes('series') || lower.includes('मालिका')) return <Tv className="w-6 h-6 text-rose-600" />;
    if (lower.includes('entertainment') || lower.includes('मनोरंजन')) return <Clapperboard className="w-6 h-6 text-rose-600" />;
    if (lower.includes('gramin') || lower.includes('ग्रामीण') || lower.includes('शेती')) return <Tractor className="w-6 h-6 text-rose-600" />;
    return <MapPin className="w-6 h-6 text-rose-600" />;
  };

  const getCategoryLabel = (nameEn: string, nameMr?: string) => {
    switch (nameEn) {
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
      default:
        if (lang === 'mr' && nameMr) return nameMr;
        if (lang === 'hi' && nameMr) return nameMr;
        return nameEn;
    }
  };

  const getBadgeLabel = (badge: string) => {
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
      default:
        return badge;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Clean White Luxury Card matching News Management */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-7 rounded-3xl bg-white border border-slate-200 shadow-luxury">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            {getCategoryIcon(selectedCategory)}
            <span>{getCategoryLabel(selectedCategory, activeCatMeta?.nameMarathi)}</span>
            {lang === 'en' && activeCatMeta?.nameMarathi && activeCatMeta.nameMarathi !== selectedCategory && (
              <span className="text-slate-400 text-sm font-bold ml-1">({activeCatMeta.nameMarathi})</span>
            )}
            {lang !== 'en' && activeCatMeta?.nameEnglish && activeCatMeta.nameEnglish !== getCategoryLabel(selectedCategory, activeCatMeta?.nameMarathi) && (
              <span className="text-slate-400 text-sm font-bold ml-1">({activeCatMeta.nameEnglish})</span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'mr' 
              ? `${getCategoryLabel(selectedCategory, activeCatMeta?.nameMarathi)} विभागातील सर्व व्हिडिओ, कार्यक्रम व ऑडिओ व्यवस्थापित करा.`
              : lang === 'hi'
              ? `${getCategoryLabel(selectedCategory, activeCatMeta?.nameMarathi)} विभाग के सभी वीडियो, कार्यक्रम और ऑडियो प्रबंधित करें।`
              : `Manage all video contents, shows, and audio for ${selectedCategory}.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setIsAddCategoryOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{lang === 'mr' ? '+ नवीन कॅटेगरी जोडा' : lang === 'hi' ? '+ नई श्रेणी जोड़ें' : '+ Add Category'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-sm shrink-0 cursor-pointer"
          >
            <span>{lang === 'mr' ? `नवीन ${getCategoryLabel(selectedCategory, activeCatMeta?.nameMarathi)} जोडा` : lang === 'hi' ? `नया ${getCategoryLabel(selectedCategory, activeCatMeta?.nameMarathi)} जोड़ें` : `Add ${selectedCategory}`}</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar for quick switching between Namdar Maharashtra, Gramin Bharat TV, Entertainment, Movies, Series, Podcast, etc. */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.nameEnglish.toLowerCase() ||
                             selectedCategory.toLowerCase() === cat.nameMarathi.toLowerCase();
          const label = lang === 'mr' ? cat.nameMarathi : (lang === 'hi' ? cat.nameMarathi : cat.nameEnglish);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.nameEnglish);
                router.push(`/admin/media?category=${encodeURIComponent(cat.nameEnglish)}`);
              }}
              className={cn(
                "px-4 py-2.5 rounded-2xl text-xs font-black shrink-0 transition flex items-center gap-2 cursor-pointer shadow-xs",
                isSelected
                  ? "bg-slate-900 text-white shadow-md scale-[1.02]"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-900"
              )}
            >
              <span className="text-sm">
                {cat.nameEnglish.toLowerCase().includes('podcast') ? '🎙️' :
                 cat.nameEnglish.toLowerCase().includes('live') ? '📡' :
                 cat.nameEnglish.toLowerCase().includes('news') ? '📰' :
                 cat.nameEnglish.toLowerCase().includes('movie') ? '🎬' :
                 cat.nameEnglish.toLowerCase().includes('series') ? '📺' :
                 cat.nameEnglish.toLowerCase().includes('entertainment') ? '🎭' :
                 cat.nameEnglish.toLowerCase().includes('gramin') ? '🚜' : '📍'}
              </span>
              <span>{label}</span>
              {cat.badgeText && (
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold",
                  isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                )}>
                  {cat.badgeText}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar matching News Management */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              lang === 'mr'
                ? 'बातमीचे शीर्षक, जिल्हा किंवा वार्ताहराचे नाव शोधा...'
                : 'Search title, district or reporter name...'
            }
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
          />
        </div>

        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-rose-500"
        >
          <option value="All">{lang === 'mr' ? 'सर्व जिल्हे' : 'All Districts'}</option>
          {MAHARASHTRA_DISTRICTS.filter(d => !d.includes('All')).map((dist) => {
            const cleanLabel = lang === 'mr' 
              ? (dist.match(/\((.*?)\)/)?.[1]?.split(' /')[0] || dist)
              : dist.split(' (')[0];
            return (
              <option key={dist} value={dist.split(' ')[0]}>{cleanLabel}</option>
            );
          })}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-rose-500"
        >
          <option value="all">{lang === 'mr' ? 'सर्व स्थिती (All)' : 'All Status'}</option>
          <option value="published">{lang === 'mr' ? 'प्रकाशित (Published)' : 'Published'}</option>
          <option value="draft">{lang === 'mr' ? 'मसुदा (Draft)' : 'Draft'}</option>
        </select>

        <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={cn(
              'p-1.5 rounded-md transition cursor-pointer',
              viewMode === 'table' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
            )}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-1.5 rounded-md transition cursor-pointer',
              viewMode === 'grid' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
            )}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area - Table View matching News Management */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">{t('loadingText')}</div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Plus className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-800 font-bold text-sm">
            {lang === 'mr' ? 'या कॅटेगरीमध्ये अद्याप कोणताही कन्टेन्ट नाही' : 'No content found in this category'}
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {lang === 'mr' 
              ? `"${selectedCategory}" कॅटेगरीमध्ये पहिला व्हिडिओ किंवा कार्यक्रम जोडण्यासाठी खालील बटणावर क्लिक करा.`
              : `Click below to add the first video or show to "${selectedCategory}".`}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 transition shadow-sm cursor-pointer"
          >
            <span>{lang === 'mr' ? `नवीन ${selectedCategory} जोडा` : `Add ${selectedCategory}`}</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-luxury">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                <th className="py-4 px-5">{lang === 'mr' ? 'बातमी व शीर्षक' : 'Content & Title'}</th>
                <th className="py-4 px-5">{lang === 'mr' ? 'जिल्हा व स्थान' : 'District & Location'}</th>
                <th className="py-4 px-5">{lang === 'mr' ? 'श्रेणी' : 'Category'}</th>
                <th className="py-4 px-5">{lang === 'mr' ? 'वार्ताहर' : 'Reporter'}</th>
                <th className="py-4 px-5">{lang === 'mr' ? 'स्थिती' : 'Status'}</th>
                <th className="py-4 px-5 text-right">{lang === 'mr' ? 'कृती' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 text-xs">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3.5">
                      <img 
                        src={getSafeImageUrl(item.poster || item.banner || (item.videoId ? `/api/bunny/thumbnail?videoId=${item.videoId}` : ''))} 
                        alt={item.title} 
                        onError={handleImageError}
                        className="w-12 h-8 rounded-lg object-cover border border-slate-200 shrink-0 shadow-sm bg-slate-100" 
                      />
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-1">{item.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{item.district || 'महाराष्ट्र'}</span>
                      {item.taluka && <span className="text-slate-400 text-[10px]">({item.taluka})</span>}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                      {item.genres?.[0] || item.subCategory || selectedCategory}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.reporterName || item.director || item.cast?.[0] || 'विशेष प्रतिनिधी'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      item.status === 'published' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {item.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => setItemForAudio(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        title={lang === 'mr' ? 'ऑडिओ जोडा' : 'Attach Audio'}
                      >
                        <Headphones className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-2xl bg-white border border-[#E5DBCA] overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                <img
                  src={getSafeImageUrl(item.poster || item.banner, DEFAULT_MOVIE_POSTER)}
                  alt={item.title}
                  onError={handleImageError}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white">
                    {item.resolution || '1080p'}
                  </span>
                  {(item.duration ?? 0) > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white">
                      {formatDuration(item.duration || 0)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewItem(item)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-white/90 text-amber-600 flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </button>
              </div>

              {/* Info */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="text-xs font-black text-slate-800 line-clamp-1 group-hover:text-amber-600 transition">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {item.description || 'कन्टेन्ट वर्णन उपलब्ध नाही.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>{item.genres?.[0] || selectedCategory}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setItemForAudio(item)}
                      title={lang === 'mr' ? 'ऑडिओ ट्रॅक जोडा' : 'Connect Audio'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                    >
                      <Headphones className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      title={lang === 'mr' ? 'संपादित करा' : 'Edit'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      title={lang === 'mr' ? 'हटवा' : 'Delete'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Content Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div 
            className="w-full max-w-2xl bg-white rounded-3xl border border-[#E5DBCA] shadow-2xl overflow-hidden animate-in zoom-in-95 text-[#2D2522]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[#E5DBCA] bg-[#FAF7F2] flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800">
                  {isEditing ? (lang === 'mr' ? 'कन्टेन्ट संपादित करा' : 'Edit Content') : (lang === 'mr' ? `नवीन ${selectedCategory} कन्टेन्ट जोडा` : `Add New ${selectedCategory} Content`)}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {lang === 'mr' ? 'Bunny.net व्हिडिओ, पोस्टर आणि माहिती प्रविष्ट करा' : 'Enter Bunny.net video, poster and details'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Content Type Toggle: Video vs Audio Podcast */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  {lang === 'mr' ? 'कन्टेन्ट प्रकार (Content Type)' : 'Content Type'} *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentItem(prev => ({ 
                      ...prev, 
                      type: 'video', 
                      resolution: prev.resolution === 'HD Audio' ? '1080p Full HD' : (prev.resolution || '1080p Full HD') 
                    }))}
                    className={cn(
                      "px-4 py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer",
                      currentItem.type !== 'podcast'
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    <Film className="w-4 h-4" />
                    <span>{lang === 'mr' ? 'व्हिडिओ (Video)' : 'Video Content'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentItem(prev => ({ 
                      ...prev, 
                      type: 'podcast', 
                      resolution: 'HD Audio', 
                      duration: prev.duration || 1800 
                    }))}
                    className={cn(
                      "px-4 py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer",
                      currentItem.type === 'podcast'
                        ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    <Headphones className="w-4 h-4" />
                    <span>{lang === 'mr' ? 'ऑडिओ पॉडकास्ट (Audio Podcast)' : 'Audio Podcast'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {lang === 'mr' ? 'शीर्षक (Title)' : 'Content Title'} *
                </label>
                <input
                  type="text"
                  required
                  value={currentItem.title || ''}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={currentItem.type === 'podcast' ? 'e.g. शेतकरी यशोगाथा / ग्राम विकास पॉडकास्ट' : 'e.g. सह्याद्रीचे वैभव / ग्राम विकास गाथा'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {lang === 'mr' ? 'वर्णन (Description)' : 'Description'}
                </label>
                <textarea
                  rows={3}
                  value={currentItem.description || ''}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={currentItem.type === 'podcast' ? 'पॉडकास्टचे सविस्तर वर्णन व विषय...' : 'कन्टेन्टचे सविस्तर वर्णन...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {lang === 'mr' ? 'कॅटेगरी (Category)' : 'Category'}
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedCategory(val);
                      if (val.toLowerCase().includes('podcast') || val.includes('पॉडकास्ट')) {
                        setCurrentItem(prev => ({ ...prev, type: 'podcast', resolution: 'HD Audio', duration: prev.duration || 1800 }));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.nameEnglish}>{c.nameEnglish} ({c.nameMarathi})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {currentItem.type === 'podcast' ? (lang === 'mr' ? 'ऑडिओ गुणवत्ता' : 'Audio Quality') : (lang === 'mr' ? 'रेझोल्युशन (Resolution)' : 'Resolution')}
                  </label>
                  <select
                    value={currentItem.resolution || (currentItem.type === 'podcast' ? 'HD Audio' : '1080p Full HD')}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, resolution: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {currentItem.type === 'podcast' ? (
                      <>
                        <option value="HD Audio (320kbps)">HD Audio (320kbps)</option>
                        <option value="Standard Audio (192kbps)">Standard Audio (192kbps)</option>
                        <option value="HD Audio">HD Audio</option>
                      </>
                    ) : (
                      <>
                        <option value="4K UHD HDR">4K UHD HDR</option>
                        <option value="1080p Full HD">1080p Full HD</option>
                        <option value="720p HD">720p HD</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* District, Taluka & Reporter/Host */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {lang === 'mr' ? 'जिल्हा (District)' : 'District'}
                  </label>
                  <select
                    value={currentItem.district || 'Pune (पुणे)'}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, district: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {MAHARASHTRA_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {lang === 'mr' ? 'तालुका (Taluka)' : 'Taluka'}
                  </label>
                  <input
                    type="text"
                    value={currentItem.taluka || ''}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, taluka: e.target.value }))}
                    placeholder="उदा. बारामती / हवेली"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {currentItem.type === 'podcast' ? (lang === 'mr' ? 'निवेदक / होस्ट (Host)' : 'Host Name') : (lang === 'mr' ? 'वार्ताहर / प्रतिनिधी (Reporter)' : 'Reporter Name')}
                  </label>
                  <input
                    type="text"
                    value={currentItem.reporterName || ''}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, reporterName: e.target.value }))}
                    placeholder={currentItem.type === 'podcast' ? 'उदा. अमोल पाटील' : 'उदा. विशेष प्रतिनिधी'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Poster / Thumbnail URL */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {currentItem.type === 'podcast' ? (lang === 'mr' ? 'पॉडकास्ट कव्हर / थंबनेल इमेज URL' : 'Podcast Cover / Art URL') : (lang === 'mr' ? 'पोस्टर / थंबनेल इमेज URL' : 'Poster / Thumbnail Image URL')}
                </label>
                <input
                  type="text"
                  value={currentItem.poster || ''}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, poster: e.target.value, banner: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Audio URL (Always highlighted when podcast) */}
              {currentItem.type === 'podcast' ? (
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-2">
                  <label className="block text-xs font-black text-rose-900 flex items-center gap-1.5">
                    <Headphones className="w-4 h-4 text-rose-600" />
                    <span>{lang === 'mr' ? 'ऑडिओ फाइल URL / Bunny.net Audio Stream (Audio Track URL) *' : 'Podcast Audio Track / Stream URL *'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={currentItem.audioTrackUrl || currentItem.audioUrl || currentItem.videoUrl || ''}
                    onChange={(e) => setCurrentItem(prev => ({ 
                      ...prev, 
                      audioTrackUrl: e.target.value, 
                      audioUrl: e.target.value,
                      videoUrl: e.target.value,
                      videoId: e.target.value 
                    }))}
                    placeholder="https://vz-92cc7e0f-cd7.b-cdn.net/audio/podcast.mp3 किंवा Bunny.net URL"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-rose-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
                  />
                  <p className="text-[11px] text-rose-700 font-medium">
                    {lang === 'mr' 
                      ? 'येथे थेट MP3/WAV लिंक किंवा Bunny.net ऑडिओ URL टाका. हे थेट अँड्रॉइड अ‍ॅपच्या पॉडकास्ट प्लेअरमध्ये प्ले होईल.'
                      : 'Provide direct MP3/WAV/HLS audio stream. Plays natively in Android Podcast Player.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Bunny.net Video Uploader */}
                  <div className="pt-2">
                    <label className="block text-xs font-black text-slate-700 mb-1.5">
                      {lang === 'mr' ? 'Bunny.net व्हिडिओ अपलोड / डायरेक्ट URL' : 'Bunny.net Video Stream GUID or URL'}
                    </label>
                    <BunnyUploader
                      type="video"
                      contentTitle={currentItem.title || selectedCategory}
                      currentValue={currentItem.videoUrl || currentItem.videoId}
                      onUploadComplete={(result) => {
                        setCurrentItem(prev => ({
                          ...prev,
                          videoId: result.urlOrGuid,
                          videoUrl: result.urlOrGuid,
                          duration: result.duration || prev.duration,
                          resolution: result.resolution || prev.resolution,
                        }));
                      }}
                    />
                  </div>

                  {/* Audio Track URL (Optional for videos) */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      {lang === 'mr' ? 'जोडलेला ऑडिओ ट्रॅक URL (पर्यायी)' : 'Connected Audio Track URL (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={currentItem.audioTrackUrl || currentItem.audioUrl || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, audioTrackUrl: e.target.value, audioUrl: e.target.value }))}
                      placeholder="https://.../audio.mp3 किंवा Bunny.net URL"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black shadow-md hover:from-amber-600 hover:to-orange-600 transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? (lang === 'mr' ? 'जतन करत आहे...' : 'Saving...') : (lang === 'mr' ? 'कन्टेन्ट सेव्ह करा' : 'Save Content')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onCategoryAdded={(newCat) => {
          setCategories(prev => [...prev, newCat]);
          setSelectedCategory(newCat.nameEnglish);
          router.replace(`/admin/media?category=${encodeURIComponent(newCat.nameEnglish)}`);
        }}
      />

      {/* Video Preview Modal */}
      {previewItem && (
        <Modal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title={previewItem.title}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <VideoPlayer
              src={previewItem.videoUrl || previewItem.videoId || ''}
              title={previewItem.title}
              poster={previewItem.poster || previewItem.banner}
              audioSrc={previewItem.audioTrackUrl || previewItem.audioUrl}
            />
            <p className="text-xs text-slate-600">{previewItem.description}</p>
          </div>
        </Modal>
      )}

      {/* Connect Audio Modal */}
      {itemForAudio && (
        <ConnectAudioModal
          isOpen={!!itemForAudio}
          onClose={() => setItemForAudio(null)}
          item={itemForAudio}
          onAudioUpdated={(updated: ContentItem) => {
            setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
            setItemForAudio(null);
          }}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={lang === 'mr' ? 'कन्टेन्ट हटवायचा आहे का?' : 'Delete Content?'}
        message={lang === 'mr' ? `"${itemToDelete?.title}" हा कन्टेन्ट कायमचा हटवला जाईल (फायरस्टोअर आणि Bunny.net वरून).` : `"${itemToDelete?.title}" will be permanently deleted from Firestore and Bunny.net.`}
        confirmText={lang === 'mr' ? 'हटवा' : 'Delete'}
        variant="danger"
      />
    </div>
  );
}

export default function MediaContentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400 font-bold">Loading...</div>}>
      <MediaContentPageInner />
    </Suspense>
  );
}
