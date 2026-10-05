'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Home,
  RadioTower, 
  Tv, 
  Newspaper, 
  MapPin, 
  Search, 
  Calendar, 
  User, 
  Users, 
  Eye, 
  Phone, 
  Mail, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  AlertCircle, 
  Megaphone, 
  Share2, 
  ExternalLink, 
  ShieldCheck, 
  Building, 
  Info, 
  Send, 
  Menu, 
  X, 
  Play, 
  LogIn, 
  Film, 
  Headphones,
  Flame,
  Star,
  Compass,
  Radio,
  SlidersHorizontal,
  Bookmark,
  Landmark,
  FileText,
  Award,
  TrendingUp,
  Server
} from 'lucide-react';
import { firestoreService } from '@/lib/firestore-service';
import { ContentItem, Advertisement, LiveChannel } from '@/lib/types';
import { getSafeImageUrl, handleImageError } from '@/lib/image-utils';
import { VideoPlayer } from '@/components/video-player';
import { getAllDistricts, getTalukasForDistrict, getVillagesForTaluka } from '@/lib/location-data';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/language-switcher';

// -------------------------------------------------------------
// 3D / Flat Styled Navigation Icons
// -------------------------------------------------------------
function NavHome3DIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="navHomeRoof" x1="8" y1="20" x2="24" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>
        <linearGradient id="navHomeRoofShade" x1="24" y1="6" x2="40" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
        <linearGradient id="navHomeWall" x1="12" y1="18" x2="36" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="100%" stopColor="#FEF3C7" />
        </linearGradient>
        <linearGradient id="navHomeDoor" x1="24" y1="26" x2="32" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="42" rx="16" ry="3" fill="#000000" fillOpacity="0.16" />
      <rect x="30" y="10" width="5.5" height="9" rx="1.5" fill="#C2410C" />
      <rect x="29" y="8.5" width="7.5" height="2.5" rx="1" fill="#EA580C" />
      <circle cx="34" cy="6" r="1.5" fill="#E2E8F0" opacity="0.8" />
      <circle cx="36" cy="3.5" r="2" fill="#E2E8F0" opacity="0.5" />
      <rect x="11" y="19" width="26" height="21" rx="3.5" fill="url(#navHomeWall)" stroke="#D97706" strokeWidth="1" />
      <rect x="14.5" y="24" width="7.5" height="7.5" rx="1.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
      <line x1="18.25" y1="24" x2="18.25" y2="31.5" stroke="#BAE6FD" strokeWidth="0.9" />
      <line x1="14.5" y1="27.75" x2="22" y2="27.75" stroke="#BAE6FD" strokeWidth="0.9" />
      <rect x="25.5" y="25" width="8.5" height="15" rx="2" fill="url(#navHomeDoor)" />
      <circle cx="27.5" cy="32.5" r="1" fill="#FCD34D" />
      <path d="M7 20L24 5L41 20L37 22L24 9.5L11 22L7 20Z" fill="url(#navHomeRoof)" />
      <path d="M24 5L41 20H34L24 10.5L14 20H7L24 5Z" fill="url(#navHomeRoofShade)" opacity="0.3" />
      <path d="M8 20.5L24 6.5L40 20.5" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function NavCompany3DIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="navCompTower" x1="15" y1="8" x2="33" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="60%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        <linearGradient id="navCompLeft" x1="6" y1="18" x2="17" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="navCompRight" x1="31" y1="22" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="43" rx="18" ry="3" fill="#000000" fillOpacity="0.16" />
      <rect x="7" y="20" width="10" height="22" rx="2.5" fill="url(#navCompLeft)" />
      <rect x="9.5" y="23" width="2" height="2" rx="0.5" fill="#DBEAFE" />
      <rect x="13" y="23" width="2" height="2" rx="0.5" fill="#DBEAFE" />
      <rect x="9.5" y="28" width="2" height="2" rx="0.5" fill="#DBEAFE" />
      <rect x="13" y="28" width="2" height="2" rx="0.5" fill="#DBEAFE" />
      <rect x="9.5" y="33" width="2" height="2" rx="0.5" fill="#DBEAFE" />
      <rect x="13" y="33" width="2" height="2" rx="0.5" fill="#DBEAFE" />
      <rect x="31" y="23" width="10" height="19" rx="2.5" fill="url(#navCompRight)" />
      <rect x="33.5" y="26" width="2" height="2" rx="0.5" fill="#DBEAFE" />
      <rect x="37" y="26" width="2" height="2" rx="0.5" fill="#DBEAFE" />
      <rect x="33.5" y="31" width="2" height="2" rx="0.5" fill="#DBEAFE" />
      <rect x="37" y="31" width="2" height="2" rx="0.5" fill="#DBEAFE" />
      <rect x="15" y="10" width="18" height="32" rx="3.5" fill="url(#navCompTower)" stroke="#93C5FD" strokeWidth="0.8" />
      <line x1="24" y1="4" x2="24" y2="10" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="3.5" r="2.2" fill="#EF4444" />
      <rect x="18" y="14" width="3" height="3" rx="0.5" fill="#FEF08A" />
      <rect x="23" y="14" width="3" height="3" rx="0.5" fill="#FEF08A" />
      <rect x="27" y="14" width="3" height="3" rx="0.5" fill="#FEF08A" />
      <rect x="18" y="20" width="3" height="3" rx="0.5" fill="#BAE6FD" />
      <rect x="23" y="20" width="3" height="3" rx="0.5" fill="#FEF08A" />
      <rect x="27" y="20" width="3" height="3" rx="0.5" fill="#BAE6FD" />
      <rect x="18" y="26" width="3" height="3" rx="0.5" fill="#BAE6FD" />
      <rect x="23" y="26" width="3" height="3" rx="0.5" fill="#BAE6FD" />
      <rect x="27" y="26" width="3" height="3" rx="0.5" fill="#FEF08A" />
      <rect x="21" y="34.5" width="6" height="7.5" rx="1" fill="#0F172A" />
      <rect x="22" y="35.5" width="4" height="6.5" rx="0.5" fill="#38BDF8" opacity="0.85" />
    </svg>
  );
}

function NavAbout3DIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="navAboutGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="45%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0284C7" />
        </radialGradient>
        <linearGradient id="navAboutRing" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="42" rx="14" ry="3" fill="#000000" fillOpacity="0.18" />
      <circle cx="24" cy="23" r="18.5" fill="url(#navAboutRing)" opacity="0.35" />
      <circle cx="24" cy="23" r="16.5" fill="url(#navAboutGrad)" />
      <ellipse cx="20" cy="14" rx="7.5" ry="3.5" fill="#FFFFFF" fillOpacity="0.45" transform="rotate(-22 20 14)" />
      <circle cx="24" cy="15.5" r="2.5" fill="#FFFFFF" />
      <rect x="21.5" y="20.5" width="5" height="11" rx="2" fill="#FFFFFF" />
      <path d="M19.5 22H24" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <path d="M19.5 31.5H28.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function NavContact3DIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="navContactBg" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="60%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064E3B" />
        </radialGradient>
      </defs>
      <ellipse cx="24" cy="42" rx="14" ry="3" fill="#000000" fillOpacity="0.18" />
      <rect x="6.5" y="5.5" width="35" height="35" rx="12" fill="url(#navContactBg)" />
      <rect x="8.5" y="7.5" width="31" height="15" rx="9" fill="#FFFFFF" fillOpacity="0.22" />
      <path 
        d="M17 16C17.8 15.2 19 15.2 19.8 16L22 18.2C22.8 19 22.8 20.2 22 21L20.8 22.2C21.9 24.4 23.6 26.1 25.8 27.2L27 26C27.8 25.2 29 25.2 29.8 26L32 28.2C32.8 29 32.8 30.2 32 31L30.2 32.8C29.2 33.8 27.5 34.1 25.8 33.1C20.8 30.5 17.5 27.2 14.9 22.2C13.9 20.5 14.2 18.8 15.2 17.8L17 16Z" 
        fill="#FFFFFF" 
      />
      <path d="M28 13.5C31.5 15 34.5 18 35 22" stroke="#FEF08A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M25 16.5C27.2 17.5 29 19.5 29.5 22" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function NavNews3DIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="navNewsFold" x1="10" y1="8" x2="38" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id="navNewsHeader" x1="10" y1="12" x2="35" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
        <linearGradient id="navNewsBack" x1="14" y1="6" x2="42" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="42" rx="16" ry="3" fill="#000000" fillOpacity="0.16" />
      <rect x="14" y="6" width="27" height="33" rx="3" fill="url(#navNewsBack)" transform="rotate(4 27.5 22.5)" />
      <rect x="7" y="9" width="30" height="32" rx="3" fill="url(#navNewsFold)" stroke="#CBD5E1" strokeWidth="1" />
      <rect x="10" y="12" width="24" height="6" rx="1.5" fill="url(#navNewsHeader)" />
      <rect x="12" y="14" width="10" height="2" rx="0.5" fill="#FFFFFF" />
      <circle cx="31" cy="15" r="1.2" fill="#FEF08A" />
      <rect x="10" y="21" width="10" height="9" rx="1" fill="#38BDF8" />
      <circle cx="13" cy="24" r="1" fill="#FEF08A" />
      <path d="M10 28L14 24L17 27L20 25" stroke="#0284C7" strokeWidth="0.8" />
      <rect x="22" y="21" width="12" height="2" rx="1" fill="#475569" />
      <rect x="22" y="25" width="12" height="2" rx="1" fill="#94A3B8" />
      <rect x="22" y="29" width="8" height="2" rx="1" fill="#94A3B8" />
      <rect x="10" y="33" width="24" height="2" rx="1" fill="#64748B" />
      <rect x="10" y="37" width="18" height="1.8" rx="0.9" fill="#94A3B8" />
    </svg>
  );
}

