const fs = require('fs');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function uploadToBunny() {
  const filePath = 'public/uploads/videos/1000899124.mp4';
  const fileBytes = fs.readFileSync(filePath);
  console.log('File size to upload:', fileBytes.length, 'bytes');

  // 1. Create video object in Bunny Stream
  const createRes = await fetch('https://video.bunnycdn.com/library/809137/videos', {
    method: 'POST',
    headers: {
      'AccessKey': 'a33345d2-ba76-49d0-8206c316903f-a89e-4e41',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'नागरिक तक्रार - 1000899124 (Raj, Soni)'
    })
  });
  const createData = await createRes.json();
  console.log('Created video in Bunny:', createData);
  const guid = createData.guid;

  if (!guid) {
    console.error('Failed to create video object');
    return;
  }

  // 2. Upload file binary
  const uploadRes = await fetch('https://video.bunnycdn.com/library/809137/videos/' + guid, {
    method: 'PUT',
    headers: {
      'AccessKey': 'a33345d2-ba76-49d0-8206c316903f-a89e-4e41',
      'Content-Type': 'application/octet-stream'
    },
    body: fileBytes
  });
  const uploadData = await uploadRes.json();
  console.log('Upload result:', uploadData);
  console.log('SUCCESS! GUID:', guid);
  console.log('Bunny Stream Embed URL: https://iframe.mediadelivery.net/embed/809137/' + guid + '?autoplay=true&preload=true');
}

uploadToBunny().catch(console.error);
