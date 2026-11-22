import { NextRequest, NextResponse } from 'next/server';
import { syncDocToFirestore, deleteDocFromFirestore, fetchDocsFromFirestore, recordDeletedContentInFirestore, getDeletedContentIds } from '@/lib/firestore-admin-sync';
import { getServerNotifications, saveServerNotification, deleteServerNotification, getServerGrievances } from '@/lib/server-store';
import { NotificationItem } from '@/lib/types';
import { calculateNotificationExpiry, isNotificationExpired, ExpiryType } from '@/lib/notification-expiry';

export const dynamic = 'force-dynamic';

// Background async cleanup of expired notifications
async function cleanupExpiredNotifications(expiredList: NotificationItem[]) {
  for (const item of expiredList) {
    try {
      deleteServerNotification(item.id);
      await deleteDocFromFirestore('notifications', item.id);
      await recordDeletedContentInFirestore(item.id, {
        id: item.id,
        type: 'notification',
        deletedAt: new Date().toISOString(),
        reason: 'auto_expired_12pm',
      });
    } catch (e) {
      console.warn(`Failed to auto-delete expired notification ${item.id}:`, e);
    }
  }
}

// GET: Fetch all active broadcast notifications, auto-deleting any expired after 12 PM
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
          contentId: n.contentId || '',
          imageUrl: n.imageUrl || '',
          deepLinkUrl: n.deepLinkUrl || '',
          sentAt: n.sentAt || n.createdAt || new Date().toISOString(),
          createdAt: n.createdAt || n.sentAt || new Date().toISOString(),
          expiresAt: n.expiresAt || calculateNotificationExpiry(n.sentAt || n.createdAt, n.expiryType || '12pm'),
          expiryType: n.expiryType || '12pm',
          sentBy: n.sentBy || 'Super Admin',
          status: n.status || 'sent',
          recipientsCount: typeof n.recipientsCount === 'number' ? n.recipientsCount : 1,
          read: n.read === true,
          isUnread: n.isUnread !== false && n.read !== true,
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

    // Auto-sync Grievances from Citizen Grievances App to ensure they always generate an Admin Notification
    try {
      const serverGrievances = getServerGrievances();
      let firestoreGrievances: any[] = [];
      try {
        const rawG = await fetchDocsFromFirestore('grievances');
        if (Array.isArray(rawG)) firestoreGrievances = rawG;
      } catch (err: any) {
        console.warn('Grievances fetch for notifications notice:', err?.message);
      }

      const grvMap = new Map<string, any>();
      serverGrievances.forEach(g => { if (g.id && !deletedIds.includes(g.id)) grvMap.set(g.id, g); });
      firestoreGrievances.forEach(g => { if (g.id && !deletedIds.includes(g.id)) grvMap.set(g.id, g); });

      for (const [gId, g] of Array.from(grvMap.entries())) {
        const notifId = `notif_grv_${gId}`;
        // If not already deleted and not already in notifications map
        if (!deletedIds.includes(notifId) && !map.has(notifId) && !map.has(gId)) {
          const citizen = String(g.citizenName || g.userName || g.name || 'नागरिक').trim();
          const place = [g.village && g.village !== 'N/A' ? g.village : '', g.district && g.district !== 'N/A' ? g.district : ''].filter(Boolean).join(', ') || 'महाराष्ट्र';
          const titleText = String(g.title || g.problem || g.subject || 'जनतेचा आवाज तक्रार').trim();
          const problemText = String(g.description || g.problem || g.message || 'नवीन तक्रार नोंदवली आहे.').trim();
          const previewDesc = problemText.length > 110 ? problemText.slice(0, 110) + '...' : problemText;

          const grvNotif: NotificationItem = {
            id: notifId,
            title: `📢 नवीन जनतेचा आवाज: ${titleText}`,
            message: `${citizen} (${place}): ${previewDesc}`,
            category: 'grievance',
            targetType: 'all',
            targetValue: '',
            contentId: gId,
            deepLinkUrl: '/admin/grievances',
            sentAt: g.submittedAt || g.createdAt || new Date().toISOString(),
            createdAt: g.createdAt || g.submittedAt || new Date().toISOString(),
            expiryType: 'never',
            sentBy: citizen,
            status: 'sent',
            recipientsCount: 1,
            read: false,
            isUnread: true,
          };
          map.set(notifId, grvNotif);
          saveServerNotification(grvNotif);
          syncDocToFirestore('notifications', notifId, grvNotif).catch(() => {});
        }
      }
    } catch (e: any) {
      console.warn('Grievance notification auto-sync notice:', e?.message);
    }

    const allNotifs: NotificationItem[] = Array.from(map.values())
      .filter((n: any) => !n.id.startsWith('notif-demo') && !deletedIds.includes(n.id));

    // Separate active vs expired notifications
    const activeNotifs: NotificationItem[] = [];
    const expiredNotifs: NotificationItem[] = [];

    for (const item of allNotifs) {
      if (isNotificationExpired(item)) {
        expiredNotifs.push(item);
      } else {
        activeNotifs.push(item);
      }
    }

    // Trigger async deletion of expired notifications in the background
    if (expiredNotifs.length > 0) {
      cleanupExpiredNotifications(expiredNotifs).catch(() => {});
    }

    activeNotifs.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    return NextResponse.json({
      success: true,
      count: activeNotifs.length,
      data: activeNotifs,
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

// POST: Broadcast notification with auto-expiry calculation and sync to Cloud Firestore
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.title || !body.message) {
      return NextResponse.json({ success: false, error: 'Title and message are required' }, { status: 400 });
    }

    const notifId = body.id || `notif_${Date.now()}`;
    const sentAt = body.sentAt || new Date().toISOString();
    const createdAt = body.createdAt || sentAt;
    const expiryType: ExpiryType = body.expiryType || '12pm';
    const expiresAt = body.expiresAt || calculateNotificationExpiry(sentAt, expiryType);

    const sanitized: NotificationItem = {
      id: notifId,
      title: String(body.title).trim(),
      message: String(body.message).trim(),
      category: body.category || 'breaking_news',
      targetType: body.targetType || 'all',
      targetValue: body.targetValue ? String(body.targetValue).trim() : '',
      contentId: body.contentId ? String(body.contentId).trim() : '',
      imageUrl: body.imageUrl ? String(body.imageUrl).trim() : '',
      deepLinkUrl: body.deepLinkUrl ? String(body.deepLinkUrl).trim() : '',
      sentAt,
      createdAt,
      expiresAt,
      expiryType,
      sentBy: body.sentBy || 'Super Admin',
      status: 'sent',
      recipientsCount: typeof body.recipientsCount === 'number' ? body.recipientsCount : 1,
      read: false,
      isUnread: true,
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