function NavInfoService3DIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="navInfoGrad" x1="8" y1="6" x2="36" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#7E22CE" />
        </linearGradient>
        <linearGradient id="navInfoPaper" x1="12" y1="10" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F5F3FF" />
        </linearGradient>
        <radialGradient id="navGoldSeal" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="70%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </radialGradient>
      </defs>
      <ellipse cx="24" cy="42" rx="15" ry="3" fill="#000000" fillOpacity="0.16" />
      <rect x="8" y="7" width="28" height="34" rx="3.5" fill="url(#navInfoGrad)" />
      <rect x="11" y="9" width="26" height="30" rx="2.5" fill="url(#navInfoPaper)" stroke="#DDD6FE" strokeWidth="0.8" />
      <rect x="15" y="14" width="14" height="2.5" rx="1" fill="#7E22CE" />
      <rect x="15" y="19" width="18" height="2" rx="1" fill="#C4B5FD" />
      <rect x="15" y="23" width="18" height="2" rx="1" fill="#C4B5FD" />
      <rect x="15" y="27" width="12" height="2" rx="1" fill="#C4B5FD" />
      <circle cx="31" cy="30" r="6" fill="url(#navGoldSeal)" stroke="#B45309" strokeWidth="0.8" />
      <path d="M29 30L30.5 31.5L33.5 28.5" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 35L27 40L30 38.5L31 35" fill="#EAB308" />
      <path d="M31 35L32 38.5L35 40L34 35" fill="#CA8A04" />
    </svg>
  );
}

