'use client';

import React, { useState, useEffect } from 'react';
import { 
  Film, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Clock, 
  LayoutGrid, 
  List,
  Sparkles,
  Heart,
  Play,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { BunnyUploader } from '@/components/bunny-uploader';
import { VideoPlayer } from '@/components/video-player';
import { firestoreService } from '@/lib/firestore-service';
import { ContentItem } from '@/lib/types';
import { formatDuration, formatViews, slugify } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { getSafeImageUrl, handleImageError, DEFAULT_MOVIE_POSTER } from '@/lib/image-utils';

export default function MoviesPage() {
  const { canEdit, canPublish, canDelete } = useAuth();
  const { t, lang } = useLanguage();
  const [movies, setMovies] = useState<ContentItem[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [previewMovie, setPreviewMovie] = useState<ContentItem | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMovie, setCurrentMovie] = useState<Partial<ContentItem>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [movieToDelete, setMovieToDelete] = useState<ContentItem | null>(null);

  // Cast & Language temp inputs
  const [castInput, setCastInput] = useState('');
  const [genreInput, setGenreInput] = useState('');

  const genresList = [
    'मराठी चित्रपट (Marathi Movies)', 
    'हिंदी चित्रपट (Hindi Movies)', 
    'Short Films (लघुपट)', 
    'ग्रामीण कथा (Rural Stories)', 
    'सामाजिक चित्रपट (Social Films)', 
    'कॉमेडी (Comedy)', 
    'मनोरंजन कार्यक्रम (Entertainment)', 
    'ऐतिहासिक (Historical / Drama)', 
    'कलाकारांच्या मुलाखती (Interviews)'
  ];

  const loadMovies = async () => {
    setLoading(true);
    const items = await firestoreService.getContent('movie');
    setMovies(items);
    setLoading(false);
  };

  useEffect(() => {
    loadMovies();
  }, []);

  useEffect(() => {
    let result = [...movies];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(m => 
        m.title.toLowerCase().includes(term) ||
        m.director.toLowerCase().includes(term) ||
        m.cast.some(c => c.toLowerCase().includes(term))
      );
    }
    if (selectedGenre !== 'all') {
      result = result.filter(m => m.genres.includes(selectedGenre));
    }
    if (selectedStatus !== 'all') {
      result = result.filter(m => m.status === selectedStatus);
    }
    setFilteredMovies(result);
  }, [movies, searchTerm, selectedGenre, selectedStatus]);

  const handleOpenCreate = () => {
    setCurrentMovie({
      id: 'mov-' + Date.now().toString(36),
      type: 'movie',
      title: '',
      slug: '',
      description: '',
      tags: ['मराठी चित्रपट', 'OTT'],
      genres: [genresList[0]],
      cast: [],
      director: '',
      producer: '',
      language: ['मराठी (Marathi)'],
      subtitleLanguages: [],
      subtitleUrl: '',
      releaseDate: new Date().toISOString().split('T')[0],
      scheduledPublishDate: '',
      poster: '',
      banner: '',
      trailerUrl: '',
      isPremium: false,
      isFeatured: true,
      isTrending: false,
      status: 'published',
      rating: 'U/A',
      imdbScore: 0,
      views: 0,
      duration: 0,
      videoStatus: 'ready',
      resolution: '4K UHD HDR',
      videoId: '',
    });
    setCastInput('');
    setGenreInput('');
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (movie: ContentItem) => {
    setCurrentMovie({ ...movie });
    setCastInput(movie.cast?.join(', ') || '');
    setGenreInput(movie.genres?.join(', ') || '');
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMovie.title?.trim()) {
      alert('कृपया चित्रपटाचे नाव (Movie Title) प्रविष्ट करा.');
      return;
    }
    setIsSaving(true);

    try {
      const castArray = castInput.split(',').map(s => s.trim()).filter(Boolean);
      const genreArray = genreInput.split(',').map(s => s.trim()).filter(Boolean);

      const movieToSave: ContentItem = {
        id: currentMovie.id || 'mov-' + Date.now().toString(36),
        type: 'movie',
        title: currentMovie.title.trim(),
        slug: currentMovie.slug || slugify(currentMovie.title.trim()),
        description: currentMovie.description || '',
        tags: currentMovie.tags || [],
        genres: genreArray.length ? genreArray : currentMovie.genres || ['Action'],
        cast: castArray.length ? castArray : currentMovie.cast || [],
        director: currentMovie.director || '',
        producer: currentMovie.producer || '',
        language: currentMovie.language || ['मराठी (Marathi)'],
        subtitleLanguages: currentMovie.subtitleLanguages || [],
        subtitleUrl: currentMovie.subtitleUrl || '',
        releaseDate: currentMovie.releaseDate || new Date().toISOString().split('T')[0],
        scheduledPublishDate: currentMovie.scheduledPublishDate || '',
        poster: currentMovie.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
        banner: currentMovie.banner || currentMovie.poster || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
        trailerUrl: currentMovie.trailerUrl || '',
        isPremium: currentMovie.isPremium ?? true,
        isFeatured: !!currentMovie.isFeatured,
        isTrending: !!currentMovie.isTrending,
        status: currentMovie.status || 'published',
        rating: currentMovie.rating || 'U/A',
        imdbScore: Number(currentMovie.imdbScore) || 0,
        views: currentMovie.views || 0,
        duration: currentMovie.duration || 5400,
        videoId: currentMovie.videoId || '',
        videoStatus: 'ready',
        resolution: currentMovie.resolution || '4K UHD HDR',
        createdAt: currentMovie.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await firestoreService.saveContent(movieToSave);
      setIsModalOpen(false);
      await loadMovies();
    } catch (err) {
      console.error('Save movie error:', err);
      alert('Could not save movie. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!movieToDelete) return;
    await firestoreService.deleteContent(movieToDelete.id);
    setMovieToDelete(null);
    loadMovies();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2D2522] tracking-tight flex items-center gap-2.5">
            <Film className="w-7 h-7 text-[#E11D48]" />
            {t('pageTitleMovies')}
          </h1>
          <p className="text-sm text-[#7A6F68] mt-1">
            {t('moviesDescText')}
          </p>
        </div>
        {canEdit && (
          <Button variant="primary" onClick={handleOpenCreate} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> {lang === 'mr' ? 'नवीन चित्रपट जोडा' : lang === 'hi' ? 'नई फ़िल्म जोड़ें' : 'Add Movie'}
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#E5DBCA] p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 shadow-soft">
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="w-4 h-4 text-[#7A6F68] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                lang === 'mr'
                  ? 'चित्रपट शीर्षक, दिग्दर्शक किंवा कलाकारांनुसार शोधा...'
                  : lang === 'hi'
                  ? 'फ़िल्म शीर्षक, निर्देशक या कलाकारों के नाम से खोजें...'
                  : 'Search by title, director, cast...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-full pl-11 pr-4 py-2 text-xs text-[#2D2522] placeholder-[#A89C94] focus:outline-none focus:border-[#F472B6] focus:bg-white transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="flex-1 sm:flex-initial bg-[#FAF7F2] border border-[#E5DBCA] rounded-full px-3.5 py-2 text-xs font-semibold text-[#6E6259] focus:outline-none focus:border-[#F472B6] cursor-pointer shadow-soft truncate"
            >
              <option value="all">{t('filterAllGenres')}</option>
              {genresList.map(g => {
                const cleanG = lang === 'mr' || lang === 'hi' ? g.split(' (')[0] : (g.match(/\((.*?)\)/)?.[1] || g);
                return (
                  <option key={g} value={g}>{cleanG}</option>
                );
              })}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 sm:flex-initial bg-[#FAF7F2] border border-[#E5DBCA] rounded-full px-3.5 py-2 text-xs font-semibold text-[#6E6259] focus:outline-none focus:border-[#F472B6] cursor-pointer shadow-soft"
            >
              <option value="all">{t('filterAllStatus')}</option>
              <option value="published">{t('statusPublished')}</option>
              <option value="draft">{t('statusDraft')}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-full border transition-colors ${
              viewMode === 'grid'
                ? 'bg-[#FDF2F8] border-[#FBCFE8] text-[#BE185D]'
                : 'bg-white border-[#E5DBCA] text-[#7A6F68] hover:text-[#2D2522]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-full border transition-colors ${
              viewMode === 'table'
                ? 'bg-[#FDF2F8] border-[#FBCFE8] text-[#BE185D]'
                : 'bg-white border-[#E5DBCA] text-[#7A6F68] hover:text-[#2D2522]'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMovies.map((movie) => (
            <div
              key={movie.id}
              className="group relative rounded-3xl bg-white border border-[#E5DBCA] overflow-hidden hover:border-[#F472B6] hover:shadow-soft-lg transition-all duration-300 flex flex-col shadow-soft"
            >
              {/* Poster Image */}
              <div className="relative aspect-[2/3] w-full bg-[#F5EFE6] overflow-hidden">
                <img
                  src={getSafeImageUrl(movie.poster || movie.banner || (movie.videoId ? `/api/bunny/thumbnail?videoId=${movie.videoId}` : ''), DEFAULT_MOVIE_POSTER)}
                  alt={movie.title}
                  onError={(e) => handleImageError(e, DEFAULT_MOVIE_POSTER)}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2D2522]/80 via-transparent to-black/30" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <Badge variant={movie.isPremium ? 'sakura' : 'secondary'} size="sm">
                    {movie.isPremium ? t('tierPremium') : t('tierFree')}
                  </Badge>
                  <Badge variant={movie.status === 'published' ? 'matcha' : 'secondary'} size="sm">
                    {movie.status === 'published' ? t('statusPublished') : movie.status === 'draft' ? t('statusDraft') : movie.status}
                  </Badge>
                </div>

                {/* Center Play Button on hover */}
                <button
                  onClick={() => setPreviewMovie(movie)}
                  className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#E11D48] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110 shadow-glow-crimson cursor-pointer z-10"
                  title="Test Play Movie"
                >
                  <Play className="w-5 h-5 fill-white translate-x-0.5" />
                </button>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                  <span className="flex items-center gap-1 font-mono text-[11px] bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                    <Clock className="w-3 h-3 text-[#F472B6]" /> {formatDuration(movie.duration || 0)}
                  </span>
                  {movie.resolution && (
                    <span className="text-[10px] font-bold bg-[#E11D48] px-2 py-0.5 rounded-full uppercase">
                      {movie.resolution}
                    </span>
                  )}
                </div>
              </div>

              {/* Details Card Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-extrabold text-[#2D2522] text-base truncate group-hover:text-[#BE123C] transition-colors">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-[#7A6F68] mt-0.5 truncate">
                    {movie.director} · {movie.releaseDate?.substring(0, 4)}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {movie.genres.slice(0, 3).map((g) => (
                      <span key={g} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E5DBCA] text-[#7A6F68]">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bunny Stream GUID indicator */}
                <div className="pt-3 border-t border-[#E5DBCA] flex items-center justify-between text-xs">
                  <div className="truncate max-w-[120px] text-[10px] font-mono text-[#A89C94]">
                    {movie.videoId || 'No Bunny GUID'}
                  </div>
                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <button
                        onClick={() => handleOpenEdit(movie)}
                        className="p-1.5 rounded-full text-[#7A6F68] hover:text-[#2D2522] hover:bg-[#F5EFE6] transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setMovieToDelete(movie)}
                        className="p-1.5 rounded-full text-[#7A6F68] hover:text-[#BE123C] hover:bg-[#FEE2E2] transition-colors"
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
      ) : (
        /* Table View */
        <div className="rounded-3xl bg-white border border-[#E5DBCA] p-4 overflow-x-auto shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-[#7A6F68] border-b border-[#E5DBCA]">
              <tr>
                <th className="pb-3 font-bold">Movie</th>
                <th className="pb-3 font-bold">Genres</th>
                <th className="pb-3 font-bold">Duration</th>
                <th className="pb-3 font-bold">Bunny Video GUID</th>
                <th className="pb-3 font-bold">Tier</th>
                <th className="pb-3 font-bold">Status</th>
                <th className="pb-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DBCA]/60">
              {filteredMovies.map((movie) => (
                <tr key={movie.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-14 rounded-xl bg-[#F5EFE6] overflow-hidden shrink-0 border border-[#E5DBCA] shadow-sm">
                        <img 
                          src={getSafeImageUrl(movie.poster || movie.banner || (movie.videoId ? `/api/bunny/thumbnail?videoId=${movie.videoId}` : ''), DEFAULT_MOVIE_POSTER)} 
                          alt={movie.title} 
                          onError={(e) => handleImageError(e, DEFAULT_MOVIE_POSTER)}
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <p className="font-bold text-[#2D2522]">{movie.title}</p>
                        <p className="text-xs text-[#7A6F68]">{movie.director} · {movie.releaseDate?.substring(0, 4)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-xs text-[#6E6259] font-medium">
                    {movie.genres.join(', ')}
                  </td>
                  <td className="py-3 text-xs text-[#2D2522] font-mono font-bold">
                    {formatDuration(movie.duration || 0)}
                  </td>
                  <td className="py-3 text-xs font-mono text-[#7A6F68]">
                    {movie.videoId || 'Not linked'}
                  </td>
                  <td className="py-3">
                    <Badge variant={movie.isPremium ? 'sakura' : 'secondary'} size="sm">
                      {movie.isPremium ? 'Premium' : 'Free'}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Badge variant={movie.status === 'published' ? 'matcha' : 'secondary'} size="sm">
                      {movie.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setPreviewMovie(movie)}
                        title="Preview Play Video"
                        className="p-1.5 rounded-full text-[#7A6F68] hover:text-[#E11D48] hover:bg-[#FDF2F8]"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(movie)}
                          className="p-1.5 rounded-full text-[#7A6F68] hover:text-[#2D2522] hover:bg-[#F5EFE6]"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setMovieToDelete(movie)}
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
      )}

      {/* Add / Edit Movie Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? (lang === 'mr' ? 'चित्रपट माहिती संपादित करा' : lang === 'hi' ? 'फ़िल्म विवरण संपादित करें' : 'Edit Movie Metadata') : (lang === 'mr' ? 'नवीन चित्रपट Bunny Stream वर अपलोड करा' : lang === 'hi' ? 'नई फ़िल्म Bunny Stream पर अपलोड करें' : 'Upload New Movie to Bunny Stream')}
        description={lang === 'mr' ? 'चित्रपटाचा तपशील भरा आणि उच्च दर्जाचा व्हिडिओ थेट अपलोड करा.' : lang === 'hi' ? 'फ़िल्म का विवरण भरें और वीडियो सीधे अपलोड करें।' : 'Fill movie details and upload high-bitrate video directly to Bunny Stream.'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'चित्रपटाचे नाव *' : lang === 'hi' ? 'फ़िल्म का नाम *' : 'Movie Title *'}
              </label>
              <input
                type="text"
                required
                value={currentMovie.title || ''}
                onChange={(e) => {
                  const title = e.target.value;
                  setCurrentMovie({
                    ...currentMovie,
                    title,
                    slug: slugify(title),
                  });
                }}
                placeholder={lang === 'mr' ? 'उदा. सैराट / नटसम्राट' : lang === 'hi' ? 'उदा. सैराट / नटसम्राट' : 'e.g. Sairat / Natsamrat'}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'URL स्लग' : lang === 'hi' ? 'URL स्लग' : 'URL Slug'}
              </label>
              <input
                type="text"
                value={currentMovie.slug || ''}
                onChange={(e) => setCurrentMovie({ ...currentMovie, slug: e.target.value })}
                placeholder="e.g. sairat-2024"
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#7A6F68] font-mono focus:outline-none focus:border-[#F472B6] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
              {lang === 'mr' ? 'कथासार / सविस्तर माहिती' : lang === 'hi' ? 'कथासार / विवरण' : 'Synopsis / Description'}
            </label>
            <textarea
              rows={3}
              value={currentMovie.description || ''}
              onChange={(e) => setCurrentMovie({ ...currentMovie, description: e.target.value })}
              placeholder={lang === 'mr' ? 'चित्रपटाचा कथासार, विषय आणि सारांश लिहा...' : lang === 'hi' ? 'फ़िल्म का कथासार और विवरण लिखें...' : 'Describe the storyline, premise and themes...'}
              className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white resize-none"
            />
          </div>

          {/* Video Direct Upload to Bunny Stream */}
          <div className="p-4 rounded-3xl bg-[#FAF7F2] border border-[#E5DBCA] space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#2D2522] flex items-center gap-2">
                <Film className="w-4 h-4 text-[#E11D48]" /> Bunny Stream Video Integration
              </h4>
              <div className="flex items-center gap-1.5 text-[10px] text-[#7A6F68] font-bold">
                <span className="px-2 py-0.5 rounded-full bg-white border border-[#E5DBCA]">Lib: 767488</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">ABR 4K/HD</span>
              </div>
            </div>

            <BunnyUploader
              type="video"
              currentValue={currentMovie.videoId}
              label={lang === 'mr' ? 'Bunny Stream व्हिडिओ फाईल' : lang === 'hi' ? 'Bunny Stream वीडियो फ़ाइल' : 'Bunny Stream Video File'}
              onUploadComplete={(res) => {
                setCurrentMovie({
                  ...currentMovie,
                  videoId: res.urlOrGuid,
                  duration: res.duration || currentMovie.duration,
                  resolution: res.resolution || currentMovie.resolution,
                  videoStatus: 'ready',
                });
              }}
            />

            {/* Direct Video ID / URL Input with Test Preview */}
            <div className="pt-2 border-t border-[#E5DBCA]/60 space-y-1.5">
              <label className="text-[11px] font-bold text-[#7A6F68] block">
                {lang === 'mr' ? 'व्हिडिओ ID / Bunny Video GUID / URL' : lang === 'hi' ? 'वीडियो ID / Bunny Video GUID / URL' : 'Bunny Video GUID, Embed Code or Stream URL'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentMovie.videoId || ''}
                  onChange={(e) => {
                    const rawVal = e.target.value.trim();
                    const iframeMatch = rawVal.match(/src=["']([^"']+)["']/i);
                    setCurrentMovie({ ...currentMovie, videoId: iframeMatch ? iframeMatch[1] : e.target.value });
                  }}
                  placeholder="e.g. 737060-guid, https://iframe.mediadelivery.net/embed/..., or .m3u8/.mp4"
                  className="flex-1 bg-white border border-[#E5DBCA] rounded-2xl px-4 py-2 text-xs font-mono text-[#2D2522] focus:outline-none focus:border-[#F472B6]"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!currentMovie.videoId && !currentMovie.title) {
                      alert('कृपया आधी Video ID किंवा Title प्रविष्ट करा.');
                      return;
                    }
                    setPreviewMovie({
                      ...currentMovie,
                      id: currentMovie.id || 'preview-test',
                      type: 'movie',
                      title: currentMovie.title || 'Bunny Stream Preview',
                      videoId: currentMovie.videoId || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                    } as ContentItem);
                  }}
                  className="shrink-0 text-xs flex items-center gap-1.5 border-[#E11D48] text-[#E11D48] hover:bg-[#FDF2F8]"
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

          {/* Director & Producer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'दिग्दर्शक *' : lang === 'hi' ? 'निर्देशक *' : 'Director *'}
              </label>
              <input
                type="text"
                value={currentMovie.director || ''}
                onChange={(e) => setCurrentMovie({ ...currentMovie, director: e.target.value })}
                placeholder={lang === 'mr' ? 'उदा. नागराज मंजुळे / प्रवीण तरडे' : lang === 'hi' ? 'उदा. नागराज मंजुले' : 'e.g. Christopher Nolan'}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'निर्माता' : lang === 'hi' ? 'निर्माता' : 'Producer'}
              </label>
              <input
                type="text"
                value={currentMovie.producer || ''}
                onChange={(e) => setCurrentMovie({ ...currentMovie, producer: e.target.value })}
                placeholder={lang === 'mr' ? 'उदा. ग्रामीण भारत टीव्ही प्रॉडक्शन' : lang === 'hi' ? 'उदा. ग्रामीण भारत टीवी प्रोडक्शन' : 'e.g. Gramin Bharat TV Productions'}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white"
              />
            </div>
          </div>

          {/* Official Trailer URL */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
              {lang === 'mr' ? 'अधिकृत ट्रेलर लिंक' : lang === 'hi' ? 'आधिकारिक ट्रेलर लिंक' : 'Official Trailer URL'}
            </label>
            <input
              type="url"
              value={currentMovie.trailerUrl || ''}
              onChange={(e) => setCurrentMovie({ ...currentMovie, trailerUrl: e.target.value })}
              placeholder={lang === 'mr' ? 'https://www.youtube.com/watch?v=... किंवा Bunny Stream Link' : lang === 'hi' ? 'https://www.youtube.com/watch?v=... या Bunny Stream Link' : 'https://www.youtube.com/watch?v=... or Bunny Stream Link'}
              className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white"
            />
          </div>

          {/* Cast & Genres */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'कलाकार (स्वल्पविरामाने वेगळे करा)' : lang === 'hi' ? 'कलाकार (अल्पविराम से अलग करें)' : 'Cast / Artists (Comma separated)'}
              </label>
              <input
                type="text"
                value={castInput}
                onChange={(e) => setCastInput(e.target.value)}
                placeholder={lang === 'mr' ? 'उदा. मकरंद अनासपुरे, रिंकू राजगुरू' : lang === 'hi' ? 'उदा. मकरंद अनासपुरे, रिंकू राजगुरु' : 'e.g. Leonardo DiCaprio, Cillian Murphy'}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'प्रकार (स्वल्पविरामाने वेगळे करा)' : lang === 'hi' ? 'श्रेणी (अल्पविराम से अलग करें)' : 'Genres (Comma separated)'}
              </label>
              <input
                type="text"
                value={genreInput}
                onChange={(e) => setGenreInput(e.target.value)}
                placeholder={lang === 'mr' ? 'मराठी चित्रपट, ग्रामीण कथा, सामाजिक' : lang === 'hi' ? 'हिंदी फ़िल्म, ग्रामीण कथा, सामाजिक' : 'Action, Drama, Thriller'}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white"
              />
            </div>
          </div>

          {/* Languages & Subtitles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'ऑडिओ भाषा' : lang === 'hi' ? 'ऑडियो भाषा' : 'Audio Language'}
              </label>
              <select
                value={(currentMovie.language && currentMovie.language[0]) || 'Marathi'}
                onChange={(e) => setCurrentMovie({ ...currentMovie, language: [e.target.value] })}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white"
              >
                <option value="मराठी (Marathi)">{lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'मराठी' : 'Marathi'}</option>
                <option value="हिंदी (Hindi)">{lang === 'mr' ? 'हिंदी' : lang === 'hi' ? 'हिंदी' : 'Hindi'}</option>
                <option value="English">English</option>
                <option value="मराठी + हिंदी (Dual Audio)">{lang === 'mr' ? 'मराठी + हिंदी' : lang === 'hi' ? 'मराठी + हिंदी' : 'Dual Audio (Marathi + Hindi)'}</option>
                <option value="इतर भारतीय भाषा (Other Indian)">{lang === 'mr' ? 'इतर भाषा' : lang === 'hi' ? 'अन्य भाषा' : 'Other Language'}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'सबटायटल्स' : lang === 'hi' ? 'उपशीर्षक (सबटाइटल्स)' : 'Subtitles / Captions'}
              </label>
              <select
                value={(currentMovie.subtitleLanguages && currentMovie.subtitleLanguages[0]) || 'None'}
                onChange={(e) => setCurrentMovie({ ...currentMovie, subtitleLanguages: e.target.value === 'None' ? [] : [e.target.value] })}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white"
              >
                <option value="None">{lang === 'mr' ? 'सबटायटल्स नाहीत' : lang === 'hi' ? 'कोई उपशीर्षक नहीं' : 'No Subtitles'}</option>
                <option value="Marathi (मराठी)">{lang === 'mr' ? 'मराठी सबटायटल' : lang === 'hi' ? 'मराठी सबटाइटल' : 'Marathi Subtitles'}</option>
                <option value="English (इंग्रजी)">{lang === 'mr' ? 'इंग्रजी सबटायटल' : lang === 'hi' ? 'अंग्रेज़ी सबटाइटल' : 'English Subtitles'}</option>
                <option value="Hindi (हिंदी)">{lang === 'mr' ? 'हिंदी सबटायटल' : lang === 'hi' ? 'हिंदी सबटाइटल' : 'Hindi Subtitles'}</option>
                <option value="मराठी + English">{lang === 'mr' ? 'मराठी + इंग्रजी' : lang === 'hi' ? 'मराठी + अंग्रेज़ी' : 'Marathi + English'}</option>
              </select>
            </div>
          </div>

          {/* Subtitle File URL */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
              {lang === 'mr' ? 'सबटायटल फाइल लिंक (.VTT / .SRT)' : lang === 'hi' ? 'उपशीर्षक फ़ाइल लिंक (.VTT / .SRT)' : 'Subtitle Track URL (.VTT / .SRT)'}
            </label>
            <input
              type="url"
              value={currentMovie.subtitleUrl || ''}
              onChange={(e) => setCurrentMovie({ ...currentMovie, subtitleUrl: e.target.value })}
              placeholder="https://vz-1192802e-f33.b-cdn.net/subtitles/movie_marathi.vtt"
              className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white font-mono text-xs"
            />
          </div>

          {/* Dates & Rating */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'प्रदर्शित तारीख' : lang === 'hi' ? 'रिलीज़ तिथि' : 'Release Date'}
              </label>
              <input
                type="date"
                value={currentMovie.releaseDate || ''}
                onChange={(e) => setCurrentMovie({ ...currentMovie, releaseDate: e.target.value })}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'नियोजित तारीख' : lang === 'hi' ? 'निर्धारित प्रकाशन' : 'Schedule Publish'}
              </label>
              <input
                type="datetime-local"
                value={currentMovie.scheduledPublishDate || ''}
                onChange={(e) => setCurrentMovie({ ...currentMovie, scheduledPublishDate: e.target.value })}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                {lang === 'mr' ? 'वय मर्यादा' : lang === 'hi' ? 'आयु सीमा' : 'Age Rating'}
              </label>
              <select
                value={currentMovie.rating || 'U/A'}
                onChange={(e) => setCurrentMovie({ ...currentMovie, rating: e.target.value })}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white"
              >
                <option value="U/A">{lang === 'mr' ? 'U/A (सर्व वयोगटांसाठी)' : lang === 'hi' ? 'U/A (सभी आयु वर्ग)' : 'U/A (Family)'}</option>
                <option value="U">{lang === 'mr' ? 'U (बालक व परिवार)' : lang === 'hi' ? 'U (सार्वजनिक)' : 'U (Universal)'}</option>
                <option value="PG-13">PG-13</option>
                <option value="16+">16+</option>
                <option value="18+">{lang === 'mr' ? '18+ / A (प्रौढांसाठी)' : lang === 'hi' ? '18+ / A (वयस्कों के लिए)' : '18+ / A (Adults Only)'}</option>
              </select>
            </div>
          </div>

          {/* Posters & Banner URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BunnyUploader
              type="image"
              currentValue={currentMovie.poster}
              label={lang === 'mr' ? 'पोस्टर आर्ट (Portrait 2:3)' : lang === 'hi' ? 'पोस्टर आर्ट (Portrait 2:3)' : 'Poster Art (Portrait 2:3)'}
              onUploadComplete={(res) => setCurrentMovie({ ...currentMovie, poster: res.urlOrGuid })}
            />

            <BunnyUploader
              type="image"
              currentValue={currentMovie.banner}
              label={lang === 'mr' ? 'बॅनर / बॅकड्रॉप (Landscape 16:9)' : lang === 'hi' ? 'बैनर / बैकड्रॉप (Landscape 16:9)' : 'Banner Backdrop (Landscape 16:9)'}
              onUploadComplete={(res) => setCurrentMovie({ ...currentMovie, banner: res.urlOrGuid })}
            />
          </div>

          {/* Toggles */}
          <div className="p-4 rounded-3xl bg-[#FAF7F2] border border-[#E5DBCA] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!currentMovie.isPremium}
                onChange={(e) => setCurrentMovie({ ...currentMovie, isPremium: e.target.checked })}
                className="w-4 h-4 rounded-full text-[#E11D48] focus:ring-[#F472B6]"
              />
              <span className="text-sm font-bold text-[#2D2522]">{lang === 'mr' ? 'प्रीमियम वर्गणी' : lang === 'hi' ? 'प्रीमियम' : 'Premium Only'}</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!currentMovie.isFeatured}
                onChange={(e) => setCurrentMovie({ ...currentMovie, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded-full text-[#E11D48] focus:ring-[#F472B6]"
              />
              <span className="text-sm font-bold text-[#2D2522]">{lang === 'mr' ? 'मुख्य पानावर' : lang === 'hi' ? 'मुख्य पृष्ठ पर' : 'Featured'}</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!currentMovie.isTrending}
                onChange={(e) => setCurrentMovie({ ...currentMovie, isTrending: e.target.checked })}
                className="w-4 h-4 rounded-full text-[#E11D48] focus:ring-[#F472B6]"
              />
              <span className="text-sm font-bold text-[#2D2522]">{lang === 'mr' ? 'ट्रेंडिंग' : lang === 'hi' ? 'ट्रेंडिंग' : 'Trending'}</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#7A6F68]">{lang === 'mr' ? 'स्थिती:' : lang === 'hi' ? 'स्थिति:' : 'Status:'}</span>
              <select
                value={currentMovie.status || 'published'}
                onChange={(e) => setCurrentMovie({ ...currentMovie, status: e.target.value as any })}
                disabled={!canPublish}
                className="bg-white border border-[#E5DBCA] rounded-full px-3 py-1 text-xs text-[#2D2522] focus:outline-none focus:border-[#F472B6]"
              >
                <option value="published">{lang === 'mr' ? 'प्रसिद्ध' : lang === 'hi' ? 'प्रकाशित' : 'Published'}</option>
                <option value="draft">{lang === 'mr' ? 'मसुदा' : lang === 'hi' ? 'ड्राफ्ट' : 'Draft'}</option>
                <option value="archived">{lang === 'mr' ? 'संग्रहित' : lang === 'hi' ? 'अभिलेखागार' : 'Archived'}</option>
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-4 pb-1 border-t border-[#E5DBCA] -mx-1 px-1 flex items-center justify-end gap-3 z-10">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t('cancelBtn')}
            </Button>
            <Button type="submit" variant="primary" loading={isSaving}>
              {isEditing 
                ? (lang === 'mr' ? 'बदल जतन करा' : lang === 'hi' ? 'बदलाव सहेजें' : 'Save Changes') 
                : (lang === 'mr' ? 'चित्रपट प्रसिद्ध करा' : lang === 'hi' ? 'फ़िल्म प्रकाशित करें' : 'Publish Movie')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!movieToDelete}
        onClose={() => setMovieToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={t('deleteMovie')}
        message={movieToDelete ? `${t('deleteConfirmMovie')} (${movieToDelete.title})` : t('deleteConfirmMovie')}
        confirmText={t('deleteMovie')}
      />

      {/* Video Preview Modal */}
      {previewMovie && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-4xl bg-black rounded-3xl border border-[#E5DBCA]/30 shadow-2xl overflow-hidden p-3 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-white px-2">
              <h3 className="font-bold text-sm truncate flex items-center gap-2">
                <Film className="w-4 h-4 text-[#EA580C]" /> {previewMovie.title} - Bunny Stream
              </h3>
              <button 
                onClick={() => setPreviewMovie(null)} 
                className="p-1.5 rounded-full bg-white/10 hover:bg-[#EA580C] text-white transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <VideoPlayer
              src={previewMovie.videoId || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
              poster={previewMovie.poster || previewMovie.banner}
              autoPlay={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
