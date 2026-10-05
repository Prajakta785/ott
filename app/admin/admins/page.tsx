'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Check, 
  X, 
  Lock, 
  Sparkles, 
  Users, 
  ExternalLink, 
  ArrowRight,
  Eye,
  Radio,
  Newspaper,
  Film,
  Tv,
  Headphones,
  Bell,
  IndianRupee,
  CreditCard,
  BarChart3,
  Building2,
  CheckCircle2,
  XCircle,
  Megaphone,
  Layers
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { firestoreService } from '@/lib/firestore-service';
import { AdminRole, AdminUser } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';

interface ModuleAccess {
  name: string;
  marathiName: string;
  icon: string;
  path: string;
  desc: string;
}

const ROLE_ACCESS_DETAILS: Record<AdminRole, {
  label: string;
  marathiLabel: string;
  badgeColor: string;
  cardBorder: string;
  tagColor: string;
  canPublish: boolean;
  canDelete: boolean;
  canManageAdmins: boolean;
  modules: ModuleAccess[];
}> = {
  superadmin: {
    label: 'Super Admin',
    marathiLabel: 'सुपर ॲडमिन (मुख्य प्रशासक)',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    cardBorder: 'border-amber-200 bg-amber-50/40',
    tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
    canPublish: true,
    canDelete: true,
    canManageAdmins: true,
    modules: [
      { name: 'Full Dashboard', marathiName: 'मुख्य डॅशबोर्ड', icon: '👑', path: '/', desc: 'सर्व आकडेवारी, युजर्स व महसूल विहंगावलोकन' },
      { name: 'Live TV Streaming', marathiName: 'थेट टीव्ही नियंत्रण', icon: '🔴', path: '/live', desc: '24x7 HLS लाईव्ह टीव्ही चॅनेल प्रवाह' },
      { name: 'News CMS', marathiName: 'बातम्या CMS', icon: '📝', path: '/news', desc: 'स्थानिक व ब्रेकिंग बातम्या संपादन' },
      { name: 'Citizen Grievances', marathiName: 'नागरिक तक्रारी', icon: '📢', path: '/grievances', desc: 'जनता तक्रार निवारण कक्ष' },
      { name: 'Movies (4K VOD)', marathiName: 'चित्रपट लायब्ररी', icon: '🎬', path: '/movies', desc: 'Bunny Stream 4K चित्रपट व्यवस्थापन' },
      { name: 'Web Series', marathiName: 'वेब सीरिज व भाग', icon: '📺', path: '/series', desc: 'भागांची मालिका व सीझन्स व्यवस्थापन' },
      { name: 'Podcasts', marathiName: 'पॉडकास्ट व ऑडिओ', icon: '🎙️', path: '/podcasts', desc: 'ऑडिओ पॉडकास्ट नियंत्रण' },
      { name: 'Push Notifications', marathiName: 'पुश नोटिफिकेशन्स', icon: '🔔', path: '/notifications', desc: 'FCM ब्रॉडकास्ट व ॲलर्ट पाठवणे' },
      { name: 'Advertisements', marathiName: 'जाहिराती व्यवस्थापन', icon: '💰', path: '/ads', desc: 'VAST/VMAP व व्हिडिओ जाहिराती' },
      { name: 'Hero Banners', marathiName: 'प्रमोशनल बॅनर्स', icon: '🖼️', path: '/banners', desc: 'होमस्क्रीन व ॲप बॅनर्स' },
      { name: 'Subscription Plans', marathiName: 'सदस्यता योजना', icon: '💳', path: '/plans', desc: 'सशुल्क सबस्क्रिप्शन प्लॅन्स' },
      { name: 'User Management', marathiName: 'वापरकर्ते व्यवस्थापन', icon: '👥', path: '/users', desc: 'नोंदणीकृत ग्राहक डेटाबेस' },
      { name: 'Analytics & Reports', marathiName: 'ॲनालिटिक्स व रिपोर्ट्स', icon: '📊', path: '/reports', desc: 'वाचक व महसूल अहवाल' },
      { name: 'Admin Management', marathiName: 'प्रशासक व्यवस्थापन', icon: '🛡️', path: '/admins', desc: 'भूमिका व अधिकार व्यवस्थापन' },
      { name: 'Company Info', marathiName: 'कंपनी माहिती', icon: '🏢', path: '/company', desc: 'ब्रँडिंग व कायदेशीर तपशील' },
    ],
  },
  news_editor: {
    label: 'News Editor',
    marathiLabel: 'बातम्या संपादक',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    cardBorder: 'border-blue-200 bg-blue-50/40',
    tagColor: 'bg-blue-50 text-blue-800 border-blue-200',
    canPublish: true,
    canDelete: true,
    canManageAdmins: false,
    modules: [
      { name: 'News CMS', marathiName: 'बातम्या CMS', icon: '📝', path: '/news', desc: 'बातम्या संपादन व थेट प्रकाशन' },
      { name: 'Citizen Grievances', marathiName: 'नागरिक तक्रारी', icon: '📢', path: '/grievances', desc: 'तक्रारींचे निवारण व पाठपुरावा' },
      { name: 'Push Notifications', marathiName: 'पुश नोटिफिकेशन्स', icon: '🔔', path: '/notifications', desc: 'ब्रेकिंग न्यूज पुश ॲलर्ट' },
      { name: 'News Reports', marathiName: 'बातम्या अहवाल', icon: '📊', path: '/reports', desc: 'वाचक व व्ह्यूज अहवाल' },
      { name: 'Company Info', marathiName: 'कंपनी माहिती', icon: '🏢', path: '/company', desc: 'संपादकीय माहिती' },
    ],
  },
  content_manager: {
    label: 'Content Manager',
    marathiLabel: 'कंटेंट मॅनेजर',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    cardBorder: 'border-purple-200 bg-purple-50/40',
    tagColor: 'bg-purple-50 text-purple-800 border-purple-200',
    canPublish: true,
    canDelete: true,
    canManageAdmins: false,
    modules: [
      { name: 'Movies (4K VOD)', marathiName: 'चित्रपट लायब्ररी', icon: '🎬', path: '/movies', desc: 'चित्रपट अपलोड व प्रकाशन' },
      { name: 'Web Series', marathiName: 'वेब सीरिज', icon: '📺', path: '/series', desc: 'मालिका व भाग नियोजन' },
      { name: 'Podcasts', marathiName: 'पॉडकास्ट', icon: '🎙️', path: '/podcasts', desc: 'ऑडिओ कंटेंट व्यवस्थापन' },
      { name: 'Promotional Banners', marathiName: 'प्रमोशनल बॅनर्स', icon: '🖼️', path: '/banners', desc: 'मुख्यपृष्ठ बॅनर्स व्यवस्थापन' },
      { name: 'Content Reports', marathiName: 'कंटेंट अहवाल', icon: '📊', path: '/reports', desc: 'व्हिडिओ व्ह्यूअरशिप ॲनालिटिक्स' },
    ],
  },
  video_manager: {
    label: 'Video Manager',
    marathiLabel: 'व्हिडिओ मॅनेजर',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    cardBorder: 'border-rose-200 bg-rose-50/40',
    tagColor: 'bg-rose-50 text-rose-800 border-rose-200',
    canPublish: true,
    canDelete: true,
    canManageAdmins: false,
    modules: [
      { name: 'Live TV Streaming', marathiName: 'थेट टीव्ही प्रवाह', icon: '🔴', path: '/live', desc: '24x7 थेट प्रक्षेपण नियंत्रण' },
      { name: 'Movies VOD', marathiName: 'चित्रपट व्हिडिओ', icon: '🎬', path: '/movies', desc: 'व्हिडिओ एन्कोडिंग व स्ट्रीमिंग' },
      { name: 'Series Episodes', marathiName: 'सीरिज भाग', icon: '📺', path: '/series', desc: 'व्हिडिओ भाग व्यवस्थापन' },
      { name: 'Podcasts', marathiName: 'पॉडकास्ट ऑडिओ', icon: '🎙️', path: '/podcasts', desc: 'ऑडिओ स्ट्रीम व्यवस्थापन' },
    ],
  },
  reporter: {
    label: 'Field Reporter',
    marathiLabel: 'फील्ड वार्ताहर',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    cardBorder: 'border-amber-200 bg-amber-50/40',
    tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
    canPublish: false,
    canDelete: false,
    canManageAdmins: false,
    modules: [
      { name: 'News CMS (Draft)', marathiName: 'बातम्या संकलन (मसुदा)', icon: '📝', path: '/news', desc: 'स्थानिक बातम्या मसुदा तयार करणे' },
      { name: 'Field Grievances', marathiName: 'स्थानिक तक्रारी नोंदणी', icon: '📢', path: '/grievances', desc: 'नागरिकांच्या समस्या नोंदवणे' },
    ],
  },
  advertisement_manager: {
    label: 'Advertisement Manager',
    marathiLabel: 'जाहिरात व्यवस्थापक',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    cardBorder: 'border-emerald-200 bg-emerald-50/40',
    tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    canPublish: true,
    canDelete: true,
    canManageAdmins: false,
    modules: [
      { name: 'Ad Monetization', marathiName: 'जाहिराती व्यवस्थापन', icon: '💰', path: '/ads', desc: 'व्हिडिओ जाहिरात मोहीम व VAST टॅग्ज' },
      { name: 'Hero Banners', marathiName: 'प्रमोशनल बॅनर्स', icon: '🖼️', path: '/banners', desc: 'जाहिरात बॅनर्स प्रदर्शन' },
      { name: 'Ad Revenue Reports', marathiName: 'कमाई अहवाल', icon: '📊', path: '/reports', desc: 'इंप्रेशन्स, क्लिक्स व महसूल अहवाल' },
    ],
  },
  finance_manager: {
    label: 'Finance Manager',
    marathiLabel: 'वित्त व्यवस्थापक',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    cardBorder: 'border-teal-200 bg-teal-50/40',
    tagColor: 'bg-teal-50 text-teal-800 border-teal-200',
    canPublish: true,
    canDelete: false,
    canManageAdmins: false,
    modules: [
      { name: 'Subscription Plans', marathiName: 'सदस्यता योजना', icon: '💳', path: '/plans', desc: 'प्लॅन किंमत व कालावधी व्यवस्थापन' },
      { name: 'Subscribed Users', marathiName: 'वर्गणीदार ग्राहक', icon: '👥', path: '/users', desc: 'पेमेंट व ग्राहक स्टेटस तपासणी' },
      { name: 'Financial Revenue Reports', marathiName: 'आर्थिक अहवाल', icon: '📊', path: '/reports', desc: 'महसूल, ट्रान्झॅक्शन व नफा अहवाल' },
    ],
  },
  editor: {
    label: 'Editor',
    marathiLabel: 'संपादक',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
    cardBorder: 'border-sky-200 bg-sky-50/40',
    tagColor: 'bg-sky-50 text-sky-800 border-sky-200',
    canPublish: true,
    canDelete: false,
    canManageAdmins: false,
    modules: [
      { name: 'News CMS', marathiName: 'बातम्या CMS', icon: '📝', path: '/news', desc: 'बातम्या संपादन व थेट प्रकाशन' },
      { name: 'Grievances', marathiName: 'नागरिक तक्रारी', icon: '📢', path: '/grievances', desc: 'तक्रारींचे निवारण' },
      { name: 'Movies', marathiName: 'चित्रपट', icon: '🎬', path: '/movies', desc: 'चित्रपट संपादन' },
    ],
  },
  uploader: {
    label: 'Uploader',
    marathiLabel: 'अपलोडर',
    badgeColor: 'bg-slate-100 text-slate-900 border-slate-300',
    cardBorder: 'border-slate-200 bg-slate-50/40',
    tagColor: 'bg-slate-50 text-slate-800 border-slate-200',
    canPublish: false,
    canDelete: false,
    canManageAdmins: false,
    modules: [
      { name: 'Media Upload', marathiName: 'व्हिडिओ अपलोड', icon: '📤', path: '/movies', desc: 'व्हिडिओ व ऑडिओ फाईल अपलोड' },
    ],
  },
};

