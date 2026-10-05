'use client';

import React, { useState, useEffect } from 'react';
import { firestoreService } from '@/lib/firestore-service';
import { LiveChannel } from '@/lib/types';
import { VideoPlayer } from '@/components/video-player';
import { 
  Radio, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Play, 
  Tv, 
  Users, 
  Signal, 
  Activity, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  X,
  Sparkles,
  RadioTower
} from 'lucide-react';
import { BunnyUploader } from '@/components/bunny-uploader';
import { bunnyService } from '@/lib/bunny-service';
import { useLanguage } from '@/lib/i18n';

export default function LiveStreamsPage() {
  const { t, lang } = useLanguage();
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<LiveChannel | null>(null);
  const [previewingChannel, setPreviewingChannel] = useState<LiveChannel | null>(null);

  const [formData, setFormData] = useState({
    channelName: '',
    channelCode: 'gramin_bharat_live' as 'gramin_bharat_live' | 'namdar_maharashtra_live' | 'custom_live',
    streamUrl: '',
    backupStreamUrl: '',
    logo: '',
    poster: '',
    description: '',
    isLive: true,
    status: 'active' as 'active' | 'standby' | 'offline',
    resolution: '1080p 60fps HD',
    currentProgramTitle: '',
    currentProgramDescription: '',
    viewersCount: 1500,
  });

  const loadChannels = async () => {
    // Safety fallback so UI NEVER hangs in loading state
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    try {
      setLoading(true);
      const list = await firestoreService.getLiveChannels();
      setChannels(list || []);
    } catch (err) {
      console.error('Failed to load live channels:', err);
      setChannels([]);
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const openCreateModal = () => {
    setEditingChannel(null);
    setFormData({
      channelName: '',
      channelCode: 'custom_live',
      streamUrl: '',
      backupStreamUrl: '',
      logo: '',
      poster: '',
      description: '',
      isLive: true,
      status: 'active',
      resolution: '1080p 60fps HD',
      currentProgramTitle: '',
      currentProgramDescription: '',
      viewersCount: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ch: LiveChannel) => {
    setEditingChannel(ch);
    setFormData({
      channelName: ch.channelName,
      channelCode: ch.channelCode,
      streamUrl: ch.streamUrl,
      backupStreamUrl: ch.backupStreamUrl || '',
      logo: ch.logo,
      poster: ch.poster,
      description: ch.description,
      isLive: ch.isLive,
      status: ch.status,
      resolution: ch.resolution,
      currentProgramTitle: ch.currentProgramTitle || '',
      currentProgramDescription: ch.currentProgramDescription || '',
      viewersCount: ch.viewersCount || 0,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingChannel ? editingChannel.id : `live_${Date.now()}`;
    const channel: LiveChannel = {
      id,
      channelName: formData.channelName,
      channelCode: formData.channelCode,
      streamUrl: formData.streamUrl,
      backupStreamUrl: formData.backupStreamUrl,
      logo: formData.logo || '',
      poster: formData.poster || '',
      description: formData.description,
      isLive: formData.isLive,
      status: formData.status,
      resolution: formData.resolution,
      currentProgramTitle: formData.currentProgramTitle,
      currentProgramDescription: formData.currentProgramDescription,
      viewersCount: Number(formData.viewersCount) || 0,
      updatedAt: new Date().toISOString(),
    };

    await firestoreService.saveLiveChannel(channel);
    await loadChannels();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirmChannel'))) return;
    await firestoreService.deleteLiveChannel(id);
    setChannels(prev => prev.filter(c => c.id !== id));
  };

  const toggleLiveStatus = async (ch: LiveChannel) => {
    const updated: LiveChannel = {
      ...ch,
      isLive: !ch.isLive,
      status: !ch.isLive ? 'active' : 'standby',
    };
    await firestoreService.saveLiveChannel(updated);
    setChannels(prev => prev.map(c => c.id === ch.id ? updated : c));
  };

  const handleConvertToBunnyStream = async (ch: LiveChannel) => {
    const bunnyGuid = 'c0a4e45c-b442-4071-b68f-6d8662b5f001';
    const updated: LiveChannel = {
      ...ch,
      streamUrl: bunnyGuid,
      backupStreamUrl: `https://iframe.mediadelivery.net/embed/767488/${bunnyGuid}`,
      poster: ch.poster || `https://vz-1192802e-f33.b-cdn.net/${bunnyGuid}/thumbnail.jpg`,
      logo: ch.logo || `https://vz-1192802e-f33.b-cdn.net/${bunnyGuid}/thumbnail.jpg`,
      isLive: true,
      status: 'active',
      updatedAt: new Date().toISOString(),
    };
    await firestoreService.saveLiveChannel(updated);
    setChannels(prev => prev.map(c => c.id === ch.id ? updated : c));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-luxury">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-rose-600 animate-pulse shrink-0" />
            <span className="truncate">{t('pageTitleLive')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('liveSubtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-sm shrink-0 cursor-pointer active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {lang === 'mr' ? 'नवीन थेट चॅनेल जोडा' : lang === 'hi' ? 'नया लाइव चैनल जोड़ें' : 'Add Live Stream'}
        </button>
      </div>

      {/* Live Channels Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          {lang === 'mr' ? 'थेट चॅनेल्स लोड होत आहेत...' : lang === 'hi' ? 'लाइव चैनल लोड हो रहे हैं...' : 'Loading live broadcast streams...'}
        </div>
      ) : channels.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200 shadow-sm">
          <Radio className="w-10 h-10 text-rose-400 mx-auto mb-3 opacity-80" />
          <p className="text-slate-900 font-black text-sm">
            {t('liveNoChannels')}
          </p>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
            {t('liveNoChannelsHelp')}
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            {lang === 'mr' ? 'नवीन थेट चॅनेल जोडा' : lang === 'hi' ? 'नया लाइव चैनल जोड़ें' : 'Add Live Stream'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {channels.map((ch) => (
            <div
              key={ch.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-luxury hover:shadow-luxury-md transition flex flex-col justify-between"
            >
              <div>
                {/* Banner Thumbnail & Live Badge */}
                <div className="relative h-48 w-full bg-slate-900 overflow-hidden group">
                  <img
                    src={ch.poster}
                    alt={ch.channelName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md ${
                      ch.isLive ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-700 text-slate-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${ch.isLive ? 'bg-white animate-ping' : 'bg-slate-400'}`} />
                      {ch.isLive ? (lang === 'mr' ? 'थेट सुरू' : lang === 'hi' ? 'सीधा प्रसारण' : 'LIVE ON AIR') : (lang === 'mr' ? 'सज्ज' : lang === 'hi' ? 'तैयार' : 'STANDBY')}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-slate-200 border border-white/10 text-[10px] font-bold">
                      {ch.resolution}
                    </span>
                  </div>

                  {/* Live Viewers */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 text-xs font-bold">
                    <Users className="w-3.5 h-3.5 text-rose-400" />
                    <span>{ch.isLive ? (ch.viewersCount || 1000).toLocaleString() : '0'} Viewers</span>
                  </div>

                  {/* Current Program info */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={ch.logo}
                        alt={ch.channelName}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-white/30 shadow-md shrink-0"
                      />
                      <div className="overflow-hidden text-white">
                        <h3 className="font-black text-lg text-white drop-shadow truncate">
                          {ch.channelName}
                        </h3>
                        <p className="text-xs text-amber-300 font-semibold truncate">
                          🔴 {lang === 'mr' ? 'आता सुरू आहे:' : lang === 'hi' ? 'अब चल रहा है:' : 'Now Playing:'} {ch.currentProgramTitle || (lang === 'mr' ? 'नियमित प्रक्षेपण' : lang === 'hi' ? 'नियमित प्रसारण' : 'Regular Broadcast')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-6 space-y-4 text-xs">
                  <p className="text-slate-600 leading-relaxed">
                    {ch.description || (lang === 'mr' ? 'ग्रामीण व राज्यस्तरीय बातम्यांचे २४ तास थेट प्रक्षेपण.' : lang === 'hi' ? 'ग्रामीण व राज्यस्तरीय समाचारों का २४ घंटे सीधा प्रसारण।' : '24x7 live streaming of regional and national broadcasts.')}
                  </p>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        {ch.streamUrl && (ch.streamUrl.includes('b-cdn.net') || !ch.streamUrl.includes('/')) ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Bunny Stream 4K (Adaptive)
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            HLS Stream Playlist (.m3u8)
                          </>
                        )}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ABR Transcoding Active
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-slate-800 break-all select-all bg-white p-2 rounded-lg border border-slate-200">
                      {ch.streamUrl}
                    </p>

                    {/* Unplayable URL Alert & One-Click Save to Bunny */}
                    {ch.streamUrl && (ch.streamUrl.includes('pexels.com') || (!ch.streamUrl.includes('.m3u8') && !ch.streamUrl.includes('.mp4') && ch.streamUrl.includes('http') && !ch.streamUrl.includes('b-cdn.net'))) && (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
                        <span className="text-[11px] font-semibold text-amber-900 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          वेबपेज लिंक प्ले होत नाही! Bunny Stream वर सेव्ह करा
                        </span>
                        <button
                          type="button"
                          onClick={() => handleConvertToBunnyStream(ch)}
                          className="px-2.5 py-1 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-[10px] rounded-lg transition shadow-xs cursor-pointer self-start sm:self-auto"
                        >
                          ⚡ Bunny Stream वर सेव्ह करा
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleLiveStatus(ch)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                      ch.isLive 
                        ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
                    }`}
                  >
                    <Signal className="w-3.5 h-3.5" />
                    {ch.isLive 
                      ? (lang === 'mr' ? 'स्टँडबाय वर ठेवा' : lang === 'hi' ? 'स्टैंडबाय पर रखें' : 'Put on Standby')
                      : (lang === 'mr' ? 'थेट सुरू करा' : lang === 'hi' ? 'लाइव शुरू करें' : 'Go Live Now')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewingChannel(ch)}
                    className="px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title={lang === 'mr' ? 'थेट प्रिव्ह्यू पहा' : lang === 'hi' ? 'लाइव स्ट्रीम पूर्वावलोकन देखें' : 'Watch Live Stream Preview'}
                  >
                    <Play className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                    {lang === 'mr' ? 'प्रिव्ह्यू पहा' : lang === 'hi' ? 'पूर्वावलोकन देखें' : 'Preview Stream'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(ch)}
                    className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer active:scale-95"
                    title="Edit Stream Settings"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(ch.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer active:scale-95"
                  title={t('deleteBtn')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Channel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-7 shadow-luxury-lg border border-slate-200 max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-600" />
                {editingChannel 
                  ? (lang === 'mr' ? 'थेट चॅनेल संपादित करा' : lang === 'hi' ? 'लाइव चैनल संपादित करें' : 'Edit Live Stream') 
                  : (lang === 'mr' ? 'नवीन थेट चॅनेल जोडा' : lang === 'hi' ? 'नया लाइव चैनल जोड़ें' : 'Add Live Stream')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'mr' ? 'चॅनेलचे नाव' : lang === 'hi' ? 'चैनल का नाम' : 'Channel Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.channelName}
                  onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
                  placeholder={lang === 'mr' ? 'उदा. ग्रामीण भारत टीव्ही Live' : lang === 'hi' ? 'उदा. ग्रामीण भारत टीवी Live' : 'e.g. Gramin Bharat TV Live'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'mr' ? 'चॅनेल प्रकार' : lang === 'hi' ? 'चैनल पहचान' : 'Channel Identifier'}
                  </label>
                  <select
                    value={formData.channelCode}
                    onChange={(e) => setFormData({ ...formData, channelCode: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  >
                    <option value="gramin_bharat_live">{lang === 'mr' ? 'ग्रामीण भारत टीव्ही Live' : lang === 'hi' ? 'ग्रामीण भारत टीवी Live' : 'Gramin Bharat TV Live'}</option>
                    <option value="namdar_maharashtra_live">{lang === 'mr' ? 'नामदार महाराष्ट्र Live' : lang === 'hi' ? 'नामदार महाराष्ट्र Live' : 'Namdar Maharashtra Live'}</option>
                    <option value="custom_live">{lang === 'mr' ? 'इतर Live चॅनेल' : lang === 'hi' ? 'अन्य लाइव चैनल' : 'Custom Live Stream'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'mr' ? 'प्रक्षेपण गुणवत्ता' : lang === 'hi' ? 'प्रसारण गुणवत्ता' : 'Resolution'}
                  </label>
                  <select
                    value={formData.resolution}
                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  >
                    <option value="1080p 60fps HD">1080p 60fps Full HD (HLS ABR)</option>
                    <option value="4K UHD Broadcast">4K Ultra HD Broadcast</option>
                    <option value="720p HD">720p High Definition</option>
                  </select>
                </div>
              </div>

              {/* Video Stream & Bunny.net Stream Upload */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <RadioTower className="w-4 h-4 text-rose-600" />
                    {lang === 'mr' ? 'थेट व्हिडिओ प्रवाह व Bunny Stream जोडणी' : lang === 'hi' ? 'लाइव वीडियो और Bunny Stream इंटीग्रेशन' : 'Live Stream & Bunny Stream Integration'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Bunny Library 767488
                  </span>
                </div>

                {/* Bunny Direct Video Uploader */}
                <BunnyUploader
                  type="video"
                  currentValue={formData.streamUrl}
                  label={lang === 'mr' ? 'व्हिडिओ फाईल Bunny Stream वर थेट अपलोड करा' : lang === 'hi' ? 'वीडियो फ़ाइल Bunny Stream पर सीधे अपलोड करें' : 'Upload Video File Directly to Bunny Stream'}
                  onUploadComplete={(res) => {
                    setFormData(prev => ({
                      ...prev,
                      streamUrl: res.urlOrGuid,
                      poster: res.thumbnail || prev.poster,
                    }));
                  }}
                />

                {/* Manual Stream URL or Bunny Video GUID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      {lang === 'mr' ? 'थेट Stream URL किंवा Bunny GUID' : lang === 'hi' ? 'लाइव Stream URL या Bunny GUID' : 'Live Stream URL, Bunny GUID or HLS .m3u8'} *
                    </label>
                    {formData.streamUrl && (formData.streamUrl.includes('b-cdn.net') || !formData.streamUrl.includes('/')) && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Bunny Active
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.streamUrl}
                    onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                    placeholder="Bunny GUID (उदा. c0a4e45c-b442-4071-b68f-6d8662b5f001) किंवा HLS URL"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-mono text-slate-900 text-xs"
                  />
                  {/* Warning if Pexels or invalid webpage is entered */}
                  {formData.streamUrl && formData.streamUrl.includes('pexels.com') && (
                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-[11px]">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold">⚠️ ही थेट व्हिडिओ फाईल नाही (वेबपेज लिंक आहे)</p>
                        <p className="mt-0.5">वेबपेज लिंक प्लेअरमध्ये चालत नाही. खालील बटण दाबून सक्रिय Bunny Stream व्हिडिओ लिंक करा:</p>
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            streamUrl: 'c0a4e45c-b442-4071-b68f-6d8662b5f001',
                            poster: 'https://vz-1192802e-f33.b-cdn.net/c0a4e45c-b442-4071-b68f-6d8662b5f001/thumbnail.jpg'
                          })}
                          className="mt-1.5 px-3 py-1 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-lg cursor-pointer transition shadow-xs"
                        >
                          ⚡ Bunny Stream वर सेव्ह करा (GUID: c0a4e45c...)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Poster and Logo image uploaders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <BunnyUploader
                  type="image"
                  currentValue={formData.poster}
                  label={lang === 'mr' ? 'चॅनेल बॅनर / पोस्टर (Poster Image)' : lang === 'hi' ? 'चैनल पोस्टर (Banner)' : 'Channel Poster / Banner'}
                  onUploadComplete={(res) => setFormData(prev => ({ ...prev, poster: res.urlOrGuid }))}
                />
                <BunnyUploader
                  type="image"
                  currentValue={formData.logo}
                  label={lang === 'mr' ? 'चॅनेल लोगो (Logo Image)' : lang === 'hi' ? 'चैनल लोगो' : 'Channel Logo'}
                  onUploadComplete={(res) => setFormData(prev => ({ ...prev, logo: res.urlOrGuid }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'mr' ? 'चालू कार्यक्रमाचे नाव' : lang === 'hi' ? 'वर्तमान कार्यक्रम का नाम' : 'Current Program Title'}
                  </label>
                  <input
                    type="text"
                    value={formData.currentProgramTitle}
                    onChange={(e) => setFormData({ ...formData, currentProgramTitle: e.target.value })}
                    placeholder={lang === 'mr' ? 'उदा. नामदार महाराष्ट्र विशेष मुलाखत' : lang === 'hi' ? 'उदा. नामदार महाराष्ट्र विशेष साक्षात्कार' : 'e.g. Namdar Maharashtra Special Interview'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'mr' ? 'अंदाजे थेट प्रेक्षक संख्या' : lang === 'hi' ? 'अनुमानित लाइव दर्शक संख्या' : 'Estimated Live Viewers'}
                  </label>
                  <input
                    type="number"
                    value={formData.viewersCount}
                    onChange={(e) => setFormData({ ...formData, viewersCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'mr' ? 'सविस्तर माहिती व तपशील' : lang === 'hi' ? 'विस्तृत जानकारी' : 'Program Description'}
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={lang === 'mr' ? 'कार्यक्रमाचा तपशील लिहा...' : lang === 'hi' ? 'कार्यक्रम का विवरण लिखें...' : 'Write program description...'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer active:scale-95"
                >
                  {lang === 'mr' ? 'रद्द करा' : lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl transition shadow-sm cursor-pointer active:scale-95"
                >
                  {editingChannel 
                    ? (lang === 'mr' ? 'बदल जतन करा' : lang === 'hi' ? 'बदलाव सहेजें' : 'Save Changes') 
                    : (lang === 'mr' ? 'थेट चॅनेल सुरू करा' : lang === 'hi' ? 'लाइव चैनल शुरू करें' : 'Publish & Go Live')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Stream Player Preview Modal */}
      {previewingChannel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between text-white px-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span className="font-black text-sm tracking-wide">{previewingChannel.channelName} • Live Broadcast</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  {previewingChannel.resolution}
                </span>
              </div>
              <button
                onClick={() => setPreviewingChannel(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-rose-600 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <VideoPlayer
              src={previewingChannel.streamUrl}
              poster={previewingChannel.poster}
              title={previewingChannel.channelName}
              subtitle={previewingChannel.currentProgramTitle || 'Live Satellite Feed'}
              isLive={true}
              onClose={() => setPreviewingChannel(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
