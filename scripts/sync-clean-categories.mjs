import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY = 'AIzaSyCZTSgR2V8WRJFA81I7Eg_KXGbYGoze9_0';
const PROJECT_ID = 'graminbharattv-f8994';
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function getToken() {
  return new Promise((resolve, reject) => {
    const req = https.request('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + API_KEY, {
      method: 'POST',
      agent: httpsAgent,
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data).idToken));
    });
    req.on('error', reject);
    req.write(JSON.stringify({ email: 'admin@graminbharat.tv', password: 'Gramin@Admin2026!', returnSecureToken: true }));
    req.end();
  });
}

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

async function writeDoc(token, collection, docId, data) {
  return new Promise((resolve, reject) => {
    const fields = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    const queryParams = Object.keys(data).filter(k => data[k] !== undefined).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${encodeURIComponent(docId)}?${queryParams}`;

    const req = https.request(url, {
      method: 'PATCH',
      agent: httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(JSON.stringify({ fields }));
    req.end();
  });
}

async function deleteDoc(token, collection, docId) {
  return new Promise((resolve, reject) => {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${encodeURIComponent(docId)}`;
    const req = https.request(url, {
      method: 'DELETE',
      agent: httpsAgent,
      headers: {
        Authorization: `Bearer ${token}`
      }
    }, (res) => {
      resolve({ status: res.statusCode });
    });
    req.on('error', reject);
    req.end();
  });
}

const CLEAN_CATEGORIES = [
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

async function main() {
  console.log('Obtaining token...');
  const token = await getToken();
  console.log('Deleting duplicate cat-nammad-maharashtra...');
  await deleteDoc(token, 'categories', 'cat-nammad-maharashtra');
  await deleteDoc(token, 'categories', 'cat-podcast');
  await deleteDoc(token, 'categories', 'cat-podcast-mv0v08ik');

  console.log('Writing clean categories with order to Firestore...');
  for (const cat of CLEAN_CATEGORIES) {
    const res = await writeDoc(token, 'categories', cat.id, cat);
    console.log(`Synced ${cat.id} (${cat.nameEnglish}) [order ${cat.order}]: status ${res.status}`);
  }

  // Update local server store
  const storePath = path.join(process.cwd(), 'data', 'server-store.json');
  if (fs.existsSync(storePath)) {
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    store.categories = CLEAN_CATEGORIES;
    store.updatedAt = new Date().toISOString();
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    console.log('Updated data/server-store.json with clean categories!');
  }

  console.log('All categories successfully synced!');
}

main().catch(console.error);