function NavGrievance3DIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="navHornGrad" x1="10" y1="16" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="50%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
        <linearGradient id="navRimGrad" x1="30" y1="12" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="42" rx="15" ry="3" fill="#000000" fillOpacity="0.18" />
      <path d="M17 28L13 38C12.5 39.2 13.5 40.5 14.8 40.5H18C19 40.5 19.8 39.7 20 38.7L21.5 28" fill="#475569" />
      <path d="M15 30L13.5 35" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />
      <path d="M13 20C13 18.5 14 18 16 18.5L31 13V33L16 27.5C14 28 13 27.5 13 26V20Z" fill="url(#hornGrad)" />
      <rect x="9" y="19" width="5" height="8" rx="2.5" fill="#334155" />
      <ellipse cx="31" cy="23" rx="3.5" ry="10" fill="url(#navRimGrad)" stroke="#B45309" strokeWidth="0.8" />
      <path d="M16 19.5L30 14.5" stroke="#FCA5A5" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M37 17C39 19 40 21 40 23C40 25 39 27 37 29" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M41 13C44 16 45 19.5 45 23C45 26.5 44 30 41 33" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function PublicWebsitePage() {
  const { lang, t } = useLanguage();
  const [newsItems, setNewsItems] = useState<ContentItem[]>([]);
  const [featuredMovies, setFeaturedMovies] = useState<ContentItem[]>([]);
  const [featuredSeries, setFeaturedSeries] = useState<ContentItem[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [liveChannels, setLiveChannels] = useState<LiveChannel[]>([]);
  const [activePlayingChannel, setActivePlayingChannel] = useState<LiveChannel | null>(null);
  const [activePlayingContent, setActivePlayingContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedTaluka, setSelectedTaluka] = useState<string>('All');
  const [selectedVillage, setSelectedVillage] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('सर्व');

  // Modal for reading news
  const [activeNews, setActiveNews] = useState<ContentItem | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Localization Helpers
  const formatLocationLabel = (val: string | undefined, currentLang: string): string => {
    if (!val || val === 'All') return val || '';
    const match = val.match(/^([^(]+)\s*\(([^)]+)\)$/);
    if (!match) return val;
    if (currentLang === 'en') return match[1].trim();
    return match[2].trim();
  };

  const formatSubCategory = (cat: string, currentLang: string) => {
    if (!cat) return '';
    const mapping: Record<string, { mr: string; hi: string; en: string }> = {
      'शेतकरी बातम्या': { mr: 'शेतकरी बातम्या', hi: 'किसान समाचार', en: 'Farmer News' },
      'ग्रामीण विकास': { mr: 'ग्रामीण विकास', hi: 'ग्रामीण विकास', en: 'Rural Development' },
      'स्थानिक प्रशासन': { mr: 'स्थानिक प्रशासन', hi: 'स्थानीय प्रशासन', en: 'Local Governance' },
      'बाजारभाव': { mr: 'बाजारभाव', hi: 'मंडी भाव', en: 'Market Rates' },
      'राजकीय': { mr: 'राजकीय', hi: 'राजनीति', en: 'Politics' },
      'News': { mr: 'बातम्या', hi: 'समाचार', en: 'News' },
    };
    if (mapping[cat]) {
      return mapping[cat][currentLang as 'mr' | 'hi' | 'en'] || mapping[cat].en;
    }
    return cat;
  };

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '', district: 'Pune (पुणे)' });
  const [contactSuccess, setContactSuccess] = useState(false);

  // Grievance form state
  const [grievanceForm, setGrievanceForm] = useState({ title: '', citizenName: '', contactNumber: '', district: 'Pune (पुणे)', taluka: '', description: '' });
  const [grievanceSuccess, setGrievanceSuccess] = useState(false);

  const districts = ['All', ...getAllDistricts()];
  const availableTalukas = selectedDistrict !== 'All' ? ['All', ...getTalukasForDistrict(selectedDistrict)] : ['All'];
  const availableVillages = selectedDistrict !== 'All' && selectedTaluka !== 'All' ? ['All', ...getVillagesForTaluka(selectedDistrict, selectedTaluka)] : ['All'];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [allContent, allAds, allChannels] = await Promise.all([
          firestoreService.getContent(),
          firestoreService.getAds(),
          firestoreService.getLiveChannels(),
        ]);

        const newsList = allContent.filter(c => c.type === 'news' || (c.genres && c.genres.includes('News')));
        const moviesList = allContent.filter(c => c.type === 'movie');
        const seriesList = allContent.filter(c => c.type === 'series');

        setNewsItems(newsList);
        setFeaturedMovies(moviesList);
        setFeaturedSeries(seriesList);
        setAds(allAds.filter(a => a.status === 'active'));
        setLiveChannels(allChannels || []);
      } catch (err) {
        console.error('Failed to load website content:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDistrictChange = (d: string) => {
    setSelectedDistrict(d);
    setSelectedTaluka('All');
    setSelectedVillage('All');
  };

  const handleTalukaChange = (t: string) => {
    setSelectedTaluka(t);
    setSelectedVillage('All');
  };

  // Default fallback movies for rich display
  const defaultFallbackMovies: ContentItem[] = [
    {
      id: 'mov-sairat-01',
      title: 'सैराट (Sairat)',
      slug: 'sairat',
      description: 'महाराष्ट्रातील सुपरहिट आणि संवेदनशील प्रेमकथा, ज्याने भारतीय चित्रपटसृष्टीवर नवा इतिहास घडवला.',
      poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
      banner: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600',
      genres: ['मराठी चित्रपट', 'रोमँटिक ड्रामा'],
      cast: ['रिंकू राजगुरू', 'आकाश ठोसर'],
      director: 'नागराज मंजुळे',
      rating: 'U/A',
      type: 'movie',
      status: 'published',
      isFeatured: true,
      views: 342000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      releaseDate: '2026',
      language: ['मराठी'],
      durationMinutes: 174,
      videoId: '33e80d55-f8ce-4e26-9b9c-4084da8cd816',
      videoUrl: 'https://vz-1192802e-f33.b-cdn.net/33e80d55-f8ce-4e26-9b9c-4084da8cd816/playlist.m3u8'
    },
    {
      id: 'mov-pawankhind-02',
      title: 'पावनखिंड (Pawankhind)',
      slug: 'pawankhind',
      description: 'वीर बाजीप्रभू देशपांडे आणि तीनशे बांदल मावळ्यांच्या अतुलनीय पराक्रमाची आणि बलिदानाची ज्वलंत गाथा.',
      poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
      banner: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600',
      genres: ['ऐतिहासिक', 'शौर्यगाथा'],
      cast: ['चिन्मय मांडलेकर', 'अजय पूरकर'],
      director: 'दिग्पाल लांजेकर',
      rating: 'U',
      type: 'movie',
      status: 'published',
      isFeatured: true,
      views: 289000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      releaseDate: '2026',
      language: ['मराठी'],
      durationMinutes: 153
    },
    {
      id: 'mov-natarang-03',
      title: 'नटरंग (Natarang)',
      slug: 'natarang',
      description: 'कला आणि पुरुषार्थाच्या संघर्षात कलावंताचे धगधगते जीवन मांडणारा राष्ट्रीय पुरस्कार विजेता चित्रपट.',
      poster: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800',
      banner: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1600',
      genres: ['संगीतमय', 'ड्रामा'],
      cast: ['अतुल कुलकर्णी', 'सोनाली कुलकर्णी'],
      director: 'रवी जाधव',
      rating: 'U',
      type: 'movie',
      status: 'published',
      isFeatured: true,
      views: 198000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      releaseDate: '2026',
      language: ['मराठी'],
      durationMinutes: 130
    }
  ];

  const defaultFallbackSeries: ContentItem[] = [
    {
      id: 'ser-graminkatha-01',
      title: 'ग्रामीण कथा (Gramin Katha)',
      slug: 'gramin-katha',
      description: 'महाराष्ट्रातील खेड्यापाड्यातील सत्य घटना, स्थानिक संघटन आणि शेतकरी जीवनावर आधारित मूळ वेब मालिका.',
      poster: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
      banner: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600',
      genres: ['वेब मालिका', 'ग्रामीण जीवन'],
      cast: ['स्थानिक कलाकार'],
      director: 'ग्रामीण भारत प्रॉडक्शन्स',
      rating: 'U',
      type: 'series',
      status: 'published',
      isFeatured: true,
      views: 125000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      releaseDate: '2026',
      language: ['मराठी']
    }
  ];

  const defaultNews: ContentItem[] = [
    {
      id: 'news-def-1',
      type: 'news',
      title: 'पुणे जिल्ह्यातील शेतकऱ्यांसाठी आधुनिक ठिबक सिंचन योजना जाहीर',
      slug: 'pune-drip-irrigation-scheme',
      description: 'कृषी विभागातर्फे बारामती व हवेली तालुक्यातील शेतकऱ्यांना ९०% अनुदानावर ठिबक संच वाटप सुरू करण्यात आले आहे. सर्व पात्र शेतकऱ्यांनी त्वरित नोंदणी करावी.',
      tags: ['शेतकरी', 'पुणे', 'कृषी'],
      genres: ['News', 'शेतकरी बातम्या'],
      cast: [],
      director: '',
      language: ['मराठी'],
      releaseDate: new Date().toISOString(),
      poster: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800',
      banner: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1200',
      isPremium: false,
      isFeatured: true,
      status: 'published',
      rating: 'U',
      views: 18450,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reporterName: 'तुषार पाटील (विशेष प्रतिनिधी)',
      district: 'Pune (पुणे)',
      taluka: 'Baramati (बारामती)',
      village: 'Katewadi (काटेवाडी)',
      subCategory: 'शेतकरी बातम्या',
      titleEn: 'Modern Drip Irrigation Subsidy Scheme Announced for Pune District Farmers',
      titleHi: 'पुणे जिले के किसानों के लिए आधुनिक ड्रिप सिंचाई योजना की घोषणा',
      descEn: 'Agriculture department rolls out 90% subsidy for micro-irrigation systems across Baramati and Haveli blocks.',
      descHi: 'कृषि विभाग द्वारा बारामती और हवेली तहसीलों के किसानों को 90% अनुदान पर ड्रिप सेट वितरण शुरू किया गया है.',
    },
    {
      id: 'news-def-2',
      type: 'news',
      title: 'नाशिक: लासलगाव कांदा बाजारपेठेत विक्रमी आवक, शेतकऱ्यांना दिलासादायक भाव',
      slug: 'nashik-lasalgaon-onion-market',
      description: 'आशियातील सर्वात मोठ्या कांदा बाजारपेठेत आज २५ हजार क्विंटलहून अधिक कांद्याची आवक नोंदवली गेली. सरासरी भाव स्थिर राहिल्याने उत्पादकांमध्ये समाधान.',
      tags: ['नाशिक', 'बाजारभाव', 'कांदा'],
      genres: ['News', 'बाजारभाव'],
      cast: [],
      director: '',
      language: ['मराठी'],
      releaseDate: new Date(Date.now() - 86400000).toISOString(),
      poster: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800',
      banner: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=1200',
      isPremium: false,
      isFeatured: true,
      status: 'published',
      rating: 'U',
      views: 22100,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      reporterName: 'विलास जाधव (नाशिक ब्युरो)',
      district: 'Nashik (नाशिक)',
      taluka: 'Niphad (निफाड)',
      village: 'Lasalgaon (लासलगाव)',
      subCategory: 'बाजारभाव',
      titleEn: 'Nashik: Lasalgaon Onion APMC Witnesses Record Arrivals with Steady Modal Prices',
      titleHi: 'नासिक: लासलगांव प्याज मंडी में रिकॉर्ड आवक, किसानों को स्थिर भाव से राहत',
      descEn: 'Over 25,000 quintals of onion arrived today at Asia largest agricultural market yard, keeping prices steady.',
      descHi: 'एशिया की सबसे बड़ी प्याज मंडी में आज 25 हजार क्विंटल से अधिक आवक दर्ज की गई. भाव स्थिर रहने से किसान संतुष्ट.',
    },
    {
      id: 'news-def-3',
      type: 'news',
      title: 'छत्रपती संभाजीनगर: मराठवाड्यात जलसंधारण कामांना वेग, ग्रामस्थांचा उत्स्फूर्त सहभाग',
      slug: 'sambhajinagar-water-conservation',
      description: 'पैठण व गंगापूर तालुक्यातील गावांमध्ये लोकसहभागातून बंधाऱ्यांची दुरुस्ती व गाळ काढण्याचे काम युद्धपातळीवर सुरू आहे.',
      tags: ['संभाजीनगर', 'जलसंधारण', 'पाणी'],
      genres: ['News', 'ग्रामीण विकास'],
      cast: [],
      director: '',
      language: ['मराठी'],
      releaseDate: new Date(Date.now() - 172800000).toISOString(),
      poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800',
      banner: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200',
      isPremium: false,
      isFeatured: false,
      status: 'published',
      rating: 'U',
      views: 12900,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date().toISOString(),
      reporterName: 'अशोक चव्हाण (मराठवाडा वार्ताहर)',
      district: 'Chhatrapati Sambhajinagar (छत्रपती संभाजीनगर)',
      taluka: 'Paithan (पैठण)',
      village: 'Bidkin (बिडकीन)',
      subCategory: 'ग्रामीण विकास',
      titleEn: 'Chhatrapati Sambhajinagar: Community Water Conservation Projects Accelerated Across Marathwada',
      titleHi: 'छत्रपति संभाजीनगर: मराठवाड़ा में जल संरक्षण कार्यों को गति, ग्रामीणों की सक्रिय भागीदारी',
      descEn: 'Villages in Paithan and Gangapur talukas launch joint check-dam desilting and repair operations ahead of monsoon.',
      descHi: 'पैठण और गंगापुर तहसील के गांवों में जनसहयोग से बांधों की मरम्मत और गाद निकालने का कार्य युद्धस्तर पर जारी.',
    },
    {
      id: 'news-def-4',
      type: 'news',
      title: 'कोल्हापूर: पंचगंगा नदी स्वच्छता मोहीम व सांडपाणी प्रक्रिया प्रकल्पाचे लोकार्पण',
      slug: 'kolhapur-panchganga-cleanliness',
      description: 'शिरोळ व हातकणंगले भागातील औद्योगिक सांडपाण्यावर नियंत्रण मिळवण्यासाठी अत्याधुनिक प्रक्रिया केंद्राचे उद्घाटन करण्यात आले.',
      tags: ['कोल्हापूर', 'पर्यावरण', 'विकास'],
      genres: ['News', 'स्थानिक प्रशासन'],
      cast: [],
      director: '',
      language: ['मराठी'],
      releaseDate: new Date(Date.now() - 259200000).toISOString(),
      poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
      banner: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200',
      isPremium: false,
      isFeatured: false,
      status: 'published',
      rating: 'U',
      views: 15300,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date().toISOString(),
      reporterName: 'प्रवीण पाटील',
      district: 'Kolhapur (कोल्हापूर)',
      taluka: 'Shirol (शिरोळ)',
      village: 'Jaysingpur (जयसिंगपूर)',
      subCategory: 'स्थानिक प्रशासन',
      titleEn: 'Kolhapur: Panchganga River Cleanliness Drive & Sewage Treatment Plant Inaugurated',
      titleHi: 'कोल्हापुर: पंचगंगा नदी स्वच्छता अभियान और सीवेज ट्रीटमेंट प्लांट का लोकार्पण',
      descEn: 'High-capacity environmental treatment facility inaugurated to curb industrial effluents in Shirol and Hatkanangale regions.',
      descHi: 'शिरोल और हातकणंगले क्षेत्रों में औद्योगिक अपशिष्ट नियंत्रण के लिए अत्याधुनिक सीवेज उपचार केंद्र का उद्घाटन.',
    },
  ];

  const allDisplayNews = newsItems.length > 0 ? newsItems : defaultNews;

  const getNewsTitle = (item: ContentItem) => {
    const raw = item as any;
    if (lang === 'en' && raw.titleEn) return raw.titleEn;
    if (lang === 'hi' && raw.titleHi) return raw.titleHi;
    return item.title;
  };

  const getNewsDescription = (item: ContentItem) => {
    const raw = item as any;
    if (lang === 'en' && raw.descEn) return raw.descEn;
    if (lang === 'hi' && raw.descHi) return raw.descHi;
    return item.description;
  };

  // Filtered news
  const filteredNews = allDisplayNews.filter(item => {
    if (selectedDistrict !== 'All') {
      const distMatch = item.district?.toLowerCase().includes(selectedDistrict.split(' ')[0].toLowerCase());
      if (!distMatch) return false;
    }
    if (selectedTaluka !== 'All') {
      const talukaMatch = item.taluka?.toLowerCase().includes(selectedTaluka.split(' ')[0].toLowerCase());
      if (!talukaMatch) return false;
    }
    if (selectedVillage !== 'All') {
      const villageMatch = item.village?.toLowerCase().includes(selectedVillage.split(' ')[0].toLowerCase());
      if (!villageMatch) return false;
    }
    if (selectedCategory !== 'सर्व') {
      const catMatch = item.subCategory?.includes(selectedCategory) || item.genres?.includes(selectedCategory);
      if (!catMatch) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = item.title.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q) || item.reporterName?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const topAd = ads.find(a => a.placement === 'home_top' || a.placement === 'all');
  const sidebarAd = ads.find(a => a.placement === 'news_sidebar' || a.placement === 'all');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setTimeout(() => {
      setContactSuccess(false);
      setContactForm({ name: '', phone: '', email: '', message: '', district: 'Pune (पुणे)' });
    }, 4000);
  };

  const handleGrievanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGrievanceSuccess(true);
    setTimeout(() => {
      setGrievanceSuccess(false);
      setGrievanceForm({ title: '', citizenName: '', contactNumber: '', district: 'Pune (पुणे)', taluka: '', description: '' });
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-800 font-sans selection:bg-amber-200 selection:text-slate-900 overflow-x-clip relative">
      {/* Website-only Textured Background Layer (Low Opacity) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('/website-bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.12,
          mixBlendMode: 'multiply',
          filter: 'contrast(115%) brightness(96%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
      
      {/* 1. TOP TICKER WITH HIGH-ENERGY MEDIA STRIP */}
      <div className="bg-gradient-to-r from-stone-950 via-[#1c1917] to-amber-950 text-white text-[11px] font-bold py-2 px-4 border-b border-amber-900/40 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shrink-0 shadow-sm flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              {t('breakingNews')}
            </span>
            <div className="overflow-hidden flex-1 relative whitespace-nowrap">
              <div className="animate-marquee inline-block space-x-12">
                <span>⚡ {t('tickerText')}</span>
                <span>🔴 {t('brandTitle')} Live — २४ तास थेट प्रादेशिक प्रक्षेपण आणि ग्रामीण महाराष्ट्राचा खरा आवाज</span>
                <span>🌾 महाराष्ट्रातील ३६ जिल्हे, ३५० तालुके आणि ४०,००० गावांचे थेट डिजिटल वार्तांकन</span>
                <span>⚡ {t('tickerText')}</span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[10px] shrink-0 font-semibold text-amber-200/90">
            <span className="flex items-center gap-1">📞 {t('contactPhoneLabel')}</span>
            <span className="flex items-center gap-1 text-slate-400">|</span>
            <span className="flex items-center gap-1">📍 महाराष्ट्रातील ३६ जिल्हे कव्हरेज</span>
          </div>
        </div>
      </div>

      {/* 2. GLASSMORPHIC MAIN NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#E5DBCA] shadow-sm transition-all">
        <div className="max-w-[1440px] mx-auto px-2.5 sm:px-6 py-2 flex items-center justify-between gap-1.5 sm:gap-4">
          
          {/* Brand Logo & Media Lockup */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-3 group shrink min-w-0">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white border border-[#E5DBCA] p-1 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform overflow-hidden shrink-0">
              <img src="/logo.png" alt="ग्रामीण भारत TV" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-black text-slate-900 text-xs sm:text-base tracking-tight group-hover:text-amber-700 transition-colors truncate">
                  {lang === 'en' ? 'Gramin Bharat' : (t('brandTitle').replace(/TV|टीव्ही/gi, '').trim())}
                </span>
                <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[8px] sm:text-[9px] px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded shadow-xs shrink-0">
                  TV
                </span>
              </div>
              <p className="text-[9px] sm:text-[11px] font-bold text-amber-700 tracking-tight leading-none truncate hidden xs:block">
                {t('brandSubtitle')}
              </p>
              <p className="text-[9px] text-slate-400 font-semibold hidden 2xl:block truncate">
                {t('tagline')}
              </p>
            </div>
          </Link>

          {/* Desktop Attractive Vertical Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {/* 1. Home */}
            <Link
              href="/"
              className="flex flex-col items-center justify-center gap-1 px-2.5 xl:px-3 py-1.5 rounded-xl hover:bg-amber-100/60 text-amber-900 group transition-all shrink-0 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-100/80 border border-amber-200/60 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-200/90 group-hover:-translate-y-0.5 transition-all shadow-2xs">
                <NavHome3DIcon className="w-6 h-6 drop-shadow-xs" />
              </div>
              <span className="text-[11px] font-black tracking-tight whitespace-nowrap">
                {t('navHome')}
              </span>
            </Link>

            {/* 2. Company Information */}
            <a
              href="#company-info"
              className="flex flex-col items-center justify-center gap-1 px-2.5 xl:px-3 py-1.5 rounded-xl hover:bg-amber-50 text-slate-700 hover:text-amber-800 group transition-all shrink-0 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-100/80 border border-blue-200/60 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-200/90 group-hover:-translate-y-0.5 transition-all shadow-2xs">
                <NavCompany3DIcon className="w-6 h-6 drop-shadow-xs" />
              </div>
              <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
                {t('navCompanyInformation')}
              </span>
            </a>

            {/* 3. About Us */}
            <a
              href="#about-us"
              className="flex flex-col items-center justify-center gap-1 px-2.5 xl:px-3 py-1.5 rounded-xl hover:bg-amber-50 text-slate-700 hover:text-amber-800 group transition-all shrink-0 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-100/80 border border-cyan-200/60 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-200/90 group-hover:-translate-y-0.5 transition-all shadow-2xs">
                <NavAbout3DIcon className="w-6 h-6 drop-shadow-xs" />
              </div>
              <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
                {t('navAboutUsExact')}
              </span>
            </a>

            {/* 4. Contact */}
            <a
              href="#contact-us"
              className="flex flex-col items-center justify-center gap-1 px-2.5 xl:px-3 py-1.5 rounded-xl hover:bg-amber-50 text-slate-700 hover:text-amber-800 group transition-all shrink-0 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100/80 border border-emerald-200/60 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-200/90 group-hover:-translate-y-0.5 transition-all shadow-2xs">
                <NavContact3DIcon className="w-6 h-6 drop-shadow-xs" />
              </div>
              <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
                {t('navContactExact')}
              </span>
            </a>

            {/* 5. News */}
            <a
              href="#news-hub"
              className="flex flex-col items-center justify-center gap-1 px-2.5 xl:px-3 py-1.5 rounded-xl hover:bg-amber-50 text-slate-700 hover:text-amber-800 group transition-all shrink-0 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-orange-100/80 border border-orange-200/60 flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-200/90 group-hover:-translate-y-0.5 transition-all shadow-2xs">
                <NavNews3DIcon className="w-6 h-6 drop-shadow-xs" />
              </div>
              <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
                {t('navNewsExact')}
              </span>
            </a>

            {/* 6. Information */}
            <a
              href="#information-hub"
              className="flex flex-col items-center justify-center gap-1 px-2.5 xl:px-3 py-1.5 rounded-xl hover:bg-amber-50 text-slate-700 hover:text-amber-800 group transition-all shrink-0 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-100/80 border border-purple-200/60 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-200/90 group-hover:-translate-y-0.5 transition-all shadow-2xs">
                <NavInfoService3DIcon className="w-6 h-6 drop-shadow-xs" />
              </div>
              <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
                {t('navInformationExact')}
              </span>
            </a>

            {/* 7. Citizen Voice */}
            <a
              href="#grievance-portal"
              className="flex flex-col items-center justify-center gap-1 px-2.5 xl:px-3 py-1.5 rounded-xl hover:bg-amber-50 text-amber-800 group transition-all shrink-0 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-100/80 border border-rose-200/60 flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-200/90 group-hover:-translate-y-0.5 transition-all shadow-2xs">
                <NavGrievance3DIcon className="w-6 h-6 drop-shadow-xs" />
              </div>
              <span className="text-[11px] font-bold tracking-tight whitespace-nowrap text-amber-900">
                {t('navGrievances')}
              </span>
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Desktop / Tablet Segmented Language Switcher */}
            <div className="hidden sm:block">
              <LanguageSwitcher variant="light" mode="segmented" />
            </div>

            {/* Mobile Compact Dropdown Language Switcher */}
            <div className="block sm:hidden">
              <LanguageSwitcher variant="light" mode="dropdown" className="text-[11px]" />
            </div>

            {/* Login Button - Perfectly sized, never cut off! */}
            <Link
              href="/login"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] sm:text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
              title={lang === 'mr' ? 'लॉगिन' : lang === 'hi' ? 'लॉगिन' : 'Login'}
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'mr' ? 'लॉगिन' : lang === 'hi' ? 'लॉगिन' : 'Login'}</span>
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-[#FAF7F2] border border-[#E5DBCA] text-slate-800 hover:bg-amber-50 active:scale-95 transition cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-rose-600" /> : <Menu className="w-5 h-5 text-slate-800" />}
            </button>
          </div>

        </div>

        {/* MODERN SLIDE-OVER MOBILE DRAWER WITH BACKDROP BLUR */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            {/* Backdrop Overlay */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-in Sheet Drawer */}
            <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
              
              {/* Drawer Header */}
              <div className="p-4 border-b border-[#E5DBCA] flex items-center justify-between bg-[#FAF7F2]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#E5DBCA] p-1 flex items-center justify-center shadow-2xs">
                    <img src="/logo.png" alt="ग्रामीण भारत TV" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm leading-tight flex items-center gap-1">
                      {t('brandTitle')}
                      <span className="bg-rose-600 text-white text-[8px] font-black px-1 py-0.2 rounded">TV</span>
                    </p>
                    <p className="text-[10px] font-black text-amber-700 leading-none">
                      {t('brandSubtitle')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer active:scale-90"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Language Switcher Section inside Drawer */}
              <div className="p-3.5 bg-white border-b border-slate-100 flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  🌐 भाषा निवडा (Language)
                </span>
                <LanguageSwitcher variant="light" mode="segmented" className="w-full justify-center" />
              </div>

              {/* Scrollable Navigation Menu featuring all requested options */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs font-bold text-slate-700">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 text-amber-900 font-black border border-amber-200/80 shadow-2xs"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-amber-100/80 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs">
                      <NavHome3DIcon className="w-6 h-6" />
                    </span>
                    <span>{t('navHome')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-amber-600" />
                </Link>

                <a
                  href="#company-info"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#FAF7F2] border border-transparent hover:border-[#E5DBCA] transition"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-blue-100/80 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
                      <NavCompany3DIcon className="w-6 h-6" />
                    </span>
                    <span>{t('navCompanyInformation')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>

                <a
                  href="#about-us"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#FAF7F2] border border-transparent hover:border-[#E5DBCA] transition"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-cyan-100/80 border border-cyan-200 flex items-center justify-center shrink-0 shadow-2xs">
                      <NavAbout3DIcon className="w-6 h-6" />
                    </span>
                    <span>{t('navAboutUsExact')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>

                <a
                  href="#contact-us"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#FAF7F2] border border-transparent hover:border-[#E5DBCA] transition"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
                      <NavContact3DIcon className="w-6 h-6" />
                    </span>
                    <span>{t('navContactExact')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>

                <a
                  href="#news-hub"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#FAF7F2] border border-transparent hover:border-[#E5DBCA] transition"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-orange-100/80 border border-orange-200 flex items-center justify-center shrink-0 shadow-2xs">
                      <NavNews3DIcon className="w-6 h-6" />
                    </span>
                    <span>{t('navNewsExact')}</span>
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">३६ जिल्हे</span>
                </a>

                <a
                  href="#information-hub"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#FAF7F2] border border-transparent hover:border-[#E5DBCA] transition"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-purple-100/80 border border-purple-200 flex items-center justify-center shrink-0 shadow-2xs">
                      <NavInfoService3DIcon className="w-6 h-6" />
                    </span>
                    <span>{t('navInformationExact')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>

                <a
                  href="#grievance-portal"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#FAF7F2] border border-transparent hover:border-[#E5DBCA] transition text-amber-900"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-rose-100/80 border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs">
                      <NavGrievance3DIcon className="w-6 h-6" />
                    </span>
                    <span>{t('navGrievances')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>

              {/* Drawer Bottom CTAs */}
              <div className="p-4 border-t border-[#E5DBCA] bg-[#FAF7F2] space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-center font-bold text-xs hover:bg-slate-800 transition block"
                >
                  {lang === 'mr' ? 'प्रशासक लॉगिन' : lang === 'hi' ? 'व्यवस्थापक लॉगिन' : 'Admin Login'}
                </Link>
              </div>

            </div>
          </div>
        )}
      </header>

      {/* TOP BANNER AD (if configured) */}
      {topAd && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <a href={topAd.targetUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl border border-slate-200 shadow-xs hover:opacity-95 transition">
            <img src={topAd.mediaUrl} alt={topAd.title} className="w-full h-24 sm:h-28 object-cover" />
          </a>
        </div>
      )}

      {/* 3. HERO VISION SECTION WITH CINEMATIC LIGHTING */}
      <section className="relative overflow-hidden pt-6 sm:pt-10 pb-12 sm:pb-16 px-4 sm:px-6 border-b border-[#E5DBCA]">
        {/* Soft Ambient Light Flares */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-20 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
          
          {/* Left Column: Vision, Headline & Metrics */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            
            {/* National Media Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-amber-300/80 text-amber-900 text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>✨ {t('heroBadge')}</span>
            </div>

            {/* Primary Headline with Rich Gradient */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.18] sm:leading-[1.15]">
              {t('heroHeading1')} <br />
              <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent drop-shadow-xs">
                {t('heroHeading2')}
              </span>
            </h1>

            {/* Subtitle Description */}
            <p className="text-xs sm:text-base text-slate-600 leading-relaxed max-w-xl font-medium">
              {t('heroDescription')}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="#news-hub"
                className="px-5 sm:px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <Newspaper className="w-4 h-4 text-amber-400" />
                <span>{t('readNewsBtn')}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>

            {/* 4 Interactive Glass Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-[#E5DBCA]">
              <div className="p-3.5 rounded-2xl bg-white/80 border border-[#E5DBCA] shadow-2xs hover:border-amber-400 transition-colors">
                <p className="text-2xl font-black text-slate-900">{lang === 'mr' ? '३६' : lang === 'hi' ? '३६' : '36'}</p>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">{t('metricDistricts')}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 border border-[#E5DBCA] shadow-2xs hover:border-rose-400 transition-colors">
                <p className="text-2xl font-black text-rose-600">{lang === 'mr' ? '५,०००+' : lang === 'hi' ? '५,०००+' : '5,000+'}</p>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">{t('metricReporters')}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 border border-[#E5DBCA] shadow-2xs hover:border-amber-400 transition-colors">
                <p className="text-2xl font-black text-amber-600">{lang === 'mr' ? '२४x७' : lang === 'hi' ? '२४x७' : '24x7'}</p>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">{t('metricBroadcast')}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 border border-[#E5DBCA] shadow-2xs hover:border-emerald-400 transition-colors">
                <p className="text-2xl font-black text-emerald-600">{lang === 'mr' ? '५०+' : lang === 'hi' ? '५०+' : '50+'}</p>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">चित्रपट व मालिका</p>
              </div>
            </div>
          </div>

          {/* Right Column: Stunning Live Streaming & Entertainment Console */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-stone-900 text-white p-6 sm:p-7 shadow-2xl border border-amber-500/20 hover:border-amber-500/40 transition-all">
              
              {/* Ambient Glow Corner */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-rose-600/30 to-amber-600/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                
                {/* Header Tag */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-rose-600/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    🎬 {t('ottStreamingBadge')}
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                    4K ULTRA HD
                  </span>
                </div>

                {/* Title & Slogan */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                    {t('heroOttTitle')}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">
                    {t('heroOttDesc')}
                  </p>
                </div>

                {/* Interactive Live Stream Video Player Preview Frame */}
                <div 
                  onClick={() => {
                    const active = liveChannels.find(c => c.isLive) || liveChannels[0];
                    if (active) setActivePlayingChannel(active);
                    else {
                      setActivePlayingChannel({
                        id: 'live_default',
                        channelName: 'Gramin Bharat TV',
                        channelCode: 'gramin_bharat_live',
                        streamUrl: 'c0a4e45c-b442-4071-b68f-6d8662b5f001',
                        poster: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200',
                        logo: '/logo.png',
                        description: 'Live 24x7 satellite broadcast feed',
                        isLive: true,
                        status: 'active',
                        resolution: '1080p 60fps HD',
                        viewersCount: 2450,
                        updatedAt: new Date().toISOString(),
                      });
                    }
                  }}
                  className="relative rounded-2xl overflow-hidden aspect-video bg-slate-800 border border-white/10 group cursor-pointer shadow-lg"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200" 
                    alt="Live Broadcast Preview" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                  
                  {/* Central Glowing Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-glow-crimson group-hover:scale-110 transition-all border border-white/20">
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Top Live Pill */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      LIVE
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-amber-300 font-bold text-[10px] border border-white/10">
                      👁️ २,४५०+ प्रेक्षक
                    </span>
                  </div>

                  {/* Bottom Channel Info */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-black text-white text-sm">🔴 नामदार महाराष्ट्र वृत्तसेवा LIVE</p>
                      <p className="text-[10px] text-amber-300 font-semibold">२४ तास थेट प्रादेशिक प्रक्षेपण</p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] backdrop-blur-md transition">
                      {lang === 'mr' ? 'थेट पहा' : lang === 'hi' ? 'लाइव देखें' : 'Watch Live'}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. OTT PROMOTION SHOWCASE & ENTERTAINMENT HUB */}
      {[...featuredMovies, ...featuredSeries].length > 0 && (
        <section id="ott-promotion" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5DBCA] pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-600 fill-rose-600" /> {t('navOttPromotionExact')} • 4K VOD & Live TV
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>🎬 {lang === 'mr' ? 'लोकप्रिय चित्रपट, वेब मालिका व थेट टीव्ही' : lang === 'hi' ? 'लोकप्रिय फ़िल्में, वेब सीरीज़ और लाइव टीवी' : 'Trending Movies, Series & Live TV'}</span>
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {lang === 'mr' ? 'मराठी भाषेतील सर्वोत्कृष्ट चित्रपट, वेब मालिका आणि २४ तास थेट प्रक्षेपण एकाच ठिकाणी' : 'Best regional entertainment, original series, and 24x7 live satellite streaming in one place.'}
              </p>
            </div>

            <Link
              href="/ott"
              className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all shadow-xs"
            >
              <span>सर्व संग्रह पहा (View All OTT)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Media Posters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...featuredMovies, ...featuredSeries].slice(0, 4).map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.videoId) setActivePlayingContent(item);
                  else window.location.href = '/ott';
                }}
                className="group relative rounded-2xl overflow-hidden bg-white border border-[#E5DBCA] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={getSafeImageUrl(item.banner || item.poster)}
                    alt={item.title}
                    onError={(e) => handleImageError(e)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />
                  
                  {/* Play Hover Trigger */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Quality & Type Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[9px] font-black text-amber-300 border border-white/20">
                      {item.type === 'movie' ? 'चित्रपट (Movie)' : 'मालिका (Series)'}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-black shadow-xs">
                      4K HDR
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-1.5">
                  <h4 className="font-black text-slate-900 text-sm truncate group-hover:text-rose-600 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-semibold line-clamp-1">
                    {item.genres?.join(' • ') || 'मनोरंजन'}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-bold border-t border-slate-100">
                    <span>⭐ 4.8 / 5</span>
                    <span className="text-rose-600 font-black group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      आत्ताच पहा <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. REGIONAL NEWS HUB WITH ADVANCED FILTERS */}
      <div id="news" className="scroll-mt-24" />
      <section id="news-hub" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#E5DBCA] pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Newspaper className="w-3 h-3 text-amber-700" />
                  {t('newsHubBadge')}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {t('newsHubHeading')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {t('newsHubSubtitle')}
              </p>
            </div>

            {/* Keyword Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchNewsPlaceholder')}
                className="w-full bg-white border border-[#E5DBCA] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-600 shadow-xs"
              />
            </div>
          </div>

          {/* CASCADING LOCATION FILTERS (District -> Taluka -> Village) */}
          <div className="mt-6 p-4 sm:p-5 rounded-3xl bg-white border border-[#E5DBCA] shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. District Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" /> {t('filterDistrictLabel')}
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d === 'All' ? t('allDistricts') : formatLocationLabel(d, lang)}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Taluka Filter (Cascading) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-orange-600" /> {t('filterTalukaLabel')}
              </label>
              <select
                value={selectedTaluka}
                onChange={(e) => handleTalukaChange(e.target.value)}
                disabled={selectedDistrict === 'All'}
                className={`w-full border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer ${
                  selectedDistrict === 'All' 
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                    : 'bg-[#FAF7F2] border-[#E5DBCA] text-slate-800 focus:border-rose-500'
                }`}
              >
                {availableTalukas.map((tVal) => (
                  <option key={tVal} value={tVal}>
                    {tVal === 'All' ? t('allTalukas') : formatLocationLabel(tVal, lang)}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Village Filter (Cascading) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-600" /> {t('filterVillageLabel')}
              </label>
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                disabled={selectedTaluka === 'All'}
                className={`w-full border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer ${
                  selectedTaluka === 'All' 
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                    : 'bg-[#FAF7F2] border-[#E5DBCA] text-slate-800 focus:border-rose-500'
                }`}
              >
                {availableVillages.map((v) => (
                  <option key={v} value={v}>
                    {v === 'All' ? t('allVillages') : formatLocationLabel(v, lang)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 mt-5">
            {[
              { id: 'सर्व', label: t('catAll') },
              { id: 'शेतकरी बातम्या', label: t('catFarmers') },
              { id: 'ग्रामीण विकास', label: t('catRural') },
              { id: 'स्थानिक प्रशासन', label: t('catAdmin') },
              { id: 'बाजारभाव', label: t('catMarket') },
              { id: 'राजकीय', label: t('catPolitics') },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-[#E5DBCA] text-slate-600 hover:bg-amber-50 hover:text-amber-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* NEWS GRID (Full Width Responsive) */}
        <div>
          {filteredNews.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
              <Newspaper className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="font-bold text-slate-800 text-sm">{t('noNewsFound')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('changeFilterTip')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((item) => (
                <article
                  key={item.id}
                  onClick={() => {
                    setActiveNews(item);
                    if (item.id) {
                      fetch('/api/content/view', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: item.id }),
                      }).catch(() => {});
                    }
                  }}
                  className="group bg-white rounded-3xl border border-[#E5DBCA] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1"
                >
                  <div>
                    {/* News Thumbnail */}
                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                      <img
                        src={getSafeImageUrl(item.poster || item.banner)}
                        alt={getNewsTitle(item)}
                        onError={(e) => handleImageError(e)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black border border-slate-200">
                          📍 {item.district ? formatLocationLabel(item.district, lang) : 'महाराष्ट्र'}
                        </span>
                      </div>
                      {item.subCategory && (
                        <div className="absolute top-3 right-3">
                          <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-[9px] font-black shadow-xs">
                            {formatSubCategory(item.subCategory, lang)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-2">
                      <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-amber-700 transition-colors">
                        {getNewsTitle(item)}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {getNewsDescription(item)}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                    <span>✍️ {item.reporterName?.split(' ')[0] || 'विशेष प्रतिनिधी'}</span>
                    <span className="text-amber-800 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      सविस्तर वाचा <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Sponsored Ad Banner (if configured) */}
          {sidebarAd && (
            <div className="mt-8 rounded-3xl overflow-hidden border border-[#E5DBCA] shadow-xs">
              <a href={sidebarAd.targetUrl} target="_blank" rel="noopener noreferrer" className="block hover:opacity-95 transition">
                <img src={sidebarAd.mediaUrl} alt={sidebarAd.title} className="w-full h-auto object-cover" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* 6. CITIZEN GRIEVANCE PORTAL: "जनतेचा आवाज" */}
      <section id="grievance-portal" className="bg-[#FAF7F2] border-y border-[#E5DBCA] py-14 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 inline-block">
              📢 {t('grievanceBadge')}
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {t('grievanceHeading')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {t('grievanceDesc')}
            </p>
            <div className="space-y-2 text-xs text-slate-700 font-bold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('grievancePrivacy1')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('grievancePrivacy2')}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <form onSubmit={handleGrievanceSubmit} className="bg-white rounded-3xl border border-[#E5DBCA] p-6 sm:p-8 shadow-md space-y-4 text-xs transition-all">
              <h3 className="text-base font-black text-slate-900">{t('grievanceFormTitle')}</h3>

              {grievanceSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {t('grievanceSuccessMsg')}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('fieldName')}</label>
                  <input
                    type="text"
                    required
                    value={grievanceForm.citizenName}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, citizenName: e.target.value })}
                    placeholder={lang === 'mr' ? 'उदा. राहुल शिंदे' : lang === 'hi' ? 'उदा. राहुल शिंदे' : 'e.g. Rahul Shinde'}
                    className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('fieldMobile')}</label>
                  <input
                    type="tel"
                    required
                    value={grievanceForm.contactNumber}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, contactNumber: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('fieldDistrict')}</label>
                  <select
                    value={grievanceForm.district}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, district: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 font-bold"
                  >
                    {districts.filter(d => d !== 'All').map(d => (
                      <option key={d} value={d}>{formatLocationLabel(d, lang)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('fieldTaluka')}</label>
                  <input
                    type="text"
                    value={grievanceForm.taluka}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, taluka: e.target.value })}
                    placeholder={lang === 'mr' ? 'उदा. बारामती' : lang === 'hi' ? 'उदा. बारामती' : 'e.g. Baramati'}
                    className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('fieldIssueTitle')}</label>
                <input
                  type="text"
                  required
                  value={grievanceForm.title}
                  onChange={(e) => setGrievanceForm({ ...grievanceForm, title: e.target.value })}
                  placeholder={lang === 'mr' ? 'समस्येचा मुख्य विषय थोडक्यात लिहा' : 'Brief subject of the issue'}
                  className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('fieldDesc')}</label>
                <textarea
                  rows={3}
                  required
                  value={grievanceForm.description}
                  onChange={(e) => setGrievanceForm({ ...grievanceForm, description: e.target.value })}
                  placeholder={lang === 'mr' ? 'समस्येचे सविस्तर वर्णन, ठिकाण आणि प्रशासकीय संदर्भ द्या...' : 'Provide complete details of the issue...'}
                  className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" /> {t('submitGrievanceBtn')}
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* 7. INFORMATION & CITIZEN SERVICES HUB (Option 5: Information) */}
      <div id="information" className="scroll-mt-24" />
      <section id="information-hub" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-8 border-t border-[#E5DBCA]">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 inline-block">
            📌 {t('infoHubBadge')}
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {t('infoHubHeading')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {t('infoHubSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-4">
          <div className="p-5 rounded-3xl bg-white border border-[#E5DBCA] shadow-xs space-y-3 hover:border-amber-400 hover:shadow-md transition-all group">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Landmark className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-sm group-hover:text-amber-800 transition-colors">
              {t('infoCard1Title')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {t('infoCard1Desc')}
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#E5DBCA] shadow-xs space-y-3 hover:border-rose-400 hover:shadow-md transition-all group">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-sm group-hover:text-rose-800 transition-colors">
              {t('infoCard2Title')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {t('infoCard2Desc')}
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#E5DBCA] shadow-xs space-y-3 hover:border-emerald-400 hover:shadow-md transition-all group">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-sm group-hover:text-emerald-800 transition-colors">
              {t('infoCard3Title')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {t('infoCard3Desc')}
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#E5DBCA] shadow-xs space-y-3 hover:border-blue-400 hover:shadow-md transition-all group">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Megaphone className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-sm group-hover:text-blue-800 transition-colors">
              {t('infoCard4Title')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {t('infoCard4Desc')}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">
                {lang === 'mr' ? 'नागरिक व शेतकरी मार्गदर्शन कक्ष' : lang === 'hi' ? 'नागरिक एवं किसान मार्गदर्शन कक्ष' : 'Citizen & Farmer Advisory Cell'}
              </p>
              <p className="text-[11px] text-slate-600 font-semibold">
                {lang === 'mr' ? 'सरकारी योजना व अर्जांसाठी मोफत संपादकीय मार्गदर्शन मिळवा' : lang === 'hi' ? 'सरकारी योजनाओं के लिए मुफ्त मार्गदर्शन प्राप्त करें' : 'Get free editorial guidance for government applications'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="#grievance-portal"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs whitespace-nowrap"
            >
              {t('submitGrievanceBtn')}
            </a>
          </div>
        </div>
      </section>

      {/* 8. COMPANY INFORMATION (Option 1: Company information) */}
      <div id="company-information" className="scroll-mt-24" />
      <section id="company-info" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-8 border-t border-[#E5DBCA]">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 inline-block">
            🏢 {t('companyInfoBadge')}
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {t('companyInfoHeading')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {t('companyInfoSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-4">
          <div className="p-5 rounded-3xl bg-white border border-[#E5DBCA] shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-black text-slate-900 text-sm">{t('companyRegTitle')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {t('companyRegDesc')}
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#E5DBCA] shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Building className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="font-black text-slate-900 text-sm">{t('companyBureausTitle')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {t('companyBureausDesc')}
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#E5DBCA] shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <Server className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="font-black text-slate-900 text-sm">{t('companyCdnTitle')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {t('companyCdnDesc')}
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#E5DBCA] shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-700" />
            </div>
            <h3 className="font-black text-slate-900 text-sm">{t('companyEditorialTitle')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {t('companyEditorialDesc')}
            </p>
          </div>
        </div>

        {/* Coverage Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-3xl bg-white border border-[#E5DBCA] shadow-xs text-center">
          <div>
            <p className="text-2xl font-black text-slate-900">३६</p>
            <p className="text-[11px] text-slate-500 font-bold">{lang === 'mr' ? 'जिल्हे कव्हरेज' : lang === 'hi' ? 'जिले कवरेज' : 'Districts Covered'}</p>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">३५०+</p>
            <p className="text-[11px] text-slate-500 font-bold">{lang === 'mr' ? 'तालुका प्रतिनिधी' : lang === 'hi' ? 'तहसील प्रतिनिधि' : 'Taluka Desks'}</p>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">४०,०००+</p>
            <p className="text-[11px] text-slate-500 font-bold">{lang === 'mr' ? 'गावांपर्यंत पोहोच' : lang === 'hi' ? 'गांवों तक पहुंच' : 'Villages Connected'}</p>
          </div>
          <div>
            <p className="text-2xl font-black text-rose-600">५०+ लाख</p>
            <p className="text-[11px] text-slate-500 font-bold">{lang === 'mr' ? 'मासिक वाचक व प्रेक्षक' : lang === 'hi' ? 'मासिक दर्शक' : 'Monthly Audience'}</p>
          </div>
        </div>
      </section>

      {/* 9. ABOUT US (Option 2: About Us) */}
      <section id="about-us" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-8 border-t border-[#E5DBCA]">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 inline-block">
            ℹ️ {t('aboutOrgBadge')}
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {t('aboutOrgHeading')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {t('aboutOrgSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-3xl bg-white border border-[#E5DBCA] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <RadioTower className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-900 text-base">{t('missionTitle')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {t('missionDesc')}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E5DBCA] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-900 text-base">{t('visionTitle')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {t('visionDesc')}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E5DBCA] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-900 text-base">{t('editorialEthicsTitle')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {t('editorialEthicsDesc')}
            </p>
          </div>
        </div>
      </section>

      {/* 10. CONTACT US SECTION (Option 3: Contact) */}
      <div id="contact" className="scroll-mt-24" />
      <section id="contact-us" className="scroll-mt-24 bg-white border-t border-[#E5DBCA] py-14 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-5 space-y-5">
            <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 inline-block">
              📞 {t('contactUsBadge')}
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {t('contactUsHeading')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {t('contactUsDesc')}
            </p>

            <div className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA]">
                <Phone className="w-5 h-5 text-amber-700 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t('contactPhoneLabel')}</p>
                  <p className="font-black text-slate-900">+91 020 2568 9900 / +91 94220 00000</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA]">
                <Mail className="w-5 h-5 text-rose-700 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t('contactEmailLabel')}</p>
                  <p className="font-black text-slate-900">contact@graminbharat.tv</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA]">
                <MapPin className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t('headOfficeLabel')}</p>
                  <p className="font-black text-slate-900">पुणे, मुंबई व छत्रपती संभाजीनगर ब्युरो कार्यालय</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <form onSubmit={handleContactSubmit} className="bg-[#FAF7F2] rounded-3xl border border-[#E5DBCA] p-6 sm:p-8 space-y-4 text-xs">
              <h3 className="text-base font-black text-slate-900">{t('sendUsMsg')}</h3>

              {contactSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {t('contactSuccessMsg')}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('fieldName')}</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full bg-white border border-[#E5DBCA] rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('fieldMobile')}</label>
                  <input
                    type="tel"
                    required
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full bg-white border border-[#E5DBCA] rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('fieldEmail')}</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full bg-white border border-[#E5DBCA] rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('fieldMsg')}</label>
                <textarea
                  rows={4}
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full bg-white border border-[#E5DBCA] rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 font-semibold"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4 text-amber-400" /> {t('sendMsgBtn')}
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* 11. ELITE FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-4 sm:px-6 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-rose-600 flex items-center justify-center text-white shadow-md">
              <RadioTower className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-white text-base">
                {lang === 'en' ? 'GRAMIN BHARAT TV • Namdar Maharashtra' : lang === 'hi' ? 'ग्रामीण भारत टीवी • नामदार महाराष्ट्र' : 'ग्रामीण भारत टीव्ही • नामदार महाराष्ट्र'}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">{t('footerTagline')}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">© 2026 {t('allRightsReserved')}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold">
            <a href="#company-info" className="hover:text-white transition">🏢 {t('navCompanyInformation')}</a>
            <a href="#about-us" className="hover:text-white transition">ℹ️ {t('navAboutUsExact')}</a>
            <a href="#contact-us" className="hover:text-white transition">📞 {t('navContactExact')}</a>
            <a href="#news-hub" className="hover:text-white transition">📰 {t('navNewsExact')}</a>
            <a href="#information-hub" className="hover:text-white transition">📌 {t('navInformationExact')}</a>
            <Link href="/login" className="text-slate-300 hover:underline font-black">{lang === 'mr' ? 'प्रशासक लॉगिन' : lang === 'hi' ? 'व्यवस्थापक लॉगिन' : 'Admin Login'}</Link>
          </div>
        </div>
      </footer>

      {/* FULL NEWS ARTICLE MODAL */}
      {activeNews && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 animate-scale-in">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 font-black text-[10px] border border-amber-200">
                    📍 {activeNews.district ? formatLocationLabel(activeNews.district, lang) : (lang === 'en' ? 'Maharashtra' : 'महाराष्ट्र')}
                  </span>
                  {activeNews.subCategory && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {formatSubCategory(activeNews.subCategory, lang)}
                    </span>
                  )}
                </div>
                <h3 className="font-black text-slate-900 text-lg leading-snug">{getNewsTitle(activeNews)}</h3>
              </div>
              <button
                onClick={() => setActiveNews(null)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* News Video or Poster */}
            {activeNews.videoId ? (
              <div className="rounded-2xl overflow-hidden border border-slate-200">
                <VideoPlayer
                  src={activeNews.videoId}
                  poster={activeNews.poster}
                  title={getNewsTitle(activeNews)}
                  isLive={false}
                />
              </div>
            ) : (activeNews.poster || activeNews.banner) ? (
              <img 
                src={getSafeImageUrl(activeNews.poster || activeNews.banner)} 
                alt={getNewsTitle(activeNews)} 
                onError={(e) => handleImageError(e)}
                className="w-full h-64 rounded-2xl object-cover bg-slate-100" 
              />
            ) : null}

            <div className="flex items-center justify-between py-2 border-y border-slate-100 text-xs text-slate-500">
              <span>✍️ {t('reporterLabel')}: <strong>{activeNews.reporterName || t('specialReporter')}</strong></span>
              <span>📍 {activeNews.taluka ? `${formatLocationLabel(activeNews.taluka, lang)}, ` : ''}{formatLocationLabel(activeNews.district, lang)}</span>
              <span>👁️ {(activeNews.views || 0).toLocaleString()} {t('viewsLabel')}</span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
              {getNewsDescription(activeNews)}
            </p>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {t('dateLabel')}: {formatDate(activeNews.createdAt, lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-US')}
              </span>
              <button
                onClick={() => setActiveNews(null)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                {t('closeModal')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE STREAM VIDEO PLAYER MODAL */}
      {activePlayingChannel && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl p-4 sm:p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between text-white px-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span className="font-black text-sm tracking-wide">
                  {activePlayingChannel.channelName} • {lang === 'mr' ? 'थेट प्रक्षेपण' : lang === 'hi' ? 'सीधा प्रसारण' : 'Live Broadcast'}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  {activePlayingChannel.resolution || '1080p 60fps HD'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 hidden sm:inline-block">
                  Bunny Stream 4K HLS
                </span>
              </div>
              <button
                onClick={() => setActivePlayingChannel(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-rose-600 text-white transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <VideoPlayer
              src={activePlayingChannel.streamUrl}
              poster={activePlayingChannel.poster}
              title={activePlayingChannel.channelName}
              subtitle={activePlayingChannel.currentProgramTitle || 'Live Satellite Feed • Bunny Stream'}
              isLive={true}
              onClose={() => setActivePlayingChannel(null)}
            />
          </div>
        </div>
      )}

      {/* VOD / MOVIE STREAMING MODAL */}
      {activePlayingContent && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl p-4 sm:p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between text-white px-2">
              <div className="flex items-center gap-2.5">
                <span className="font-black text-sm tracking-wide">
                  {activePlayingContent.title}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {activePlayingContent.genres?.join(', ') || '4K VOD'}
                </span>
              </div>
              <button
                onClick={() => setActivePlayingContent(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-rose-600 text-white transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <VideoPlayer
              src={activePlayingContent.videoId || activePlayingContent.videoUrl || ''}
              poster={activePlayingContent.poster || activePlayingContent.banner}
              title={activePlayingContent.title}
              subtitle={activePlayingContent.description || 'Bunny.net Stream'}
              isLive={false}
              onClose={() => setActivePlayingContent(null)}
            />
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
