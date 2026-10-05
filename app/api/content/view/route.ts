import { NextRequest, NextResponse } from 'next/server';
import { incrementServerContentViews, readServerStore } from '@/lib/server-store';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, videoId, amount = 1 } = body;
    const targetId = id || videoId;

    if (!targetId) {
      return NextResponse.json({ success: false, error: 'id or videoId is required' }, { status: 400 });
    }

    // 1. Increment local server store views
    const updatedViews = incrementServerContentViews(targetId, amount);

    // 2. Increment in Cloud Firestore
    try {
      const { adminDb } = getFirebaseAdmin();
      if (adminDb) {
        const docRef = adminDb.collection('content').doc(targetId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          await docRef.update({
            views: FieldValue.increment(amount),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (err: any) {
      console.warn('Firestore view increment notice:', err?.message);
    }

    return NextResponse.json({
      success: true,
      id: targetId,
      views: updatedViews,
      message: 'View count incremented successfully',
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || searchParams.get('videoId');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    const store = readServerStore();
    const item = store.content.find(c => c.id === id || c.videoId === id);
    const views = item?.views || 0;

    return NextResponse.json({
      success: true,
      id,
      views,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
