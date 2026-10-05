import { NextRequest, NextResponse } from 'next/server';
import { getServerSeasons, saveServerSeason, deleteServerSeason } from '@/lib/server-store';
import { syncDocToFirestore, deleteDocFromFirestore, fetchDocsFromFirestore } from '@/lib/firestore-admin-sync';
import { Season } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const seriesId = searchParams.get('seriesId') || searchParams.get('contentId') || undefined;
    let seasons = getServerSeasons(seriesId);

    if (seasons.length === 0 && seriesId) {
      try {
        const firestoreSeasons = await fetchDocsFromFirestore(`content/${encodeURIComponent(seriesId)}/seasons`);
        if (firestoreSeasons && firestoreSeasons.length > 0) {
          firestoreSeasons.forEach(s => saveServerSeason(s as Season));
          seasons = getServerSeasons(seriesId);
        }
      } catch (err: any) {
        console.warn('Error fetching seasons from Firestore:', err?.message);
      }
    }

    return NextResponse.json({
      success: true,
      count: seasons.length,
      data: seasons,
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
      error: err?.message || 'Failed to fetch seasons'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const seriesId = body.seriesId || body.contentId;
    if (!body || !seriesId || !body.title) {
      return NextResponse.json({ success: false, error: 'SeriesId and Title are required' }, { status: 400 });
    }

    const season: Season = {
      ...body,
      id: body.id || 'sea-' + Date.now().toString(36),
      seriesId: seriesId,
      contentId: seriesId,
      seasonNumber: body.seasonNumber ? parseInt(body.seasonNumber, 10) : 1,
      title: body.title,
      poster: body.poster || body.posterUrl || '',
      episodeCount: body.episodeCount || 0,
    } as any;

    const saved = saveServerSeason(season);

    // Synchronize to Cloud Firestore subcollection: content/{seriesId}/seasons/{seasonId}
    const firestoreData = {
      seasonNumber: season.seasonNumber,
      title: season.title,
      poster: season.poster || '',
      posterUrl: (season as any).posterUrl || season.poster || '',
      episodeCount: season.episodeCount || 0,
      seriesId: seriesId,
      contentId: seriesId,
      updatedAt: new Date().toISOString(),
    };

    const firestoreOk = await syncDocToFirestore(`content/${encodeURIComponent(seriesId)}/seasons`, season.id, firestoreData);

    return NextResponse.json({
      success: true,
      data: saved,
      firestoreSynced: firestoreOk,
      message: 'Season synced to Firestore subcollection',
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
      error: err?.message || 'Failed to save season'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const seriesId = searchParams.get('seriesId') || searchParams.get('contentId');
    const seasonId = searchParams.get('id') || searchParams.get('seasonId');

    if (!seriesId || !seasonId) {
      return NextResponse.json({ success: false, error: 'seriesId and seasonId are required' }, { status: 400 });
    }

    deleteServerSeason(seasonId);

    // Delete from Cloud Firestore subcollection
    await deleteDocFromFirestore(`content/${encodeURIComponent(seriesId)}/seasons`, seasonId);

    return NextResponse.json({
      success: true,
      message: 'Season deleted from server and Firestore'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to delete season'
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
