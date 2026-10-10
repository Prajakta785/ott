import { AdminUser, Advertisement, Banner, BunnyConfig, CompanyInfo, ContentAnalytics, ContentCategory, ContentItem, Episode, Grievance, LiveChannel, NotificationItem, Plan, Season, Subscription, User } from './types';

// Default Authorized Administrators for all 7 Roles
export const initialAdmins: AdminUser[] = [
  {
    uid: 'admin-super-01',
    email: 'admin@graminbharat.tv',
    name: 'Super Admin (मुख्य प्रशासक)',
    role: 'superadmin',
    createdAt: '2026-09-29T10:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    uid: 'admin-news-02',
    email: 'news.editor@graminbharat.tv',
    name: 'Ramesh Pawar (बातम्या संपादक)',
    role: 'news_editor',
    createdAt: '2026-09-30T11:30:00.000Z',
    lastLogin: '2026-10-02T16:20:00.000Z',
  },
  {
    uid: 'admin-content-03',
    email: 'content.manager@graminbharat.tv',
    name: 'Priya Sharma (कंटेंट मॅनेजर)',
    role: 'content_manager',
    createdAt: '2026-10-01T09:15:00.000Z',
    lastLogin: '2026-10-03T12:45:00.000Z',
  },
  {
    uid: 'admin-video-04',
    email: 'video.manager@graminbharat.tv',
    name: 'Amit Deshmukh (व्हिडिओ मॅनेजर)',
    role: 'video_manager',
    createdAt: '2026-10-01T14:00:00.000Z',
    lastLogin: '2026-10-03T14:10:00.000Z',
  },
  {
    uid: 'admin-reporter-05',
    email: 'reporter@graminbharat.tv',
    name: 'Rahul Shinde (फील्ड वार्ताहर)',
    role: 'reporter',
    createdAt: '2026-10-02T10:00:00.000Z',
    lastLogin: '2026-10-03T15:30:00.000Z',
  },
  {
    uid: 'admin-ads-06',
    email: 'ads.manager@graminbharat.tv',
    name: 'Sunita Jadhav (जाहिरात व्यवस्थापक)',
    role: 'advertisement_manager',
    createdAt: '2026-10-02T13:45:00.000Z',
    lastLogin: '2026-10-03T11:20:00.000Z',
  },
  {
    uid: 'admin-finance-07',
    email: 'finance.manager@graminbharat.tv',
    name: 'Mahesh Patil (वित्त व्यवस्थापक)',
    role: 'finance_manager',
    createdAt: '2026-10-02T15:00:00.000Z',
    lastLogin: '2026-10-03T16:00:00.000Z',
  },
];

