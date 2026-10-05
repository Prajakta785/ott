import { NextRequest, NextResponse } from 'next/server';
import { getServerContent, saveServerContent } from '@/lib/server-store';
import { syncDocToFirestore, fetchDocsFromFirestore } from '@/lib/firestore-admin-sync';
import { ContentItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let movies = getServerContent('movie');
    if (movies.length === 0) {
      try {
        const firestoreItems = await fetchDocsFromFirestore('content');
        if (firestoreItems && firestoreItems.length > 0) {
          firestoreItems.forEach(item => saveServerContent(item as ContentItem));
          movies = getServerContent('movie');
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      count: movies.length,
      data: movies,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to fetch movies'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.title) {
      return NextResponse.json({ success: false, error: 'Movie title is required' }, { status: 400 });
    }

    const item: ContentItem = {
      ...body,
      id: body.id || 'mov-' + Date.now().toString(36),
      type: 'movie',
      status: body.status || 'published',
    };

    const saved = saveServerContent(item);

    // Sync to Cloud Firestore
    await syncDocToFirestore('content', item.id, item);

    return NextResponse.json({
      success: true,
      data: saved,
      message: 'Movie successfully saved and synced to Cloud Firestore & Android app',
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to save movie'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
