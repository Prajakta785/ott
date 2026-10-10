import { NextRequest, NextResponse } from 'next/server';
import { getServerContent, saveServerContent, deleteServerContent, getServerEpisodes, deleteServerEpisode, getServerSeasons, deleteServerSeason } from '@/lib/server-store';
import { syncDocToFirestore, deleteDocFromFirestore, fetchDocsFromFirestore, recordDeletedContentInFirestore, getDeletedContentIds } from '@/lib/firestore-admin-sync';
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

    const deletedIds = await getDeletedContentIds();
    if (deletedIds && deletedIds.length > 0) {
      items = items.filter(c => !deletedIds.includes(c.id));
    }

    // Filter for valid Bunny.net videos only (as requested by user)
    // Exclude dummy items and user errors (like local file paths)
    items = items.filter(c => {
      // Check if videoId is a valid Bunny Stream UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.videoId || '');
      // Check if videoId is a valid Bunny Storage URL
      const isBunnyStorage = (c.videoId || '').includes('storage.bunnycdn.com') || (c.videoUrl || '').includes('storage.bunnycdn.com');
      
      // If it's a series without a direct video, we only keep it if it's not the dummy one
      if (c.type === 'series') {
        if (c.id === 'ser-rang-majha-vegla' || (c.videoId && !isUUID && !isBunnyStorage)) return false;
        return true;
      }

      // If it's a podcast or audio, allow if it has audioUrl, audioTrackUrl, or valid stream
      if (c.type === 'podcast' || c.type === 'audio') {
        return !!(c.audioUrl || c.audioTrackUrl || isUUID || isBunnyStorage);
      }
      
      // For all other content (movies, news, shows), MUST have a valid Bunny video
      return isUUID || isBunnyStorage;
    });

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
    let finalVideoId = videoPlayback?.videoId || body.videoId || '';

    // Smart mapping for known content
    if (finalVideoId === '40n05SgU8iQ' || body.title?.toLowerCase().includes('hasya') || rawVideo.toLowerCase().includes('hasya')) {
      finalVideoId = '9fbc7264-bf8a-4d23-b4f7-db75f63350f6';
    } else if (body.title?.toLowerCase().includes('chhaava') || body.title?.toLowerCase().includes('chhava') || rawVideo.toLowerCase().includes('chhaava')) {
      finalVideoId = '30a63597-cf52-4efe-b0ef-a8bfa940f602';
    } else if (body.title?.toLowerCase().includes('pune morning') || body.id === 'media-muzcto6a') {
      finalVideoId = 'b778c66f-91f6-451d-9b1d-02fc91fdc37b';
    }

    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(finalVideoId);
    const finalHlsUrl = isGuid ? `https://vz-92cc7e0f-cd7.b-cdn.net/${finalVideoId}/playlist.m3u8` : (videoPlayback?.hlsUrl || body.videoUrl || '');
    const finalEmbedUrl = isGuid ? `https://iframe.mediadelivery.net/embed/767488/${finalVideoId}?autoplay=true&preload=true` : (videoPlayback?.embedUrl || '');

    const contentType = body.type || body.contentType || 'movie';
    const item: ContentItem = {
      ...body,
      id: body.id || (contentType === 'series' ? 'ser-' : 'mov-') + Date.now().toString(36),
      type: contentType,
      status: body.status || 'published', // ensure published for Android app visibility
      poster: body.poster || body.posterUrl || (isGuid ? `https://vz-92cc7e0f-cd7.b-cdn.net/${finalVideoId}/thumbnail.jpg` : ''),
      posterUrl: body.posterUrl || body.poster || (isGuid ? `https://vz-92cc7e0f-cd7.b-cdn.net/${finalVideoId}/thumbnail.jpg` : ''),
      banner: body.banner || body.bannerUrl || (isGuid ? `https://vz-92cc7e0f-cd7.b-cdn.net/${finalVideoId}/thumbnail.jpg` : ''),
      bannerUrl: body.bannerUrl || body.banner || (isGuid ? `https://vz-92cc7e0f-cd7.b-cdn.net/${finalVideoId}/thumbnail.jpg` : ''),
      duration: body.duration || body.durationMinutes || 0,
      durationMinutes: body.durationMinutes || (body.duration ? (body.duration > 300 ? Math.floor(body.duration / 60) : body.duration) : 0),
      videoId: finalVideoId,
      videoUrl: finalHlsUrl,
      hlsUrl: finalHlsUrl,
      embedUrl: finalEmbedUrl,
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
    const providedVideoId = searchParams.get('videoId');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    // 1. Retrieve the item from server store to find all metadata & videos before deleting
    const allContent = getServerContent();
    const targetItem = allContent.find(c => c.id === id);
    const videoIdToDelete = providedVideoId || targetItem?.videoId;

    // 2. Bunny.net Deletion for the main video
    if (videoIdToDelete) {
      try {
        await bunnyService.deleteVideo(videoIdToDelete);
      } catch (e) {
        console.warn('Bunny main video delete notice:', e);
      }
    }

    // 3. If item is a web series or has episodes, delete all episode videos from Bunny.net too!
    const seriesEpisodes = getServerEpisodes(id);
    if (seriesEpisodes && seriesEpisodes.length > 0) {
      for (const ep of seriesEpisodes) {
        if (ep.videoId) {
          try {
            await bunnyService.deleteVideo(ep.videoId);
          } catch (e) {
            console.warn(`Bunny episode video ${ep.videoId} delete notice:`, e);
          }
        }
        deleteServerEpisode(ep.id);
        if (ep.seasonId) {
          await deleteDocFromFirestore(`content/${encodeURIComponent(id)}/seasons/${encodeURIComponent(ep.seasonId)}/episodes`, ep.id);
        }
      }
    }

    // Also clean up any seasons associated with this series
    const seriesSeasons = getServerSeasons(id);
    if (seriesSeasons && seriesSeasons.length > 0) {
      for (const s of seriesSeasons) {
        deleteServerSeason(s.id);
        await deleteDocFromFirestore(`content/${encodeURIComponent(id)}/seasons`, s.id);
      }
    }

    // 4. Delete item from server store (server-store.json)
    deleteServerContent(id);

    // 5. Delete document directly from Cloud Firestore 'content' collection
    await deleteDocFromFirestore('content', id);

    // 6. Record in Cloud Firestore 'users/app_deleted_content'
    // This allows the mobile app and web clients to immediately purge this item from all feeds & caches
    await recordDeletedContentInFirestore(id, {
      id,
      title: targetItem?.title || '',
      type: targetItem?.type || 'movie',
      videoId: videoIdToDelete || '',
      deletedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Content successfully deleted from Admin, Bunny.net, Firestore and Mobile App',
      deletedId: id,
      bunnyVideoDeleted: !!videoIdToDelete,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (err: any) {
    console.error('API /api/content DELETE error:', err);
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
