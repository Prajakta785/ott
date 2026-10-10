import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { 
  AdminUser, 
  Advertisement,
  Banner, 
  BunnyConfig, 
  CompanyInfo,
  ContentItem, 
  ContentType,
  Episode, 
  Grievance,
  LiveChannel,
  NotificationItem,
  ContentCategory,
  Plan, 
  Season, 
  Subscription, 
  User
} from './types';
import { 
  initialAdmins, 
  initialAds, 
  initialBanners, 
  initialBunnyConfig, 
  initialCategories,
  initialCompanyInfo,
  initialContent, 
  initialEpisodes, 
  initialGrievances,
  initialLiveChannels,
  initialNotifications,
  initialPlans, 
  initialSeasons, 
  initialSubscriptions, 
  initialUsers 
} from './mock-data';

const STORAGE_KEYS = {
  CONTENT: 'ott_admin_content_v12_wiped',
  LIVE_CHANNELS: 'ott_admin_live_channels_v12_wiped',
  ADS: 'ott_admin_ads_v12_wiped',
  SEASONS: 'ott_admin_seasons_v12_wiped',
  EPISODES: 'ott_admin_episodes_v12_wiped',
  PLANS: 'ott_admin_plans_v12_wiped',
  USERS: 'ott_admin_users_v12_wiped',
  SUBSCRIPTIONS: 'ott_admin_subs_v12_wiped',
  BANNERS: 'ott_admin_banners_v12_wiped',
  ADMINS: 'ott_admin_admins_v12_wiped',
  BUNNY: 'ott_admin_bunny_v12_wiped',
  GRIEVANCES: 'ott_admin_grievances_v12_wiped',
  NOTIFICATIONS: 'ott_admin_notifications_v12_wiped',
  CATEGORIES: 'ott_admin_categories_v12_wiped',
  COMPANY_INFO: 'ott_admin_company_info_v12_wiped',
  DELETED_CONTENT: 'ott_admin_deleted_content_v12_wiped',
};

// In-Memory persistent registry (resilient against localStorage quota and SSR)
const memCache: Record<string, any> = {};

function getLocalDeletedIds(): string[] {
  return getLocalStore<string[]>(STORAGE_KEYS.DELETED_CONTENT, []);
}

function addLocalDeletedId(id: string): void {
  if (!id) return;
  const current = getLocalDeletedIds();
  if (!current.includes(id)) {
    setLocalStore(STORAGE_KEYS.DELETED_CONTENT, [...current, id]);
  }
  if (typeof window !== 'undefined') {
    fetch('/api/deleted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }
}

// Automatically sync deleted IDs from server store & Cloud Firestore on startup
if (typeof window !== 'undefined') {
  fetch('/api/deleted')
    .then(r => r.json())
    .then(res => {
      if (res.success && Array.isArray(res.data)) {
        const current = getLocalDeletedIds();
        const merged = Array.from(new Set([...current, ...res.data]));
        setLocalStore(STORAGE_KEYS.DELETED_CONTENT, merged);
      }
    })
    .catch(() => {});
}

// Auto purge legacy keys on load
if (typeof window !== 'undefined') {
  try {
    const validKeys = Object.values(STORAGE_KEYS);
    const preservedKeys = [
      'ott_admin_session_user',
      'ott_admin_master_super',
      'ott_admin_explicit_logout',
      'ott_admin_remember_email',
    ];
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('ott_admin_') && !validKeys.includes(k) && !preservedKeys.includes(k)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {}
}

function getLocalStore<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      if (item !== null && item !== undefined) {
        const parsed = JSON.parse(item);
        memCache[key] = parsed;
        return parsed;
      }
    } catch {
      // fallback
    }
  }
  if (memCache[key] !== undefined) return memCache[key];
  memCache[key] = defaultValue;
  return defaultValue;
}

function setLocalStore<T>(key: string, value: T): void {
  memCache[key] = value;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`localStorage quota limit reached for ${key}. Using in-memory store.`, e);
  }
}

// Timeout helper so Firestore network issues or permission blocks NEVER freeze the UI
const timeoutPromise = <T>(promise: Promise<T>, ms = 2500): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), ms)),
  ]);
};

