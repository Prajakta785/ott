import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('Bunny Stream Webhook Event:', payload);

    // Payload from Bunny Stream webhook typically includes:
    // Status (3 = Finished/Ready), VideoGuid, VideoLibraryId, Length, ThumbnailFileName
    const { Status, VideoGuid, Length } = payload;

    if (Status === 3 || Status === 'ready') {
      const { adminDb } = getFirebaseAdmin();
      if (adminDb && VideoGuid) {
        // Query content by videoId or update matching movie/episode
        const contentSnap = await adminDb.collection('content').where('videoId', '==', VideoGuid).get();
        if (!contentSnap.empty) {
          const docRef = contentSnap.docs[0].ref;
          await docRef.update({
            videoStatus: 'ready',
            duration: Length || 5400,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
