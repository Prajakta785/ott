import { NextRequest, NextResponse } from 'next/server';
import { bunnyService } from '@/lib/bunny-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const itemsPerPage = parseInt(searchParams.get('itemsPerPage') || '50', 10);

    const result = await bunnyService.listVideos(page, itemsPerPage);

    return NextResponse.json({
      success: true,
      count: result.items.length,
      total: result.totalItems,
      data: result.items,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (err: any) {
    console.error('API /api/bunny/videos GET error:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to fetch Bunny Stream videos'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, guid, videoId, title, url } = body;
    const targetGuid = guid || videoId;

    if (action === 'update_title' || (targetGuid && title && !url)) {
      const ok = await bunnyService.updateVideoTitle(targetGuid, title);
      return NextResponse.json({
        success: ok,
        message: ok ? 'Video title updated in Bunny Stream' : 'Failed to update title in Bunny Stream',
      }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (action === 'fetch_url' || (url && title)) {
      const res = await bunnyService.fetchVideoFromUrl(url, title);
      return NextResponse.json({
        success: res.success,
        guid: res.guid,
        message: res.success ? 'Video fetch initiated in Bunny Stream' : (res.error || 'Fetch failed'),
      }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action or parameters' }, { status: 400 });
  } catch (err: any) {
    console.error('API /api/bunny/videos POST error:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to process request'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let targetGuid = searchParams.get('guid') || searchParams.get('videoId') || searchParams.get('id');

    if (!targetGuid) {
      try {
        const body = await req.json();
        targetGuid = body.guid || body.videoId || body.id;
      } catch {}
    }

    if (!targetGuid) {
      return NextResponse.json({ success: false, error: 'guid or videoId is required' }, { status: 400 });
    }

    const result = await bunnyService.deleteVideo(targetGuid);
    return NextResponse.json({
      success: result.success,
      message: result.message,
      statusCode: result.statusCode,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (err: any) {
    console.error('API /api/bunny/videos DELETE error:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to delete video from Bunny.net'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
