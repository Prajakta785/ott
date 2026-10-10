'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, 
  Music, 
  Play, 
  Pause, 
  Upload, 
  Check, 
  AlertCircle, 
  X, 
  Sparkles, 
  Film, 
  Tv, 
  Newspaper, 
  Radio, 
  Link as LinkIcon, 
  Trash2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { ContentItem } from '@/lib/types';
import { firestoreService } from '@/lib/firestore-service';
import { useLanguage } from '@/lib/i18n';
import { VideoPlayer } from '@/components/video-player';

export interface ConnectAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ContentItem | null;
  onAudioUpdated?: (updated: ContentItem) => void;
}

export function ConnectAudioModal({
  isOpen,
  onClose,
  item,
  onAudioUpdated
}: ConnectAudioModalProps) {
  const { lang } = useLanguage();

  const [audioUrl, setAudioUrl] = useState<string>('');
  const [audioTitle, setAudioTitle] = useState<string>('');
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showVideoPreview, setShowVideoPreview] = useState<boolean>(false);

  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Marathi Regional Audio Presets
  const regionalPresets = [
    {
      id: 'preset-farmer',
      title: 'शेतकरी यशोगाथा (Progressive Farmer Podcast Audio)',
      url: '/audio/progressive_farmer_podcast.wav',
      category: 'पॉडकास्ट / मुलाखत',
      desc: 'प्रगतीशील शेतकरी यशोगाथा व कृषी अनुभव संवाद',
    },
    {
      id: 'preset-kaali-maati',
      title: 'काळी माती - मराठी मालिका पार्श्वसंगीत व संवाद',
      url: '/audio/kaali_maati_marathi_track.wav',
      category: 'वेब सिरीज / नाटक',
      desc: 'ग्रामीण जीवनावरील भावनिक पार्श्वसंगीत व संवाद',
    },
    {
      id: 'preset-agri-scheme',
      title: 'कृषी योजना विशेष बातमी समालोचन (Agri News Bulletin)',
      url: '/audio/agri_scheme_commentary.wav',
      category: 'बातम्या / विशेष वृत्त',
      desc: 'महाराष्ट्रातील शेतकरी शासकीय योजना समालोचन',
    },
    {
      id: 'preset-live-stream',
      title: 'ग्रामीण भारत थेट ऑडिओ (Live TV Broadcast Feed)',
      url: '/audio/gramin_live_broadcast.wav',
      category: 'थेट प्रक्षेपण (Live TV)',
      desc: 'ग्रामीण भारत वृत्तवाहिनीचे थेट ऑडिओ प्रक्षेपण',
    },
  ];

  useEffect(() => {
    if (item) {
      setAudioUrl(item.audioUrl || item.audioTrackUrl || '');
      setAudioTitle(item.audioLanguages?.[0] || 'मराठी ऑडिओ ट्रॅक');
      setIsPlayingPreview(false);
      setSaveSuccess(false);
      setShowVideoPreview(false);
    }
  }, [item, isOpen]);

  // Handle Audio Preview Play/Pause
  const toggleAudioPreview = () => {
    if (!audioUrl) return;
    if (isPlayingPreview) {
      audioPreviewRef.current?.pause();
      setIsPlayingPreview(false);
    } else {
      if (!audioPreviewRef.current) {
        audioPreviewRef.current = new Audio(audioUrl);
        audioPreviewRef.current.onended = () => setIsPlayingPreview(false);
        audioPreviewRef.current.onerror = () => {
          setIsPlayingPreview(false);
          alert(lang === 'mr' ? 'ऑडिओ प्ले करण्यास अडचण आली. कृपया URL तपासा.' : 'Could not play audio. Please verify URL.');
        };
      } else {
        audioPreviewRef.current.src = audioUrl;
      }
      audioPreviewRef.current.play().then(() => {
        setIsPlayingPreview(true);
      }).catch(() => {
        setIsPlayingPreview(false);
      });
    }
  };

  // Stop preview when modal closes
  useEffect(() => {
    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle Preset Select
  const handleSelectPreset = (preset: typeof regionalPresets[0]) => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    }
    setAudioUrl(preset.url);
    setAudioTitle(preset.title);
  };

  // Handle File Upload to Bunny Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const cleanFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const uploadUrl = `/api/bunny/stream?path=audio/${cleanFileName}`;

      const res = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
      });

      if (res.ok || res.status === 201) {
        const publicAudioUrl = `/api/bunny/stream?path=audio/${cleanFileName}`;
        setAudioUrl(publicAudioUrl);
        setAudioTitle(file.name.replace(/\.[^/.]+$/, ''));
        alert(lang === 'mr' ? 'ऑडिओ फाइल Bunny Storage वर यशस्वीपणे अपलोड झाली!' : 'Audio uploaded to Bunny Storage successfully!');
      } else {
        // Fallback: create object URL or local stream path
        const fallbackUrl = `/audio/${file.name}`;
        setAudioUrl(fallbackUrl);
        setAudioTitle(file.name);
      }
    } catch (err: any) {
      console.warn('Upload notice:', err);
      alert(lang === 'mr' ? 'ऑडिओ फाइल अपलोड त्रुटी: ' + err.message : 'Audio upload error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Save Audio Connection
  const handleSaveConnection = async () => {
    if (!item) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updatedItem: ContentItem = {
        ...item,
        audioUrl: audioUrl.trim(),
        audioTrackUrl: audioUrl.trim(),
        audioLanguages: audioUrl.trim() ? ['मराठी (Marathi)'] : [],
        updatedAt: new Date().toISOString()
      };

      await firestoreService.saveContent(updatedItem);

      // Also sync to server-store.json via API
      try {
        await fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedItem),
        });
      } catch {}

      setSaveSuccess(true);
      onAudioUpdated?.(updatedItem);

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      alert(lang === 'mr' ? 'ऑडिओ सेव्ह करण्यात अडचण: ' + err.message : 'Failed to save audio: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Disconnect Audio
  const handleDisconnectAudio = async () => {
    if (!item) return;
    if (confirm(lang === 'mr' ? 'या व्हिडिओतून जोडलेला ऑडिओ ट्रॅक काढायचा आहे का?' : 'Disconnect audio track from this video?')) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        setIsPlayingPreview(false);
      }
      setAudioUrl('');
      setAudioTitle('');
      const updatedItem: ContentItem = {
        ...item,
        audioUrl: '',
        audioTrackUrl: '',
        updatedAt: new Date().toISOString()
      };
      await firestoreService.saveContent(updatedItem);
      try {
        await fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedItem),
        });
      } catch {}
      onAudioUpdated?.(updatedItem);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lang === 'mr' ? 'व्हिडिओला ऑडिओ ट्रॅक कनेक्ट करा' : 'Connect Audio Track to Video'}
      description={lang === 'mr' 
        ? `"${item.title}" या व्हिडिओसाठी स्वतंत्र ऑडिओ किंवा मराठी पार्श्वसंगीत ट्रॅक जोडा.` 
        : `Connect a synchronized audio track or Marathi voiceover to "${item.title}".`}
      maxWidth="2xl"
    >
      <div className="space-y-5 py-2">
        {/* Selected Video Summary Banner */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100/60 border border-orange-200/80 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-14 rounded-xl bg-orange-500/20 border border-orange-300 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
              {item.poster || item.banner ? (
                <img src={item.poster || item.banner} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <Film className="w-6 h-6 text-orange-600" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-600 text-white">
                  {item.type}
                </span>
                <span className="text-[10px] font-bold text-orange-800 bg-orange-200/60 px-2 py-0.5 rounded-full">
                  {item.videoId ? `Bunny GUID: ${item.videoId.substring(0, 8)}...` : 'HLS Stream'}
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900 truncate mt-1">{item.title}</h4>
              <p className="text-xs text-slate-600 truncate">{item.director || 'ग्रामीण भारत TV'} · {item.genres?.join(', ')}</p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowVideoPreview(!showVideoPreview)}
            className="shrink-0 bg-white hover:bg-orange-600 hover:text-white border-orange-300 text-orange-700 font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Play className="w-3.5 h-3.5 fill-current mr-1" />
            {showVideoPreview ? (lang === 'mr' ? 'प्लेअर लपवा' : 'Hide Player') : (lang === 'mr' ? 'व्हिडिओ प्ले करा' : 'Play Video')}
          </Button>
        </div>

        {/* Video Preview Player with Synced Audio (collapsible) */}
        {showVideoPreview && (
          <div className="p-3 bg-black rounded-3xl border border-slate-800 shadow-xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between pb-2 px-1 text-white">
              <span className="text-xs font-bold flex items-center gap-2 text-emerald-400">
                <Music className="w-3.5 h-3.5 animate-pulse" />
                {audioUrl ? (lang === 'mr' ? 'ऑडिओसह थेट सिंक्रोनाइझ प्लेबॅक' : 'Playing Video with Synced Audio') : (lang === 'mr' ? 'केवळ व्हिडिओ (ऑडिओ कनेक्ट केलेला नाही)' : 'Video Only (No Audio Connected)')}
              </span>
              <button 
                onClick={() => setShowVideoPreview(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <VideoPlayer
              src={item.videoUrl || item.videoId || ''}
              audioSrc={audioUrl}
              audioTitle={audioTitle || 'मराठी ऑडिओ ट्रॅक'}
              poster={item.poster || item.banner}
              title={item.title}
              autoPlay={true}
            />
          </div>
        )}

        {/* Current Audio Status Card */}
        <div className={`p-4 rounded-2xl border transition-all ${
          audioUrl 
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 shadow-xs' 
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                audioUrl ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
              }`}>
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black">
                  {audioUrl 
                    ? (lang === 'mr' ? 'ऑडिओ ट्रॅक जोडलेला आहे (Connected)' : 'Audio Track Connected') 
                    : (lang === 'mr' ? 'कोणताही बाह्य ऑडिओ जोडलेला नाही' : 'No External Audio Connected')}
                </p>
                <p className="text-[11px] text-slate-600 truncate max-w-sm mt-0.5">
                  {audioUrl || (lang === 'mr' ? 'व्हिडिओमध्ये स्वतःचा ऑडिओ नसल्यास आवाज येणार नाही.' : 'Video will be silent if it lacks an embedded audio track.')}
                </p>
              </div>
            </div>

            {audioUrl && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={toggleAudioPreview}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95"
                >
                  {isPlayingPreview ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-white" />
                      <span>{lang === 'mr' ? 'थांबवा' : 'Pause'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{lang === 'mr' ? 'ऐका' : 'Listen'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectAudio}
                  className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                  title={lang === 'mr' ? 'ऑडिओ ट्रॅक काढा' : 'Disconnect Audio'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Preset Selection (Regional Maharashtra & Rural Voiceovers) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              {lang === 'mr' ? 'शिफारस केलेले मराठी ऑडिओ ट्रॅक्स (Quick Presets)' : 'Regional Marathi Audio Presets'}
            </label>
            <span className="text-[10px] text-slate-500 font-semibold">
              {lang === 'mr' ? 'एका क्लिकवर जोडा' : 'Click to select'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {regionalPresets.map((preset) => {
              const isSelected = audioUrl === preset.url;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-400/30 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{preset.title}</p>
                      <span className="text-[10px] font-bold text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-full inline-block mt-1">
                        {preset.category}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{preset.desc}</p>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Audio URL Input or Upload */}
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <label className="text-xs font-black text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-slate-600" />
              {lang === 'mr' ? 'ऑडिओ URL किंवा CDN लिंक प्रविष्ट करा' : 'Custom Audio URL / CDN Link'}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              MP3, WAV, AAC, M4A, Stream
            </span>
          </label>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="e.g. /audio/progressive_farmer_podcast.wav किंवा https://..."
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs"
              title={lang === 'mr' ? 'फाइल निवडून अपलोड करा' : 'Upload Audio File'}
            >
              {isUploading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1 text-orange-600" />
              ) : (
                <Upload className="w-3.5 h-3.5 mr-1 text-orange-600" />
              )}
              {isUploading ? (lang === 'mr' ? 'अपलोड होत आहे...' : 'Uploading...') : (lang === 'mr' ? 'अपलोड' : 'Upload')}
            </Button>
          </div>
        </div>

        {/* Success Banner */}
        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            {lang === 'mr' 
              ? 'ऑडिओ ट्रॅक यशस्वीरीत्या कनेक्ट झाला आणि डेटाबेसमध्ये सेव्ह झाला!' 
              : 'Audio track successfully connected and saved to database!'}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl"
          >
            {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
          </Button>

          <div className="flex items-center gap-2">
            {audioUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowVideoPreview(true)}
                className="bg-white hover:bg-slate-50 border-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current mr-1 text-orange-600" />
                {lang === 'mr' ? 'ऑडिओसह चाचणी प्ले' : 'Test Play'}
              </Button>
            )}

            <Button
              type="button"
              disabled={isSaving || !audioUrl}
              onClick={handleSaveConnection}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer active:scale-95"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>{lang === 'mr' ? 'सेव्ह होत आहे...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3] mr-1.5" />
                  <span>{lang === 'mr' ? 'ऑडिओ कनेक्ट करा व सेव्ह करा' : 'Save & Connect Audio'}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
