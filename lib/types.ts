export type AdminRole = 
  | 'superadmin' 
  | 'news_editor'
  | 'content_manager'
  | 'video_manager'
  | 'reporter'
  | 'advertisement_manager'
  | 'finance_manager'
  | 'editor'
  | 'uploader';

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: AdminRole;
  photoUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

export type ContentType = 
  | 'movie' 
  | 'series' 
  | 'news' 
  | 'live' 
  | 'short_film'
  | 'live_event'
  | 'podcast'
  | 'audio'
  | 'elearning'
  | 'govt_program';
export type ContentStatus = 'draft' | 'published' | 'archived';

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  description: string;
  tags?: string[];
  genres: string[];
  cast: string[];
  director: string;
  language: string[];
  releaseDate: string;
  poster: string; // Bunny CDN URL
  banner: string; // Bunny CDN URL
  posterUrl?: string;
  bannerUrl?: string;
  trailerUrl?: string;
  isPremium?: boolean;
  price?: number;
  isFeatured: boolean;
  status: ContentStatus;
  rating: string; // e.g. "PG-13", "TV-MA", "18+", "U/A"
  imdbScore?: number;
  views: number;
  likes?: number;
  createdAt: string;
  updatedAt: string;

  // News / Regional Metadata (Section 10 & 11)
  reporterName?: string;
  district?: string;
  taluka?: string;
  village?: string;
  subCategory?: string;

  // Live Stream Metadata (Section 3)
  isLive?: boolean;
  liveChannelType?: 'gramin_bharat_live' | 'namdar_maharashtra_live' | 'custom_live';

  // Video Metadata
  videoId?: string; // Bunny Stream video GUID or Stream URL
  videoUrl?: string;
  hlsUrl?: string;
  embedUrl?: string;
  duration?: number; // duration in seconds
  durationMinutes?: number;
  videoStatus?: 'ready' | 'processing' | 'failed';
  resolution?: string; // "4K UHD", "1080p Full HD", "720p HD"

  // Client Requirement Extensions (Section 8, 23, 25, 26)
  producer?: string;
  audioLanguages?: string[];
  subtitleLanguages?: string[];
  subtitleUrl?: string;
  scheduledPublishDate?: string;
  isTrending?: boolean;

  // Future Expansion Architecture (Pay-per-view, Multi-channel, Audio, Events)
  isPayPerView?: boolean;
  payPerViewPrice?: number;
  // Podcast Metadata
  host?: string; // Host / Presenter for Podcast
  audioUrl?: string; // Audio URL / Bunny.net URL
  audioTrackUrl?: string;
  titleEn?: string;
  titleHi?: string;
  descEn?: string;
  descHi?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'breaking_news' | 'live_event' | 'new_movie' | 'new_episode' | 'special_program';
  targetType: 'all' | 'district' | 'plan';
  targetValue?: string;
  deepLinkUrl?: string;
  sentAt: string;
  sentBy: string;
  status: 'sent' | 'scheduled' | 'failed';
  recipientsCount: number;
}

export interface ContentCategory {
  id: string;
  nameMarathi: string;
  nameEnglish: string;
  nameHindi?: string;
  type: ContentType;
  subCategories: string[];
}

export interface LiveChannel {
  id: string;
  channelName: string;
  channelCode: 'gramin_bharat_live' | 'namdar_maharashtra_live' | 'custom_live';
  streamUrl: string; // HLS .m3u8 or RTMP or Bunny Stream Live URL
  backupStreamUrl?: string;
  logo: string;
  poster: string;
  description: string;
  isLive: boolean;
  status: 'active' | 'standby' | 'offline';
  resolution: string; // e.g. "1080p 60fps HD"
  currentProgramTitle?: string;
  currentProgramDescription?: string;
  viewersCount: number;
  updatedAt: string;
}

