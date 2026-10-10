import { NextRequest, NextResponse } from 'next/server';
import { getServerBanners, saveServerBanner, deleteServerBanner } from '@/lib/server-store';
import { syncDocToFirestore, deleteDocFromFirestore, fetchDocsFromFirestore, recordDeletedContentInFirestore, getDeletedContentIds } from '@/lib/firestore-admin-sync';
import { Banner } from '@/lib/types';
import { initialBanners } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let items = getServerBanners();
    const deletedIds = await getDeletedContentIds();

    // If local store is empty or needs refresh
    if (!items || items.length === 0) {
      try {
        const firestoreItems = await fetchDocsFromFirestore('banners');
        if (firestoreItems && firestoreItems.length > 0) {
          firestoreItems.forEach(item => {
            if (!deletedIds.includes(item.id) && !deletedIds.includes((item as any).contentId)) {
              saveServerBanner(item as Banner);
            }
          });
          items = getServerBanners();
        } else {
          initialBanners.forEach(item => {
            if (!deletedIds.includes(item.id) && !deletedIds.includes(item.contentId)) {
              saveServerBanner(item);
            }
          });
          items = getServerBanners();
        }
      } catch {
        items = initialBanners.filter(b => !deletedIds.includes(b.id) && !deletedIds.includes(b.contentId));
      }
    }

    if (deletedIds && deletedIds.length > 0) {
      items = items.filter(b => !deletedIds.includes(b.id) && !deletedIds.includes(b.contentId));
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
      return NextResponse.json({ success: false, error: 'Banner title is required' }, { status: 400 });
    }

    const banner: Banner = {
      ...body,
      id: body.id || `banner_${Date.now()}`,
      order: typeof body.order === 'number' ? body.order : 0,
      active: body.active !== undefined ? !!body.active : true,
    };

    const saved = saveServerBanner(banner);

    // Sync to Cloud Firestore 'banners' collection
    await syncDocToFirestore('banners', banner.id, banner);

    return NextResponse.json({
      success: true,
      data: saved,
      message: 'Banner successfully saved and synced to Cloud Firestore & Android app',
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
      error: err?.message || 'Failed to save banner'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Banner ID is required' }, { status: 400 });
    }

    // 1. Delete from local server-store.json
    deleteServerBanner(id);

    // 2. Delete document directly from Cloud Firestore 'banners' collection
    await deleteDocFromFirestore('banners', id);

    // 3. Record in Cloud Firestore 'users/app_deleted_content' so Android app purges it instantly
    await recordDeletedContentInFirestore(id, {
      id,
      type: 'banner',
      deletedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Banner successfully deleted from Server Store, Cloud Firestore, and Android App',
      deletedId: id,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (err: any) {
    console.error('API /api/banners DELETE error:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to delete banner'
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
