import { NextRequest, NextResponse } from 'next/server';
import { syncDocToFirestore, deleteDocFromFirestore, fetchDocsFromFirestore } from '@/lib/firestore-admin-sync';
import { NotificationItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET: Fetch all broadcast notifications directly from Cloud Firestore
export async function GET() {
  try {
    const rawNotifs = await fetchDocsFromFirestore('notifications');
    const notifs: NotificationItem[] = (rawNotifs || [])
      .filter((n: any) => n.id && n.title)
      .map((n: any) => ({
        id: n.id,
        title: n.title || '',
        message: n.message || '',
        category: n.category || 'breaking_news',
        targetType: n.targetType || 'all',
        targetValue: n.targetValue || '',
        deepLinkUrl: n.deepLinkUrl || '',
        sentAt: n.sentAt || new Date().toISOString(),
        sentBy: n.sentBy || 'Super Admin',
        status: n.status || 'sent',
        recipientsCount: typeof n.recipientsCount === 'number' ? n.recipientsCount : 1,
      }))
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    return NextResponse.json({
      success: true,
      count: notifs.length,
      data: notifs,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err: any) {
    console.warn('GET /api/notifications error:', err?.message);
    return NextResponse.json({ success: true, count: 0, data: [] });
  }
}

// POST: Broadcast notification and sync to Cloud Firestore
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.title || !body.message) {
      return NextResponse.json({ success: false, error: 'Title and message are required' }, { status: 400 });
    }

    const notifId = body.id || `notif_${Date.now()}`;
    const sanitized: NotificationItem = {
      id: notifId,
      title: String(body.title).trim(),
      message: String(body.message).trim(),
      category: body.category || 'breaking_news',
      targetType: body.targetType || 'all',
      targetValue: body.targetValue ? String(body.targetValue).trim() : '',
      deepLinkUrl: body.deepLinkUrl ? String(body.deepLinkUrl).trim() : '',
      sentAt: body.sentAt || new Date().toISOString(),
      sentBy: body.sentBy || 'Super Admin',
      status: 'sent',
      recipientsCount: typeof body.recipientsCount === 'number' ? body.recipientsCount : 1,
    };

    // Save directly to Cloud Firestore 'notifications' collection via Admin REST
    const synced = await syncDocToFirestore('notifications', notifId, sanitized);

    return NextResponse.json({
      success: true,
      message: synced ? 'Notification broadcast and synced to Cloud Firestore' : 'Notification saved locally',
      notification: sanitized,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    console.error('POST /api/notifications error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to send notification' }, { status: 500 });
  }
}

// DELETE: Delete notification from Cloud Firestore
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Notification ID is required' }, { status: 400 });
    }

    await deleteDocFromFirestore('notifications', id);
    return NextResponse.json({
      success: true,
      message: `Notification ${id} deleted successfully`,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to delete notification' }, { status: 500 });
  }
}
