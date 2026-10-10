import fs from 'fs';
import path from 'path';
import { 
  ContentItem, 
  LiveChannel, 
  Banner, 
  Plan, 
  Advertisement, 
  CompanyInfo, 
  ContentCategory,
  Season,
  Episode,
  Grievance,
  NotificationItem
} from './types';
import { 
  initialCompanyInfo, 
  initialCategories, 
  initialLiveChannels, 
  initialPlans, 
  initialBanners,
  initialSeasons,
  initialEpisodes,
  initialGrievances,
  initialNotifications,
  initialAds
} from './mock-data';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'server-store.json');

export interface ServerStoreSchema {
  content: ContentItem[];
  seasons: Season[];
  episodes: Episode[];
  liveChannels: LiveChannel[];
  banners: Banner[];
  plans: Plan[];
  ads: Advertisement[];
  categories: ContentCategory[];
  companyInfo: CompanyInfo;
  grievances: Grievance[];
  notifications: NotificationItem[];
  deletedIds?: string[];
  updatedAt: string;
}

function getInitialStore(): ServerStoreSchema {
  return {
    content: [],
    seasons: [],
    episodes: [],
    liveChannels: [],
    banners: [],
    plans: [],
    ads: [],
    categories: initialCategories,
    companyInfo: initialCompanyInfo,
    grievances: initialGrievances,
    notifications: initialNotifications,
    deletedIds: [],
    updatedAt: new Date().toISOString(),
  };
}

function ensureDataFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      const initial = getInitialStore();
      fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn('ensureDataFile notice:', e);
  }
}

export function readServerStore(): ServerStoreSchema {
  try {
    ensureDataFile();
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return {
        ...getInitialStore(),
        ...data,
        seasons: data.seasons || [],
        episodes: data.episodes || [],
        grievances: data.grievances || initialGrievances,
        notifications: data.notifications || initialNotifications,
        deletedIds: Array.isArray(data.deletedIds) ? data.deletedIds : [],
      };
    }
  } catch (e) {
    console.error('readServerStore error:', e);
  }
  return getInitialStore();
}

