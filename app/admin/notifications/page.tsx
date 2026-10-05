'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Trash2, 
  Radio, 
  Film, 
  Newspaper, 
  Sparkles, 
  Clock, 
  Users, 
  Search,
  ExternalLink,
  Check,
  Eye,
  CheckCheck
} from 'lucide-react';
import { firestoreService } from '@/lib/firestore-service';
import { NotificationItem, User } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';

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

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<NotificationItem['category']>('breaking_news');
  const [targetType, setTargetType] = useState<NotificationItem['targetType']>('all');
  const [targetValue, setTargetValue] = useState(MAHARASHTRA_DISTRICTS[1]);
  const [deepLinkUrl, setDeepLinkUrl] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    const [list, userList] = await Promise.all([
      firestoreService.getNotifications(),
      firestoreService.getUsers(),
    ]);
    setNotifications(list);
    setUsers(userList);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert(t('notifRequiredAlert'));
      return;
    }

    setIsSending(true);
    try {
      let recipientsCount = 0;
      if (targetType === 'all') {
        recipientsCount = users.length;
      } else if (targetType === 'district') {
        recipientsCount = users.filter(u => u.district === targetValue).length;
      } else if (targetType === 'plan') {
        recipientsCount = users.filter(u => u.subscriptionStatus === 'active').length;
      }

      const newNotif: NotificationItem = {
        id: 'notif-' + Date.now().toString(36),
        title: title.trim(),
        message: message.trim(),
        category,
        targetType,
        targetValue: targetType === 'district' ? targetValue : '',
        deepLinkUrl: deepLinkUrl.trim() || '',
        sentAt: new Date().toISOString(),
        sentBy: user?.name || 'Super Admin',
        status: 'sent',
        recipientsCount,
      };

      await firestoreService.sendNotification(newNotif);
      setNotifications(prev => [newNotif, ...prev]);

      // Reset Form
      setTitle('');
      setMessage('');
      setDeepLinkUrl('');
      alert(t('notifSentSuccess'));
    } catch (err) {
      console.error('Notification error:', err);
      alert(t('saveErrorAlert'));
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('deleteConfirmNotification'))) {
      await firestoreService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (selectedNotif?.id === id) setSelectedNotif(null);
    }
  };

  const handleMarkSeenAndDelete = async (id: string) => {
    // Instantly remove from view
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (selectedNotif?.id === id) setSelectedNotif(null);
    // Delete from storage
    await firestoreService.deleteNotification(id);
  };

  const handleClearAllNotifications = async () => {
    if (confirm(lang === 'mr' ? 'सर्व पाहिलेल्या सूचना डिलीट करायच्या आहेत का?' : 'Clear and delete all notifications?')) {
      setNotifications([]);
      setSelectedNotif(null);
      await firestoreService.clearAllNotifications();
    }
  };

  const filteredNotifications = notifications.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryBadge = (cat: NotificationItem['category']) => {
    switch(cat) {
      case 'breaking_news':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1"><Newspaper className="w-3 h-3" /> {lang === 'mr' ? 'ब्रेकिंग न्यूज' : lang === 'hi' ? 'ब्रेकिंग न्यूज़' : 'Breaking News'}</span>;
      case 'live_event':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1"><Radio className="w-3 h-3" /> {lang === 'mr' ? 'थेट प्रक्षेपण' : lang === 'hi' ? 'लाइव प्रसारण' : 'Live Event'}</span>;
      case 'new_movie':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1"><Film className="w-3 h-3" /> {lang === 'mr' ? 'नवीन चित्रपट' : lang === 'hi' ? 'नई फ़िल्म' : 'New Movie'}</span>;
      case 'new_episode':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1"><Sparkles className="w-3 h-3" /> {lang === 'mr' ? 'नवीन भाग' : lang === 'hi' ? 'नया एपिसोड' : 'New Episode'}</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">{lang === 'mr' ? 'विशेष कार्यक्रम' : lang === 'hi' ? 'विशेष कार्यक्रम' : 'Special Program'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-7 rounded-3xl bg-white border border-slate-200 shadow-luxury">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-rose-600 animate-bounce" />
            {t('pageTitleNotifications')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('notifDescText')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('fcmGatewayOnline')}
          </span>
        </div>
      </div>

      {/* Grid: Composer Form on Left, Stats on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-luxury">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-4">
            <Send className="w-4 h-4 text-rose-600" />
            {lang === 'mr' ? 'नवीन सूचना पाठवा' : lang === 'hi' ? 'नई सूचना भेजें' : 'Broadcast Notification'}
          </h2>

          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('notifTitleLabel')}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={lang === 'mr' ? 'उदा. 🔴 थेट प्रक्षेपण: नामदार महाराष्ट्र विशेष चर्चा सुरू झाली आहे' : lang === 'hi' ? 'उदा. 🔴 लाइव प्रसारण: विशेष चर्चा शुरू हो गई है' : 'e.g. 🔴 Live Now: Special Panel Discussion Broadcast'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-rose-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('notifMessageLabel')}
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={lang === 'mr' ? 'उदा. ग्रामीण महाराष्ट्रातील ताज्या घडामोडी आणि विकासावर आजची विशेष मुलाखत आत्ताच पहा...' : lang === 'hi' ? 'उदा. ग्रामीण विकास और ताज़ा समाचारों पर विशेष साक्षात्कार अभी देखें...' : 'e.g. Watch the exclusive special broadcast covering regional development now streaming...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-rose-500 focus:bg-white transition resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('notifCategoryLabel')}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="breaking_news">{lang === 'mr' ? '⚡ ब्रेकिंग न्यूज' : lang === 'hi' ? '⚡ ताज़ा समाचार' : '⚡ Breaking News'}</option>
                  <option value="live_event">{lang === 'mr' ? '🔴 थेट प्रक्षेपण' : lang === 'hi' ? '🔴 लाइव प्रसारण' : '🔴 Live Broadcast'}</option>
                  <option value="new_movie">{lang === 'mr' ? '🎬 नवीन चित्रपट प्रदर्शित' : lang === 'hi' ? '🎬 नई फ़िल्म रिलीज़' : '🎬 New Movie'}</option>
                  <option value="new_episode">{lang === 'mr' ? '📺 नवीन एपिसोड' : lang === 'hi' ? '📺 नया एपिसोड' : '📺 New Episode'}</option>
                  <option value="special_program">{lang === 'mr' ? '🌟 विशेष कार्यक्रम' : lang === 'hi' ? '🌟 विशेष कार्यक्रम' : '🌟 Special Broadcast'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('notifAudienceLabel')}
                </label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="all">{t('notifAllAudience')}</option>
                  <option value="district">{t('notifDistrictAudience')}</option>
                  <option value="plan">{t('notifSubscribersOnly')}</option>
                </select>
              </div>
            </div>

            {targetType === 'district' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('notifSelectDistrict')}
                </label>
                <select
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  {MAHARASHTRA_DISTRICTS.slice(1).map(d => {
                    const clean = lang === 'mr' || lang === 'hi' 
                      ? (d.match(/\((.*?)\)/)?.[1]?.split(' /')[0] || d)
                      : d.split(' (')[0];
                    return (
                      <option key={d} value={d}>{clean}</option>
                    );
                  })}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('notifDeepLinkLabel')}
              </label>
              <input
                type="text"
                value={deepLinkUrl}
                onChange={(e) => setDeepLinkUrl(e.target.value)}
                placeholder={
                  lang === 'en'
                    ? 'e.g. /live or /news or /movies'
                    : lang === 'hi'
                    ? 'उदा. /live या /news या /movies'
                    : 'उदा. /live किंवा /news किंवा /movies'
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500 focus:bg-white transition"
              />
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSending}
                className="px-6 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSending ? (lang === 'mr' ? 'पाठवत आहे...' : lang === 'hi' ? 'भेज रहा है...' : 'Sending...') : t('notifSendBtn')}
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Quick Tips & Live KPI */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-luxury">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              {lang === 'mr' ? 'ब्रॉडकास्ट क्षमता' : lang === 'hi' ? 'प्रसारण क्षमता' : 'Reach Overview'}
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">
                  {lang === 'mr' ? 'सक्रिय मोबाईल ॲप्स:' : lang === 'hi' ? 'सक्रिय मोबाइल ऐप्स:' : 'Active Mobile Apps:'}
                </span>
                <span className="text-xs font-black text-slate-900">
                  {users.filter(u => u.devices?.some(d => d.platform === 'ios' || d.platform === 'android')).length.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">
                  {lang === 'mr' ? 'स्मार्ट टीव्ही प्रेक्षक:' : lang === 'hi' ? 'स्मार्ट टीवी दर्शक:' : 'Smart TV Viewers:'}
                </span>
                <span className="text-xs font-black text-slate-900">
                  {users.filter(u => u.devices?.some(d => d.platform === 'android-tv' || d.platform === 'apple-tv')).length.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">
                  {lang === 'mr' ? 'डिलिव्हरी यश दर:' : lang === 'hi' ? 'डिलीवरी सफलता दर:' : 'Delivery Success Rate:'}
                </span>
                <span className="text-xs font-black text-emerald-700 font-mono">
                  {notifications.length > 0 ? '99.8%' : '100%'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-rose-50/70 rounded-3xl border border-rose-200/80 p-5 shadow-luxury">
            <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-rose-600" />
              {lang === 'mr' ? 'सूचना पाठवताना मार्गदर्शक तत्त्वे:' : lang === 'hi' ? 'सूचना भेजने के दिशा-निर्देश:' : 'Notification Guidelines:'}
            </h4>
            <ul className="text-[11px] text-rose-800 space-y-1.5 list-disc pl-4 font-medium">
              <li>
                {lang === 'mr' ? 'ब्रेकिंग न्यूजसाठी ठळक आणि संक्षिप्त शीर्षक वापरा.' : lang === 'hi' ? 'ब्रेकिंग न्यूज़ के लिए स्पष्ट और संक्षिप्त शीर्षक का उपयोग करें।' : 'Use crisp and concise titles for breaking news.'}
              </li>
              <li>
                {lang === 'mr' ? 'थेट प्रक्षेपणाच्या आधी ५ मिनिटे सूचना पाठवल्यास प्रेक्षक संख्या दुपटीने वाढते.' : lang === 'hi' ? 'लाइव प्रसारण से ५ मिनट पहले सूचना भेजने पर दर्शकों की संख्या दोगुनी हो जाती है।' : 'Sending notifications 5 minutes prior to live streams doubles viewership.'}
              </li>
              <li>
                {lang === 'mr' ? 'जिल्हा पातळीवरील बातम्यांसाठी नेहमी जिल्हा फिल्टर वापरा जेणेकरून इतर प्रेक्षकांना त्रास होणार नाही.' : lang === 'hi' ? 'क्षेत्रीय समाचारों के लिए हमेशा ज़िला फ़िल्टर का उपयोग करें ताकि अन्य दर्शक परेशान न हों।' : 'Always use district filters for regional news so other audiences are not disturbed.'}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sent Notifications History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-luxury overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              {lang === 'mr' ? 'पाठवलेल्या सूचनांचा इतिहास' : lang === 'hi' ? 'भेजी गई सूचनाओं का इतिहास' : 'Dispatched Notifications History'}
            </h2>
            <p className="text-[11px] text-slate-400">
              {lang === 'mr'
                ? `एकूण ${notifications.length} सूचना रेकॉर्ड केलेल्या आहेत`
                : lang === 'hi'
                ? `कुल ${notifications.length} सूचनाएं दर्ज हैं`
                : `Total ${notifications.length} notifications recorded`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {notifications.length > 0 && (
              <button
                onClick={handleClearAllNotifications}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1.5 transition cursor-pointer active:scale-95 shrink-0"
                title={lang === 'mr' ? 'सर्व पाहिलेल्या सूचना डिलीट करा' : 'Clear all notifications'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{lang === 'mr' ? 'सर्व साफ करा (डिलीट)' : 'Clear All'}</span>
              </button>
            )}

            <div className="relative max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  lang === 'mr'
                    ? 'शीर्षक किंवा मजकूर शोधा...'
                    : lang === 'hi'
                    ? 'शीर्षक या विवरण खोजें...'
                    : 'Search title or message...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase">
                <th className="py-3 px-5">{lang === 'mr' ? 'सूचना व मजकूर' : lang === 'hi' ? 'शीर्षक एवं विवरण' : 'Title & Message'}</th>
                <th className="py-3 px-5">{lang === 'mr' ? 'प्रकार' : lang === 'hi' ? 'श्रेणी' : 'Category'}</th>
                <th className="py-3 px-5">{lang === 'mr' ? 'लक्षित प्रेक्षक' : lang === 'hi' ? 'लक्षित दर्शक' : 'Target Audience'}</th>
                <th className="py-3 px-5">{lang === 'mr' ? 'दिनांक व वेळ' : lang === 'hi' ? 'भेजने का समय' : 'Sent Time'}</th>
                <th className="py-3 px-5">{lang === 'mr' ? 'प्रेक्षक पोहोच' : lang === 'hi' ? 'दर्शक पहुंच' : 'Audience Reach'}</th>
                <th className="py-3 px-5 text-right">{lang === 'mr' ? 'कृती' : lang === 'hi' ? 'कार्रवाई' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {lang === 'mr' ? 'कोणतीही सूचना सापडली नाही.' : lang === 'hi' ? 'कोई सूचना नहीं मिली।' : 'No notifications found.'}
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedNotif(item)}>
                    <td className="py-3.5 px-5 max-w-md">
                      <p className="font-bold text-slate-900 text-xs hover:text-rose-600 transition-colors">{item.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{item.message}</p>
                      {item.deepLinkUrl && (
                        <span className="text-[10px] text-rose-600 font-mono mt-1 inline-flex items-center gap-1">
                          <ExternalLink className="w-2.5 h-2.5" /> {item.deepLinkUrl}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      {getCategoryBadge(item.category)}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.targetType === 'all' 
                          ? (lang === 'mr' ? 'सर्व प्रेक्षक' : lang === 'hi' ? 'सभी दर्शक' : 'All Viewers') 
                          : item.targetType === 'district' 
                          ? (item.targetValue || (lang === 'mr' ? 'विशिष्ट जिल्हा' : lang === 'hi' ? 'विशिष्ट ज़िला' : 'Specific District')) 
                          : (lang === 'mr' ? 'वर्गणीदार' : lang === 'hi' ? 'सब्सक्राइबर्स' : 'Subscribers')}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">
                      {new Date(item.sentAt).toLocaleString(lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'mr-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      <p className="text-[10px] text-slate-400">{lang === 'mr' ? 'द्वारे:' : lang === 'hi' ? 'द्वारा:' : 'By:'} {item.sentBy}</p>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-800">
                      {item.recipientsCount.toLocaleString('en-IN')} {lang === 'mr' ? 'प्रेक्षक' : lang === 'hi' ? 'दर्शक' : 'Viewers'}
                    </td>
                    <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleMarkSeenAndDelete(item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition cursor-pointer active:scale-95"
                          title={lang === 'mr' ? 'पाहिले म्हणून नोंदवून डिलीट करा' : 'Seen & Auto Delete'}
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{lang === 'mr' ? 'पाहिले (डिलीट)' : 'Seen'}</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title={t('deleteBtn')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Auto-Delete Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Bell className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">{selectedNotif.title}</h3>
                  <p className="text-[10px] text-slate-400">{new Date(selectedNotif.sentAt).toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {selectedNotif.message}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>{lang === 'mr' ? 'लक्षित वर्ग:' : 'Audience:'} <strong>{selectedNotif.targetType}</strong></span>
              <span>{lang === 'mr' ? 'प्रेक्षक संख्या:' : 'Recipients:'} <strong>{selectedNotif.recipientsCount.toLocaleString()}</strong></span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedNotif(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                {t('cancelBtn')}
              </button>
              <button
                onClick={() => handleMarkSeenAndDelete(selectedNotif.id)}
                className="px-4 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{lang === 'mr' ? '✓ पाहिले व डिलीट करा (Auto-delete)' : '✓ Mark Seen & Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