/**
 * Recursively strips undefined fields and undefined array items
 * to prevent Firestore "Function setDoc() called with invalid data. Unsupported field value: undefined" errors
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

export class FirestoreService {
  private useLive: boolean;

  constructor() {
    this.useLive = isFirebaseConfigured;
  }

  setMode(live: boolean) {
    this.useLive = live && isFirebaseConfigured;
  }

  isLive(): boolean {
    return this.useLive;
  }

  /* ------------------- CONTENT (Movies, News, Series, Short Films, Podcasts) ------------------- */
  async getContent(type?: ContentType): Promise<ContentItem[]> {
    const deletedIds = getLocalDeletedIds();
    const filterValidItems = (list: ContentItem[]) => {
      return list.filter(c => {
        // Exclude logically deleted items
        if (deletedIds.includes(c.id)) return false;
        
        // Exclude dummy items and invalid videos (permanently hide from UI)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.videoId || '');
        const isBunnyStorage = (c.videoId || '').includes('storage.bunnycdn.com') || (c.videoUrl || '').includes('storage.bunnycdn.com');
        
        if (c.type === 'series') {
          if (c.id === 'ser-rang-majha-vegla' || (c.videoId && !isUUID && !isBunnyStorage)) return false;
          return true;
        }
        
        return isUUID || isBunnyStorage;
      });
    };

    if (this.useLive && db) {
      try {
        const contentRef = collection(db, 'content');
        const q = type 
          ? query(contentRef, where('type', '==', type)) 
          : contentRef;
        const snap = await timeoutPromise(getDocs(q), 3000);
        if (!snap.empty) {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as ContentItem));
          const filtered = filterValidItems(items);
          if (filtered.length > 0) {
            setLocalStore(STORAGE_KEYS.CONTENT, filtered);
            return type ? filtered.filter(c => c.type === type) : filtered;
          }
        }
      } catch (e) {
        console.warn('Firestore getContent fallback to server API:', e);
      }
    }

    let all: ContentItem[] = [];
    if (typeof window !== 'undefined') {
      try {
        const endpoint = type ? `/api/content?type=${encodeURIComponent(type)}` : '/api/content';
        const res = await fetch(endpoint);
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            all = filterValidItems(json.data);
            if (all.length > 0) {
              setLocalStore(STORAGE_KEYS.CONTENT, all);
              return type ? all.filter(c => c.type === type) : all;
            }
          }
        }
      } catch {}
    }

    all = getLocalStore<ContentItem[]>(STORAGE_KEYS.CONTENT, initialContent);
    const result = filterValidItems(all);
    return type ? result.filter(c => c.type === type) : result;
  }

  subscribeToContent(callback: (items: ContentItem[]) => void, type?: ContentType): () => void {
    if (this.useLive && db) {
      try {
        const contentRef = collection(db, 'content');
        const q = type 
          ? query(contentRef, where('type', '==', type)) 
          : contentRef;
        return onSnapshot(q, (snap) => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as ContentItem));
          const deletedIds = getLocalDeletedIds();
          const filtered = items.filter(c => {
            if (deletedIds.includes(c.id)) return false;
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.videoId || '');
            const isBunnyStorage = (c.videoId || '').includes('storage.bunnycdn.com') || (c.videoUrl || '').includes('storage.bunnycdn.com');
            if (c.type === 'series') {
              if (c.id === 'ser-rang-majha-vegla' || (c.videoId && !isUUID && !isBunnyStorage)) return false;
              return true;
            }
            return isUUID || isBunnyStorage;
          });
          setLocalStore(STORAGE_KEYS.CONTENT, filtered);
          callback(type ? filtered.filter(c => c.type === type) : filtered);
        }, (err) => {
          console.warn('Real-time snapshot listener error:', err);
        });
      } catch (e) {
        console.warn('subscribeToContent notice:', e);
      }
    }
    return () => {};
  }

  async getContentById(id: string): Promise<ContentItem | null> {
    if (getLocalDeletedIds().includes(id)) return null;

    if (this.useLive && db) {
      try {
        const snap = await timeoutPromise(getDoc(doc(db, 'content', id)), 2000);
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as ContentItem;
          if (data.status === 'deleted') return null;
          return data;
        }
      } catch (e) {
        console.warn('Firestore getContentById fallback:', e);
      }
    }
    const all = getLocalStore<ContentItem[]>(STORAGE_KEYS.CONTENT, initialContent);
    return all.find(c => c.id === id && !getLocalDeletedIds().includes(c.id)) || null;
  }

  async saveContent(item: ContentItem): Promise<ContentItem> {
    const now = new Date().toISOString();
    const toSave: ContentItem = {
      ...item,
      updatedAt: now,
      createdAt: item.createdAt || now,
      status: item.status || 'published', // ensure published for Android app visibility
      poster: item.poster || item.posterUrl || '',
      posterUrl: item.posterUrl || item.poster || '',
      banner: item.banner || item.bannerUrl || '',
      bannerUrl: item.bannerUrl || item.banner || '',
    };

    const all = getLocalStore<ContentItem[]>(STORAGE_KEYS.CONTENT, initialContent);
    const index = all.findIndex(c => c.id === toSave.id);
    let updatedList: ContentItem[];
    if (index >= 0) {
      updatedList = [...all];
      updatedList[index] = toSave;
    } else {
      updatedList = [toSave, ...all];
    }
    setLocalStore(STORAGE_KEYS.CONTENT, updatedList);

    // Sync to Server REST API for Android apps & other devices
    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toSave),
        });
      } catch (e) {
        console.warn('Server content sync error:', e);
      }

      try {
        window.dispatchEvent(new CustomEvent('ott_content_updated', { detail: toSave }));
      } catch {}
    }

    if (this.useLive && db) {
      timeoutPromise(setDoc(doc(db, 'content', toSave.id), cleanForFirestore(toSave)), 3000)
        .catch(e => console.warn('Background Firestore save notice:', e));
    }

    return toSave;
  }

  async deleteContent(id: string): Promise<void> {
    addLocalDeletedId(id);

    const all = getLocalStore<ContentItem[]>(STORAGE_KEYS.CONTENT, initialContent);
    const itemToDelete = all.find(c => c.id === id);
    const videoId = itemToDelete?.videoId || '';

    const updated = all.filter(c => c.id !== id);
    setLocalStore(STORAGE_KEYS.CONTENT, updated);

    // Also remove from banners if any banner references this content
    const banners = getLocalStore<Banner[]>(STORAGE_KEYS.BANNERS, initialBanners);
    setLocalStore(STORAGE_KEYS.BANNERS, banners.filter(b => b.contentId !== id && b.id !== id));

    if (typeof window !== 'undefined') {
      try {
        const queryParams = new URLSearchParams({ id });
        if (videoId) queryParams.set('videoId', videoId);
        await fetch(`/api/content?${queryParams.toString()}`, {
          method: 'DELETE',
        });
      } catch (e) {
        console.warn('Server content delete error:', e);
      }

      // Also directly delete video from Bunny API route if videoId is known
      if (videoId && !videoId.startsWith('http') && videoId !== 'sample-podcast') {
        try {
          fetch(`/api/bunny/videos?guid=${encodeURIComponent(videoId)}`, {
            method: 'DELETE',
          }).catch(() => {});
        } catch {}
      }

      try {
        window.dispatchEvent(new CustomEvent('ott_content_updated', { detail: { id, deleted: true } }));
      } catch {}
    }

    if (this.useLive && db) {
      timeoutPromise(deleteDoc(doc(db, 'content', id)), 3000)
        .catch(e => console.warn('Background Firestore delete notice:', e));

      // Also record into users/app_deleted_content in Cloud Firestore
      try {
        const delRef = doc(db, 'users', 'app_deleted_content');
        getDoc(delRef).then(snap => {
          let list: string[] = [];
          if (snap.exists()) {
            list = snap.data()?.deletedIds || [];
          }
          if (!list.includes(id)) {
            list.push(id);
          }
          setDoc(delRef, {
            deletedIds: list,
            lastDeletedId: id,
            updatedAt: new Date().toISOString(),
          }, { merge: true }).catch(() => {});
        }).catch(() => {});
      } catch {}
    }
  }

  /* ------------------- LIVE TV CHANNELS (Section 3 & 6) ------------------- */
  async getLiveChannels(): Promise<LiveChannel[]> {
    const deletedIds = getLocalDeletedIds();
    const filterDeleted = (list: LiveChannel[]) => list.filter(c => !deletedIds.includes(c.id));

    // 1. Fast local cache check
    const localChannels = getLocalStore<LiveChannel[]>(STORAGE_KEYS.LIVE_CHANNELS, initialLiveChannels);

    // 2. Browser API sync (fast, reliable server route with admin Firestore sync)
    if (typeof window !== 'undefined') {
      try {
        const res = await timeoutPromise(fetch('/api/live'), 1500);
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            const filtered = filterDeleted(json.data);
            setLocalStore(STORAGE_KEYS.LIVE_CHANNELS, filtered);
            return filtered;
          }
        }
      } catch (e) {
        // Continue to direct Firestore fallback
      }
    }

    // 3. Direct Firestore client fallback
    if (this.useLive && db) {
      try {
        let snap;
        try {
          snap = await timeoutPromise(getDocs(collection(db, 'live_channels')), 2000);
        } catch {
          snap = await timeoutPromise(getDocs(collection(db, 'liveChannels')), 2000);
        }
        if (snap && !snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveChannel));
          const filtered = filterDeleted(list);
          if (filtered.length > 0) {
            setLocalStore(STORAGE_KEYS.LIVE_CHANNELS, filtered);
            return filtered;
          }
        }
      } catch (e) {
        console.warn('Firestore getLiveChannels fallback notice:', e);
      }
    }

    return filterDeleted(localChannels && localChannels.length > 0 ? localChannels : initialLiveChannels);
  }

  async saveLiveChannel(channel: LiveChannel): Promise<LiveChannel> {
    const all = getLocalStore<LiveChannel[]>(STORAGE_KEYS.LIVE_CHANNELS, initialLiveChannels);
    const index = all.findIndex(c => c.id === channel.id);
    let updated: LiveChannel[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = { ...channel, updatedAt: new Date().toISOString() };
    } else {
      updated = [...all, { ...channel, updatedAt: new Date().toISOString() }];
    }
    setLocalStore(STORAGE_KEYS.LIVE_CHANNELS, updated);

    // Sync via server API (which writes to Cloud Firestore via Admin privileges)
    if (typeof window !== 'undefined') {
      fetch('/api/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channel),
      }).catch(e => console.warn('Server live channel sync notice:', e));
    }

    // Also write to client Firestore if available
    if (this.useLive && db) {
      timeoutPromise(setDoc(doc(db, 'live_channels', channel.id), cleanForFirestore(channel)), 3000)
        .catch(() => {});
      timeoutPromise(setDoc(doc(db, 'liveChannels', channel.id), cleanForFirestore(channel)), 3000)
        .catch(() => {});
    }

    return channel;
  }

  async deleteLiveChannel(id: string): Promise<void> {
    addLocalDeletedId(id);

    const all = getLocalStore<LiveChannel[]>(STORAGE_KEYS.LIVE_CHANNELS, initialLiveChannels);
    setLocalStore(STORAGE_KEYS.LIVE_CHANNELS, all.filter(c => c.id !== id));

    if (typeof window !== 'undefined') {
      fetch(`/api/live?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(e => console.warn('Server live channel delete notice:', e));

      try {
        window.dispatchEvent(new CustomEvent('ott_live_updated', { detail: { id, deleted: true } }));
      } catch {}
    }

    if (this.useLive && db) {
      timeoutPromise(deleteDoc(doc(db, 'live_channels', id)), 3000).catch(() => {});
      timeoutPromise(deleteDoc(doc(db, 'liveChannels', id)), 3000).catch(() => {});
    }
  }

  /* ------------------- ADVERTISEMENTS CMS (Section 15 & 6) ------------------- */
  async getAds(): Promise<Advertisement[]> {
    const deletedIds = getLocalDeletedIds();
    const filterDeleted = (list: Advertisement[]) => list.filter(a => !deletedIds.includes(a.id));

    if (typeof window !== 'undefined') {
      try {
        const res = await timeoutPromise(fetch('/api/ads'), 1500);
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            const filtered = filterDeleted(json.data);
            setLocalStore(STORAGE_KEYS.ADS, filtered);
            return filtered;
          }
        }
      } catch {}
    }

    if (this.useLive && db) {
      try {
        const snap = await timeoutPromise(getDocs(collection(db, 'ads')), 2000);
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Advertisement));
          const filtered = filterDeleted(list);
          setLocalStore(STORAGE_KEYS.ADS, filtered);
          return filtered;
        }
      } catch (e) {
        console.warn('Firestore getAds fallback:', e);
      }
    }
    return filterDeleted(getLocalStore<Advertisement[]>(STORAGE_KEYS.ADS, initialAds));
  }

  async saveAd(ad: Advertisement): Promise<Advertisement> {
    const all = getLocalStore<Advertisement[]>(STORAGE_KEYS.ADS, initialAds);
    const index = all.findIndex(a => a.id === ad.id);
    let updated: Advertisement[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = ad;
    } else {
      updated = [ad, ...all];
    }
    setLocalStore(STORAGE_KEYS.ADS, updated);

    if (typeof window !== 'undefined') {
      fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ad),
      }).catch(() => {});
    }

    if (this.useLive && db) {
      timeoutPromise(setDoc(doc(db, 'ads', ad.id), ad), 3000)
        .catch(e => console.warn('Background Firestore saveAd notice:', e));
    }

    return ad;
  }

  async deleteAd(id: string): Promise<void> {
    addLocalDeletedId(id);

    const all = getLocalStore<Advertisement[]>(STORAGE_KEYS.ADS, initialAds);
    setLocalStore(STORAGE_KEYS.ADS, all.filter(a => a.id !== id));

    if (typeof window !== 'undefined') {
      fetch(`/api/ads?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(() => {});

      try {
        window.dispatchEvent(new CustomEvent('ott_ads_updated', { detail: { id, deleted: true } }));
      } catch {}
    }

    if (this.useLive && db) {
      timeoutPromise(deleteDoc(doc(db, 'ads', id)), 3000)
        .catch(e => console.warn('Background Firestore deleteAd notice:', e));
    }
  }

  /* ------------------- SEASONS & EPISODES ------------------- */
  async getSeasons(contentId: string): Promise<Season[]> {
    const deletedIds = getLocalDeletedIds();
    const filterDeleted = (list: Season[]) => list.filter(s => !deletedIds.includes(s.id));

    if (typeof window !== 'undefined') {
      try {
        const res = await timeoutPromise(fetch(`/api/content/seasons?seriesId=${encodeURIComponent(contentId)}`), 2000);
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            const all = getLocalStore<Season[]>(STORAGE_KEYS.SEASONS, initialSeasons);
            const others = all.filter(s => s.contentId !== contentId && (s as any).seriesId !== contentId);
            const filtered = filterDeleted(json.data);
            setLocalStore(STORAGE_KEYS.SEASONS, [...others, ...filtered]);
            return filtered.sort((a: Season, b: Season) => a.seasonNumber - b.seasonNumber);
          }
        }
      } catch (e) {
        // fallback
      }
    }

    if (this.useLive && db) {
      try {
        const seasonsRef = collection(db, 'content', contentId, 'seasons');
        const snap = await timeoutPromise(getDocs(seasonsRef), 2000);
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Season));
          return filterDeleted(list).sort((a, b) => a.seasonNumber - b.seasonNumber);
        }
      } catch (e) {
        console.warn('Firestore getSeasons fallback:', e);
      }
    }
    const all = getLocalStore<Season[]>(STORAGE_KEYS.SEASONS, initialSeasons);
    return filterDeleted(all.filter(s => s.contentId === contentId || (s as any).seriesId === contentId)).sort((a, b) => a.seasonNumber - b.seasonNumber);
  }

  async saveSeason(season: Season): Promise<Season> {
    const deletedIds = getLocalDeletedIds();
    if (deletedIds.includes(season.id)) {
      setLocalStore(STORAGE_KEYS.DELETED_CONTENT, deletedIds.filter(id => id !== season.id));
    }

    const seriesId = season.seriesId || (season as any).contentId;
    const seasonToSave: Season = {
      ...season,
      seriesId: seriesId,
      contentId: seriesId,
      poster: season.poster || (season as any).posterUrl || '',
    } as any;

    const all = getLocalStore<Season[]>(STORAGE_KEYS.SEASONS, initialSeasons);
    const index = all.findIndex(s => s.id === seasonToSave.id);
    let updated: Season[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = seasonToSave;
    } else {
      updated = [...all, seasonToSave];
    }
    setLocalStore(STORAGE_KEYS.SEASONS, updated);

    // Sync to Server API which directly writes to Cloud Firestore subcollection
    if (typeof window !== 'undefined') {
      fetch('/api/content/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seasonToSave),
      }).catch(e => console.warn('Server saveSeason sync notice:', e));
    }

    if (this.useLive && db && seriesId) {
      timeoutPromise(setDoc(doc(db, 'content', seriesId, 'seasons', seasonToSave.id), cleanForFirestore(seasonToSave)), 3000)
        .catch(e => console.warn('Background Firestore saveSeason notice:', e));
    }

    return seasonToSave;
  }

  async deleteSeason(contentId: string, seasonId: string): Promise<void> {
    addLocalDeletedId(seasonId);

    const all = getLocalStore<Season[]>(STORAGE_KEYS.SEASONS, initialSeasons);
    setLocalStore(STORAGE_KEYS.SEASONS, all.filter(s => s.id !== seasonId));

    if (typeof window !== 'undefined') {
      fetch(`/api/content/seasons?seriesId=${encodeURIComponent(contentId)}&id=${encodeURIComponent(seasonId)}`, {
        method: 'DELETE',
      }).catch(e => console.warn('Server deleteSeason notice:', e));
    }

    if (this.useLive && db) {
      timeoutPromise(deleteDoc(doc(db, 'content', contentId, 'seasons', seasonId)), 3000)
        .catch(e => console.warn('Background Firestore deleteSeason notice:', e));
    }
  }

  async getEpisodes(contentId: string, seasonId: string): Promise<Episode[]> {
    const deletedIds = getLocalDeletedIds();
    const filterDeleted = (list: Episode[]) => list.filter(e => !deletedIds.includes(e.id));

    if (typeof window !== 'undefined') {
      try {
        const res = await timeoutPromise(
          fetch(`/api/content/episodes?seriesId=${encodeURIComponent(contentId)}&seasonId=${encodeURIComponent(seasonId)}`),
          2000
        );
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            const all = getLocalStore<Episode[]>(STORAGE_KEYS.EPISODES, initialEpisodes);
            const others = all.filter(e => e.seasonId !== seasonId);
            const filteredEpisodes = filterDeleted(json.data);
            setLocalStore(STORAGE_KEYS.EPISODES, [...others, ...filteredEpisodes]);
            return filteredEpisodes.sort((a: Episode, b: Episode) => a.episodeNumber - b.episodeNumber);
          }
        }
      } catch (e) {
        // fallback
      }
    }

    if (this.useLive && db) {
      try {
        const epRef = collection(db, 'content', contentId, 'seasons', seasonId, 'episodes');
        const snap = await timeoutPromise(getDocs(epRef), 2000);
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Episode));
          return filterDeleted(list).sort((a, b) => a.episodeNumber - b.episodeNumber);
        }
      } catch (e) {
        console.warn('Firestore getEpisodes fallback:', e);
      }
    }
    const all = getLocalStore<Episode[]>(STORAGE_KEYS.EPISODES, initialEpisodes);
    return filterDeleted(all.filter(e => e.seasonId === seasonId)).sort((a, b) => a.episodeNumber - b.episodeNumber);
  }

  async saveEpisode(episode: Episode): Promise<Episode> {
    const seriesId = episode.seriesId || (episode as any).contentId;
    const epToSave: Episode = {
      ...episode,
      seriesId: seriesId,
      contentId: seriesId,
      thumbnail: episode.thumbnail || (episode as any).thumbnailUrl || '',
    } as any;

    const all = getLocalStore<Episode[]>(STORAGE_KEYS.EPISODES, initialEpisodes);
    const index = all.findIndex(e => e.id === epToSave.id);
    let updated: Episode[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = epToSave;
    } else {
      updated = [...all, epToSave];
    }
    setLocalStore(STORAGE_KEYS.EPISODES, updated);

    // Sync to Server API which directly writes to Cloud Firestore subcollection
    if (typeof window !== 'undefined') {
      fetch('/api/content/episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(epToSave),
      }).catch(e => console.warn('Server saveEpisode sync notice:', e));
    }

    if (this.useLive && db && seriesId && epToSave.seasonId) {
      timeoutPromise(setDoc(doc(db, 'content', seriesId, 'seasons', epToSave.seasonId, 'episodes', epToSave.id), cleanForFirestore(epToSave)), 3000)
        .catch(e => console.warn('Background Firestore saveEpisode notice:', e));
    }

    return epToSave;
  }

  async deleteEpisode(contentId: string, seasonId: string, episodeId: string): Promise<void> {
    addLocalDeletedId(episodeId);

    const all = getLocalStore<Episode[]>(STORAGE_KEYS.EPISODES, initialEpisodes);
    const targetEp = all.find(e => e.id === episodeId);
    const videoId = targetEp?.videoId || '';

    setLocalStore(STORAGE_KEYS.EPISODES, all.filter(e => e.id !== episodeId));

    if (typeof window !== 'undefined') {
      const qParams = new URLSearchParams({
        seriesId: contentId,
        seasonId,
        id: episodeId,
      });
      if (videoId) qParams.set('videoId', videoId);

      fetch(`/api/content/episodes?${qParams.toString()}`, {
        method: 'DELETE',
      }).catch(e => console.warn('Server deleteEpisode notice:', e));

      if (videoId && !videoId.startsWith('http')) {
        fetch(`/api/bunny/videos?guid=${encodeURIComponent(videoId)}`, {
          method: 'DELETE',
        }).catch(() => {});
      }
    }

    if (this.useLive && db) {
      timeoutPromise(deleteDoc(doc(db, 'content', contentId, 'seasons', seasonId, 'episodes', episodeId)), 3000)
        .catch(e => console.warn('Background Firestore deleteEpisode notice:', e));

      try {
        const delRef = doc(db, 'users', 'app_deleted_content');
        getDoc(delRef).then(snap => {
          let list: string[] = [];
          if (snap.exists()) {
            list = snap.data()?.deletedIds || [];
          }
          if (!list.includes(episodeId)) {
            list.push(episodeId);
          }
          setDoc(delRef, {
            deletedIds: list,
            lastDeletedId: episodeId,
            updatedAt: new Date().toISOString(),
          }, { merge: true }).catch(() => {});
        }).catch(() => {});
      } catch {}
    }
  }

  /* ------------------- SUBSCRIPTION PLANS ------------------- */
  async getPlans(): Promise<Plan[]> {
    const deletedIds = getLocalDeletedIds();
    const filterDeleted = (list: Plan[]) => list.filter(p => !deletedIds.includes(p.id));

    // 1. Fast local cache check
    const localPlans = filterDeleted(getLocalStore<Plan[]>(STORAGE_KEYS.PLANS, initialPlans));

    // 2. Browser API sync (fast, reliable server route with admin Firestore sync)
    if (typeof window !== 'undefined') {
      try {
        const res = await timeoutPromise(fetch('/api/plans'), 1500);
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            const clean = filterDeleted(json.data);
            setLocalStore(STORAGE_KEYS.PLANS, clean);
            return clean;
          }
        }
      } catch (e) {
        // Continue to direct Firestore fallback
      }
    }

    // 3. Direct Firestore client fallback
    if (this.useLive && db) {
      try {
        const snap = await timeoutPromise(getDocs(collection(db, 'plans')), 2000);
        if (!snap.empty) {
          const list = filterDeleted(snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan)));
          setLocalStore(STORAGE_KEYS.PLANS, list);
          return list;
        }
      } catch (e) {
        console.warn('Firestore getPlans fallback:', e);
      }
    }
    return localPlans && localPlans.length > 0 ? localPlans : filterDeleted(initialPlans);
  }

  async savePlan(plan: Plan): Promise<Plan> {
    const deletedIds = getLocalDeletedIds();
    if (deletedIds.includes(plan.id)) {
      setLocalStore(STORAGE_KEYS.DELETED_CONTENT, deletedIds.filter(id => id !== plan.id));
    }

    const all = getLocalStore<Plan[]>(STORAGE_KEYS.PLANS, initialPlans);
    const index = all.findIndex(p => p.id === plan.id);
    let updated: Plan[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = plan;
    } else {
      updated = [...all, plan];
    }
    setLocalStore(STORAGE_KEYS.PLANS, updated);

    // Sync via server API (which writes to Cloud Firestore via Admin privileges)
    if (typeof window !== 'undefined') {
      fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      }).catch(e => console.warn('Server plan sync notice:', e));
    }

    if (this.useLive && db) {
      timeoutPromise(setDoc(doc(db, 'plans', plan.id), cleanForFirestore(plan)), 3000)
        .catch(e => console.warn('Background Firestore savePlan notice:', e));
    }

    return plan;
  }

  async deletePlan(id: string): Promise<void> {
    addLocalDeletedId(id);

    const all = getLocalStore<Plan[]>(STORAGE_KEYS.PLANS, initialPlans);
    setLocalStore(STORAGE_KEYS.PLANS, all.filter(p => p.id !== id));

    if (typeof window !== 'undefined') {
      fetch(`/api/plans?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(() => {});
    }

    if (this.useLive && db) {
      timeoutPromise(deleteDoc(doc(db, 'plans', id)), 3000)
        .catch(e => console.warn('Background Firestore deletePlan notice:', e));
    }
  }

  /* ------------------- USERS & SUBSCRIPTIONS ------------------- */
  async getUsers(): Promise<User[]> {
    const normalizeUser = (u: any): User => {
      let rawPhone = String(u?.phone || u?.mobile || u?.phoneNumber || u?.number || u?.contact || '').trim();
      if (!rawPhone && u?.id) {
        const match = String(u.id).match(/\d{10}/);
        if (match) rawPhone = match[0];
      }
      const digits = rawPhone.replace(/\D/g, '');
      const tenDigit = digits.length >= 10 ? digits.slice(-10) : digits;
      const formattedPhone = tenDigit ? `+91 ${tenDigit}` : (rawPhone || '—');
      const rawName = String(u?.name || u?.displayName || u?.fullName || '').trim();
      const name = rawName || (tenDigit ? `User ${tenDigit}` : `User ${u?.id || ''}`);

      // Determine session liveness & logout state
      const lastLoginTime = u?.lastLogin || (Array.isArray(u?.devices) && u.devices.length > 0 ? u.devices[0].lastLogin : null) || u?.loginTime || u?.createdAt || null;
      const lastLogoutTime = u?.lastLogout || null;

      const loginMs = lastLoginTime ? new Date(lastLoginTime).getTime() : 0;
      const logoutMs = lastLogoutTime ? new Date(lastLogoutTime).getTime() : 0;
      const isLoggedOutByTimestamp = logoutMs > 0 && loginMs > 0 && logoutMs >= loginMs;

      const isExplicitlyLoggedOut = u?.sessionStatus === 'logged_out' || u?.isLoggedIn === false || isLoggedOutByTimestamp;
      const isCurrentlyActive = (u?.sessionStatus === 'active' || u?.isLoggedIn === true) && !isExplicitlyLoggedOut;

      const sessionStatus: 'active' | 'logged_out' = isCurrentlyActive ? 'active' : 'logged_out';
      const isLoggedIn = isCurrentlyActive;

      let devices: any[] = [];
      if (isCurrentlyActive && Array.isArray(u?.devices) && u.devices.length > 0) {
        devices = u.devices;
      } else if (isCurrentlyActive) {
        devices = [
          {
            deviceId: `android_${tenDigit || u?.id}`,
            platform: 'android',
            deviceName: 'Android Mobile App',
            lastLogin: lastLoginTime || new Date().toISOString(),
            isLoggedIn: true,
          }
        ];
      }

      let lastLogout = u?.lastLogout || null;
      if (!isCurrentlyActive && !lastLogout) {
        lastLogout = lastLoginTime || u?.createdAt || new Date().toISOString();
      } else if (isCurrentlyActive) {
        lastLogout = null;
      }

      return {
        ...u,
        id: u?.id || (tenDigit ? `user_${tenDigit}` : `user_${Date.now()}`),
        phone: formattedPhone,
        name: name,
        subscriptionStatus: u?.subscriptionStatus || u?.status || 'active',
        planName: u?.planName || (u?.subscriptionStatus === 'active' ? 'VIP Annual Pass' : 'Standard Access'),
        devices: devices,
        watchlist: Array.isArray(u?.watchlist) ? u.watchlist : [],
        continueWatching: u?.continueWatching && typeof u.continueWatching === 'object' ? u.continueWatching : {},
        isLoggedIn: isLoggedIn,
        sessionStatus: sessionStatus,
        lastLogin: lastLoginTime || new Date().toISOString(),
        loginTime: u?.loginTime || lastLoginTime || new Date().toISOString(),
        lastLogout: lastLogout || undefined,
      };
    };

    const isDummyUser = (u: any) => {
      const idStr = String(u?.id || '');
      if (idStr.startsWith('app_') || idStr.startsWith('perm_') || idStr.startsWith('user_admin')) return true;
      return (
        u?.id === 'usr-003' ||
        String(u?.phone || '').includes('7700 900123') ||
        u?.name === 'Liam Gallagher' ||
        String(u?.email || '').includes('ukmail.co.uk')
      );
    };

    const deduplicateUsers = (userList: User[]): User[] => {
      const map = new Map<string, User>();
      for (const u of userList) {
        const digits = u.phone.replace(/\D/g, '');
        const key = digits.length >= 10 ? digits.slice(-10) : u.id;
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

          const merged: User = {
            ...secondary,
            ...primary,
            id: `user_${key}`,
            phone: `+91 ${key}`,
            name: pickName,
            sessionStatus: isLoggedOut ? 'logged_out' : 'active',
            isLoggedIn: !isLoggedOut,
            devices: isLoggedOut ? [] : ((primary.devices && primary.devices.length > 0) ? primary.devices : secondary.devices),
            lastLogin: primary.lastLogin || secondary.lastLogin,
            lastLogout: isLoggedOut ? (primary.lastLogout || secondary.lastLogout || primary.lastLogin) : undefined,
          };
          map.set(key, merged);
        }
      }

      const raw = Array.from(map.values());
      // SINGLE ACTIVE USER POLICY: Whichever user is active and logged in most recently, ONLY that user is active
      const activeCandidates = raw.filter(u => u.isLoggedIn && u.sessionStatus === 'active');
      const singleActive = activeCandidates.length > 0
        ? activeCandidates.sort((a, b) => new Date(b.lastLogin || b.createdAt || 0).getTime() - new Date(a.lastLogin || a.createdAt || 0).getTime())[0]
        : null;

      return raw.map(u => {
        const uDigits = u.phone.replace(/\D/g, '').slice(-10);
        const activeDigits = singleActive ? singleActive.phone.replace(/\D/g, '').slice(-10) : '';
        const isTargetActive = singleActive && (u.id === singleActive.id || (uDigits && uDigits === activeDigits));

        if (isTargetActive) {
          return {
            ...u,
            isLoggedIn: true,
            sessionStatus: 'active' as const,
            devices: (u.devices && u.devices.length > 0) ? u.devices : [
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
            isLoggedIn: false,
            sessionStatus: 'logged_out' as const,
            devices: [],
            lastLogout: u.lastLogout || u.lastLogin || u.createdAt,
          };
        }
      });
    };

    // 1. Try server API route which reads directly with Admin authority
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/users', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.users)) {
            const cleanList = deduplicateUsers(data.users.filter((u: any) => !isDummyUser(u)).map(normalizeUser));
            setLocalStore(STORAGE_KEYS.USERS, cleanList);
            return cleanList;
          }
        }
      } catch (e) {
        console.warn('API getUsers fallback:', e);
      }
    }

    // 2. Direct Firestore SDK read
    if (this.useLive && db) {
      try {
        const snap = await timeoutPromise(getDocs(collection(db, 'users')), 2000);
        const list = snap.docs
          .map(d => normalizeUser({ id: d.id, ...d.data() }))
          .filter(u => !isDummyUser(u));
        const deduplicated = deduplicateUsers(list);
        setLocalStore(STORAGE_KEYS.USERS, deduplicated);
        return deduplicated;
      } catch (e) {
        console.warn('Firestore getUsers fallback:', e);
      }
    }

    const raw = getLocalStore<User[]>(STORAGE_KEYS.USERS, []);
    return deduplicateUsers((raw || []).filter(u => !isDummyUser(u)).map(normalizeUser));
  }

  async deleteUser(id: string): Promise<void> {
    const all = await this.getUsers();
    const updated = all.filter(u => u.id !== id);
    setLocalStore(STORAGE_KEYS.USERS, updated);

    // Call server DELETE API
    if (typeof window !== 'undefined') {
      fetch(`/api/users?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    }

    if (this.useLive && db) {
      timeoutPromise(deleteDoc(doc(db, 'users', id)), 3000)
        .catch(e => console.warn('Background Firestore deleteUser notice:', e));
    }
  }

  async logoutUser(phoneOrId: string): Promise<void> {
    const digits = phoneOrId.replace(/\D/g, '');
    const cleanPhone = digits.length >= 10 ? digits.slice(-10) : phoneOrId;
    const userId = `user_${cleanPhone}`;

    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: userId,
            phone: cleanPhone,
            action: 'logout',
            sessionStatus: 'logged_out',
          }),
        });
      } catch (e) {
        console.warn('logoutUser API notice:', e);
      }
    }

    if (this.useLive && db) {
      try {
        await setDoc(doc(db, 'users', userId), {
          isLoggedIn: false,
          sessionStatus: 'logged_out',
          lastLogout: new Date().toISOString(),
          devices: [],
        }, { merge: true });
      } catch (e) {
        console.warn('logoutUser Firestore notice:', e);
      }
    }

    // Update local store
    const all = getLocalStore<User[]>(STORAGE_KEYS.USERS, []);
    const updated = all.map(u => {
      const uDigits = u.phone.replace(/\D/g, '').slice(-10);
      if ((cleanPhone && uDigits === cleanPhone) || u.id === userId) {
        return {
          ...u,
          isLoggedIn: false,
          sessionStatus: 'logged_out' as const,
          lastLogout: new Date().toISOString(),
          devices: [],
        };
      }
      return u;
    });
    setLocalStore(STORAGE_KEYS.USERS, updated);
  }

  async activateUser(phoneOrId: string): Promise<void> {
    const digits = phoneOrId.replace(/\D/g, '');
    const cleanPhone = digits.length >= 10 ? digits.slice(-10) : phoneOrId;
    const userId = `user_${cleanPhone}`;
    const nowIso = new Date().toISOString();

    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: userId,
            phone: cleanPhone,
            action: 'activate',
            sessionStatus: 'active',
            isLoggedIn: true,
          }),
        });
      } catch (e) {
        console.warn('activateUser API notice:', e);
      }
    }

    if (this.useLive && db) {
      try {
        // Activate target user in client Firestore
        await setDoc(doc(db, 'users', userId), {
          isLoggedIn: true,
          sessionStatus: 'active',
          lastLogin: nowIso,
          devices: [
            {
              deviceId: `android_${cleanPhone}`,
              deviceName: 'Android Mobile App',
              platform: 'android',
              lastLogin: nowIso,
              isLoggedIn: true,
            }
          ],
        }, { merge: true });

        // Deactivate other users in Firestore
        const snap = await getDocs(collection(db, 'users'));
        for (const d of snap.docs) {
          if (d.id !== userId && !d.id.startsWith('app_') && !d.id.startsWith('perm_') && !d.id.startsWith('user_admin')) {
            const data = d.data();
            if (data.isLoggedIn === true || data.sessionStatus === 'active') {
              setDoc(d.ref, {
                isLoggedIn: false,
                sessionStatus: 'logged_out',
                devices: [],
                lastLogout: nowIso,
              }, { merge: true }).catch(() => {});
            }
          }
        }
      } catch (e) {
        console.warn('activateUser Firestore notice:', e);
      }
    }

    // Update local store: only cleanPhone is active, all others are logged out
    const all = getLocalStore<User[]>(STORAGE_KEYS.USERS, []);
    const updated = all.map(u => {
      const uDigits = u.phone.replace(/\D/g, '').slice(-10);
      if ((cleanPhone && uDigits === cleanPhone) || u.id === userId) {
        return {
          ...u,
          isLoggedIn: true,
          sessionStatus: 'active' as const,
          devices: [
            {
              deviceId: `android_${cleanPhone}`,
              platform: 'android',
              deviceName: 'Android Mobile App',
              lastLogin: nowIso,
              isLoggedIn: true,
            }
          ],
          lastLogin: nowIso,
          lastLogout: undefined,
        };
      }
      return {
        ...u,
        isLoggedIn: false,
        sessionStatus: 'logged_out' as const,
        devices: [],
        lastLogout: u.lastLogout || nowIso,
      };
    });
    setLocalStore(STORAGE_KEYS.USERS, updated);
  }

  async updateUser(user: User): Promise<User> {
    const all = getLocalStore<User[]>(STORAGE_KEYS.USERS, []);
    const index = all.findIndex(u => u.id === user.id);
    let updated: User[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = user;
    } else {
      updated = [user, ...all];
    }
    setLocalStore(STORAGE_KEYS.USERS, updated);

    if (typeof window !== 'undefined') {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      }).catch(() => {});
    }

    if (this.useLive && db) {
      timeoutPromise(setDoc(doc(db, 'users', user.id), user), 3000)
        .catch(e => console.warn('Background Firestore updateUser notice:', e));
    }

    return user;
  }

  async getSubscriptions(): Promise<Subscription[]> {
    if (this.useLive && db) {
      try {
        const snap = await timeoutPromise(getDocs(collection(db, 'subscriptions')), 6000);
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Subscription));
          setLocalStore(STORAGE_KEYS.SUBSCRIPTIONS, list);
          return list;
        }
      } catch (e) {
        // Silently use local store fallback without noisy error
      }
    }
    return getLocalStore<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, initialSubscriptions);
  }

  /* ------------------- HERO BANNERS ------------------- */
  async getBanners(): Promise<Banner[]> {
    const deletedIds = getLocalDeletedIds();
    const filterDeleted = (list: Banner[]) => list.filter(b => !deletedIds.includes(b.id));

    if (typeof window !== 'undefined') {
      try {
        const res = await timeoutPromise(fetch('/api/banners'), 1500);
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            const clean = filterDeleted(json.data);
            setLocalStore(STORAGE_KEYS.BANNERS, clean);
            return clean.sort((a, b) => a.order - b.order);
          }
        }
      } catch (e) {
        // fallback
      }
    }

    if (this.useLive && db) {
      try {
        const snap = await timeoutPromise(getDocs(collection(db, 'banners')), 2000);
        if (!snap.empty) {
          const list = filterDeleted(snap.docs.map(d => ({ id: d.id, ...d.data() } as Banner)));
          setLocalStore(STORAGE_KEYS.BANNERS, list);
          return list.sort((a, b) => a.order - b.order);
        }
      } catch (e) {
        console.warn('Firestore getBanners fallback:', e);
      }
    }
    const all = filterDeleted(getLocalStore<Banner[]>(STORAGE_KEYS.BANNERS, initialBanners));
    return all.sort((a, b) => a.order - b.order);
  }

  async saveBanner(banner: Banner): Promise<Banner> {
    const deletedIds = getLocalDeletedIds();
    if (deletedIds.includes(banner.id)) {
      setLocalStore(STORAGE_KEYS.DELETED_CONTENT, deletedIds.filter(id => id !== banner.id));
    }

    const all = getLocalStore<Banner[]>(STORAGE_KEYS.BANNERS, initialBanners);
    const index = all.findIndex(b => b.id === banner.id);
    let updated: Banner[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = banner;
    } else {
      updated = [...all, banner];
    }
    setLocalStore(STORAGE_KEYS.BANNERS, updated);

    if (typeof window !== 'undefined') {
      fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(banner),
      }).catch(e => console.warn('API saveBanner notice:', e));
    }

    if (this.useLive && db) {
      timeoutPromise(setDoc(doc(db, 'banners', banner.id), cleanForFirestore(banner)), 3000)
        .catch(e => console.warn('Background Firestore saveBanner notice:', e));
    }

    return banner;
  }

  async deleteBanner(id: string): Promise<void> {
    addLocalDeletedId(id);

    const all = getLocalStore<Banner[]>(STORAGE_KEYS.BANNERS, initialBanners);
    setLocalStore(STORAGE_KEYS.BANNERS, all.filter(b => b.id !== id));

    if (typeof window !== 'undefined') {
      fetch(`/api/banners?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    }

    if (this.useLive && db) {
      timeoutPromise(deleteDoc(doc(db, 'banners', id)), 3000)
        .catch(e => console.warn('Background Firestore deleteBanner notice:', e));
    }
  }

  /* ------------------- ADMINS & RBAC (Section 31) ------------------- */
  async getAdmins(): Promise<AdminUser[]> {
    let list: AdminUser[] = [];
    if (this.useLive && db) {
      try {
        const snap = await timeoutPromise(getDocs(collection(db, 'admins')), 2000);
        if (!snap.empty) {
          list = snap.docs.map(d => ({ uid: d.id, ...d.data() } as AdminUser));
        }
      } catch (e) {
        console.warn('Firestore getAdmins fallback:', e);
      }
    }

    if (list.length === 0) {
      list = getLocalStore<AdminUser[]>(STORAGE_KEYS.ADMINS, initialAdmins);
    }

    // Ensure all roles from initialAdmins are represented so user can see who has access to what
    const merged = [...list];
    for (const init of initialAdmins) {
      if (!merged.some(m => m.uid === init.uid || m.email.toLowerCase() === init.email.toLowerCase())) {
        merged.push(init);
      }
    }
    setLocalStore(STORAGE_KEYS.ADMINS, merged);
    return merged;
  }

  async saveAdmin(adminUser: AdminUser): Promise<AdminUser> {
    const all = getLocalStore<AdminUser[]>(STORAGE_KEYS.ADMINS, initialAdmins);
    const index = all.findIndex(a => a.uid === adminUser.uid);
    let updated: AdminUser[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = adminUser;
    } else {
      updated = [...all, adminUser];
    }
    setLocalStore(STORAGE_KEYS.ADMINS, updated);

    if (this.useLive && db) {
      timeoutPromise(setDoc(doc(db, 'admins', adminUser.uid), cleanForFirestore(adminUser)), 3000)
        .catch(e => console.warn('Background Firestore saveAdmin notice:', e));
    }

    return adminUser;
  }

  async deleteAdmin(uid: string): Promise<void> {
    const all = getLocalStore<AdminUser[]>(STORAGE_KEYS.ADMINS, initialAdmins);
    setLocalStore(STORAGE_KEYS.ADMINS, all.filter(a => a.uid !== uid));

    if (this.useLive && db) {
      timeoutPromise(deleteDoc(doc(db, 'admins', uid)), 3000)
        .catch(e => console.warn('Background Firestore deleteAdmin notice:', e));
    }
  }

  /* ------------------- BUNNY CONFIG ------------------- */
  async getBunnyConfig(): Promise<BunnyConfig> {
    return getLocalStore<BunnyConfig>(STORAGE_KEYS.BUNNY, initialBunnyConfig);
  }

  async saveBunnyConfig(config: BunnyConfig): Promise<BunnyConfig> {
    setLocalStore(STORAGE_KEYS.BUNNY, config);
    return config;
  }

  /* ------------------- COMPANY & PORTAL INFO ------------------- */
  async getCompanyInfo(): Promise<CompanyInfo> {
    if (this.useLive && db) {
      try {
        const snap = await timeoutPromise(getDoc(doc(db, 'settings', 'companyInfo')), 3000);
        if (snap && snap.exists()) {
          const remote = snap.data() as CompanyInfo;
          setLocalStore(STORAGE_KEYS.COMPANY_INFO, remote);
          return remote;
        }
      } catch (e) {
        console.warn('Firestore getCompanyInfo fallback:', e);
      }
    }
    if (typeof window !== 'undefined') {
      try {
        const res = await timeoutPromise(fetch('/api/company'), 1500);
        if (res.ok) {
          const comp = await res.json();
          if (comp.data && comp.data.name) {
            setLocalStore(STORAGE_KEYS.COMPANY_INFO, comp.data);
            return comp.data;
          }
        }
      } catch {}
    }
    return getLocalStore<CompanyInfo>(STORAGE_KEYS.COMPANY_INFO, initialCompanyInfo);
  }

  async updateCompanyInfo(data: Partial<CompanyInfo>): Promise<CompanyInfo> {
    const current = await this.getCompanyInfo();
    const updated: CompanyInfo = { ...current, ...data };
    setLocalStore(STORAGE_KEYS.COMPANY_INFO, updated);

    if (typeof window !== 'undefined') {
      fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(e => console.warn('Server company sync error:', e));

      try {
        window.dispatchEvent(new CustomEvent('ott_company_updated', { detail: updated }));
      } catch {}
    }

    if (this.useLive && db) {
      timeoutPromise(setDoc(doc(db, 'settings', 'companyInfo'), cleanForFirestore(updated), { merge: true }), 3000)
        .catch(e => console.warn('Background Firestore updateCompanyInfo notice:', e));
    }
    return updated;
  }


  /* ------------------- GRIEVANCES ("जनतेचा आवाज" - Section 29) ------------------- */
  async getGrievances(): Promise<Grievance[]> {
    if (typeof window !== 'undefined') {
      try {
        const res = await timeoutPromise(fetch('/api/grievances', { cache: 'no-store' }), 3000);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setLocalStore(STORAGE_KEYS.GRIEVANCES, json.data);
            return json.data;
          }
        }
      } catch (e) {
        console.warn('API getGrievances fallback:', e);
      }
    }

    if (this.useLive && db) {
      try {
        const snap = await timeoutPromise(getDocs(collection(db, 'grievances')), 3000);
        if (!snap.empty) {
          const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as Grievance));
          setLocalStore(STORAGE_KEYS.GRIEVANCES, remote);
          return remote;
        }
      } catch (e) {
        console.warn('Firestore getGrievances fallback:', e);
      }
    }
    return getLocalStore<Grievance[]>(STORAGE_KEYS.GRIEVANCES, initialGrievances);
  }

  async updateGrievanceStatus(id: string, status: 'pending' | 'verified' | 'published' | 'resolved', adminNotes?: string): Promise<void> {
    const list = await this.getGrievances();
    const idx = list.findIndex(g => g.id === id);
    if (idx >= 0) {
      list[idx].status = status;
      if (adminNotes) list[idx].adminNotes = adminNotes;
      setLocalStore(STORAGE_KEYS.GRIEVANCES, list);
    }

    if (typeof window !== 'undefined') {
      fetch('/api/grievances', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, adminNotes }),
      }).catch(e => console.warn('API updateGrievanceStatus notice:', e));
    }

    if (this.useLive && db) {
      timeoutPromise(updateDoc(doc(db, 'grievances', id), { status, ...(adminNotes ? { adminNotes } : {}) }), 3000)
        .catch(e => console.warn('Background Firestore updateGrievanceStatus notice:', e));
    }
  }

  async deleteGrievance(id: string): Promise<void> {
    addLocalDeletedId(id);
    const list = await this.getGrievances();
    setLocalStore(STORAGE_KEYS.GRIEVANCES, list.filter(g => g.id !== id));

    if (typeof window !== 'undefined') {
      fetch(`/api/grievances?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    }

    if (this.useLive && db) {
      timeoutPromise(deleteDoc(doc(db, 'grievances', id)), 3000)
        .catch(e => console.warn('Background Firestore deleteGrievance notice:', e));
    }
  }

  async saveGrievance(grievance: Grievance): Promise<void> {
    const list = await this.getGrievances();
    const idx = list.findIndex(g => g.id === grievance.id);
    if (idx >= 0) {
      list[idx] = grievance;
    } else {
      list.unshift(grievance);
    }
    setLocalStore(STORAGE_KEYS.GRIEVANCES, list);

    if (typeof window !== 'undefined') {
      fetch('/api/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grievance),
      }).then(() => {
        window.dispatchEvent(new CustomEvent('ott_grievance_created', { detail: grievance }));
        window.dispatchEvent(new CustomEvent('ott_notification_created'));
      }).catch(e => console.warn('API saveGrievance notice:', e));
    }

    if (this.useLive && db) {
      timeoutPromise(setDoc(doc(db, 'grievances', grievance.id), cleanForFirestore(grievance)), 3000)
        .catch(e => console.warn('Background Firestore saveGrievance notice:', e));
    }
  }


  /* Notifications (Section 23) */
  async getNotifications(): Promise<NotificationItem[]> {
    const deletedIds = getLocalDeletedIds();
    const filterDeleted = (list: NotificationItem[]) => list.filter(n => !deletedIds.includes(n.id) && !n.id.startsWith('notif-demo'));

    if (typeof window !== 'undefined') {
      try {
        const res = await timeoutPromise(fetch('/api/notifications', { cache: 'no-store' }), 7000);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.data)) {
            const list = filterDeleted(data.data);
            setLocalStore(STORAGE_KEYS.NOTIFICATIONS, list);
            return list;
          }
        }
      } catch (e) {
        // Silently use local store without noisy error
      }
    }

    const rawLocal = getLocalStore<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const local = filterDeleted(rawLocal || []);
    if (!this.useLive || !db) return local;

    try {
      const snap = await timeoutPromise(getDocs(collection(db, 'notifications')), 2500);
      if (snap && !snap.empty) {
        const remote = filterDeleted(snap.docs.map(d => ({ ...d.data(), id: d.id } as NotificationItem)));
        setLocalStore(STORAGE_KEYS.NOTIFICATIONS, remote);
        return remote;
      }
    } catch {}
    return local;
  }

  async sendNotification(item: NotificationItem): Promise<void> {
    const cleanItem: NotificationItem = {
      id: item.id,
      title: item.title || '',
      message: item.message || '',
      category: item.category || 'breaking_news',
      targetType: item.targetType || 'all',
      targetValue: item.targetValue || '',
      deepLinkUrl: item.deepLinkUrl || '',
      sentAt: item.sentAt || new Date().toISOString(),
      sentBy: item.sentBy || 'Super Admin',
      status: item.status || 'sent',
      recipientsCount: typeof item.recipientsCount === 'number' ? item.recipientsCount : 1,
    };

    const list = await this.getNotifications();
    const updated = [cleanItem, ...list.filter(n => n.id !== cleanItem.id)];
    setLocalStore(STORAGE_KEYS.NOTIFICATIONS, updated);

    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanItem),
        });
        window.dispatchEvent(new CustomEvent('ott_notification_created', { detail: cleanItem }));
      } catch (e) {
        console.warn('Server API sendNotification notice:', e);
      }
    }

    if (this.useLive && db) {
      try {
        timeoutPromise(setDoc(doc(db, 'notifications', cleanItem.id), cleanForFirestore(cleanItem)), 3000)
          .catch(e => console.warn('Background Firestore sendNotification notice:', e));
      } catch (e) {
        console.warn('Direct Firestore sendNotification notice:', e);
      }
    }
  }

  async deleteNotification(id: string): Promise<void> {
    addLocalDeletedId(id);
    const list = await this.getNotifications();
    setLocalStore(STORAGE_KEYS.NOTIFICATIONS, list.filter(n => n.id !== id));

    if (typeof window !== 'undefined') {
      fetch(`/api/notifications?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    }

    if (this.useLive && db) {
      try {
        timeoutPromise(deleteDoc(doc(db, 'notifications', id)), 3000)
          .catch(e => console.warn('Background Firestore deleteNotification notice:', e));
      } catch (e) {
        console.warn('Direct Firestore deleteNotification notice:', e);
      }
    }
  }

  async clearAllNotifications(): Promise<void> {
    const list = await this.getNotifications();
    for (const item of list) {
      addLocalDeletedId(item.id);
    }
    setLocalStore(STORAGE_KEYS.NOTIFICATIONS, []);

    if (typeof window !== 'undefined') {
      for (const item of list) {
        fetch(`/api/notifications?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' }).catch(() => {});
      }
    }

    if (this.useLive && db) {
      try {
        for (const item of list) {
          deleteDoc(doc(db, 'notifications', item.id)).catch(() => {});
        }
      } catch (e) {
        console.warn('Direct Firestore clearAllNotifications notice:', e);
      }
    }
  }

  /* Dynamic Categories (Section 1 & 6) */
  async getCategories(): Promise<ContentCategory[]> {
    const deletedIds = getLocalDeletedIds();
    const filterDeleted = (list: ContentCategory[]) => list.filter(c => !deletedIds.includes(c.id));
    const local = filterDeleted(getLocalStore<ContentCategory[]>(STORAGE_KEYS.CATEGORIES, initialCategories));

    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/categories');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const clean = filterDeleted(json.data);
          setLocalStore(STORAGE_KEYS.CATEGORIES, clean);
          return clean;
        }
      } catch (e) {
        // Fallback to Firestore / local
      }
    }

    if (!this.useLive || !db) return local;

    try {
      const snap = await timeoutPromise(getDocs(collection(db, 'categories')), 2500);
      if (snap && !snap.empty) {
        const remote = filterDeleted(snap.docs.map(d => ({ ...d.data(), id: d.id } as ContentCategory)));
        setLocalStore(STORAGE_KEYS.CATEGORIES, remote);
        return remote;
      }
    } catch {}
    return local;
  }

  async saveCategory(cat: ContentCategory): Promise<void> {
    const deletedIds = getLocalDeletedIds();
    if (deletedIds.includes(cat.id)) {
      setLocalStore(STORAGE_KEYS.DELETED_CONTENT, deletedIds.filter(id => id !== cat.id));
    }

    const list = await this.getCategories();
    const idx = list.findIndex(c => c.id === cat.id);
    const updated = idx >= 0 ? list.map(c => c.id === cat.id ? cat : c) : [...list, cat];
    setLocalStore(STORAGE_KEYS.CATEGORIES, updated);

    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cat),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn('API /api/categories returned non-ok:', res.status, errData);
        }
      } catch (e) {
        console.warn('Background API categories save notice:', e);
      }
    }

    if (this.useLive && db) {
      try {
        await timeoutPromise(setDoc(doc(db, 'categories', cat.id), cleanForFirestore(cat)), 3000);
      } catch (e) {
        console.warn('Background Firestore saveCategory notice:', e);
      }
    }
  }

  async deleteCategory(id: string): Promise<void> {
    addLocalDeletedId(id);
    const list = await this.getCategories();
    setLocalStore(STORAGE_KEYS.CATEGORIES, list.filter(c => c.id !== id));

    if (typeof window !== 'undefined') {
      try {
        await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      } catch (e) {
        console.warn('Background API categories delete notice:', e);
      }
    }

    if (this.useLive && db) {
      timeoutPromise(deleteDoc(doc(db, 'categories', id)), 3000)
        .catch(e => console.warn('Background Firestore deleteCategory notice:', e));
    }
  }

  /* Seed sample client catalog to Live Firestore */
  async seedLiveFirestore(): Promise<{ success: boolean; message: string }> {
    if (!this.useLive || !db) {
      return { success: false, message: 'Firestore is not connected or in demo cache mode.' };
    }

    try {
      // Content (Movies, Series, News)
      for (const item of initialContent) {
        await setDoc(doc(db, 'content', item.id), item);
      }
      // Live Channels
      for (const ch of initialLiveChannels) {
        await setDoc(doc(db, 'liveChannels', ch.id), ch);
      }
      // Ads
      for (const ad of initialAds) {
        await setDoc(doc(db, 'advertisements', ad.id), ad);
      }
      // Grievances
      for (const grv of initialGrievances) {
        await setDoc(doc(db, 'grievances', grv.id), grv);
      }
      // Plans
      for (const pl of initialPlans) {
        await setDoc(doc(db, 'plans', pl.id), pl);
      }
      // Banners
      for (const bn of initialBanners) {
        await setDoc(doc(db, 'banners', bn.id), bn);
      }
      return { success: true, message: '✅ Sample catalog successfully synced to live Firestore collections!' };
    } catch (e: any) {
      console.error('seedLiveFirestore error:', e);
      return { success: false, message: `Failed to seed Firestore: ${e.message}` };
    }
  }

  /* Reset Demo Store */
  resetDemoData(): void {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach(k => {
      delete memCache[k];
      try { localStorage.removeItem(k); } catch {}
    });
    try { 
      localStorage.clear();
    } catch {}
  }
}

