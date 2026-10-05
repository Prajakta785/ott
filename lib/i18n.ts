'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'mr' | 'hi' | 'en';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
];

export const translations = {
  // Brand & Slogans
  brandTitle: {
    mr: 'ग्रामीण भारत टीव्ही',
    hi: 'ग्रामीण भारत टीवी',
    en: 'Gramin Bharat TV',
  },
  brandSubtitle: {
    mr: 'नामदार महाराष्ट्र वृत्तसेवा',
    hi: 'नामदार महाराष्ट्र समाचार सेवा',
    en: 'Namdar Maharashtra News Network',
  },
  tagline: {
    mr: 'गावापासून महाराष्ट्रापर्यंत – जनतेचा आवाज',
    hi: 'गांव से महाराष्ट्र तक – जनता की आवाज',
    en: 'From Villages to Maharashtra – The Voice of People',
  },

  // Navigation
  navHome: {
    mr: 'मुख्य',
    hi: 'मुख्य पृष्ठ',
    en: 'Home',
  },
  navNews: {
    mr: 'बातम्या',
    hi: 'समाचार',
    en: 'News Hub',
  },
  navLiveTV: {
    mr: 'थेट प्रक्षेपण',
    hi: 'लाइव टीवी',
    en: 'Live TV',
  },
  navMovies: {
    mr: 'चित्रपट',
    hi: 'फ़िल्में',
    en: 'Movies',
  },
  navSeries: {
    mr: 'वेब मालिका',
    hi: 'वेब सीरीज़',
    en: 'Web Series',
  },
  navPlans: {
    mr: 'वर्गणी प्लॅन्स',
    hi: 'सब्सक्रिप्शन प्लान',
    en: 'VIP Plans',
  },
  navAboutUs: {
    mr: 'संस्थेविषयी',
    hi: 'हमारे बारे में',
    en: 'About Us',
  },
  navGrievances: {
    mr: 'जनतेचा आवाज',
    hi: 'जनता की आवाज',
    en: 'Citizen Voice',
  },
  navContactUs: {
    mr: 'संपर्क',
    hi: 'संपर्क करें',
    en: 'Contact Us',
  },
  navAdminConsole: {
    mr: 'प्रशासक नियंत्रण',
    hi: 'व्यवस्थापक नियंत्रण',
    en: 'Admin Console',
  },
  navWatchOTT: {
    mr: 'थेट प्रक्षेपण पहा',
    hi: 'लाइव प्रसारण देखें',
    en: 'Watch OTT • Live Streaming',
  },
  navNewsWebsite: {
    mr: 'बातम्या पोर्टल',
    hi: 'समाचार पोर्टल',
    en: 'News Website',
  },
  navCompanyInformation: {
    mr: 'कंपनी माहिती',
    hi: 'कंपनी जानकारी',
    en: 'Company information',
  },
  navAboutUsExact: {
    mr: 'आमच्याबद्दल',
    hi: 'हमारे बारे में',
    en: 'About Us',
  },
  navContactExact: {
    mr: 'संपर्क',
    hi: 'संपर्क',
    en: 'Contact',
  },
  navNewsExact: {
    mr: 'बातम्या',
    hi: 'समाचार',
    en: 'News',
  },
  navInformationExact: {
    mr: 'माहिती व सेवा',
    hi: 'जानकारी एवं सेवाएं',
    en: 'Information',
  },
  navOttPromotionExact: {
    mr: 'OTT प्रमोशन',
    hi: 'OTT प्रमोशन',
    en: 'OTT promotion',
  },

  // Breaking & Ticker
  breakingNews: {
    mr: 'ताजी बातमी',
    hi: 'ताज़ा समाचार',
    en: 'Breaking News',
  },
  tickerText: {
    mr: 'महाराष्ट्र राज्य: ग्रामीण भागात २४ तास वीज व पाणी पुरवठा योजनांना गती • नामदार महाराष्ट्र विशेष बुलेटिन आज रात्री ८ वाजता.',
    hi: 'महाराष्ट्र राज्य: ग्रामीण क्षेत्रों में २४ घंटे बिजली और पानी आपूर्ति योजनाओं में तेजी • नामदार महाराष्ट्र विशेष बुलेटिन आज रात ८ बजे.',
    en: 'Maharashtra: Accelerated 24x7 water and power infrastructure for rural regions • Namdar Maharashtra special broadcast at 8:00 PM.',
  },

  // Hero Section
  heroBadge: {
    mr: 'महाराष्ट्रव्यापी निष्पक्ष ग्रामीण पत्रकारिता',
    hi: 'महाराष्ट्रव्यापी निष्पक्ष ग्रामीण पत्रकारिता',
    en: 'Maharashtra-Wide Independent Rural Journalism',
  },
  heroHeading1: {
    mr: 'गावापासून महाराष्ट्रापर्यंत,',
    hi: 'गांव से महाराष्ट्र तक,',
    en: 'From Villages Across Maharashtra,',
  },
  heroHeading2: {
    mr: 'प्रत्येक नागरिकाचा आवाज!',
    hi: 'हर नागरिक की आवाज!',
    en: 'The Voice of Every Citizen!',
  },
  heroDescription: {
    mr: 'ग्रामीण भारत टीव्ही व नामदार महाराष्ट्र ही महाराष्ट्रातील ३६ जिल्हे, ३५० हून अधिक तालुके आणि ४०,००० गावांपर्यंत पोहोचणारी अग्रणी माध्यम संस्था आहे.',
    hi: 'ग्रामीण भारत टीवी और नामदार महाराष्ट्र पूरे महाराष्ट्र के ३६ जिलों, ३५० से अधिक तहसीलों और ४०,००० गांवों तक पहुंचने वाला प्रमुख मीडिया नेटवर्क है.',
    en: 'Gramin Bharat TV and Namdar Maharashtra are premier news broadcasting networks reaching all 36 districts, 350+ talukas, and 40,000+ villages across Maharashtra.',
  },
  readNewsBtn: {
    mr: 'ताज्या बातम्या पहा',
    hi: 'ताज़ा समाचार पढ़ें',
    en: 'Read Latest News',
  },
  watchOTTBtn: {
    mr: 'थेट चॅनेल व चित्रपट',
    hi: 'लाइव चैनल और फिल्में',
    en: 'Live Channels & Movies (OTT)',
  },

  // Location Filters (Requirement G)
  filterDistrictLabel: {
    mr: '१. जिल्हा निवडा',
    hi: '१. जिला चुनें',
    en: '1. Select District',
  },
  filterTalukaLabel: {
    mr: '२. तालुका निवडा',
    hi: '२. तहसील चुनें',
    en: '2. Select Taluka',
  },
  filterVillageLabel: {
    mr: '३. गाव निवडा',
    hi: '३. गांव चुनें',
    en: '3. Select Village',
  },
  allDistricts: {
    mr: 'सर्व महाराष्ट्र',
    hi: 'संपूर्ण महाराष्ट्र',
    en: 'All Maharashtra',
  },
  allTalukas: {
    mr: 'सर्व तालुके',
    hi: 'सभी तहसीलें',
    en: 'All Talukas',
  },
  allVillages: {
    mr: 'सर्व गावे',
    hi: 'सभी गांव',
    en: 'All Villages',
  },
  searchNewsPlaceholder: {
    mr: 'बातम्या शोधा...',
    hi: 'समाचार खोजें...',
    en: 'Search news by keyword...',
  },

  // Categories
  catAll: {
    mr: 'सर्व',
    hi: 'सभी',
    en: 'All',
  },
  catFarmers: {
    mr: 'शेतकरी बातम्या',
    hi: 'किसान समाचार',
    en: 'Agriculture & Farmers',
  },
  catRural: {
    mr: 'ग्रामीण विकास',
    hi: 'ग्रामीण विकास',
    en: 'Rural Development',
  },
  catAdmin: {
    mr: 'स्थानिक प्रशासन',
    hi: 'स्थानीय प्रशासन',
    en: 'Local Governance',
  },
  catMarket: {
    mr: 'बाजारभाव',
    hi: 'मंडी भाव',
    en: 'Market Rates',
  },
  catPolitics: {
    mr: 'राजकीय',
    hi: 'राजनीतिक',
    en: 'Politics',
  },

  // Grievance Portal ("जनतेचा आवाज")
  grievanceBadge: {
    mr: 'जनतेचा आवाज',
    hi: 'जनता की आवाज',
    en: 'Citizen Voice Portal',
  },
  grievanceHeading: {
    mr: 'तुमच्या गावातील समस्या, थेट शासनापर्यंत पोहोचवा!',
    hi: 'अपने गांव की समस्याएं, सीधे सरकार तक पहुंचाएं!',
    en: 'Report Your Village Issues Directly to the Government!',
  },
  grievanceDesc: {
    mr: 'पाणी, रस्ते, वीज, शाळा, पीक विमा किंवा ग्रामपंचायतीमधील भ्रष्टाचाराबाबतची तक्रार थेट आमच्या वृत्तसंपादकांना पाठवा.',
    hi: 'पानी, सड़क, बिजली, स्कूल, फसल बीमा या ग्राम पंचायत में भ्रष्टाचार की शिकायत सीधे हमारे संपादकों को भेजें.',
    en: 'Submit complaints regarding water, roads, electricity, schools, crop insurance, or village issues directly to our editorial team.',
  },
  submitGrievanceBtn: {
    mr: 'तक्रार दाखल करा',
    hi: 'शिकायत दर्ज करें',
    en: 'Submit Grievance to Editors',
  },

  // OTT Platform UI
  trendingBadge: {
    mr: 'महाराष्ट्रात #१ ट्रेंडिंग',
    hi: 'महाराष्ट्र में #१ ट्रेंडिंग',
    en: '#1 TRENDING IN MAHARASHTRA',
  },
  watchNowBtn: {
    mr: 'लगेच पहा',
    hi: 'अभी देखें',
    en: 'Watch Now (4K ABR)',
  },
  addToWatchlist: {
    mr: '+ माझ्या यादीत जोडा',
    hi: '+ मेरी सूची में जोड़ें',
    en: '+ Add to Watchlist',
  },
  inWatchlist: {
    mr: 'यादीत जोडले',
    hi: 'सूची में जोड़ा गया',
    en: 'Added to Watchlist',
  },
  continueWatching: {
    mr: 'पुढे सुरू ठेवा',
    hi: 'देखना जारी रखें',
    en: 'Continue Watching',
  },
  liveBroadcastBadge: {
    mr: 'थेट उपग्रह प्रक्षेपण',
    hi: 'सीधा उपग्रह प्रसारण',
    en: 'Live Satellite Broadcast',
  },
  liveViewers: {
    mr: 'प्रेक्षक',
    hi: 'दर्शक',
    en: 'viewers',
  },
  liveChannelsHeading: {
    mr: 'थेट प्रक्षेपण चॅनेल्स',
    hi: 'लाइव टीवी चैनल',
    en: '24x7 Live Satellite TV Channels',
  },
  liveSubtitle: {
    mr: 'ग्रामीण भारत टीव्ही, नामदार महाराष्ट्र व थेट प्रक्षेपण चॅनेल्सचे थेट नियंत्रण.',
    hi: 'ग्रामीण भारत टीवी, नामदार महाराष्ट्र व लाइव प्रसारण चैनल प्रबंधन।',
    en: 'Gramin Bharat TV, Namdar Maharashtra & Live broadcast channels management.',
  },
  liveNoChannels: {
    mr: 'कोणतेही थेट चॅनेल उपलब्ध नाही.',
    hi: 'कोई लाइव चैनल उपलब्ध नहीं है।',
    en: 'No live channels available.',
  },
  liveNoChannelsHelp: {
    mr: 'नवीन चॅनेल जोडण्यासाठी किंवा थेट प्रक्षेपण सुरू करण्यासाठी वरील बटणावर क्लिक करा.',
    hi: 'लाइव प्रसारण शुरू करने के लिए ऊपर दिए गए बटन पर क्लिक करें।',
    en: 'Click button above to add a channel.',
  },
  moviesHeading: {
    mr: 'मराठी व हिंदी चित्रपट',
    hi: 'मराठी और हिंदी फ़िल्में',
    en: 'Marathi & Hindi Movies Catalog',
  },
  seriesHeading: {
    mr: 'वेब मालिका व ओरिजिनल्स',
    hi: 'वेब सीरीज़ और ओरिजिनल्स',
    en: 'Web Series & Originals',
  },
  subscribeHeading: {
    mr: 'अखंड 4K चित्रपट व थेट टीव्हीसाठी वर्गणी निवडा',
    hi: 'अल्ट्रा 4K फिल्मों और लाइव टीवी के लिए प्लान चुनें',
    en: 'Select a Subscription for 4K Movies & 24x7 Live TV',
  },
  subscribeBtn: {
    mr: 'हा प्लॅन निवडा',
    hi: 'यह प्लान चुनें',
    en: 'Subscribe Now',
  },
  myAccount: {
    mr: 'माझे खाते',
    hi: 'मेरा खाता',
    en: 'My Profile & Devices',
  },

  // Video Player Controls
  qualitySelector: {
    mr: 'व्हिडिओ गुणवत्ता',
    hi: 'वीडियो गुणवत्ता',
    en: 'Streaming Quality (ABR)',
  },
  liveOnAir: {
    mr: 'थेट प्रक्षेपण सुरू आहे',
    hi: 'सीधा प्रसारण जारी है',
    en: 'Live Broadcast Active',
  },

  // Header quick info
  contactPhoneLabel: {
    mr: '📞 संपर्क: +91 020 2568 9900',
    hi: '📞 संपर्क: +91 020 2568 9900',
    en: '📞 Bureau: +91 020 2568 9900',
  },
  contactLocations: {
    mr: '📍 मुंबई • पुणे • छत्रपती संभाजीनगर',
    hi: '📍 मुंबई • पुणे • छत्रपति संभाजीनगर',
    en: '📍 Mumbai • Pune • Chhatrapati Sambhajinagar',
  },

  // Hero Metrics & OTT Card
  metricDistricts: {
    mr: 'महाराष्ट्र जिल्हे कव्हर',
    hi: 'महाराष्ट्र जिले कवर',
    en: 'Districts Covered in Maharashtra',
  },
  metricReporters: {
    mr: 'स्थानिक वार्ताहर नेटवर्क',
    hi: 'स्थानीय संवाददाता नेटवर्क',
    en: 'Local Reporter Network',
  },
  metricBroadcast: {
    mr: 'थेट डिजिटल प्रक्षेपण',
    hi: 'लाइव डिजिटल प्रसारण',
    en: '24x7 Digital Broadcast',
  },
  heroOttTitle: {
    mr: 'मनोरंजन, मराठी चित्रपट व थेट टीव्ही आता तुमच्या मोबाईलवर!',
    hi: 'मनोरंजन, फ़िल्में और लाइव टीवी अब आपके मोबाइल पर!',
    en: 'Entertainment, Movies & Live TV now on your phone!',
  },
  heroOttDesc: {
    mr: '४K व्हिडिओ क्वालिटी, ॲडॉप्टिव्ह बिटरेट, आणि ग्रामीण भागातील स्थानिक कथांवर आधारित वेब मालिका.',
    hi: '४K वीडियो क्वालिटी, एडाप्टिव बिटरेट और ग्रामीण कहानियों पर आधारित वेब श्रृंखलाएं.',
    en: '4K Ultra HD quality, Adaptive Bitrate streaming, and original rural web series.',
  },
  heroOttBadge: {
    mr: '1080p 60fps थेट प्रक्षेपण सुरू आहे',
    hi: '1080p 60fps सीधा प्रसारण चालू है',
    en: '1080p 60fps Live Streaming Active',
  },
  heroOttWatch: {
    mr: 'पहा',
    hi: 'देखें',
    en: 'Watch Now',
  },

  // News Hub
  newsHubBadge: {
    mr: 'जिल्हा, तालुका व गाव निहाय बातम्या',
    hi: 'जिला, तहसील और गांव अनुसार समाचार',
    en: 'District, Taluka & Village News',
  },
  newsHubHeading: {
    mr: 'स्थानिक व राज्यस्तरीय बातम्या',
    hi: 'स्थानीय और राज्यस्तरीय समाचार',
    en: 'Local & State News Network',
  },
  newsHubSubtitle: {
    mr: 'तुमचा जिल्हा, तालुका आणि गाव निवडून स्थानिक बातम्या त्वरित शोधा.',
    hi: 'अपना जिला, तहसील और गांव चुनकर स्थानीय समाचार तुरंत खोजें.',
    en: 'Select your District, Taluka, and Village to instantly find local ground reports.',
  },
  noNewsFound: {
    mr: 'या निकषांसाठी कोणतीही बातमी उपलब्ध नाही.',
    hi: 'इन मानदंडों के लिए कोई समाचार उपलब्ध नहीं है.',
    en: 'No news reports available for this location.',
  },
  changeFilterTip: {
    mr: 'कृपया जिल्हा किंवा तालुका फिल्टर बदलून पहा.',
    hi: 'कृपया जिला या तहसील फ़िल्टर बदलकर देखें.',
    en: 'Try changing the district or taluka filter.',
  },
  sponsoredAd: {
    mr: 'प्रायोजित जाहिरात',
    hi: 'प्रायोजित विज्ञापन',
    en: 'Sponsored Advertisement',
  },
  districtEditions: {
    mr: 'स्थानिक आवृत्ती',
    hi: 'स्थानीय संस्करण',
    en: 'District Editions',
  },
  viewsLabel: {
    mr: 'दृश्ये',
    hi: 'व्यूज',
    en: 'views',
  },
  specialReporter: {
    mr: 'विशेष वार्ताहर',
    hi: 'विशेष संवाददाता',
    en: 'Special Correspondent',
  },

  // Grievance Portal
  grievancePrivacy1: {
    mr: 'तक्रारदाराचे नाव व माहिती पूर्णपणे गोपनीय ठेवली जाते.',
    hi: 'शिकायतकर्ता का नाम और विवरण पूरी तरह गोपनीय रखा जाता है.',
    en: 'Complainant identity and contact info are strictly confidential.',
  },
  grievancePrivacy2: {
    mr: 'तक्रार दाखल झाल्यानंतर २४ तासांत पडताळणी प्रक्रिया सुरू होते.',
    hi: 'शिकायत दर्ज होने के २४ घंटे के भीतर सत्यापन प्रक्रिया शुरू होती है.',
    en: 'Verification and editorial review begins within 24 hours.',
  },
  grievanceFormTitle: {
    mr: 'नागरिक तक्रार अर्ज',
    hi: 'नागरिक शिकायत पत्र',
    en: 'Citizen Grievance Submission Form',
  },
  grievanceSuccessMsg: {
    mr: 'आपली तक्रार यशस्वीरीत्या नोंदवण्यात आली आहे. आमचे प्रतिनिधी लवकरच संपर्क साधतील.',
    hi: 'आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है. हमारे संवाददाता जल्द संपर्क करेंगे.',
    en: 'Your grievance has been filed successfully. Our editorial team will investigate soon.',
  },
  fieldName: {
    mr: 'आपले पूर्ण नाव *',
    hi: 'आपका पूरा नाम *',
    en: 'Full Name *',
  },
  fieldMobile: {
    mr: 'मोबाईल क्रमांक *',
    hi: 'मोबाइल नंबर *',
    en: 'Mobile Number *',
  },
  fieldDistrict: {
    mr: 'जिल्हा *',
    hi: 'जिला *',
    en: 'District *',
  },
  fieldTalukaVillage: {
    mr: 'तालुका / गाव *',
    hi: 'तहसील / गांव *',
    en: 'Taluka / Village *',
  },
  fieldSubject: {
    mr: 'तक्रारीचे शीर्षक *',
    hi: 'शिकायत का विषय *',
    en: 'Grievance Subject *',
  },
  fieldDetails: {
    mr: 'तक्रारीचा सविस्तर तपशील *',
    hi: 'शिकायत का विस्तृत विवरण *',
    en: 'Detailed Description of the Issue *',
  },

  // About Us
  aboutOrgBadge: {
    mr: 'संस्थेविषयी',
    hi: 'हमारे बारे में',
    en: 'About Our Organization',
  },
  aboutOrgHeading: {
    mr: 'ग्रामीण भारत टीव्ही व नामदार महाराष्ट्र',
    hi: 'ग्रामीण भारत टीवी और नामदार महाराष्ट्र',
    en: 'Gramin Bharat TV & Namdar Maharashtra',
  },
  aboutOrgSubtitle: {
    mr: 'गावागावांतील समस्यांना वाचा फोडणारे आणि महाराष्ट्रातील जनतेचे हक्काचे व्यासपीठ.',
    hi: 'गांव-गांव की समस्याओं को उजागर करने वाला और जनता का भरोसेमंद मंच.',
    en: 'The dedicated voice of grassroots communities across Maharashtra.',
  },
  aboutCard1Title: {
    mr: 'संपादकीय धोरण',
    hi: 'संपादकीय नीति',
    en: 'Editorial Policy',
  },
  aboutCard1Desc: {
    mr: 'सत्य, निष्पक्षता आणि ग्रामीण भागातील सर्वसामान्य घटकांचा विकास हेच आमचे अग्रक्रम आहेत. कोणत्याही राजकीय दबावाला थारा न देता सत्य मांडणे ही आमची बांधिलकी आहे.',
    hi: 'सत्य, निष्पक्षता और ग्रामीण विकास ही हमारी सर्वोच्च प्राथमिकता है. बिना किसी राजनीतिक दबाव के सच सामने लाना हमारी प्रतिबद्धता है.',
    en: 'Truth, independence, and rural development are our core pillars. We broadcast unbiased ground journalism free from political pressures.',
  },
  aboutCard2Title: {
    mr: 'डिजिटल तंत्रज्ञान व ब्रॉडकास्टिंग',
    hi: 'डिजिटल तकनीक और प्रसारण',
    en: 'Digital Infrastructure',
  },
  aboutCard2Desc: {
    mr: 'अत्याधुनिक क्लाउड CDN, हाय-बँडविड्थ ABR ट्रान्सकोडिंग आणि अल्ट्रा-लो लेटन्सी द्वारे महाराष्ट्राच्या शेवटच्या टोकापर्यंत 4K व HD दर्जाचे अखंड प्रक्षेपण.',
    hi: 'आधुनिक क्लाउड CDN, हाई-बैंडविड्थ ABR ट्रांसकोडिंग और अल्ट्रा-लो लेटेंसी के जरिए ४K और HD क्वालिटी का निर्बाध प्रसारण.',
    en: 'Cutting-edge multi-edge CDN, Adaptive Bitrate HLS transcoding, and ultra-low latency satellite streaming across devices.',
  },
  aboutCard3Title: {
    mr: 'स्थानिक वार्ताहर जाळे',
    hi: 'स्थानीय संवाददाता नेटवर्क',
    en: 'Grassroots Reporter Network',
  },
  aboutCard3Desc: {
    mr: 'प्रत्येक तालुक्यात आणि मोठ्या ग्रामपंचायतींमध्ये स्थानिक वार्ताहरांचे सक्षम जाळे. गावात घडलेली घटना मिनिटांत राज्य पातळीवर पोहोचवण्याचे सामर्थ्य.',
    hi: 'हर तहसील और ग्राम पंचायत में स्थानीय पत्रकारों का नेटवर्क. गांव की घटना मिनटों में राज्य स्तर तक पहुंचाने की क्षमता.',
    en: 'Dedicated journalists in every taluka and gram panchayat, reporting rural achievements and critical issues in real-time.',
  },

  // Contact Section
  contactHeading: {
    mr: 'आमच्याशी संपर्क साधा',
    hi: 'हमसे संपर्क करें',
    en: 'Contact Our Bureau',
  },
  contactSubtitle: {
    mr: 'वृत्त, जाहिरात, वृत्तवाहिनी वितरण किंवा तांत्रिक सहकार्यासाठी आमच्या मुख्य कार्यालयाशी संपर्क साधा.',
    hi: 'समाचार, विज्ञापन, चैनल वितरण या तकनीकी सहायता के लिए हमारे मुख्यालय से संपर्क करें.',
    en: 'Reach out to our editorial desk, advertising team, or broadcast engineering bureau.',
  },
  contactOfficeLabel: {
    mr: 'मुख्य संपादकीय कार्यालय:',
    hi: 'मुख्य संपादकीय कार्यालय:',
    en: 'Editorial Headquarters:',
  },
  contactAddress: {
    mr: 'ग्रामीण भारत टीव्ही मीडिया टॉवर, एफसी रोड, शिवाजीनगर, पुणे - ४११००५, महाराष्ट्र.',
    hi: 'ग्रामीण भारत टीवी मीडिया टावर, एफसी रोड, शिवाजीनगर, पुणे - ४११००५, महाराष्ट्र.',
    en: 'Gramin Bharat TV Media Tower, FC Road, Shivajinagar, Pune - 411005, Maharashtra, India.',
  },
  contactFormTitle: {
    mr: 'संदेश पाठवा',
    hi: 'संदेश भेजें',
    en: 'Send an Inquiry',
  },
  sendMsgBtn: {
    mr: 'संदेश पाठवा',
    hi: 'संदेश भेजें',
    en: 'Submit Message',
  },
  msgSuccess: {
    mr: 'आपला संदेश यशस्वीरीत्या पाठवला आहे. आम्ही लवकरच उत्तर देऊ.',
    hi: 'आपका संदेश सफलतापूर्वक भेजा गया है. हम शीघ्र ही उत्तर देंगे.',
    en: 'Your message has been sent successfully. We will reply shortly.',
  },
  readFullStory: {
    mr: 'संपूर्ण बातमी वाचा',
    hi: 'पूरी खबर पढ़ें',
    en: 'Read Full Story',
  },
  closeModal: {
    mr: 'बंद करा',
    hi: 'बंद करें',
    en: 'Close',
  },

  // Footer
  footerTagline: {
    mr: 'महाराष्ट्रातील ३६ जिल्हे, ३५० तालुके आणि ४०,००० गावांपर्यंत पोहोचणारे अग्रगण्य वृत्त व ओटीटी नेटवर्क.',
    hi: 'पूरे महाराष्ट्र के ३६ जिलों, ३५० तहसीलों और ४०,००० गांवों तक पहुंचने वाला प्रमुख मीडिया नेटवर्क.',
    en: 'Premier news broadcasting and OTT streaming network across 36 districts and 40,000+ villages in Maharashtra.',
  },
  allRightsReserved: {
    mr: 'सर्व हक्क राखीव. भारत सरकार नोंदणीकृत डिजिटल वृत्तसंस्था.',
    hi: 'सर्वाधिकार सुरक्षित. भारत सरकार पंजीकृत डिजिटल समाचार एजेंसी.',
    en: 'All Rights Reserved. Registered Digital Media Network.',
  },

  // Admin Console & Dashboard Translations
  adminRoleLabel: {
    mr: 'भूमिका:',
    hi: 'भूमिका:',
    en: 'Role:',
  },
  roleSuperAdmin: {
    mr: 'सुपर ॲडमिन',
    hi: 'सुपर एडमिन',
    en: 'Super Admin',
  },
  roleNewsEditor: {
    mr: 'वृत्त संपादक',
    hi: 'समाचार संपादक',
    en: 'News Editor',
  },
  roleContentManager: {
    mr: 'कंटेंट व्यवस्थापक',
    hi: 'कंटेंट प्रबंधक',
    en: 'Content Manager',
  },
  roleVideoManager: {
    mr: 'व्हिडिओ व्यवस्थापक',
    hi: 'वीडियो प्रबंधक',
    en: 'Video Manager',
  },
  roleReporter: {
    mr: 'वार्ताहर / प्रतिनिधी',
    hi: 'संवाददाता / रिपोर्टर',
    en: 'Field Reporter',
  },
  roleAdManager: {
    mr: 'जाहिरात व्यवस्थापक',
    hi: 'विज्ञापन प्रबंधक',
    en: 'Ad Manager',
  },
  roleFinanceManager: {
    mr: 'वित्त व्यवस्थापक',
    hi: 'वित्त प्रबंधक',
    en: 'Finance Manager',
  },
  sectionMedia: {
    mr: 'ओटीटी मीडिया व थेट प्रक्षेपण',
    hi: 'ओटीटी मीडिया और लाइव प्रसारण',
    en: 'OTT Media & Broadcasting',
  },
  sectionMonetization: {
    mr: 'कमाई, वितरण आणि सुरक्षा',
    hi: 'कमाई, वितरण और सुरक्षा',
    en: 'Monetization, Delivery & RBAC',
  },
  navDashboard: {
    mr: 'मुख्य डॅशबोर्ड',
    hi: 'मुख्य डैशबोर्ड',
    en: 'Dashboard',
  },
  navLiveTVAdmin: {
    mr: 'थेट प्रक्षेपण',
    hi: 'लाइव प्रसारण',
    en: 'Live TV',
  },
  navNewsCMS: {
    mr: 'बातम्या व्यवस्थापन',
    hi: 'समाचार प्रबंधन',
    en: 'News CMS',
  },
  navGrievancesAdmin: {
    mr: 'जनतेचा आवाज',
    hi: 'जनता की आवाज',
    en: 'Citizen Grievances',
  },
  navMoviesAdmin: {
    mr: 'चित्रपट',
    hi: 'फ़िल्में',
    en: 'Movies & Films',
  },
  navSeriesAdmin: {
    mr: 'वेब मालिका',
    hi: 'वेब सीरीज़',
    en: 'Web Series',
  },
  navPodcastsAdmin: {
    mr: 'पॉडकास्ट',
    hi: 'पॉडकास्ट',
    en: 'Podcasts',
  },
  navNotifications: {
    mr: 'पुश सूचना केंद्र',
    hi: 'पुश सूचनाएं',
    en: 'Push Alerts',
  },
  navAds: {
    mr: 'जाहिरात मोहीम',
    hi: 'विज्ञापन अभियान',
    en: 'Advertisements',
  },
  navBanners: {
    mr: 'मुख्य बॅनर्स',
    hi: 'मुख्य बैनर',
    en: 'Hero Banners',
  },
  navPlansAdmin: {
    mr: 'वर्गणी प्लॅन्स',
    hi: 'सब्सक्रिप्शन प्लान्स',
    en: 'Plans & Billing',
  },
  navUsers: {
    mr: 'नोंदणीकृत प्रेक्षक',
    hi: 'पंजीकृत दर्शक',
    en: 'Subscribers',
  },
  navReports: {
    mr: 'अहवाल व आकडेवारी',
    hi: 'रिपोर्ट्स और आंकड़े',
    en: 'Reports & Analytics',
  },
  navAdmins: {
    mr: 'प्रशासक व अधिकार',
    hi: 'प्रशासक और अनुमतियां',
    en: 'Admins & RBAC',
  },
  navCompanyInfo: {
    mr: 'कंपनी व पोर्टल माहिती',
    hi: 'कंपनी और पोर्टल जानकारी',
    en: 'Company & Portal Info',
  },
  navSettings: {
    mr: 'सुरक्षा व संरचना',
    hi: 'सुरक्षा और संरचना',
    en: 'CDN & Security',
  },
  cleanCache: {
    mr: 'कॅशे रीसेट करा',
    hi: 'कैश रीसेट करें',
    en: 'Clean local cache',
  },
  logoutBtn: {
    mr: 'बाहेर पडा',
    hi: 'लॉग आउट',
    en: 'Logout',
  },
  searchPlaceholderAdmin: {
    mr: 'चित्रपट, मालिका, बातम्या, थेट प्रक्षेपण शोधा...',
    hi: 'फ़िल्में, सीरीज़, समाचार, लाइव टीवी खोजें...',
    en: 'Search movies, series, news, live TV, locations...',
  },
  searchResultsTitle: {
    mr: 'शोध निकाल',
    hi: 'खोज परिणाम',
    en: 'Search Results',
  },
  noSearchResults: {
    mr: 'कोणतेही निकाल आढळले नाहीत',
    hi: 'कोई परिणाम नहीं मिला',
    en: 'No results found',
  },
  cdnActive: {
    mr: 'नेटवर्क एज: सक्रिय',
    hi: 'नेटवर्क एज: सक्रिय',
    en: 'CDN Edge: Active',
  },
  createNew: {
    mr: 'नवीन तयार करा',
    hi: 'नया बनाएं',
    en: 'Create New',
  },
  actionLiveTV: {
    mr: 'थेट टीव्ही प्रक्षेपण',
    hi: 'लाइव टीवी प्रसारण',
    en: 'Live TV Stream',
  },
  actionNews: {
    mr: 'बातमी प्रकाशित करा',
    hi: 'समाचार प्रकाशित करें',
    en: 'Publish News',
  },
  actionMovie: {
    mr: 'चित्रपट जोडा',
    hi: 'फ़िल्म जोड़ें',
    en: 'Upload Movie',
  },
  actionSeries: {
    mr: 'नवीन वेब मालिका',
    hi: 'नई वेब सीरीज़',
    en: 'New Web Series',
  },
  actionAd: {
    mr: 'नवीन जाहिरात मोहीम',
    hi: 'नया विज्ञापन अभियान',
    en: 'New Ad Campaign',
  },
  heroStudioTitle: {
    mr: 'प्रक्षेपण व ऑपरेशन्स केंद्र',
    hi: 'प्रसारण और ऑपरेशन्स केंद्र',
    en: 'Streaming Operations Studio',
  },
  heroStudioDesc: {
    mr: 'गावापासून महाराष्ट्रापर्यंत – जनतेचा आवाज • हाय-बँडविड्थ 4K/HLS बनी स्ट्रीम वितरण आणि थेट क्लाउड व्यवस्थापन.',
    hi: 'गांव से महाराष्ट्र तक – जनता की आवाज • हाई-बैंडविड्थ 4K/HLS बनी स्ट्रीम वितरण और लाइव क्लाउड प्रबंधन.',
    en: 'From Villages to Maharashtra – Voice of People • High-bandwidth 4K/HLS Bunny Stream delivery & live cloud management.',
  },
  liveBroadcastEdge: {
    mr: 'थेट प्रक्षेपण केंद्र',
    hi: 'लाइव प्रसारण केंद्र',
    en: 'Live Broadcast Edge',
  },
  statActiveSubscribers: {
    mr: 'सक्रिय वर्गणीदार',
    hi: 'सक्रिय ग्राहक',
    en: 'Active Subscribers',
  },
  statMonthlyRevenue: {
    mr: 'मासिक आवर्ती महसूल',
    hi: 'मासिक आवर्ती राजस्व',
    en: 'Monthly Recurring Revenue',
  },
  statStreamingViews: {
    mr: 'प्रवाह दृश्ये (३० दिवस)',
    hi: 'स्ट्रीमिंग व्यूज (३० दिन)',
    en: 'Streaming Views (30d)',
  },
  statBunnyBandwidth: {
    mr: 'बनी CDN बँडविड्थ',
    hi: 'बनी CDN बैंडविड्थ',
    en: 'Bunny CDN Bandwidth',
  },
  statLiveMetric: {
    mr: 'थेट सक्रिय',
    hi: 'लाइव सक्रिय',
    en: 'Live Metric',
  },
  statOptimalEdge: {
    mr: 'इष्टतम एज',
    hi: 'अनुकूलतम एज',
    en: 'Optimal edge',
  },
  statViews: {
    mr: 'दृश्ये',
    hi: 'व्यूज',
    en: 'views',
  },
  telemetryTitle: {
    mr: 'बनी स्ट्रीम ग्लोबल CDN व एज इनजेशन',
    hi: 'बनी स्ट्रीम ग्लोबल CDN और एज इनजेशन',
    en: 'Bunny Stream Global CDN & Edge Ingestion',
  },
  telemetryDesc: {
    mr: 'मल्टी-रिजन एज कॅशिंग आणि अडॅप्टिव्ह बिटरेट (ABR) ट्रान्सकोडिंग टेलिमेट्री',
    hi: 'मल्टी-रीजन एज कैशिंग और एडेप्टिव बिटरेट (ABR) ट्रांसकोडिंग टेलीमेट्री',
    en: 'Multi-region edge caching and adaptive bitrate (ABR) transcoding telemetry',
  },
  clustersOperational: {
    mr: 'सर्व क्लस्टर्स सुरळीत सुरू आहेत',
    hi: 'सभी क्लस्टर सुचारू रूप से चालू हैं',
    en: 'All Clusters Operational',
  },
  latencyTitle: {
    mr: 'सरासरी जागतिक लेटन्सी',
    hi: 'औसत वैश्विक लेटेंसी',
    en: 'Avg Global Latency',
  },
  cacheRatio: {
    mr: '९९.९८% कॅशे अचूकता',
    hi: '९९.९८% कैश सटीकता',
    en: '99.98% Cache Hit Ratio',
  },
  hlsTitle: {
    mr: 'HLS व्हिडिओ रिझोल्यूशन',
    hi: 'HLS वीडियो रिज़ॉल्यूशन',
    en: 'HLS Renditions',
  },
  adaptiveBitrate: {
    mr: 'अडॅप्टिव्ह बिटरेट (१४४p - ४K)',
    hi: 'एडाप्टिव बिटरेट (१४४p - ४K)',
    en: 'Adaptive Bitrate (144p - 4K)',
  },
  securityTitle: {
    mr: 'चाचेगिरी विरोधी सुरक्षा',
    hi: 'पायरेसी रोधी सुरक्षा',
    en: 'Anti-Piracy Security',
  },
  tokenAuth: {
    mr: 'टोकन ऑथेंटिकेशन सक्रिय',
    hi: 'टोकन प्रमाणीकरण सक्रिय',
    en: 'Token Authentication Active',
  },
  dbTitle: {
    mr: 'फायरबेस क्लाउड डेटाबेस',
    hi: 'फ़ायरबेस क्लाउड डेटाबेस',
    en: 'Firebase Cloud DB',
  },
  syncConnected: {
    mr: 'थेट सिंक कनेक्टेड',
    hi: 'लाइव सिंक कनेक्टेड',
    en: 'Live Sync Connected',
  },
  catalogTitle: {
    mr: 'प्रक्षेपण कॅटलॉग कामगिरी',
    hi: 'स्ट्रीमिंग कैटलॉग प्रदर्शन',
    en: 'Streaming Catalog Performance',
  },
  catalogDesc: {
    mr: 'रिअल-टाइम प्रेक्षक सहभाग, प्रेक्षक धारणा आणि स्ट्रीमिंग बिटरेट',
    hi: 'रीयल-टाइम दर्शक जुड़ाव, दर्शक ठहराव और स्ट्रीमिंग बिटरेट',
    en: 'Real-time content engagement, viewer retention & streaming bitrate',
  },
  viewFullCatalog: {
    mr: 'संपूर्ण कॅटलॉग पहा',
    hi: 'पूरा कैटलॉग देखें',
    en: 'View full catalog',
  },
  noCatalogItems: {
    mr: 'अद्याप कोणताही चित्रपट किंवा मालिका जोडली नाही',
    hi: 'अभी तक कोई फ़िल्म या सीरीज़ नहीं जोड़ी गई',
    en: 'No active titles yet in catalog',
  },
  colTitle: {
    mr: 'शीर्षक',
    hi: 'शीर्षक',
    en: 'Title',
  },
  colType: {
    mr: 'प्रकार व रिझोल्यूशन',
    hi: 'प्रकार और रिज़ॉल्यूशन',
    en: 'Type & Rendition',
  },
  colCategory: {
    mr: 'श्रेणी',
    hi: 'श्रेणी',
    en: 'Category',
  },
  colViews: {
    mr: 'दृश्ये',
    hi: 'व्यूज',
    en: 'Views',
  },
  colStatus: {
    mr: 'स्थिती',
    hi: 'स्थिति',
    en: 'Status',
  },

  // Hero Banners Carousel Management
  bannersTitle: {
    mr: 'होम हिरो मुख्य बॅनर',
    hi: 'होम हीरो मुख्य बैनर',
    en: 'Home Hero Banners Carousel',
  },
  bannersSubtitle: {
    mr: 'फ्लटर मोबाईल ॲप आणि वेब होम स्क्रीनवर दिसणारे मुख्य हिरो बॅनर नियंत्रित व व्यवस्थापित करा.',
    hi: 'फ्लटर मोबाइल ऐप और वेब होम स्क्रीन पर प्रदर्शित मुख्य हीरो बैनर प्रबंधित करें।',
    en: 'Manage high-impact hero carousel banners displayed on Flutter and Web home feeds.',
  },
  addHeroBanner: {
    mr: '+ नवीन बॅनर जोडा',
    hi: '+ नया बैनर जोड़ें',
    en: '+ Add Hero Banner',
  },
  liveHeroPreviewTitle: {
    mr: 'थेट मुख्य बॅनर पूर्वावलोकन',
    hi: 'लाइव मुख्य बैनर पूर्वावलोकन',
    en: 'Live Hero Spotlight Preview',
  },
  autoCyclingSubtitle: {
    mr: 'सक्रिय मुख्य बॅनर आपोआप फिरत आहे',
    hi: 'सक्रिय मुख्य बैनर स्वचालित रूप से घूम रहा है',
    en: 'Auto-cycling top active banner',
  },
  watchNow: {
    mr: 'आता पहा',
    hi: 'अभी देखें',
    en: 'Watch Now',
  },
  moreInfo: {
    mr: 'अधिक माहिती',
    hi: 'अधिक जानकारी',
    en: 'More Info',
  },
  configuredBannersQueue: {
    mr: 'सेट केलेल्या बॅनर्सची यादी',
    hi: 'कॉन्फ़िगर किए गए बैनरों की कतार',
    en: 'Configured Banners Queue',
  },
  noActiveBanners: {
    mr: 'पूर्वावलोकन करण्यासाठी कोणतेही सक्रिय बॅनर उपलब्ध नाहीत.',
    hi: 'पूर्वावलोकन के लिए कोई सक्रिय बैनर नहीं है।',
    en: 'No active banners to preview.',
  },
  linkedToContent: {
    mr: 'जोडलेली सामग्री:',
    hi: 'लिंक की गई सामग्री:',
    en: 'Linked to:',
  },
  bannerActive: {
    mr: 'सक्रिय',
    hi: 'सक्रिय',
    en: 'Active',
  },
  bannerDisabled: {
    mr: 'बंद',
    hi: 'निष्क्रिय',
    en: 'Disabled',
  },
  activateAction: {
    mr: 'सुरू करा',
    hi: 'सक्रिय करें',
    en: 'Activate',
  },
  deactivateAction: {
    mr: 'बंद करा',
    hi: 'निष्क्रिय करें',
    en: 'Deactivate',
  },
  editHeroBanner: {
    mr: 'हिरो बॅनर संपादित करा',
    hi: 'हीरो बैनर संपादित करें',
    en: 'Edit Hero Banner',
  },
  createHeroBanner: {
    mr: 'नवीन हिरो बॅनर तयार करा',
    hi: 'नया हीरो बैनर बनाएं',
    en: 'Create New Hero Banner',
  },
  bannerTitleLabel: {
    mr: 'बॅनर शीर्षक *',
    hi: 'बैनर शीर्षक *',
    en: 'Banner Title *',
  },
  bannerSubtitleLabel: {
    mr: 'उपशीर्षक / टॅगलाइन',
    hi: 'उपशीर्षक / टैगलाइन',
    en: 'Subtitle / Tagline',
  },
  badgePillLabel: {
    mr: 'बॅज / लेबल',
    hi: 'बैज / लेबल',
    en: 'Badge Pill',
  },
  badgePillPlaceholder: {
    mr: 'उदा. ट्रेंडिंग #१, नवीन भाग',
    hi: 'उदा. ट्रेंडिंग #1, नया एपिसोड',
    en: 'e.g. Trending #1, New Episode',
  },
  linkedContentLabel: {
    mr: 'संबंधित चित्रपट / मालिका',
    hi: 'संबंधित सामग्री',
    en: 'Linked Content',
  },
  bannerArtworkLabel: {
    mr: 'बॅनर पोस्टर / प्रतिमा',
    hi: 'बैनर आर्टवर्क',
    en: 'Banner Artwork',
  },
  showInCarouselLabel: {
    mr: 'ॲप आणि वेब कॅरोसेलमध्ये दाखवा',
    hi: 'ऐप और वेब हिंडोला में दिखाएं',
    en: 'Show in App Carousel',
  },
  saveBannerBtn: {
    mr: 'बॅनर जतन करा',
    hi: 'बैनर सहेजें',
    en: 'Save Banner',
  },
  cancelBtn: {
    mr: 'रद्द करा',
    hi: 'रद्द करें',
    en: 'Cancel',
  },
  deleteBannerTitle: {
    mr: 'बॅनर हटवायचे आहे का?',
    hi: 'क्या बैनर हटाना चाहते हैं?',
    en: 'Delete Banner?',
  },
  deleteBannerMsg: {
    mr: 'तुम्हाला हा बॅनर नक्की हटवायचा आहे का?',
    hi: 'क्या आप वाकई इस बैनर को हटाना चाहते हैं?',
    en: 'Are you sure you want to remove this banner?',
  },
  bannerTitleRequired: {
    mr: 'कृपया बॅनरचे शीर्षक प्रविष्ट करा',
    hi: 'कृपया बैनर का शीर्षक दर्ज करें',
    en: 'Please enter a banner title',
  },
  saveBannerError: {
    mr: 'बॅनर जतन करता आला नाही. कृपया पुन्हा प्रयत्न करा.',
    hi: 'बैनर सहेजा नहीं जा सका। कृपया पुनः प्रयास करें।',
    en: 'Could not save banner. Please try again.',
  },

  // Badges & Status Translations
  badgeLiveTV: {
    mr: 'थेट टीव्ही',
    hi: 'लाइव टीवी',
    en: 'Live TV',
  },
  badgeNews: {
    mr: 'बातम्या',
    hi: 'समाचार',
    en: 'News',
  },
  badgeCitizen: {
    mr: 'नागरिक',
    hi: 'नागरिक',
    en: 'Citizen',
  },
  badge4KVOD: {
    mr: 'चित्रपट',
    hi: 'फ़िल्में',
    en: '4K VOD',
  },
  badgeSeasons: {
    mr: 'मालिका',
    hi: 'सीरीज़',
    en: 'Seasons',
  },
  badgePodcast: {
    mr: 'ऑडिओ',
    hi: 'ऑडियो',
    en: 'Audio',
  },
  badgeFCM: {
    mr: 'सूचना',
    hi: 'सूचना',
    en: 'FCM',
  },
  badgeMonetization: {
    mr: 'कमाई',
    hi: 'कमाई',
    en: 'Monetization',
  },
  badgeReports: {
    mr: 'अहवाल',
    hi: 'रिपोर्ट्स',
    en: 'Excel/PDF',
  },
  engineStatusText: {
    mr: 'बनी सीडीएन + क्लाउड डेटाबेस',
    hi: 'बनी सीडीएन + क्लाउड डेटाबेस',
    en: 'Bunny CDN + Cloud Firestore',
  },
  colTier: {
    mr: 'श्रेणी',
    hi: 'श्रेणी',
    en: 'Tier',
  },
  tierPremium: {
    mr: '★ प्रीमियम',
    hi: '★ प्रीमियम',
    en: '★ Premium',
  },
  tierFree: {
    mr: 'मोफत',
    hi: 'मुफ़्त',
    en: 'Free',
  },
  statusPublished: {
    mr: 'प्रकाशित',
    hi: 'प्रकाशित',
    en: 'Published',
  },
  statusDraft: {
    mr: 'मसुदा',
    hi: 'प्रारूप',
    en: 'Draft',
  },
  statStandby: {
    mr: 'सज्ज',
    hi: 'तैयार',
    en: 'Standby',
  },

  // Page Titles for Pure Localization
  pageTitleMovies: {
    mr: 'चित्रपट संग्रह',
    hi: 'फ़िल्में संग्रह',
    en: 'Movies Catalog (VOD)',
  },
  pageTitleSeries: {
    mr: 'वेब मालिका व भाग',
    hi: 'वेब सीरीज़ और एपिसोड',
    en: 'Web Series & Seasons Studio',
  },
  pageTitleLive: {
    mr: 'थेट प्रक्षेपण केंद्र',
    hi: 'लाइव प्रसारण केंद्र',
    en: 'Live TV Channels CMS',
  },
  pageTitleNews: {
    mr: 'बातम्या व्यवस्थापन',
    hi: 'समाचार प्रबंधन',
    en: 'News Management CMS',
  },
  pageTitleGrievances: {
    mr: 'जनतेचा आवाज तक्रारी',
    hi: 'जनता की आवाज शिकायतें',
    en: 'Citizen Grievances CMS',
  },
  pageTitleNotifications: {
    mr: 'पुश सूचना केंद्र',
    hi: 'पुश सूचना केंद्र',
    en: 'Push Alerts Console',
  },
  pageTitlePlans: {
    mr: 'वर्गणी प्लॅन्स व्यवस्थापन',
    hi: 'सब्सक्रिप्शन प्लान्स प्रबंधन',
    en: 'Plans & Pricing in ₹ INR',
  },
  pageTitleAds: {
    mr: 'जाहिरात व्यवस्थापन',
    hi: 'विज्ञापन प्रबंधन',
    en: 'Advertisement CMS',
  },
  pageTitleUsers: {
    mr: 'नोंदणीकृत प्रेक्षक व्यवस्थापन',
    hi: 'पंजीकृत दर्शक प्रबंधन',
    en: 'Users & Device Enforcement',
  },
  pageTitleReports: {
    mr: 'अहवाल व विश्लेषण',
    hi: 'रिपोर्ट्स और विश्लेषण',
    en: 'Reports & Analytics',
  },
  pageTitleAdmins: {
    mr: 'प्रशासक व भूमिका व्यवस्थापन',
    hi: 'प्रशासक और भूमिका प्रबंधन',
    en: 'Admin Roles & RBAC',
  },
  pageTitleSettings: {
    mr: 'प्रक्षेपण व सुरक्षा सेटिंग्ज',
    hi: 'प्रसारण और सुरक्षा सेटिंग्स',
    en: 'Streaming Infrastructure Settings',
  },

  // Table Headers & Columns
  colNewsTitle: {
    mr: 'बातमी व शीर्षक',
    hi: 'समाचार व शीर्षक',
    en: 'News Title',
  },
  colLocation: {
    mr: 'जिल्हा व स्थान',
    hi: 'जिला व स्थान',
    en: 'Location',
  },
  colReporter: {
    mr: 'वार्ताहर',
    hi: 'संवाददाता',
    en: 'Reporter',
  },
  colActions: {
    mr: 'कृती',
    hi: 'कार्रवाई',
    en: 'Actions',
  },
  colCampaign: {
    mr: 'मोहीम व प्रायोजक',
    hi: 'अभियान व प्रायोजक',
    en: 'Campaign & Sponsor',
  },
  colSlot: {
    mr: 'प्रकार व जागा',
    hi: 'प्रकार व स्थान',
    en: 'Type & Slot',
  },
  colClicks: {
    mr: 'क्लिक्स',
    hi: 'क्लिक्स',
    en: 'Clicks',
  },
  colDates: {
    mr: 'कालावधी',
    hi: 'अवधि',
    en: 'Dates',
  },
  colUserPhone: {
    mr: 'प्रेक्षक व मोबाईल',
    hi: 'दर्शक व मोबाइल',
    en: 'User & Phone',
  },
  colRegistered: {
    mr: 'नोंदणी तारीख',
    hi: 'पंजीकरण तिथि',
    en: 'Registered',
  },
  colActiveDevices: {
    mr: 'सक्रिय उपकरणे',
    hi: 'सक्रिय उपकरण',
    en: 'Active Devices',
  },
  colSubscription: {
    mr: 'वर्गणी स्थिती',
    hi: 'सदस्यता स्थिति',
    en: 'Subscription',
  },
  colPlanExpiry: {
    mr: 'प्लॅन मुदत',
    hi: 'प्लान समाप्ति',
    en: 'Plan Expiry',
  },
  colAdminProfile: {
    mr: 'प्रशासक प्रोफाइल',
    hi: 'प्रशासक प्रोफ़ाइल',
    en: 'Admin Profile',
  },
  colEmail: {
    mr: 'ईमेल पत्ता',
    hi: 'ईमेल पता',
    en: 'Email Address',
  },
  colRole: {
    mr: 'भूमिका व अधिकार',
    hi: 'भूमिका व अधिकार',
    en: 'Role & Permissions',
  },
  colCreatedDate: {
    mr: 'तयार केल्याची तारीख',
    hi: 'सृजन तिथि',
    en: 'Created Date',
  },
  colLastActive: {
    mr: 'शेवटचे सक्रिय',
    hi: 'अंतिम सक्रिय',
    en: 'Last Active',
  },

  // Report Tabs & Analytics
  reportTabDistrict: {
    mr: 'जिल्हानिहाय अहवाल',
    hi: 'जिलेवार रिपोर्ट',
    en: 'District Analytics',
  },
  reportTabDaily: {
    mr: 'दैनिक प्रेक्षक संख्या',
    hi: 'दैनिक दर्शक संख्या',
    en: 'Daily Views',
  },
  reportTabMonthly: {
    mr: 'मासिक अहवाल',
    hi: 'मासिक रिपोर्ट',
    en: 'Monthly Views',
  },
  reportTabUsers: {
    mr: 'वर्गणीदार यादी',
    hi: 'ग्राहक सूची',
    en: 'User Report',
  },
  reportTabRevenue: {
    mr: 'महसूल अहवाल',
    hi: 'राजस्व रिपोर्ट',
    en: 'Revenue Report',
  },
  reportTabAds: {
    mr: 'जाहिरात कामगिरी',
    hi: 'विज्ञापन प्रदर्शन',
    en: 'Ads Performance',
  },
  reportTabContent: {
    mr: 'कंटेंट कामगिरी',
    hi: 'सामग्री प्रदर्शन',
    en: 'Content Performance',
  },
  reportCertifiedExport: {
    mr: 'प्रमाणित अहवाल',
    hi: 'प्रमाणित रिपोर्ट',
    en: 'Certified Export',
  },
  reportExcelPdfSupport: {
    mr: 'एक्सेल व PDF सपोर्ट',
    hi: 'एक्सेल और PDF सपोर्ट',
    en: 'Excel & PDF Certified Export',
  },
  reportTotalMhViews: {
    mr: 'एकूण महाराष्ट्र दृश्ये',
    hi: 'कुल महाराष्ट्र व्यूज',
    en: 'Total Maharashtra Views',
  },
  reportTotalWatchTime: {
    mr: 'एकूण पाहण्याचा वेळ',
    hi: 'कुल देखने का समय',
    en: 'Total Watch Time',
  },
  reportPaidSubscribers: {
    mr: 'प्रीमियम वर्गणीदार',
    hi: 'प्रीमियम ग्राहक',
    en: 'Paid Subscribers',
  },
  reportMonthlyRevenue: {
    mr: 'मासिक महसूल',
    hi: 'मासिक राजस्व',
    en: 'Monthly Revenue',
  },

  // Filters & General UI Actions
  filterAllDistricts: {
    mr: 'सर्व जिल्हे',
    hi: 'सभी जिले',
    en: 'All Districts',
  },
  filterAllPlacements: {
    mr: 'सर्व जागा',
    hi: 'सभी स्थान',
    en: 'All Placements',
  },
  filterAllStatus: {
    mr: 'सर्व स्थिती',
    hi: 'सभी स्थिति',
    en: 'All Status',
  },
  filterAllGenres: {
    mr: 'सर्व प्रकार',
    hi: 'सभी श्रेणियां',
    en: 'All Genres',
  },
  statusActive: {
    mr: 'सक्रिय',
    hi: 'सक्रिय',
    en: 'Active',
  },
  statusDisabled: {
    mr: 'निष्क्रिय',
    hi: 'निष्क्रिय',
    en: 'Disabled',
  },
  statusPending: {
    mr: 'प्रलंबित',
    hi: 'लंबित',
    en: 'Pending',
  },
  statusVerified: {
    mr: 'पडताळणी पूर्ण',
    hi: 'सत्यापित',
    en: 'Verified',
  },
  statusResolved: {
    mr: 'निवारण झाले',
    hi: 'समाधान हुआ',
    en: 'Resolved',
  },
  refreshBtn: {
    mr: 'माहिती रिफ्रेश करा',
    hi: 'डेटा रिफ्रेश करें',
    en: 'Refresh Data',
  },
  exportExcel: {
    mr: 'एक्सेल / CSV',
    hi: 'एक्सेल / CSV',
    en: 'Export Excel / CSV',
  },
  exportPDF: {
    mr: 'PDF अहवाल',
    hi: 'PDF रिपोर्ट',
    en: 'Download PDF Report',
  },
  loadingText: {
    mr: 'माहिती लोड होत आहे...',
    hi: 'डेटा लोड हो रहा है...',
    en: 'Loading data...',
  },
  noDataText: {
    mr: 'कोणतीही माहिती उपलब्ध नाही.',
    hi: 'कोई डेटा उपलब्ध नहीं है.',
    en: 'No records available.',
  },
  mostPopularTier: {
    mr: 'सर्वाधिक लोकप्रिय',
    hi: 'सर्वाधिक लोकप्रिय',
    en: 'Most Popular Tier',
  },
  durationDaysText: {
    mr: 'दिवसांची मुदत',
    hi: 'दिनों की अवधि',
    en: 'Days Duration',
  },
  maxDevicesText: {
    mr: 'कमाल उपकरणे:',
    hi: 'अधिकतम डिवाइस:',
    en: 'Max Devices:',
  },
  resolutionText: {
    mr: 'रिझोल्यूशन:',
    hi: 'रिज़ॉल्यूशन:',
    en: 'Resolution:',
  },
  concurrentDevices: {
    mr: 'उपकरणे एकाच वेळी',
    hi: 'डिवाइस एक साथ',
    en: 'Concurrent Devices',
  },

  // Notification Forms
  notifTitleLabel: {
    mr: 'सूचनेचा मथळा *',
    hi: 'सूचना का शीर्षक *',
    en: 'Notification Title *',
  },
  notifMessageLabel: {
    mr: 'सूचनेचा संदेश *',
    hi: 'सूचना का संदेश *',
    en: 'Notification Message Body *',
  },
  notifCategoryLabel: {
    mr: 'सूचनेचा प्रकार',
    hi: 'सूचना का प्रकार',
    en: 'Notification Category',
  },
  notifAudienceLabel: {
    mr: 'लक्षित प्रेक्षक',
    hi: 'लक्षित दर्शक',
    en: 'Target Audience',
  },
  notifAllAudience: {
    mr: 'सर्व महाराष्ट्रातील प्रेक्षक',
    hi: 'पूरे महाराष्ट्र के दर्शक',
    en: 'All Maharashtra Audience',
  },
  notifDistrictAudience: {
    mr: 'विशिष्ट जिल्हा',
    hi: 'विशिष्ट जिला',
    en: 'District Specific',
  },
  notifSubscribersOnly: {
    mr: 'सक्रिय वर्गणीदार फक्त',
    hi: 'केवल सक्रिय ग्राहक',
    en: 'Paid Subscribers Only',
  },
  notifSelectDistrict: {
    mr: 'जिल्हा निवडा',
    hi: 'जिला चुनें',
    en: 'Select District',
  },
  notifDeepLinkLabel: {
    mr: 'क्लिक केल्यावर उघडणारी लिंक',
    hi: 'क्लिक करने पर खुलने वाला लिंक',
    en: 'Deep Link / Redirect URL',
  },
  notifSendBtn: {
    mr: 'तात्काळ सूचना पाठवा',
    hi: 'तत्काल सूचना भेजें',
    en: 'Send Notification',
  },
  notifGatewayActive: {
    mr: 'सूचना गेटवे सक्रिय',
    hi: 'सूचना गेटवे सक्रिय',
    en: 'FCM Gateway Online',
  },
  notifNewBroadcast: {
    mr: 'नवीन सूचना पाठवा',
    hi: 'नई सूचना भेजें',
    en: 'Broadcast Notification',
  },

  // Ads
  adActiveCampaigns: {
    mr: 'चालू मोहिमा',
    hi: 'सक्रिय अभियान',
    en: 'Active Campaigns',
  },
  adTotalImpressions: {
    mr: 'एकूण दृश्ये',
    hi: 'कुल इम्प्रेशन्स',
    en: 'Total Impressions',
  },
  adClicksMetric: {
    mr: 'क्लिक संख्या',
    hi: 'क्लिक संख्या',
    en: 'Ad Clicks',
  },
  adAvgCtr: {
    mr: 'सरासरी क्लिक दर (CTR)',
    hi: 'औसत क्लिक दर (CTR)',
    en: 'Avg CTR',
  },
  adCreateNew: {
    mr: 'नवीन जाहिरात जोडा',
    hi: 'नया विज्ञापन जोड़ें',
    en: 'Create Campaign',
  },

  // Users Page
  usersTotalCountLabel: {
    mr: 'एकूण प्रेक्षक:',
    hi: 'कुल दर्शक:',
    en: 'Total Users:',
  },
  usersSearchPlaceholder: {
    mr: 'फोन, नाव किंवा ईमेलनुसार शोधा...',
    hi: 'फ़ोन, नाम या ईमेल से खोजें...',
    en: 'Search by phone, name, email...',
  },

  // Admins Page
  adminsAuthorizedHeading: {
    mr: 'अधिकृत प्रणाली प्रशासक',
    hi: 'अधिकृत सिस्टम प्रशासक',
    en: 'Authorized Console Administrators',
  },
  adminsAddAdminBtn: {
    mr: 'नवीन प्रशासक जोडा',
    hi: 'नया प्रशासक जोड़ें',
    en: 'Add Admin User',
  },
  adminsModalTitle: {
    mr: 'नवीन प्रशासक खाते जोडा',
    hi: 'नया प्रशासक खाता जोड़ें',
    en: 'Add Admin User',
  },

  // Settings Page
  settingsStreamLibId: {
    mr: 'स्ट्रीम लायब्ररी आयडी',
    hi: 'स्ट्रीम लाइब्रेरी आईडी',
    en: 'Stream Library ID',
  },
  settingsBunnyApiKey: {
    mr: 'बनी स्ट्रीम API की',
    hi: 'बनी स्ट्रीम API की',
    en: 'Bunny Stream API Key',
  },
  settingsStorageHeading: {
    mr: 'बनी स्टोरेज झोन व ग्लोबल CDN',
    hi: 'बनी स्टोरेज ज़ोन व ग्लोबल CDN',
    en: 'Bunny Storage Zone & Global CDN',
  },
  settingsStorageDesc: {
    mr: 'चित्रपट पोस्टर्स, बॅनर, मालिका थंबनेल्स आणि बातम्यांसाठी स्टोरेज वितरण.',
    hi: 'फ़िल्म पोस्टर, बैनर, सीरीज़ थंबनेल और समाचारों के लिए स्टोरेज वितरण.',
    en: 'Used for movie posters, series backdrops, episode thumbnails, news media, banners and ads.',
  },
  settingsStorageName: {
    mr: 'स्टोरेज झोन नाव',
    hi: 'स्टोरेज ज़ोन नाम',
    en: 'Storage Zone Name',
  },
  settingsStorageKey: {
    mr: 'स्टोरेज ॲक्सेस की',
    hi: 'स्टोरेज एक्सेस की',
    en: 'Storage Access Key',
  },
  settingsCdnHost: {
    mr: 'CDN पुल झोन होस्टनेम',
    hi: 'CDN पुल ज़ोन होस्टनेम',
    en: 'CDN Pull Zone Hostname',
  },
  settingsTokenKey: {
    mr: 'टोकन सुरक्षा की (चाचेगिरी विरोधी)',
    hi: 'टोकन सुरक्षा की (पायरेसी रोधी)',
    en: 'Token Auth Security Key (Anti-Piracy)',
  },
  settingsSavedMsg: {
    mr: 'संरचना यशस्वीरित्या सेव्ह झाली',
    hi: 'सेटिंग्स सफलतापूर्वक सहेजी गईं',
    en: 'Configuration saved successfully',
  },
  settingsSaveBtn: {
    mr: 'संरचना सेव्ह करा',
    hi: 'सेटिंग्स सहेजें',
    en: 'Save CDN Settings',
  },

  // General & Missing App Keys
  adminConsole: {
    mr: 'प्रशासक कन्सोल',
    hi: 'व्यवस्थापक कंसोल',
    en: 'Admin Console',
  },
  adminLogin: {
    mr: 'प्रशासक लॉगिन',
    hi: 'व्यवस्थापक लॉगिन',
    en: 'Admin Login',
  },
  selectLanguage: {
    mr: 'भाषा निवडा',
    hi: 'भाषा चुनें',
    en: 'Select Language',
  },
  changeLanguage: {
    mr: 'भाषा बदला',
    hi: 'भाषा बदलें',
    en: 'Change Language',
  },
  deleteBtn: {
    mr: 'हटवा',
    hi: 'हटाएं',
    en: 'Delete',
  },
  deleteMovie: {
    mr: 'चित्रपट हटवायचा?',
    hi: 'फ़िल्म हटाएं?',
    en: 'Delete Movie',
  },
  fieldMessage: {
    mr: 'संदेश',
    hi: 'संदेश',
    en: 'Message',
  },
  watchLive: {
    mr: 'थेट पहा',
    hi: 'लाइव देखें',
    en: 'Watch Live',
  },
  syncedAcrossDevices: {
    mr: 'तुमच्या स्मार्ट टीव्ही आणि मोबाईलवर सिंक केलेले',
    hi: 'आपके स्मार्ट टीवी और मोबाइल पर सिंक किया गया',
    en: 'Synced across your Smart TV & Mobile',
  },
  minutesRemaining: {
    mr: '५७ मिनिटे शिल्लक',
    hi: '५७ मिनट शेष',
    en: '57 minutes remaining',
  },
  resume4K: {
    mr: 'पुन्हा पहा 4K',
    hi: 'फिर से देखें 4K',
    en: 'Resume 4K',
  },
  liveSatelliteFeeds: {
    mr: 'थेट उपग्रह प्रसारण फीड्स',
    hi: 'सीधा उपग्रह प्रसारण फीड्स',
    en: 'Live Broadcasting Satellite Feeds',
  },
  adaptiveHlsLatency: {
    mr: 'अडॅप्टिव्ह HLS • अल्ट्रा लो लेटन्सी',
    hi: 'अनुकूली HLS • अल्ट्रा लो लेटेंसी',
    en: 'Adaptive HLS • Ultra Low Latency',
  },
  currentProgram: {
    mr: 'चालू कार्यक्रम',
    hi: 'वर्तमान कार्यक्रम',
    en: 'Current Program',
  },
  regularBroadcast: {
    mr: 'नियमित थेट प्रक्षेपण',
    hi: 'नियमित सीधा प्रसारण',
    en: 'Regular Broadcast',
  },
  filterAllLanguages: {
    mr: 'सर्व भाषा',
    hi: 'सभी भाषाएं',
    en: 'All Languages',
  },
  filterAllGenresOption: {
    mr: 'सर्व जॉनर',
    hi: 'सभी शैलियां',
    en: 'All Genres',
  },
  viewsCountSuffix: {
    mr: 'व्ह्यूज',
    hi: 'व्यूज',
    en: 'views',
  },
  season1Badge: {
    mr: 'हंगाम १',
    hi: 'सीजन १',
    en: 'Season 1',
  },
  seasonEpisodesBadge: {
    mr: 'हंगाम व भाग',
    hi: 'सीजन और एपिसोड',
    en: 'Seasons & Episodes',
  },
  episodesCount5: {
    mr: '५ भाग',
    hi: '५ एपिसोड',
    en: '5 Episodes',
  },
  ep1FreePreview: {
    mr: 'भाग १ मोफत पूर्वावलोकन',
    hi: 'एपिसोड १ मुफ्त पूर्वावलोकन',
    en: 'Episode 1 Free Preview',
  },
  vipMonetizationBadge: {
    mr: 'व्हीआयपी पास व वर्गणी',
    hi: 'वीआईपी पास और सदस्यता',
    en: 'VIP PASS & SUBSCRIPTION',
  },
  noHiddenFees: {
    mr: 'कोणतीही छुपी फी नाही. कधीही रद्द करा. फोनपे, गुगल पे आणि युपीआय द्वारे १००% सुरक्षित पेमेंट.',
    hi: 'कोई छुपा शुल्क नहीं. कभी भी रद्द करें. PhonePe, Google Pay और UPI द्वारा १००% सुरक्षित भुगतान.',
    en: 'No hidden fees. Cancel anytime. 100% secure payment via PhonePe, Google Pay, UPI & Cards.',
  },
  mostPopular: {
    mr: 'सर्वाधिक लोकप्रिय',
    hi: 'सर्वाधिक लोकप्रिय',
    en: 'Most Popular',
  },
  daysValidity: {
    mr: 'दिवस वैधता',
    hi: 'दिन वैधता',
    en: 'Days Validity',
  },
  daysUnit: {
    mr: 'दिवस',
    hi: 'दिन',
    en: 'days',
  },
  devicesSimultaneous: {
    mr: 'उपकरणे एकाच वेळी',
    hi: 'डिवाइस एक साथ',
    en: 'Devices simultaneously',
  },
  footerNewsPortal: {
    mr: 'बातम्या पोर्टल',
    hi: 'समाचार पोर्टल',
    en: 'News Portal',
  },
  footerLiveTV: {
    mr: 'थेट टीव्ही',
    hi: 'लाइव टीवी',
    en: 'Live TV',
  },
  footerMovies: {
    mr: 'चित्रपट',
    hi: 'फ़िल्में',
    en: 'Movies',
  },
  footerPlans: {
    mr: 'वर्गणी',
    hi: 'सब्सक्रिप्शन',
    en: 'Subscription Plans',
  },
  castLabel: {
    mr: 'कलाकार',
    hi: 'कलाकार',
    en: 'Cast',
  },
  directorLabel: {
    mr: 'दिग्दर्शक',
    hi: 'निर्देशक',
    en: 'Director',
  },
  playNow: {
    mr: 'लगेच पहा',
    hi: 'अभी चलाएं',
    en: 'Play Now',
  },
  removeFromWatchlist: {
    mr: 'यादीतून काढा',
    hi: 'सूची से हटाएं',
    en: 'Remove from Watchlist',
  },
  vipCheckoutTitle: {
    mr: 'व्हीआयपी वर्गणी चेकआउट',
    hi: 'वीआईपी सब्सक्रिप्शन चेकआउट',
    en: 'VIP Subscription Checkout',
  },
  paymentSuccessful: {
    mr: 'पेमेंट यशस्वी झाले!',
    hi: 'भुगतान सफल रहा!',
    en: 'Payment Successful!',
  },
  planActivatedDesc: {
    mr: 'आपला प्लॅन यशस्वीरित्या सक्रिय झाला आहे.',
    hi: 'आपका प्लान सफलतापूर्वक सक्रिय हो गया है.',
    en: 'Your subscription plan has been successfully activated.',
  },
  mobileOrUpiId: {
    mr: 'मोबाईल / UPI ID *',
    hi: 'मोबाइल / UPI ID *',
    en: 'Mobile / UPI ID *',
  },
  razorpaySecure: {
    mr: 'रेझरपे २५६-बिट सुरक्षित पेमेंट गेटवे',
    hi: 'रेज़रपे २५६-बिट सुरक्षित पेमेंट गेटवे',
    en: 'Razorpay 256-bit Secure Gateway',
  },
  acceptedPaymentMethods: {
    mr: 'यूपीआय, गुगल पे, फोनपे, क्रेडिट/डेबिट कार्ड स्वीकारले जातात.',
    hi: 'यूपीआई, गूगल पे, फोनपे, क्रेडिट/डेबिट कार्ड स्वीकार किए जाते हैं.',
    en: 'UPI, Google Pay, PhonePe, and Credit/Debit Cards accepted.',
  },
  payAndActivate: {
    mr: 'पेमेंट करा आणि सुरू करा',
    hi: 'भुगतान करें और सक्रिय करें',
    en: 'Pay & Activate',
  },
  subscriberProfile: {
    mr: 'ग्राहक प्रोफाईल',
    hi: 'उपभोक्ता प्रोफ़ाइल',
    en: 'Subscriber Profile',
  },
  connectedDevices: {
    mr: 'सक्रिय उपकरणे',
    hi: 'सक्रिय उपकरण',
    en: 'Connected Devices',
  },
  myWatchlist: {
    mr: 'माझी आवडीची यादी',
    hi: 'मेरी पसंदीदा सूची',
    en: 'My Watchlist',
  },
  moviesAndShowsCount: {
    mr: 'चित्रपट व शोज',
    hi: 'फ़िल्में और शोज़',
    en: 'movies & shows',
  },
  closeBtn: {
    mr: 'बंद करा',
    hi: 'बंद करें',
    en: 'Close',
  },
  reporterLabel: {
    mr: 'वार्ताहर',
    hi: 'संवाददाता',
    en: 'Reporter',
  },
  dateLabel: {
    mr: 'तारीख',
    hi: 'तारीख',
    en: 'Date',
  },
  ottStreamingBadge: {
    mr: 'ओटीटी स्ट्रीमिंग प्लॅटफॉर्म',
    hi: 'ओटीटी स्ट्रीमिंग प्लेटफॉर्म',
    en: 'OTT Streaming Platform',
  },
  heroMovieTitle: {
    mr: 'शेतकरी राजा: मातीतील सोने (4K)',
    hi: 'धरतीपुत्र: किसान की नई उड़ान (4K)',
    en: 'Silent Green: The Agro Chronicles (4K)',
  },
  heroMovieDesc: {
    mr: 'महाराष्ट्रातील दुष्काळग्रस्त भागातील एका जिद्दी शेतकऱ्याची यशोगाथा. आधुनिक तंत्रज्ञान आणि सेंद्रिय शेतीच्या जोरावर शेती फायदेशीर ठरवणारा प्रेरणादायी कौटुंबिक चित्रपट.',
    hi: 'भारतीय कृषि क्रांति और आधुनिक तकनीक से अपनी तकदीर बदलने वाले एक संघर्षशील किसान की प्रेरणादायक कहानी.',
    en: 'A globally acclaimed saga celebrating the inspiring triumph of rural resilience, modern agriculture, and eco-friendly farming innovation.',
  },
  planFeature1: {
    mr: 'सर्व चित्रपट व वेब मालिका',
    hi: 'सभी फ़िल्में और वेब सीरीज़',
    en: 'All Movies & Web Series',
  },
  planFeature2: {
    mr: 'थेट टीव्ही प्रक्षेपण',
    hi: 'लाइव टीवी प्रसारण',
    en: 'Live TV Streaming',
  },
  planFeature3: {
    mr: 'अल्ट्रा 4K HDR व्हिडिओ',
    hi: 'अल्ट्रा 4K HDR वीडियो',
    en: 'Ultra 4K HDR Video',
  },
  planFeature4: {
    mr: 'जाहिरात विरहित अनुभव',
    hi: 'विज्ञापन मुक्त अनुभव',
    en: 'Ad-Free Experience',
  },
  planFeature5: {
    mr: 'ऑफलाइन डाऊनलोड',
    hi: 'ऑफलाइन डाउनलोड',
    en: 'Offline Downloads',
  },
  planFeature6: {
    mr: 'सर्व स्मार्ट टीव्ही आणि मोबाईल',
    hi: 'सभी स्मार्ट टीवी और मोबाइल',
    en: 'All Smart TVs & Mobile Devices',
  },
  deleteConfirmAd: {
    mr: 'तुम्हाला ही जाहिरात नक्की हटवायची आहे का?',
    hi: 'क्या आप वाकई इस विज्ञापन को हटाना चाहते हैं?',
    en: 'Are you sure you want to delete this advertisement?',
  },
  deleteConfirmGrievance: {
    mr: 'तुम्हाला ही तक्रार नक्की हटवायची आहे का?',
    hi: 'क्या आप वाकई इस शिकायत को हटाना चाहते हैं?',
    en: 'Are you sure you want to delete this grievance?',
  },
  deleteConfirmChannel: {
    mr: 'तुम्हाला हे थेट चॅनेल नक्की हटवायचे आहे का?',
    hi: 'क्या आप वाकई इस लाइव चैनल को हटाना चाहते हैं?',
    en: 'Are you sure you want to delete this live channel?',
  },
  deleteConfirmMovie: {
    mr: 'तुम्हाला हा चित्रपट नक्की हटवायचा आहे का?',
    hi: 'क्या आप वाकई इस फ़िल्म को हटाना चाहते हैं?',
    en: 'Are you sure you want to delete this movie?',
  },
  deleteConfirmNews: {
    mr: 'तुम्हाला ही बातमी नक्की हटवायची आहे का?',
    hi: 'क्या आप वाकई इस समाचार को हटाना चाहते हैं?',
    en: 'Are you sure you want to delete this news article?',
  },
  deleteConfirmNotification: {
    mr: 'तुम्हाला ही पाठवलेली सूचना इतिहासातून हटवायची आहे का?',
    hi: 'क्या आप वाकई इस अधिसूचना को इतिहास से हटाना चाहते हैं?',
    en: 'Are you sure you want to delete this notification from history?',
  },
  deleteConfirmSeries: {
    mr: 'तुम्हाला ही मालिका नक्की हटवायची आहे का?',
    hi: 'क्या आप वाकई इस सीरीज़ को हटाना चाहते हैं?',
    en: 'Are you sure you want to delete this series?',
  },
  deleteConfirmPlan: {
    mr: 'तुम्हाला हा प्लॅन नक्की हटवायचा आहे का?',
    hi: 'क्या आप वाकई इस प्लान को हटाना चाहते हैं?',
    en: 'Are you sure you want to delete this plan?',
  },
  enterTitleAlert: {
    mr: 'कृपया शीर्षक प्रविष्ट करा.',
    hi: 'कृपया शीर्षक दर्ज करें.',
    en: 'Please enter a title.',
  },
  saveErrorAlert: {
    mr: 'सेव्ह करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.',
    hi: 'सहेजते समय त्रुटि हुई. कृपया पुनः प्रयास करें.',
    en: 'Could not save. Please try again.',
  },
  refreshDataBtn: {
    mr: 'माहिती रिफ्रेश करा',
    hi: 'डेटा रिफ्रेश करें',
    en: 'Refresh Data',
  },
  pendingReview: {
    mr: 'प्रलंबित तक्रारी',
    hi: 'लंबित समीक्षा',
    en: 'Pending Review',
  },
  grievancePublishedAlert: {
    mr: '✅ तक्रार यशस्वीरित्या "बातम्या" विभागात प्रसिद्ध करण्यात आली आहे!',
    hi: '✅ शिकायत सफलतापूर्वक "समाचार" अनुभाग में प्रकाशित कर दी गई है!',
    en: '✅ Grievance published successfully to News section!',
  },
  fcmGatewayOnline: {
    mr: 'सूचना गेटवे सक्रिय',
    hi: 'अधिसूचना गेटवे ऑनलाइन',
    en: 'FCM Gateway Online',
  },
  notifSentSuccess: {
    mr: '✅ पुश नोटिफिकेशन सर्व प्रेक्षकांना पाठवले गेले आहे!',
    hi: '✅ पुश अधिसूचना सभी दर्शकों को भेज दी गई है!',
    en: '✅ Push notification sent successfully to all viewers!',
  },
  notifRequiredAlert: {
    mr: 'कृपया सूचनेचा मथळा आणि संदेश प्रविष्ट करा.',
    hi: 'कृपया अधिसूचना शीर्षक और संदेश दर्ज करें.',
    en: 'Please enter notification title and message.',
  },
  adminDescText: {
    mr: 'सुपर ॲडमिन, वृत्त संपादक, कंटेंट व्यवस्थापक आणि वार्ताहर भूमिका व्यवस्थापन.',
    hi: 'सुपर एडमिन, समाचार संपादक, सामग्री प्रबंधक और संवाददाता भूमिका प्रबंधन.',
    en: 'Super Admin, News Editor, Content Manager and Reporter role management.',
  },
  adsDescText: {
    mr: 'बॅनर जाहिराती, व्हिडिओ जाहिराती आणि कमाई व्यवस्थापन.',
    hi: 'बैनर विज्ञापन, वीडियो विज्ञापन और मुद्रीकरण प्रबंधन.',
    en: 'Banner Ads, Video Ads and monetization management.',
  },
  grievanceDescText: {
    mr: 'महाराष्ट्रातील गावागावांतून नागरिकांनी पाठवलेल्या समस्या, रस्ते, पाणी व वीज तक्रारींची पडताळणी.',
    hi: 'महाराष्ट्र के गांवों से नागरिकों द्वारा भेजी गई समस्याओं, सड़क, पानी और बिजली की शिकायतों का सत्यापन.',
    en: 'Verification of citizen issues and grievances from across Maharashtra.',
  },
  moviesDescText: {
    mr: 'मराठी व हिंदी चित्रपट, 4K HLS एन्कोडिंग आणि ऑडिओ-व्हिडिओ व्यवस्थापन.',
    hi: 'मराठी और हिंदी फ़िल्में, 4K HLS एन्कोडिंग और ऑडियो-वीडियो प्रबंधन.',
    en: 'Manage feature films, Bunny Stream HLS encodes, metadata & subtitles.',
  },
  newsDescText: {
    mr: 'जिल्हानिहाय, तालुका व ग्रामीण बातम्या, वार्ताहर नावे व उप-श्रेण्या व्यवस्थापन.',
    hi: 'ज़िलावार, तहसील और ग्रामीण समाचार, संवाददाता नाम और उप-श्रेणियां प्रबंधन.',
    en: 'District, taluka and rural news management.',
  },
  notifDescText: {
    mr: 'ताज्या बातम्या, नवीन चित्रपट, थेट प्रक्षेपण व विशेष कार्यक्रमांच्या तात्काळ सूचना पाठवा.',
    hi: 'ताज़ा ख़बरें, नई फ़िल्में, लाइव प्रसारण और विशेष कार्यक्रमों की तुरंत सूचना भेजें.',
    en: 'Send instant push notifications for breaking news, movies, and live streams.',
  },
  plansDescText: {
    mr: 'भारतीय रुपया (₹) मध्ये दर, कालावधी (दिवस) आणि डिव्हाईस मर्यादा व्यवस्थापन.',
    hi: 'भारतीय रुपया (₹) में दरें, अवधि (दिन) और डिवाइस सीमा प्रबंधन.',
    en: 'Manage subscription plans and pricing in INR.',
  },
  settingsDescText: {
    mr: 'बनी स्ट्रीम व्हिडिओ लायब्ररी, स्टोरेज आणि टोकन सुरक्षा सेटिंग्ज.',
    hi: 'बनी स्ट्रीम वीडियो लाइब्रेरी, स्टोरेज और टोकन सुरक्षा सेटिंग्स.',
    en: 'Configure Bunny Stream Video Libraries, Storage Vaults & Token Authentication.',
  },
  usersDescText: {
    mr: 'नोंदणीकृत मोबाइल OTP / वेब प्रेक्षक, डिव्हाईस मर्यादा व वॉच हिस्ट्री व्यवस्थापन.',
    hi: 'पंजीकृत मोबाइल OTP / वेब दर्शक, डिवाइस सीमा और वॉच हिस्ट्री प्रबंधन.',
    en: 'Browse registered mobile OTP / Web users, monitor multi-device limits & watch history.',
  },
  fieldEmail: {
    mr: 'ईमेल पत्ता *',
    hi: 'ईमेल पता *',
    en: 'Email Address *',
  },
  fieldPassword: {
    mr: 'पासवर्ड',
    hi: 'पासवर्ड',
    en: 'Password',
  },
  loadingStream: {
    mr: 'HLS ABR प्रवाह लोड होत आहे...',
    hi: 'HLS ABR स्ट्रीम लोड हो रहा है...',
    en: 'Loading HLS ABR Stream...',
  },
  liveBroadcastFeed: {
    mr: 'थेट प्रक्षेपण फीड',
    hi: 'सीधा प्रसारण फ़ीड',
    en: 'Live Broadcast Feed',
  },
  closePlayer: {
    mr: 'प्लेअर बंद करा',
    hi: 'प्लेयर बंद करें',
    en: 'Close Player',
  },
  abrSettings: {
    mr: 'गुणवत्ता (ABR स्ट्रीमिंग)',
    hi: 'गुणवत्ता (ABR स्ट्रीमिंग)',
    en: 'Quality (ABR Streaming)',
  },
  autoAdaptiveHls: {
    mr: 'ऑटो (अनुकूलित HLS)',
    hi: 'ऑटो (अनुकूलित HLS)',
    en: 'Auto (Adaptive HLS)',
  },
  adminConsoleSubtitle: {
    mr: 'नामदार महाराष्ट्र • OTT व वृत्त व्यवस्थापन कक्ष',
    hi: 'नामदार महाराष्ट्र • OTT एवं समाचार प्रबंधन कंसोल',
    en: 'Namdar Maharashtra • OTT & News Management Console',
  },
  twoFactorAuth: {
    mr: 'दोन-टप्प्यांची पडताळणी (2FA)',
    hi: 'द्वि-चरणीय प्रमाणीकरण (2FA)',
    en: 'Two-Factor Authentication',
  },
  secureConsole: {
    mr: 'सुरक्षित कक्ष',
    hi: 'सुरक्षित कंसोल',
    en: 'Secure Console',
  },
  continueToDashboard: {
    mr: 'डॅशबोर्डवर जा',
    hi: 'डैशबोर्ड पर आगे बढ़ें',
    en: 'Continue to Dashboard',
  },
  twoFactorPrompt: {
    mr: 'आपल्या ऑथेंटिकेटर अॅपमधील ६-अंकी सुरक्षा कोड टाका (किंवा चाचणीसाठी 123456 प्रविष्ट करा):',
    hi: 'अपने ऑथेंटिकेटर ऐप से ६-अंकीय सुरक्षा कोड दर्ज करें (या परीक्षण के लिए 123456 दर्ज करें):',
    en: 'Enter the 6-digit security passcode from your Authenticator app (or enter 123456 for testing):',
  },
  verifyAndEnter: {
    mr: 'पडताळणी करा व प्रवेश करा',
    hi: 'सत्यापित करें और प्रवेश करें',
    en: 'Verify & Enter',
  },
  adminRolesTitle: {
    mr: 'प्रशासक लॉगिन पर्याय',
    hi: 'प्रशासक लॉगिन विकल्प',
    en: 'Admin Login Roles',
  },
  fullControlDesc: {
    mr: 'पूर्ण नियंत्रण',
    hi: 'पूर्ण नियंत्रण',
    en: 'Full Control',
  },
  publishingDesc: {
    mr: 'प्रकाशन',
    hi: 'प्रकाशन',
    en: 'Publishing',
  },
  draftsOnlyDesc: {
    mr: 'केवळ मसुदे',
    hi: 'केवल ड्राफ्ट',
    en: 'Drafts Only',
  },
  backBtn: {
    mr: 'मागे',
    hi: 'पीछे',
    en: 'Back',
  },
  searchOTTPlaceholder: {
    mr: 'चित्रपट, मालिका किंवा कलाकार शोधा...',
    hi: 'फ़िल्में, सीरीज़ या कलाकार खोजें...',
    en: 'Search movies, series, actors...',
  },
  addNewGrievance: {
    mr: 'नवीन तक्रार नोंदवा',
    hi: 'नई शिकायत दर्ज करें',
    en: 'Add New Grievance',
  },
  modalTitleAddGrievance: {
    mr: 'नवीन नागरिक तक्रार नोंदवा',
    hi: 'नई नागरिक शिकायत दर्ज करें',
    en: 'Register New Citizen Grievance',
  },
  citizenNameLabel: {
    mr: 'नागरिकाचे नाव / तक्रारदार *',
    hi: 'नागरिक का नाम / शिकायतकर्ता *',
    en: 'Citizen / Complainant Name *',
  },
  contactNumberLabel: {
    mr: 'संपर्क / मोबाईल क्रमांक *',
    hi: 'संपर्क / मोबाइल नंबर *',
    en: 'Contact / Mobile Number *',
  },
  districtLabel: {
    mr: 'जिल्हा *',
    hi: 'जिला *',
    en: 'District *',
  },
  talukaLabel: {
    mr: 'तालुका *',
    hi: 'तहसील / तालुका *',
    en: 'Taluka *',
  },
  villageLabel: {
    mr: 'गाव *',
    hi: 'गांव *',
    en: 'Village *',
  },
  categoryLabel: {
    mr: 'तक्रारीचा प्रवर्ग',
    hi: 'शिकायत की श्रेणी',
    en: 'Grievance Category',
  },
  subjectLabel: {
    mr: 'तक्रारीचे शीर्षक / विषय *',
    hi: 'शिकायत का शीर्षक / विषय *',
    en: 'Grievance Title / Subject *',
  },
  detailsLabel: {
    mr: 'सविस्तर तक्रार / समस्या विवरण *',
    hi: 'विस्तृत शिकायत विवरण *',
    en: 'Detailed Grievance Description *',
  },
  mediaUrlLabel: {
    mr: 'फोटो किंवा व्हिडिओ URL (ऐच्छिक)',
    hi: 'फोटो या वीडियो URL (वैकल्पिक)',
    en: 'Photo or Video URL (Optional)',
  },
  statusLabel: {
    mr: 'तक्रारीची सद्यस्थिती',
    hi: 'शिकायत की स्थिति',
    en: 'Grievance Status',
  },
  adminNotesLabel: {
    mr: 'प्रशासक टीप',
    hi: 'व्यवस्थापक टिप्पणी',
    en: 'Admin Notes',
  },
  saveGrievanceBtn: {
    mr: 'तक्रार दाखल करा',
    hi: 'शिकायत दर्ज करें',
    en: 'Submit Grievance',
  },
  savingGrievanceBtn: {
    mr: 'जतन करत आहे...',
    hi: 'दर्ज हो रहा है...',
    en: 'Saving Grievance...',
  },
  grievanceAddedSuccess: {
    mr: 'नवीन तक्रार यशस्वीरीत्या नोंदवली गेली आहे!',
    hi: 'नई शिकायत सफलतापूर्वक दर्ज कर ली गई है!',
    en: 'Grievance successfully registered!',
  },
  fieldTaluka: {
    mr: 'तालुका',
    hi: 'तालुका',
    en: 'Taluka',
  },
  fieldIssueTitle: {
    mr: 'तक्रारीचा / समस्येचा विषय',
    hi: 'शिकायत / समस्या का विषय',
    en: 'Issue Title',
  },
  fieldDesc: {
    mr: 'तपशीलवार वर्णन',
    hi: 'विस्तृत विवरण',
    en: 'Detailed Description',
  },
  aboutUsBadge: {
    mr: 'आमच्याबद्दल',
    hi: 'हमारे बारे में',
    en: 'About Us',
  },
  aboutUsHeading: {
    mr: 'ग्रामीण भारत टीव्ही - जनसामान्यांचा आवाज',
    hi: 'ग्रामीण भारत टीवी - जनता की आवाज',
    en: 'Gramin Bharat TV - Voice of the People',
  },
  aboutUsSubtitle: {
    mr: 'महाराष्ट्रातील खेड्यापाड्यांपासून राजधानीपर्यंत प्रत्येक सत्य आणि बातमी मांडणारे अग्रगण्य व्यासपीठ.',
    hi: 'महाराष्ट्र के गांवों से लेकर राजधानी तक हर खबर पहुंचाने वाला अग्रणी मंच.',
    en: 'Leading news and OTT platform bringing authentic stories and news across Maharashtra.',
  },
  missionTitle: {
    mr: 'ध्येय (Mission)',
    hi: 'लक्ष्य (Mission)',
    en: 'Our Mission',
  },
  missionDesc: {
    mr: 'ग्रामीण व निमशहरी भागातील शेतकरी, कष्टकरी व नागरिकांच्या समस्यांना मुख्य प्रवाहात आणणे.',
    hi: 'ग्रामीण और अर्ध-शहरी क्षेत्रों के किसानों और नागरिकों की समस्याओं को मुख्यधारा में लाना.',
    en: 'Empowering rural citizens by bringing grassroots concerns into mainstream media.',
  },
  visionTitle: {
    mr: 'दृष्टिकोन (Vision)',
    hi: 'दृष्टिकोण (Vision)',
    en: 'Our Vision',
  },
  visionDesc: {
    mr: 'डिजिटल युगात मराठी भाषेतील उच्च दर्जाचे मनोरंजन आणि विश्वासार्ह पत्रकारितेचे केंद्र बनणे.',
    hi: 'डिजिटल युग में मराठी भाषा में उच्च गुणवत्ता वाले मनोरंजन और विश्वसनीय पत्रकारिता का केंद्र बनना.',
    en: 'Becoming the benchmark for regional OTT entertainment and ethical journalism in Maharashtra.',
  },
  editorialEthicsTitle: {
    mr: 'संपादकीय मूल्ये व निष्पक्षता',
    hi: 'संपादकीय मूल्य एवं निष्पक्षता',
    en: 'Editorial Values & Integrity',
  },
  editorialEthicsDesc: {
    mr: 'सत्यता, पारदर्शकता आणि जनहिताला सर्वोच्च प्राधान्य देऊन पत्रकारितेची अखंड परंपरा राखणे.',
    hi: 'सत्यता, पारदर्शिता और जनहित को सर्वोच्च प्राथमिकता देकर पत्रकारिता की अखंड परंपरा बनाए रखना.',
    en: 'Upholding uncompromising journalistic standards with truth, transparency, and public welfare.',
  },
  contactUsBadge: {
    mr: 'संपर्क साधा',
    hi: 'संपर्क करें',
    en: 'Contact Us',
  },
  contactUsHeading: {
    mr: 'आम्हाला भेटा किंवा संदेश पाठवा',
    hi: 'हमसे संपर्क करें या संदेश भेजें',
    en: 'Get in Touch with Our Team',
  },
  contactUsDesc: {
    mr: 'बातम्या, जाहिराती, तक्रारी किंवा सहयोगासाठी आमच्याशी थेट संपर्क साधा.',
    hi: 'समाचार, विज्ञापन, शिकायत या सहयोग के लिए हमसे सीधे संपर्क करें.',
    en: 'Connect with us directly for news tips, advertisements, grievances, or media partnerships.',
  },
  contactEmailLabel: {
    mr: 'ईमेल पत्ता',
    hi: 'ईमेल पता',
    en: 'Email Address',
  },
  headOfficeLabel: {
    mr: 'मुख्यालय / मुख्य कार्यालय',
    hi: 'मुख्यालय / मुख्य कार्यालय',
    en: 'Headquarters / Main Office',
  },
  sendUsMsg: {
    mr: 'संदेश पाठवा',
    hi: 'संदेश भेजें',
    en: 'Send Message',
  },
  contactSuccessMsg: {
    mr: 'तुमचा संदेश आम्हाला प्राप्त झाला आहे. आम्ही लवकरच संपर्क करू!',
    hi: 'आपका संदेश हमें प्राप्त हो गया है। हम जल्द ही संपर्क करेंगे!',
    en: 'Your message has been received. Our team will contact you shortly!',
  },
  fieldMsg: {
    mr: 'तुमचा संदेश',
    hi: 'आपका संदेश',
    en: 'Your Message',
  },

  // Company Information Section (Requirement 1)
  companyInfoBadge: {
    mr: 'अधिकृत कॉर्पोरेट तपशील',
    hi: 'कॉर्पोरेट विवरण',
    en: 'Official Corporate Details',
  },
  companyInfoHeading: {
    mr: 'कंपनी माहिती व माध्यम नेटवर्क',
    hi: 'कंपनी जानकारी एवं मीडिया नेटवर्क',
    en: 'Company Information & Media Network',
  },
  companyInfoSubtitle: {
    mr: 'ग्रामीण भारत टीव्ही व नामदार महाराष्ट्र ही भारत सरकारच्या नियमांनुसार डिजिटल मीडिया आणि थेट उपग्रह प्रक्षेपणातील अग्रणी संस्था आहे.',
    hi: 'ग्रामीण भारत टीवी और नामदार महाराष्ट्र भारत सरकार के नियमों के तहत डिजिटल मीडिया और लाइव प्रसारण में अग्रणी नेटवर्क है।',
    en: 'Gramin Bharat TV and Namdar Maharashtra are premier registered media networks delivering digital broadcasting and 4K OTT entertainment across Maharashtra.',
  },
  companyRegTitle: {
    mr: 'अधिकृत नोंदणी व परवाना',
    hi: 'पंजीकरण और लाइसेंस',
    en: 'Registration & Licensing',
  },
  companyRegDesc: {
    mr: 'माहिती व प्रसारण मंत्रालय (MIB) डिजिटल मीडिया मार्गदर्शक तत्त्वे २०२१ नुसार अधिकृत नोंदणीकृत संस्था. CIN: U92100PN2024PTC198820.',
    hi: 'सूचना एवं प्रसारण मंत्रालय डिजिटल मीडिया दिशानिर्देशों के तहत पंजीकृत।',
    en: 'Registered under Ministry of Information & Broadcasting (MIB) Digital Media Guidelines 2021.',
  },
  companyBureausTitle: {
    mr: 'विभागीय ब्युरो व कार्यालये',
    hi: 'विभागीय ब्यूरो और कार्यालय',
    en: 'Bureaus & Network Offices',
  },
  companyBureausDesc: {
    mr: 'पुणे सेंट्रल मुख्यालय, मुंबई ब्युरो (मंत्रालय कक्ष), छत्रपती संभाजीनगर व नागपूर प्रादेशिक वृत्तकक्ष.',
    hi: 'पुणे केंद्रीय मुख्यालय, मुंबई मंत्रालय ब्यूरो, छत्रपति संभाजीनगर एवं नागपुर ब्यूरो।',
    en: 'Pune Central HQ, Mumbai Mantralaya bureau, and regional news desks across Maharashtra.',
  },
  companyCdnTitle: {
    mr: 'Bunny Stream हाय-स्पीड CDN',
    hi: 'Bunny Stream हाई-स्पीड CDN',
    en: 'Bunny Stream Edge CDN',
  },
  companyCdnDesc: {
    mr: 'जागतिक दर्जाचे Bunny Stream नेटवर्क, ४K रिझोल्यूशन, अडॅप्टिव्ह बिटरेट आणि ९९.९९% अखंड अपटाईम ब्रॉडकास्टिंग.',
    hi: 'विश्वस्तरीय Bunny Stream नेटवर्क, 4K रेजोल्यूशन, एडाप्टिव बिटरेट और 99.99% अपटाइम।',
    en: 'Bunny Stream global edge network with adaptive bitrate HLS 4K video transcoding and 99.99% uptime.',
  },
  companyEditorialTitle: {
    mr: 'संपादकीय नेतृत्व',
    hi: 'संपादकीय नेतृत्व',
    en: 'Editorial Board & Leadership',
  },
  companyEditorialDesc: {
    mr: 'ज्येष्ठ ग्रामीण पत्रकार, कायदेशीर सल्लागार आणि तांत्रिक तज्ज्ञांच्या मार्गदर्शनाखाली चालणारे निष्पक्ष वृत्तसंकलन.',
    hi: 'वरिष्ठ ग्रामीण पत्रकारों और कानूनी सलाहकारों द्वारा संचालित निष्पक्ष पत्रकारिता।',
    en: 'Guided by veteran grassroots journalists, legal counsel, and broadcast technology leaders.',
  },

  // Information Hub Section (Requirement 5)
  infoHubBadge: {
    mr: 'नागरिक व शेतकरी सेवा',
    hi: 'नागरिक एवं किसान सेवाएं',
    en: 'Citizen & Farmer Services',
  },
  infoHubHeading: {
    mr: 'माहिती व लोककल्याण केंद्र',
    hi: 'सूचना एवं लोक कल्याण केंद्र',
    en: 'Information & Citizen Welfare Hub',
  },
  infoHubSubtitle: {
    mr: 'शेतकऱ्यांसाठी शासकीय योजना, कृषी बाजारभाव, दाखले आणि ग्रामीण नागरिकांसाठी आवश्यक सर्व माहिती एकाच छताखाली.',
    hi: 'किसानों के लिए सरकारी योजनाएं, मंडी भाव, प्रमाण पत्र और ग्रामीण नागरिकों के लिए उपयोगी जानकारी।',
    en: 'Comprehensive public advisory, farmer welfare schemes, mandi rates, and essential citizen documentation guides.',
  },
  infoCard1Title: {
    mr: 'कृषी योजना व थेट अनुदान',
    hi: 'कृषि योजनाएं एवं अनुदान',
    en: 'Farmer Welfare & Subsidies',
  },
  infoCard1Desc: {
    mr: 'पीएम किसान सन्मान निधी, नमो शेतकरी महासन्मान निधी, महाडीबीटी सौर कृषी पंप योजना व पीक विमा अर्ज पद्धती.',
    hi: 'पीएम किसान सम्मान निधि, नमो शेतकारी योजना, महाडीबीटी सौर पंप योजना और फसल बीमा।',
    en: 'PM Kisan Samman Nidhi, Namo Shetkari Yojana, MahaDBT Solar Pumps, and crop insurance guidance.',
  },
  infoCard2Title: {
    mr: 'डिजिटल ७/१२ व दाखले प्रक्रिया',
    hi: 'डिजिटल 7/12 एवं प्रमाण पत्र',
    en: 'Land Records & Certificates',
  },
  infoCard2Desc: {
    mr: 'डिजिटल स्वाक्षरीत ७/१२ व ८अ उतारा कसा काढावा, फेरफार नोंद, जातीचा दाखला आणि उत्पन्न दाखल्याची अधिकृत सरकारी प्रक्रिया.',
    hi: 'डिजिटल 7/12 और 8A नकल, फेरफार, जाति और आय प्रमाण पत्र की सरकारी प्रक्रिया।',
    en: 'Official process for digitally signed 7/12 and 8A extracts, mutation records, caste, and income certificates.',
  },
  infoCard3Title: {
    mr: 'थेट बाजारभाव व हवामान अंदाज',
    hi: 'लाइव मंडी भाव एवं मौसम',
    en: 'APMC Mandi Rates & Weather',
  },
  infoCard3Desc: {
    mr: 'महाराष्ट्र कृषी पणन मंडळ अधिकृत कांदा, सोयाबीन, कापूस, डाळींचे थेट बाजारभाव आणि हवामान खात्याचा अचूक स्थानिक अंदाज.',
    hi: 'महाराष्ट्र कृषि विपणन बोर्ड के ताजा मंडी भाव और सटीक स्थानीय मौसम पूर्वानुमान।',
    en: 'Daily live APMC market rates for onion, soybean, cotton, and precise regional weather alerts.',
  },
  infoCard4Title: {
    mr: 'जनता तक्रार व मोबाईल ॲप सेवा',
    hi: 'जनता शिकायत एवं मोबाइल ऐप',
    en: 'Grievance & Mobile App',
  },
  infoCard4Desc: {
    mr: 'पाणी, रस्ते, वीज यांसारख्या स्थानिक समस्यांची थेट तक्रार नोंदवा आणि ग्रामीण भारत टीव्ही ॲपवरून सर्व माहिती मिळवा.',
    hi: 'सड़क, पानी, बिजली की समस्याएं दर्ज करें और ग्रामीण भारत टीवी ऐप से ताजा जानकारी पाएं।',
    en: 'File grassroots civic issues directly to reporters and access 24x7 broadcast news via mobile app.',
  },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to 'mr' (Marathi) when no preference is saved
  const [lang, setLangState] = useState<Language>('mr');

  useEffect(() => {
    try {
      const stored = (localStorage.getItem('language') || localStorage.getItem('ott_selected_language')) as Language;
      if (stored && (stored === 'mr' || stored === 'hi' || stored === 'en')) {
        setLangState(stored);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = stored;
        }
      } else {
        setLangState('mr');
        if (typeof document !== 'undefined') {
          document.documentElement.lang = 'mr';
        }
      }
    } catch {}

    const handleLanguageSync = () => {
      try {
        const current = (localStorage.getItem('language') || localStorage.getItem('ott_selected_language')) as Language;
        if (current && (current === 'mr' || current === 'hi' || current === 'en')) {
          setLangState(current);
          if (typeof document !== 'undefined') {
            document.documentElement.lang = current;
          }
        }
      } catch {}
    };

    window.addEventListener('storage', handleLanguageSync);
    window.addEventListener('languagechange_custom', handleLanguageSync);
    return () => {
      window.removeEventListener('storage', handleLanguageSync);
      window.removeEventListener('languagechange_custom', handleLanguageSync);
    };
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('language', newLang);
      localStorage.setItem('ott_selected_language', newLang);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLang;
      }
      window.dispatchEvent(new Event('languagechange_custom'));
    } catch {}
  };

  const t = (key: keyof typeof translations): string => {
    const item = translations[key];
    if (!item) return key;
    return item[lang] || item['en'] || item['mr'] || '';
  };

  return React.createElement(
    LanguageContext.Provider,
    { value: { lang, setLang, t } },
    children
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      lang: 'mr' as Language,
      setLang: () => {},
      t: (key: keyof typeof translations) => {
        const item = translations[key];
        return item ? (item['mr'] || item['en'] || '') : key;
      },
    };
  }
  return context;
}

