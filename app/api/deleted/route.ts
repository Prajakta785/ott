import { NextRequest, NextResponse } from 'next/server';
import { getDeletedContentIds, recordDeletedContentInFirestore } from '@/lib/firestore-admin-sync';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const deletedIds = await getDeletedContentIds();
    return NextResponse.json({
      success: true,
      count: deletedIds.length,
      data: deletedIds,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch deleted IDs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id;
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await recordDeletedContentInFirestore(id, body.metadata || {});

    return NextResponse.json({
      success: true,
      message: `ID ${id} successfully recorded in deleted list`,
      deletedId: id,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to record deleted ID' }, { status: 500 });
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
