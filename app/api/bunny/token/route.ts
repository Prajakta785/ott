import { NextRequest, NextResponse } from 'next/server';
import { bunnyService } from '@/lib/bunny-service';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { decryptVideoUrl } from '@/lib/crypto-utils';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store, max-age=0',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

async function handleGenerateToken(params: {
  userId?: string;
  contentId?: string;
  videoGuid?: string;
  isFreePreview?: boolean;
}) {
  const { userId, contentId, isFreePreview } = params;
  let rawGuid = (params.videoGuid || '').trim();

  if (!rawGuid) {
    return NextResponse.json({ error: 'videoGuid or videoId is required' }, { status: 400, headers: CORS_HEADERS });
  }

  // 1. Decrypt AES-256 encrypted video identifier if present
  if (rawGuid.startsWith('enc_v1:')) {
    rawGuid = decryptVideoUrl(rawGuid).trim();
  }

  // 2. Server-side Subscription Verification
  if (!isFreePreview && userId) {
    const { adminDb } = getFirebaseAdmin();
    if (adminDb) {
      try {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (!userData || userData.subscriptionStatus !== 'active') {
          return NextResponse.json({ 
            error: 'Active subscription required to generate playback stream', 
            requiresSubscription: true 
          }, { status: 403, headers: CORS_HEADERS });
        }
      } catch (authErr) {
        console.warn('Subscription check notice, allowing stream:', authErr);
      }
    }
  }

  // 3. If it's a Bunny Storage path / MP4
  if (rawGuid.includes('storage.bunnycdn.com') || rawGuid.startsWith('videos/') || rawGuid.startsWith('movies/')) {
    return NextResponse.json({
      success: true,
      playbackUrl: `/api/bunny/stream?url=${encodeURIComponent(rawGuid)}`,
      expiresIn: 7200,
    }, { headers: CORS_HEADERS });
  }

  // 4. Generate short-lived signed Bunny playback URL (valid for 2 hours)
  const cleanGuid = rawGuid.replace(/^guid-/, '').trim();
  const signedUrl = bunnyService.generateSignedStreamUrl(cleanGuid, 7200);

  return NextResponse.json({
    success: true,
    guid: cleanGuid,
    playbackUrl: signedUrl,
    url: signedUrl, // for Flutter player compatibility
    expiresIn: 7200,
  }, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const videoGuid = body.videoGuid || body.videoId || body.encryptedVideoId || '';
    return await handleGenerateToken({
      userId: body.userId,
      contentId: body.contentId,
      videoGuid,
      isFreePreview: body.isFreePreview,
    });
  } catch (error: any) {
    console.error('Error issuing playback token (POST):', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoGuid = searchParams.get('videoGuid') || searchParams.get('videoId') || searchParams.get('guid') || '';
    const userId = searchParams.get('userId') || undefined;
    const contentId = searchParams.get('contentId') || undefined;
    const isFreePreview = searchParams.get('isFreePreview') === 'true';

    return await handleGenerateToken({
      userId,
      contentId,
      videoGuid,
      isFreePreview,
    });
  } catch (error: any) {
    console.error('Error issuing playback token (GET):', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}
