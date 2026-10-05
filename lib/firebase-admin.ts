import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

export function getFirebaseAdmin(): { adminApp: admin.app.App | null; adminDb: admin.firestore.Firestore | null; adminAuth: admin.auth.Auth | null } {
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0]!;
    return { adminApp, adminDb: adminApp.firestore(), adminAuth: adminApp.auth() };
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    try {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      return { adminApp, adminDb: adminApp.firestore(), adminAuth: adminApp.auth() };
    } catch (e) {
      console.warn("Failed to initialize Firebase Admin with service account:", e);
    }
  }

  return { adminApp: null, adminDb: null, adminAuth: null };
}
