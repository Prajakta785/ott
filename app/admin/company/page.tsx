'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  BookOpen, 
  Phone, 
  Newspaper, 
  ShieldCheck, 
  Sparkles, 
  Save, 
  CheckCircle2, 
  RotateCcw,
  ExternalLink,
  MapPin,
  Mail,
  Smartphone,
  Tv,
  Globe,
  Clock,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { firestoreService } from '@/lib/firestore-service';
import { CompanyInfo } from '@/lib/types';
import { initialCompanyInfo } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type TabKey = 'company' | 'about' | 'contact' | 'news' | 'information' | 'promotion';

const getCompanyTranslations = (lang: string) => {
  const isMr = lang === 'mr';
  const isHi = lang === 'hi';
  return {
    pageTitle: isMr ? 'कंपनी व पोर्टल माहिती व्यवस्थापन' : isHi ? 'कंपनी और पोर्टल जानकारी प्रबंधन' : 'Company & Portal Information CMS',
    pageDesc: isMr 
      ? 'कंपनी माहिती, आमच्याबद्दल, संपर्क, बातम्या, कायदेशीर माहिती व ओटीटी प्रमोशन व्यवस्थापित करा' 
      : isHi 
      ? 'कंपनी जानकारी, हमारे बारे में, संपर्क, समाचार, नीतियां और ओटीटी प्रमोशन का प्रबंधन करें' 
      : 'Manage Company Info, About Us, Contact, News Portal, Legal Notices and OTT Promotion',
    resetDefaults: isMr ? 'डीफॉल्ट पुनर्प्राप्त करा' : isHi ? 'डिफ़ॉल्ट रीसेट करें' : 'Reset Defaults',
    saveChanges: isMr ? 'बदल जतन करा' : isHi ? 'बदलाव सहेजें' : 'Save Changes',
    saving: isMr ? 'जतन करत आहे...' : isHi ? 'सहेजा जा रहा है...' : 'Saving...',
    saveSuccess: isMr 
      ? '✅ माहिती यशस्वीरीत्या जतन झाली! बदल पोर्टलवर लगेच लागू झाले आहेत.' 
      : isHi 
      ? '✅ जानकारी सफलतापूर्वक सहेजी गई! परिवर्तन पोर्टल पर तुरंत प्रभावी हैं।' 
      : '✅ Company & portal information successfully saved and updated across the platform!',
    liveUpdated: isMr ? 'थेट अद्ययावत' : isHi ? 'लाइव अपडेटेड' : 'Live Updated',
    resetConfirm: isMr 
      ? 'तुम्हाला सर्व माहिती मूळ डीफॉल्ट मूल्यांवर परत करायची आहे का?' 
      : isHi 
      ? 'क्या आप सभी जानकारी को डिफ़ॉल्ट मानों पर रीसेट करना चाहते हैं?' 
      : 'Reset all company information to standard default template?',
    realtimeSync: isMr ? '* सर्व बदल रिअल-टाइम जतन केले जातात' : isHi ? '* सभी परिवर्तन रीयल-टाइम में सिंक होते हैं' : '* All updates sync in real-time',

    // Tab 1: Company Info
    tab1Title: isMr ? '१. कंपनी माहिती' : isHi ? '१. कंपनी जानकारी' : '1. Company Information',
    tab1Desc: isMr 
      ? 'संस्थेचे अधिकृत कायदेशीर नाव, नोंदणी क्रमांक, CIN, संचालक व GSTIN तपशील प्रविष्ट करा.' 
      : isHi 
      ? 'संस्था का आधिकारिक कानूनी नाम, पंजीकरण संख्या, CIN, निदेशक और GSTIN विवरण दर्ज करें।' 
      : 'Enter official entity name, CIN number, registration number, Managing Director and GSTIN details.',
    companyBrandName: isMr ? 'कंपनीचे नाव *' : isHi ? 'कंपनी का नाम *' : 'Company Brand Name *',
    companyBrandNamePh: isMr ? 'उदा. ग्रामीण भारत ओटीटी मीडिया प्रा. लि.' : isHi ? 'उदा. ग्रामीण भारत ओटीटी मीडिया प्रा. लि.' : 'e.g. Gramin Bharat OTT Media Private Limited',
    legalEntityName: isMr ? 'कायदेशीर नोंदणीकृत नाव *' : isHi ? 'कानूनी पंजीकृत नाम *' : 'Legal Entity Name *',
    legalEntityNamePh: isMr ? 'उदा. ग्रामीण भारत ओटीटी मीडिया प्रायव्हेट लिमिटेड' : isHi ? 'उदा. ग्रामीण भारत ओटीटी मीडिया प्राइवेट लिमिटेड' : 'e.g. Gramin Bharat OTT Media Private Limited',
    cinNumber: isMr ? 'कॉर्पोरेट ओळख क्रमांक (CIN) *' : isHi ? 'कॉर्पोरेट पहचान संख्या (CIN) *' : 'Corporate Identification Number (CIN) *',
    cinNumberPh: isMr ? 'उदा. U92100MH2024PTC412345' : isHi ? 'उदा. U92100MH2024PTC412345' : 'e.g. U92100MH2024PTC412345',
    foundedYear: isMr ? 'स्थापना वर्ष' : isHi ? 'स्थापना वर्ष' : 'Founded Year',
    foundedYearPh: isMr ? 'उदा. २०२४' : isHi ? 'उदा. २०२४' : 'e.g. 2024',
    managingDirector: isMr ? 'व्यवस्थापकीय संचालक (MD) *' : isHi ? 'प्रबंध निदेशक (MD) *' : 'Managing Director (MD) *',
    managingDirectorPh: isMr ? 'उदा. श्री. अमोल पवार' : isHi ? 'उदा. श्री अमोल पवार' : 'e.g. Mr. Amol Pawar',
    gstNumber: isMr ? 'जीएसटी क्रमांक (GSTIN) *' : isHi ? 'जीएसटी संख्या (GSTIN) *' : 'GST Identification Number (GSTIN) *',
    gstNumberPh: isMr ? 'उदा. 27AABCG1234F1Z8' : isHi ? 'उदा. 27AABCG1234F1Z8' : 'e.g. 27AABCG1234F1Z8',
    tagline: isMr ? 'कंपनीचे ब्रीदवाक्य / घोषणा' : isHi ? 'कंपनी का स्लोगन / ध्येयवाक्य' : 'Company Tagline / Slogan',
    taglinePh: isMr ? 'उदा. मातीची नाळ, महाराष्ट्राचा आवाज - ग्रामीण भारताचे डिजिटल व्यासपीठ' : isHi ? 'उदा. माटी की पहचान, महाराष्ट्र की आवाज - ग्रामीण भारत का डिजिटल मंच' : 'e.g. The Voice of Maharashtra - Digital Platform',
    registrationNumber: isMr ? 'नोंदणी व प्राधिकरण संदर्भ' : isHi ? 'पंजीकरण एवं प्राधिकरण संदर्भ' : 'Registration & Authority Reference',
    registrationNumberPh: isMr ? 'उदा. ROC/PUN/2024/987654' : isHi ? 'उदा. ROC/PUN/2024/987654' : 'e.g. ROC/PUN/2024/987654',

    // Tab 2: About Us
    tab2Title: isMr ? '२. आमच्याबद्दल' : isHi ? '२. हमारे बारे में' : '2. About Us',
    tab2Desc: isMr 
      ? 'प्लॅटफॉर्मचा इतिहास, ध्येय, दूरदृष्टी आणि मुख्य मूल्ये व्यवस्थापित करा.' 
      : isHi 
      ? 'प्लेटफ़ॉर्म का इतिहास, मिशन, विज़न और मूल मूल्यों को प्रबंधित करें।' 
      : 'Configure company story, mission statement, vision and core values.',
    aboutTitle: isMr ? 'शीर्षक *' : isHi ? 'शीर्षक *' : 'About Section Headline *',
    aboutTitlePh: isMr ? 'उदा. ग्रामीण भारत ओटीटी बद्दल' : isHi ? 'उदा. ग्रामीण भारत ओटीटी के बारे में' : 'e.g. About Gramin Bharat OTT',
    aboutStory: isMr ? 'संस्थेची पार्श्वभूमी व इतिहास *' : isHi ? 'संस्था की पृष्ठभूमि और इतिहास *' : 'Company Story & Background *',
    aboutStoryPh: isMr ? 'उदा. ग्रामीण भारत हे महाराष्ट्रातील प्रत्येक गाव, तालुका आणि जिल्ह्याशी जोडलेले अग्रगण्य डिजिटल ओटीटी व्यासपीठ आहे...' : isHi ? 'उदा. ग्रामीण भारत महाराष्ट्र के प्रत्येक गांव, तहसील और जिले से जुड़ा प्रमुख डिजिटल ओटीटी मंच है...' : 'e.g. Gramin Bharat is Maharashtra\'s premier digital OTT platform...',
    mission: isMr ? 'ध्येय (मिशन) *' : isHi ? 'मिशन वक्तव्य *' : 'Mission Statement *',
    missionPh: isMr ? 'उदा. समृद्ध लोककला व स्थानिक बातम्या घराघरापर्यंत पोहोचवणे.' : isHi ? 'उदा. समृद्ध लोककला और स्थानीय समाचार घर-घर तक पहुंचाना।' : 'e.g. Bringing rich rural art and news to every home.',
    vision: isMr ? 'दूरदृष्टी (व्हिजन) *' : isHi ? 'विज़न वक्तव्य *' : 'Vision Statement *',
    visionPh: isMr ? 'उदा. महाराष्ट्रातील सर्वात विश्वासार्ह प्रादेशिक डिजिटल मीडिया प्लॅटफॉर्म बनणे.' : isHi ? 'उदा. महाराष्ट्र का सबसे विश्वसनीय क्षेत्रीय डिजिटल मीडिया मंच बनना।' : 'e.g. To become Maharashtra\'s most trusted digital media platform.',
    coreValues: isMr ? 'मूल्ये व तत्त्वे' : isHi ? 'मूल्य और सिद्धांत' : 'Core Values',
    coreValuesPh: isMr ? 'उदा. पारदर्शकता, निष्पक्ष पत्रकारिता, स्थानिक संस्कृतीचा सन्मान' : isHi ? 'उदा. पारदर्शिता, निष्पक्ष पत्रकारिता, स्थानीय संस्कृति का सम्मान' : 'e.g. Transparency, unbiased journalism, respect for culture',
    regionalPresence: isMr ? 'भौगोलिक विस्तार व पोहोच' : isHi ? 'भौगोलिक विस्तार और पहुंच' : 'Regional Presence & Reach',
    regionalPresencePh: isMr ? 'उदा. महाराष्ट्र राज्यभरातील सर्व ३६ जिल्हे आणि ३५०+ तालुके' : isHi ? 'उदा. महाराष्ट्र के सभी ३६ जिले और ३५०+ तहसीलें' : 'e.g. All 36 districts and 350+ talukas across Maharashtra',

    // Tab 3: Contact Us
    tab3Title: isMr ? '३. संपर्क व सहाय्यता माहिती' : isHi ? '३. संपर्क और सहायता जानकारी' : '3. Contact Information',
    tab3Desc: isMr 
      ? 'मुख्यालय पत्ता, संपर्क क्रमांक, ग्राहक सहाय्यता ईमेल आणि कामकाजाच्या वेळा व्यवस्थापित करा.' 
      : isHi 
      ? 'मुख्यालय का पता, संपर्क नंबर, ग्राहक सहायता ईमेल और कार्य समय प्रबंधित करें।' 
      : 'Configure head office address, support helpline numbers, email addresses and working hours.',
    headOfficeAddress: isMr ? 'मुख्य कार्यालय पत्ता *' : isHi ? 'मुख्य कार्यालय का पता *' : 'Head Office Address *',
    headOfficeAddressPh: isMr ? 'उदा. प्लॉट क्र. ४२, मीडिया हब, बाणेर-म्हाळुंगे रोड, पुणे, महाराष्ट्र - ४११ ०४५' : isHi ? 'उदा. प्लॉट नं. ४२, मीडिया हब, बाणेर-म्हाळुंगे रोड, पुणे, महाराष्ट्र - ४११ ०४५' : 'e.g. Plot No. 42, Media Hub, Baner Road, Pune, Maharashtra - 411045',
    branchOfficeAddress: isMr ? 'शाखा / विभागीय कार्यालय पत्ता' : isHi ? 'शाखा / क्षेत्रीय कार्यालय का पता' : 'Branch / Regional Office Address',
    branchOfficeAddressPh: isMr ? 'उदा. ऑफिस क्र. १२, सह्याद्री कॉम्प्लेक्स, छत्रपती संभाजीनगर, महाराष्ट्र - ४३१ ००१' : isHi ? 'उदा. ऑफिस नं. १२, सह्याद्री कॉम्प्लेक्स, छत्रपति संभाजीनगर, महाराष्ट्र - ४३१ ००१' : 'e.g. Office No. 12, Sahyadri Complex, Chhatrapati Sambhajinagar - 431001',
    contactEmail: isMr ? 'अधिकृत संपर्क ईमेल *' : isHi ? 'सामान्य संपर्क ईमेल *' : 'General Contact Email *',
    supportEmail: isMr ? 'ग्राहक सपोर्ट ईमेल *' : isHi ? 'ग्राहक सहायता ईमेल *' : 'Customer Support Email *',
    phone1: isMr ? 'मुख्य फोन नंबर *' : isHi ? 'प्राथमिक फ़ोन नंबर *' : 'Primary Phone *',
    phone2: isMr ? 'पर्यायी फोन नंबर' : isHi ? 'द्वितीयक फ़ोन नंबर' : 'Secondary Phone',
    whatsappHelpline: isMr ? 'व्हॉट्सॲप हेल्पलाईन *' : isHi ? 'व्हाट्सएप हेल्पलाइन *' : 'WhatsApp Helpline *',
    workingHours: isMr ? 'कार्यालयीन वेळ' : isHi ? 'कार्य समय' : 'Working Hours',
    workingHoursPh: isMr ? 'सोमवार ते शनिवार: सकाळी ९:०० ते संध्याकाळी ७:००' : isHi ? 'सोमवार से शनिवार: सुबह ९:०० से शाम ७:००' : 'Monday to Saturday: 9:00 AM to 7:00 PM',

    // Tab 4: News Portal Information
    tab4Title: isMr ? '४. बातम्या पोर्टल माहिती' : isHi ? '४. समाचार पोर्टल जानकारी' : '4. News Portal Information',
    tab4Desc: isMr 
      ? 'संपादकीय कक्ष, मुख्य संपादक, प्रेस नोट ईमेल व प्रसारण वेळेचे तपशील व्यवस्थापित करा.' 
      : isHi 
      ? 'संपादकीय डेस्क, मुख्य संपादक, प्रेस विज्ञप्ति ईमेल और प्रसारण समय प्रबंधित करें।' 
      : 'Configure news desk contacts, chief editor, press release submissions and live bulletin schedules.',
    newsPortalName: isMr ? 'न्यूज पोर्टलचे नाव *' : isHi ? 'समाचार पोर्टल का नाम *' : 'News Portal Name *',
    newsPortalNamePh: isMr ? 'उदा. ग्रामीण भारत न्यूज पोर्टल व डिजिटल चॅनल' : isHi ? 'उदा. ग्रामीण भारत समाचार पोर्टल एवं डिजिटल चैनल' : 'e.g. Gramin Bharat News Portal & Digital Channel',
    editorialDeskEmail: isMr ? 'संपादकीय डेस्क ईमेल *' : isHi ? 'संपादकीय डेस्क ईमेल *' : 'Editorial Desk Email *',
    chiefEditor: isMr ? 'मुख्य संपादक / संपादकीय मंडळ *' : isHi ? 'मुख्य संपादक / संपादकीय मंडल *' : 'Chief Editor / Board *',
    chiefEditorPh: isMr ? 'उदा. संपादकीय मंडळ, ग्रामीण भारत वृत्तसेवा' : isHi ? 'उदा. संपादकीय मंडल, ग्रामीण भारत समाचार सेवा' : 'e.g. Editorial Board, Gramin Bharat News Service',
    pressReleaseEmail: isMr ? 'प्रेस रिलीज ईमेल' : isHi ? 'प्रेस विज्ञप्ति ईमेल' : 'Press Release Email',
    broadcastSchedule: isMr ? 'दैनिक बातमी प्रसारण वेळ' : isHi ? 'दैनिक प्रसारण कार्यक्रम' : 'Broadcast Schedule',
    broadcastSchedulePh: isMr ? 'उदा. २४x७ डिजिटल लाईव्ह बुलेटिन व दर तासाला ताज्या घडामोडी' : isHi ? 'उदा. २४x७ डिजिटल लाइव बुलेटिन और हर घंटे ताज़ा समाचार' : 'e.g. 24x7 Digital Live Bulletin and hourly updates',
    newsCategoriesSummary: isMr ? 'बातम्या श्रेणी सारांश' : isHi ? 'समाचार श्रेणियां सारांश' : 'News Categories Summary',
    newsCategoriesSummaryPh: isMr ? 'उदा. महाराष्ट्र, शेती, ग्रामीण विकास, स्थानिक प्रशासन, शिक्षण, क्रीडा' : isHi ? 'उदा. महाराष्ट्र, कृषि, ग्रामीण विकास, स्थानीय प्रशासन, शिक्षा, खेल' : 'e.g. Maharashtra, Agriculture, Rural Development, Local Administration, Sports',

    // Tab 5: Information & Legal Policies
    tab5Title: isMr ? '५. माहिती व कायदेशीर धोरणे' : isHi ? '५. सूचना और कानूनी नीतियां' : '5. Information & Legal Policies',
    tab5Desc: isMr 
      ? 'तक्रार निवारण अधिकारी, गोपनीयता धोरण, सेवा अटी व संपादकीय डिस्क्लेमर व्यवस्थापित करा.' 
      : isHi 
      ? 'शिकायत निवारण अधिकारी, गोपनीयता नीति, सेवा शर्तें और संपादकीय अस्वीकरण प्रबंधित करें।' 
      : 'Configure Grievance Officer details, Privacy Policy, Terms of Service, and Editorial Disclaimers.',
    informationNotice: isMr ? 'वैधानिक माहिती सूचना *' : isHi ? 'वैधानिक सूचना *' : 'Statutory Information Notice *',
    informationNoticePh: isMr ? 'उदा. हे पोर्टल आणि ओटीटी ॲप माहिती तंत्रज्ञान (मध्यस्थ मार्गदर्शक तत्त्वे व डिजिटल मीडिया आचारसंहिता) नियम २०२१ अंतर्गत नोंदणीकृत आहे.' : isHi ? 'उदा. यह पोर्टल और ओटीटी ऐप सूचना प्रौद्योगिकी (मध्यवर्ती दिशानिर्देश और डिजिटल मीडिया आचार संहिता) नियम २०२१ के अंतर्गत पंजीकृत है।' : 'e.g. Compliant with Information Technology Rules 2021.',
    grievanceOfficerName: isMr ? 'तक्रार निवारण अधिकारी नाव *' : isHi ? 'शिकायत निवारण अधिकारी नाम *' : 'Grievance Officer Name *',
    grievanceOfficerNamePh: isMr ? 'उदा. अधिवक्ता राहुल देशपांडे (तक्रार निवारण अधिकारी)' : isHi ? 'उदा. अधिवक्ता राहुल देशपांडे (शिकायत निवारण अधिकारी)' : 'e.g. Adv. Rahul Deshpande (Grievance Officer)',
    grievanceOfficerEmail: isMr ? 'तक्रार निवारण ईमेल *' : isHi ? 'शिकायत निवारण ईमेल *' : 'Grievance Officer Email *',
    privacyPolicySummary: isMr ? 'गोपनीयता धोरण सारांश' : isHi ? 'गोपनीयता नीति सारांश' : 'Privacy Policy Summary',
    privacyPolicySummaryPh: isMr ? 'उदा. आम्ही युझर्सच्या गोपनीयतेचा आदर करतो. कोणत्याही तृतीय पक्षाला डेटा विकला जात नाही...' : isHi ? 'उदा. हम उपयोगकर्ताओं की गोपनीयता का सम्मान करते हैं। किसी भी तीसरे पक्ष को डेटा नहीं बेचा जाता...' : 'e.g. We respect user privacy. User data is encrypted and never sold...',
    termsOfServiceSummary: isMr ? 'सेवा अटी व शर्ती सारांश' : isHi ? 'सेवा की शर्तें सारांश' : 'Terms of Service Summary',
    termsOfServiceSummaryPh: isMr ? 'उदा. सर्व व्हिडिओ, बातम्या आणि ऑडिओ-व्हिज्युअल साहित्य कॉपीराइट संरक्षित असून अनधिकृत वापरास मनाई आहे...' : isHi ? 'उदा. सभी वीडियो, समाचार और ऑडियो-विजुअल सामग्री कॉपीराइट संरक्षित है...' : 'e.g. All videos, news and media content are copyright protected...',
    disclaimerText: isMr ? 'संपादकीय व मजकूर डिस्क्लेमर' : isHi ? 'संपादकीय अस्वीकरण' : 'Content & Editorial Disclaimer',
    disclaimerTextPh: isMr ? 'उदा. पोर्टलवरील बातम्या व लेखांमधील मते संबंधित बातमीदारांची वैयक्तिक असू शकतात...' : isHi ? 'उदा. पोर्टल पर समाचार और लेखों में व्यक्त विचार संबंधित संवाददाताओं के व्यक्तिगत हो सकते हैं...' : 'e.g. Views expressed in news items are those of respective journalists...',

    // Tab 6: OTT Promotion Management
    tab6Title: isMr ? '६. ओटीटी प्रमोशन व्यवस्थापन' : isHi ? '६. ओटीटी प्रमोशन प्रबंधन' : '6. OTT Promotion Management',
    tab6Desc: isMr 
      ? 'मोबाईल ॲप स्टोअर लिंक्स, स्मार्ट टीव्ही लिंक्स, प्रोमो बॅनर व ठळक वैशिष्ट्ये व्यवस्थापित करा.' 
      : isHi 
      ? 'मोबाइल ऐप स्टोर लिंक, स्मार्ट टीवी ऐप लिंक, प्रोमो बैनर और मुख्य विशेषताएं प्रबंधित करें।' 
      : 'Configure mobile app store URLs, Smart TV links, promo banners, highlights and special offer badges.',
    ottPromotionTitle: isMr ? 'प्रमोशन मुख्य शीर्षक *' : isHi ? 'प्रमोशन मुख्य शीर्षक *' : 'Promotion Headline *',
    ottPromotionTitlePh: isMr ? 'उदा. ग्रामीण भारत मोबाईल ॲप व स्मार्ट टीव्ही ॲप' : isHi ? 'उदा. ग्रामीण भारत मोबाइल ऐप और स्मार्ट टीवी ऐप' : 'e.g. Gramin Bharat Mobile App & Smart TV App',
    promoBadgeText: isMr ? 'प्रमोशन बॅज मजकूर' : isHi ? 'प्रमोशन बैज टेक्स्ट' : 'Promo Badge Text',
    promoBadgeTextPh: isMr ? 'उदा. नवीन ॲप अपडेट उपलब्ध • HD व 4K स्ट्रीमिंग' : isHi ? 'उदा. नया ऐप अपडेट उपलब्ध • HD और 4K स्ट्रीमिंग' : 'e.g. New App Update Available • HD & 4K Streaming',
    ottPromotionTagline: isMr ? 'प्रमोशन उपशीर्षक' : isHi ? 'प्रमोशन टैगलाइन' : 'Promotion Tagline',
    ottPromotionTaglinePh: isMr ? 'उदा. आता डाउनलोड करा आणि अनुभवा दर्जेदार ग्रामीण मनोरंजन व जलद बातम्या!' : isHi ? 'उदा. अभी डाउनलोड करें और अनुभव करें बेहतरीन ग्रामीण मनोरंजन और तेज़ समाचार!' : 'e.g. Download now to experience regional entertainment and news!',
    playStoreUrl: isMr ? 'गुगल प्ले स्टोअर लिंक' : isHi ? 'गूगल प्ले स्टोर लिंक' : 'Google Play Store Link',
    androidTvAppUrl: isMr ? 'अँड्रॉइड स्मार्ट टीव्ही ॲप लिंक' : isHi ? 'एंड्रॉइड स्मार्ट टीवी ऐप लिंक' : 'Android Smart TV App Link',
    iosAppUrl: isMr ? 'ॲपल ॲप स्टोअर लिंक' : isHi ? 'एप्पल ऐप स्टोर लिंक' : 'Apple App Store Link',
    featuredPromoBanner: isMr ? 'प्रमोशन बॅनर इमेज URL' : isHi ? 'प्रमोशन बैनर इमेज URL' : 'Featured Promo Banner Image URL',
    promoHighlights: isMr ? 'ठळक वैशिष्ट्ये व ऑफर हायलाइट्स' : isHi ? 'मुख्य विशेषताएं और ऑफर हाइलाइट्स' : 'Promotional Highlights',
    promoHighlightsPh: isMr ? 'उदा. १००+ मराठी चित्रपट | लाईव्ह न्यूज बुलेटिन | ऑफलाईन डाऊनलोड | ॲड-फ्री सबस्क्रिप्शन' : isHi ? 'उदा. १००+ फिल्में | लाइव समाचार बुलेटिन | ऑफ़लाइन डाउनलोड | विज्ञापन-मुक्त' : 'e.g. 100+ Movies | Live News Bulletins | Offline Download | Ad-free VIP',

    // Live Preview Card (Right)
    previewTitle: isMr ? 'थेट पोर्टल पूर्वावलोकन' : isHi ? 'लाइव पोर्टल पूर्वावलोकन' : 'Live Portal Preview',
    liveReady: isMr ? '● थेट सक्रिय' : isHi ? '● लाइव तैयार' : '● Live Ready',
    promoBannerHeading: isMr ? 'ओटीटी प्रोमो बॅनर' : isHi ? 'ओटीटी प्रोमो बैनर' : 'OTT Promo Banner',
    contactsHeading: isMr ? 'महत्त्वाचे संपर्क सूत्र' : isHi ? 'महत्वपूर्ण संपर्क सूत्र' : 'Quick Key Contacts',
    appStoreHeading: isMr ? 'ॲप स्टोअर उपलब्धता' : isHi ? 'ऐप स्टोर उपलब्धता' : 'App Stores Availability',
    playStoreLabel: isMr ? 'प्ले स्टोअर' : isHi ? 'प्ले स्टोर' : 'Play Store',
    androidTvLabel: isMr ? 'अँड्रॉइड टीव्ही' : isHi ? 'एंड्रॉइड टीवी' : 'Android TV',
  };
};

