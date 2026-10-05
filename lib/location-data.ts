export interface TalukaVillages {
  taluka: string;
  villages: string[];
}

export interface DistrictLocations {
  district: string;
  talukas: TalukaVillages[];
}

export const MAHARASHTRA_LOCATIONS: DistrictLocations[] = [
  {
    district: 'Pune (पुणे)',
    talukas: [
      {
        taluka: 'Haveli (हवेली)',
        villages: ['Wagholi (वाघोली)', 'Hadapsar (हडपसर)', 'Khadakwasla (खडकवासला)', 'Khed Shivapur (खेड शिवापूर)', 'Uruli Kanchan (उरुळी कांचन)'],
      },
      {
        taluka: 'Baramati (बारामती)',
        villages: ['Katewadi (काटेवाडी)', 'Malegaon Bk (माळेगाव बु.)', 'Rui (रुई)', 'Dorlewadi (डोर्लेवाडी)', 'Supe (सुपे)'],
      },
      {
        taluka: 'Shirur (शिरूर)',
        villages: ['Sanaswadi (सणसवाडी)', 'Koregaon Bhima (कोरेगाव भीमा)', 'Ranjangaon (रांजणगाव)', 'Nighoj (निघोज)'],
      },
      {
        taluka: 'Junnar (जुन्नर)',
        villages: ['Otur (ओतूर)', 'Narayangaon (नारायणगाव)', 'Alephata (आळेफाटा)', 'Shivneri (शिवनेरी)'],
      },
      {
        taluka: 'Maval (मावळ)',
        villages: ['Talegaon (तळेगाव)', 'Lonavala (लोणावळा)', 'Vadgaon (वडगाव)', 'Kamshet (कामशेत)'],
      },
      {
        taluka: 'Indapur (इंदापूर)',
        villages: ['Bawda (बावडा)', 'Nimgaon Ketki (निमगाव केतकी)', 'Anthurne (अंथुर्णे)'],
      },
      {
        taluka: 'Khed (खेड)',
        villages: ['Chakan (चाकण)', 'Alandi (आळंदी)', 'Rajgurunagar (राजगुरुनगर)'],
      }
    ],
  },
  {
    district: 'Nashik (नाशिक)',
    talukas: [
      {
        taluka: 'Nashik (नाशिक)',
        villages: ['Deolali (देवळाली)', 'Makhmalabad (मखमलाबाद)', 'Gangapur (गंगापूर)', 'Pathardi (पाथर्डी)'],
      },
      {
        taluka: 'Niphad (निफाड)',
        villages: ['Pimpalgaon Baswant (पिंपळगाव बसवंत)', 'Ozar (ओझर)', 'Lasalgaon (लासलगाव)', 'Kundewadi (कुंदेवाडी)'],
      },
      {
        taluka: 'Dindori (दिंडोरी)',
        villages: ['Vani (वणी)', 'Janori (जानोरी)', 'Mhasrul (म्हसरूळ)'],
      },
      {
        taluka: 'Malegaon (मालेगाव)',
        villages: ['Camp (कॅम्प)', 'Dabhadi (दाभाडी)', 'Saundane (सौंदाणे)'],
      },
      {
        taluka: 'Sinnar (सिन्नर)',
        villages: ['Musalgaon (मुसळगाव)', 'Ghoti (घोटील)', 'Pangri (पांगरी)'],
      },
      {
        taluka: 'Yeola (येवला)',
        villages: ['Andarsul (अंदरसुल)', 'Mukhed (मुखेड)', 'Nagarsul (नगरसुल)'],
      }
    ],
  },
  {
    district: 'Chhatrapati Sambhajinagar (छत्रपती संभाजीनगर)',
    talukas: [
      {
        taluka: 'Aurangabad (संभाजीनगर शहर)',
        villages: ['Waluj (वाळूज)', 'Chikalthana (चिकलठाणा)', 'Harsul (हर्सूल)', 'Shendra (शेंद्रा)'],
      },
      {
        taluka: 'Paithan (पैठण)',
        villages: ['Bidkin (बिडकीन)', 'Shevgaon Road (शेवगाव)', 'Pimpalwadi (पिंपळवाडी)'],
      },
      {
        taluka: 'Gangapur (गंगापूर)',
        villages: ['Lasur (लासूर स्टेशन)', 'Shivoor (शिवूर)', 'Dongaon (डोंगाव)'],
      },
      {
        taluka: 'Vaijapur (वैजापूर)',
        villages: ['Rotegaon (रोटेगाव)', 'Khandala (खंडाळा)', 'Borsar (बोरसर)'],
      },
      {
        taluka: 'Kannad (कन्नड)',
        villages: ['Pishor (पिशोर)', 'Chapaner (चापानेर)']
      },
      {
        taluka: 'Sillod (सिल्लोड)',
        villages: ['Ajantha (अजिंठा)', 'Golegaon (गोळेगाव)']
      }
    ],
  },
  {
    district: 'Kolhapur (कोल्हापूर)',
    talukas: [
      {
        taluka: 'Karvir (करवीर)',
        villages: ['Uchgaon (उचगाव)', 'Gandhinagar (गांधीनगर)', 'Shiroli (शिरोली)', 'Kagal Border (कागल सीमा)'],
      },
      {
        taluka: 'Hatkanangale (हातकणंगले)',
        villages: ['Ichalkaranji (इचलकरंजी)', 'Hupari (हुपरी)', 'Rukadi (रुकडी)', 'Peth Vadgaon (पेठ वडगाव)'],
      },
      {
        taluka: 'Shirol (शिरोळ)',
        villages: ['Jaysingpur (जयसिंगपूर)', 'Kurundwad (कुरुंदवाड)', 'Dharangutti (धरणगुत्ती)'],
      },
      {
        taluka: 'Panhala (पन्हाळा)',
        villages: ['Kodoli (कोडोली)', 'Warananagar (वारणानगर)', 'Ghotawade (घोटावडे)'],
      },
      {
        taluka: 'Kagal (कागल)',
        villages: ['Murgud (मुरगूड)', 'Sangaon (सांगाव)', 'Bhadgaon (भाडगाव)'],
      }
    ],
  },
  {
    district: 'Solapur (सोलापूर)',
    talukas: [
      {
        taluka: 'Solapur North (सोलापूर उत्तर)',
        villages: ['Degaon (डेगाव)', 'Kavathe (कवठे)', 'Shelgi (शेलगी)'],
      },
      {
        taluka: 'Barshi (बार्शी)',
        villages: ['Vairag (वैराग)', 'Pangri (पांगरी)', 'Upalai (उपळे)'],
      },
      {
        taluka: 'Pandharpur (पंढरपूर)',
        villages: ['Wakhari (वाखरी)', 'Karkamb (करकंब)', 'Tungat (तुंगत)', 'Bhatumbare (भातुंबरे)'],
      },
      {
        taluka: 'Madha (माढा)',
        villages: ['Kurduwadi (कुर्डूवाडी)', 'Modnimb (मोडनिंब)', 'Tembhurni (टेंभुर्णी)'],
      },
      {
        taluka: 'Akkalkot (अक्कलकोट)',
        villages: ['Maindargi (मैंदर्गी)', 'Chapalgaon (चपळगाव)', 'Waghdari (वाघदरी)'],
      },
      {
        taluka: 'Sangola (सांगोला)',
        villages: ['Mahud (महुद)', 'Nazare (नझरे)', 'Javala (जवळा)']
      }
    ],
  },
  {
    district: 'Satara (सातारा)',
    talukas: [
      {
        taluka: 'Satara (सातारा)',
        villages: ['Koregaon Border (कोरेगाव)', 'Shendre (शेंद्रे)', 'Parali (परळी)', 'Mahabaleshwar Road (महाबळेश्वर)'],
      },
      {
        taluka: 'Karad (कराड)',
        villages: ['Onde (उंडे)', 'Malkapur (मलकापूर)', 'Masur (मसूर)', 'Kole (कोले)'],
      },
      {
        taluka: 'Phaltan (फलटण)',
        villages: ['Barad (बरड)', 'Taradgaon (तरडगाव)', 'Nathnagar (नाथनगर)'],
      },
      {
        taluka: 'Wai (वाई)',
        villages: ['Bhuinj (भुईंज)', 'Pachgani (पाचगणी)', 'Surur (सुरूूर)'],
      }
    ],
  },
  {
    district: 'Ahmednagar (अहमदनगर / अहिल्यानगर)',
    talukas: [
      {
        taluka: 'Nagar (नगर)',
        villages: ['Bhingar (भिंगार)', 'Kedgaon (केडगाव)', 'Chas (चास)', 'Vilad (विलाद)'],
      },
      {
        taluka: 'Sangamner (संगमनेर)',
        villages: ['Ashwi (अश्वी)', 'Dhandarphal (धांदरफळ)', 'Gunjalwadi (गुंजाळवाडी)'],
      },
      {
        taluka: 'Shrirampur (श्रीरामपूर)',
        villages: ['Belapur (बेलापूर)', 'Taklibhan (टाकळीभान)', 'Padhegaon (पाधेगाव)'],
      },
      {
        taluka: 'Rahata (राहाता / शिर्डी)',
        villages: ['Shirdi (शिर्डी)', 'Sakuri (साकुरी)', 'Loni (लोणी)'],
      },
      {
        taluka: 'Kopargaon (कोपरगाव)',
        villages: ['Pohegaon (पोहेगाव)', 'Rawande (रवांदे)', 'Dharmabad (धर्माबाद)'],
      }
    ],
  },
  {
    district: 'Nagpur (नागपूर)',
    talukas: [
      {
        taluka: 'Nagpur Rural (नागपूर ग्रामीण)',
        villages: ['Hingna (हिंगणा)', 'Wadi (वाडी)', 'Kamptee (कामठी)', 'Besur (बेसूर)'],
      },
      {
        taluka: 'Katol (काटोल)',
        villages: ['Kondhali (कोंढाळी)', 'Yenwa (येनवा)', 'Paradsinga (पारडसिंगा)'],
      },
      {
        taluka: 'Ramtek (रामटेक)',
        villages: ['Mansar (मानसर)', 'Nagardhan (नगरधन)', 'Aroli (अरोली)'],
      },
      {
        taluka: 'Umred (उमरेड)',
        villages: ['Bhiwapur (भिवापूर)', 'Sirsi (सिरसी)', 'Kuhi (कुही)'],
      }
    ],
  },
  {
    district: 'Amravati (अमरावती)',
    talukas: [
      {
        taluka: 'Amravati (अमरावती)',
        villages: ['Badnera (बडनेरा)', 'Walgaon (वलगाव)', 'Nandgaon Peth (नांदगाव पेठ)'],
      },
      {
        taluka: 'Achalpur (अचलपूर / परतवाडा)',
        villages: ['Paratwada (परतवाडा)', 'Chandur Bazar (चांदूर बाजार)', 'Pathrot (पाथ्रोट)'],
      },
      {
        taluka: 'Morshi (मोर्शी)',
        villages: ['Warud (वरुड)', 'Rithpur (रिद्धपूर)', 'Ner Pinglai (नेर पिंगळाई)'],
      }
    ],
  },
  {
    district: 'Latur (लातूर)',
    talukas: [
      {
        taluka: 'Latur (लातूर)',
        villages: ['Murud (मुरुड)', 'Babhalgaon (बाभळगाव)', 'Ganjur (गांजूर)', 'Harangul (हंरगुळ)'],
      },
      {
        taluka: 'Ausa (औसा)',
        villages: ['Killari (किल्लारी)', 'Almala (अलमला)', 'Belkund (बेलकुंड)'],
      },
      {
        taluka: 'Udgir (उदगीर)',
        villages: ['Deoni (देवणी)', 'Nalegaon (नाळेगाव)', 'Hundergulli (हुंडरगुळी)'],
      }
    ],
  }
];

