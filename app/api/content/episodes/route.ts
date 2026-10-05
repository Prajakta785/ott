import { NextRequest, NextResponse } from 'next/server';
import { getServerEpisodes, saveServerEpisode, deleteServerEpisode } from '@/lib/server-store';
import { syncDocToFirestore, deleteDocFromFirestore, fetchDocsFromFirestore } from '@/lib/firestore-admin-sync';
import { bunnyService } from '@/lib/bunny-service';
import { Episode } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const seriesId = searchParams.get('seriesId') || searchParams.get('contentId') || undefined;
    const seasonId = searchParams.get('seasonId') || undefined;

    let episodes = getServerEpisodes(seriesId, seasonId);

    if (episodes.length === 0 && seriesId && seasonId) {
      try {
        const path = `content/${encodeURIComponent(seriesId)}/seasons/${encodeURIComponent(seasonId)}/episodes`;
        const firestoreEpisodes = await fetchDocsFromFirestore(path);
        if (firestoreEpisodes && firestoreEpisodes.length > 0) {
          firestoreEpisodes.forEach(e => saveServerEpisode(e as Episode));
          episodes = getServerEpisodes(seriesId, seasonId);
        }
      } catch (err: any) {
        console.warn('Error fetching episodes from Firestore:', err?.message);
      }
    }

    return NextResponse.json({
      success: true,
      count: episodes.length,
      data: episodes,
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
      error: err?.message || 'Failed to fetch episodes'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const seriesId = body.seriesId || body.contentId;
    const seasonId = body.seasonId;

    if (!body || !seriesId || !seasonId || !body.title) {
      return NextResponse.json({ success: false, error: 'seriesId, seasonId and title are required' }, { status: 400 });
    }

    const durationSeconds = body.durationSeconds || body.duration || 2400;
    const rawVideo = body.videoId || body.videoUrl || '';
    const videoPlayback = rawVideo ? bunnyService.resolvePlaybackUrls(rawVideo) : null;

    const episode: Episode = {
      ...body,
      id: body.id || 'ep-' + Date.now().toString(36),
      seriesId: seriesId,
      contentId: seriesId,
      seasonId: seasonId,
      episodeNumber: body.episodeNumber ? parseInt(body.episodeNumber, 10) : 1,
      title: body.title,
      description: body.description || '',
      videoId: videoPlayback?.videoId || body.videoId || '',
      duration: durationSeconds,
      thumbnail: body.thumbnail || body.thumbnailUrl || '',
      thumbnailUrl: body.thumbnailUrl || body.thumbnail || '',
      isFreePreview: !!body.isFreePreview,
      price: typeof body.price === 'number' ? body.price : 0,
    } as any;

    const saved = saveServerEpisode(episode);

    // Sync episode video metadata to Bunny Stream in background
    if (episode.videoId && episode.videoId.length > 10 && !episode.videoId.startsWith('http')) {
      bunnyService.updateVideoTitle(episode.videoId, `Episode ${episode.episodeNumber} - ${episode.title}`).catch(e => console.warn('Bunny episode title sync notice:', e));
    }

    // Synchronize directly to Cloud Firestore subcollection:
    // content/{seriesId}/seasons/{seasonId}/episodes/{episodeId}
    const firestoreData = {
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      description: episode.description,
      videoId: videoPlayback?.videoId || episode.videoId || '',
      videoUrl: videoPlayback?.hlsUrl || videoPlayback?.directUrl || body.videoUrl || episode.videoId || '',
      hlsUrl: videoPlayback?.hlsUrl || '',
      embedUrl: videoPlayback?.embedUrl || '',
      duration: durationSeconds,
      durationSeconds: durationSeconds,
      thumbnail: episode.thumbnail || '',
      thumbnailUrl: (episode as any).thumbnailUrl || episode.thumbnail || '',
      isFreePreview: episode.isFreePreview || false,
      price: episode.price || 0,
      seriesId: seriesId,
      contentId: seriesId,
      seasonId: seasonId,
      updatedAt: new Date().toISOString(),
    };

    const path = `content/${encodeURIComponent(seriesId)}/seasons/${encodeURIComponent(seasonId)}/episodes`;
    const firestoreOk = await syncDocToFirestore(path, episode.id, firestoreData);

    return NextResponse.json({
      success: true,
      data: saved,
      firestoreSynced: firestoreOk,
      message: 'Episode synced to Firestore subcollection',
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
      error: err?.message || 'Failed to save episode'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const seriesId = searchParams.get('seriesId') || searchParams.get('contentId');
    const seasonId = searchParams.get('seasonId');
    const episodeId = searchParams.get('id') || searchParams.get('episodeId');

    if (!seriesId || !seasonId || !episodeId) {
      return NextResponse.json({ success: false, error: 'seriesId, seasonId and episodeId are required' }, { status: 400 });
    }

    deleteServerEpisode(episodeId);

    // Delete from Cloud Firestore subcollection
    const path = `content/${encodeURIComponent(seriesId)}/seasons/${encodeURIComponent(seasonId)}/episodes`;
    await deleteDocFromFirestore(path, episodeId);

    return NextResponse.json({
      success: true,
      message: 'Episode deleted from server and Firestore'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to delete episode'
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
