import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { URL } from 'url';

export const dynamic = 'force-dynamic';

const httpsAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

function httpRequest(urlStr: string, options: https.RequestOptions = {}, body: any = null): Promise<{ status: number; data?: any; raw?: string }> {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const req = https.request(url, {
        ...options,
        agent: httpsAgent,
        headers: {
          ...(options.headers || {})
        }
      }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          try {
            resolve({ status: res.statusCode || 200, data: JSON.parse(raw), raw });
          } catch {
            resolve({ status: res.statusCode || 200, raw });
          }
        });
      });

      req.on('error', (err) => reject(err));

      if (body) {
        req.write(body);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

const STORAGE_HOSTNAME = process.env.BUNNY_STORAGE_HOSTNAME || 'storage.bunnycdn.com';
const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE_NAME || process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE || 'graminbharat';
const STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY || process.env.NEXT_PUBLIC_BUNNY_STORAGE_API_KEY || '2d3836f0-1ac0-4550-bc5638b69bd8-18c0-45d9';
const STORAGE_READONLY_KEY = process.env.BUNNY_STORAGE_READONLY_KEY || process.env.NEXT_PUBLIC_BUNNY_STORAGE_READONLY_KEY || '0dfda11e-aa10-45de-9869ff9c29df-e295-4589';

const STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID || process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID || '767488';
const STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY || process.env.NEXT_PUBLIC_BUNNY_API_KEY || 'afb32a68-d916-4eac-83bb2d60a0df-3935-46e4';
const CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME || 'vz-1192802e-f33.b-cdn.net';

export async function GET() {
  return NextResponse.json({
    streamLibraryId: STREAM_LIBRARY_ID,
    cdnHostname: CDN_HOSTNAME,
    storageZone: STORAGE_ZONE,
    storageHost: STORAGE_HOSTNAME,
    endpoint: `https://${STORAGE_HOSTNAME}/${STORAGE_ZONE}`,
    readOnlyKey: STORAGE_READONLY_KEY,
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Handle Multipart Form Data (File uploaded from web client)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const folder = (formData.get('folder') as string) || 'videos';

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const isVideo = file.type?.startsWith('video/') || cleanFileName.match(/\.(mp4|mkv|mov|avi|webm)$/i);
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      // 1. If it's a video, upload directly to Bunny Stream
      if (isVideo && STREAM_API_KEY && STREAM_LIBRARY_ID) {
        try {
          const videoTitle = cleanFileName.replace(/\.[^/.]+$/, '');
          const createRes = await httpRequest(`https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos`, {
            method: 'POST',
            headers: {
              AccessKey: STREAM_API_KEY,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            }
          }, JSON.stringify({ title: videoTitle }));

          if (createRes.status === 200 && createRes.data?.guid) {
            const guid = createRes.data.guid;

            const uploadStreamRes = await httpRequest(`https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos/${guid}`, {
              method: 'PUT',
              headers: {
                AccessKey: STREAM_API_KEY,
                'Content-Type': 'application/octet-stream',
                'Content-Length': fileBuffer.length,
              }
            }, fileBuffer);

            if (uploadStreamRes.status === 200) {
              const hlsUrl = `https://${CDN_HOSTNAME}/${guid}/playlist.m3u8`;
              const embedUrl = `https://iframe.mediadelivery.net/embed/${STREAM_LIBRARY_ID}/${guid}`;
              return NextResponse.json({
                success: true,
                videoId: guid,
                guid,
                url: hlsUrl,
                hlsUrl,
                embedUrl,
                directUrl: hlsUrl,
                fileName: cleanFileName,
                size: file.size,
                type: 'stream',
              }, {
                headers: {
                  'Access-Control-Allow-Origin': '*',
                }
              });
            }
          }
        } catch (streamErr) {
          console.warn('Bunny Stream upload error, attempting storage fallback:', streamErr);
        }
      }

      // 2. Storage zone upload (for audio, assets, or fallback)
      const storagePath = `${folder}/${Date.now()}-${cleanFileName}`;
      const uploadUrl = `https://${STORAGE_HOSTNAME}/${STORAGE_ZONE}/${storagePath}`;

      const storageRes = await httpRequest(uploadUrl, {
        method: 'PUT',
        headers: {
          AccessKey: STORAGE_API_KEY,
          'Content-Type': file.type || 'application/octet-stream',
          'Content-Length': fileBuffer.length,
        }
      }, fileBuffer);

      if (storageRes.status !== 200 && storageRes.status !== 201) {
        return NextResponse.json({
          error: `Bunny Storage upload error: ${storageRes.raw || 'Status ' + storageRes.status}`
        }, { status: storageRes.status });
      }

      return NextResponse.json({
        success: true,
        videoId: uploadUrl,
        url: uploadUrl,
        storagePath,
        fileName: cleanFileName,
        size: file.size,
        type: 'storage',
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // JSON metadata or title request
    const body = await req.json();
    const { action, title, fileName, folder = 'videos' } = body;

    // Handle Direct Bunny Stream Video Object Creation
    if (action === 'create_stream_video' || body.type === 'stream') {
      const videoTitle = title || fileName || `Video_${Date.now()}`;
      const createRes = await httpRequest(`https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos`, {
        method: 'POST',
        headers: {
          AccessKey: STREAM_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }
      }, JSON.stringify({ title: videoTitle }));

      if (createRes.status === 200 && createRes.data?.guid) {
        const guid = createRes.data.guid;
        const uploadUrl = `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos/${guid}`;
        const hlsUrl = `https://${CDN_HOSTNAME}/${guid}/playlist.m3u8`;
        const embedUrl = `https://iframe.mediadelivery.net/embed/${STREAM_LIBRARY_ID}/${guid}`;
        return NextResponse.json({
          success: true,
          guid,
          videoId: guid,
          uploadUrl,
          streamLibraryId: STREAM_LIBRARY_ID,
          accessKey: STREAM_API_KEY,
          hlsUrl,
          embedUrl,
          directUrl: hlsUrl,
        }, {
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        });
      } else {
        return NextResponse.json({
          error: `Bunny Stream video creation failed with status ${createRes.status}`,
          details: createRes.data || createRes.raw,
        }, { status: createRes.status || 500 });
      }
    }

    const actualName = fileName || (title ? `${title.replace(/[^a-zA-Z0-9.-]/g, '_')}.mp4` : `video_${Date.now()}.mp4`);
    const storagePath = `${folder}/${Date.now()}-${actualName}`;
    const directUploadUrl = `https://${STORAGE_HOSTNAME}/${STORAGE_ZONE}/${storagePath}`;

    return NextResponse.json({
      success: true,
      videoId: directUploadUrl,
      directUploadUrl,
      storagePath,
      storageZone: STORAGE_ZONE,
      accessKey: STORAGE_API_KEY,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error: any) {
    console.error('Error handling Bunny upload:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