export const firestoreService = new FirestoreService();

// Trigger automatic background synchronization of client-side cached data to Cloud Firestore
if (typeof window !== 'undefined') {
  setTimeout(() => {
    try {
      const deletedIds = getLocalDeletedIds();
      const content = getLocalStore<ContentItem[]>(STORAGE_KEYS.CONTENT, []).filter(c => !deletedIds.includes(c.id));
      const seasons = getLocalStore<Season[]>(STORAGE_KEYS.SEASONS, []).filter(s => !deletedIds.includes(s.id));
      const episodes = getLocalStore<Episode[]>(STORAGE_KEYS.EPISODES, []).filter(e => !deletedIds.includes(e.id));
      const liveChannels = getLocalStore<LiveChannel[]>(STORAGE_KEYS.LIVE_CHANNELS, []).filter(l => !deletedIds.includes(l.id));
      const banners = getLocalStore<Banner[]>(STORAGE_KEYS.BANNERS, []).filter(b => !deletedIds.includes(b.id));
      
      if (content.length > 0 || seasons.length > 0 || episodes.length > 0 || liveChannels.length > 0) {
        fetch('/api/sync-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, seasons, episodes, liveChannels, banners, deletedIds })
        }).then(r => r.json()).then(res => {
          console.log('Automated Cloud Firestore sync complete:', res);
        }).catch(err => {
          console.warn('Auto sync warning:', err);
        });
      }
    } catch {}
  }, 1200);
}
