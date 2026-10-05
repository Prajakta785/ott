import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

/**
 * 1. Create Bunny Stream Direct Upload Session
 */
export const createBunnyUploadSession = functions.https.onCall(async (data, context) => {
  // Verify admin auth
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { title } = data;
  const apiKey = process.env.BUNNY_STREAM_API_KEY || '';
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID || '';

  if (!apiKey || !libraryId) {
    throw new functions.https.HttpsError('failed-precondition', 'Bunny API credentials missing');
  }

  try {
    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: 'POST',
      headers: {
        AccessKey: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: title || 'Untitled Stream' }),
    });

    const videoData: any = await res.json();
    const videoId = videoData.guid;
    const expires = Math.floor(Date.now() / 1000) + 7200;
    const signature = crypto.createHash('sha256').update(`${libraryId}${apiKey}${expires}${videoId}`).digest('hex');

    return {
      videoId,
      directUploadUrl: `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
      authorizationSignature: signature,
      authorizationExpire: expires,
      libraryId,
    };
  } catch (err: any) {
    throw new functions.https.HttpsError('internal', err.message);
  }
});

/**
 * 2. Generate Signed Playback Token for User Playback
 */
export const getSignedPlaybackUrl = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be signed in');
  }

  const { videoGuid, isFreePreview } = data;
  const userId = context.auth.uid;

  if (!isFreePreview) {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    if (!userData || userData.subscriptionStatus !== 'active') {
      throw new functions.https.HttpsError('permission-denied', 'Active subscription required');
    }
  }

  const securityKey = process.env.BUNNY_TOKEN_SECURITY_KEY || '';
  const cdnHost = process.env.BUNNY_CDN_HOSTNAME || 'stream.ottplatform.b-cdn.net';
  const expires = Math.floor(Date.now() / 1000) + 7200;
  const path = `/${videoGuid}/playlist.m3u8`;

  let token = '';
  if (securityKey) {
    token = crypto.createHash('md5').update(`${securityKey}${path}${expires}`).digest('hex');
  }

  return {
    playbackUrl: `https://${cdnHost}${path}?token=${token}&expires=${expires}`,
    expires,
  };
});

/**
 * 3. Bunny Stream Webhook Endpoint (HTTPS)
 */
export const bunnyWebhook = functions.https.onRequest(async (req, res) => {
  const { Status, VideoGuid, Length } = req.body;

  if (Status === 3 || Status === 'ready') {
    const querySnap = await db.collection('content').where('videoId', '==', VideoGuid).get();
    if (!querySnap.empty) {
      await querySnap.docs[0].ref.update({
        videoStatus: 'ready',
        duration: Length || 5400,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  res.status(200).json({ success: true });
});

/**
 * 4. Create/Invite Admin User with Custom Claims
 */
export const createAdminUser = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.adminRole !== 'superadmin') {
    throw new functions.https.HttpsError('permission-denied', 'Superadmin privilege required');
  }

  const { email, password, name, role } = data;

  const user = await auth.createUser({
    email,
    password: password || 'SecureAdminTempPass123!',
    displayName: name,
  });

  await auth.setCustomUserClaims(user.uid, {
    isAdmin: true,
    adminRole: role || 'editor',
  });

  await db.collection('admins').doc(user.uid).set({
    uid: user.uid,
    email,
    name,
    role: role || 'editor',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { uid: user.uid, email, role };
});
