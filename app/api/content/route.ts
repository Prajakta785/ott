import { NextRequest, NextResponse } from 'next/server';
import { getServerContent, saveServerContent, deleteServerContent } from '@/lib/server-store';
import { syncDocToFirestore, deleteDocFromFirestore, fetchDocsFromFirestore } from '@/lib/firestore-admin-sync';
import { bunnyService } from '@/lib/bunny-service';
import { ContentItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || undefined;
    let items = getServerContent(type);

    // If local store is empty or we want to ensure fresh Firestore data
    if (items.length === 0) {
      try {
        const firestoreItems = await fetchDocsFromFirestore('content');
        if (firestoreItems && firestoreItems.length > 0) {
          firestoreItems.forEach(item => saveServerContent(item as ContentItem));
          items = getServerContent(type);
        }
      } catch (err: any) {
        console.warn('Firestore fetchDocs notice:', err?.message);
      }
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
      success: false,
      error: err?.message || 'Failed to fetch content'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const rawVideo = body.videoId || body.videoUrl || '';
    const videoPlayback = rawVideo ? bunnyService.resolvePlaybackUrls(rawVideo) : null;

    const contentType = body.type || body.contentType || 'movie';
    const item: ContentItem = {
      ...body,
      id: body.id || (contentType === 'series' ? 'ser-' : 'mov-') + Date.now().toString(36),
      type: contentType,
      status: body.status || 'published', // ensure published for Android app visibility
      poster: body.poster || body.posterUrl || '',
      posterUrl: body.posterUrl || body.poster || '',
      banner: body.banner || body.bannerUrl || '',
      bannerUrl: body.bannerUrl || body.banner || '',
      duration: body.duration || body.durationMinutes || 0,
      durationMinutes: body.durationMinutes || (body.duration ? (body.duration > 300 ? Math.floor(body.duration / 60) : body.duration) : 0),
      videoId: videoPlayback?.videoId || body.videoId || '',
      videoUrl: videoPlayback?.hlsUrl || videoPlayback?.directUrl || body.videoUrl || body.videoId || '',
      hlsUrl: videoPlayback?.hlsUrl || '',
      embedUrl: videoPlayback?.embedUrl || '',
      isFeatured: body.isFeatured !== undefined ? !!body.isFeatured : true,
    };

    const saved = saveServerContent(item);

    // Sync video metadata to Bunny Stream in background so it appears in Bunny Library with proper title
    if (item.videoId && item.videoId.length > 10 && !item.videoId.startsWith('http')) {
      const typeLabel = item.type === 'movie' ? 'Official Movie' : item.type === 'series' ? 'Web Series' : item.type === 'news' ? 'News Bulletin' : 'Video';
      bunnyService.updateVideoTitle(item.videoId, `${item.title} - ${typeLabel}`).catch(e => console.warn('Bunny title sync notice:', e));
    }

    // Synchronize directly to Cloud Firestore in real time
    const firestoreOk = await syncDocToFirestore('content', item.id, item);

    return NextResponse.json({
      success: true,
      data: saved,
      firestoreSynced: firestoreOk,
      message: 'Content successfully synced to Cloud Firestore & Android app',
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
      error: err?.message || 'Failed to save content'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    deleteServerContent(id);

    // Delete directly from Cloud Firestore
    await deleteDocFromFirestore('content', id);

    return NextResponse.json({
      success: true,
      message: 'Content deleted from server and Cloud Firestore'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to delete content'
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
