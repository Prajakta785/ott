import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { URL } from 'url';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

const httpsAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

const STORAGE_HOSTNAME = process.env.BUNNY_STORAGE_HOSTNAME || 'storage.bunnycdn.com';
const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE_NAME || process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE || 'graminbharat';
const STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY || process.env.NEXT_PUBLIC_BUNNY_STORAGE_API_KEY || '2d3836f0-1ac0-4550-bc5638b69bd8-18c0-45d9';

function extractStoragePath(input: string): string {
  let p = input.trim();
  p = p.replace(/^https?:\/\/[^/]+\//, '');
  if (p.startsWith(`${STORAGE_ZONE}/`)) {
    p = p.slice(STORAGE_ZONE.length + 1);
  }
  if (p.startsWith('/')) {
    p = p.slice(1);
  }
  return p;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPath = searchParams.get('path') || searchParams.get('url') || '';

    if (!rawPath) {
      return NextResponse.json({ error: 'Missing path or url query parameter' }, { status: 400 });
    }

    const cleanPath = extractStoragePath(rawPath);
    const targetUrl = new URL(`https://${STORAGE_HOSTNAME}/${STORAGE_ZONE}/${cleanPath}`);

    const reqHeaders: Record<string, string> = {
      AccessKey: STORAGE_API_KEY,
    };

    const clientRange = req.headers.get('range');
    if (clientRange) {
      reqHeaders['Range'] = clientRange;
    }

    return new Promise<NextResponse>((resolve, reject) => {
      const bunnyReq = https.request(targetUrl, {
        method: 'GET',
        agent: httpsAgent,
        headers: reqHeaders,
      }, (bunnyRes) => {
        const status = bunnyRes.statusCode || 200;

        if (status >= 400) {
          resolve(NextResponse.json({ error: `Bunny Storage returned status ${status}` }, { status }));
          return;
        }

        const responseHeaders = new Headers();
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Accept-Ranges', 'bytes');
        responseHeaders.set('Cache-Control', 'public, max-age=3600');

        const ct = bunnyRes.headers['content-type'] || (cleanPath.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream');
        responseHeaders.set('Content-Type', Array.isArray(ct) ? ct[0] : ct);

        if (bunnyRes.headers['content-length']) {
          responseHeaders.set('Content-Length', String(bunnyRes.headers['content-length']));
        }
        if (bunnyRes.headers['content-range']) {
          responseHeaders.set('Content-Range', String(bunnyRes.headers['content-range']));
        }

        // Convert Node IncomingMessage stream to Web ReadableStream
        const webStream = Readable.toWeb(bunnyRes);

        resolve(new NextResponse(webStream as any, {
          status,
          headers: responseHeaders,
        }));
      });

      bunnyReq.on('error', (err) => {
        console.error('Bunny stream request error:', err);
        resolve(NextResponse.json({ error: err.message || 'Streaming failed' }, { status: 500 }));
      });

      bunnyReq.end();
    });
  } catch (error: any) {
    console.error('Error in Bunny stream proxy:', error);
    return NextResponse.json({ error: error.message || 'Streaming failed' }, { status: 500 });
  }
}

export async function HEAD(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPath = searchParams.get('path') || searchParams.get('url') || '';

    if (!rawPath) {
      return new NextResponse(null, { status: 400 });
    }

    const cleanPath = extractStoragePath(rawPath);
    const targetUrl = new URL(`https://${STORAGE_HOSTNAME}/${STORAGE_ZONE}/${cleanPath}`);

    return new Promise<NextResponse>((resolve) => {
      const bunnyReq = https.request(targetUrl, {
        method: 'HEAD',
        agent: httpsAgent,
        headers: { AccessKey: STORAGE_API_KEY },
      }, (bunnyRes) => {
        const responseHeaders = new Headers();
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Accept-Ranges', 'bytes');
        const ct = bunnyRes.headers['content-type'] || 'application/octet-stream';
        responseHeaders.set('Content-Type', Array.isArray(ct) ? ct[0] : ct);
        if (bunnyRes.headers['content-length']) {
          responseHeaders.set('Content-Length', String(bunnyRes.headers['content-length']));
        }
        resolve(new NextResponse(null, {
          status: bunnyRes.statusCode || 200,
          headers: responseHeaders,
        }));
      });

      bunnyReq.on('error', () => {
        resolve(new NextResponse(null, { status: 500 }));
      });

      bunnyReq.end();
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    },
  });
}
