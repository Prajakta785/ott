import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCZTSgR2V8WRJFA81I7Eg_KXGbYGoze9_0",
  authDomain: "graminbharattv-f8994.firebaseapp.com",
  projectId: "graminbharattv-f8994",
  storageBucket: "graminbharattv-f8994.firebasestorage.app",
  messagingSenderId: "243987460177",
  appId: "1:243987460177:web:5f2a16ec50fe3f08fc4870"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function wipeCollection(colName) {
  console.log(`Wiping collection: ${colName}`);
  try {
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    let count = 0;
    for (const document of snap.docs) {
      await deleteDoc(doc(db, colName, document.id));
      count++;
    }
    console.log(`Deleted ${count} documents from ${colName}`);
  } catch (e) {
    console.log(`Failed to wipe ${colName}:`, e.message);
  }
}

async function run() {
  await wipeCollection('content');
  await wipeCollection('categories');
  await wipeCollection('live_channels');
  await wipeCollection('seasons');
  await wipeCollection('episodes');
  await wipeCollection('banners');
  await wipeCollection('notifications');
  console.log('Firebase wipe complete.');
  process.exit(0);
}

run();
