import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const STORAGE_HOSTNAME = process.env.BUNNY_STORAGE_HOSTNAME || 'storage.bunnycdn.com';
const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE_NAME || process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE || 'graminbharat';
const STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY || process.env.NEXT_PUBLIC_BUNNY_STORAGE_API_KEY || '2d3836f0-1ac0-4550-bc5638b69bd8-18c0-45d9';
const STORAGE_READONLY_KEY = process.env.BUNNY_STORAGE_READONLY_KEY || process.env.NEXT_PUBLIC_BUNNY_STORAGE_READONLY_KEY || '0dfda11e-aa10-45de-9869ff9c29df-e295-4589';

export async function GET(req: NextRequest) {
  const results = {
    storageZone: STORAGE_ZONE,
    storageHost: STORAGE_HOSTNAME,
    storageWriteStatus: 'failed',
    storageReadStatus: 'failed',
    message: '',
  };

  try {
    // 1. Test Read with AccessKey
    const readRes = await fetch(`https://${STORAGE_HOSTNAME}/${STORAGE_ZONE}/`, {
      method: 'GET',
      headers: {
        AccessKey: STORAGE_API_KEY,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (readRes.ok) {
      results.storageWriteStatus = 'success';
      const files = await readRes.json();
      results.message = `Successfully connected to Bunny Storage Zone "${STORAGE_ZONE}". Found ${Array.isArray(files) ? files.length : 0} objects.`;
    } else {
      results.message = `Storage test failed with status ${readRes.status}: ${readRes.statusText}`;
    }

    // 2. Test Read-only Key
    const roRes = await fetch(`https://${STORAGE_HOSTNAME}/${STORAGE_ZONE}/`, {
      method: 'GET',
      headers: {
        AccessKey: STORAGE_READONLY_KEY,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (roRes.ok) {
      results.storageReadStatus = 'success';
    }
  } catch (err: any) {
    results.message = `Network error contacting Bunny Storage: ${err?.message}`;
  }

  return NextResponse.json({
    success: results.storageWriteStatus === 'success',
    ...results,
  });
}