// Initial published items - clean slate
export const initialContent: ContentItem[] = [];
export const initialSeasons: Season[] = [];
export const initialEpisodes: Episode[] = [];
export const initialGrievances: Grievance[] = [];
export const initialBanners: Banner[] = [];
export const initialAds: Advertisement[] = [];
export const initialUsers: User[] = [];
export const initialSubscriptions: Subscription[] = [];
export const initialLiveChannels: LiveChannel[] = [];
export const initialPlans: Plan[] = [
  {
    id: 'plan_mobile',
    name: 'Mobile Plan',
    slug: 'mobile-plan',
    price: 149,
    currency: '₹',
    durationDays: 30,
    billingCycle: 'monthly',
    resolution: 'Standard SD quality',
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
    resolution: '1080p Full HD quality',
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
    resolution: '4K Ultra HD + HDR quality',
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
export const initialAnalytics: ContentAnalytics[] = [];
export const initialNotifications: NotificationItem[] = [];
export const initialCategories: ContentCategory[] = [
  {
    id: 'cat-live',
    nameMarathi: 'लाईव्ह टीव्ही',
    nameEnglish: 'Live',
    type: 'live',
    subCategories: ['Live TV', 'ग्रामीण भारत Live', 'विशेष प्रसारण'],
    badgeText: 'Live TV',
    badgeColor: 'bg-red-50 text-red-600 border-red-200',
    iconName: 'Radio',
    slug: 'live',
    order: 1
  },
  {
    id: 'cat-news',
    nameMarathi: 'बातम्या',
    nameEnglish: 'News',
    type: 'news',
    subCategories: ['महाराष्ट्र', 'जिल्हा बातम्या', 'तालुका बातम्या', 'ग्रामीण बातम्या', 'राजकीय बातम्या', 'सामाजिक बातम्या', 'शेतकरी बातम्या'],
    badgeText: 'News',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    iconName: 'Newspaper',
    slug: 'news',
    order: 2
  },
  {
    id: 'cat-namdar-maharashtra',
    nameMarathi: 'नामदार महाराष्ट्र',
    nameEnglish: 'Namdar Maharashtra',
    type: 'video',
    subCategories: ['संस्कृती', 'परंपरा', 'लोककला', 'पर्यटन', 'इतिहास'],
    badgeText: 'Regional',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    iconName: 'MapPin',
    slug: 'namdar-maharashtra',
    order: 3
  },
  {
    id: 'cat-gramin-bharat-tv',
    nameMarathi: 'ग्रामीण भारत TV',
    nameEnglish: 'Gramin Bharat TV',
    type: 'video',
    subCategories: ['शेती व कृषी', 'ग्रामीण विकास', 'शेतकरी योजना', 'पंचायत राज'],
    badgeText: 'Rural',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconName: 'Tractor',
    slug: 'gramin-bharat-tv',
    order: 4
  },
  {
    id: 'cat-entertainment',
    nameMarathi: 'मनोरंजन',
    nameEnglish: 'Entertainment',
    type: 'video',
    subCategories: ['मनोरंजन शो', 'संगीत', 'कॉमेडी', 'नाट्यप्रयोग', 'कला'],
    badgeText: 'Shows',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    iconName: 'Clapperboard',
    slug: 'entertainment',
    order: 5
  },
  {
    id: 'cat-movies',
    nameMarathi: 'चित्रपट',
    nameEnglish: 'Movies',
    type: 'movie',
    subCategories: ['मराठी चित्रपट', 'हिंदी चित्रपट', 'Short Films', 'ग्रामीण कथा', 'सामाजिक चित्रपट'],
    badgeText: '4K VOD',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconName: 'Film',
    slug: 'movies',
    order: 6
  },
  {
    id: 'cat-series',
    nameMarathi: 'वेब मालिका',
    nameEnglish: 'Web Series',
    type: 'series',
    subCategories: ['ग्रामीण कथा', 'सामाजिक नाटक', 'सस्पेन्स थ्रिलर', 'कौटुंबिक', 'कॉमेडी'],
    badgeText: 'Series',
    badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
    iconName: 'Tv',
    slug: 'web-series',
    order: 7
  }
];

export const mockDashboardStats = {
  totalContent: 0,
  totalMovies: 0,
  totalSeries: 0,
  totalLiveChannels: 0,
  totalUsers: 0,
  activeSubscriptions: 0,
  monthlyRevenueINR: 0,
  viewsThisMonth: 0,
  bandwidthServedGB: 0,
  avgWatchTimeMinutes: 0,
};

export const mockMonthlyTrends = [
  { month: 'Mar', views: 0, subscribers: 0, revenue: 0 },
  { month: 'Apr', views: 0, subscribers: 0, revenue: 0 },
  { month: 'May', views: 0, subscribers: 0, revenue: 0 },
  { month: 'Jun', views: 0, subscribers: 0, revenue: 0 },
  { month: 'Jul', views: 0, subscribers: 0, revenue: 0 },
  { month: 'Aug', views: 0, subscribers: 0, revenue: 0 },
];

export const mockDeviceDistribution: Array<{ name: string; value: number; fill: string }> = [];

export const initialBunnyConfig: BunnyConfig = {
  apiKey: 'afb32a68-d916-4eac-83bb2d60a0df-3935-46e4',
  streamLibraryId: '767488',
  storageZoneName: 'graminbharat',
  storageApiKey: '2d3836f0-1ac0-4550-bc5638b69bd8-18c0-45d9',
  cdnHostname: 'vz-92cc7e0f-cd7.b-cdn.net',
  tokenSecurityKey: 'af71bff6-aa4a-4222-a99e-9589d3bed97c',
};

export const initialCompanyInfo: CompanyInfo = {
  // 1. Company Information
  companyName: 'ग्रामीण भारत ओटीटी मीडिया प्रा. लि.',
  legalEntityName: 'Gramin Bharat OTT Media Private Limited',
  cinNumber: 'U92100MH2024PTC412345',
  foundedYear: '2024',
  tagline: 'मातीची नाळ, महाराष्ट्राचा आवाज - ग्रामीण भारताचे डिजिटल व्यासपीठ',
  registrationNumber: 'ROC/PUN/2024/987654',
  managingDirector: 'श्री. अमोल पवार',
  gstNumber: '27AABCG1234F1Z8',

  // 2. About Us
  aboutTitle: 'आमच्याबद्दल (About Gramin Bharat OTT)',
  aboutStory: 'ग्रामीण भारत हे महाराष्ट्रातील प्रत्येक गाव, तालुका आणि जिल्ह्याशी जोडलेले अग्रगण्य डिजिटल ओटीटी आणि न्यूज पोर्टल व्यासपीठ आहे. स्थानिक संस्कृती, शेतकरी बांधव, ग्रामीण कला आणि प्रादेशिक बातम्यांना जागतिक पातळीवर पोहोचवणे हे आमचे ध्येय आहे.',
  mission: 'ग्रामीण व निमशहरी भागातील समृद्ध लोककला, स्थानिक प्रश्न आणि दर्जेदार मनोरंजनाला अत्याधुनिक डिजिटल तंत्रज्ञानाद्वारे घराघरापर्यंत पोहोचवणे.',
  vision: 'महाराष्ट्रातील सर्वात विश्वासार्ह आणि लोकप्रिय प्रादेशिक डिजिटल मीडिया व मनोरंजन प्लॅटफॉर्म बनणे.',
  coreValues: 'पारदर्शकता, सामाजिक बांधिलकी, स्थानिक संस्कृतीचा सन्मान, निष्पक्ष पत्रकारिता आणि अत्याधुनिक ग्राहक सेवा.',
  regionalPresence: 'महाराष्ट्र राज्यभरातील सर्व ३६ जिल्हे आणि ३५०+ तालुके.',

  // 3. Contact Information
  headOfficeAddress: 'प्लॉट क्र. ४२, मीडिया हब, बाणेर-म्हाळुंगे रोड, पुणे, महाराष्ट्र - ४११ ०४५',
  branchOfficeAddress: 'ऑफिस क्र. १२, सह्याद्री कॉम्प्लेक्स, छत्रपती संभाजीनगर, महाराष्ट्र - ४३१ ००१',
  contactEmail: 'contact@graminbharat.tv',
  supportEmail: 'support@graminbharat.tv',
  phone1: '+91 98765 43210',
  phone2: '+91 87654 32109',
  whatsappHelpline: '+91 98765 43210',
  workingHours: 'सोमवार ते शनिवार: सकाळी ९:०० ते संध्याकाळी ७:०० (रविवार सुट्टी)',

  // 4. News Portal Information
  newsPortalName: 'ग्रामीण भारत न्यूज पोर्टल व डिजिटल चॅनल',
  editorialDeskEmail: 'editorial@graminbharat.tv',
  chiefEditor: 'संपादकीय मंडळ, ग्रामीण भारत वृत्तसेवा',
  pressReleaseEmail: 'press@graminbharat.tv',
  broadcastSchedule: '२४x७ डिजिटल लाईव्ह बुलेटिन व दर तासाला ताज्या घडामोडी',
  newsCategoriesSummary: 'महाराष्ट्र, शेती व कृषी तंत्रज्ञान, राजकीय विश्लेषण, ग्रामीण प्रशासन, शिक्षण, क्रीडा आणि स्थानिक विशेष वार्ता',

  // 5. Information & Legal Policies
  informationNotice: 'हे पोर्टल आणि ओटीटी ॲप माहिती तंत्रज्ञान (मध्यस्थ मार्गदर्शक तत्त्वे व डिजिटल मीडिया आचारसंहिता) नियम २०२१ अंतर्गत नोंदणीकृत आहे.',
  grievanceOfficerName: 'अधिवक्ता राहुल देशपांडे (तक्रार निवारण अधिकारी)',
  grievanceOfficerEmail: 'grievance@graminbharat.tv',
  privacyPolicySummary: 'आम्ही युझर्सच्या गोपनीयतेचा आदर करतो. कोणत्याही तृतीय पक्षाला युझर डेटा विकला जात नाही. सर्व पेमेंट व्यवहार २५६-बिट एन्क्रिप्टेड आहेत.',
  termsOfServiceSummary: 'सर्व व्हिडिओ, बातम्या आणि ऑडिओ-व्हिज्युअल साहित्य ग्रामीण भारत मीडियाचे कॉपीराइट संरक्षित असून अनधिकृत पुनरुत्पादनास मनाई आहे.',
  disclaimerText: 'पोर्टलवरील बातम्या व लेखांमधील मते ही संबंधित लेखक/बातमीदारांची वैयक्तिक असू शकतात. व्यवस्थापन प्रत्येक मताशी सहमत असेलच असे नाही.',

  // 6. OTT Promotion
  ottPromotionTitle: 'ग्रामीण भारत मोबाईल ॲप व स्मार्ट टीव्ही ॲप',
  ottPromotionTagline: 'आता डाउनलोड करा आणि अनुभवा दर्जेदार ग्रामीण मनोरंजन व जलद बातम्या!',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.graminbharat.ott',
  androidTvAppUrl: 'https://play.google.com/store/apps/details?id=com.graminbharat.tv',
  iosAppUrl: 'https://apps.apple.com/app/gramin-bharat-ott/id123456789',
  featuredPromoBanner: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=1200&q=80',
  promoBadgeText: 'नवीन ॲप अपडेट उपलब्ध • HD व 4K स्ट्रीमिंग',
  promoHighlights: '१००+ मराठी चित्रपट | लाईव्ह न्यूज बुलेटिन | ऑफलाईन डाऊनलोड | ॲड-फ्री प्रीमियम सबस्क्रिप्शन'
};

