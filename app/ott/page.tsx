'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Tv, 
  Radio, 
  Film, 
  Play, 
  Plus, 
  Check, 
  Search, 
  Users, 
  Crown, 
  Sparkles, 
  Info, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  Star, 
  ShieldCheck, 
  Layers, 
  IndianRupee, 
  Newspaper, 
  ExternalLink,
  Volume2,
  Bookmark,
  Share2,
  Building2,
  BookOpen,
  Phone,
  MapPin,
  Mail,
  Smartphone,
  Globe,
  ArrowLeft
} from 'lucide-react';
import { firestoreService } from '@/lib/firestore-service';
import { ContentItem, LiveChannel, Plan, Banner, User, CompanyInfo, ContentCategory } from '@/lib/types';
import { initialCompanyInfo } from '@/lib/mock-data';
import { VideoPlayer } from '@/components/video-player';
import { useLanguage } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/language-switcher';
import { getSafeImageUrl, handleImageError } from '@/lib/image-utils';

export default function OTTPlatformPage() {
  const { lang, t } = useLanguage();
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab & Language Filter
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'movies' | 'series' | 'plans' | string>('movies');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'mr' | 'hi' | 'en'>('all');

  // Video Playback Modal State
  const [playingVideo, setPlayingVideo] = useState<{
    src: string;
    title: string;
    subtitle?: string;
    poster?: string;
    isLive?: boolean;
  } | null>(null);

  // Content Details Modal
  const [detailItem, setDetailItem] = useState<ContentItem | null>(null);

  // Subscription Modal
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<Plan | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // User Profile Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo);
  const [activeCompanySection, setActiveCompanySection] = useState<'company' | 'about' | 'contact' | 'news' | 'information' | 'promotion' | null>(null);

  // Watchlist
  const [watchlist, setWatchlist] = useState<string[]>(['mov-1', 'series-1']);

  // Hero Banner Index
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [items, liveChannels, heroBanners, subPlans, users, compData, cats] = await Promise.all([
          firestoreService.getContent(),
          firestoreService.getLiveChannels(),
          firestoreService.getBanners(),
          firestoreService.getPlans(),
          firestoreService.getUsers(),
          firestoreService.getCompanyInfo(),
          firestoreService.getCategories(),
        ]);

        setContentList(items);
        setChannels(liveChannels);
        setBanners(heroBanners);
        setPlans(subPlans);
        setCategories(cats || []);
        if (compData) {
          setCompanyInfo(compData);
        }
        if (users.length > 0) {
          setCurrentUser(users[0]);
        } else {
          // Default viewer profile
          setCurrentUser({
            id: 'user-demo-01',
            name: 'राहुल पाटील',
            phone: '+91 98221 44520',
            createdAt: new Date().toISOString(),
            subscriptionStatus: 'free',
            planName: 'Free User',
            devices: [
              { deviceId: 'dev-1', deviceName: 'Samsung 4K Android TV', platform: 'android-tv', lastLogin: 'Just now' },
              { deviceId: 'dev-2', deviceName: 'OnePlus 12 (Mobile)', platform: 'android', lastLogin: 'Yesterday' }
            ],
            watchlist: ['mov-1', 'series-1'],
            continueWatching: {
              'mov-1': { position: 3420, duration: 5400, updatedAt: new Date().toISOString() }
            }
          });
        }
      } catch (err) {
        console.warn('OTT loadData error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Auto-sync listeners for real-time updates from web admin
    const handleContentUpdate = () => {
      firestoreService.getContent().then(items => {
        if (items) setContentList(items);
      }).catch(() => {});
    };

    const handleCompanyUpdate = () => {
      firestoreService.getCompanyInfo().then(info => {
        if (info) setCompanyInfo(info);
      }).catch(() => {});
    };

    window.addEventListener('ott_content_updated', handleContentUpdate);
    window.addEventListener('ott_company_updated', handleCompanyUpdate);
    window.addEventListener('storage', handleContentUpdate);
    window.addEventListener('focus', handleContentUpdate);

    return () => {
      window.removeEventListener('ott_content_updated', handleContentUpdate);
      window.removeEventListener('ott_company_updated', handleCompanyUpdate);
      window.removeEventListener('storage', handleContentUpdate);
      window.removeEventListener('focus', handleContentUpdate);
    };
  }, []);

  // Default fallback catalog if empty
  const defaultMovies: ContentItem[] = [
    {
      id: 'mov-1',
      type: 'movie',
      title: 'शेतकरी राजा: मातीतील सोने (4K)',
      titleHi: 'शेतकरी राजा: माटी का सोना (4K)',
      titleEn: 'King of Farmers: Gold of Soil (4K)',
      slug: 'shetkari-raja-matitil-sone',
      description: 'महाराष्ट्रातील दुष्काळग्रस्त भागातील एका जिद्दी शेतकऱ्याची यशोगाथा. आधुनिक तंत्रज्ञानाचा वापर करून शेतीत क्रांती घडवणारा कौटुंबिक चित्रपट.',
      descHi: 'महाराष्ट्र के सूखाग्रस्त क्षेत्र के एक दृढ़ निश्चयी किसान की गाथा. आधुनिक तकनीक के प्रयोग से कृषि में क्रांति लाने वाली पारिवारिक फिल्म.',
      descEn: 'The inspiring story of a resilient farmer in drought-prone Maharashtra. A heartwarming film showcasing agricultural transformation through modern innovation.',
      tags: ['मराठी चित्रपट', '4K UHD', 'ग्रामीण कथा'],
      genres: ['मराठी चित्रपट', 'ग्रामीण कथा'],
      cast: ['मकरंद अनासपुरे', 'सोनाली कुलकर्णी', 'सयाजी शिंदे'],
      director: 'नागराज मंजुळे',
      language: ['मराठी'],
      releaseDate: '2026-08-15',
      poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
      banner: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600',
      isPremium: true,
      isFeatured: true,
      status: 'published',
      rating: 'U/A',
      views: 184500,
      duration: 7200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolution: '4K UHD HDR',
      videoId: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    },
    {
      id: 'mov-2',
      type: 'movie',
      title: 'गाव कारभारी: निवडणूक आणि सत्ता संघर्ष',
      titleHi: 'गांव कारभारी: चुनाव और सत्ता संघर्ष',
      titleEn: 'Village Head: Election & Power Struggle',
      slug: 'gav-karbhari',
      description: 'ग्रामपंचायतीच्या निवडणुकीत युवा पिढीने जुन्या सरंजामी राजकारणाला दिलेले आव्हान. थरारक राजकीय व सामाजिक नाट्य.',
      descHi: 'ग्राम पंचायत चुनाव में पुरानी सामंती राजनीति को युवा पीढ़ी की चुनौती. रोमांचक राजनीतिक और सामाजिक ड्रामा.',
      descEn: 'The youth challenge age-old feudal politics in gram panchayat elections. A gripping political drama.',
      tags: ['राजकीय', 'मनोरंजन'],
      genres: ['मराठी चित्रपट', 'सामाजिक चित्रपट'],
      cast: ['प्रवीण तरडे', 'उपेंद्र लिमये'],
      director: 'संजय जाधव',
      language: ['मराठी'],
      releaseDate: '2026-06-20',
      poster: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800',
      banner: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=1600',
      isPremium: false,
      isFeatured: true,
      status: 'published',
      rating: '13+',
      views: 92300,
      duration: 6400,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolution: '1080p Full HD',
      videoId: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    },
    {
      id: 'mov-3',
      type: 'movie',
      title: 'पंढरीची वारी: भक्तीचा महासागर',
      titleHi: 'पंढरी की वारी: भक्ति का महासागर',
      titleEn: 'Pandhari Wari: Ocean of Devotion',
      slug: 'pandharichi-wari',
      description: 'आषाढी वारीच्या वाटेवरील वारकऱ्यांच्या भावना आणि विठ्ठल भक्तीचा अनोखा प्रवास दर्शवणारा माहितीपूर्ण चित्रपट.',
      descHi: 'आषाढ़ी वारी के मार्ग पर वारकरियों की भावना और विट्ठल भक्ति की अनूठी यात्रा दर्शाने वाली ज्ञानवर्धक फिल्म.',
      descEn: 'A poignant documentary capturing the spiritual journey of pilgrims during the Ashadhi Wari pilgrimage.',
      tags: ['भक्ती', 'संस्कृती'],
      genres: ['मराठी चित्रपट', 'ऐतिहासिक'],
      cast: ['सचिन पिळगावकर', 'सुबोध भावे'],
      director: 'सुभाष घई',
      language: ['मराठी'],
      releaseDate: '2026-07-10',
      poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
      banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600',
      isPremium: false,
      isFeatured: false,
      status: 'published',
      rating: 'U',
      views: 142000,
      duration: 5400,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolution: '1080p Full HD',
      videoId: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    },
    {
      id: 'mov-4',
      type: 'movie',
      title: 'धरतीपुत्र: किसान की नई उड़ान (Hindi 4K)',
      titleHi: 'धरतीपुत्र: किसान की नई उड़ान (Hindi 4K)',
      titleEn: 'Son of Soil: Soaring High (Hindi 4K)',
      slug: 'dhartiputra-kisan-ki-udaan',
      description: 'भारतीय कृषि क्रांति और आधुनिक तकनीक से अपनी तकदीर बदलने वाले एक संघर्षशील किसान की प्रेरणादायक कहानी.',
      descHi: 'भारतीय कृषि क्रांति और आधुनिक तकनीक से अपनी तकदीर बदलने वाले एक संघर्षशील किसान की प्रेरणादायक कहानी.',
      descEn: 'An inspiring drama of a perseverant farmer transforming his destiny with agricultural technology.',
      tags: ['हिंदी फ़िल्में', '4K UHD', 'किसान ड्रामा'],
      genres: ['हिंदी फ़िल्में', 'Drama', 'सामाजिक चित्रपट'],
      cast: ['मनोज बाजपेयी', 'पंकज त्रिपाठी'],
      director: 'अनुराग कश्यप',
      language: ['हिंदी', 'Hindi'],
      releaseDate: '2026-07-25',
      poster: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=800',
      banner: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=1600',
      isPremium: true,
      isFeatured: true,
      status: 'published',
      rating: 'U/A',
      views: 215000,
      duration: 7500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolution: '4K UHD HDR',
      videoId: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
    },
    {
      id: 'mov-5',
      type: 'movie',
      title: 'Silent Green: The Maharashtra Agro Chronicles (English 4K)',
      titleHi: 'साइलेंट ग्रीन: महाराष्ट्र कृषि गाथा (English 4K)',
      titleEn: 'Silent Green: The Maharashtra Agro Chronicles (English 4K)',
      slug: 'silent-green-agro-chronicles',
      description: 'A globally acclaimed documentary on water conservation, drip irrigation, and rural entrepreneurship across Maharashtra.',
      descHi: 'जल संरक्षण, ड्रिप सिंचाई और ग्रामीण उद्यमिता पर अंतरराष्ट्रीय स्तर पर सराही गई वृत्तचित्र.',
      descEn: 'A globally acclaimed documentary on water conservation, drip irrigation, and rural entrepreneurship across Maharashtra.',
      tags: ['English Movies', '4K UHD', 'Global Documentary'],
      genres: ['English Movies', 'Documentary', 'Environment'],
      cast: ['David Attenborough', 'Rahul Bose'],
      director: 'Shekhar Kapur',
      language: ['English', 'इंग्रजी'],
      releaseDate: '2026-08-01',
      poster: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
      banner: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600',
      isPremium: false,
      isFeatured: false,
      status: 'published',
      rating: 'U',
      views: 110400,
      duration: 4800,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolution: '4K UHD HDR',
      videoId: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4'
    }
  ];

  const defaultSeries: ContentItem[] = [
    {
      id: 'series-1',
      type: 'series',
      title: 'ग्रामविकास क्रांती (हंगाम १)',
      titleHi: 'ग्रामविकास क्रांति (सीजन १)',
      titleEn: 'Rural Development Revolution (Season 1)',
      slug: 'gramvikas-kranti-season-1',
      description: 'महाराष्ट्रातील आदर्श गाव हिवरे बाजार व राळेगणसिद्धीच्या धर्तीवर गावाचा कायापालट करणाऱ्या ध्येयवादी सरपंचांची मालिका.',
      descHi: 'महाराष्ट्र के आदर्श गांवों की तर्ज पर गांव का कायाकल्प करने वाले कर्मठ सरपंचों की श्रृंखला.',
      descEn: 'A visionary series following forward-thinking village leaders revitalizing rural communities.',
      tags: ['वेब मालिका', 'ग्रामीण'],
      genres: ['Web Series', 'ग्रामीण कथा'],
      cast: ['सुमीत राघवन', 'अमृता सुभाष'],
      director: 'महेश मांजरेकर',
      language: ['मराठी'],
      releaseDate: '2026-05-01',
      poster: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800',
      banner: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1600',
      isPremium: true,
      isFeatured: true,
      status: 'published',
      rating: 'U/A',
      views: 298400,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolution: '4K UHD HDR',
      videoId: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
    },
    {
      id: 'series-2',
      type: 'series',
      title: 'पंचायत संगम: गांव से संसद तक (Season 1)',
      titleHi: 'पंचायत संगम: गांव से संसद तक (Season 1)',
      titleEn: 'Panchayat Sangam: Village to Parliament (Season 1)',
      slug: 'panchayat-sangam-season-1',
      description: 'गांव के विकास और युवाओं के राजनीतिक सशक्तिकरण की दिलचस्प वेब श्रृंखला. ५ धमाकेदार एपिसोड.',
      descHi: 'गांव के विकास और युवाओं के राजनीतिक सशक्तिकरण की दिलचस्प वेब श्रृंखला. ५ धमाकेदार एपिसोड.',
      descEn: 'An engaging web series on grassroots governance and political empowerment across 5 episodes.',
      tags: ['हिंदी वेब सीरीज़', 'पॉलिटिकल ड्रामा'],
      genres: ['Hindi Web Series', 'Drama'],
      cast: ['जितेंद्र कुमार', 'नीना गुप्ता'],
      director: 'दीपक कुमार मिश्रा',
      language: ['हिंदी', 'Hindi'],
      releaseDate: '2026-06-15',
      poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
      banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600',
      isPremium: true,
      isFeatured: true,
      status: 'published',
      rating: 'U/A',
      views: 312000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolution: '4K UHD HDR',
      videoId: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    },
    {
      id: 'series-3',
      type: 'series',
      title: 'Voices of Maharashtra: Untold Legends (Season 1)',
      titleHi: 'वॉइसेस ऑफ महाराष्ट्र: अनकही गाथाएं (Season 1)',
      titleEn: 'Voices of Maharashtra: Untold Legends (Season 1)',
      slug: 'voices-of-maharashtra-season-1',
      description: 'An international investigative docuseries exploring the heritage, historic forts, and cultural revolution of Maharashtra.',
      descHi: 'महाराष्ट्र की विरासत, ऐतिहासिक किलों और सांस्कृतिक क्रांति की खोज करने वाली वृत्तचित्र श्रृंखला.',
      descEn: 'An international investigative docuseries exploring the heritage, historic forts, and cultural revolution of Maharashtra.',
      tags: ['English Series', 'History', 'Documentary'],
      genres: ['English Series', 'Culture'],
      cast: ['William Dalrymple', 'Radhika Apte'],
      director: 'Kabir Khan',
      language: ['English', 'इंग्रजी'],
      releaseDate: '2026-07-01',
      poster: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800',
      banner: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=1600',
      isPremium: false,
      isFeatured: false,
      status: 'published',
      rating: 'U',
      views: 185000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolution: '1080p Full HD',
      videoId: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    }
  ];

  const defaultLiveChannels: LiveChannel[] = [
    {
      id: 'live-ch-1',
      channelName: 'Gramin Bharat TV Live (ग्रामीण भारत)',
      channelCode: 'gramin_bharat_live',
      streamUrl: 'e6eb731d-a1b1-4885-a40b-54c4e860c78e',
      logo: '/app_logo.png',
      poster: 'https://vz-92cc7e0f-cd7.b-cdn.net/e6eb731d-a1b1-4885-a40b-54c4e860c78e/thumbnail.jpg',
      description: '२४ तास चालू असलेले महाराष्ट्र ग्रामीण भागातील अग्रगण्य थेट बातमी चॅनेल.',
      isLive: true,
      status: 'active',
      resolution: '1080p 60fps HD',
      currentProgramTitle: 'विशेष बुलेटिन: शेती सल्ला व हवामान अंदाज',
      viewersCount: 14200,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'live-ch-2',
      channelName: 'नामदार महाराष्ट्र Live TV',
      channelCode: 'namdar_maharashtra_live',
      streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      logo: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300',
      poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200',
      description: 'राजकीय, सामाजिक व सांस्कृतिक घडामोडींचे थेट अखंड प्रक्षेपण.',
      isLive: true,
      status: 'active',
      resolution: '1080p 60fps HD',
      currentProgramTitle: 'मंत्रालय विशेष: मंत्रिमंडळ निर्णय व थेट चर्चा',
      viewersCount: 9800,
      updatedAt: new Date().toISOString(),
    }
  ];

  const defaultPlans: Plan[] = [
    {
      id: 'plan_mobile',
      name: 'Mobile Plan',
      slug: 'mobile-plan',
      price: 149,
      currency: 'INR',
      durationDays: 30,
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
      currency: 'INR',
      durationDays: 30,
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
      currency: 'INR',
      durationDays: 30,
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
    }
  ];

  const userMovies = contentList.filter(c => c.type !== 'series');
  const allMovies = [
    ...userMovies,
    ...defaultMovies.filter(dm => !userMovies.some(um => um.id === dm.id))
  ];

  const userSeries = contentList.filter(c => c.type === 'series');
  const allSeries = [
    ...userSeries,
    ...defaultSeries.filter(ds => !userSeries.some(us => us.id === ds.id))
  ];

  const displayChannels = channels.length > 0 ? channels : defaultLiveChannels;
  const displayPlans = plans.length > 0 ? plans : defaultPlans;

  // Filter items by tab, genre, language and search
  const filteredMovies = allMovies.filter(m => {
    const movieGenres = Array.isArray(m.genres) ? m.genres : [];
    if (selectedGenre !== 'all') {
      const gNorm = selectedGenre.toLowerCase();
      const hasGenre = movieGenres.some(g => {
        const itemG = String(g).toLowerCase();
        return itemG === gNorm || 
          itemG.includes(gNorm) || 
          gNorm.includes(itemG) ||
          (gNorm.includes('मराठी') && (itemG.includes('marathi') || itemG.includes('मराठी'))) ||
          (gNorm.includes('हिंदी') && (itemG.includes('hindi') || itemG.includes('हिंदी'))) ||
          (gNorm.includes('english') && (itemG.includes('english') || itemG.includes('इंग्रजी')));
      }) ||
      (m.subCategory && String(m.subCategory).toLowerCase().includes(gNorm)) ||
      (Array.isArray(m.subCategories) && m.subCategories.some(sub => String(sub).toLowerCase().includes(gNorm))) ||
      (Array.isArray(m.tags) && m.tags.some(t => String(t).toLowerCase().includes(gNorm))) ||
      (m.type && String(m.type).toLowerCase() === gNorm) ||
      (m.title && String(m.title).toLowerCase().includes(gNorm));
      if (!hasGenre) return false;
    }
    if (selectedLanguage !== 'all') {
      const rawLangs = Array.isArray(m.language)
        ? m.language
        : (typeof m.language === 'string' ? [m.language] : []);
      const langs = rawLangs.map(l => String(l).toLowerCase());
      if (selectedLanguage === 'mr' && !langs.some(l => l.includes('मराठी') || l.includes('marathi'))) return false;
      if (selectedLanguage === 'hi' && !langs.some(l => l.includes('हिंदी') || l.includes('hindi'))) return false;
      if (selectedLanguage === 'en' && !langs.some(l => l.includes('eng') || l.includes('इंग्रजी'))) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const castList = Array.isArray(m.cast) ? m.cast : [];
      return (
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.director && m.director.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        castList.some(c => String(c).toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredSeries = allSeries.filter(s => {
    if (selectedLanguage !== 'all') {
      const rawLangs = Array.isArray(s.language)
        ? s.language
        : (typeof s.language === 'string' ? [s.language] : []);
      const langs = rawLangs.map(l => String(l).toLowerCase());
      if (selectedLanguage === 'mr' && !langs.some(l => l.includes('मराठी') || l.includes('marathi'))) return false;
      if (selectedLanguage === 'hi' && !langs.some(l => l.includes('हिंदी') || l.includes('hindi'))) return false;
      if (selectedLanguage === 'en' && !langs.some(l => l.includes('eng') || l.includes('इंग्रजी'))) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (s.title && s.title.toLowerCase().includes(q)) || (s.description && s.description.toLowerCase().includes(q));
    }
    return true;
  });

  const formatGenre = (g: string) => {
    if (!g) return '';
    const mapping: Record<string, { mr: string; hi: string; en: string }> = {
      'मराठी चित्रपट': { mr: 'मराठी चित्रपट', hi: 'मराठी सिनेमा', en: 'Marathi Cinema' },
      'ग्रामीण कथा': { mr: 'ग्रामीण कथा', hi: 'ग्रामीण कथा', en: 'Rural Drama' },
      'सामाजिक चित्रपट': { mr: 'सामाजिक चित्रपट', hi: 'सामाजिक सिनेमा', en: 'Social Drama' },
      'राजकीय नाटक': { mr: 'राजकीय नाटक', hi: 'राजनीतिक ड्रामा', en: 'Political Drama' },
      'ऐतिहासिक': { mr: 'ऐतिहासिक', hi: 'ऐतिहासिक', en: 'Historical' },
      'कॉमेडी': { mr: 'कॉमेडी', hi: 'कॉमेडी', en: 'Comedy' },
      'क्राइम': { mr: 'क्राइम', hi: 'क्राइम थ्रिलर', en: 'Crime Thriller' },
      'कौटुंबिक': { mr: 'कौटुंबिक', hi: 'पारिवारिक', en: 'Family Drama' },
      'थ्रिलर': { mr: 'थ्रिलर', hi: 'थ्रिलर', en: 'Thriller' },
      'News': { mr: 'बातम्या', hi: 'समाचार', en: 'News' },
      'वेब मालिका': { mr: 'वेब मालिका', hi: 'वेब सीरीज़', en: 'Web Series' },
      'हिंदी फ़िल्में': { mr: 'हिंदी चित्रपट', hi: 'हिंदी फ़िल्में', en: 'Hindi Movies' },
      'English Movies': { mr: 'इंग्रजी चित्रपट', hi: 'अंग्रेज़ी फ़िल्में', en: 'English Movies' },
    };
    return mapping[g] ? (mapping[g][lang as 'mr' | 'hi' | 'en'] || mapping[g].en) : g;
  };

  const getChannelTitle = (ch: LiveChannel) => {
    if (ch.id === 'live-ch-1' || ch.channelCode === 'gramin_bharat_live') {
      if (lang === 'en') return 'Gramin Bharat TV Live';
      if (lang === 'hi') return 'ग्रामीण भारत टीवी लाइव';
      return 'Gramin Bharat TV Live (ग्रामीण भारत)';
    }
    if (ch.id === 'live-ch-2' || ch.channelCode === 'namdar_maharashtra_live') {
      if (lang === 'en') return 'Namdar Maharashtra Live TV';
      if (lang === 'hi') return 'नामदार महाराष्ट्र लाइव टीवी';
      return 'नामदार महाराष्ट्र Live TV';
    }
    return ch.channelName;
  };

  const getChannelProgramTitle = (ch: LiveChannel) => {
    if (ch.id === 'live-ch-1' || ch.channelCode === 'gramin_bharat_live') {
      if (lang === 'en') return 'Special Bulletin: Agri Advisory & Weather Forecast';
      if (lang === 'hi') return 'विशेष बुलेटिन: कृषि सलाह एवं मौसम पूर्वानुमान';
      return 'विशेष बुलेटिन: शेती सल्ला व हवामान अंदाज';
    }
    if (ch.id === 'live-ch-2' || ch.channelCode === 'namdar_maharashtra_live') {
      if (lang === 'en') return 'Ministry Special: Cabinet Decisions & Live Debate';
      if (lang === 'hi') return 'मंत्रालय विशेष: कैबिनेट निर्णय और लाइव चर्चा';
      return 'मंत्रालय विशेष: मंत्रिमंडळ निर्णय व थेट चर्चा';
    }
    return ch.currentProgramTitle || t('regularBroadcast');
  };

  const getChannelDescription = (ch: LiveChannel) => {
    if (ch.id === 'live-ch-1' || ch.channelCode === 'gramin_bharat_live') {
      if (lang === 'en') return '24x7 premier live news channel for rural Maharashtra.';
      if (lang === 'hi') return '२४ घंटे सक्रिय महाराष्ट्र ग्रामीण क्षेत्र का प्रमुख सीधा समाचार चैनल.';
      return '२४ तास चालू असलेले महाराष्ट्र ग्रामीण भागातील अग्रगण्य थेट बातमी चॅनेल.';
    }
    if (ch.id === 'live-ch-2' || ch.channelCode === 'namdar_maharashtra_live') {
      if (lang === 'en') return 'Continuous live broadcasting of political, social & cultural developments.';
      if (lang === 'hi') return 'राजनीतिक, सामाजिक और सांस्कृतिक गतिविधियों का सीधा अखंड प्रसारण.';
      return 'राजकीय, सामाजिक व सांस्कृतिक घडामोडींचे थेट अखंड प्रक्षेपण.';
    }
    return ch.description || (lang === 'mr' ? 'ग्रामीण व राज्यस्तरीय बातम्यांचे २४ तास थेट प्रक्षेपण.' : lang === 'hi' ? 'ग्रामीण और राज्य स्तरीय समाचारों का २४ घंटे सीधा प्रसारण.' : '24x7 live streaming of rural and state news.');
  };

  const handlePlayContent = (item: ContentItem) => {
    // Check Premium requirement
    if (item.isPremium) {
      const hasPremiumPlan = currentUser?.subscriptionStatus === 'active' &&
                             currentUser?.planId !== 'free' &&
                             currentUser?.planId !== 'none';
      if (!hasPremiumPlan) {
        alert(lang === 'mr' ? 'हा प्रीमियम चित्रपट आहे. कृपया पाहण्यासाठी सबस्क्रिप्शन घ्या.' : lang === 'hi' ? 'यह एक प्रीमियम फिल्म है। कृपया देखने के लिए सब्सक्रिप्शन लें।' : 'This is a premium movie. Please subscribe to watch.');
        const plansSection = document.getElementById('plans-section');
        if (plansSection) {
          plansSection.scrollIntoView({ behavior: 'smooth' });
        }
        return; // Block playing
      }
    }

    setPlayingVideo({
      src: item.videoId || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      title: getContentTitle(item),
      subtitle: `${(item.genres || []).map(formatGenre).join(' • ')} | ${item.resolution || '4K UHD'}`,
      poster: item.banner || item.poster,
      isLive: false,
    });

    if (item.id) {
      fetch('/api/content/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, videoId: item.videoId }),
      }).catch(() => {});
      setContentList(prev => prev.map(m => m.id === item.id ? { ...m, views: (m.views || 0) + 1 } : m));
    }
  };

  const handlePlayChannel = (ch: LiveChannel) => {
    setPlayingVideo({
      src: ch.streamUrl,
      title: getChannelTitle(ch),
      subtitle: `🔴 ${t('liveOnAir')} | ${getChannelProgramTitle(ch)}`,
      poster: ch.poster,
      isLive: true,
    });
  };

  const toggleWatchlist = (id: string) => {
    if (watchlist.includes(id)) {
      setWatchlist(watchlist.filter(w => w !== id));
    } else {
      setWatchlist([...watchlist, id]);
    }
  };

  const getContentTitle = (item: ContentItem) => {
    const raw = item as any;
    if (lang === 'en' && raw.titleEn) return raw.titleEn;
    if (lang === 'hi' && raw.titleHi) return raw.titleHi;
    return item.title;
  };

  const getContentDescription = (item: ContentItem) => {
    const raw = item as any;
    if (lang === 'en' && raw.descEn) return raw.descEn;
    if (lang === 'hi' && raw.descHi) return raw.descHi;
    return item.description;
  };

  const getPlanName = (plan: Plan) => {
    if (plan.id === 'plan_mobile' || plan.id === 'plan-monthly') {
      return lang === 'mr' ? 'मोबाईल प्लॅन (Mobile Plan)' : lang === 'hi' ? 'मोबाइल प्लान (Mobile Plan)' : 'Mobile Plan';
    }
    if (plan.id === 'plan_standard' || plan.id === 'plan-quarterly') {
      return lang === 'mr' ? 'स्टँडर्ड एचडी प्लॅन (Standard HD Plan)' : lang === 'hi' ? 'स्टैंडर्ड एचडी प्लान (Standard HD Plan)' : 'Standard HD Plan';
    }
    if (plan.id === 'plan_premium' || plan.id === 'plan-annual') {
      return lang === 'mr' ? 'प्रीमियम अल्ट्रा एचडी (Premium Ultra HD)' : lang === 'hi' ? 'प्रीमियम अल्ट्रा एचडी (Premium Ultra HD)' : 'Premium Ultra HD';
    }
    return plan.name;
  };

  const getPlanFeatures = (planId: string) => {
    const foundPlan = displayPlans.find(p => p.id === planId);
    if (foundPlan?.features && foundPlan.features.length > 0) {
      return foundPlan.features;
    }
    if (planId === 'plan_mobile' || planId === 'plan-monthly') {
      return ['Stream on 1 Mobile/Tablet', 'Standard SD quality', 'Ad-supported feed'];
    }
    if (planId === 'plan_standard' || planId === 'plan-quarterly') {
      return ['Stream on 2 Devices simultaneously', '1080p Full HD quality', 'Ad-free streaming', 'Offline downloads'];
    }
    return ['Stream on 4 Devices simultaneously', '4K Ultra HD + HDR quality', 'Ad-free streaming', 'Dolby Atmos Audio'];
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutSuccess(true);
    setTimeout(() => {
      setCheckoutSuccess(false);
      setSelectedPlanForCheckout(null);
      if (currentUser && selectedPlanForCheckout) {
        setCurrentUser({
          ...currentUser,
          subscriptionStatus: 'active',
          planName: getPlanName(selectedPlanForCheckout),
        });
      }
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans select-none">
      {/* 1. TOP CINEMATIC OTT NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#070B14]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Navigation Tabs */}
          <div className="flex items-center gap-8">
            <Link href="/ott" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-glow-crimson group-hover:scale-105 transition-transform">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-white text-base tracking-wider">AURORA OTT</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[9px]">4K VIP</span>
                </div>
                <p className="text-[10px] text-amber-400 font-extrabold tracking-tight">
                  {lang === 'en' ? 'Gramin Bharat • Namdar Maharashtra' : 'ग्रामीण भारत • नामदार महाराष्ट्र'}
                </p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-xs font-bold text-slate-300">
              <button
                onClick={() => { setActiveTab('all'); setSelectedGenre('all'); }}
                className={`transition hover:text-white cursor-pointer ${activeTab === 'all' && selectedGenre === 'all' ? 'text-rose-500 font-black' : ''}`}
              >
                {t('navAll')}
              </button>
              <button
                onClick={() => { setActiveTab('movies'); setSelectedGenre('all'); }}
                className={`transition hover:text-white cursor-pointer ${activeTab === 'movies' && selectedGenre === 'all' ? 'text-rose-500 font-black' : ''}`}
              >
                {t('navMovies')}
              </button>
              <button
                onClick={() => { setActiveTab('series'); setSelectedGenre('all'); }}
                className={`transition hover:text-white cursor-pointer ${activeTab === 'series' && selectedGenre === 'all' ? 'text-rose-500 font-black' : ''}`}
              >
                {t('navSeries')}
              </button>

              {/* Dynamic categories added by admin */}
              {categories
                .filter(c => !['all', 'movies', 'movie', 'series', 'web-series'].includes((c.slug || c.nameEnglish || '').toLowerCase()))
                .map(cat => {
                  const label = lang === 'mr' && cat.nameMarathi ? cat.nameMarathi : (lang === 'hi' && cat.nameMarathi ? cat.nameMarathi : cat.nameEnglish);
                  const isSelected = selectedGenre.toLowerCase() === cat.nameEnglish.toLowerCase();
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveTab('all');
                        setSelectedGenre(cat.nameEnglish);
                      }}
                      className={`transition hover:text-white cursor-pointer flex items-center gap-1.5 ${isSelected ? 'text-rose-500 font-black' : ''}`}
                    >
                      <span>{label}</span>
                      {cat.badgeText && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-rose-600/20 text-rose-400 border border-rose-500/30">
                          {cat.badgeText}
                        </span>
                      )}
                    </button>
                  );
                })}

              <button
                onClick={() => setActiveTab('plans')}
                className={`transition hover:text-white cursor-pointer text-amber-400 flex items-center gap-1 ${activeTab === 'plans' ? 'font-black underline' : ''}`}
              >
                <Crown className="w-3 h-3" /> {t('navPlans')}
              </button>
            </nav>
          </div>

          {/* Search, Language Switcher, Public Website & User Profile */}
          <div className="flex items-center gap-2.5">
            {/* OTT Search */}
            <div className="relative hidden sm:block w-48 md:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchOTTPlaceholder')}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-full pl-10 pr-4 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-all shadow-inner"
              />
            </div>

            {/* Language Switcher (मराठी | हिंदी | English) */}
            <LanguageSwitcher variant="dark" />

            {/* Link back to News Website (Requirement 3: Connected but separate) */}
            <Link
              href="/website"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition shadow-sm"
              title={t('footerNewsPortal')}
            >
              <Newspaper className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden lg:inline">{t('navNewsWebsite')}</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            {/* Profile Avatar & Watchlist Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
              title={t('subscriberProfile')}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <span className="text-xs font-bold text-slate-200 hidden sm:inline pr-2">
                {currentUser?.name || t('myAccount')}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO FEATURED CAROUSEL */}
      {activeTab === 'all' && (() => {
        const heroMovie = allMovies[0] || defaultMovies[0];
        const heroTitle = heroMovie ? getContentTitle(heroMovie) : t('heroMovieTitle');
        const heroDesc = heroMovie ? (getContentDescription(heroMovie) || heroMovie.description) : t('heroMovieDesc');
        const heroBackdrop = heroMovie?.banner || heroMovie?.poster || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1800';
        const heroId = heroMovie?.id || 'mov-1';

        return (
        <section className="relative w-full h-[58vh] sm:h-[65vh] min-h-[420px] sm:min-h-[460px] max-h-[640px] overflow-hidden bg-slate-950">
          {/* Ambient Blurred Backdrop Layer for smooth edge fill */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={heroBackdrop}
              alt="Hero Backdrop Blur"
              className="w-full h-full object-cover blur-2xl opacity-45 scale-110"
            />
          </div>

          {/* Foreground: FULL CRISP COVER IMAGE (Zero Cropping on mobile view, clear & vibrant) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={heroBackdrop}
              alt="Hero Backdrop"
              className="w-full h-full object-contain sm:object-cover object-top opacity-95 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070B14] via-[#070B14]/30 sm:via-[#070B14]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#070B14]/90 sm:from-[#070B14] via-[#070B14]/40 sm:via-[#070B14]/60 to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col justify-end pb-16 px-4 sm:px-8 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-glow-crimson flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> {t('trendingBadge')}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-400 border border-amber-400/30 text-[10px] font-bold">
                {heroMovie?.resolution || '4K UHD HDR'} • Dolby 5.1
              </span>
              {heroMovie?.isPremium && (
                <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 text-white border border-rose-500/30 text-[10px] font-black shadow-glow-crimson flex items-center gap-1">
                  <Crown className="w-3 h-3" /> VIP Premium
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-2xl leading-tight drop-shadow-md">
              {heroTitle}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl line-clamp-3 leading-relaxed drop-shadow">
              {heroDesc}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => heroMovie && handlePlayContent(heroMovie)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-black flex items-center gap-2 transition shadow-glow-crimson cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                {t('watchNowBtn')}
              </button>

              <button
                onClick={() => toggleWatchlist(heroId)}
                className={`px-4 py-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer backdrop-blur-md ${
                  watchlist.includes(heroId) 
                    ? 'bg-rose-600/30 border-rose-500 text-rose-300' 
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                }`}
              >
                {watchlist.includes(heroId) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {watchlist.includes(heroId) ? t('inWatchlist') : t('addToWatchlist')}
              </button>

              <button
                onClick={() => heroMovie && setDetailItem(heroMovie)}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition backdrop-blur-md cursor-pointer"
              >
                <Info className="w-4 h-4" /> {t('moreInfo')}
              </button>
            </div>
          </div>
        </section>
        );
      })()}

      {/* 2.5 DYNAMIC CATEGORIES PILLS BAR (Synced with Admin & Android App) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          <button
            onClick={() => { setSelectedGenre('all'); if (activeTab === 'plans') setActiveTab('all'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
              selectedGenre === 'all' && activeTab === 'all'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t('navAll')}
          </button>
          <button
            onClick={() => { setActiveTab('movies'); setSelectedGenre('all'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
              activeTab === 'movies' && selectedGenre === 'all'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t('navMovies')}
          </button>
          <button
            onClick={() => { setActiveTab('series'); setSelectedGenre('all'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
              activeTab === 'series' && selectedGenre === 'all'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t('navSeries')}
          </button>

          {/* Dynamic Categories from Admin & Android App */}
          {categories
            .filter(c => !['all', 'movies', 'movie', 'series', 'web-series'].includes((c.slug || c.nameEnglish || '').toLowerCase()))
            .map(cat => {
              const label = lang === 'mr' && cat.nameMarathi ? cat.nameMarathi : (lang === 'hi' && cat.nameMarathi ? cat.nameMarathi : cat.nameEnglish);
              const isSelected = selectedGenre.toLowerCase() === cat.nameEnglish.toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveTab('all');
                    setSelectedGenre(cat.nameEnglish);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{label}</span>
                  {cat.badgeText && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-black/40 text-amber-300">
                      {cat.badgeText}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </section>

      {/* 3. CONTINUE WATCHING / WATCH HISTORY (MANDATORY REQUIREMENT E) */}
      {currentUser && (() => {
        const continueMovie = allMovies[0] || defaultMovies[0];
        return (
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2 tracking-wide">
              <Clock className="w-4 h-4 text-rose-500" />
              {t('continueWatching')}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">{t('syncedAcrossDevices')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-3 flex gap-3.5 items-center group">
              <div className="relative w-28 h-18 rounded-xl overflow-hidden shrink-0 bg-slate-950">
                <img 
                  src={getSafeImageUrl(continueMovie.poster || continueMovie.banner)} 
                  alt={getContentTitle(continueMovie)} 
                  onError={(e) => handleImageError(e)}
                  className="w-full h-full object-cover" 
                />
                <button
                  onClick={() => handlePlayContent(continueMovie)}
                  className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-rose-600/90 text-white flex items-center justify-center transition group-hover:scale-110 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden space-y-1.5">
                <h4 className="font-bold text-xs text-white truncate">{getContentTitle(continueMovie)}</h4>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-600 h-full w-[65%]" />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{t('minutesRemaining')}</span>
                  <span className="text-rose-400 font-bold">{t('resume4K')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        );
      })()}

      {/* 4. LIVE TV STREAMING SECTION (MANDATORY REQUIREMENT B) */}
      {(activeTab === 'all' || activeTab === 'live') && (
        <section id="live-section" className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  {t('liveSatelliteFeeds')}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <Radio className="w-6 h-6 text-rose-500 animate-pulse" />
                {t('liveChannelsHeading')}
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400 hidden sm:inline">
              {t('adaptiveHlsLatency')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayChannels.map(ch => (
              <div
                key={ch.id}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl hover:border-rose-500/50 transition-all duration-300 group"
              >
                {/* Poster / Live Stream Overlay */}
                <div className="relative h-52 w-full bg-slate-950 overflow-hidden">
                  <img
                    src={ch.poster}
                    alt={ch.channelName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-glow-crimson animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      {t('liveOnAir')}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-slate-300 border border-white/10 text-[10px] font-bold">
                      {ch.resolution}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 text-xs font-bold">
                    <Users className="w-3.5 h-3.5 text-rose-400" />
                    <span>{(ch.viewersCount || 1000).toLocaleString()} {t('liveViewers')}</span>
                  </div>

                  {/* Play Button Overlay */}
                  <button
                    onClick={() => handlePlayChannel(ch)}
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-rose-600/90 text-white flex items-center justify-center transition group-hover:scale-110 shadow-2xl backdrop-blur-sm cursor-pointer"
                  >
                    <Play className="w-6 h-6 fill-white translate-x-0.5" />
                  </button>

                  {/* Current Program info */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                    <img 
                      src={ch.logo || '/app_logo.png'} 
                      alt={getChannelTitle(ch)} 
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.src.includes('app_logo.png')) {
                          target.src = '/app_logo.png';
                        }
                      }}
                      className="w-12 h-12 rounded-xl object-contain bg-white p-1 border-2 border-white/30 shadow-md shrink-0" 
                    />
                    <div className="overflow-hidden">
                      <h3 className="font-black text-base text-white truncate drop-shadow">{getChannelTitle(ch)}</h3>
                      <p className="text-xs text-amber-300 font-semibold truncate">
                        🔴 {t('currentProgram')}: {getChannelProgramTitle(ch)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 flex items-center justify-between text-xs">
                  <p className="text-slate-400 line-clamp-1 flex-1 pr-3">
                    {getChannelDescription(ch)}
                  </p>
                  <button
                    onClick={() => handlePlayChannel(ch)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{t('watchLive')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. MOVIES SHOWCASE (MANDATORY REQUIREMENT D & A) */}
      {(activeTab === 'all' || activeTab === 'movies') && (
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Film className="w-6 h-6 text-rose-500" />
              {t('moviesHeading')}
            </h2>

            {/* Language & Genre Filter Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* 3-Language Filter Selector */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                <button
                  onClick={() => setSelectedLanguage('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedLanguage === 'all'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('filterAllLanguages')}
                </button>
                <button
                  onClick={() => setSelectedLanguage('mr')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedLanguage === 'mr'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'en' ? 'Marathi' : 'मराठी'}
                </button>
                <button
                  onClick={() => setSelectedLanguage('hi')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedLanguage === 'hi'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'en' ? 'Hindi' : 'हिंदी'}
                </button>
                <button
                  onClick={() => setSelectedLanguage('en')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedLanguage === 'en'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  English
                </button>
              </div>

              {/* Genre Filter */}
              <div className="hidden lg:flex items-center gap-1.5">
                {['all', 'मराठी चित्रपट', 'हिंदी फ़िल्में', 'English Movies', 'ग्रामीण कथा'].map(g => (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedGenre === g 
                        ? 'bg-slate-700 text-white' 
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    {g === 'all' ? t('filterAllGenresOption') : formatGenre(g)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredMovies.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
              <Film className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm font-medium">चित्रपट उपलब्ध नाहीत किंवा शोध परिणामात सापडले नाहीत.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredMovies.map(movie => (
                <div
                  key={movie.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-rose-500/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                  onClick={() => setDetailItem(movie)}
                >
                  <div>
                    <div className="relative aspect-[2/3] w-full bg-slate-950 overflow-hidden">
                      <img
                        src={getSafeImageUrl(movie.poster || movie.banner || (movie.videoId ? `/api/bunny/thumbnail?videoId=${movie.videoId}` : ''), 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80')}
                        alt={getContentTitle(movie)}
                        onError={(e) => handleImageError(e, 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80')}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-amber-400 text-[9px] font-black border border-amber-500/30">
                          {movie.resolution || '4K UHD'}
                        </span>
                        {movie.isPremium && (
                          <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-rose-600 to-amber-600 text-white text-[9px] font-black shadow-glow-crimson flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5" /> VIP
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); handlePlayContent(movie); }}
                        className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-glow-crimson"
                      >
                        <Play className="w-4 h-4 fill-white translate-x-0.5" />
                      </button>
                    </div>

                    <div className="p-3 space-y-1">
                      <h3 className="font-bold text-xs text-white truncate group-hover:text-rose-400 transition">
                        {getContentTitle(movie)}
                      </h3>
                      <p className="text-[10px] text-slate-400 truncate">
                        {(movie.genres || []).map(formatGenre).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="px-3 pb-3 pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80">
                    <span className="font-mono">{movie.rating || 'U/A'}</span>
                    <span>{(movie.views || 0).toLocaleString()} {t('viewsCountSuffix')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 6. WEB SERIES DRILLDOWN (MANDATORY REQUIREMENT D) */}
      {(activeTab === 'all' || activeTab === 'series') && (
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Tv className="w-6 h-6 text-purple-500" />
              {t('seriesHeading')}
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{t('seasonEpisodesBadge')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSeries.map(series => (
              <div
                key={series.id}
                onClick={() => setDetailItem(series)}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-purple-500/50 transition-all cursor-pointer group"
              >
                <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                  <img 
                    src={getSafeImageUrl(series.banner || series.poster)} 
                    alt={getContentTitle(series)} 
                    onError={(e) => handleImageError(e)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                    <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold text-[10px]">
                      {t('season1Badge')}
                    </span>
                    {series.isPremium && (
                      <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-[10px] shadow-glow-crimson flex items-center gap-1">
                        <Crown className="w-3 h-3" /> VIP
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-sm text-white group-hover:text-purple-400 transition">{getContentTitle(series)}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{getContentDescription(series)}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                    <span>{t('episodesCount5')}</span>
                    <span className="text-amber-400 font-bold">{t('ep1FreePreview')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. SUBSCRIPTION PLANS SECTION (MANDATORY REQUIREMENT I) */}
      {(activeTab === 'all' || activeTab === 'plans') && (
        <section id="plans-section" className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold inline-flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" /> {t('vipMonetizationBadge')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {t('subscribeHeading')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {t('noHiddenFees')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {displayPlans.map(plan => (
              <div
                key={plan.id}
                className={`rounded-3xl p-7 flex flex-col justify-between space-y-6 border transition-all duration-300 relative ${
                  plan.isPopular 
                    ? 'bg-gradient-to-b from-rose-950/60 via-slate-900 to-slate-950 border-rose-500 shadow-glow-crimson scale-105' 
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black text-[10px] tracking-wider uppercase shadow-md">
                    {t('mostPopular')}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-white">{getPlanName(plan)}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{plan.durationDays} {t('daysValidity')}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-white">₹{plan.price}</span>
                    <span className="text-xs text-slate-400 font-medium">/ {plan.durationDays} {t('daysUnit')}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 text-amber-300 font-bold border border-white/10">
                      {plan.resolution}
                    </span>
                    <span className="text-slate-400 font-medium">
                      {plan.maxDevices} {t('devicesSimultaneous')}
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
                    {getPlanFeatures(plan.id).map((f, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlanForCheckout(plan)}
                  className={`w-full py-3 rounded-2xl font-black text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-2 ${
                    plan.isPopular
                      ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-glow-crimson'
                      : 'bg-white hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>{t('subscribeBtn')}</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#04060B] py-12 px-4 sm:px-8 text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">
                AURORA OTT • {lang === 'en' ? 'Namdar Maharashtra' : 'नामदार महाराष्ट्र'}
              </p>
              <p className="text-[10px] text-slate-500">Bunny Stream ABR 4K Edge Delivery Architecture</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-semibold">
            <Link href="/" className="text-orange-400 hover:underline">{t('footerNewsPortal')}</Link>
            <button onClick={() => setActiveTab('live')} className="hover:text-white cursor-pointer">{t('footerLiveTV')}</button>
            <button onClick={() => setActiveTab('movies')} className="hover:text-white cursor-pointer">{t('footerMovies')}</button>
            <button onClick={() => setActiveTab('plans')} className="hover:text-white cursor-pointer">{t('footerPlans')}</button>
            <Link href="/login" className="hover:text-white">{t('adminLogin')}</Link>
          </div>
        </div>
      </footer>

      {/* ================= MODALS ================= */}

      {/* A. ADAPTIVE BITRATE VIDEO STREAMING PLAYER MODAL */}
      {playingVideo && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="w-full max-w-5xl bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden p-3 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-white px-2">
              <div className="flex items-center gap-2">
                {playingVideo.isLive && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                )}
                <h3 className="font-black text-sm tracking-wide truncate max-w-lg">
                  {playingVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setPlayingVideo(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-rose-600 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <VideoPlayer
              src={playingVideo.src}
              poster={playingVideo.poster}
              title={playingVideo.title}
              subtitle={playingVideo.subtitle}
              isLive={playingVideo.isLive}
              onClose={() => setPlayingVideo(null)}
            />
          </div>
        </div>
      )}

      {/* B. CONTENT DETAILS MODAL */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="relative h-64 sm:h-72 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
              <div className="absolute inset-0 overflow-hidden">
                <img 
                  src={getSafeImageUrl(detailItem.banner || detailItem.poster)} 
                  alt={getContentTitle(detailItem)} 
                  className="w-full h-full object-cover blur-2xl opacity-40 scale-110" 
                />
              </div>
              <img 
                src={getSafeImageUrl(detailItem.banner || detailItem.poster)} 
                alt={getContentTitle(detailItem)} 
                onError={(e) => handleImageError(e)}
                className="relative z-10 max-w-full max-h-full object-contain" 
              />
              <button
                onClick={() => setDetailItem(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => { const item = detailItem; setDetailItem(null); handlePlayContent(item); }}
                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-glow-crimson hover:scale-110 transition"
              >
                <Play className="w-6 h-6 fill-white translate-x-0.5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]">
                  {detailItem.resolution || '4K UHD'}
                </span>
                <span className="text-xs text-amber-400 font-bold">{detailItem.rating || 'U/A'}</span>
                <span className="text-xs text-slate-400 font-mono">{(detailItem.views || 0).toLocaleString()} {t('viewsCountSuffix')}</span>
              </div>
              <h3 className="font-black text-xl text-white">{getContentTitle(detailItem)}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{getContentDescription(detailItem)}</p>
            </div>

            {detailItem.cast && detailItem.cast.length > 0 && (
              <div className="text-xs space-y-1 pt-2 border-t border-slate-800">
                <p className="text-slate-400"><strong>{t('castLabel')}:</strong> {detailItem.cast.join(', ')}</p>
                {detailItem.director && <p className="text-slate-400"><strong>{t('directorLabel')}:</strong> {detailItem.director}</p>}
              </div>
            )}

            <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => { const item = detailItem; setDetailItem(null); handlePlayContent(item); }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow-crimson"
              >
                <Play className="w-4 h-4 fill-white" /> {t('playNow')}
              </button>
              <button
                onClick={() => toggleWatchlist(detailItem.id)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                {watchlist.includes(detailItem.id) ? t('removeFromWatchlist') : t('addToWatchlist')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. SUBSCRIPTION CHECKOUT MODAL (RAZORPAY SIMULATION) */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">{t('vipCheckoutTitle')}</h3>
              </div>
              <button onClick={() => setSelectedPlanForCheckout(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-white">{t('paymentSuccessful')}</h4>
                <p className="text-xs text-slate-300">{t('planActivatedDesc')}</p>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="space-y-3.5">
                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">{getPlanName(selectedPlanForCheckout)}</p>
                    <p className="text-[10px] text-slate-400">{selectedPlanForCheckout.durationDays} {t('daysValidity')} • 4K HDR</p>
                  </div>
                  <span className="font-black text-xl text-emerald-400">₹{selectedPlanForCheckout.price}</span>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">{t('mobileOrUpiId')}</label>
                  <input
                    type="text"
                    required
                    defaultValue={currentUser?.phone || '+91 98221 44520'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <p className="font-bold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {t('razorpaySecure')}
                  </p>
                  <p>{t('acceptedPaymentMethods')}</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition shadow-md"
                >
                  ₹{selectedPlanForCheckout.price} {t('payAndActivate')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* D. USER PROFILE & ACTIVE DEVICES MODAL (MANDATORY REQUIREMENT E & ACCOUNT SECTION CMS) */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="max-w-xl w-full bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl p-5 sm:p-6 space-y-4 text-xs max-h-[92vh] overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="font-black text-sm sm:text-base text-white">
                  {lang === 'mr' ? 'माझे खाते व ॲप माहिती (Account & App Info)' : lang === 'hi' ? 'मेरा खाता और ऐप जानकारी' : 'My Account & App Info'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowProfileModal(false);
                  setActiveCompanySection(null);
                }} 
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card */}
            <div className="flex items-center gap-3 p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center font-black text-base text-white uppercase shadow-md">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{currentUser?.name}</p>
                <p className="text-[11px] text-slate-400">{currentUser?.phone}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                  {currentUser?.planName || 'VIP Active'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">{t('myWatchlist')}</span>
                <span className="font-extrabold text-amber-400 text-xs">{watchlist.length} {t('moviesAndShowsCount')}</span>
              </div>
            </div>

            {/* Registered Devices Accordion / Summary */}
            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
              <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                {t('connectedDevices')} ({currentUser?.devices?.length || 0})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {currentUser?.devices?.map((dev, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800 text-[11px]">
                    <div className="truncate mr-2">
                      <p className="font-semibold text-slate-200 truncate">{dev.deviceName}</p>
                      <p className="text-[9px] text-slate-500 truncate">{dev.platform} • {dev.lastLogin}</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* 6 COMPANY & PORTAL OPTIONS (DISPLAYED ON ANDROID APP ACCOUNT SECTION) */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <p className="font-black text-slate-200 text-xs tracking-wide">
                  {lang === 'mr' ? '🏢 कंपनी व अधिकृत माहिती' : lang === 'hi' ? '🏢 कंपनी और आधिकारिक जानकारी' : '🏢 Company & Official Information'}
                </p>
                <span className="text-[10px] text-amber-400 font-bold">
                  {activeCompanySection ? (lang === 'mr' ? 'तपशील खाली पहा' : 'Viewing details below') : (lang === 'mr' ? 'पाहण्यासाठी टॅप करा' : 'Tap option to view')}
                </span>
              </div>

              {/* 6 Grid Tabs matching admin styling and user screenshot */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  {
                    key: 'company',
                    label: lang === 'mr' ? '1. कंपनी माहिती' : lang === 'hi' ? '1. कंपनी जानकारी' : '1. Company Info',
                    sublabel: 'Entity, CIN, MD, Reg.',
                    icon: Building2,
                  },
                  {
                    key: 'about',
                    label: lang === 'mr' ? '2. आमच्याबद्दल' : lang === 'hi' ? '2. हमारे बारे में' : '2. About Us',
                    sublabel: 'Mission, Vision, Story',
                    icon: BookOpen,
                  },
                  {
                    key: 'contact',
                    label: lang === 'mr' ? '3. संपर्क व सपोर्ट' : lang === 'hi' ? '3. संपर्क और सहायता' : '3. Contact Us',
                    sublabel: 'Address, Phones, Email',
                    icon: Phone,
                  },
                  {
                    key: 'news',
                    label: lang === 'mr' ? '4. बातम्या पोर्टल' : lang === 'hi' ? '4. समाचार पोर्टल' : '4. News Portal',
                    sublabel: 'Editor, Desk, Broadcast',
                    icon: Newspaper,
                  },
                  {
                    key: 'information',
                    label: lang === 'mr' ? '5. माहिती व धोरणे' : lang === 'hi' ? '5. सूचना एवं नीतियां' : '5. Information & Policy',
                    sublabel: 'Legal, Privacy, Grievance',
                    icon: ShieldCheck,
                  },
                  {
                    key: 'promotion',
                    label: lang === 'mr' ? '6. ओटीटी प्रमोशन' : lang === 'hi' ? '6. ओटीटी प्रमोशन' : '6. OTT Promotion',
                    sublabel: 'App Links, TV, Banners',
                    icon: Sparkles,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeCompanySection === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveCompanySection(isSelected ? null : item.key as any)}
                      className={`flex flex-col items-start p-3 rounded-2xl text-left border transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-600 shadow-lg ring-2 ring-amber-500/20'
                          : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:border-amber-500/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-100' : 'text-amber-400 group-hover:scale-110 transition-transform'}`} />
                        {isSelected && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                      </div>
                      <div className="font-extrabold text-[11px] sm:text-xs tracking-tight line-clamp-1">
                        {item.label}
                      </div>
                      <div className={`text-[9px] mt-0.5 line-clamp-1 ${isSelected ? 'text-amber-100' : 'text-slate-400'}`}>
                        {item.sublabel}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Detail Card when one of the 6 options is active */}
              {activeCompanySection && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                      {activeCompanySection === 'company' && <Building2 className="w-3.5 h-3.5" />}
                      {activeCompanySection === 'about' && <BookOpen className="w-3.5 h-3.5" />}
                      {activeCompanySection === 'contact' && <Phone className="w-3.5 h-3.5" />}
                      {activeCompanySection === 'news' && <Newspaper className="w-3.5 h-3.5" />}
                      {activeCompanySection === 'information' && <ShieldCheck className="w-3.5 h-3.5" />}
                      {activeCompanySection === 'promotion' && <Sparkles className="w-3.5 h-3.5" />}
                      {activeCompanySection === 'company' && (lang === 'mr' ? 'कंपनी माहिती' : 'Company Details')}
                      {activeCompanySection === 'about' && (lang === 'mr' ? 'आमच्याबद्दल व उद्दिष्टे' : 'About & Mission')}
                      {activeCompanySection === 'contact' && (lang === 'mr' ? 'संपर्क व सपोर्ट' : 'Contact Support')}
                      {activeCompanySection === 'news' && (lang === 'mr' ? 'बातम्या पोर्टल माहिती' : 'News Desk')}
                      {activeCompanySection === 'information' && (lang === 'mr' ? 'माहिती व कायदेशीर धोरणे' : 'Policies & Grievance')}
                      {activeCompanySection === 'promotion' && (lang === 'mr' ? 'ओटीटी ॲप प्रमोशन' : 'OTT Apps & Promo')}
                    </span>
                    <button
                      onClick={() => setActiveCompanySection(null)}
                      className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded-md bg-slate-800"
                    >
                      {lang === 'mr' ? 'बंद करा' : 'Close'}
                    </button>
                  </div>

                  {/* 1. Company Info Details */}
                  {activeCompanySection === 'company' && (
                    <div className="space-y-2 text-[11px] text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Brand & Legal Entity</span>
                        <p className="font-bold text-white text-xs">{companyInfo.companyName}</p>
                        <p className="text-slate-400 text-[10px]">{companyInfo.legalEntityName}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">CIN Number</span>
                          <span className="font-mono text-amber-300 font-bold">{companyInfo.cinNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">GSTIN</span>
                          <span className="font-mono text-slate-300">{companyInfo.gstNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Managing Director</span>
                          <span className="font-semibold text-white">{companyInfo.managingDirector}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Founded</span>
                          <span className="font-semibold text-slate-300">{companyInfo.foundedYear}</span>
                        </div>
                      </div>
                      {companyInfo.tagline && (
                        <p className="italic text-amber-400/90 text-[10px] pt-1 border-t border-slate-800/60">
                          "{companyInfo.tagline}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* 2. About Us Details */}
                  {activeCompanySection === 'about' && (
                    <div className="space-y-2 text-[11px] text-slate-300">
                      <p className="font-bold text-white text-xs">{companyInfo.aboutTitle}</p>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{companyInfo.aboutStory}</p>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <span className="text-amber-400 font-bold block text-[10px]">ध्येय (Mission):</span>
                        <p className="text-slate-300 text-[10px]">{companyInfo.mission}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <span className="text-amber-400 font-bold block text-[10px]">दृष्टीक्षेप (Vision):</span>
                        <p className="text-slate-300 text-[10px]">{companyInfo.vision}</p>
                      </div>
                      {companyInfo.regionalPresence && (
                        <p className="text-[10px] text-slate-400">
                          <span className="font-bold text-slate-300">विस्तार:</span> {companyInfo.regionalPresence}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 3. Contact Us Details */}
                  {activeCompanySection === 'contact' && (
                    <div className="space-y-2.5 text-[11px] text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Head Office (मुख्यालय)</span>
                        <p className="text-white font-medium flex items-start gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{companyInfo.headOfficeAddress}</span>
                        </p>
                      </div>
                      {companyInfo.branchOfficeAddress && (
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Branch Office (शाखा)</span>
                          <p className="text-slate-300 flex items-start gap-1.5 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>{companyInfo.branchOfficeAddress}</span>
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                        <a
                          href={`tel:${companyInfo.phone1}`}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold flex items-center justify-center gap-1.5 transition text-center"
                        >
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>Call: {companyInfo.phone1}</span>
                        </a>
                        <a
                          href={`https://wa.me/${companyInfo.whatsappHelpline.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-300 font-bold flex items-center justify-center gap-1.5 transition text-center"
                        >
                          <span>WhatsApp Chat</span>
                        </a>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <span>Email: <a href={`mailto:${companyInfo.contactEmail}`} className="text-amber-400 underline">{companyInfo.contactEmail}</a></span>
                        <span>{companyInfo.workingHours}</span>
                      </div>
                    </div>
                  )}

                  {/* 4. News Portal Details */}
                  {activeCompanySection === 'news' && (
                    <div className="space-y-2 text-[11px] text-slate-300">
                      <p className="font-bold text-white text-xs">{companyInfo.newsPortalName}</p>
                      <p className="text-slate-400 text-[10px]">Chief Editor: <span className="text-slate-200 font-semibold">{companyInfo.chiefEditor}</span></p>
                      <p className="text-slate-400 text-[10px]">Editorial Email: <span className="text-amber-400">{companyInfo.editorialDeskEmail}</span></p>
                      <p className="text-slate-400 text-[10px]">Broadcast: <span className="text-slate-300">{companyInfo.broadcastSchedule}</span></p>
                      {companyInfo.newsCategoriesSummary && (
                        <p className="text-slate-400 text-[10px]">Coverage: <span className="text-slate-300">{companyInfo.newsCategoriesSummary}</span></p>
                      )}
                      <Link
                        href="/website"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition mt-1"
                      >
                        <Newspaper className="w-3.5 h-3.5" />
                        <span>Visit News Portal Website</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  )}

                  {/* 5. Information & Policy Details */}
                  {activeCompanySection === 'information' && (
                    <div className="space-y-2 text-[11px] text-slate-300">
                      <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[10px] text-amber-200">
                        {companyInfo.informationNotice}
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">तक्रार निवारण अधिकारी (Grievance Officer)</span>
                        <p className="font-bold text-white text-xs">{companyInfo.grievanceOfficerName}</p>
                        <a href={`mailto:${companyInfo.grievanceOfficerEmail}`} className="text-amber-400 text-[10px] underline block mt-0.5">
                          {companyInfo.grievanceOfficerEmail}
                        </a>
                      </div>
                      {companyInfo.privacyPolicySummary && (
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Privacy Policy</span>
                          <p className="text-slate-300 text-[10px] line-clamp-2">{companyInfo.privacyPolicySummary}</p>
                        </div>
                      )}
                      {companyInfo.termsOfServiceSummary && (
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Terms of Service</span>
                          <p className="text-slate-300 text-[10px] line-clamp-2">{companyInfo.termsOfServiceSummary}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. OTT Promotion Details */}
                  {activeCompanySection === 'promotion' && (
                    <div className="space-y-2.5 text-[11px] text-slate-300">
                      <p className="font-bold text-white text-xs">{companyInfo.ottPromotionTitle}</p>
                      <p className="text-slate-400 text-[10px]">{companyInfo.ottPromotionTagline}</p>
                      {companyInfo.promoHighlights && (
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-amber-300 font-semibold">
                          ⭐ {companyInfo.promoHighlights}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={companyInfo.playStoreUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold flex items-center justify-center gap-1.5 transition text-center"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Google Play</span>
                        </a>
                        <a
                          href={companyInfo.androidTvAppUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold flex items-center justify-center gap-1.5 transition text-center"
                        >
                          <Tv className="w-3.5 h-3.5 text-blue-400" />
                          <span>Android TV</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setShowProfileModal(false);
                setActiveCompanySection(null);
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition"
            >
              {t('closeBtn')}
            </button>
          </div>
        </div>
      )}

      {/* MOBILE / ANDROID APP BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F19]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 flex items-center justify-around text-[10px] font-bold shadow-2xl">
        <button
          onClick={() => setActiveTab('movies')}
          className={`flex flex-col items-center gap-1 transition ${activeTab === 'movies' ? 'text-rose-500 font-black' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Film className="w-4 h-4" />
          <span>{t('navMovies')}</span>
        </button>
        <button
          onClick={() => setActiveTab('series')}
          className={`flex flex-col items-center gap-1 transition ${activeTab === 'series' ? 'text-rose-500 font-black' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Tv className="w-4 h-4" />
          <span>{t('navSeries')}</span>
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex flex-col items-center gap-1 transition ${activeTab === 'plans' ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Crown className="w-4 h-4" />
          <span>VIP</span>
        </button>
        <button
          onClick={() => setShowProfileModal(true)}
          className={`flex flex-col items-center gap-1 transition ${showProfileModal ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Users className="w-4 h-4" />
          <span>{t('myAccount') || 'खाते'}</span>
        </button>
      </nav>
    </div>
  );
}

