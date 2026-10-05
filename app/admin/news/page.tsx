'use client';

import React, { useState, useEffect } from 'react';
import { firestoreService } from '@/lib/firestore-service';
import { ContentItem } from '@/lib/types';
import { 
  Newspaper, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  MapPin, 
  User, 
  Eye, 
  Video, 
  Sparkles, 
  Check, 
  X,
  RadioTower,
  Image as ImageIcon
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { BunnyUploader } from '@/components/bunny-uploader';
import { getSafeImageUrl, handleImageError } from '@/lib/image-utils';

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

const NEWS_SUBCATEGORIES = [
  'महाराष्ट्र',
  'जिल्हा बातम्या',
  'तालुका बातम्या',
  'ग्रामीण बातम्या',
  'राजकीय बातम्या',
  'सामाजिक बातम्या',
  'शेतकरी बातम्या',
  'रोजगार',
  'शिक्षण',
  'आरोग्य',
  'स्थानिक प्रशासन',
  'विशेष बातमी',
];

const NEWS_SUBCATEGORY_LABELS: Record<string, { en: string; hi: string; mr: string }> = {
  'महाराष्ट्र': { mr: 'महाराष्ट्र', hi: 'महाराष्ट्र', en: 'Maharashtra State' },
  'जिल्हा बातम्या': { mr: 'जिल्हा बातम्या', hi: 'ज़िला समाचार', en: 'District News' },
  'तालुका बातम्या': { mr: 'तालुका बातम्या', hi: 'तहसील समाचार', en: 'Taluka News' },
  'ग्रामीण बातम्या': { mr: 'ग्रामीण बातम्या', hi: 'ग्रामीण समाचार', en: 'Rural News' },
  'राजकीय बातम्या': { mr: 'राजकीय बातम्या', hi: 'राजनीतिक समाचार', en: 'Political News' },
  'सामाजिक बातम्या': { mr: 'सामाजिक बातम्या', hi: 'सामाजिक समाचार', en: 'Social News' },
  'शेतकरी बातम्या': { mr: 'शेतकरी बातम्या', hi: 'किसान समाचार', en: 'Agriculture & Farmers' },
  'रोजगार': { mr: 'रोजगार', hi: 'रोज़गार', en: 'Employment & Jobs' },
  'शिक्षण': { mr: 'शिक्षण', hi: 'शिक्षा', en: 'Education' },
  'आरोग्य': { mr: 'आरोग्य', hi: 'स्वास्थ्य', en: 'Healthcare' },
  'स्थानिक प्रशासन': { mr: 'स्थानिक प्रशासन', hi: 'स्थानीय प्रशासन', en: 'Local Governance' },
  'विशेष बातमी': { mr: 'विशेष बातमी', hi: 'विशेष समाचार', en: 'Special Reports' },
};

export default function NewsCMSPage() {
  const { t, lang } = useLanguage();
  const [newsList, setNewsList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reporterName: '',
    district: MAHARASHTRA_DISTRICTS[1],
    taluka: '',
    village: '',
    subCategory: NEWS_SUBCATEGORIES[0],
    videoId: '',
    poster: '',
    banner: '',
    isFeatured: false,
    status: 'published' as 'published' | 'draft',
  });

  const loadNews = async () => {
    setLoading(true);
    const content = await firestoreService.getContent();
    setNewsList(content.filter(c => c.type === 'news' || c.genres.includes('News')));
    setLoading(false);
  };

  useEffect(() => {
    loadNews();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      reporterName: 'विशेष प्रतिनिधी',
      district: MAHARASHTRA_DISTRICTS[1],
      taluka: '',
      village: '',
      subCategory: NEWS_SUBCATEGORIES[0],
      videoId: '',
      poster: '',
      banner: '',
      isFeatured: false,
      status: 'published',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ContentItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      reporterName: item.reporterName || 'विशेष प्रतिनिधी',
      district: item.district || MAHARASHTRA_DISTRICTS[1],
      taluka: item.taluka || '',
      village: item.village || '',
      subCategory: item.subCategory || NEWS_SUBCATEGORIES[0],
      videoId: item.videoId || '',
      poster: item.poster || item.banner || '',
      banner: item.banner || item.poster || '',
      isFeatured: item.isFeatured,
      status: item.status as 'published' | 'draft',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingItem ? editingItem.id : `news_${Date.now()}`;
    const slug = `news-${Date.now()}`;

    const finalPoster = formData.poster || formData.banner || (formData.videoId && !formData.videoId.startsWith('http') ? `/api/bunny/thumbnail?videoId=${formData.videoId}` : '');
    const finalBanner = formData.banner || formData.poster || finalPoster;

    const item: ContentItem = {
      id,
      type: 'news',
      title: formData.title,
      slug: editingItem?.slug || slug,
      description: formData.description,
      tags: ['News', 'बातम्या', formData.district, formData.subCategory],
      genres: ['News', formData.subCategory],
      cast: [formData.reporterName],
      director: 'ग्रामीण भारत टीव्ही / नामदार महाराष्ट्र',
      language: ['Marathi'],
      releaseDate: editingItem?.releaseDate || new Date().toISOString(),
      poster: finalPoster,
      banner: finalBanner,
      isPremium: false,
      isFeatured: formData.isFeatured,
      status: formData.status,
      rating: 'All',
      views: editingItem?.views || 0,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reporterName: formData.reporterName,
      district: formData.district,
      taluka: formData.taluka,
      village: formData.village,
      subCategory: formData.subCategory,
      videoId: formData.videoId,
      resolution: '1080p Full HD',
    };

    await firestoreService.saveContent(item);
    await loadNews();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirmNews'))) return;
    await firestoreService.deleteContent(id);
    setNewsList(prev => prev.filter(n => n.id !== id));
  };

  const filtered = newsList.filter(n => {
    const matchesDistrict = selectedDistrict === 'All' || n.district?.includes(selectedDistrict);
    const matchesSearch = searchQuery === '' ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.reporterName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDistrict && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-7 rounded-3xl bg-white border border-slate-200 shadow-luxury">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Newspaper className="w-6 h-6 text-rose-600" />
            {t('pageTitleNews')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('newsDescText')}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {lang === 'mr' ? 'नवीन बातमी जोडा' : lang === 'hi' ? 'नया समाचार जोड़ें' : 'Add News'}
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'mr'
                ? 'बातमीचे शीर्षक, जिल्हा किंवा वार्ताहराचे नाव शोधा...'
                : lang === 'hi'
                ? 'समाचार शीर्षक, जिला या संवाददाता का नाम खोजें...'
                : 'Search news title, district or reporter name...'
            }
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
          />
        </div>

        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-rose-500"
        >
          <option value="All">{t('filterAllDistricts')}</option>
          {MAHARASHTRA_DISTRICTS.filter(d => !d.includes('All')).map((dist) => {
            const cleanLabel = lang === 'mr' 
              ? (dist.match(/\((.*?)\)/)?.[1]?.split(' /')[0] || dist)
              : lang === 'hi' 
              ? (dist.match(/\((.*?)\)/)?.[1]?.split(' /')[0] || dist)
              : dist.split(' (')[0];
            return (
              <option key={dist} value={dist.split(' ')[0]}>{cleanLabel}</option>
            );
          })}
        </select>
      </div>

      {/* News Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">{t('loadingText')}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200 shadow-sm">
          <Newspaper className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-800 font-bold text-sm">{t('noDataText')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-luxury">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                <th className="py-4 px-5">{t('colNewsTitle')}</th>
                <th className="py-4 px-5">{t('colLocation')}</th>
                <th className="py-4 px-5">{t('colCategory')}</th>
                <th className="py-4 px-5">{t('colReporter')}</th>
                <th className="py-4 px-5">{t('colStatus')}</th>
                <th className="py-4 px-5 text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 text-xs">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3.5">
                      <img 
                        src={getSafeImageUrl(item.poster || item.banner || (item.videoId ? `/api/bunny/thumbnail?videoId=${item.videoId}` : ''))} 
                        alt={item.title} 
                        onError={(e) => handleImageError(e)}
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
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{item.district || (lang === 'mr' ? 'महाराष्ट्र' : lang === 'hi' ? 'महाराष्ट्र' : 'Maharashtra')}</span>
                      {item.village && <span className="text-slate-400">({item.village})</span>}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 rounded-full border border-rose-200">
                      {(item.subCategory && NEWS_SUBCATEGORY_LABELS[item.subCategory]?.[lang as 'en'|'hi'|'mr']) || item.subCategory || (lang === 'mr' ? 'सामान्य बातमी' : lang === 'hi' ? 'सामान्य समाचार' : 'General News')}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-600">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {item.reporterName || (lang === 'mr' ? 'विशेष प्रतिनिधी' : lang === 'hi' ? 'विशेष प्रतिनिधि' : 'Special Correspondent')}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full capitalize ${
                      item.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg transition"
                        title="Edit News"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
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

      {/* Add / Edit News Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-7 shadow-luxury-lg border border-slate-200 max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-rose-600" />
                {editingItem 
                  ? (lang === 'mr' ? 'बातमी संपादित करा' : lang === 'hi' ? 'समाचार संपादित करें' : 'Edit News Article') 
                  : (lang === 'mr' ? 'नवीन बातमी जोडा' : lang === 'hi' ? 'नया समाचार जोड़ें' : 'Add News Article')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'mr' ? 'बातमीचे शीर्षक *' : lang === 'hi' ? 'समाचार शीर्षक *' : 'News Headline *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={lang === 'mr' ? 'उदा. मराठवाड्यातील दुष्काळग्रस्त भागासाठी विशेष पाणी पुरवठा योजना जाहीर' : lang === 'hi' ? 'उदा. मराठवाड़ा के सूखाग्रस्त क्षेत्र के लिए विशेष योजना' : 'e.g. Regional Development Fund Announced for Rural Districts'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'mr' ? 'सविस्तर बातमी *' : lang === 'hi' ? 'विस्तृत समाचार *' : 'News Description / Story *'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={lang === 'mr' ? 'बातमीचा संपूर्ण तपशील लिहा...' : lang === 'hi' ? 'समाचार का संपूर्ण विवरण लिखें...' : 'Write the complete news report...'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'mr' ? 'उप-श्रेणी *' : lang === 'hi' ? 'उप-श्रेणी *' : 'News Sub-Category *'}
                  </label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  >
                    {NEWS_SUBCATEGORIES.map(sub => (
                      <option key={sub} value={sub}>
                        {NEWS_SUBCATEGORY_LABELS[sub]?.[lang as 'en'|'hi'|'mr'] || sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'mr' ? 'वार्ताहराचे नाव *' : lang === 'hi' ? 'संवाददाता का नाम *' : 'Reporter / Journalist Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.reporterName}
                    onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                    placeholder={lang === 'mr' ? 'उदा. सचिन पाटील / विशेष प्रतिनिधी' : lang === 'hi' ? 'उदा. सचिन पाटिल / विशेष संवाददाता' : 'e.g. Bureau Chief / Staff Reporter'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'mr' ? 'जिल्हा *' : lang === 'hi' ? 'ज़िला *' : 'District *'}
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  >
                    {MAHARASHTRA_DISTRICTS.filter(d => !d.includes('All')).map(dist => {
                      const cleanDist = lang === 'mr' || lang === 'hi'
                        ? (dist.match(/\((.*?)\)/)?.[1]?.split(' /')[0] || dist)
                        : dist.split(' (')[0];
                      return (
                        <option key={dist} value={dist}>{cleanDist}</option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'mr' ? 'तालुका' : lang === 'hi' ? 'तहसील' : 'Taluka'}
                  </label>
                  <input
                    type="text"
                    value={formData.taluka}
                    onChange={(e) => setFormData({ ...formData, taluka: e.target.value })}
                    placeholder={lang === 'mr' ? 'उदा. हवेली' : lang === 'hi' ? 'उदा. हवेली' : 'e.g. Haveli'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'mr' ? 'गाव' : lang === 'hi' ? 'गांव' : 'Village'}
                  </label>
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    placeholder={lang === 'mr' ? 'उदा. वाघोली' : lang === 'hi' ? 'उदा. वाघोली' : 'e.g. Wagholi'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  />
                </div>
              </div>

              {/* News Cover Photo / Thumbnail (कव्हर फोटो / पोस्टर) */}
              <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-rose-600" />
                    <span>{lang === 'mr' ? 'बातम्यांचा कव्हर फोटो / थंबनेल (Cover Photo)' : lang === 'hi' ? 'समाचार का कवर फोटो / थंबनेल (Cover Photo)' : 'News Cover Photo / Thumbnail'}</span>
                  </label>
                  {formData.poster && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, poster: '', banner: '' }))}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer transition-colors"
                    >
                      {lang === 'mr' ? 'फोटो काढा' : lang === 'hi' ? 'फोटो हटाएं' : 'Remove Photo'}
                    </button>
                  )}
                </div>

                <BunnyUploader
                  type="image"
                  currentValue={formData.poster || formData.banner}
                  placeholder="https://... किंवा कॉम्प्युटर / मोबाईलवरून फोटो निवडा"
                  onUploadComplete={(res) => {
                    setFormData(prev => ({
                      ...prev,
                      poster: res.urlOrGuid,
                      banner: res.urlOrGuid,
                    }));
                  }}
                />

                <div className="pt-1">
                  <input
                    type="text"
                    value={formData.poster || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, poster: e.target.value, banner: e.target.value }))}
                    placeholder={lang === 'mr' ? 'किंवा थेट इमेज URL पेस्ट करा (https://...)' : lang === 'hi' ? 'या सीधा इमेज URL पेस्ट करें (https://...)' : 'Or paste direct Image URL (https://...)'}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500 font-mono placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Video News Upload to Bunny Stream */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <BunnyUploader
                  type="video"
                  currentValue={formData.videoId}
                  label={lang === 'mr' ? 'बातम्यांचा व्हिडिओ (Bunny Stream वर थेट अपलोड करा)' : lang === 'hi' ? 'समाचार वीडियो (Bunny Stream)' : 'News Video (Upload to Bunny Stream)'}
                  onUploadComplete={(res) => {
                    setFormData(prev => {
                      const bunnyThumb = res.thumbnail || (res.urlOrGuid && !res.urlOrGuid.startsWith('http') ? `/api/bunny/thumbnail?videoId=${res.urlOrGuid}` : '');
                      return {
                        ...prev,
                        videoId: res.urlOrGuid,
                        poster: prev.poster || bunnyThumb || '',
                        banner: prev.banner || bunnyThumb || '',
                      };
                    });
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white rounded-xl transition shadow-sm cursor-pointer"
                >
                  {editingItem 
                    ? (lang === 'mr' ? 'बदल जतन करा' : lang === 'hi' ? 'बदलाव सहेजें' : 'Save Changes') 
                    : (lang === 'mr' ? 'बातमी प्रसिद्ध करा' : lang === 'hi' ? 'समाचार प्रकाशित करें' : 'Publish News')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
