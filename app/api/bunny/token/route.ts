import { NextRequest, NextResponse } from 'next/server';
import { bunnyService } from '@/lib/bunny-service';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { userId, contentId, videoGuid, isFreePreview } = await req.json();

    if (!videoGuid) {
      return NextResponse.json({ error: 'videoGuid is required' }, { status: 400 });
    }

    // Server-side Subscription Verification
    if (!isFreePreview && userId) {
      const { adminDb } = getFirebaseAdmin();
      if (adminDb) {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (!userData || userData.subscriptionStatus !== 'active') {
          return NextResponse.json({ 
            error: 'Active subscription required to generate playback stream', 
            requiresSubscription: true 
          }, { status: 403 });
        }
      }
    }

    // Generate short-lived signed Bunny playback URL (valid for 2 hours)
    const signedUrl = bunnyService.generateSignedStreamUrl(videoGuid, 7200);

    return NextResponse.json({
      success: true,
      playbackUrl: signedUrl,
      expiresIn: 7200,
    });
  } catch (error: any) {
    console.error('Error issuing playback token:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
