import { NextRequest, NextResponse } from 'next/server';
import { getServerLiveChannels, saveServerLiveChannel, deleteServerLiveChannel } from '@/lib/server-store';
import { syncDocToFirestore, deleteDocFromFirestore, fetchDocsFromFirestore, recordDeletedContentInFirestore, getDeletedContentIds } from '@/lib/firestore-admin-sync';
import { bunnyService } from '@/lib/bunny-service';
import { LiveChannel } from '@/lib/types';
import { initialLiveChannels } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let items = getServerLiveChannels();
    const deletedIds = await getDeletedContentIds();

    // If local store is empty, sync from Cloud Firestore
    if (!items || items.length === 0) {
      try {
        const firestoreItems = await fetchDocsFromFirestore('live_channels');
        if (firestoreItems && firestoreItems.length > 0) {
          firestoreItems.forEach(item => {
            if (!deletedIds.includes(item.id)) {
              saveServerLiveChannel(item as LiveChannel);
            }
          });
          items = getServerLiveChannels();
        } else {
          // Fallback to initial production live channels
          initialLiveChannels.forEach(item => {
            if (!deletedIds.includes(item.id)) {
              saveServerLiveChannel(item);
            }
          });
          items = getServerLiveChannels();
        }
      } catch {
        items = initialLiveChannels.filter(c => !deletedIds.includes(c.id));
      }
    }

    if (deletedIds && deletedIds.length > 0) {
      items = items.filter(c => !deletedIds.includes(c.id));
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
    if (!body || !body.channelName) {
      return NextResponse.json({ success: false, error: 'Channel name is required' }, { status: 400 });
    }

    const channel: LiveChannel = {
      ...body,
      id: body.id || `live_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };

    const saved = saveServerLiveChannel(channel);

    // Sync live stream title to Bunny Stream if streamUrl is or contains a Bunny GUID
    if (channel.streamUrl) {
      const playback = bunnyService.resolvePlaybackUrls(channel.streamUrl);
      if (playback.videoId && playback.videoId.length > 10 && !playback.videoId.startsWith('http')) {
        bunnyService.updateVideoTitle(playback.videoId, `${channel.channelName} - Live Stream Feed`).catch(e => console.warn('Bunny live title sync notice:', e));
      }
    }

    // Sync in background to both live_channels and liveChannels collections for Android & Web
    await syncDocToFirestore('live_channels', channel.id, channel).catch(() => {});
    await syncDocToFirestore('liveChannels', channel.id, channel).catch(() => {});

    return NextResponse.json({
      success: true,
      data: saved,
      message: 'Live stream channel successfully saved and synced',
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
      error: err?.message || 'Failed to save live channel'
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

    // 1. Delete from server store
    deleteServerLiveChannel(id);

    // 2. Delete directly from Cloud Firestore collections
    await deleteDocFromFirestore('live_channels', id).catch(() => {});
    await deleteDocFromFirestore('liveChannels', id).catch(() => {});

    // 3. Record in Cloud Firestore users/app_deleted_content
    await recordDeletedContentInFirestore(id, {
      id,
      type: 'liveChannel',
      deletedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Live channel deleted from server, Cloud Firestore, and Android App',
      deletedId: id,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to delete live channel'
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
