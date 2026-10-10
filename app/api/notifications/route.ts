import { NextRequest, NextResponse } from 'next/server';
import { syncDocToFirestore, deleteDocFromFirestore, fetchDocsFromFirestore, recordDeletedContentInFirestore, getDeletedContentIds } from '@/lib/firestore-admin-sync';
import { getServerNotifications, saveServerNotification, deleteServerNotification } from '@/lib/server-store';
import { NotificationItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET: Fetch all broadcast notifications directly from Cloud Firestore & server-store
export async function GET() {
  try {
    const deletedIds = await getDeletedContentIds();
    let remoteNotifs: NotificationItem[] = [];
    try {
      const rawNotifs = await fetchDocsFromFirestore('notifications');
      remoteNotifs = (rawNotifs || [])
        .filter((n: any) => n.id && n.title && !deletedIds.includes(n.id))
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
        }));
    } catch (e) {
      console.warn('Firestore fetchDocs notifications notice:', e);
    }

    const localNotifs = getServerNotifications();
    const map = new Map<string, NotificationItem>();
    localNotifs.forEach(n => {
      if (!deletedIds.includes(n.id)) map.set(n.id, n);
    });
    remoteNotifs.forEach(n => {
      if (!deletedIds.includes(n.id)) map.set(n.id, n);
    });

    const notifs: NotificationItem[] = Array.from(map.values())
      .filter((n: any) => !n.id.startsWith('notif-demo') && !deletedIds.includes(n.id))
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

    // 1. Save to local server store
    saveServerNotification(sanitized);

    // 2. Save directly to Cloud Firestore 'notifications' collection via Admin REST
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

    deleteServerNotification(id);
    await deleteDocFromFirestore('notifications', id);
    await recordDeletedContentInFirestore(id, {
      id,
      type: 'notification',
      deletedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Notification ${id} deleted successfully`,
      deletedId: id,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to delete notification' }, { status: 500 });
  }
}
