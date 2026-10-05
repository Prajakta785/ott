'use client';

import React, { useState, useEffect } from 'react';
import { firestoreService } from '@/lib/firestore-service';
import { Grievance, ContentItem } from '@/lib/types';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Send, 
  Trash2, 
  Filter, 
  Search,
  Sparkles,
  Share2,
  Megaphone,
  Plus,
  X,
  Check,
  Edit3
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

const MAHARASHTRA_DISTRICTS = [
  'अहमदनगर / अहिल्यानगर (Ahmednagar)',
  'अकोला (Akola)',
  'अमरावती (Amravati)',
  'छत्रपती संभाजीनगर / औरंगाबाद (Chhatrapati Sambhajinagar)',
  'बीड (Beed)',
  'भंडारा (Bhandara)',
  'बुलढाणा (Buldhana)',
  'चंद्रपूर (Chandrapur)',
  'धुळे (Dhule)',
  'गडचिरोली (Gadchiroli)',
  'गोंदिया (Gondia)',
  'हिंगोली (Hingoli)',
  'जळगाव (Jalgaon)',
  'जालना (Jalna)',
  'कोल्हापूर (Kolhapur)',
  'लातूर (Latur)',
  'मुंबई शहर (Mumbai City)',
  'मुंबई उपनगर (Mumbai Suburban)',
  'नागपूर (Nagpur)',
  'नांदेड (Nanded)',
  'नंदुरबार (Nandurbar)',
  'नाशिक (Nashik)',
  'धाराशिव / उस्मानाबाद (Dharashiv)',
  'पालघर (Palghar)',
  'परभणी (Parbhani)',
  'पुणे (Pune)',
  'रायगड (Raigad)',
  'रत्नागिरी (Ratnagiri)',
  'सांगली (Sangli)',
  'सातारा (Satara)',
  'सिंधुदुर्ग (Sindhudurg)',
  'सोलापूर (Solapur)',
  'ठाणे (Thane)',
  'वर्धा (Wardha)',
  'वाशीम (Washim)',
  'यवतमाळ (Yavatmal)'
];

const GRIEVANCE_CATEGORIES = [
  { id: 'water', mr: 'पाणी समस्या व टंचाई', hi: 'पानी समस्या व किल्लत', en: 'Water Shortage / Supply' },
  { id: 'roads', mr: 'रस्ते, खड्डे व वाहतूक', hi: 'सड़क व यातायात समस्या', en: 'Roads & Infrastructure' },
  { id: 'electricity', mr: 'वीज पुरवठा व लोडशेडिंग', hi: 'बिजली आपूर्ति व कटौती', en: 'Electricity & Power' },
  { id: 'health', mr: 'आरोग्य केंद्र व रुग्णालये', hi: 'स्वास्थ्य केंद्र व अस्पताल', en: 'Healthcare & Hospitals' },
  { id: 'farming', mr: 'शेती, कर्ज व महसूल', hi: 'कृषि, ऋण व राजस्व', en: 'Agriculture & Revenue' },
  { id: 'sanitation', mr: 'स्वच्छता व सांडपाणी', hi: 'स्वच्छता व जल निकासी', en: 'Sanitation & Sewage' },
  { id: 'education', mr: 'शाळा व शिक्षण सुविधा', hi: 'स्कूल व शिक्षा सुविधाएं', en: 'Education & Schools' },
  { id: 'other', mr: 'इतर प्रशासकीय समस्या', hi: 'अन्य प्रशासनिक समस्याएं', en: 'Other Public Grievances' },
];