export default function AdminsPage() {
  const router = useRouter();
  const { user: currentAuthUser, canManageAdmins, role: currentRole, switchRole, openAdminRole } = useAuth();
  const { t, lang } = useLanguage();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected admin for detailed permissions modal
  const [selectedAdminForDetails, setSelectedAdminForDetails] = useState<AdminUser | null>(null);

  // Success Notification / Assigned Role Modal
  const [assignedSuccessAdmin, setAssignedSuccessAdmin] = useState<AdminUser | null>(null);
  const [roleChangeNotice, setRoleChangeNotice] = useState<{ admin: AdminUser; role: AdminRole } | null>(null);

  // Invite Admin Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('news_editor');
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);

  const loadAdmins = async () => {
    setLoading(true);
    const list = await firestoreService.getAdmins();
    setAdmins(list);
    setLoading(false);
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleOpenRole = (admin: AdminUser) => {
    const targetPath = openAdminRole(admin);
    router.push(targetPath);
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;
    setIsSaving(true);

    const newAdmin: AdminUser = {
      uid: 'admin-' + Date.now().toString(36),
      email: newEmail.toLowerCase().trim(),
      name: newName.trim(),
      role: newRole,
      createdAt: new Date().toISOString(),
      lastLogin: 'Never',
    };

    await firestoreService.saveAdmin(newAdmin);
    setIsSaving(false);
    setIsInviteModalOpen(false);
    setNewEmail('');
    setNewName('');
    await loadAdmins();
    setAssignedSuccessAdmin(newAdmin);
  };

  const handleRoleChange = async (admin: AdminUser, role: AdminRole) => {
    if (!canManageAdmins) return;
    const updated = { ...admin, role };
    await firestoreService.saveAdmin(updated);
    await loadAdmins();

    if (admin.uid === currentAuthUser?.uid) {
      const targetPath = switchRole(role);
      router.push(targetPath);
    } else {
      setRoleChangeNotice({ admin: updated, role });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!adminToDelete) return;
    await firestoreService.deleteAdmin(adminToDelete.uid);
    setAdminToDelete(null);
    loadAdmins();
  };

  const roleLabels: Record<AdminRole, string> = {
    superadmin: lang === 'mr' ? '👑 सुपर ॲडमिन' : lang === 'hi' ? '👑 सुपर एडमिन' : '👑 Super Admin',
    news_editor: lang === 'mr' ? '✍️ बातम्या संपादक' : lang === 'hi' ? '✍️ समाचार संपादक' : '✍️ News Editor',
    content_manager: lang === 'mr' ? '🎬 कन्टेन्ट मॅनेजर' : lang === 'hi' ? '🎬 कंटेंट मैनेजर' : '🎬 Content Manager',
    video_manager: lang === 'mr' ? '📹 व्हिडिओ मॅनेजर' : lang === 'hi' ? '📹 वीडियो मैनेजर' : '📹 Video Manager',
    reporter: lang === 'mr' ? '🎙️ वार्ताहर' : lang === 'hi' ? '🎙️ पत्रकार / रिपोर्टर' : '🎙️ Reporter',
    advertisement_manager: lang === 'mr' ? '📢 जाहिरात व्यवस्थापक' : lang === 'hi' ? '📢 विज्ञापन प्रबंधक' : '📢 Ad Manager',
    finance_manager: lang === 'mr' ? '💼 वित्त व्यवस्थापक' : lang === 'hi' ? '💼 वित्त प्रबंधक' : '💼 Finance Manager',
    editor: lang === 'mr' ? '✍️ संपादक' : lang === 'hi' ? '✍️ संपादक' : '✍️ Editor',
    uploader: lang === 'mr' ? '📤 अपलोडर' : lang === 'hi' ? '📤 अपलोडर' : '📤 Uploader',
  };

  // Calculate role counts
  const getRoleCount = (r: AdminRole) => admins.filter(a => a.role === r).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-7 rounded-3xl bg-white border border-slate-200 shadow-luxury">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-rose-600" />
            {t('pageTitleAdmins')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'mr' 
              ? 'कोणत्या प्रशासकाला कोणत्या विभागांचा ॲक्सेस व अधिकार दिले आहेत याचे थेट व्यवस्थापन.' 
              : 'Authorized console administrators, assigned roles, and granular module permissions.'}
          </p>
        </div>
        {canManageAdmins && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-sm shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> {lang === 'mr' ? 'नवीन प्रशासक जोडा' : lang === 'hi' ? 'नया प्रशासक जोड़ें' : 'Add Admin User'}
          </button>
        )}
      </div>

      {!canManageAdmins && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-xs text-amber-900">
          <Lock className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            {lang === 'mr'
              ? `तुम्ही सध्या ${roleLabels[currentRole] || currentRole} या भूमिकेत आहात. प्रशासक जोडणे व अधिकार बदलणे फक्त सुपर ॲडमिन करू शकतात.`
              : `You are logged in with ${roleLabels[currentRole] || currentRole} role. Admin user creation is restricted to Super Admin.`}
          </span>
        </div>
      )}

      {/* Role Access Summary Cards (कोणा कोणाला ॲक्सेस दिला आहे याचा आढावा) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-luxury space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-black text-slate-900">
              {lang === 'mr' ? 'प्रशासकीय भूमिका व ॲक्सेस सारांश (Access Matrix)' : 'Roles & Access Overview'}
            </h2>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {lang === 'mr' ? `एकूण ७ प्रशासकीय भूमिका` : `7 RBAC Roles`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(['superadmin', 'news_editor', 'content_manager', 'video_manager', 'reporter', 'advertisement_manager', 'finance_manager'] as AdminRole[]).map((r) => {
            const roleInfo = ROLE_ACCESS_DETAILS[r];
            const count = getRoleCount(r);
            return (
              <div 
                key={r}
                className={`p-3.5 rounded-2xl border ${roleInfo.cardBorder} transition-all hover:shadow-xs`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${roleInfo.badgeColor}`}>
                    {roleLabels[r]}
                  </span>
                  <span className="text-[11px] font-black text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {count} {lang === 'mr' ? 'व्यक्ती' : 'user'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-semibold line-clamp-1">
                  {r === 'superadmin' 
                    ? (lang === 'mr' ? '🌟 सर्व १६ विभागांचा १००% पूर्ण ॲक्सेस' : '🌟 Full System Access')
                    : roleInfo.modules.map(m => m.marathiName).slice(0, 3).join(', ') + '...'}
                </p>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500">
                  <span>{lang === 'mr' ? 'परवानगी:' : 'Access:'}</span>
                  <span className="font-bold text-slate-700">
                    {roleInfo.modules.length} {lang === 'mr' ? 'मॉड्यूल्स' : 'modules'}
                  </span>
                  {roleInfo.canPublish && <span className="text-emerald-700 font-bold ml-1">✓ Publish</span>}
                  {roleInfo.canDelete && <span className="text-rose-700 font-bold ml-1">✓ Delete</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {roleChangeNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs text-emerald-950 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {lang === 'mr' 
                ? `${roleChangeNotice.admin.name} यांचा रोल बदलून "${roleLabels[roleChangeNotice.role]}" असाइन केला आहे.`
                : `Role updated to "${roleLabels[roleChangeNotice.role]}" for ${roleChangeNotice.admin.name}.`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenRole(roleChangeNotice.admin)}
              className="px-3 py-1.5 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{lang === 'mr' ? 'हा रोल उघडा' : 'Open Role Now'}</span>
            </button>
            <button
              onClick={() => setRoleChangeNotice(null)}
              className="p-1 text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Admins Table */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-luxury space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              {t('adminsAuthorizedHeading')} ({admins.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'mr' 
                ? 'खालील सर्व व्यक्तींना प्रशासकीय ॲक्सेस देण्यात आला आहे. त्यांच्या रोलसमोरील मॉड्यूल्स पहा.' 
                : 'List of all authorized admin users and the exact modules granted to each.'}
            </p>
          </div>
          <span className="text-xs bg-slate-50 text-slate-600 font-bold px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
            👥 {admins.length} {lang === 'mr' ? 'प्रशासक सक्रिय' : 'Active Admins'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="py-3 px-3 font-bold">{t('colAdminProfile')}</th>
                <th className="py-3 px-3 font-bold">{t('colEmail')}</th>
                <th className="py-3 px-3 font-bold">{lang === 'mr' ? 'भूमिका व दिलेला ॲक्सेस' : 'Role & Accessible Modules'}</th>
                <th className="py-3 px-3 font-bold">{lang === 'mr' ? 'अधिकार' : 'Privileges'}</th>
                <th className="py-3 px-3 font-bold">{t('colLastActive')}</th>
                <th className="py-3 px-3 font-bold text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((adm) => {
                const roleDetails = ROLE_ACCESS_DETAILS[adm.role] || ROLE_ACCESS_DETAILS.reporter;
                return (
                  <tr key={adm.uid} className="hover:bg-slate-50/80 transition-colors">
                    {/* Profile */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 border border-slate-200 flex items-center justify-center font-bold text-xs text-white uppercase overflow-hidden shrink-0 shadow-sm">
                          {adm.photoUrl ? (
                            <img src={adm.photoUrl} alt={adm.name} className="w-full h-full object-cover" />
                          ) : (
                            adm.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            {adm.name}
                            {adm.uid === currentAuthUser?.uid && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-full font-bold">You</span>
                            )}
                          </p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border mt-0.5 inline-block ${roleDetails.badgeColor}`}>
                            {roleLabels[adm.role] || adm.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-3 text-slate-700 font-mono">
                      <p className="font-semibold text-xs">{adm.email}</p>
                    </td>

                    {/* Role & Accessible Modules (कोणा कोणाला काय ॲक्सेस दिला आहे) */}
                    <td className="py-3.5 px-3 max-w-xs">
                      {canManageAdmins ? (
                        <select
                          value={adm.role}
                          onChange={(e) => handleRoleChange(adm, e.target.value as AdminRole)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 cursor-pointer shadow-xs mb-1.5"
                        >
                          <option value="superadmin">{roleLabels.superadmin}</option>
                          <option value="news_editor">{roleLabels.news_editor}</option>
                          <option value="content_manager">{roleLabels.content_manager}</option>
                          <option value="video_manager">{roleLabels.video_manager}</option>
                          <option value="reporter">{roleLabels.reporter}</option>
                          <option value="advertisement_manager">{roleLabels.advertisement_manager}</option>
                          <option value="finance_manager">{roleLabels.finance_manager}</option>
                        </select>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 mb-1 inline-block">
                          {roleLabels[adm.role] || adm.role}
                        </span>
                      )}

                      {/* Display Granted Module Badges */}
                      <div className="mt-1">
                        {adm.role === 'superadmin' ? (
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                              👑 सर्व १६ मॉड्यूल्सचा पूर्ण ॲक्सेस (Full Access)
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1">
                            {roleDetails.modules.slice(0, 3).map((mod) => (
                              <span 
                                key={mod.path} 
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {mod.icon} {mod.marathiName}
                              </span>
                            ))}
                            {roleDetails.modules.length > 3 && (
                              <button
                                onClick={() => setSelectedAdminForDetails(adm)}
                                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                              >
                                +{roleDetails.modules.length - 3} अधिक
                              </button>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => setSelectedAdminForDetails(adm)}
                          className="mt-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-slate-400" />
                          <span>{lang === 'mr' ? '🔍 ॲक्सेस तपशील पहा' : 'View Permissions Matrix'}</span>
                        </button>
                      </div>
                    </td>

                    {/* Granted Permissions */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          {roleDetails.canPublish ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          )}
                          <span className={roleDetails.canPublish ? 'font-bold text-slate-800' : 'text-slate-400'}>
                            {lang === 'mr' ? 'प्रकाशन (Publish)' : 'Publish'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {roleDetails.canDelete ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          )}
                          <span className={roleDetails.canDelete ? 'font-bold text-slate-800' : 'text-slate-400'}>
                            {lang === 'mr' ? 'हटवणे (Delete)' : 'Delete'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {roleDetails.canManageAdmins ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          )}
                          <span className={roleDetails.canManageAdmins ? 'font-bold text-slate-800' : 'text-slate-400'}>
                            {lang === 'mr' ? 'प्रशासक (Admins)' : 'Manage Admins'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Last Active */}
                    <td className="py-3.5 px-3 text-slate-500 font-mono text-xs">
                      {adm.lastLogin ? formatDate(adm.lastLogin) : 'Never'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenRole(adm)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white font-bold text-[11px] shadow-xs transition active:scale-95 cursor-pointer"
                          title={lang === 'mr' ? 'हा रोल उघडा आणि कार्य सुरू करा' : 'Open this role'}
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{lang === 'mr' ? 'रोल उघडा' : 'Open'}</span>
                        </button>

                        <button
                          onClick={() => setSelectedAdminForDetails(adm)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title={lang === 'mr' ? 'पूर्ण ॲक्सेस तपशील पहा' : 'View full access details'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {canManageAdmins && adm.uid !== currentAuthUser?.uid && (
                          <button
                            onClick={() => setAdminToDelete(adm)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Admin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED PERMISSIONS & ACCESS MODAL (कोणा कोणाला काय ॲक्सेस दिला आहे) */}
      {selectedAdminForDetails && (() => {
        const roleInfo = ROLE_ACCESS_DETAILS[selectedAdminForDetails.role] || ROLE_ACCESS_DETAILS.superadmin;
        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white font-black text-base shadow-sm">
                    {selectedAdminForDetails.photoUrl ? (
                      <img src={selectedAdminForDetails.photoUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      selectedAdminForDetails.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{selectedAdminForDetails.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{selectedAdminForDetails.email}</p>
                    <span className={`inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${roleInfo.badgeColor}`}>
                      {roleLabels[selectedAdminForDetails.role]}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAdminForDetails(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer text-base font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs">
                {/* Granular Permissions Strip */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5">
                    {lang === 'mr' ? 'प्रशासकीय अधिकार (System Privileges)' : 'System Privileges'}
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold">{lang === 'mr' ? 'थेट प्रकाशन' : 'Publish Live'}</p>
                      <p className={`text-xs font-black mt-1 ${roleInfo.canPublish ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {roleInfo.canPublish ? '✓ अनुमती आहे' : '✕ प्रतिबंधित'}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold">{lang === 'mr' ? 'माहिती हटवणे' : 'Delete Data'}</p>
                      <p className={`text-xs font-black mt-1 ${roleInfo.canDelete ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {roleInfo.canDelete ? '✓ अनुमती आहे' : '✕ प्रतिबंधित'}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold">{lang === 'mr' ? 'प्रशासक नियंत्रण' : 'Manage Admins'}</p>
                      <p className={`text-xs font-black mt-1 ${roleInfo.canManageAdmins ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {roleInfo.canManageAdmins ? '✓ अनुमती आहे' : '✕ प्रतिबंधित'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Granted Modules List */}
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'mr' ? `उपलब्ध असलेले मॉड्यूल्स (${roleInfo.modules.length})` : `Accessible Modules (${roleInfo.modules.length})`}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {roleInfo.modules.map((m) => (
                      <div key={m.path} className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2.5">
                        <span className="text-base">{m.icon}</span>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{m.marathiName}</p>
                          <p className="text-[10px] text-slate-500 leading-tight">{m.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button
                  onClick={() => setSelectedAdminForDetails(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  {t('cancelBtn')}
                </button>

                <button
                  onClick={() => {
                    handleOpenRole(selectedAdminForDetails);
                    setSelectedAdminForDetails(null);
                  }}
                  className="px-5 py-2 text-xs font-black bg-[#166534] hover:bg-[#14532D] text-white rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{lang === 'mr' ? 'हा रोल उघडून पाहा (Open Role Workspace)' : 'Open this Role Workspace'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* INVITE ADMIN MODAL */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title={t('adminsModalTitle')}
        description={lang === 'mr' ? 'प्रशासकाचे नाव, ईमेल आणि नेमून दिलेली प्रशासकीय भूमिका निवडा.' : 'Specify admin details and assigned permissions.'}
        maxWidth="md"
      >
        <form onSubmit={handleInviteAdmin} className="space-y-4 text-xs">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">{lang === 'mr' ? 'पूर्ण नाव *' : 'Full Name *'}</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={lang === 'mr' ? 'उदा. तुषार पाटील / राहुल सावंत' : 'e.g. Rahul Sharma'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">{lang === 'mr' ? 'ईमेल पत्ता *' : 'Email Address *'}</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. editor@graminbharat.tv"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">{lang === 'mr' ? 'प्रशासकीय भूमिका (Role)' : 'Role Privilege'}</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as AdminRole)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-500 font-bold"
            >
              <option value="superadmin">{roleLabels.superadmin}</option>
              <option value="news_editor">{roleLabels.news_editor}</option>
              <option value="content_manager">{roleLabels.content_manager}</option>
              <option value="video_manager">{roleLabels.video_manager}</option>
              <option value="reporter">{roleLabels.reporter}</option>
              <option value="advertisement_manager">{roleLabels.advertisement_manager}</option>
              <option value="finance_manager">{roleLabels.finance_manager}</option>
            </select>
          </div>

          {/* Role Preview in Invite Modal */}
          {newRole && (
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
              <p className="text-[11px] font-bold text-amber-900 mb-1">
                {lang === 'mr' ? 'या भूमिकेला खालील घटकांचा ॲक्सेस मिळेल:' : 'This role grants access to:'}
              </p>
              <div className="flex flex-wrap gap-1">
                {ROLE_ACCESS_DETAILS[newRole]?.modules.map((m) => (
                  <span key={m.path} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-amber-800 border border-amber-200">
                    {m.icon} {m.marathiName}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsInviteModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {t('cancelBtn')}
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white rounded-xl shadow-sm cursor-pointer"
            >
              {lang === 'mr' ? 'खाते तयार करा' : 'Create Admin'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!adminToDelete}
        onClose={() => setAdminToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={lang === 'mr' ? 'प्रशासक खाते काढून टाका' : 'Revoke Admin Access'}
        message={lang === 'mr' ? `तुम्हाला नक्की ${adminToDelete?.name} यांचे प्रशासकीय खाते काढून टाकायचे आहे का?` : `Are you sure you want to revoke admin access for ${adminToDelete?.name}?`}
        confirmText={t('deleteBtn')}
        cancelText={t('cancelBtn')}
        variant="danger"
      />
    </div>
  );
}
