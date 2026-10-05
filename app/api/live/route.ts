import { NextRequest, NextResponse } from 'next/server';
import { getServerLiveChannels, saveServerLiveChannel, deleteServerLiveChannel } from '@/lib/server-store';
import { syncDocToFirestore, deleteDocFromFirestore, fetchDocsFromFirestore } from '@/lib/firestore-admin-sync';
import { bunnyService } from '@/lib/bunny-service';
import { LiveChannel } from '@/lib/types';
import { initialLiveChannels } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let items = getServerLiveChannels();

    // If local store is empty, sync from Cloud Firestore
    if (!items || items.length === 0) {
      try {
        const firestoreItems = await fetchDocsFromFirestore('live_channels');
        if (firestoreItems && firestoreItems.length > 0) {
          firestoreItems.forEach(item => saveServerLiveChannel(item as LiveChannel));
          items = getServerLiveChannels();
        } else {
          // Fallback to initial production live channels
          initialLiveChannels.forEach(item => saveServerLiveChannel(item));
          items = getServerLiveChannels();
        }
      } catch {
        items = initialLiveChannels;
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
      success: true,
      count: initialLiveChannels.length,
      data: initialLiveChannels,
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
    syncDocToFirestore('live_channels', channel.id, channel).catch(() => {});
    syncDocToFirestore('liveChannels', channel.id, channel).catch(() => {});

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

    deleteServerLiveChannel(id);

    // Delete directly from Cloud Firestore
    deleteDocFromFirestore('live_channels', id).catch(() => {});
    deleteDocFromFirestore('liveChannels', id).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Live channel deleted from server and Cloud Firestore'
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