export function writeServerStore(data: Partial<ServerStoreSchema>): ServerStoreSchema {
  try {
    ensureDataFile();
    const current = readServerStore();
    const updated: ServerStoreSchema = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (e) {
    console.error('writeServerStore error:', e);
    return readServerStore();
  }
}

/* ------------------- DELETED ITEMS REGISTRY ------------------- */
export function getServerDeletedIds(): string[] {
  const store = readServerStore();
  return Array.isArray(store.deletedIds) ? store.deletedIds : [];
}

export function recordServerDeletedId(id: string): void {
  if (!id) return;
  const store = readServerStore();
  const current = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  if (!current.includes(id)) {
    writeServerStore({ deletedIds: [...current, id] });
  }
}

export function isServerDeletedId(id: string): boolean {
  if (!id) return false;
  const store = readServerStore();
  return Array.isArray(store.deletedIds) && store.deletedIds.includes(id);
}

/* Content Helpers */
export function getServerContent(type?: string): ContentItem[] {
  const store = readServerStore();
  const deletedIds = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  let list = (store.content || []).filter(c => !deletedIds.includes(c.id));
  if (type) {
    return list.filter(c => c.type === type);
  }
  return list;
}

export function saveServerContent(item: ContentItem): ContentItem {
  const store = readServerStore();
  const list = [...store.content];
  const idx = list.findIndex(c => c.id === item.id);
  const now = new Date().toISOString();
  const toSave: ContentItem = {
    ...item,
    status: item.status || 'published', // ensure published so Android displays it
    updatedAt: now,
    createdAt: item.createdAt || now,
    poster: item.poster || item.posterUrl || '',
    posterUrl: item.posterUrl || item.poster || '',
    banner: item.banner || item.bannerUrl || '',
    bannerUrl: item.bannerUrl || item.banner || '',
  };

  if (idx >= 0) {
    list[idx] = toSave;
  } else {
    list.unshift(toSave);
  }

  // If item was previously in deletedIds, clear it upon explicit save
  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.filter(d => d !== item.id);

  writeServerStore({ content: list, deletedIds: updatedDeleted });
  return toSave;
}

export function deleteServerContent(id: string): void {
  const store = readServerStore();
  const list = store.content.filter(c => c.id !== id);
  const banners = (store.banners || []).filter(b => b.contentId !== id && b.id !== id);
  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.includes(id) ? currentDeleted : [...currentDeleted, id];
  writeServerStore({ content: list, banners, deletedIds: updatedDeleted });
}

export function incrementServerContentViews(id: string, amount: number = 1): number {
  const store = readServerStore();
  const list = [...store.content];
  const idx = list.findIndex(c => c.id === id || c.videoId === id);
  if (idx >= 0) {
    const current = Number(list[idx].views) || 0;
    list[idx].views = current + amount;
    list[idx].updatedAt = new Date().toISOString();
    writeServerStore({ content: list });
    return list[idx].views;
  }
  return 0;
}

/* Seasons Helpers */
export function getServerSeasons(seriesId?: string): Season[] {
  const store = readServerStore();
  const deletedIds = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  let list = (store.seasons || []).filter(s => !deletedIds.includes(s.id));
  if (seriesId) {
    return list.filter(s => s.seriesId === seriesId || (s as any).contentId === seriesId).sort((a, b) => a.seasonNumber - b.seasonNumber);
  }
  return list.sort((a, b) => a.seasonNumber - b.seasonNumber);
}

export function saveServerSeason(season: Season): Season {
  const store = readServerStore();
  const list = [...(store.seasons || [])];
  const idx = list.findIndex(s => s.id === season.id);
  const toSave: Season = {
    ...season,
    poster: season.poster || (season as any).posterUrl || '',
    posterUrl: (season as any).posterUrl || season.poster || '',
  } as Season;

  if (idx >= 0) {
    list[idx] = toSave;
  } else {
    list.push(toSave);
  }

  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.filter(d => d !== season.id);

  writeServerStore({ seasons: list, deletedIds: updatedDeleted });
  return toSave;
}

export function deleteServerSeason(id: string): void {
  const store = readServerStore();
  const list = (store.seasons || []).filter(s => s.id !== id);
  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.includes(id) ? currentDeleted : [...currentDeleted, id];
  writeServerStore({ seasons: list, deletedIds: updatedDeleted });
}

/* Episodes Helpers */
export function getServerEpisodes(seriesId?: string, seasonId?: string): Episode[] {
  const store = readServerStore();
  const deletedIds = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  let list = (store.episodes || []).filter(e => !deletedIds.includes(e.id));
  if (seriesId) {
    list = list.filter(e => e.seriesId === seriesId || (e as any).contentId === seriesId);
  }
  if (seasonId) {
    list = list.filter(e => e.seasonId === seasonId);
  }
  return list.sort((a, b) => a.episodeNumber - b.episodeNumber);
}

export function saveServerEpisode(episode: Episode): Episode {
  const store = readServerStore();
  const list = [...(store.episodes || [])];
  const idx = list.findIndex(e => e.id === episode.id);
  const toSave: Episode = {
    ...episode,
    thumbnail: episode.thumbnail || (episode as any).thumbnailUrl || '',
    thumbnailUrl: (episode as any).thumbnailUrl || episode.thumbnail || '',
  } as Episode;

  if (idx >= 0) {
    list[idx] = toSave;
  } else {
    list.push(toSave);
  }

  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.filter(d => d !== episode.id);

  writeServerStore({ episodes: list, deletedIds: updatedDeleted });
  return toSave;
}

export function deleteServerEpisode(id: string): void {
  const store = readServerStore();
  const list = (store.episodes || []).filter(e => e.id !== id);
  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.includes(id) ? currentDeleted : [...currentDeleted, id];
  writeServerStore({ episodes: list, deletedIds: updatedDeleted });
}

/* Company Info Helpers */
export function getServerCompanyInfo(): CompanyInfo {
  const store = readServerStore();
  return store.companyInfo || initialCompanyInfo;
}

export function saveServerCompanyInfo(info: Partial<CompanyInfo>): CompanyInfo {
  const store = readServerStore();
  const updated: CompanyInfo = {
    ...store.companyInfo,
    ...info,
  };
  writeServerStore({ companyInfo: updated });
  return updated;
}

/* Live Channels Helpers */
export function getServerLiveChannels(): LiveChannel[] {
  const store = readServerStore();
  const deletedIds = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const rawList = store.liveChannels && Array.isArray(store.liveChannels) ? store.liveChannels : initialLiveChannels;
  return rawList.filter(c => !deletedIds.includes(c.id));
}

export function saveServerLiveChannel(channel: LiveChannel): LiveChannel {
  const store = readServerStore();
  const list = [...(store.liveChannels && Array.isArray(store.liveChannels) ? store.liveChannels : initialLiveChannels)];
  const idx = list.findIndex(c => c.id === channel.id);
  const now = new Date().toISOString();
  const toSave: LiveChannel = {
    ...channel,
    updatedAt: now,
  };

  if (idx >= 0) {
    list[idx] = toSave;
  } else {
    list.unshift(toSave);
  }

  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.filter(d => d !== channel.id);

  writeServerStore({ liveChannels: list, deletedIds: updatedDeleted });
  return toSave;
}

export function deleteServerLiveChannel(id: string): void {
  const store = readServerStore();
  const rawList = store.liveChannels && Array.isArray(store.liveChannels) ? store.liveChannels : initialLiveChannels;
  const list = rawList.filter(c => c.id !== id);
  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.includes(id) ? currentDeleted : [...currentDeleted, id];
  writeServerStore({ liveChannels: list, deletedIds: updatedDeleted });
}

/* Banners Helpers */
export function getServerBanners(): Banner[] {
  const store = readServerStore();
  const deletedIds = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const rawList = store.banners && Array.isArray(store.banners) ? store.banners : initialBanners;
  return rawList
    .filter(b => !deletedIds.includes(b.id) && !deletedIds.includes(b.contentId))
    .sort((a, b) => a.order - b.order);
}

export function saveServerBanner(banner: Banner): Banner {
  const store = readServerStore();
  const list = [...(store.banners && Array.isArray(store.banners) ? store.banners : initialBanners)];
  const idx = list.findIndex(b => b.id === banner.id);
  if (idx >= 0) {
    list[idx] = banner;
  } else {
    list.push(banner);
  }

  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.filter(d => d !== banner.id && d !== banner.contentId);

  writeServerStore({ banners: list, deletedIds: updatedDeleted });
  return banner;
}

export function deleteServerBanner(id: string): void {
  const store = readServerStore();
  const rawList = store.banners && Array.isArray(store.banners) ? store.banners : initialBanners;
  const list = rawList.filter(b => b.id !== id);
  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.includes(id) ? currentDeleted : [...currentDeleted, id];
  writeServerStore({ banners: list, deletedIds: updatedDeleted });
}

/* Ads Helpers */
export function getServerAds(): Advertisement[] {
  const store = readServerStore();
  const deletedIds = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const rawList = store.ads && Array.isArray(store.ads) ? store.ads : initialAds;
  return rawList.filter(a => !deletedIds.includes(a.id));
}

export function saveServerAd(ad: Advertisement): Advertisement {
  const store = readServerStore();
  const list = [...(store.ads && Array.isArray(store.ads) ? store.ads : initialAds)];
  const idx = list.findIndex(a => a.id === ad.id);
  if (idx >= 0) {
    list[idx] = ad;
  } else {
    list.push(ad);
  }

  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.filter(d => d !== ad.id);

  writeServerStore({ ads: list, deletedIds: updatedDeleted });
  return ad;
}

export function deleteServerAd(id: string): void {
  const store = readServerStore();
  const rawList = store.ads && Array.isArray(store.ads) ? store.ads : initialAds;
  const list = rawList.filter(a => a.id !== id);
  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.includes(id) ? currentDeleted : [...currentDeleted, id];
  writeServerStore({ ads: list, deletedIds: updatedDeleted });
}

/* Categories Helpers */
export function getServerCategories(): ContentCategory[] {
  const store = readServerStore();
  const deletedIds = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const rawList = store.categories && Array.isArray(store.categories) ? store.categories : initialCategories;
  return rawList.filter(c => !deletedIds.includes(c.id));
}

export function saveServerCategory(cat: ContentCategory): ContentCategory {
  const store = readServerStore();
  const list = [...(store.categories && Array.isArray(store.categories) ? store.categories : initialCategories)];
  const idx = list.findIndex(c => c.id === cat.id);
  if (idx >= 0) {
    list[idx] = cat;
  } else {
    list.push(cat);
  }

  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.filter(d => d !== cat.id);

  writeServerStore({ categories: list, deletedIds: updatedDeleted });
  return cat;
}

export function deleteServerCategory(id: string): void {
  const store = readServerStore();
  const rawList = store.categories && Array.isArray(store.categories) ? store.categories : initialCategories;
  const list = rawList.filter(c => c.id !== id);
  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.includes(id) ? currentDeleted : [...currentDeleted, id];
  writeServerStore({ categories: list, deletedIds: updatedDeleted });
}

/* Subscription Plans (Synchronized with Mobile App & Web) */
export const defaultAppPlans: Plan[] = [
  {
    id: 'plan_mobile',
    name: 'Mobile Plan',
    slug: 'mobile-plan',
    price: 149,
    currency: '₹',
    durationDays: 30,
    billingCycle: 'monthly',
    resolution: 'Standard SD',
    maxDevices: 1,
    features: [
      'Stream on 1 Mobile/Tablet',
      'Standard SD quality',
      'Ad-supported feed',
    ],
    isPopular: false,
    active: true,
  },
  {
    id: 'plan_standard',
    name: 'Standard HD Plan',
    slug: 'standard-hd-plan',
    price: 299,
    currency: '₹',
    durationDays: 30,
    billingCycle: 'monthly',
    resolution: '1080p Full HD',
    maxDevices: 2,
    features: [
      'Stream on 2 Devices simultaneously',
      '1080p Full HD quality',
      'Ad-free streaming',
      'Offline downloads',
    ],
    isPopular: true,
    active: true,
  },
  {
    id: 'plan_premium',
    name: 'Premium Ultra HD',
    slug: 'premium-ultra-hd',
    price: 649,
    currency: '₹',
    durationDays: 30,
    billingCycle: 'monthly',
    resolution: '4K Ultra HD + HDR',
    maxDevices: 4,
    features: [
      'Stream on 4 Devices simultaneously',
      '4K Ultra HD + HDR quality',
      'Ad-free streaming',
      'Dolby Atmos Audio',
    ],
    isPopular: false,
    active: true,
  },
];

export function getServerPlans(): Plan[] {
  const store = readServerStore();
  const deletedIds = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const rawList = store.plans && Array.isArray(store.plans) ? store.plans : defaultAppPlans;
  return rawList.filter(p => !deletedIds.includes(p.id));
}

export function saveServerPlan(plan: Plan): Plan {
  const store = readServerStore();
  const list = [...(store.plans && Array.isArray(store.plans) ? store.plans : defaultAppPlans)];
  const idx = list.findIndex(p => p.id === plan.id);
  const toSave: Plan = {
    ...plan,
    price: Number(plan.price) || 0,
    currency: plan.currency || '₹',
    durationDays: Number(plan.durationDays) || 30,
    active: plan.active !== undefined ? plan.active : true,
  };

  if (idx >= 0) {
    list[idx] = toSave;
  } else {
    list.push(toSave);
  }

  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.filter(d => d !== plan.id);

  writeServerStore({ plans: list, deletedIds: updatedDeleted });
  return toSave;
}

export function deleteServerPlan(id: string): void {
  const store = readServerStore();
  const rawList = store.plans && Array.isArray(store.plans) ? store.plans : defaultAppPlans;
  const list = rawList.filter(p => p.id !== id);
  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.includes(id) ? currentDeleted : [...currentDeleted, id];
  writeServerStore({ plans: list, deletedIds: updatedDeleted });
}

// ----------------- Grievances ("जनतेचा आवाज") -----------------
export function getServerGrievances(): Grievance[] {
  const store = readServerStore();
  const deletedIds = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const list = store.grievances || initialGrievances;
  return list.filter(g => !deletedIds.includes(g.id));
}

export function saveServerGrievance(g: Grievance): Grievance {
  const store = readServerStore();
  const list = [...(store.grievances || initialGrievances)];
  const idx = list.findIndex(item => item.id === g.id);
  if (idx >= 0) {
    list[idx] = g;
  } else {
    list.unshift(g);
  }

  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.filter(d => d !== g.id);

  writeServerStore({ grievances: list, deletedIds: updatedDeleted });
  return g;
}

export function updateServerGrievanceStatus(
  id: string, 
  status: 'pending' | 'verified' | 'published' | 'resolved', 
  adminNotes?: string
): Grievance | null {
  const store = readServerStore();
  const list = [...(store.grievances || initialGrievances)];
  const idx = list.findIndex(item => item.id === id);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      status,
      ...(adminNotes ? { adminNotes } : {}),
    };
    writeServerStore({ grievances: list });
    return list[idx];
  }
  return null;
}

