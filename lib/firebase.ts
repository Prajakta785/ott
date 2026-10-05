import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCZTSgR2V8WRJFA81I7Eg_KXGbYGoze9_0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "graminbharattv-f8994.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "graminbharattv-f8994",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "graminbharattv-f8994.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "243987460177",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:243987460177:web:5f2a16ec50fe3f08fc4870",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-BMJH1SK3KH",
};

let app: FirebaseApp;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "ott-stream-demo"
);

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);

  // Initialize analytics safely on browser only
  if (typeof window !== "undefined") {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    });
  }
} catch (e) {
  console.warn("Firebase client initialized with notice:", e);
}

export { app, auth, db, analytics };
