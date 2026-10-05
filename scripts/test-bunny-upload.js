const https = require('https');
const agent = new https.Agent({ rejectUnauthorized: false });

function httpRequest(urlStr, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = https.request(url, {
      ...options,
      agent,
      headers: { ...(options.headers || {}) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, raw: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function testBunnyStreamUpload() {
  const libId = '767488';
  const apiKey = 'afb32a68-d916-4eac-83bb2d60a0df-3935-46e4';

  console.log('1. Creating video in Bunny Stream library', libId);
  const createRes = await httpRequest(`https://video.bunnycdn.com/library/${libId}/videos`, {
    method: 'POST',
    headers: {
      'AccessKey': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }, JSON.stringify({ title: 'Test Bunny Stream Upload' }));

  console.log('Create status:', createRes.status, 'Data:', createRes.data);
  const guid = createRes.data?.guid;
  if (!guid) return;

  console.log('2. Uploading sample bytes to video GUID:', guid);
  const dummyVideo = Buffer.from('ftypisom' + '0'.repeat(1024), 'utf8');
  const uploadRes = await httpRequest(`https://video.bunnycdn.com/library/${libId}/videos/${guid}`, {
    method: 'PUT',
    headers: {
      'AccessKey': apiKey,
      'Content-Type': 'application/octet-stream',
      'Content-Length': dummyVideo.length
    }
  }, dummyVideo);

  console.log('Upload status:', uploadRes.status, 'Response:', uploadRes.data || uploadRes.raw);

  console.log('3. Checking video status in Bunny Stream...');
  const checkRes = await httpRequest(`https://video.bunnycdn.com/library/${libId}/videos/${guid}`, {
    method: 'GET',
    headers: {
      'AccessKey': apiKey,
      'Accept': 'application/json'
    }
  });
  console.log('Video check status:', checkRes.status, '| Title:', checkRes.data?.title, '| Status code:', checkRes.data?.status);

  // Cleanup
  await httpRequest(`https://video.bunnycdn.com/library/${libId}/videos/${guid}`, {
    method: 'DELETE',
    headers: { 'AccessKey': apiKey }
  });
  console.log('Cleanup complete!');
}

testBunnyStreamUpload();
