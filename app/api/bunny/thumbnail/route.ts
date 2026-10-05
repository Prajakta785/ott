import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

export const dynamic = 'force-dynamic';

const httpsAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

const DEFAULT_CDN_HOST = 'vz-92cc7e0f-cd7.b-cdn.net';
const STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY || process.env.NEXT_PUBLIC_BUNNY_API_KEY || 'afb32a68-d916-4eac-83bb2d60a0df-3935-46e4';
const STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID || process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID || '767488';

const FALLBACK_NEWS_IMAGE = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800';

function fetchBinary(urlStr: string, headers: Record<string, string> = {}): Promise<{ status: number; buffer?: Buffer; contentType?: string }> {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(urlStr);
      const req = https.request(parsedUrl, {
        method: 'GET',
        agent: httpsAgent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...headers,
        },
      }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on('end', () => {
          resolve({
            status: res.statusCode || 200,
            buffer: Buffer.concat(chunks),
            contentType: res.headers['content-type'] || 'image/jpeg',
          });
        });
      });
      req.on('error', () => resolve({ status: 500 }));
      req.end();
    } catch {
      resolve({ status: 500 });
    }
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId') || searchParams.get('guid') || searchParams.get('id') || '';
    const rawUrl = searchParams.get('url') || '';

    // Extract GUID from videoId or rawUrl
    let guid = videoId.trim();
    if (!guid && rawUrl) {
      const match = rawUrl.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      if (match) {
        guid = match[1];
      }
    }

    if (!guid) {
      return NextResponse.redirect(FALLBACK_NEWS_IMAGE);
    }

    // Clean GUID
    const cleanGuid = guid.replace(/[^a-zA-Z0-9-]/g, '');

    // 1. Try fetching from primary CDN host with required Referer
    const primaryUrl = `https://${DEFAULT_CDN_HOST}/${cleanGuid}/thumbnail.jpg`;
    const res1 = await fetchBinary(primaryUrl, {
      Referer: 'https://iframe.mediadelivery.net/',
    });

    if (res1.status === 200 && res1.buffer && res1.buffer.length > 500) {
      return new NextResponse(new Uint8Array(res1.buffer), {
        status: 200,
        headers: {
          'Content-Type': res1.contentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 2. Try fetching video metadata from Bunny Stream API to get exact thumbnailUrl
    try {
      const metaRes = await new Promise<{ thumbnailUrl?: string }>((resolve) => {
        const req = https.request({
          hostname: 'video.bunnycdn.com',
          path: `/library/${STREAM_LIBRARY_ID}/videos/${cleanGuid}`,
          headers: {
            AccessKey: STREAM_API_KEY,
            Accept: 'application/json',
          },
          agent: httpsAgent,
        }, (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve({ thumbnailUrl: parsed.thumbnailUrl });
            } catch {
              resolve({});
            }
          });
        });
        req.on('error', () => resolve({}));
        req.end();
      });

      if (metaRes.thumbnailUrl) {
        const res2 = await fetchBinary(metaRes.thumbnailUrl, {
          Referer: 'https://iframe.mediadelivery.net/',
        });
        if (res2.status === 200 && res2.buffer && res2.buffer.length > 500) {
          return new NextResponse(new Uint8Array(res2.buffer), {
            status: 200,
            headers: {
              'Content-Type': res2.contentType || 'image/jpeg',
              'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      }
    } catch {}

    // Fallback: Redirect to placeholder
    return NextResponse.redirect(FALLBACK_NEWS_IMAGE);
  } catch (err) {
    console.error('Thumbnail proxy error:', err);
    return NextResponse.redirect(FALLBACK_NEWS_IMAGE);
  }
}