export function deleteServerGrievance(id: string): void {
  const store = readServerStore();
  const list = (store.grievances || initialGrievances).filter(item => item.id !== id);
  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.includes(id) ? currentDeleted : [...currentDeleted, id];
  writeServerStore({ grievances: list, deletedIds: updatedDeleted });
}

// ----------------- Notifications -----------------
export function getServerNotifications(): NotificationItem[] {
  const store = readServerStore();
  const deletedIds = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  return (store.notifications || initialNotifications)
    .filter(n => !n.id.startsWith('notif-demo') && !deletedIds.includes(n.id));
}

export function saveServerNotification(item: NotificationItem): NotificationItem {
  const store = readServerStore();
  const list = [...(store.notifications || initialNotifications).filter(n => !n.id.startsWith('notif-demo'))];
  const idx = list.findIndex(n => n.id === item.id);
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.unshift(item);
  }

  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.filter(d => d !== item.id);

  writeServerStore({ notifications: list, deletedIds: updatedDeleted });
  return item;
}

export function deleteServerNotification(id: string): void {
  const store = readServerStore();
  const list = (store.notifications || initialNotifications).filter(n => n.id !== id);
  const currentDeleted = Array.isArray(store.deletedIds) ? store.deletedIds : [];
  const updatedDeleted = currentDeleted.includes(id) ? currentDeleted : [...currentDeleted, id];
  writeServerStore({ notifications: list, deletedIds: updatedDeleted });
}

export function clearServerNotifications(): void {
  writeServerStore({ notifications: [] });
}