export function getAllDistricts(): string[] {
  return MAHARASHTRA_LOCATIONS.map((d) => d.district);
}

export function getTalukasForDistrict(districtName: string): string[] {
  if (!districtName || districtName === 'All' || districtName.includes('All Maharashtra')) {
    return [];
  }
  const match = MAHARASHTRA_LOCATIONS.find((d) => 
    d.district.toLowerCase().includes(districtName.toLowerCase()) || 
    districtName.toLowerCase().includes(d.district.split(' ')[0].toLowerCase())
  );
  return match ? match.talukas.map((t) => t.taluka) : [];
}

export function getVillagesForTaluka(districtName: string, talukaName: string): string[] {
  if (!districtName || !talukaName || talukaName === 'All') {
    return [];
  }
  const distMatch = MAHARASHTRA_LOCATIONS.find((d) => 
    d.district.toLowerCase().includes(districtName.toLowerCase()) || 
    districtName.toLowerCase().includes(d.district.split(' ')[0].toLowerCase())
  );
  if (!distMatch) return [];
  const talukaMatch = distMatch.talukas.find((t) => 
    t.taluka.toLowerCase().includes(talukaName.toLowerCase()) || 
    talukaName.toLowerCase().includes(t.taluka.split(' ')[0].toLowerCase())
  );
  return talukaMatch ? talukaMatch.villages : [];
}