export default function GrievancesPage() {
  const { t, lang } = useLanguage();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // New Grievance Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGrievance, setNewGrievance] = useState({
    citizenName: '',
    contactNumber: '',
    district: MAHARASHTRA_DISTRICTS[0],
    taluka: '',
    village: '',
    title: '',
    category: GRIEVANCE_CATEGORIES[0].mr,
    description: '',
    mediaUrl: '',
    status: 'pending' as 'pending' | 'verified' | 'published' | 'resolved',
    adminNotes: '',
  });

  // Edit Grievance Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGrievance, setEditingGrievance] = useState<Grievance | null>(null);
  const [editFormData, setEditFormData] = useState({
    citizenName: '',
    contactNumber: '',
    district: MAHARASHTRA_DISTRICTS[0],
    taluka: '',
    village: '',
    title: '',
    category: GRIEVANCE_CATEGORIES[0].mr,
    description: '',
    mediaUrl: '',
    status: 'pending' as 'pending' | 'verified' | 'published' | 'resolved',
    adminNotes: '',
  });

  const openEditModal = (g: Grievance) => {
    setEditingGrievance(g);
    setEditFormData({
      citizenName: g.citizenName,
      contactNumber: g.contactNumber,
      district: g.district || MAHARASHTRA_DISTRICTS[0],
      taluka: g.taluka || '',
      village: g.village || '',
      title: g.title,
      category: g.category || GRIEVANCE_CATEGORIES[0].mr,
      description: g.description,
      mediaUrl: g.mediaUrl || '',
      status: g.status,
      adminNotes: g.adminNotes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrievance) return;
    if (!editFormData.citizenName.trim() || !editFormData.contactNumber.trim() || !editFormData.title.trim() || !editFormData.description.trim()) {
      alert(lang === 'mr' ? 'कृपया सर्व आवश्यक माहिती भरा.' : lang === 'hi' ? 'कृपया सभी आवश्यक जानकारी भरें।' : 'Please fill all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedItem: Grievance = {
        ...editingGrievance,
        citizenName: editFormData.citizenName.trim(),
        contactNumber: editFormData.contactNumber.trim(),
        district: editFormData.district.trim(),
        taluka: editFormData.taluka.trim() || (lang === 'mr' ? 'तालुका नमूद नाही' : lang === 'hi' ? 'तहसील उल्लेखित नहीं' : 'N/A'),
        village: editFormData.village.trim() || (lang === 'mr' ? 'गाव नमूद नाही' : lang === 'hi' ? 'गांव उल्लेखित नहीं' : 'N/A'),
        title: editFormData.title.trim(),
        category: editFormData.category,
        description: editFormData.description.trim(),
        mediaUrl: editFormData.mediaUrl.trim() || undefined,
        status: editFormData.status,
        adminNotes: editFormData.adminNotes.trim() || undefined,
      };

      await firestoreService.saveGrievance(updatedItem);
      setGrievances(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      setIsEditModalOpen(false);
      setEditingGrievance(null);
      alert(lang === 'mr' ? 'तक्रार यशस्वीरित्या अद्ययावत केली!' : lang === 'hi' ? 'शिकायत सफलतापूर्वक अपडेट की गई!' : 'Grievance updated successfully!');
    } catch (err) {
      console.error('Error updating grievance:', err);
      alert(lang === 'mr' ? 'तक्रार अद्ययावत करण्यात अयशस्वी.' : lang === 'hi' ? 'शिकायत अपडेट करने में विफल।' : 'Failed to update grievance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const list = await firestoreService.getGrievances();
    setGrievances(list);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, status: 'pending' | 'verified' | 'published' | 'resolved') => {
    await firestoreService.updateGrievanceStatus(id, status);
    setGrievances(prev => prev.map(g => g.id === id ? { ...g, status } : g));
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirmGrievance'))) return;
    await firestoreService.deleteGrievance(id);
    setGrievances(prev => prev.filter(g => g.id !== id));
  };

  const handleCreateGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrievance.citizenName.trim() || !newGrievance.contactNumber.trim() || !newGrievance.title.trim() || !newGrievance.description.trim()) {
      alert(lang === 'mr' ? 'कृपया सर्व आवश्यक माहिती भरा.' : lang === 'hi' ? 'कृपया सभी आवश्यक जानकारी भरें।' : 'Please fill all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemToSave: Grievance = {
        id: `grv_${Date.now()}`,
        citizenName: newGrievance.citizenName.trim(),
        contactNumber: newGrievance.contactNumber.trim(),
        district: newGrievance.district.trim(),
        taluka: newGrievance.taluka.trim() || (lang === 'mr' ? 'तालुका नमूद नाही' : lang === 'hi' ? 'तहसील उल्लेखित नहीं' : 'N/A'),
        village: newGrievance.village.trim() || (lang === 'mr' ? 'गाव नमूद नाही' : lang === 'hi' ? 'गांव उल्लेखित नहीं' : 'N/A'),
        title: newGrievance.title.trim(),
        category: newGrievance.category,
        description: newGrievance.description.trim(),
        mediaUrl: newGrievance.mediaUrl.trim() || undefined,
        status: newGrievance.status,
        adminNotes: newGrievance.adminNotes.trim() || undefined,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await firestoreService.saveGrievance(itemToSave);
      setGrievances(prev => [itemToSave, ...prev]);
      setIsCreateModalOpen(false);
      setNewGrievance({
        citizenName: '',
        contactNumber: '',
        district: MAHARASHTRA_DISTRICTS[0],
        taluka: '',
        village: '',
        title: '',
        category: GRIEVANCE_CATEGORIES[0].mr,
        description: '',
        mediaUrl: '',
        status: 'pending',
        adminNotes: '',
      });
      alert(t('grievanceAddedSuccess'));
    } catch (err) {
      console.error('Error creating grievance:', err);
      alert(lang === 'mr' ? 'तक्रार जतन करण्यात अयशस्वी.' : lang === 'hi' ? 'शिकायत दर्ज करने में विफल।' : 'Failed to save grievance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishAsNews = async (g: Grievance) => {
    setPublishingId(g.id);
    const newContent: ContentItem = {
      id: `news_grv_${Date.now()}`,
      type: 'news',
      title: `[जनतेचा आवाज] ${g.title} (${g.village}, ${g.district})`,
      slug: `news-${g.village.toLowerCase()}-${Date.now()}`,
      description: `${g.description}\n\nगाव: ${g.village}, तालुका: ${g.taluka}, जिल्हा: ${g.district}\nनागरिक तक्रारदार: ${g.citizenName}`,
      tags: ['जनतेचा आवाज', 'ग्रामीण समस्या', g.district, g.taluka],
      genres: ['News', 'Public Grievance'],
      cast: [g.citizenName],
      director: 'ग्रामीण भारत टीव्ही विशेष चमू',
      language: ['Marathi'],
      releaseDate: new Date().toISOString(),
      poster: g.mediaUrl || '',
      banner: g.mediaUrl || '',
      isPremium: false,
      isFeatured: true,
      status: 'published',
      rating: 'All',
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reporterName: `नागरिक रिपोर्टर (${g.citizenName})`,
      district: g.district,
      taluka: g.taluka,
      village: g.village,
      subCategory: 'ग्रामीण समस्या / जनतेचा आवाज',
      resolution: '1080p Full HD',
    };

    await firestoreService.saveContent(newContent);
    await firestoreService.updateGrievanceStatus(g.id, 'published', `Published as News Content ID: ${newContent.id}`);
    setGrievances(prev => prev.map(item => item.id === g.id ? { ...item, status: 'published' } : item));
    setPublishingId(null);
    alert(t('grievancePublishedAlert'));
  };

  const filtered = grievances.filter(g => {
    const matchesStatus = selectedStatus === 'all' || g.status === selectedStatus;
    const matchesSearch = searchQuery === '' || 
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.citizenName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = grievances.filter(g => g.status === 'pending').length;
  const verifiedCount = grievances.filter(g => g.status === 'verified').length;
  const publishedCount = grievances.filter(g => g.status === 'published').length;
  const resolvedCount = grievances.filter(g => g.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-7 rounded-3xl bg-white border border-slate-200 shadow-luxury">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-amber-600" />
            {t('pageTitleGrievances')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('grievanceDescText')}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>{t('addNewGrievance')}</span>
          </button>

          <button
            onClick={loadData}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
          >
            {t('refreshDataBtn')}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-luxury">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              {t('pendingReview')}
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{pendingCount}</p>
          <span className="text-[10px] text-slate-400">{lang === 'mr' ? 'नवीन आलेल्या तक्रारी' : lang === 'hi' ? 'नई शिकायतें' : 'Newly submitted'}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-cyan-200 shadow-luxury">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider">{t('statusVerified')}</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{verifiedCount}</p>
          <span className="text-[10px] text-slate-400">{lang === 'mr' ? 'पडताळणी पूर्ण' : lang === 'hi' ? 'सत्यापित' : 'Verification Complete'}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-luxury">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">{lang === 'mr' ? 'बातम्यांमध्ये प्रसिद्ध' : lang === 'hi' ? 'समाचारों में प्रकाशित' : 'Published to OTT'}</span>
            <Sparkles className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{publishedCount}</p>
          <span className="text-[10px] text-slate-400">{lang === 'mr' ? 'बातम्यांमध्ये प्रसिद्ध' : lang === 'hi' ? 'प्रकाशित' : 'Published'}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-luxury">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">{t('statusResolved')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{resolvedCount}</p>
          <span className="text-[10px] text-slate-400">{lang === 'mr' ? 'समस्या सुटली' : lang === 'hi' ? 'समाधान हुआ' : 'Issue Resolved'}</span>
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
            placeholder={lang === 'mr' ? 'जिल्हा, तालुका, गाव किंवा नागरिकाचे नाव शोधा...' : lang === 'hi' ? 'जिला, तहसील, गांव या नागरिक का नाम खोजें...' : 'Search by district, taluka, village, or citizen name...'}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['all', 'pending', 'verified', 'published', 'resolved'].map((status) => {
            const statusLabel = status === 'all' 
              ? t('filterAllStatus') 
              : status === 'pending' 
              ? t('statusPending') 
              : status === 'verified' 
              ? t('statusVerified') 
              : status === 'published' 
              ? t('statusPublished') 
              : t('statusResolved');
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition cursor-pointer ${
                  selectedStatus === status
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {statusLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grievance Cards List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">{t('loadingText')}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200 shadow-sm">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-800 font-bold text-sm">
            {lang === 'mr' ? 'कोणतीही तक्रार सापडली नाही.' : lang === 'hi' ? 'कोई शिकायत नहीं मिली।' : 'No grievances found.'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'mr'
              ? 'वर दिलेल्या "नवीन तक्रार नोंदवा" बटणावर क्लिक करून किंवा मोबाईल अॅपवरून नागरिक तक्रार नोंदवू शकतात.'
              : lang === 'hi'
              ? 'ऊपर दिए गए "नई शिकायत दर्ज करें" बटन पर क्लिक करके या मोबाइल ऐप से नागरिक शिकायत दर्ज कर सकते हैं।'
              : 'Citizens or administrators can register grievances by clicking the "Add New Grievance" button above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((g) => (
            <div 
              key={g.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-rose-300 shadow-luxury hover:shadow-luxury-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                    {g.category}
                  </span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full capitalize ${
                    g.status === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    g.status === 'verified' ? 'bg-cyan-50 text-cyan-800 border border-cyan-200' :
                    g.status === 'published' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                    'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {g.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mb-1">{g.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">{g.description}</p>

                <div className="grid grid-cols-2 gap-2 p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-700 mb-4 border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="truncate"><strong>{lang === 'mr' ? 'गाव:' : lang === 'hi' ? 'गांव:' : 'Village:'}</strong> {g.village} ({g.taluka})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-bold">•</span>
                    <span className="truncate"><strong>{lang === 'mr' ? 'जिल्हा:' : lang === 'hi' ? 'ज़िला:' : 'District:'}</strong> {g.district}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{g.citizenName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{g.contactNumber}</span>
                  </div>
                </div>

                {g.adminNotes && (
                  <div className="mb-4 p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/60 text-[11px] text-amber-900">
                    <strong className="text-amber-800">{lang === 'mr' ? 'प्रशासक टीप:' : lang === 'hi' ? 'व्यवस्थापक टिप्पणी:' : 'Admin Note:'}</strong> {g.adminNotes}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                <div className="flex items-center gap-1.5">
                  {g.status !== 'published' && (
                    <button
                      onClick={() => handlePublishAsNews(g)}
                      disabled={publishingId === g.id}
                      className="px-3.5 py-1.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      {publishingId === g.id ? (lang === 'mr' ? 'प्रसिद्ध करत आहे...' : lang === 'hi' ? 'प्रकाशित कर रहे हैं...' : 'Publishing...') : (lang === 'mr' ? '१-क्लिक बातमी प्रसिद्ध करा' : lang === 'hi' ? '१-क्लिक समाचार प्रकाशित करें' : '1-Click Publish to News')}
                    </button>
                  )}
                  {g.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(g.id, 'verified')}
                      className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      {lang === 'mr' ? 'पडताळणी करा' : lang === 'hi' ? 'सत्यापित करें' : 'Verify'}
                    </button>
                  )}
                  {g.status !== 'resolved' && (
                    <button
                      onClick={() => handleStatusChange(g.id, 'resolved')}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      {lang === 'mr' ? 'निवारण झाले' : lang === 'hi' ? 'समाधान करें' : 'Resolve'}
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(g)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    title={lang === 'mr' ? 'तक्रार संपादित करा' : lang === 'hi' ? 'शिकायत संपादित करें' : 'Edit Grievance'}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    <span>{lang === 'mr' ? 'संपादित करा' : lang === 'hi' ? 'संपादित करें' : 'Edit'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(g)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                    title={lang === 'mr' ? 'तक्रार संपादित करा' : lang === 'hi' ? 'शिकायत संपादित करें' : 'Edit Grievance'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title={t('deleteBtn')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Grievance Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-luxury-lg border border-slate-200 max-h-[92vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {t('modalTitleAddGrievance')}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'mr' ? 'नागरिकाची तक्रार दाखल करा आणि तत्काळ निवारणासाठी पुढे पाठवा' : lang === 'hi' ? 'नागरिक की शिकायत दर्ज करें और तुरंत निवारण के लिए आगे भेजें' : 'Register citizen grievance for review and resolution'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCreateModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGrievance} className="space-y-4 text-xs">
              {/* Row 1: Citizen Name & Contact Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('citizenNameLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    value={newGrievance.citizenName}
                    onChange={(e) => setNewGrievance({ ...newGrievance, citizenName: e.target.value })}
                    placeholder={lang === 'mr' ? 'उदा. ज्ञानेश्वर पाटील' : lang === 'hi' ? 'उदा. ज्ञानेश्वर पाटिल' : 'e.g. Ramesh Patil'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('contactNumberLabel')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={newGrievance.contactNumber}
                    onChange={(e) => setNewGrievance({ ...newGrievance, contactNumber: e.target.value })}
                    placeholder={lang === 'mr' ? 'उदा. 9876543210' : lang === 'hi' ? 'उदा. 9876543210' : 'e.g. 9876543210'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Row 2: District, Taluka, Village */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('districtLabel')}
                  </label>
                  <select
                    value={newGrievance.district}
                    onChange={(e) => setNewGrievance({ ...newGrievance, district: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  >
                    {MAHARASHTRA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('talukaLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    value={newGrievance.taluka}
                    onChange={(e) => setNewGrievance({ ...newGrievance, taluka: e.target.value })}
                    placeholder={lang === 'mr' ? 'उदा. शेवगाव' : lang === 'hi' ? 'उदा. शेवगांव' : 'e.g. Shevgaon'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('villageLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    value={newGrievance.village}
                    onChange={(e) => setNewGrievance({ ...newGrievance, village: e.target.value })}
                    placeholder={lang === 'mr' ? 'उदा. बोधेगाव' : lang === 'hi' ? 'उदा. बोधेगांव' : 'e.g. Bodhegaon'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Row 3: Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('categoryLabel')}
                  </label>
                  <select
                    value={newGrievance.category}
                    onChange={(e) => setNewGrievance({ ...newGrievance, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  >
                    {GRIEVANCE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat[lang as 'en' | 'hi' | 'mr'] || cat.mr}>
                        {cat[lang as 'en' | 'hi' | 'mr'] || cat.mr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('statusLabel')}
                  </label>
                  <select
                    value={newGrievance.status}
                    onChange={(e) => setNewGrievance({ ...newGrievance, status: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  >
                    <option value="pending">{t('statusPending')}</option>
                    <option value="verified">{t('statusVerified')}</option>
                    <option value="published">{t('statusPublished')}</option>
                    <option value="resolved">{t('statusResolved')}</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Subject / Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('subjectLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={newGrievance.title}
                  onChange={(e) => setNewGrievance({ ...newGrievance, title: e.target.value })}
                  placeholder={lang === 'mr' ? 'उदा. गावात गेल्या १५ दिवसांपासून पिण्याच्या पाण्याची तीव्र टंचाई' : lang === 'hi' ? 'उदा. गांव में पिछले १५ दिनों से पीने के पानी की गंभीर किल्लत' : 'e.g. Severe drinking water shortage in village for 15 days'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                />
              </div>

              {/* Row 5: Details */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('detailsLabel')}
                </label>
                <textarea
                  required
                  rows={4}
                  value={newGrievance.description}
                  onChange={(e) => setNewGrievance({ ...newGrievance, description: e.target.value })}
                  placeholder={lang === 'mr' ? 'समस्या सविस्तर लिहा, किती नागरिकांवर परिणाम झाला आहे, प्रशासनाकडे कधी पाठपुरावा केला होता इत्यादी...' : lang === 'hi' ? 'समस्या का विस्तृत विवरण लिखें...' : 'Write detailed grievance description...'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900 leading-relaxed"
                />
              </div>

              {/* Row 6: Media URL (optional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('mediaUrlLabel')}
                </label>
                <input
                  type="url"
                  value={newGrievance.mediaUrl}
                  onChange={(e) => setNewGrievance({ ...newGrievance, mediaUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/... किंवा फोटो/व्हिडिओ URL"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                />
              </div>

              {/* Row 7: Admin Notes (optional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('adminNotesLabel')}
                </label>
                <input
                  type="text"
                  value={newGrievance.adminNotes}
                  onChange={(e) => setNewGrievance({ ...newGrievance, adminNotes: e.target.value })}
                  placeholder={lang === 'mr' ? 'प्रशासक अंतर्गत टिप्पणी (ऐच्छिक)' : lang === 'hi' ? 'व्यवस्थापक आंतरिक टिप्पणी (वैकल्पिक)' : 'Internal notes or action plan'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? t('savingGrievanceBtn') : t('saveGrievanceBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Grievance Modal */}
      {isEditModalOpen && editingGrievance && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-luxury-lg border border-slate-200 max-h-[92vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {lang === 'mr' ? 'तक्रार संपादित करा' : lang === 'hi' ? 'शिकायत संपादित करें' : 'Edit Grievance'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'mr' ? 'नागरिकाची तक्रार, स्थिती व माहिती अपडेट करा' : lang === 'hi' ? 'नागरिक की शिकायत, स्थिति व जानकारी अपडेट करें' : 'Update citizen grievance details, status and notes'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateGrievance} className="space-y-4 text-xs">
              {/* Row 1: Citizen Name & Contact Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('citizenNameLabel')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.citizenName}
                    onChange={(e) => setEditFormData({ ...editFormData, citizenName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('contactNumberLabel')} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editFormData.contactNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, contactNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Row 2: District, Taluka, Village */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('districtLabel')} *
                  </label>
                  <select
                    value={editFormData.district}
                    onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  >
                    {MAHARASHTRA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('talukaLabel')}
                  </label>
                  <input
                    type="text"
                    value={editFormData.taluka}
                    onChange={(e) => setEditFormData({ ...editFormData, taluka: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('villageLabel')}
                  </label>
                  <input
                    type="text"
                    value={editFormData.village}
                    onChange={(e) => setEditFormData({ ...editFormData, village: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Row 3: Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('subjectLabel')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('categoryLabel')} *
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
                  >
                    {GRIEVANCE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.mr}>
                        {lang === 'mr' ? c.mr : lang === 'hi' ? c.hi : c.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Status */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('statusLabel')} *
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900 font-bold"
                >
                  <option value="pending">{t('statusPending')}</option>
                  <option value="verified">{t('statusVerified')}</option>
                  <option value="published">{t('statusPublished')}</option>
                  <option value="resolved">{t('statusResolved')}</option>
                </select>
              </div>

              {/* Row 5: Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('detailsLabel')} *
                </label>
                <textarea
                  required
                  rows={4}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900 leading-relaxed"
                />
              </div>

              {/* Row 6: Media URL (optional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('mediaUrlLabel')}
                </label>
                <input
                  type="url"
                  value={editFormData.mediaUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, mediaUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/... किंवा फोटो/व्हिडिओ URL"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900 font-mono text-xs"
                />
              </div>

              {/* Row 7: Admin Notes (optional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('adminNotesLabel')}
                </label>
                <input
                  type="text"
                  value={editFormData.adminNotes}
                  onChange={(e) => setEditFormData({ ...editFormData, adminNotes: e.target.value })}
                  placeholder={lang === 'mr' ? 'प्रशासक अंतर्गत टिप्पणी किंवा कारवाईची नोंद' : lang === 'hi' ? 'व्यवस्थापक आंतरिक टिप्पणी या कार्रवाई का विवरण' : 'Internal notes or action plan'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting 
                    ? (lang === 'mr' ? 'जतन करत आहे...' : lang === 'hi' ? 'सहेज रहे हैं...' : 'Saving...')
                    : (lang === 'mr' ? 'बदल जतन करा' : lang === 'hi' ? 'बदलाव सहेजें' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