export interface Advertisement {
  id: string;
  title: string;
  advertiserName: string;
  adType: 'banner' | 'video_preroll' | 'video_midroll' | 'video_postroll' | 'sponsored';
  mediaUrl: string; // Banner image URL or Video Stream URL
  targetUrl: string; // Click redirection link
  placement: 'home_top' | 'player_preroll' | 'player_midroll' | 'player_postroll' | 'news_sidebar' | 'all';
  impressions: number;
  clicks: number;
  status: 'active' | 'paused' | 'expired';
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface Grievance {
  id: string;
  title: string;
  description: string;
  category: string;
  district: string;
  taluka: string;
  village: string;
  citizenName: string;
  contactNumber: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  status: 'pending' | 'verified' | 'published' | 'resolved';
  adminNotes?: string;
  submittedAt: string;
  createdAt?: string;
}

export interface Season {
  id: string;
  contentId: string; // Parent series ID
  seriesId?: string; // Series ID alias
  seasonNumber: number;
  title: string;
  poster?: string;
  posterUrl?: string;
  overview?: string;
  releaseDate?: string;
  episodeCount?: number;
  createdAt: string;
}

export interface Episode {
  id: string;
  seasonId: string;
  contentId: string; // Parent series ID
  seriesId?: string; // Series ID alias
  episodeNumber: number;
  title: string;
  description: string;
  videoId: string; // Bunny Stream GUID
  duration: number; // in seconds
  thumbnail: string;
  thumbnailUrl?: string;
  isFreePreview: boolean;
  price?: number;
  videoStatus: 'ready' | 'processing' | 'failed';
  resolution?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string;
  isKid: boolean;
}

export interface UserDevice {
  deviceId: string;
  platform: 'android' | 'ios' | 'web' | 'android-tv' | 'apple-tv';
  deviceName: string;
  lastLogin: string;
  ipAddress?: string;
  isLoggedIn?: boolean;
  loginTime?: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  photoUrl?: string;
  district?: string;
  taluka?: string;
  createdAt: string;
  subscriptionStatus: 'active' | 'expired' | 'canceled' | 'none' | 'free';
  planId?: string;
  planName?: string;
  planExpiry?: string;
  devices: UserDevice[];
  watchlist: string[]; // array of content IDs
  continueWatching: Record<string, { position: number; duration: number; updatedAt: string }>;
  profiles?: UserProfile[];
  isLoggedIn?: boolean;
  sessionStatus?: 'active' | 'logged_out';
  lastLogin?: string;
  loginTime?: string;
  lastLogout?: string;
  activeDurationText?: string;
  activeHours?: number;
}

export interface Subscription {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  planId: string;
  planName?: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'canceled';
  paymentProvider: 'razorpay' | 'stripe' | 'manual';
  transactionId: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  durationDays: number;
  billingCycle?: 'monthly' | 'quarterly' | 'yearly';
  resolution: string; // "1080p", "4K HDR"
  maxDevices: number;
  features: string[];
  isPopular?: boolean;
  active: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  contentId: string;
  order: number;
  active: boolean;
  badge?: string; // e.g. "New Release", "Trending #1"
}

export interface ContentAnalytics {
  contentId: string;
  title: string;
  type: ContentType;
  totalViews: number;
  totalWatchTimeHours: number;
  completionRate: number; // percentage e.g. 78.5
  likes: number;
  shares: number;
  viewsByDevice: {
    mobile: number;
    tv: number;
    web: number;
  };
}

export interface BunnyConfig {
  apiKey: string;
  streamLibraryId: string;
  storageZoneName: string;
  storageApiKey: string;
  cdnHostname: string;
  tokenSecurityKey: string;
}

export interface CompanyInfo {
  // 1. Company Information
  companyName: string;
  legalEntityName: string;
  cinNumber: string;
  foundedYear: string;
  tagline: string;
  registrationNumber: string;
  managingDirector: string;
  gstNumber: string;

  // 2. About Us
  aboutTitle: string;
  aboutStory: string;
  mission: string;
  vision: string;
  coreValues: string;
  regionalPresence: string;

  // 3. Contact Information
  headOfficeAddress: string;
  branchOfficeAddress: string;
  contactEmail: string;
  supportEmail: string;
  phone1: string;
  phone2: string;
  whatsappHelpline: string;
  workingHours: string;

  // 4. News Portal Information
  newsPortalName: string;
  editorialDeskEmail: string;
  chiefEditor: string;
  pressReleaseEmail: string;
  broadcastSchedule: string;
  newsCategoriesSummary: string;

  // 5. Information & Legal Policies
  informationNotice: string;
  grievanceOfficerName: string;
  grievanceOfficerEmail: string;
  privacyPolicySummary: string;
  termsOfServiceSummary: string;
  disclaimerText: string;

  // 6. OTT Promotion
  ottPromotionTitle: string;
  ottPromotionTagline: string;
  playStoreUrl: string;
  androidTvAppUrl: string;
  iosAppUrl: string;
  featuredPromoBanner: string;
  promoBadgeText: string;
  promoHighlights: string;
}

