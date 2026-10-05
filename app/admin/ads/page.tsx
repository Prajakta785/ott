'use client';

import React, { useState, useEffect } from 'react';
import { firestoreService } from '@/lib/firestore-service';
import { Advertisement } from '@/lib/types';
import { 
  IndianRupee, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  MousePointerClick, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  PauseCircle, 
  PlayCircle,
  ExternalLink,
  X,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export default function AdvertisementsPage() {
  const { t, lang } = useLanguage();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlacement, setSelectedPlacement] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    advertiserName: '',
    adType: 'banner' as 'banner' | 'video_preroll' | 'video_midroll' | 'video_postroll' | 'sponsored',
    mediaUrl: '',
    targetUrl: '',
    placement: 'home_top' as 'home_top' | 'player_preroll' | 'player_midroll' | 'player_postroll' | 'news_sidebar' | 'all',
    status: 'active' as 'active' | 'paused' | 'expired',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31',
  });

  const loadAds = async () => {
    setLoading(true);
    const list = await firestoreService.getAds();
    setAds(list);
    setLoading(false);
  };

  useEffect(() => {
    loadAds();
  }, []);

  const openCreateModal = () => {
    setEditingAd(null);
    setFormData({
      title: '',
      advertiserName: '',
      adType: 'banner',
      mediaUrl: '',
      targetUrl: '',
      placement: 'home_top',
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      advertiserName: ad.advertiserName,
      adType: ad.adType,
      mediaUrl: ad.mediaUrl,
      targetUrl: ad.targetUrl,
      placement: ad.placement,
      status: ad.status,
      startDate: ad.startDate.split('T')[0],
      endDate: ad.endDate.split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingAd ? editingAd.id : `ad_${Date.now()}`;
    const ad: Advertisement = {
      id,
      title: formData.title,
      advertiserName: formData.advertiserName,
      adType: formData.adType,
      mediaUrl: formData.mediaUrl,
      targetUrl: formData.targetUrl,
      placement: formData.placement,
      status: formData.status,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      impressions: editingAd?.impressions || 0,
      clicks: editingAd?.clicks || 0,
      createdAt: editingAd?.createdAt || new Date().toISOString(),
    };

    await firestoreService.saveAd(ad);
    await loadAds();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirmAd'))) return;
    await firestoreService.deleteAd(id);
    setAds(prev => prev.filter(a => a.id !== id));
  };

  const toggleStatus = async (ad: Advertisement) => {
    const nextStatus: 'active' | 'paused' = ad.status === 'active' ? 'paused' : 'active';
    const updated: Advertisement = { ...ad, status: nextStatus };
    await firestoreService.saveAd(updated);
    setAds(prev => prev.map(a => a.id === ad.id ? updated : a));
  };

  const filtered = ads.filter(a => {
    const matchesPlacement = selectedPlacement === 'all' || a.placement === selectedPlacement;
    const matchesSearch = searchQuery === '' ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.advertiserName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlacement && matchesSearch;
  });

  const totalImpressions = ads.reduce((acc, a) => acc + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((acc, a) => acc + (a.clicks || 0), 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-7 rounded-3xl bg-white border border-slate-200 shadow-luxury">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <IndianRupee className="w-6 h-6 text-rose-600" />
            {t('pageTitleAds')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('adsDescText')}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {lang === 'mr' ? 'नवीन जाहिरात जोडा' : lang === 'hi' ? 'नया विज्ञापन जोड़ें' : 'Create Campaign'}
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-luxury">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('adActiveCampaigns')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{ads.filter(a => a.status === 'active').length}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">{t('statusActive')}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-luxury">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('adTotalImpressions')}</span>
            <Eye className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{totalImpressions.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400">{t('colViews')}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-luxury">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('adClicksMetric')}</span>
            <MousePointerClick className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{totalClicks.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400">{t('colClicks')}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-luxury">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('adAvgCtr')}</span>
            <TrendingUp className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{avgCTR}%</p>
          <span className="text-[10px] text-emerald-700 font-semibold">CTR</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'mr' ? 'जाहिरात शीर्षक किंवा प्रायोजकाचे नाव शोधा...' : lang === 'hi' ? 'विज्ञापन शीर्षक या प्रायोजक खोजें...' : 'Search campaigns or sponsor...'}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
          />
        </div>

        <select
          value={selectedPlacement}
          onChange={(e) => setSelectedPlacement(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-rose-500"
        >
          <option value="all">{t('filterAllPlacements')}</option>
          <option value="home_top">{lang === 'mr' ? 'होम मुख्य बॅनर' : lang === 'hi' ? 'होम मुख्य बैनर' : 'Home Top Banner'}</option>
          <option value="player_preroll">{lang === 'mr' ? 'व्हिडिओ सुरू होताना' : lang === 'hi' ? 'वीडियो प्री-रोल' : 'Video Player Pre-Roll'}</option>
          <option value="player_midroll">{lang === 'mr' ? 'व्हिडिओ दरम्यान' : lang === 'hi' ? 'वीडियो मिड-रोल' : 'Video Player Mid-Roll'}</option>
          <option value="player_postroll">{lang === 'mr' ? 'व्हिडिओ संपल्यावर' : lang === 'hi' ? 'वीडियो पोस्ट-रोल' : 'Video Player Post-Roll'}</option>
          <option value="news_sidebar">{lang === 'mr' ? 'बातमी बाजूची पट्टी' : lang === 'hi' ? 'समाचार साइडबार' : 'News Article Sidebar'}</option>
        </select>
      </div>

      {/* Ads Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">{t('loadingText')}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200 shadow-sm">
          <IndianRupee className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-800 font-bold text-sm">{t('noDataText')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-luxury">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                <th className="py-4 px-5">{t('colCampaign')}</th>
                <th className="py-4 px-5">{t('colSlot')}</th>
                <th className="py-4 px-5">{t('colViews')}</th>
                <th className="py-4 px-5">{t('colClicks')}</th>
                <th className="py-4 px-5">{t('colDates')}</th>
                <th className="py-4 px-5">{t('colStatus')}</th>
                <th className="py-4 px-5 text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 text-xs">
              {filtered.map((ad) => (
                <tr key={ad.id} className="hover:bg-slate-50 transition">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3.5">
                      <img 
                        src={ad.mediaUrl} 
                        alt={ad.title} 
                        className="w-12 h-8 rounded-lg object-cover border border-slate-200 shrink-0 shadow-sm" 
                      />
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-1">{ad.title}</p>
                        <p className="text-[11px] text-emerald-700 font-semibold line-clamp-1 mt-0.5">{ad.advertiserName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 uppercase">
                        {ad.adType}
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium capitalize">{ad.placement.replace('_', ' ')}</p>
                    </div>
                  </td>
                  <td className="py-4 px-5 font-bold text-slate-900">
                    {(ad.impressions || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-5 font-bold text-emerald-600">
                    {(ad.clicks || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-5 text-slate-600 text-[11px]">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{ad.startDate.split('T')[0]} - {ad.endDate.split('T')[0]}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <button
                      onClick={() => toggleStatus(ad)}
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full capitalize transition flex items-center gap-1 ${
                        ad.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {ad.status === 'active' ? <PlayCircle className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                      {ad.status}
                    </button>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(ad)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg transition"
                        title="Edit Ad"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        title={t('deleteBtn')}
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
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-7 shadow-luxury-lg border border-slate-200 max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
                {editingAd 
                  ? (lang === 'mr' ? 'जाहिरात मोहीम संपादित करा' : lang === 'hi' ? 'विज्ञापन अभियान संपादित करें' : 'Edit Campaign') 
                  : (lang === 'mr' ? 'नवीन जाहिरात मोहीम तयार करा' : lang === 'hi' ? 'नया विज्ञापन अभियान बनाएं' : 'New Campaign')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'mr' ? 'मोहीम शीर्षक *' : lang === 'hi' ? 'अभियान शीर्षक *' : 'Campaign Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={lang === 'mr' ? 'उदा. महा-कृषी ट्रॅक्टर व अवजारे योजना २०२६' : lang === 'hi' ? 'उदा. महा-कृषि ट्रैक्टर योजना २०२६' : 'e.g. Agri Equipment Promotion 2026'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'mr' ? 'जाहिरातदार / प्रायोजक *' : lang === 'hi' ? 'विज्ञापनदाता / प्रायोजक *' : 'Advertiser / Sponsor *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.advertiserName}
                    onChange={(e) => setFormData({ ...formData, advertiserName: e.target.value })}
                    placeholder={lang === 'mr' ? 'उदा. महाराष्ट्र कृषी विकास मंडळ' : lang === 'hi' ? 'उदा. महाराष्ट्र कृषि विकास मंडल' : 'e.g. Maharashtra Agri Corp'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'mr' ? 'जाहिरात प्रकार *' : lang === 'hi' ? 'विज्ञापन प्रकार *' : 'Ad Type *'}
                  </label>
                  <select
                    value={formData.adType}
                    onChange={(e) => setFormData({ ...formData, adType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  >
                    <option value="banner">{lang === 'mr' ? 'बॅनर जाहिरात' : lang === 'hi' ? 'बैनर विज्ञापन' : 'Banner Image Ad'}</option>
                    <option value="video_preroll">{lang === 'mr' ? 'व्हिडिओच्या आधी' : lang === 'hi' ? 'वीडियो से पहले' : 'Video Pre-Roll'}</option>
                    <option value="video_midroll">{lang === 'mr' ? 'व्हिडिओच्या मध्ये' : lang === 'hi' ? 'वीडियो के बीच' : 'Video Mid-Roll'}</option>
                    <option value="video_postroll">{lang === 'mr' ? 'व्हिडिओच्या शेवटी' : lang === 'hi' ? 'वीडियो के बाद' : 'Video Post-Roll'}</option>
                    <option value="sponsored">{lang === 'mr' ? 'प्रायोजित लेख' : lang === 'hi' ? 'प्रायोजित लेख' : 'Sponsored Content'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'mr' ? 'जाहिरातीची जागा *' : lang === 'hi' ? 'विज्ञापन का स्थान *' : 'Slot Placement *'}
                  </label>
                  <select
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  >
                    <option value="home_top">{lang === 'mr' ? 'होम मुख्य बॅनर' : lang === 'hi' ? 'होम मुख्य बैनर' : 'Home Top Banner'}</option>
                    <option value="player_preroll">{lang === 'mr' ? 'व्हिडिओ प्लेयर प्री-रोल' : lang === 'hi' ? 'वीडियो प्लेयर प्री-रोल' : 'Video Player Pre-Roll Slot'}</option>
                    <option value="player_midroll">{lang === 'mr' ? 'व्हिडिओ प्लेयर मिड-रोल' : lang === 'hi' ? 'वीडियो प्लेयर मिड-रोल' : 'Video Player Mid-Roll Slot'}</option>
                    <option value="player_postroll">{lang === 'mr' ? 'व्हिडिओ प्लेयर पोस्ट-रोल' : lang === 'hi' ? 'वीडियो प्लेयर पोस्ट-रोल' : 'Video Player Post-Roll Slot'}</option>
                    <option value="news_sidebar">{lang === 'mr' ? 'बातमी बाजूची पट्टी' : lang === 'hi' ? 'समाचार साइडबार' : 'News Article Sidebar'}</option>
                    <option value="all">{lang === 'mr' ? 'सर्व उपलब्ध जागा' : lang === 'hi' ? 'सभी उपलब्ध स्थान' : 'All Available Slots'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'mr' ? 'मोहीम स्थिती' : lang === 'hi' ? 'अभियान स्थिति' : 'Campaign Status'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  >
                    <option value="active">{lang === 'mr' ? 'सुरू' : lang === 'hi' ? 'सक्रिय' : 'Active'}</option>
                    <option value="paused">{lang === 'mr' ? 'थांबवली' : lang === 'hi' ? 'रोकी गई' : 'Paused'}</option>
                    <option value="expired">{lang === 'mr' ? 'समाप्त' : lang === 'hi' ? 'समाप्त' : 'Expired'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'mr' ? 'मीडिया लिंक *' : lang === 'hi' ? 'मीडिया लिंक *' : 'Media URL (Image / Video Stream) *'}
                </label>
                <input
                  type="url"
                  required
                  value={formData.mediaUrl}
                  onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                  placeholder="https://vz-xxxx.b-cdn.net/ads/ad-video.mp4"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-mono text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'mr' ? 'क्लिक रिडायरेक्शन लिंक *' : lang === 'hi' ? 'क्लिक रीडायरेक्शन लिंक *' : 'Target URL (Click Destination) *'}
                </label>
                <input
                  type="url"
                  required
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                  placeholder="https://sponsor-website.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-mono text-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'mr' ? 'सुरू होण्याची तारीख' : lang === 'hi' ? 'शुरू होने की तिथि' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'mr' ? 'समाप्ती तारीख' : lang === 'hi' ? 'समाप्ति तिथि' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                >
                  {lang === 'mr' ? 'रद्द करा' : lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white rounded-xl transition shadow-sm cursor-pointer"
                >
                  {editingAd ? (lang === 'mr' ? 'बदल जतन करा' : lang === 'hi' ? 'बदलाव सहेजें' : 'Save Changes') : (lang === 'mr' ? 'मोहीम सुरू करा' : lang === 'hi' ? 'अभियान शुरू करें' : 'Launch Campaign')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
