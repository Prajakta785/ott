'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Smartphone, 
  Tv, 
  Monitor, 
  Eye, 
  Clock,
  Trash2,
  Plus,
  RefreshCw,
  X,
  Check,
  ShieldCheck,
  UserCheck,
  LogOut,
  Radio,
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { firestoreService } from '@/lib/firestore-service';
import { User, ContentItem } from '@/lib/types';
import { formatDate, formatDateTime, formatDuration, formatActiveHours } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function UsersPage() {
  const { canEdit } = useAuth();
  const { t, lang } = useLanguage();
  const [users, setUsers] = useState<User[]>(() => {
    if (typeof window !== 'undefined') {
      return firestoreService.getLocalUsers();
    }
    return [];
  });
  const [contentList, setContentList] = useState<ContentItem[]>(() => {
    if (typeof window !== 'undefined') {
      return firestoreService.getLocalContent();
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subFilter, setSubFilter] = useState<'all' | 'subscribed' | 'non_subscribed'>('all');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Inspect Modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Plan Assignment Modal (Duration selection: 28, 84, 365, or Custom days)
  const [planAssignUser, setPlanAssignUser] = useState<User | null>(null);
  const [selectedPlanDays, setSelectedPlanDays] = useState<number>(365);
  const [customDaysInput, setCustomDaysInput] = useState<string>('30');
  const [isCustomDays, setIsCustomDays] = useState<boolean>(false);
  const [isAssigningPlan, setIsAssigningPlan] = useState<boolean>(false);

  // Add User Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSubStatus, setNewSubStatus] = useState<'active' | 'free' | 'expired'>('active');
  const [isSaving, setIsSaving] = useState(false);

  // Helper to calculate remaining days until plan expiration
  const getPlanDaysLeft = (planExpiry?: string | null): number | null => {
    if (!planExpiry) return null;
    const expiryTime = new Date(planExpiry).getTime();
    if (isNaN(expiryTime) || expiryTime <= 0) return null;
    const diffMs = expiryTime - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  // Helper to check whether user has a currently active, non-expired subscription
  const isUserSubscribedValid = (u: User): boolean => {
    if (u.subscriptionStatus !== 'active') return false;
    if (!u.planExpiry) return true;
    const daysLeft = getPlanDaysLeft(u.planExpiry);
    return daysLeft !== null ? daysLeft > 0 : true;
  };

  // STRICT CLIENT-SIDE DEDUPLICATION HELPER: Guarantees no mobile number is ever rendered twice
  // and accurately detects Active (Online), Plan Duration, and Expiration status.
  const deduplicateUsersList = (list: User[]): User[] => {
    const map = new Map<string, User>();
    for (const u of list || []) {
      const digits = String(u.phone || u.id || '').replace(/\D/g, '');
      const key = digits.length >= 10 ? digits.slice(-10) : (u.id || 'unknown');
      const existing = map.get(key);
      if (!existing) {
        map.set(key, u);
      } else {
        const pickName = (u.name && !u.name.startsWith('User ')) ? u.name : existing.name;
        const normTime = new Date(u.lastLogin || u.createdAt || 0).getTime();
        const existTime = new Date(existing.lastLogin || existing.createdAt || 0).getTime();
        const primary = normTime >= existTime ? u : existing;
        const secondary = normTime >= existTime ? existing : u;

        const isLoggedOut = primary.sessionStatus === 'logged_out' || !primary.isLoggedIn;
        
        const isSubActive = (primary.subscriptionStatus === 'active' || secondary.subscriptionStatus === 'active');
        const preservedExpiry = primary.planExpiry || secondary.planExpiry || undefined;
        
        map.set(key, {
          ...secondary,
          ...primary,
          id: `user_${key}`,
          phone: `+91 ${key}`,
          name: pickName,
          photoUrl: primary.photoUrl || secondary.photoUrl,
          subscriptionStatus: isSubActive ? 'active' : ((primary.subscriptionStatus === 'expired' || secondary.subscriptionStatus === 'expired') ? 'expired' : 'free'),
          planId: isSubActive ? (primary.planId || secondary.planId || 'vip-annual') : 'free',
          planName: isSubActive ? (primary.planName || secondary.planName || 'VIP Pass') : 'विना-सबस्क्रिप्शन (मोफत)',
          planExpiry: preservedExpiry,
          sessionStatus: isLoggedOut ? 'logged_out' : 'active',
          isLoggedIn: !isLoggedOut,
          devices: isLoggedOut ? [] : ((primary.devices && primary.devices.length > 0) ? primary.devices : secondary.devices),
          lastLogin: primary.lastLogin || secondary.lastLogin,
          lastLogout: isLoggedOut ? (primary.lastLogout || secondary.lastLogout || primary.lastLogin) : undefined,
          lastHeartbeat: primary.lastHeartbeat || secondary.lastHeartbeat,
          lastActive: primary.lastActive || secondary.lastActive,
        });
      }
    }

    const raw = Array.from(map.values());

    return raw.map(u => {
      const uDigits = u.phone.replace(/\D/g, '').slice(-10);
      const isLoggedOutExplicit = u.sessionStatus === 'logged_out' || u.isLoggedIn === false;
      const logoutTime = u.lastLogout ? new Date(u.lastLogout).getTime() : 0;
      const loginTime = u.lastLogin ? new Date(u.lastLogin).getTime() : (u.loginTime ? new Date(u.loginTime).getTime() : 0);
      const hasLoggedOutAfterLogin = logoutTime > 0 && loginTime > 0 && logoutTime > loginTime;
      const hbTime = u.lastHeartbeat ? new Date(u.lastHeartbeat).getTime() : (u.lastActive ? new Date(u.lastActive).getTime() : 0);
      const isHeartbeatStale = (hbTime > 0 && Date.now() - hbTime > 90_000) || (hbTime === 0 && loginTime > 0 && Date.now() - loginTime > 90_000);

      const isUserActive = !isLoggedOutExplicit && !hasLoggedOutAfterLogin && !isHeartbeatStale && (u.sessionStatus === 'active' || u.isLoggedIn === true);
      const expTime = u.planExpiry ? new Date(u.planExpiry).getTime() : 0;
      const isPlanExpired = expTime > 0 && expTime <= Date.now();
      const isSubActive = (u.subscriptionStatus === 'active' || (u as any).isSubscribed === true) && !isPlanExpired;
      const subStatus: 'active' | 'free' | 'expired' = isSubActive
        ? 'active'
        : (u.subscriptionStatus === 'expired' || isPlanExpired)
        ? 'expired'
        : 'free';

      if (isUserActive) {
        return {
          ...u,
          subscriptionStatus: subStatus,
          planId: subStatus === 'active' ? (u.planId || 'vip-annual') : 'free',
          planName: subStatus === 'active' ? (u.planName || 'VIP Pass') : (isPlanExpired ? 'प्लॅन संपला (Plan Expired)' : 'विना-सबस्क्रिप्शन (मोफत)'),
          planExpiry: u.planExpiry || undefined,
          isLoggedIn: true,
          sessionStatus: 'active' as const,
          devices: (Array.isArray(u.devices) && u.devices.length > 0) ? u.devices : [
            {
              deviceId: `android_${uDigits || u.id}`,
              platform: 'android',
              deviceName: 'Android Mobile App',
              lastLogin: u.lastLogin || new Date().toISOString(),
              isLoggedIn: true,
            }
          ],
          lastLogout: undefined,
        };
      } else {
        return {
          ...u,
          subscriptionStatus: subStatus,
          planId: subStatus === 'active' ? (u.planId || 'vip-annual') : 'free',
          planName: subStatus === 'active' ? (u.planName || 'VIP Pass') : (isPlanExpired ? 'प्लॅन संपला (Plan Expired)' : 'विना-सबस्क्रिप्शन (मोफत)'),
          planExpiry: u.planExpiry || undefined,
          isLoggedIn: false,
          sessionStatus: 'logged_out' as const,
          devices: [],
          lastLogout: u.lastLogout || u.lastLogin || u.createdAt || new Date().toISOString(),
        };
      }
    });
  };

  const deletedUserIds = React.useRef<Set<string>>(new Set());

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [uList, cList] = await Promise.all([
        firestoreService.getUsers(),
        firestoreService.getContent(),
      ]);
      const validUsers = uList.filter(u => !deletedUserIds.current.has(u.id));
      setUsers(deduplicateUsersList(validUsers));
      setContentList(cList);
      setLastSyncTime(new Date());
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'create') {
        setIsAddModalOpen(true);
      }
    }

    // 1. Instant Real-Time WebSocket listener via Firebase SDK
    let unsubscribeFirestore: (() => void) | null = null;
    if (db) {
      try {
        unsubscribeFirestore = onSnapshot(collection(db, 'users'), () => {
          loadData(true);
        }, (err) => {
          console.warn('Real-time users listener notice:', err);
        });
      } catch (e) {
        console.warn('Failed to bind Firestore real-time listener:', e);
      }
    }

    // 2. Periodic 20-second background refresh fallback
    const interval = setInterval(() => {
      loadData(true);
    }, 20000);

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
      clearInterval(interval);
    };
  }, []);

  const handleDeleteUser = async (id: string) => {
    const confirmMsg = lang === 'mr'
      ? 'तुम्हाला हा युझर नक्की हटवायचा आहे का?'
      : lang === 'hi'
      ? 'क्या आप वाकई इस यूजर को हटाना चाहते हैं?'
      : 'Are you sure you want to delete this user?';
    if (!confirm(confirmMsg)) return;

    deletedUserIds.current.add(id);
    await firestoreService.deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
    if (selectedUser?.id === id) setSelectedUser(null);
  };

  const handleForceLogout = async (user: User) => {
    const confirmMsg = lang === 'mr'
      ? `${user.phone} (${user.name}) या वापरकर्त्याला सर्व उपकरणांमधून लॉग आउट करायचे आहे का?`
      : lang === 'hi'
      ? `क्या आप ${user.phone} (${user.name}) को सभी डिवाइस से लॉग आउट करना चाहते हैं?`
      : `Are you sure you want to log out ${user.phone} (${user.name}) from all devices?`;
    if (!confirm(confirmMsg)) return;

    try {
      const logoutIso = new Date().toISOString();
      const targetDigits = user.phone.replace(/\D/g, '').slice(-10);

      // Optimistic instant UI update
      setUsers(prev => prev.map(u => {
        const uDigits = u.phone.replace(/\D/g, '').slice(-10);
        if ((targetDigits && uDigits === targetDigits) || u.id === user.id) {
          return {
            ...u,
            isLoggedIn: false,
            sessionStatus: 'logged_out',
            devices: [],
            lastLogout: logoutIso,
          };
        }
        return u;
      }));

      if (selectedUser && (selectedUser.id === user.id || selectedUser.phone === user.phone)) {
        setSelectedUser(prev => prev ? {
          ...prev,
          isLoggedIn: false,
          sessionStatus: 'logged_out',
          devices: [],
          lastLogout: logoutIso,
        } : null);
      }

      await firestoreService.logoutUser(user.phone || user.id);
      loadData(true);
    } catch (err) {
      console.error('Error forcing logout:', err);
    }
  };

  const handleActivateUser = async (user: User) => {
    try {
      const nowIso = new Date().toISOString();
      const targetDigits = user.phone.replace(/\D/g, '').slice(-10);

      // Optimistic instant UI update: activate this user
      setUsers(prev => prev.map(u => {
        const uDigits = u.phone.replace(/\D/g, '').slice(-10);
        if ((targetDigits && uDigits === targetDigits) || u.id === user.id) {
          return {
            ...u,
            isLoggedIn: true,
            sessionStatus: 'active',
            lastLogin: nowIso,
            loginTime: nowIso,
            lastLogout: undefined,
            lastHeartbeat: nowIso,
            lastActive: nowIso,
            devices: [
              {
                deviceId: `android_${targetDigits || u.id}`,
                platform: 'android',
                deviceName: 'Android Mobile App',
                lastLogin: nowIso,
                isLoggedIn: true,
              }
            ],
          };
        }
        return u;
      }));

      if (selectedUser) {
        const selDigits = selectedUser.phone.replace(/\D/g, '').slice(-10);
        if ((targetDigits && selDigits === targetDigits) || selectedUser.id === user.id) {
          setSelectedUser(prev => prev ? {
            ...prev,
            isLoggedIn: true,
            sessionStatus: 'active',
            lastLogin: nowIso,
            loginTime: nowIso,
            lastLogout: undefined,
            lastHeartbeat: nowIso,
            lastActive: nowIso,
            devices: [
              {
                deviceId: `android_${targetDigits || user.id}`,
                platform: 'android',
                deviceName: 'Android Mobile App',
                lastLogin: nowIso,
                isLoggedIn: true,
              }
            ],
          } : null);
        }
      }

      await firestoreService.activateUser(user.phone || user.id);
      loadData(true);
    } catch (err) {
      console.error('Error activating user:', err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = newPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      alert(lang === 'mr' ? 'कृपया वैध १०-अंकी मोबाईल नंबर टाका.' : lang === 'hi' ? 'कृपया मान्य १०-अंकीय मोबाइल नंबर दर्ज करें।' : 'Please enter valid 10-digit mobile number.');
      return;
    }

    setIsSaving(true);
    try {
      const newUser: User = {
        id: `user_${cleanPhone}`,
        phone: `+91 ${cleanPhone}`,
        name: newName.trim() || `User ${cleanPhone}`,
        email: newEmail.trim() || undefined,
        createdAt: new Date().toISOString(),
        subscriptionStatus: newSubStatus,
        planId: newSubStatus === 'active' ? 'vip-annual' : (newSubStatus === 'expired' ? 'expired' : 'free-tier'),
        planName: newSubStatus === 'active' ? 'VIP Annual Pass' : (newSubStatus === 'expired' ? 'प्लॅन संपला (Plan Expired)' : 'विना-सबस्क्रिप्शन (मोफत)'),
        planExpiry: newSubStatus === 'active' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() 
          : (newSubStatus === 'expired' ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() : undefined),
        isLoggedIn: true,
        sessionStatus: 'active',
        lastLogin: new Date().toISOString(),
        loginTime: new Date().toISOString(),
        devices: [
          {
            deviceId: `android_${cleanPhone}`,
            platform: 'android',
            deviceName: 'Android Mobile App',
            lastLogin: new Date().toISOString(),
            isLoggedIn: true,
          }
        ],
        watchlist: [],
        continueWatching: {},
      };

      await firestoreService.updateUser(newUser);
      setUsers(prev => deduplicateUsersList([newUser, ...prev]));
      setIsAddModalOpen(false);
      setNewPhone('');
      setNewName('');
      setNewEmail('');
      setNewSubStatus('active');
    } catch (err) {
      console.error('Error adding user:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Assign or extend plan for specific number of days (28, 84, 365, or custom)
  const handleGrantPlanWithDays = async (targetUser: User, durationDays: number) => {
    try {
      setIsAssigningPlan(true);
      const days = Math.max(1, durationDays);
      const expiryIso = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      
      let pName = `${days} Days VIP Pass`;
      if (days === 28) pName = 'मासिक VIP (28 Days)';
      else if (days === 84) pName = 'त्रैमासिक VIP (84 Days)';
      else if (days === 365) pName = 'VIP Annual Pass (365 Days)';
      else pName = `VIP Pass (${days} Days)`;

      const updatedUser: User = {
        ...targetUser,
        subscriptionStatus: 'active',
        planId: `vip-${days}d`,
        planName: pName,
        planExpiry: expiryIso,
      };

      // Optimistic update
      setUsers(prev => deduplicateUsersList(prev.map(u => (u.id === targetUser.id || u.phone === targetUser.phone) ? updatedUser : u)));
      if (selectedUser && (selectedUser.id === targetUser.id || selectedUser.phone === targetUser.phone)) {
        setSelectedUser(updatedUser);
      }

      await firestoreService.updateUserSubscription(targetUser.phone || targetUser.id, 'active', {
        planId: updatedUser.planId,
        planName: updatedUser.planName,
        planExpiry: updatedUser.planExpiry,
        durationDays: days,
        name: targetUser.name,
      });

      setPlanAssignUser(null);
      loadData(true);
    } catch (err) {
      console.error('Error assigning plan:', err);
      alert('Failed to update subscription duration.');
    } finally {
      setIsAssigningPlan(false);
    }
  };

  const handleRevokeDevice = async (user: User, deviceId: string) => {
    const remainingDevices = (user.devices || []).filter(d => d.deviceId !== deviceId);
    const updated: User = {
      ...user,
      devices: remainingDevices,
      isLoggedIn: remainingDevices.length > 0,
      sessionStatus: remainingDevices.length > 0 ? 'active' : 'logged_out',
      lastLogout: remainingDevices.length === 0 ? new Date().toISOString() : user.lastLogout,
    };
    await firestoreService.updateUser(updated);
    if (selectedUser?.id === user.id) setSelectedUser(updated);
    loadData(true);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'apple-tv':
      case 'android-tv':
        return <Tv className="w-3.5 h-3.5 text-[#E11D48]" />;
      case 'ios':
      case 'android':
        return <Smartphone className="w-3.5 h-3.5 text-[#EA580C]" />;
      default:
        return <Monitor className="w-3.5 h-3.5 text-[#4E876C]" />;
    }
  };

  // Ensure unique list before filtering
  const uniqueUsers = deduplicateUsersList(users);

  // Subscribed users are only those with an active status AND valid non-expired plan
  const subscribedUsersCount = uniqueUsers.filter(u => isUserSubscribedValid(u)).length;
  // Non-subscribed includes free tier AND expired plans
  const nonSubscribedUsersCount = uniqueUsers.length - subscribedUsersCount;
  const activeUsersCount = uniqueUsers.filter(u => u.sessionStatus === 'active' && u.isLoggedIn === true && (u.devices?.length || 0) > 0).length;
  const loggedOutUsersCount = uniqueUsers.length - activeUsersCount;
  const totalActiveDevices = uniqueUsers.reduce((acc, u) => acc + (u.sessionStatus === 'active' && u.isLoggedIn === true ? (u.devices?.length || 0) : 0), 0);

  const filteredUsers = uniqueUsers.filter(u => {
    // 1. Subscription filter (Subscribed vs Non-Subscribed / Expired)
    const isSub = isUserSubscribedValid(u);
    if (subFilter === 'subscribed' && !isSub) return false;
    if (subFilter === 'non_subscribed' && isSub) return false;

    // 2. Search query filter
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const nameMatch = (u?.name || '').toLowerCase().includes(term);
    const phoneMatch = String(u?.phone || '').includes(term) || String(u?.id || '').includes(term);
    const emailMatch = (u?.email || '').toLowerCase().includes(term);
    return nameMatch || phoneMatch || emailMatch;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2D2522] tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#EA580C]" />
            {t('pageTitleUsers')}
          </h1>
          <p className="text-sm text-[#7A6F68] mt-1 font-medium">
            {lang === 'mr' 
              ? 'सबस्क्रिप्शन घेतलेले (Subscribed) आणि विना-सबस्क्रिप्शन (Non-Subscribed) प्रेक्षक व्यवस्थापन' 
              : lang === 'hi'
              ? 'सब्सक्रिप्शन लिए हुए (Subscribed) और बिना-सब्सक्रिप्शन (Non-Subscribed) दर्शक प्रबंधन'
              : 'Manage Subscribed and Non-Subscribed mobile users, active hours, and entitlement access.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {lang === 'mr' ? 'नवीन वापरकर्ता जोडा' : lang === 'hi' ? 'नया यूजर जोड़ें' : 'Add New User'}
          </button>

          <button
            onClick={() => loadData(false)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-[#E5DBCA] transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('refreshDataBtn')}
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME ACTIVITY & SUBSCRIPTION METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Unique Registered Mobile Numbers */}
        <div className="p-4 rounded-3xl bg-white border border-[#E5DBCA] shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7A6F68]">
              {lang === 'mr' ? 'एकूण मोबाईल प्रेक्षक' : lang === 'hi' ? 'कुल मोबाइल दर्शक' : 'Total Mobile Users'}
            </span>
            <div className="p-2 rounded-xl bg-orange-50 text-[#EA580C]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#2D2522] mt-2">{uniqueUsers.length}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {lang === 'mr' ? 'ड्युप्लिकेट नंबर वगळले (Unique Only)' : 'Strictly Unique Phone Numbers'}
          </p>
        </div>

        {/* Subscribed Users Metric Card */}
        <div 
          onClick={() => setSubFilter('subscribed')}
          className={`p-4 rounded-3xl border transition cursor-pointer shadow-soft ${
            subFilter === 'subscribed' ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20' : 'bg-white border-[#E5DBCA] hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">
              👑 {lang === 'mr' ? 'सशुल्क सबस्क्राइबर्स' : lang === 'hi' ? 'सब्सक्राइबर्स (Subscribed)' : 'Subscribed Users'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{subscribedUsersCount}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">
            {lang === 'mr' ? 'VIP / सशुल्क प्लॅन चालू आहे' : 'Active Plan Subscribers'}
          </p>
        </div>

        {/* Non-Subscribed Users Metric Card */}
        <div 
          onClick={() => setSubFilter('non_subscribed')}
          className={`p-4 rounded-3xl border transition cursor-pointer shadow-soft ${
            subFilter === 'non_subscribed' ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-500/20' : 'bg-white border-[#E5DBCA] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              🆓 {lang === 'mr' ? 'विना-सबस्क्रिप्शन' : lang === 'hi' ? 'बिना सब्सक्रिप्शन' : 'Non-Subscribed Users'}
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{nonSubscribedUsersCount}</p>
          <p className="text-[10px] text-slate-500 font-bold mt-1">
            {lang === 'mr' ? 'मोफत प्रेक्षक (प्लॅन घेतलेला नाही)' : 'Free Viewers (No Active Plan)'}
          </p>
        </div>

        {/* Online / Active Sessions */}
        <div className="p-4 rounded-3xl bg-white border border-[#E5DBCA] shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">
              {lang === 'mr' ? 'सध्या ऑनलाइन' : lang === 'hi' ? 'वर्तमान में सक्रिय' : 'Online / Active Now'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{activeUsersCount}</p>
          <p className="text-[10px] text-[#7A6F68] font-bold mt-1">
            {totalActiveDevices} {lang === 'mr' ? 'उपकरणे जोडलेली' : 'active app sessions'}
          </p>
        </div>

      </div>

      {/* 3. FILTER TABS (SUBSCRIPTION vs NON-SUBSCRIPTION) AND SEARCH BAR */}
      <div className="rounded-3xl bg-white border border-[#E5DBCA] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-soft">
        
        {/* Toggle options: All vs Subscribed vs Non-Subscribed */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF7F2] rounded-2xl border border-[#E5DBCA] w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shrink-0 ${
              subFilter === 'all'
                ? 'bg-[#EA580C] text-white shadow-sm'
                : 'text-[#7A6F68] hover:text-[#2D2522] hover:bg-white/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{lang === 'mr' ? 'सर्व प्रेक्षक' : 'All Users'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              subFilter === 'all' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {uniqueUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubFilter('subscribed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shrink-0 ${
              subFilter === 'subscribed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
            }`}
          >
            <span>👑 {lang === 'mr' ? 'सबस्क्रिप्शन (Subscribed)' : 'Subscription'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              subFilter === 'subscribed' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {subscribedUsersCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubFilter('non_subscribed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shrink-0 ${
              subFilter === 'non_subscribed'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🆓 {lang === 'mr' ? 'विना-सबस्क्रिप्शन (Non-Subscription)' : 'Non-Subscription'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              subFilter === 'non_subscribed' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {nonSubscribedUsersCount}
            </span>
          </button>
        </div>

        {/* Search input and live indicator */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md justify-end">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7A6F68] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                lang === 'mr' 
                  ? 'फोन नंबर, नाव किंवा ईमेलनुसार शोधा...' 
                  : lang === 'hi' 
                  ? 'फोन नंबर, नाम या ईमेल द्वारा खोजें...' 
                  : 'Search by phone number, name, email...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-full pl-11 pr-4 py-2 text-xs text-[#2D2522] placeholder-[#A89C94] focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div className="text-xs text-[#7A6F68] font-bold whitespace-nowrap shrink-0">
            {lang === 'mr' ? 'दाखवले:' : 'Showing:'}{' '}
            <span className="font-black text-[#EA580C]">{filteredUsers.length}</span>
          </div>
        </div>

      </div>

      {/* 4. USERS & DEVICE ENFORCEMENT TABLE */}
      <div className="rounded-3xl bg-white border border-[#E5DBCA] p-6 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-[#7A6F68] border-b border-[#E5DBCA]">
              <tr>
                <th className="pb-3 font-bold">{t('colUserPhone')}</th>
                <th className="pb-3 font-bold">{lang === 'mr' ? 'सक्रिय स्थिती व वेळ (Active Duration)' : lang === 'hi' ? 'सक्रिय स्थिति व समय' : 'Session Status & Duration'}</th>
                <th className="pb-3 font-bold">{t('colRegistered')}</th>
                <th className="pb-3 font-bold">{t('colActiveDevices')}</th>
                <th className="pb-3 font-bold">{t('colSubscription')}</th>
                <th className="pb-3 font-bold">{t('colPlanExpiry')}</th>
                <th className="pb-3 font-bold text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DBCA]/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-semibold">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    {t('loadingText')}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="max-w-md mx-auto text-center space-y-2">
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-800 font-bold text-sm">
                        {lang === 'mr' ? 'कोणताही प्रेक्षक सापडला नाही.' : lang === 'hi' ? 'कोई दर्शक नहीं मिला।' : 'No users found.'}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {lang === 'mr'
                          ? 'Android mobile app मधून ज्या नंबरने लॉगिन केले जाईल, तो युझर येथे थेट दिसेल.'
                          : 'Users logging in via the Android mobile app will automatically appear here.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const devList = Array.isArray(u?.devices) ? u.devices : [];
                  const isUserActive = u.sessionStatus === 'active' && u.isLoggedIn === true && devList.length > 0;
                  
                  // Compute active hours / duration
                  const activeInfo = formatActiveHours(u.lastLogin || u.loginTime || u.createdAt, lang);

                  return (
                    <tr key={u.id} className="hover:bg-[#FAF7F2] transition-colors">
                      
                      {/* 1. USER & PHONE (Single Deduplicated Entry with Online/Offline Indicator) */}
                      <td className="py-3.5 pr-4">
                        <div 
                          onClick={() => setSelectedUser(u)}
                          className="flex items-center gap-3 cursor-pointer group"
                          title={lang === 'mr' ? 'सविस्तर माहिती पाहण्यासाठी क्लिक करा' : 'Click to inspect user details'}
                        >
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F472B6] to-[#E07A5F] border border-[#E5DBCA] flex items-center justify-center font-bold text-xs text-white uppercase overflow-hidden shrink-0 shadow-soft group-hover:scale-105 transition">
                              {u.photoUrl ? (
                                <img src={u.photoUrl} alt={u.name || 'User'} className="w-full h-full object-cover" />
                              ) : (
                                (u.name || 'U').charAt(0)
                              )}
                            </div>
                            {/* Live Presence Indicator */}
                            <span 
                              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                                isUserActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                              }`} 
                              title={isUserActive ? 'Online / Active' : 'Logged Out'}
                            />
                          </div>

                          <div>
                            <p className="font-bold text-[#2D2522] flex items-center gap-1.5 group-hover:text-[#EA580C] transition">
                              <span>{u.name || 'User'}</span>
                            </p>
                            <p className="text-xs font-mono font-bold text-[#EA580C]">
                              {u.phone || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. ACTIVITY STATUS & EXACT ACTIVE HOURS */}
                      <td className="py-3.5 pr-3">
                        {isUserActive ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-black shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              {lang === 'mr' ? 'सक्रिय (Active)' : lang === 'hi' ? 'सक्रिय (Active)' : 'Active (Online)'}
                            </span>
                            <p className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#EA580C]" />
                              <span>{activeInfo.text}</span>
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-black">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              {lang === 'mr' ? 'लॉग आउट (Logged Out)' : lang === 'hi' ? 'लॉग आउट (Logged Out)' : 'Logged Out'}
                            </span>
                            <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                              <LogOut className="w-3 h-3 text-slate-400" />
                              <span>{u.lastLogout ? `${lang === 'mr' ? 'लॉग आउट' : 'Logged out'}: ${formatDateTime(u.lastLogout)}` : (lang === 'mr' ? 'सत्र समाप्त (Offline)' : 'Session Ended')}</span>
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3. REGISTERED DATE */}
                      <td className="py-3.5 text-xs text-[#7A6F68] font-mono font-medium">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* 4. ACTIVE DEVICES */}
                      <td className="py-3.5">
                        {isUserActive ? (
                          <div className="flex items-center gap-1.5">
                            {devList.map((d, idx) => (
                              <span
                                key={d.deviceId || idx}
                                title={`${d.deviceName} (${d.platform})`}
                                className="p-1 rounded-lg bg-[#FAF7F2] border border-[#E5DBCA] flex items-center justify-center shadow-sm"
                              >
                                {getPlatformIcon(d.platform)}
                              </span>
                            ))}
                            <span className="text-xs font-bold text-[#2D2522] ml-1">
                              {devList.length} {devList.length === 1 ? 'device' : 'devices'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">
                            0 devices ({lang === 'mr' ? 'लॉग आउट' : 'Logged Out'})
                          </span>
                        )}
                      </td>

                      {/* 5. SUBSCRIPTION BADGE */}
                      <td className="py-3.5">
                        {(() => {
                          const daysLeft = getPlanDaysLeft(u.planExpiry);
                          const isExpired = u.subscriptionStatus === 'expired' || (daysLeft !== null && daysLeft <= 0);
                          const isActive = u.subscriptionStatus === 'active' && !isExpired;

                          if (isActive) {
                            return (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black shadow-2xs">
                                  👑 Subscribed
                                </span>
                                <p className="text-[10px] text-emerald-700 font-semibold truncate max-w-[130px]">{u.planName || 'VIP Pass'}</p>
                                {daysLeft !== null && (
                                  <p className="text-[10px] text-emerald-600 font-bold">
                                    ⏳ {daysLeft} {lang === 'mr' ? 'दिवस शिल्लक' : 'days left'}
                                  </p>
                                )}
                              </div>
                            );
                          }

                          if (isExpired) {
                            return (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-black shadow-2xs">
                                  ⚠️ Plan Expired
                                </span>
                                <p className="text-[10px] text-rose-600 font-bold">
                                  {lang === 'mr' ? 'मुदत संपली (Expired)' : 'Plan Expired'}
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold">
                                🆓 Non-Subscribed
                              </span>
                              <p className="text-[10px] text-slate-400 font-medium">{lang === 'mr' ? 'विना-सबस्क्रिप्शन (मोफत)' : 'No Subscription'}</p>
                            </div>
                          );
                        })()}
                      </td>

                      {/* 6. PLAN EXPIRY */}
                      <td className="py-3.5 text-xs font-mono">
                        {(() => {
                          const daysLeft = getPlanDaysLeft(u.planExpiry);
                          const isExpired = u.subscriptionStatus === 'expired' || (daysLeft !== null && daysLeft <= 0);
                          const isActive = u.subscriptionStatus === 'active' && !isExpired;

                          if (isActive && u.planExpiry) {
                            return (
                              <div className="space-y-0.5">
                                <span className="font-bold text-[#2D2522]">{formatDate(u.planExpiry)}</span>
                                {daysLeft !== null && (
                                  <p className="text-[10px] text-emerald-600 font-bold">
                                    ⏳ {daysLeft} {lang === 'mr' ? 'दिवस शिल्लक' : 'days left'}
                                  </p>
                                )}
                              </div>
                            );
                          }

                          if (isExpired && u.planExpiry) {
                            return (
                              <div className="space-y-0.5">
                                <span className="line-through text-slate-400 font-medium">{formatDate(u.planExpiry)}</span>
                                <p className="text-[10px] text-rose-600 font-black">
                                  ⚠️ {lang === 'mr' ? 'मुदत संपली (० दिवस)' : 'Expired (0 days)'}
                                </p>
                              </div>
                            );
                          }

                          return <span className="text-slate-400 font-medium">— {lang === 'mr' ? 'विना-प्लॅन' : 'No plan'}</span>;
                        })()}
                      </td>

                      {/* 7. ACTIONS (Grant/Extend Plan, Force Logout, Inspect, Delete — NO REVOKE) */}
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Plan Grant / Extend Button (Strictly No Revoke Option) */}
                          {canEdit && (
                            (() => {
                              const daysLeft = getPlanDaysLeft(u.planExpiry);
                              const isExpired = u.subscriptionStatus === 'expired' || (daysLeft !== null && daysLeft <= 0);
                              const isActive = u.subscriptionStatus === 'active' && !isExpired;

                              if (isActive) {
                                return (
                                  <button
                                    onClick={() => {
                                      setPlanAssignUser(u);
                                      setSelectedPlanDays(365);
                                      setIsCustomDays(false);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-black transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                    title={lang === 'mr' ? 'प्लॅन मुदत वाढवा / दिवस जोडा' : 'Extend / Renew Plan'}
                                  >
                                    <span>👑 {lang === 'mr' ? 'प्लॅन वाढवा' : 'Extend Plan'}</span>
                                  </button>
                                );
                              }

                              return (
                                <button
                                  onClick={() => {
                                    setPlanAssignUser(u);
                                    setSelectedPlanDays(365);
                                    setIsCustomDays(false);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-[11px] font-black transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title={lang === 'mr' ? 'सशुल्क सबस्क्रिप्शन प्लॅन द्या' : 'Grant Subscription Plan'}
                                >
                                  <span>👑 {lang === 'mr' ? 'प्लॅन द्या' : 'Grant Plan'}</span>
                                </button>
                              );
                            })()
                          )}

                          {/* Force Remote Logout Button (if currently active) */}
                          {isUserActive && (
                            <button
                              onClick={() => handleForceLogout(u)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                              title={lang === 'mr' ? 'डिव्हाइसमधून लॉग आउट करा' : 'Force Logout from Android App'}
                            >
                              <LogOut className="w-3.5 h-3.5 text-rose-600" />
                              <span className="hidden xl:inline">{lang === 'mr' ? 'लॉग आउट करा' : 'Log Out'}</span>
                            </button>
                          )}

                          {/* Delete User Button */}
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title={t('deleteBtn')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. INSPECT USER MODAL WITH FULL SESSION BREAKDOWN */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={lang === 'mr' ? `वापरकर्ता तपशील — ${selectedUser?.name}` : `User Inspector — ${selectedUser?.name}`}
        description="View live authenticated Android device sessions, active hours, and entitlement status."
        maxWidth="xl"
      >
        {selectedUser && (
          <div className="space-y-6">
            
            {/* User Meta Card */}
            <div className="p-5 rounded-3xl bg-[#FAF7F2] border border-[#E5DBCA] flex items-center justify-between">
              <div>
                <h4 className="font-black text-[#2D2522] text-base">{selectedUser.name}</h4>
                <p className="text-xs text-[#EA580C] font-mono font-bold">{selectedUser.phone} {selectedUser.email ? `· ${selectedUser.email}` : ''}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {(() => {
                    const daysLeft = getPlanDaysLeft(selectedUser.planExpiry);
                    const isExpired = selectedUser.subscriptionStatus === 'expired' || (daysLeft !== null && daysLeft <= 0);
                    const isActive = selectedUser.subscriptionStatus === 'active' && !isExpired;

                    if (isActive) {
                      return (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-300 flex items-center gap-1 shadow-2xs">
                          👑 {lang === 'mr' ? 'सबस्क्राइब केलेला (Subscribed)' : 'Subscribed'} · {daysLeft !== null ? `${daysLeft} दिवस शिल्लक` : ''}
                        </span>
                      );
                    }
                    if (isExpired) {
                      return (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black border border-rose-300 flex items-center gap-1 shadow-2xs">
                          ⚠️ {lang === 'mr' ? 'प्लॅन संपला (Plan Expired)' : 'Plan Expired'}
                        </span>
                      );
                    }
                    return (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-300 flex items-center gap-1">
                        🆓 {lang === 'mr' ? 'विना-सबस्क्रिप्शन (Non-Subscribed)' : 'Non-Subscribed'}
                      </span>
                    );
                  })()}

                  <span className="text-xs font-mono font-bold text-[#7A6F68]">
                    {selectedUser.planName || (isUserSubscribedValid(selectedUser) ? 'VIP Pass' : 'मोफत प्रेक्षक')}
                  </span>
                  {selectedUser.planExpiry && (
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                      isUserSubscribedValid(selectedUser) 
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                        : 'text-rose-700 bg-rose-50 border-rose-200 line-through'
                    }`}>
                      Exp: {formatDate(selectedUser.planExpiry)}
                    </span>
                  )}
                  {selectedUser.sessionStatus === 'logged_out' || !selectedUser.isLoggedIn || (selectedUser.devices?.length || 0) === 0 ? (
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      {lang === 'mr' ? 'लॉग आउट' : 'Logged Out'} {selectedUser.lastLogout ? `(${formatDateTime(selectedUser.lastLogout)})` : ''}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      🟢 {formatActiveHours(selectedUser.lastLogin || selectedUser.loginTime || selectedUser.createdAt, lang).text}
                    </span>
                  )}
                </div>
              </div>

              {canEdit && (
                <div className="flex flex-col gap-2">
                  {/* Extend / Assign Plan (NO REVOKE) */}
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setPlanAssignUser(selectedUser);
                      setSelectedPlanDays(365);
                      setIsCustomDays(false);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black"
                  >
                    👑 {isUserSubscribedValid(selectedUser)
                      ? (lang === 'mr' ? 'प्लॅन वाढवा / दिवस जोडा' : 'Extend / Renew Plan')
                      : (lang === 'mr' ? 'सशुल्क VIP प्लॅन द्या' : 'Grant VIP Plan')}
                  </Button>

                  {selectedUser.sessionStatus !== 'logged_out' && selectedUser.isLoggedIn !== false && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleForceLogout(selectedUser)}
                      className="text-rose-600 hover:bg-rose-50 border border-rose-200"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-1 text-rose-600" />
                      {lang === 'mr' ? 'लॉग आउट करा' : 'Force Logout'}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Device Limits & Sessions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#EA580C]" /> Active Android Device Sessions ({(selectedUser.devices || []).length})
                </span>
                {selectedUser.lastLogin && (
                  <span className="text-[10px] text-slate-400 font-mono normal-case">
                    Last login: {new Date(selectedUser.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </h4>

              <div className="space-y-2">
                {(selectedUser.devices || []).length === 0 ? (
                  <div className="p-4 bg-white rounded-2xl border border-[#E5DBCA] text-center space-y-1">
                    <LogOut className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs text-[#7A6F68] font-bold">
                      {lang === 'mr' ? 'हे खाते सध्या कोणत्याही डिव्हाइसवर सक्रिय नाही (लॉग आउट स्थिती).' : 'No active devices currently bound to this user profile (Logged out).'}
                    </p>
                  </div>
                ) : (
                  (selectedUser.devices || []).map((device) => (
                    <div 
                      key={device.deviceId} 
                      className="p-3.5 bg-white rounded-2xl border border-[#E5DBCA] flex items-center justify-between text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#FAF7F2] rounded-xl border border-[#E5DBCA]">
                          {getPlatformIcon(device.platform)}
                        </div>
                        <div>
                          <p className="font-bold text-[#2D2522] flex items-center gap-2">
                            <span>{device.deviceName}</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          </p>
                          <p className="text-[10px] text-[#7A6F68] font-mono">
                            Login timestamp: {formatDate(device.lastLogin)} {device.ipAddress ? `· ${device.ipAddress}` : ''}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRevokeDevice(selectedUser, device.deviceId)}
                        className="text-[#E11D48] hover:bg-[#E11D48]/10 h-7 text-[11px] cursor-pointer"
                      >
                        Disconnect Device
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Watch Progress */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E07A5F]" /> Continue Watching History
              </h4>

              <div className="space-y-2">
                {Object.keys(selectedUser.continueWatching || {}).length === 0 ? (
                  <p className="text-xs text-[#7A6F68] italic p-3 bg-white rounded-2xl border border-[#E5DBCA]">
                    No playback history recorded for this user.
                  </p>
                ) : (
                  Object.entries(selectedUser.continueWatching || {}).map(([contentId, progress]) => {
                    const content = contentList.find(c => c.id === contentId);
                    const pct = progress.duration ? Math.min(100, Math.round((progress.position / progress.duration) * 100)) : 0;
                    return (
                      <div 
                        key={contentId} 
                        className="p-3 bg-white rounded-2xl border border-[#E5DBCA] flex items-center justify-between text-xs"
                      >
                        <div className="truncate max-w-[240px]">
                          <p className="font-bold text-[#2D2522] truncate">{content?.title || contentId}</p>
                          <p className="text-[10px] text-[#7A6F68] font-mono">
                            {formatDuration(progress.position)} / {formatDuration(progress.duration)} ({pct}%)
                          </p>
                        </div>
                        <div className="w-24 bg-[#FAF7F2] border border-[#E5DBCA] h-2 rounded-full overflow-hidden">
                          <div className="bg-[#E11D48] h-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* 6. ADD USER MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={lang === 'mr' ? 'नवीन वापरकर्ता नोंदणी' : lang === 'hi' ? 'नया यूजर पंजीकरण' : 'Add New User'}
        description={lang === 'mr' ? 'नवीन मोबाइल नंबरने थेट प्रेक्षक नोंदवा किंवा चाचणी सत्र सुरू करा.' : 'Register a new viewer profile with phone number and subscription tier.'}
        maxWidth="md"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'mr' ? 'मोबाईल नंबर (१० अंक)*' : lang === 'hi' ? 'मोबाइल नंबर (१० अंक)*' : 'Mobile Phone (10 digits)*'}
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-[#E5DBCA] bg-[#FAF7F2] text-slate-500 font-bold text-xs">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="8530790727"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white border border-[#E5DBCA] rounded-r-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'mr' ? 'वापरकर्त्याचे नाव' : lang === 'hi' ? 'यूजर का नाम' : 'Full Name'}
            </label>
            <input
              type="text"
              placeholder="e.g. Pruthvir"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-white border border-[#E5DBCA] rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'mr' ? 'ईमेल (पर्यायी)' : 'Email (Optional)'}
            </label>
            <input
              type="email"
              placeholder="user@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-white border border-[#E5DBCA] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'mr' ? 'वर्गणी स्थिती (Subscription Status)' : 'Subscription Tier'}
            </label>
            <select
              value={newSubStatus}
              onChange={(e) => setNewSubStatus(e.target.value as any)}
              className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#EA580C]"
            >
              <option value="active">Active (VIP Annual Pass)</option>
              <option value="free">Free Access</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-[#E5DBCA]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              className="bg-[#EA580C] hover:bg-[#C2410C] text-white"
            >
              {isSaving ? 'नोंदवत आहे...' : (lang === 'mr' ? 'वापरकर्ता जोडा' : 'Save & Register')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. PLAN DURATION ASSIGNMENT MODAL (Strictly Duration-based, No Revoke) */}
      <Modal
        isOpen={!!planAssignUser}
        onClose={() => setPlanAssignUser(null)}
        title={lang === 'mr' ? `👑 प्लॅन मुदत ठरवा — ${planAssignUser?.name || planAssignUser?.phone}` : `👑 Set Plan Duration — ${planAssignUser?.name || planAssignUser?.phone}`}
        description={lang === 'mr' 
          ? 'वापरकर्त्याला किती दिवसांचा VIP प्लॅन द्यायचा आहे ते निवडा. मुदत संपल्यानंतर प्लॅन आपोआप Expire होईल.'
          : 'Choose how many days this VIP subscription should be valid for. The plan will automatically expire once days finish.'}
        maxWidth="md"
      >
        {planAssignUser && (
          <div className="space-y-4">
            
            {/* User Info Bar */}
            <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E5DBCA] flex items-center justify-between">
              <div>
                <p className="font-black text-[#2D2522] text-sm">{planAssignUser.name || 'User'}</p>
                <p className="font-mono text-xs font-bold text-[#EA580C]">{planAssignUser.phone}</p>
              </div>
              <div>
                {isUserSubscribedValid(planAssignUser) ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-300">
                    सध्या: 👑 Subscribed
                  </span>
                ) : planAssignUser.subscriptionStatus === 'expired' ? (
                  <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black border border-rose-300">
                    सध्या: ⚠️ Expired
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-300">
                    सध्या: 🆓 मोफत
                  </span>
                )}
              </div>
            </div>

            {/* Duration Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {lang === 'mr' ? 'प्लॅन कालावधी (दिवसांमध्ये निवडा):' : 'Select Plan Duration:'}
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 28 Days */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlanDays(28);
                    setIsCustomDays(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    !isCustomDays && selectedPlanDays === 28
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-white border-[#E5DBCA] hover:border-emerald-300'
                  }`}
                >
                  <p className="font-black text-xs text-slate-800 flex items-center justify-between">
                    <span>२८ दिवस (28 Days)</span>
                    {!isCustomDays && selectedPlanDays === 28 && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">मासिक VIP प्लॅन</p>
                </button>

                {/* 84 Days */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlanDays(84);
                    setIsCustomDays(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    !isCustomDays && selectedPlanDays === 84
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-white border-[#E5DBCA] hover:border-emerald-300'
                  }`}
                >
                  <p className="font-black text-xs text-slate-800 flex items-center justify-between">
                    <span>८४ दिवस (84 Days)</span>
                    {!isCustomDays && selectedPlanDays === 84 && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">त्रैमासिक VIP (३ महिने)</p>
                </button>

                {/* 365 Days */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlanDays(365);
                    setIsCustomDays(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    !isCustomDays && selectedPlanDays === 365
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-white border-[#E5DBCA] hover:border-emerald-300'
                  }`}
                >
                  <p className="font-black text-xs text-slate-800 flex items-center justify-between">
                    <span>३६५ दिवस (1 Year)</span>
                    {!isCustomDays && selectedPlanDays === 365 && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-bold mt-0.5">⭐ वार्षिक VIP Pass</p>
                </button>

                {/* Custom Days */}
                <button
                  type="button"
                  onClick={() => setIsCustomDays(true)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    isCustomDays
                      ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/20'
                      : 'bg-white border-[#E5DBCA] hover:border-orange-300'
                  }`}
                >
                  <p className="font-black text-xs text-slate-800 flex items-center justify-between">
                    <span>सानुकूल दिवस (Custom)</span>
                    {isCustomDays && <Check className="w-3.5 h-3.5 text-orange-600" />}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">हवे तेवढे दिवस टाका</p>
                </button>
              </div>
            </div>

            {/* Custom Days Input Field */}
            {isCustomDays && (
              <div className="p-3.5 bg-orange-50/60 rounded-2xl border border-orange-200">
                <label className="block text-xs font-bold text-orange-950 mb-1.5">
                  {lang === 'mr' ? 'प्लॅनचे एकूण दिवस टाका (उदा. १, ७, १५, ३०, १८०):' : 'Enter number of days:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    value={customDaysInput}
                    onChange={(e) => setCustomDaysInput(e.target.value)}
                    className="w-32 bg-white border border-orange-300 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:outline-none focus:border-orange-500 text-center"
                    placeholder="30"
                  />
                  <span className="text-xs font-bold text-orange-900">
                    {lang === 'mr' ? 'दिवसांची मुदत राहील' : 'days validity'}
                  </span>
                </div>
              </div>
            )}

            {/* Expiry Date Preview */}
            {(() => {
              const activeDays = isCustomDays ? Math.max(1, parseInt(customDaysInput || '1', 10)) : selectedPlanDays;
              const computedExpiry = new Date(Date.now() + activeDays * 24 * 60 * 60 * 1000).toISOString();

              return (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{lang === 'mr' ? 'मुदत समाप्ती दिनांक:' : 'Plan will expire on:'}</span>
                    <span className="font-mono font-black text-emerald-800">{formatDate(computedExpiry)}</span>
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    {lang === 'mr' 
                      ? `आजपासून ठीक ${activeDays} दिवस हा युझर सर्व Premium व्हिडिओ पाहू शकेल. ${activeDays} दिवसांनंतर प्लॅन आपोआप 'मुदत संपली (Expired)' होईल.`
                      : `User can watch Premium content for ${activeDays} days. Status will automatically switch to Expired afterwards.`}
                  </p>
                </div>
              );
            })()}

            {/* Action buttons */}
            <div className="pt-3 flex justify-end gap-2 border-t border-[#E5DBCA]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPlanAssignUser(null)}
              >
                {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
              </Button>

              <Button
                type="button"
                variant="primary"
                disabled={isAssigningPlan}
                onClick={() => {
                  const days = isCustomDays ? Math.max(1, parseInt(customDaysInput || '1', 10)) : selectedPlanDays;
                  handleGrantPlanWithDays(planAssignUser, days);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black"
              >
                {isAssigningPlan ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <span>👑</span>
                )}
                <span>
                  {(() => {
                    const days = isCustomDays ? Math.max(1, parseInt(customDaysInput || '1', 10)) : selectedPlanDays;
                    return lang === 'mr' ? `${days} दिवसांचा प्लॅन सक्रिय करा` : `Activate ${days} Days Plan`;
                  })()}
                </span>
              </Button>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}
