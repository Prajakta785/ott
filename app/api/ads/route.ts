import { NextRequest, NextResponse } from 'next/server';
import { getServerAds, saveServerAd, deleteServerAd } from '@/lib/server-store';
import { syncDocToFirestore, deleteDocFromFirestore, fetchDocsFromFirestore, recordDeletedContentInFirestore, getDeletedContentIds } from '@/lib/firestore-admin-sync';
import { Advertisement } from '@/lib/types';
import { initialAds } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let items = getServerAds();
    const deletedIds = await getDeletedContentIds();

    if (!items || items.length === 0) {
      try {
        const firestoreItems = await fetchDocsFromFirestore('ads');
        if (firestoreItems && firestoreItems.length > 0) {
          firestoreItems.forEach(item => {
            if (!deletedIds.includes(item.id)) {
              saveServerAd(item as Advertisement);
            }
          });
          items = getServerAds();
        } else {
          initialAds.forEach(item => {
            if (!deletedIds.includes(item.id)) {
              saveServerAd(item);
            }
          });
          items = getServerAds();
        }
      } catch {
        items = initialAds.filter(a => !deletedIds.includes(a.id));
      }
    }

    if (deletedIds && deletedIds.length > 0) {
      items = items.filter(a => !deletedIds.includes(a.id));
    }

    return NextResponse.json({
      success: true,
      count: items.length,
      data: items,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      count: 0,
      data: [],
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.title) {
      return NextResponse.json({ success: false, error: 'Advertisement title is required' }, { status: 400 });
    }

    const ad: Advertisement = {
      ...body,
      id: body.id || `ad_${Date.now()}`,
    };

    const saved = saveServerAd(ad);

    // Sync to Cloud Firestore 'ads' collection
    await syncDocToFirestore('ads', ad.id, ad);

    return NextResponse.json({
      success: true,
      data: saved,
      message: 'Advertisement successfully saved and synced to Cloud Firestore',
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to save advertisement'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Ad ID is required' }, { status: 400 });
    }

    // 1. Delete from server store
    deleteServerAd(id);

    // 2. Delete document directly from Cloud Firestore 'ads' collection
    await deleteDocFromFirestore('ads', id);

    // 3. Record in Cloud Firestore 'users/app_deleted_content'
    await recordDeletedContentInFirestore(id, {
      id,
      type: 'advertisement',
      deletedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Advertisement successfully deleted from Server Store and Cloud Firestore',
      deletedId: id,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (err: any) {
    console.error('API /api/ads DELETE error:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to delete advertisement'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
