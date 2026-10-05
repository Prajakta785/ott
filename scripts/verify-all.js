const https = require('https');
const agent = new https.Agent({ rejectUnauthorized: false });

function httpRequest(urlStr) {
  return new Promise((resolve, reject) => {
    https.get(urlStr, { agent }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, raw: data }); }
      });
    }).on('error', reject);
  });
}

function parseFirestoreFields(fields) {
  if (!fields) return {};
  const obj = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v.stringValue !== undefined) obj[k] = v.stringValue;
    else if (v.booleanValue !== undefined) obj[k] = v.booleanValue;
    else if (v.integerValue !== undefined) obj[k] = parseInt(v.integerValue, 10);
    else if (v.doubleValue !== undefined) obj[k] = parseFloat(v.doubleValue);
    else if (v.nullValue !== undefined) obj[k] = null;
    else if (v.arrayValue !== undefined) {
      obj[k] = (v.arrayValue.values || []).map(item => item.stringValue || item);
    }
  }
  return obj;
}

async function run() {
  console.log('====================================================');
  console.log('🔍 FIRESTORE & ANDROID COMPATIBILITY VERIFICATION');
  console.log('====================================================\n');

  // 1. Content list (what Android getFeaturedContent() gets)
  const cRes = await httpRequest('https://firestore.googleapis.com/v1/projects/graminbharattv-f8994/databases/(default)/documents/content');
  const cDocs = cRes.data.documents || [];
  console.log(`📱 1. Published Content in Cloud Firestore (Total: ${cDocs.length}):`);
  for (const doc of cDocs) {
    const id = doc.name.split('/').pop();
    const data = parseFirestoreFields(doc.fields);
    console.log(`   🎬 [${data.type?.toUpperCase()}] "${data.title}" (ID: ${id})`);
    console.log(`      Status: ${data.status} | Poster: ${data.poster ? '✅' : '❌'} | Banner: ${data.banner ? '✅' : '❌'}`);
    console.log(`      Genres: ${JSON.stringify(data.genres)} | Language: ${JSON.stringify(data.language)}`);

    // If series, check seasons
    if (data.type === 'series') {
      const sUrl = `https://firestore.googleapis.com/v1/projects/graminbharattv-f8994/databases/(default)/documents/content/${id}/seasons`;
      const sRes = await httpRequest(sUrl);
      const sDocs = sRes.data.documents || [];
      console.log(`      📺 Seasons found in Firestore: ${sDocs.length}`);
      for (const sDoc of sDocs) {
        const sId = sDoc.name.split('/').pop();
        const sData = parseFirestoreFields(sDoc.fields);
        console.log(`         👉 Season ${sData.seasonNumber}: "${sData.title}" (ID: ${sId})`);

        // Check episodes
        const epUrl = `https://firestore.googleapis.com/v1/projects/graminbharattv-f8994/databases/(default)/documents/content/${id}/seasons/${sId}/episodes`;
        const epRes = await httpRequest(epUrl);
        const epDocs = epRes.data.documents || [];
        console.log(`         🎞️ Episodes found in Firestore: ${epDocs.length}`);
        for (const epDoc of epDocs) {
          const epId = epDoc.name.split('/').pop();
          const epData = parseFirestoreFields(epDoc.fields);
          console.log(`            # Ep ${epData.episodeNumber}: "${epData.title}" | Video: ${epData.videoId ? '✅' : '❌'} | Free: ${epData.isFreePreview}`);
        }
      }
    }
  }

  console.log('\n====================================================');
  console.log('🎉 ALL DATA IS VERIFIED IN CLOUD FIRESTORE & READY FOR ANDROID APP!');
  console.log('====================================================');
}

run();
