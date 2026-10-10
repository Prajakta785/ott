import { NextRequest, NextResponse } from 'next/server';
import { 
  saveServerContent, 
  saveServerSeason, 
  saveServerEpisode, 
  saveServerLiveChannel,
  readServerStore
} from '@/lib/server-store';
import { syncDocToFirestore, getDeletedContentIds } from '@/lib/firestore-admin-sync';
import { bunnyService } from '@/lib/bunny-service';
import { ContentItem, Season, Episode, LiveChannel, Banner } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deletedIds = await getDeletedContentIds();
    const results = {
      contentSynced: 0,
      seasonsSynced: 0,
      episodesSynced: 0,
      liveChannelsSynced: 0,
      bannersSynced: 0,
    };

    // 1. Sync Content items (skipping any deleted items)
    if (body.content && Array.isArray(body.content)) {
      for (const raw of body.content) {
        if (!raw.title) continue;
        if (raw.id && deletedIds.includes(raw.id)) continue;

        const rawVideo = raw.videoId || raw.videoUrl || '';
        const videoPlayback = rawVideo ? bunnyService.resolvePlaybackUrls(rawVideo) : null;

        const contentType = raw.type || raw.contentType || 'movie';
        const item: ContentItem = {
          ...raw,
          id: raw.id || (contentType === 'series' ? 'ser-' : 'mov-') + Date.now().toString(36),
          type: contentType,
          status: raw.status || 'published',
          poster: raw.poster || raw.posterUrl || '',
          posterUrl: raw.posterUrl || raw.poster || '',
          banner: raw.banner || raw.bannerUrl || '',
          bannerUrl: raw.bannerUrl || raw.banner || '',
          duration: raw.duration || raw.durationMinutes || 0,
          durationMinutes: raw.durationMinutes || (raw.duration ? (raw.duration > 300 ? Math.floor(raw.duration / 60) : raw.duration) : 0),
          videoId: videoPlayback?.videoId || raw.videoId || '',
          videoUrl: videoPlayback?.hlsUrl || videoPlayback?.directUrl || raw.videoUrl || raw.videoId || '',
          hlsUrl: videoPlayback?.hlsUrl || '',
          embedUrl: videoPlayback?.embedUrl || '',
        };
        saveServerContent(item);
        const ok = await syncDocToFirestore('content', item.id, item);
        if (ok) results.contentSynced++;
      }
    }

    // 2. Sync Seasons (skipping any deleted seasons)
    if (body.seasons && Array.isArray(body.seasons)) {
      for (const raw of body.seasons) {
        const seriesId = raw.seriesId || raw.contentId;
        if (!seriesId || !raw.title) continue;
        if (raw.id && (deletedIds.includes(raw.id) || deletedIds.includes(seriesId))) continue;

        const season: Season = {
          ...raw,
          id: raw.id || 'sea-' + Date.now().toString(36),
          seriesId: seriesId,
          contentId: seriesId,
          seasonNumber: raw.seasonNumber ? parseInt(raw.seasonNumber, 10) : 1,
          poster: raw.poster || raw.posterUrl || '',
          posterUrl: raw.posterUrl || raw.poster || '',
          episodeCount: raw.episodeCount || 0,
        } as any;
        saveServerSeason(season);
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
        const ok = await syncDocToFirestore(`content/${encodeURIComponent(seriesId)}/seasons`, season.id, firestoreData);
        if (ok) results.seasonsSynced++;
      }
    }

    // 3. Sync Episodes (skipping any deleted episodes)
    if (body.episodes && Array.isArray(body.episodes)) {
      for (const raw of body.episodes) {
        const seriesId = raw.seriesId || raw.contentId;
        const seasonId = raw.seasonId;
        if (!seriesId || !seasonId || !raw.title) continue;
        if (raw.id && (deletedIds.includes(raw.id) || deletedIds.includes(seriesId) || deletedIds.includes(seasonId))) continue;

        const durationSeconds = raw.durationSeconds || raw.duration || 2400;
        const rawVideo = raw.videoId || raw.videoUrl || '';
        const videoPlayback = rawVideo ? bunnyService.resolvePlaybackUrls(rawVideo) : null;

        const episode: Episode = {
          ...raw,
          id: raw.id || 'ep-' + Date.now().toString(36),
          seriesId: seriesId,
          contentId: seriesId,
          seasonId: seasonId,
          episodeNumber: raw.episodeNumber ? parseInt(raw.episodeNumber, 10) : 1,
          duration: durationSeconds,
          thumbnail: raw.thumbnail || raw.thumbnailUrl || '',
          thumbnailUrl: raw.thumbnailUrl || raw.thumbnail || '',
        } as any;
        saveServerEpisode(episode);
        const firestoreData = {
          episodeNumber: episode.episodeNumber,
          title: episode.title,
          description: episode.description || '',
          videoId: videoPlayback?.videoId || episode.videoId || '',
          videoUrl: videoPlayback?.hlsUrl || videoPlayback?.directUrl || raw.videoUrl || episode.videoId || '',
          hlsUrl: videoPlayback?.hlsUrl || '',
          embedUrl: videoPlayback?.embedUrl || '',
          duration: durationSeconds,
          durationSeconds: durationSeconds,
          thumbnail: episode.thumbnail || '',
          thumbnailUrl: (episode as any).thumbnailUrl || episode.thumbnail || '',
          isFreePreview: !!episode.isFreePreview,
          price: typeof episode.price === 'number' ? episode.price : 0,
          seriesId: seriesId,
          contentId: seriesId,
          seasonId: seasonId,
          updatedAt: new Date().toISOString(),
        };
        const path = `content/${encodeURIComponent(seriesId)}/seasons/${encodeURIComponent(seasonId)}/episodes`;
        const ok = await syncDocToFirestore(path, episode.id, firestoreData);
        if (ok) results.episodesSynced++;
      }
    }

    // 4. Sync Live Channels (skipping any deleted channels)
    if (body.liveChannels && Array.isArray(body.liveChannels)) {
      for (const ch of body.liveChannels) {
        if (!ch.name) continue;
        if (ch.id && deletedIds.includes(ch.id)) continue;

        saveServerLiveChannel(ch);
        await syncDocToFirestore('live_channels', ch.id, ch);
        await syncDocToFirestore('liveChannels', ch.id, ch);
        results.liveChannelsSynced++;
      }
    }

    // 5. Sync Banners (skipping any deleted banners)
    if (body.banners && Array.isArray(body.banners)) {
      for (const b of body.banners) {
        if (!b.title) continue;
        if (b.id && (deletedIds.includes(b.id) || (b.contentId && deletedIds.includes(b.contentId)))) continue;

        await syncDocToFirestore('banners', b.id, b);
        results.bannersSynced++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'All items successfully synchronized to Cloud Firestore & Android app',
      results,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Bulk sync failed'
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
