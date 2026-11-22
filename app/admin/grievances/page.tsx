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
  Edit3,
  Play,
  Video,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  Film
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
  const [grievances, setGrievances] = useState<Grievance[]>(() => {
    if (typeof window !== 'undefined') {
      return firestoreService.getLocalGrievances();
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [selectedMediaGrievance, setSelectedMediaGrievance] = useState<Grievance | null>(null);
  const [playingCardVideoId, setPlayingCardVideoId] = useState<string | null>(null);

  // Helper to resolve video stream from Local App Uploads, Bunny Stream, or Firebase Storage
  const getPlayableVideoUrl = (mediaUrl?: string): { url: string; isIframe: boolean; provider: string } => {
    if (!mediaUrl) {
      return {
        url: '/uploads/videos/1000899124.mp4',
        isIframe: false,
        provider: 'ॲप व्हिडिओ (App Video)'
      };
    }

    const clean = mediaUrl.trim();

    // 0. App Local Uploaded Video File (/uploads/videos/...) or media://
    if (clean.startsWith('/uploads/') || clean.startsWith('uploads/')) {
      const path = clean.startsWith('/') ? clean : `/${clean}`;
      return {
        url: path,
        isIframe: false,
        provider: 'ॲप वरून आलेला मूळ व्हिडिओ (Original App Video)'
      };
    }

    if (clean.startsWith('media://')) {
      const fileName = clean.replace('media://', '');
      return {
        url: `/uploads/videos/${fileName}`,
        isIframe: false,
        provider: 'ॲप वरून आलेला मूळ व्हिडिओ (Original App Video)'
      };
    }

    if (/^[a-zA-Z0-9_.-]+\.(mp4|mov|webm|mkv|avi)$/i.test(clean)) {
      return {
        url: `/uploads/videos/${clean}`,
        isIframe: false,
        provider: 'ॲप वरून आलेला मूळ व्हिडिओ (Original App Video)'
      };
    }

    // 1. Direct Web URLs (HTTP / HTTPS / Blob / Data)
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('blob:') || clean.startsWith('data:')) {
      if (clean.includes('mediadelivery.net/')) {
        return { 
          url: clean.includes('?') ? clean : `${clean}?autoplay=true&preload=true`, 
          isIframe: true,
          provider: 'Bunny Stream HD'
        };
      }
      if (clean.includes('firebasestorage.googleapis.com')) {
        return {
          url: clean,
          isIframe: false,
          provider: 'Firebase Storage'
        };
      }
      if (clean.includes('youtube.com') || clean.includes('youtu.be')) {
        const ytMatch = clean.match(/(?:youtu\.be\/|v=|\/embed\/|\/watch\?v=)([^&?/]+)/);
        const ytId = ytMatch ? ytMatch[1] : '';
        return { 
          url: `https://www.youtube.com/embed/${ytId}?autoplay=1`, 
          isIframe: true,
          provider: 'YouTube'
        };
      }
      return { url: clean, isIframe: false, provider: 'Web Direct Stream' };
    }

    // 2. Bunny GUID (UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuidMatch = clean.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (uuidMatch) {
      return {
        url: `https://iframe.mediadelivery.net/embed/809137/${uuidMatch[1]}?autoplay=true&preload=true`,
        isIframe: true,
        provider: 'Bunny Stream HD'
      };
    }

    // 3. Firebase Storage path (e.g. gs:// or grievances/...)
    if (clean.startsWith('gs://') || clean.startsWith('grievances/')) {
      const filePath = clean.replace('gs://graminbharattv-f8994.firebasestorage.app/', '').replace('gs://', '');
      return {
        url: `https://firebasestorage.googleapis.com/v0/b/graminbharattv-f8994.firebasestorage.app/o/${encodeURIComponent(filePath)}?alt=media`,
        isIframe: false,
        provider: 'Firebase Storage'
      };
    }

    // Fallback: local uploaded video
    return {
      url: `/uploads/videos/${clean}`,
      isIframe: false,
      provider: 'ॲप वरून आलेला मूळ व्हिडिओ (Original App Video)'
    };
  };

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

  const loadData = async (silent = false) => {
    if (!silent && grievances.length === 0) {
      setLoading(true);
    }
    try {
      const list = await firestoreService.getGrievances();
      if (Array.isArray(list)) {
        if (list.length > 0) {
          setGrievances(list);
        } else if (!silent) {
          setGrievances([]);
        }
      }
    } catch (err) {
      console.warn('Error loading grievances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);

    // Silent background poll every 10 seconds without flashing or hiding the UI
    const interval = setInterval(() => {
      loadData(true);
    }, 10000);

    const handleGrievanceEvent = () => loadData(true);
    window.addEventListener('ott_grievance_created', handleGrievanceEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('ott_grievance_created', handleGrievanceEvent);
    };
  }, []);

  const handleStatusChange = async (id: string, status: 'pending' | 'verified' | 'published' | 'resolved') => {
    setGrievances(prev => prev.map(g => g.id === id ? { ...g, status } : g));
    try {
      await firestoreService.updateGrievanceStatus(id, status);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirmGrievance'))) return;
    setGrievances(prev => prev.filter(g => g.id !== id));
    try {
      await firestoreService.deleteGrievance(id);
    } catch (err) {
      console.error('Error deleting grievance:', err);
    }
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
    const safeVillage = g.village || 'ग्रामीण';
    const safeDistrict = g.district || 'महाराष्ट्र';
    const safeTaluka = g.taluka || '';
    const safeCitizen = g.citizenName || 'नागरिक';

    const newContent: ContentItem = {
      id: `news_grv_${Date.now()}`,
      type: 'news',
      title: `[जनतेचा आवाज] ${g.title || 'ग्रामीण समस्या'} (${safeVillage}, ${safeDistrict})`,
      slug: `news-${Date.now()}`,
      description: `${g.description || ''}\n\nगाव: ${safeVillage}, तालुका: ${safeTaluka}, जिल्हा: ${safeDistrict}\nनागरिक तक्रारदार: ${safeCitizen}`,
      tags: ['जनतेचा आवाज', 'ग्रामीण समस्या', safeDistrict, safeTaluka, safeVillage].filter(Boolean) as string[],
      genres: ['News', 'ग्रामीण समस्या'],
      cast: [safeCitizen],
      director: 'ग्रामीण भारत टीव्ही विशेष चमू',
      language: ['Marathi'],
      releaseDate: new Date().toISOString(),
      poster: g.mediaUrl || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80',
      banner: g.mediaUrl || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1200&auto=format&fit=crop&q=80',
      isPremium: false,
      isFeatured: true,
      status: 'published',
      rating: 'All',
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reporterName: `नागरिक रिपोर्टर (${safeCitizen})`,
      district: safeDistrict,
      taluka: safeTaluka,
      village: safeVillage,
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
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch = !q || 
      (g.title || '').toLowerCase().includes(q) ||
      (g.district || '').toLowerCase().includes(q) ||
      (g.village || '').toLowerCase().includes(q) ||
      (g.citizenName || '').toLowerCase().includes(q) ||
      (g.category || '').toLowerCase().includes(q);
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
            onClick={() => loadData(false)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
          >
            {t('refreshDataBtn')}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid - Clickable to filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'pending' ? 'all' : 'pending')}
          className={`p-5 rounded-2xl bg-white border shadow-luxury cursor-pointer transition select-none ${
            selectedStatus === 'pending' ? 'ring-2 ring-amber-500 border-amber-400 bg-amber-50/20' : 'border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              {t('pendingReview')}
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{pendingCount}</p>
          <span className="text-[10px] text-slate-400">{lang === 'mr' ? 'नवीन आलेल्या तक्रारी' : lang === 'hi' ? 'नई शिकायतें' : 'Newly submitted'}</span>
        </div>

        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'verified' ? 'all' : 'verified')}
          className={`p-5 rounded-2xl bg-white border shadow-luxury cursor-pointer transition select-none ${
            selectedStatus === 'verified' ? 'ring-2 ring-cyan-500 border-cyan-400 bg-cyan-50/20' : 'border-cyan-200 hover:border-cyan-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider">{t('statusVerified')}</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{verifiedCount}</p>
          <span className="text-[10px] text-slate-400">{lang === 'mr' ? 'पडताळणी पूर्ण' : lang === 'hi' ? 'सत्यापित' : 'Verification Complete'}</span>
        </div>

        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'published' ? 'all' : 'published')}
          className={`p-5 rounded-2xl bg-white border shadow-luxury cursor-pointer transition select-none ${
            selectedStatus === 'published' ? 'ring-2 ring-rose-500 border-rose-400 bg-rose-50/20' : 'border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">{lang === 'mr' ? 'बातम्यांमध्ये प्रसिद्ध' : lang === 'hi' ? 'समाचारों में प्रकाशित' : 'Published to OTT'}</span>
            <Sparkles className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{publishedCount}</p>
          <span className="text-[10px] text-slate-400">{lang === 'mr' ? 'बातम्यांमध्ये प्रसिद्ध' : lang === 'hi' ? 'प्रकाशित' : 'Published'}</span>
        </div>

        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'resolved' ? 'all' : 'resolved')}
          className={`p-5 rounded-2xl bg-white border shadow-luxury cursor-pointer transition select-none ${
            selectedStatus === 'resolved' ? 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/20' : 'border-emerald-200 hover:border-emerald-300'
          }`}
        >
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
                <p className="text-xs text-slate-600 line-clamp-3 mb-3 leading-relaxed">{g.description}</p>

                {/* Attached Video / Image Preview (from Mobile App or Web) */}
                {g.mediaUrl && (
                  <div className="mb-4">
                    {g.mediaType === 'video' || /\.(mp4|mov|webm|mkv|avi)/i.test(g.mediaUrl) || g.mediaUrl.startsWith('media://') ? (
                      playingCardVideoId === g.id ? (
                        /* Live In-Card Video Player (Bunny / Firebase / Web Stream) */
                        <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-700 shadow-2xl">
                          <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-xs">
                            <div className="flex items-center gap-2 text-rose-400 font-bold">
                              <Film className="w-4 h-4 animate-pulse" />
                              <span className="text-white text-xs">{lang === 'mr' ? 'व्हिडिओ प्ले होत आहे' : lang === 'hi' ? 'वीडियो चल रहा है' : 'Playing Video'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMediaGrievance(g);
                                }}
                                className="text-slate-400 hover:text-white px-2 py-0.5 rounded-lg hover:bg-slate-800 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                title="मोठ्या स्क्रीनवर पाहा"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>मोठ्या स्क्रीनवर</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPlayingCardVideoId(null);
                                }}
                                className="text-slate-400 hover:text-rose-400 px-2 py-0.5 rounded-lg hover:bg-slate-800 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>बंद करा</span>
                              </button>
                            </div>
                          </div>
                          {(() => {
                            const playable = getPlayableVideoUrl(g.mediaUrl);
                            return playable.isIframe ? (
                              <iframe
                                src={playable.url}
                                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                allowFullScreen
                                className="w-full h-64 sm:h-72 border-0 bg-black"
                              />
                            ) : (
                              <video
                                src={playable.url}
                                controls
                                autoPlay
                                playsInline
                                className="w-full h-64 sm:h-72 object-contain bg-black"
                              />
                            );
                          })()}
                        </div>
                      ) : (
                        /* Click to Play Video Card */
                        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/60 shadow-lg group">
                          {/* Live Video Frame Preview from actual file */}
                          <video
                            src={`${getPlayableVideoUrl(g.mediaUrl).url}#t=0.5`}
                            preload="metadata"
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-75 transition duration-300 pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30 pointer-events-none" />

                          <div 
                            className="relative h-48 flex flex-col items-center justify-center p-4 text-center cursor-pointer select-none"
                            onClick={() => setPlayingCardVideoId(g.id)}
                          >
                            {/* Play Button Icon */}
                            <div className="w-14 h-14 rounded-full bg-rose-600/95 border border-white/30 flex items-center justify-center text-white shadow-2xl group-hover:scale-110 group-hover:bg-rose-500 transition duration-300">
                              <Play className="w-6 h-6 fill-current translate-x-0.5 text-white" />
                            </div>

                            {/* Watch Video Button Badges */}
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPlayingCardVideoId(g.id);
                                }}
                                className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 shadow-lg flex items-center gap-1.5 text-white text-xs font-bold transition cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>{lang === 'mr' ? 'व्हिडिओ प्ले करा' : lang === 'hi' ? 'वीडियो चलाएं' : 'Play Video'}</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMediaGrievance(g);
                                }}
                                className="px-3.5 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-600/60 shadow-lg flex items-center gap-1.5 text-slate-200 text-xs font-bold transition cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>मोठ्या स्क्रीनवर</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                ॲप व्हिडिओ
                              </span>
                              <span className="text-[10px] text-slate-300 font-mono">
                                {g.mediaUrl.replace('media://', '').replace('/uploads/videos/', '')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      /* Attached Photo / Image Preview */
                      <div 
                        className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-h-56 group cursor-pointer bg-slate-100"
                        onClick={() => setSelectedMediaGrievance(g)}
                      >
                        <img
                          src={g.mediaUrl}
                          alt={g.title}
                          className="w-full max-h-56 object-cover group-hover:scale-105 transition duration-300"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow">
                          <ImageIcon className="w-3 h-3 text-amber-400" />
                          <span>{lang === 'mr' ? 'फोटो जोडला आहे' : lang === 'hi' ? 'फोटो संलग्न' : 'Photo Attached'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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

      {/* Media Preview Modal */}
      {selectedMediaGrievance && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-800 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-rose-600/20 text-rose-500 flex items-center justify-center border border-rose-500/30">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">{selectedMediaGrievance.title}</h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedMediaGrievance.village}, {selectedMediaGrievance.district} • {selectedMediaGrievance.citizenName} ({selectedMediaGrievance.contactNumber || 'N/A'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMediaGrievance(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Content */}
            <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 mb-4 flex flex-col items-center justify-center min-h-[300px]">
              {(() => {
                const isImage = selectedMediaGrievance.mediaType === 'image' || (/\.(jpg|jpeg|png|webp|gif)/i.test(selectedMediaGrievance.mediaUrl || '') && !/\.(mp4|mov|webm|mkv)/i.test(selectedMediaGrievance.mediaUrl || ''));
                if (isImage && (selectedMediaGrievance.mediaUrl?.startsWith('http://') || selectedMediaGrievance.mediaUrl?.startsWith('https://') || selectedMediaGrievance.mediaUrl?.startsWith('data:'))) {
                  return (
                    <img
                      src={selectedMediaGrievance.mediaUrl}
                      alt={selectedMediaGrievance.title}
                      className="w-full max-h-[60vh] object-contain"
                    />
                  );
                }

                const playable = getPlayableVideoUrl(selectedMediaGrievance.mediaUrl);
                return (
                  <div className="w-full">
                    <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-400 font-bold">{playable.provider}</span>
                        <span className="text-slate-400">• Library: 809137</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {selectedMediaGrievance.mediaUrl || 'Live Stream'}
                      </span>
                    </div>
                    {playable.isIframe ? (
                      <iframe
                        src={playable.url}
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                        allowFullScreen
                        className="w-full h-80 sm:h-96 md:h-[420px] border-0 bg-black"
                      />
                    ) : (
                      <video
                        src={playable.url}
                        controls
                        autoPlay
                        playsInline
                        className="w-full max-h-[60vh] object-contain bg-black"
                      />
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-400">
                तक्रार स्थिती: <span className="font-bold text-amber-400 capitalize">{selectedMediaGrievance.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const item = selectedMediaGrievance;
                    setSelectedMediaGrievance(null);
                    handlePublishAsNews(item);
                  }}
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>१-क्लिक बातमी प्रसिद्ध करा</span>
                </button>
                <button
                  onClick={() => setSelectedMediaGrievance(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  बंद करा (Close)
                </button>
              </div>
            </div>
          </div>
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
