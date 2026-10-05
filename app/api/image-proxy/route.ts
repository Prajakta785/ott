import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import http from 'http';

export const dynamic = 'force-dynamic';

const httpsAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });
const httpAgent = new http.Agent({ keepAlive: true });

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUrl = searchParams.get('url') || '';

    if (!rawUrl || !rawUrl.startsWith('http')) {
      return NextResponse.redirect(FALLBACK_IMAGE);
    }

    // If it's a Bunny CDN URL, forward through thumbnail proxy if it contains thumbnail or video GUID
    if (rawUrl.includes('b-cdn.net')) {
      const guidMatch = rawUrl.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      if (guidMatch) {
        return NextResponse.redirect(new URL(`/api/bunny/thumbnail?videoId=${guidMatch[1]}`, req.url));
      }
    }

    // Direct proxy with referrer
    return new Promise<NextResponse>((resolve) => {
      try {
        const parsed = new URL(rawUrl);
        const isHttps = parsed.protocol === 'https:';
        const client = isHttps ? https : http;
        const agent = isHttps ? httpsAgent : httpAgent;

        const proxyReq = client.request(parsed, {
          method: 'GET',
          agent,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': rawUrl.includes('b-cdn.net') ? 'https://iframe.mediadelivery.net/' : parsed.origin,
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          },
        }, (res) => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            const chunks: Buffer[] = [];
            res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
            res.on('end', () => {
              const buffer = Buffer.concat(chunks);
              resolve(new NextResponse(new Uint8Array(buffer), {
                status: 200,
                headers: {
                  'Content-Type': res.headers['content-type'] || 'image/jpeg',
                  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
                  'Access-Control-Allow-Origin': '*',
                },
              }));
            });
          } else {
            resolve(NextResponse.redirect(FALLBACK_IMAGE));
          }
        });

        proxyReq.on('error', () => {
          resolve(NextResponse.redirect(FALLBACK_IMAGE));
        });
        proxyReq.end();
      } catch {
        resolve(NextResponse.redirect(FALLBACK_IMAGE));
      }
    });
  } catch {
    return NextResponse.redirect(FALLBACK_IMAGE);
  }
}
