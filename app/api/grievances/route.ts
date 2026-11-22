import { NextRequest, NextResponse } from 'next/server';
import { 
  getServerGrievances, 
  saveServerGrievance, 
  deleteServerGrievance, 
  updateServerGrievanceStatus,
  saveServerNotification,
  writeServerStore 
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
          .filter((g: any) => g.id && (g.title || g.citizenName || g.name || g.userName || g.problem) && !deletedIds.includes(g.id))
          .map((g: any) => {
            let rawMediaUrl = g.mediaUrl || g.videoUrl || g.imageUrl || 
              (Array.isArray(g.videos) && g.videos.length > 0 ? (typeof g.videos[0] === 'string' ? g.videos[0] : g.videos[0]?.url) : '') ||
              (Array.isArray(g.images) && g.images.length > 0 ? (typeof g.images[0] === 'string' ? g.images[0] : g.images[0]?.url) : '') ||
              (Array.isArray(g.mediaUrls) && g.mediaUrls.length > 0 ? (typeof g.mediaUrls[0] === 'string' ? g.mediaUrls[0] : g.mediaUrls[0]?.url) : '') || '';

            // Normalize mobile app local paths (media://1000899124.mp4) to public uploads url
            if (rawMediaUrl.startsWith('media://')) {
              const fname = rawMediaUrl.replace('media://', '');
              rawMediaUrl = `/uploads/videos/${fname}`;
            } else if (rawMediaUrl && !rawMediaUrl.startsWith('http') && !rawMediaUrl.startsWith('/') && rawMediaUrl.endsWith('.mp4')) {
              rawMediaUrl = `/uploads/videos/${rawMediaUrl}`;
            }

            const isVideo = g.mediaType === 'video' || 
              Boolean(g.videoUrl) || 
              (Array.isArray(g.videos) && g.videos.length > 0) || 
              /\.(mp4|mov|webm|mkv|m4v|avi)(\?.*)?$/i.test(rawMediaUrl) || 
              rawMediaUrl.startsWith('media://') ||
              rawMediaUrl.includes('.mp4');

            const isImage = !isVideo && (
              g.mediaType === 'image' || 
              Boolean(g.imageUrl) || 
              (Array.isArray(g.images) && g.images.length > 0) || 
              /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(rawMediaUrl)
            );

            return {
              id: g.id,
              title: g.title || (g.problem ? `[${g.category || 'तक्रार'}] ${g.village || ''}, ${g.taluka || ''}`.trim() : 'जनतेचा आवाज'),
              description: g.description || g.problem || '',
              category: g.category || 'इतर प्रशासकीय समस्या',
              district: g.district || 'महाराष्ट्र',
              taluka: g.taluka || 'N/A',
              village: g.village || g.panchayat || g.gramPanchayat || 'N/A',
              citizenName: g.citizenName || g.userName || g.name || 'नागरिक',
              contactNumber: g.contactNumber || g.mobile || g.phone || g.phoneNumber || g.contact || '',
              mediaUrl: rawMediaUrl,
              mediaType: isVideo ? 'video' : (isImage ? 'image' : (g.mediaType || 'none')),
              status: g.status || (g.isApproved ? 'verified' : 'pending'),
              adminNotes: g.adminNotes || '',
              submittedAt: g.submittedAt || g.createdAt || g.timestamp || new Date().toISOString(),
              createdAt: g.createdAt || g.submittedAt || g.timestamp || new Date().toISOString(),
            };
          });
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

    if (items.length > 0 && (!status || status === 'all')) {
      try {
        writeServerStore({ grievances: items });
      } catch {}
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
    if (!body) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request body is required' 
      }, { status: 400 });
    }

    // Flexible extraction to accommodate Citizen Grievance Mobile App payloads
    const citizenName = String(
      body.citizenName || body.userName || body.name || body.fullName || body.senderName || body.sender || 'नागरिक'
    ).trim();

    const descText = String(
      body.description || body.problem || body.message || body.issue || body.complaint || ''
    ).trim();

    const titleText = String(
      body.title || body.subject || body.grievanceTitle || (descText ? (descText.length > 50 ? descText.slice(0, 50) + '...' : descText) : 'नवीन जनतेचा आवाज तक्रार')
    ).trim();

    const contactNumber = String(
      body.contactNumber || body.mobile || body.phone || body.phoneNumber || body.contact || ''
    ).trim();

    const district = String(body.district || 'महाराष्ट्र').trim();
    const taluka = String(body.taluka || 'N/A').trim();
    const village = String(body.village || body.panchayat || body.gramPanchayat || 'N/A').trim();

    const grvId = body.id || `grv_${Date.now()}`;
    const nowIso = body.submittedAt || body.createdAt || new Date().toISOString();

    const sanitizedGrievance: Grievance = {
      id: grvId,
      citizenName,
      contactNumber,
      district,
      taluka,
      village,
      title: titleText,
      category: String(body.category || 'इतर प्रशासकीय समस्या').trim(),
      description: descText || titleText,
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
    const notifId = `notif_grv_${grvId}`;
    const previewDesc = sanitizedGrievance.description.length > 100 
      ? sanitizedGrievance.description.slice(0, 100) + '...' 
      : sanitizedGrievance.description;
    const locationInfo = [sanitizedGrievance.village !== 'N/A' ? sanitizedGrievance.village : '', sanitizedGrievance.district].filter(Boolean).join(', ') || 'महाराष्ट्र';
    
    const notifItem: NotificationItem = {
      id: notifId,
      title: `📢 नवीन जनतेचा आवाज: ${sanitizedGrievance.title}`,
      message: `${sanitizedGrievance.citizenName} (${locationInfo}) यांनी जनतेचा आवाज तक्रार नोंदवली आहे: ${previewDesc}`,
      category: 'grievance',
      targetType: 'all',
      targetValue: '',
      contentId: grvId,
      deepLinkUrl: '/admin/grievances',
      sentAt: nowIso,
      createdAt: nowIso,
      expiryType: 'never',
      sentBy: sanitizedGrievance.citizenName,
      status: 'sent',
      recipientsCount: 1,
      isUnread: true,
      read: false,
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
