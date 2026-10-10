import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCZTSgR2V8WRJFA81I7Eg_KXGbYGoze9_0',
  authDomain: 'graminbharattv-f8994.firebaseapp.com',
  projectId: 'graminbharattv-f8994',
  storageBucket: 'graminbharattv-f8994.firebasestorage.app',
  messagingSenderId: '243987460177',
  appId: '1:243987460177:web:5f2a16ec50fe3f08fc4870'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const guid = '30a63597-cf52-4efe-b0ef-a8bfa940f602';

async function updateMovie() {
  const docRef = doc(db, 'content', 'mov-mv0hpyw2');
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    console.error('mov-mv0hpyw2 not found!');
    process.exit(1);
  }

  const existing = snap.data();
  console.log('Current videoId:', existing.videoId);

  await updateDoc(docRef, {
    videoId: guid,
    videoUrl: `https://vz-92cc7e0f-cd7.b-cdn.net/${guid}/playlist.m3u8`,
    status: 'published',
    videoStatus: 'ready',
    resolution: '1080p Full HD',
    duration: 160,
    durationMinutes: 160,
    updatedAt: new Date().toISOString(),
  });

  console.log(`Successfully updated mov-mv0hpyw2 with Bunny GUID: ${guid}`);
}

updateMovie().catch(console.error).then(() => process.exit(0));
