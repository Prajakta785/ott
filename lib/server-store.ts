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
  Episode
} from './types';
import { 
  initialCompanyInfo, 
  initialCategories, 
  initialLiveChannels, 
  initialPlans, 
  initialBanners,
  initialSeasons,
  initialEpisodes
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

/* Content Helpers */
export function getServerContent(type?: string): ContentItem[] {
  const store = readServerStore();
  if (type) {
    return store.content.filter(c => c.type === type);
  }
  return store.content;
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

  writeServerStore({ content: list });
  return toSave;
}

export function deleteServerContent(id: string): void {
  const store = readServerStore();
  const list = store.content.filter(c => c.id !== id);
  writeServerStore({ content: list });
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
  const list = store.seasons || [];
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

  writeServerStore({ seasons: list });
  return toSave;
}

export function deleteServerSeason(id: string): void {
  const store = readServerStore();
  const list = (store.seasons || []).filter(s => s.id !== id);
  writeServerStore({ seasons: list });
}

/* Episodes Helpers */
export function getServerEpisodes(seriesId?: string, seasonId?: string): Episode[] {
  const store = readServerStore();
  let list = store.episodes || [];
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

  writeServerStore({ episodes: list });
  return toSave;
}

export function deleteServerEpisode(id: string): void {
  const store = readServerStore();
  const list = (store.episodes || []).filter(e => e.id !== id);
  writeServerStore({ episodes: list });
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
  if (store.liveChannels && Array.isArray(store.liveChannels) && store.liveChannels.length > 0) {
    return store.liveChannels;
  }
  return initialLiveChannels;
}

export function saveServerLiveChannel(channel: LiveChannel): LiveChannel {
  const store = readServerStore();
  const list = [...(store.liveChannels || initialLiveChannels)];
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

  writeServerStore({ liveChannels: list });
  return toSave;
}

export function deleteServerLiveChannel(id: string): void {
  const store = readServerStore();
  const list = (store.liveChannels || initialLiveChannels).filter(c => c.id !== id);
  writeServerStore({ liveChannels: list });
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
  if (store.plans && Array.isArray(store.plans) && store.plans.length > 0) {
    return store.plans;
  }
  return defaultAppPlans;
}

export function saveServerPlan(plan: Plan): Plan {
  const store = readServerStore();
  const list = [...(store.plans && store.plans.length > 0 ? store.plans : defaultAppPlans)];
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

  writeServerStore({ plans: list });
  return toSave;
}

export function deleteServerPlan(id: string): void {
  const store = readServerStore();
  const list = (store.plans || []).filter(p => p.id !== id);
  writeServerStore({ plans: list });
}
