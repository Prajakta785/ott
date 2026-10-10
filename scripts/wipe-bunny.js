const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BUNNY_STREAM_API_KEY = 'afb32a68-d916-4eac-83bb2d60a0df-3935-46e4';
const BUNNY_LIBRARY_ID = '767488';
const BUNNY_STORAGE_API_KEY = '2d3836f0-1ac0-4550-bc5638b69bd8-18c0-45d9';
const BUNNY_STORAGE_ZONE = 'graminbharat';

async function wipeBunnyStream() {
  console.log('Wiping Bunny Stream...');
  const res = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos?itemsPerPage=100`, {
    headers: { AccessKey: BUNNY_STREAM_API_KEY, Accept: 'application/json' }
  });
  if (!res.ok) {
    console.error('Failed to list videos', await res.text());
    return;
  }
  const data = await res.json();
  if (data && data.items) {
    for (const video of data.items) {
      console.log('Deleting video:', video.guid);
      const del = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${video.guid}`, {
        method: 'DELETE',
        headers: { AccessKey: BUNNY_STREAM_API_KEY, Accept: 'application/json' }
      });
      console.log('Status:', del.status);
    }
  }
}

async function wipeBunnyStorage() {
  console.log('Wiping Bunny Storage...');
  const res = await fetch(`https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/`, {
    headers: { AccessKey: BUNNY_STORAGE_API_KEY, Accept: 'application/json' }
  });
  if (!res.ok) {
    console.error('Failed to list storage files', await res.text());
    return;
  }
  const files = await res.json();
  if (files && files.length > 0) {
    for (const file of files) {
      if (file.IsDirectory) continue;
      console.log('Deleting file:', file.ObjectName);
      const del = await fetch(`https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${file.ObjectName}`, {
        method: 'DELETE',
        headers: { AccessKey: BUNNY_STORAGE_API_KEY, Accept: 'application/json' }
      });
      console.log('Status:', del.status);
    }
  } else {
    console.log('No files found in storage.');
  }
}

async function run() {
  await wipeBunnyStream();
  await wipeBunnyStorage();
  console.log('Bunny wipe complete.');
}

run();