export default function CompanyPage() {
  const { role, canEdit } = useAuth();
  const { lang } = useLanguage();
  const t = getCompanyTranslations(lang);

  const [activeTab, setActiveTab] = useState<TabKey>('company');
  const [info, setInfo] = useState<CompanyInfo>(initialCompanyInfo);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function fetchInfo() {
      setLoading(true);
      const data = await firestoreService.getCompanyInfo();
      if (data) {
        setInfo(data);
      }
      setLoading(false);
    }
    fetchInfo();
  }, []);

  const handleChange = (field: keyof CompanyInfo, value: string) => {
    setInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await firestoreService.updateCompanyInfo(info);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to save company info:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm(t.resetConfirm)) {
      setInfo(initialCompanyInfo);
    }
  };

  const tabs: Array<{ key: TabKey; label: string; sublabel: string; icon: any }> = [
    { 
      key: 'company', 
      label: lang === 'mr' ? '१. कंपनी माहिती' : lang === 'hi' ? '१. कंपनी जानकारी' : '1. Company Info', 
      sublabel: lang === 'mr' ? 'नाव, CIN, संचालक, नोंदणी' : lang === 'hi' ? 'नाम, CIN, निदेशक, पंजीकरण' : 'Entity, CIN, MD, Reg.',
      icon: Building2 
    },
    { 
      key: 'about', 
      label: lang === 'mr' ? '२. आमच्याबद्दल' : lang === 'hi' ? '२. हमारे बारे में' : '2. About Us', 
      sublabel: lang === 'mr' ? 'ध्येय, व्हिजन, इतिहास' : lang === 'hi' ? 'मिशन, विज़न, इतिहास' : 'Mission, Vision, Story',
      icon: BookOpen 
    },
    { 
      key: 'contact', 
      label: lang === 'mr' ? '३. संपर्क व सहाय्यता' : lang === 'hi' ? '३. संपर्क और सहायता' : '3. Contact Us', 
      sublabel: lang === 'mr' ? 'पत्ता, फोन, ईमेल, व्हॉट्सॲप' : lang === 'hi' ? 'पता, फोन, ईमेल, व्हाट्सएप' : 'Address, Phones, Email',
      icon: Phone 
    },
    { 
      key: 'news', 
      label: lang === 'mr' ? '४. बातम्या पोर्टल' : lang === 'hi' ? '४. समाचार पोर्टल' : '4. News Portal', 
      sublabel: lang === 'mr' ? 'संपादक, डेस्क, बुलेटिन' : lang === 'hi' ? 'संपादक, डेस्क, बुलेटिन' : 'Editor, Desk, Broadcast',
      icon: Newspaper 
    },
    { 
      key: 'information', 
      label: lang === 'mr' ? '५. माहिती व धोरणे' : lang === 'hi' ? '५. सूचना एवं नीतियां' : '5. Information & Policy', 
      sublabel: lang === 'mr' ? 'कायदेशीर सूचना, तक्रार निवारण' : lang === 'hi' ? 'कानूनी नोटिस, शिकायत निवारण' : 'Legal, Privacy, Grievance',
      icon: ShieldCheck 
    },
    { 
      key: 'promotion', 
      label: lang === 'mr' ? '६. ओटीटी प्रमोशन' : lang === 'hi' ? '६. ओटीटी प्रमोशन' : '6. OTT Promotion', 
      sublabel: lang === 'mr' ? 'ॲप लिंक्स, टीव्ही, बॅनर' : lang === 'hi' ? 'ऐप लिंक, टीवी, बैनर' : 'App Links, TV, Banners',
      icon: Sparkles 
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner / Header */}
      <div className="rounded-3xl bg-white border border-[#E5DBCA] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-[#EA580C]/10 text-[#EA580C] border border-[#EA580C]/20">
              <Building2 className="w-6 h-6 text-[#EA580C]" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                {t.pageTitle}
              </h1>
              <p className="text-sm font-semibold text-[#475569] mt-0.5">
                {t.pageDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetDefaults}
            className="border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] font-bold text-xs sm:text-sm rounded-xl h-11 px-4 gap-2 shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-[#64748B]" />
            {t.resetDefaults}
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-xs sm:text-sm rounded-xl h-11 px-6 gap-2 shadow-sm transition-all cursor-pointer"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                {t.saving}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {t.saveChanges}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Success Toast Banner */}
      {saveSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-bold text-emerald-900">
              {t.saveSuccess}
            </p>
          </div>
          <Badge className="bg-emerald-600 text-white border-0 text-xs px-2.5 py-1">
            {t.liveUpdated}
          </Badge>
        </div>
      )}

      {/* 6 Tabs Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex flex-col items-start p-3.5 sm:p-4 rounded-2xl text-left border transition-all duration-200 select-none relative group cursor-pointer",
                isActive 
                  ? "bg-[#EA580C] text-white border-[#EA580C] shadow-md ring-2 ring-[#EA580C]/20" 
                  : "bg-white text-[#1E293B] border-[#E2E8F0] hover:border-[#EA580C]/50 hover:bg-[#FFF7ED] shadow-xs"
              )}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <Icon className={cn(
                  "w-5 h-5 transition-transform group-hover:scale-110",
                  isActive ? "text-orange-100" : "text-[#EA580C]"
                )} />
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-white ring-2 ring-orange-200 animate-pulse" />
                )}
              </div>
              <div className="font-extrabold text-xs sm:text-sm tracking-tight line-clamp-1">
                {tab.label}
              </div>
              <div className={cn(
                "text-[10px] mt-0.5 line-clamp-1",
                isActive ? "text-orange-100" : "text-[#64748B]"
              )}>
                {tab.sublabel}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content & Live Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Editor Card (Left 8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSave} className="rounded-3xl bg-white border border-[#E5DBCA] p-6 sm:p-8 shadow-sm space-y-6">

            {/* TAB 1: COMPANY INFORMATION */}
            {activeTab === 'company' && (
              <div className="space-y-6">
                <div className="border-b border-[#F1F5F9] pb-4">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-5 h-5 text-[#EA580C]" />
                    <h2 className="text-lg font-black text-[#0F172A]">
                      {t.tab1Title}
                    </h2>
                  </div>
                  <p className="text-xs font-semibold text-[#64748B] mt-1">
                    {t.tab1Desc}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.companyBrandName}
                    </label>
                    <input
                      type="text"
                      value={info.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      placeholder={t.companyBrandNamePh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.legalEntityName}
                    </label>
                    <input
                      type="text"
                      value={info.legalEntityName}
                      onChange={(e) => handleChange('legalEntityName', e.target.value)}
                      placeholder={t.legalEntityNamePh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.cinNumber}
                    </label>
                    <input
                      type="text"
                      value={info.cinNumber}
                      onChange={(e) => handleChange('cinNumber', e.target.value)}
                      placeholder={t.cinNumberPh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.foundedYear}
                    </label>
                    <input
                      type="text"
                      value={info.foundedYear}
                      onChange={(e) => handleChange('foundedYear', e.target.value)}
                      placeholder={t.foundedYearPh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.managingDirector}
                    </label>
                    <input
                      type="text"
                      value={info.managingDirector}
                      onChange={(e) => handleChange('managingDirector', e.target.value)}
                      placeholder={t.managingDirectorPh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.gstNumber}
                    </label>
                    <input
                      type="text"
                      value={info.gstNumber}
                      onChange={(e) => handleChange('gstNumber', e.target.value)}
                      placeholder={t.gstNumberPh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition font-mono uppercase"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.tagline}
                    </label>
                    <input
                      type="text"
                      value={info.tagline}
                      onChange={(e) => handleChange('tagline', e.target.value)}
                      placeholder={t.taglinePh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.registrationNumber}
                    </label>
                    <input
                      type="text"
                      value={info.registrationNumber}
                      onChange={(e) => handleChange('registrationNumber', e.target.value)}
                      placeholder={t.registrationNumberPh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ABOUT US */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="border-b border-[#F1F5F9] pb-4">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-5 h-5 text-[#EA580C]" />
                    <h2 className="text-lg font-black text-[#0F172A]">
                      {t.tab2Title}
                    </h2>
                  </div>
                  <p className="text-xs font-semibold text-[#64748B] mt-1">
                    {t.tab2Desc}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.aboutTitle}
                    </label>
                    <input
                      type="text"
                      value={info.aboutTitle}
                      onChange={(e) => handleChange('aboutTitle', e.target.value)}
                      placeholder={t.aboutTitlePh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.aboutStory}
                    </label>
                    <textarea
                      rows={4}
                      value={info.aboutStory}
                      onChange={(e) => handleChange('aboutStory', e.target.value)}
                      placeholder={t.aboutStoryPh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                        {t.mission}
                      </label>
                      <textarea
                        rows={3}
                        value={info.mission}
                        onChange={(e) => handleChange('mission', e.target.value)}
                        placeholder={t.missionPh}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                        {t.vision}
                      </label>
                      <textarea
                        rows={3}
                        value={info.vision}
                        onChange={(e) => handleChange('vision', e.target.value)}
                        placeholder={t.visionPh}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition leading-relaxed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.coreValues}
                    </label>
                    <input
                      type="text"
                      value={info.coreValues}
                      onChange={(e) => handleChange('coreValues', e.target.value)}
                      placeholder={t.coreValuesPh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.regionalPresence}
                    </label>
                    <input
                      type="text"
                      value={info.regionalPresence}
                      onChange={(e) => handleChange('regionalPresence', e.target.value)}
                      placeholder={t.regionalPresencePh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CONTACT */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div className="border-b border-[#F1F5F9] pb-4">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-5 h-5 text-[#EA580C]" />
                    <h2 className="text-lg font-black text-[#0F172A]">
                      {t.tab3Title}
                    </h2>
                  </div>
                  <p className="text-xs font-semibold text-[#64748B] mt-1">
                    {t.tab3Desc}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.headOfficeAddress}
                    </label>
                    <textarea
                      rows={2}
                      value={info.headOfficeAddress}
                      onChange={(e) => handleChange('headOfficeAddress', e.target.value)}
                      placeholder={t.headOfficeAddressPh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.branchOfficeAddress}
                    </label>
                    <textarea
                      rows={2}
                      value={info.branchOfficeAddress}
                      onChange={(e) => handleChange('branchOfficeAddress', e.target.value)}
                      placeholder={t.branchOfficeAddressPh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.contactEmail}
                    </label>
                    <input
                      type="email"
                      value={info.contactEmail}
                      onChange={(e) => handleChange('contactEmail', e.target.value)}
                      placeholder="contact@graminbharat.tv"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.supportEmail}
                    </label>
                    <input
                      type="email"
                      value={info.supportEmail}
                      onChange={(e) => handleChange('supportEmail', e.target.value)}
                      placeholder="support@graminbharat.tv"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.phone1}
                    </label>
                    <input
                      type="text"
                      value={info.phone1}
                      onChange={(e) => handleChange('phone1', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.phone2}
                    </label>
                    <input
                      type="text"
                      value={info.phone2}
                      onChange={(e) => handleChange('phone2', e.target.value)}
                      placeholder="+91 87654 32109"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.whatsappHelpline}
                    </label>
                    <input
                      type="text"
                      value={info.whatsappHelpline}
                      onChange={(e) => handleChange('whatsappHelpline', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.workingHours}
                    </label>
                    <input
                      type="text"
                      value={info.workingHours}
                      onChange={(e) => handleChange('workingHours', e.target.value)}
                      placeholder={t.workingHoursPh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: NEWS PORTAL */}
            {activeTab === 'news' && (
              <div className="space-y-6">
                <div className="border-b border-[#F1F5F9] pb-4">
                  <div className="flex items-center gap-2.5">
                    <Newspaper className="w-5 h-5 text-[#EA580C]" />
                    <h2 className="text-lg font-black text-[#0F172A]">
                      {t.tab4Title}
                    </h2>
                  </div>
                  <p className="text-xs font-semibold text-[#64748B] mt-1">
                    {t.tab4Desc}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.newsPortalName}
                    </label>
                    <input
                      type="text"
                      value={info.newsPortalName}
                      onChange={(e) => handleChange('newsPortalName', e.target.value)}
                      placeholder={t.newsPortalNamePh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.editorialDeskEmail}
                    </label>
                    <input
                      type="email"
                      value={info.editorialDeskEmail}
                      onChange={(e) => handleChange('editorialDeskEmail', e.target.value)}
                      placeholder="editorial@graminbharat.tv"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.chiefEditor}
                    </label>
                    <input
                      type="text"
                      value={info.chiefEditor}
                      onChange={(e) => handleChange('chiefEditor', e.target.value)}
                      placeholder={t.chiefEditorPh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.pressReleaseEmail}
                    </label>
                    <input
                      type="email"
                      value={info.pressReleaseEmail}
                      onChange={(e) => handleChange('pressReleaseEmail', e.target.value)}
                      placeholder="press@graminbharat.tv"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.broadcastSchedule}
                    </label>
                    <input
                      type="text"
                      value={info.broadcastSchedule}
                      onChange={(e) => handleChange('broadcastSchedule', e.target.value)}
                      placeholder={t.broadcastSchedulePh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.newsCategoriesSummary}
                    </label>
                    <input
                      type="text"
                      value={info.newsCategoriesSummary}
                      onChange={(e) => handleChange('newsCategoriesSummary', e.target.value)}
                      placeholder={t.newsCategoriesSummaryPh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: INFORMATION & LEGAL */}
            {activeTab === 'information' && (
              <div className="space-y-6">
                <div className="border-b border-[#F1F5F9] pb-4">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-[#EA580C]" />
                    <h2 className="text-lg font-black text-[#0F172A]">
                      {t.tab5Title}
                    </h2>
                  </div>
                  <p className="text-xs font-semibold text-[#64748B] mt-1">
                    {t.tab5Desc}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.informationNotice}
                    </label>
                    <input
                      type="text"
                      value={info.informationNotice}
                      onChange={(e) => handleChange('informationNotice', e.target.value)}
                      placeholder={t.informationNoticePh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                        {t.grievanceOfficerName}
                      </label>
                      <input
                        type="text"
                        value={info.grievanceOfficerName}
                        onChange={(e) => handleChange('grievanceOfficerName', e.target.value)}
                        placeholder={t.grievanceOfficerNamePh}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                        {t.grievanceOfficerEmail}
                      </label>
                      <input
                        type="email"
                        value={info.grievanceOfficerEmail}
                        onChange={(e) => handleChange('grievanceOfficerEmail', e.target.value)}
                        placeholder="grievance@graminbharat.tv"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.privacyPolicySummary}
                    </label>
                    <textarea
                      rows={3}
                      value={info.privacyPolicySummary}
                      onChange={(e) => handleChange('privacyPolicySummary', e.target.value)}
                      placeholder={t.privacyPolicySummaryPh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.termsOfServiceSummary}
                    </label>
                    <textarea
                      rows={3}
                      value={info.termsOfServiceSummary}
                      onChange={(e) => handleChange('termsOfServiceSummary', e.target.value)}
                      placeholder={t.termsOfServiceSummaryPh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.disclaimerText}
                    </label>
                    <textarea
                      rows={2}
                      value={info.disclaimerText}
                      onChange={(e) => handleChange('disclaimerText', e.target.value)}
                      placeholder={t.disclaimerTextPh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: OTT PROMOTION */}
            {activeTab === 'promotion' && (
              <div className="space-y-6">
                <div className="border-b border-[#F1F5F9] pb-4">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-[#EA580C]" />
                    <h2 className="text-lg font-black text-[#0F172A]">
                      {t.tab6Title}
                    </h2>
                  </div>
                  <p className="text-xs font-semibold text-[#64748B] mt-1">
                    {t.tab6Desc}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                        {t.ottPromotionTitle}
                      </label>
                      <input
                        type="text"
                        value={info.ottPromotionTitle}
                        onChange={(e) => handleChange('ottPromotionTitle', e.target.value)}
                        placeholder={t.ottPromotionTitlePh}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                        {t.promoBadgeText}
                      </label>
                      <input
                        type="text"
                        value={info.promoBadgeText}
                        onChange={(e) => handleChange('promoBadgeText', e.target.value)}
                        placeholder={t.promoBadgeTextPh}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.ottPromotionTagline}
                    </label>
                    <input
                      type="text"
                      value={info.ottPromotionTagline}
                      onChange={(e) => handleChange('ottPromotionTagline', e.target.value)}
                      placeholder={t.ottPromotionTaglinePh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1E293B] mb-1.5 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        {t.playStoreUrl}
                      </label>
                      <input
                        type="url"
                        value={info.playStoreUrl}
                        onChange={(e) => handleChange('playStoreUrl', e.target.value)}
                        placeholder="https://play.google.com/store/apps/..."
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-mono focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1E293B] mb-1.5 flex items-center gap-1.5">
                        <Tv className="w-3.5 h-3.5 text-blue-600" />
                        {t.androidTvAppUrl}
                      </label>
                      <input
                        type="url"
                        value={info.androidTvAppUrl}
                        onChange={(e) => handleChange('androidTvAppUrl', e.target.value)}
                        placeholder="https://play.google.com/store/apps/..."
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-mono focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1E293B] mb-1.5 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-indigo-600" />
                        {t.iosAppUrl}
                      </label>
                      <input
                        type="url"
                        value={info.iosAppUrl}
                        onChange={(e) => handleChange('iosAppUrl', e.target.value)}
                        placeholder="https://apps.apple.com/app/..."
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-mono focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.featuredPromoBanner}
                    </label>
                    <input
                      type="url"
                      value={info.featuredPromoBanner}
                      onChange={(e) => handleChange('featuredPromoBanner', e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-mono focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
                      {t.promoHighlights}
                    </label>
                    <textarea
                      rows={2}
                      value={info.promoHighlights}
                      onChange={(e) => handleChange('promoHighlights', e.target.value)}
                      placeholder={t.promoHighlightsPh}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Form Action Bar */}
            <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">
                {t.realtimeSync}
              </span>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#EA580C] hover:bg-[#C2410C] text-white font-black text-sm rounded-2xl h-11 px-7 gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Save className="w-4 h-4" />
                {isSaving ? t.saving : t.saveChanges}
              </Button>
            </div>
          </form>
        </div>

        {/* Live Preview & Summary Card (Right 4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl bg-white border border-[#E5DBCA] p-6 shadow-sm space-y-5 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#EA580C]" />
                <h3 className="text-sm font-black text-[#0F172A]">
                  {t.previewTitle}
                </h3>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold px-2 py-0.5">
                {t.liveReady}
              </Badge>
            </div>

            {/* Brand Card Preview */}
            <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] space-y-2">
              <div className="text-xs font-extrabold text-[#78350F] uppercase tracking-wider">
                {info.legalEntityName || 'Gramin Bharat OTT Media'}
              </div>
              <div className="text-base font-black text-[#0F172A] leading-tight">
                {info.companyName}
              </div>
              <p className="text-xs font-medium text-[#451A03] italic">
                "{info.tagline}"
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#92400E] flex flex-wrap gap-2">
                <span>CIN: {info.cinNumber}</span>
                <span>•</span>
                <span>GST: {info.gstNumber}</span>
              </div>
            </div>

            {/* Promo Preview Banner */}
            {info.featuredPromoBanner && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#1E293B]">
                  {t.promoBannerHeading}
                </div>
                <div className="rounded-2xl overflow-hidden border border-[#CBD5E1] relative aspect-video bg-slate-900 group">
                  <img 
                    src={info.featuredPromoBanner} 
                    alt="Promo Banner" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end">
                    <Badge className="w-fit mb-1 bg-[#EA580C] text-black font-black text-[9px] px-1.5 py-0.5 border-0">
                      {info.promoBadgeText || 'HD & 4K STREAMING'}
                    </Badge>
                    <div className="text-white font-black text-xs line-clamp-1">
                      {info.ottPromotionTitle}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Contacts List */}
            <div className="space-y-2.5 pt-2 border-t border-[#F1F5F9]">
              <div className="text-xs font-extrabold text-[#0F172A]">
                {t.contactsHeading}
              </div>

              <div className="flex items-center gap-2.5 text-xs text-[#334155] font-semibold">
                <Phone className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                <span>{info.phone1}</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-[#334155] font-semibold">
                <Mail className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                <span className="truncate">{info.contactEmail}</span>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-[#334155] font-semibold">
                <MapPin className="w-3.5 h-3.5 text-[#EA580C] shrink-0 mt-0.5" />
                <span className="line-clamp-2">{info.headOfficeAddress}</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-[#334155] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{info.grievanceOfficerName}</span>
              </div>
            </div>

            {/* App Store Links Status */}
            <div className="pt-2 border-t border-[#F1F5F9] space-y-2">
              <div className="text-xs font-extrabold text-[#0F172A]">
                {t.appStoreHeading}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                <a 
                  href={info.playStoreUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] hover:bg-orange-50 hover:border-[#EA580C]/60 flex items-center justify-between transition"
                >
                  <span>{t.playStoreLabel}</span>
                  <ExternalLink className="w-3 h-3 text-[#64748B]" />
                </a>
                <a 
                  href={info.androidTvAppUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] hover:bg-orange-50 hover:border-[#EA580C]/60 flex items-center justify-between transition"
                >
                  <span>{t.androidTvLabel}</span>
                  <ExternalLink className="w-3 h-3 text-[#64748B]" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
