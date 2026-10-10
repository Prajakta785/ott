import { NextRequest, NextResponse } from 'next/server';
import { 
  getServerGrievances, 
  saveServerGrievance, 
  deleteServerGrievance, 
  updateServerGrievanceStatus,
  saveServerNotification 
} from '@/lib/server-store';
import { 
  syncDocToFirestore, 
  deleteDocFromFirestore, 
  fetchDocsFromFirestore,
  recordDeletedContentInFirestore,
  getDeletedContentIds
} from '@/lib/firestore-admin-sync';
import { Grievance, NotificationItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET: Fetch all citizen grievances directly from Cloud Firestore / server store
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const deletedIds = await getDeletedContentIds();

    let remoteGrievances: Grievance[] = [];
    try {
      const raw = await fetchDocsFromFirestore('grievances');
      if (Array.isArray(raw) && raw.length > 0) {
        remoteGrievances = raw
          .filter((g: any) => g.id && (g.title || g.citizenName) && !deletedIds.includes(g.id))
          .map((g: any) => ({
            id: g.id,
            title: g.title || '',
            description: g.description || '',
            category: g.category || 'इतर प्रशासकीय समस्या',
            district: g.district || 'महाराष्ट्र',
            taluka: g.taluka || 'N/A',
            village: g.village || 'N/A',
            citizenName: g.citizenName || 'नागरिक',
            contactNumber: g.contactNumber || '',
            mediaUrl: g.mediaUrl || '',
            mediaType: g.mediaType || 'none',
            status: g.status || 'pending',
            adminNotes: g.adminNotes || '',
            submittedAt: g.submittedAt || g.createdAt || new Date().toISOString(),
            createdAt: g.createdAt || g.submittedAt || new Date().toISOString(),
          }));
      }
    } catch (err: any) {
      console.warn('Firestore fetchDocs grievances notice:', err?.message);
    }

    // Merge remote with server-store
    const local = getServerGrievances();
    const map = new Map<string, Grievance>();
    local.forEach(g => {
      if (!deletedIds.includes(g.id)) map.set(g.id, g);
    });
    remoteGrievances.forEach(g => {
      if (!deletedIds.includes(g.id)) map.set(g.id, g);
    });

    let items = Array.from(map.values()).sort((a, b) => {
      const tA = new Date(a.submittedAt || a.createdAt || '').getTime();
      const tB = new Date(b.submittedAt || b.createdAt || '').getTime();
      return tB - tA;
    });

    if (deletedIds && deletedIds.length > 0) {
      items = items.filter(g => !deletedIds.includes(g.id));
    }

    if (status && status !== 'all') {
      items = items.filter(g => g.status === status);
    }

    return NextResponse.json({
      success: true,
      count: items.length,
      data: items,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err: any) {
    console.error('GET /api/grievances error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch grievances' }, { status: 500 });
  }
}

// POST: Register a new grievance (from App, Web, or Admin) & dispatch Notification to Admin Bell
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.title || !body.citizenName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Title and citizen name are required' 
      }, { status: 400 });
    }

    const grvId = body.id || `grv_${Date.now()}`;
    const nowIso = body.submittedAt || body.createdAt || new Date().toISOString();

    const sanitizedGrievance: Grievance = {
      id: grvId,
      citizenName: String(body.citizenName).trim(),
      contactNumber: String(body.contactNumber || '').trim(),
      district: String(body.district || 'महाराष्ट्र').trim(),
      taluka: String(body.taluka || 'N/A').trim(),
      village: String(body.village || 'N/A').trim(),
      title: String(body.title).trim(),
      category: String(body.category || 'इतर प्रशासकीय समस्या').trim(),
      description: String(body.description || '').trim(),
      mediaUrl: body.mediaUrl ? String(body.mediaUrl).trim() : undefined,
      mediaType: body.mediaType || 'none',
      status: body.status || 'pending',
      adminNotes: body.adminNotes ? String(body.adminNotes).trim() : undefined,
      submittedAt: nowIso,
      createdAt: nowIso,
    };

    // 1. Save to server store
    saveServerGrievance(sanitizedGrievance);

    // 2. Sync directly to Cloud Firestore 'grievances' collection
    await syncDocToFirestore('grievances', grvId, sanitizedGrievance);

    // 3. Create Admin Notification in Header Bell
    const notifId = `notif_${Date.now()}`;
    const previewDesc = sanitizedGrievance.description.length > 100 
      ? sanitizedGrievance.description.slice(0, 100) + '...' 
      : sanitizedGrievance.description;
    const notifItem: NotificationItem = {
      id: notifId,
      title: `नवीन जनतेचा आवाज: ${sanitizedGrievance.title}`,
      message: `${sanitizedGrievance.citizenName} (${sanitizedGrievance.district}) यांनी जनतेचा आवाज तक्रार नोंदवली आहे: ${previewDesc}`,
      category: 'grievance',
      targetType: 'all',
      targetValue: '',
      deepLinkUrl: '/admin/grievances',
      sentAt: nowIso,
      sentBy: sanitizedGrievance.citizenName,
      status: 'sent',
      recipientsCount: 1,
    };

    // Save notification to server-store & Cloud Firestore
    saveServerNotification(notifItem);
    await syncDocToFirestore('notifications', notifId, notifItem);

    return NextResponse.json({
      success: true,
      message: 'Grievance registered and admin notification created successfully',
      grievance: sanitizedGrievance,
      notification: notifItem,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    console.error('POST /api/grievances error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to register grievance' }, { status: 500 });
  }
}

// PATCH: Update grievance status or notes
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, adminNotes } = body;
    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'ID and status are required' }, { status: 400 });
    }

    const updated = updateServerGrievanceStatus(id, status, adminNotes);
    await syncDocToFirestore('grievances', id, { status, ...(adminNotes ? { adminNotes } : {}) });

    return NextResponse.json({
      success: true,
      message: `Grievance ${id} status updated to ${status}`,
      grievance: updated,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    console.error('PATCH /api/grievances error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to update grievance' }, { status: 500 });
  }
}

// DELETE: Delete grievance from Firestore and server store
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Grievance ID is required' }, { status: 400 });
    }

    deleteServerGrievance(id);
    await deleteDocFromFirestore('grievances', id);
    await recordDeletedContentInFirestore(id, {
      id,
      type: 'grievance',
      deletedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Grievance ${id} deleted successfully`,
      deletedId: id,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    console.error('DELETE /api/grievances error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to delete grievance' }, { status: 500 });
  }
}
