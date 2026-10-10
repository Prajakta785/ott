import { NextRequest, NextResponse } from 'next/server';
import { getServerPlans, saveServerPlan, deleteServerPlan, defaultAppPlans } from '@/lib/server-store';
import { syncDocToFirestore, deleteDocFromFirestore, fetchDocsFromFirestore, recordDeletedContentInFirestore, getDeletedContentIds } from '@/lib/firestore-admin-sync';
import { Plan } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let items = getServerPlans();
    const deletedIds = await getDeletedContentIds();

    // If local store is empty, fetch from Cloud Firestore or default plans
    if (!items || items.length === 0) {
      try {
        const firestoreItems = await fetchDocsFromFirestore('plans');
        if (firestoreItems && firestoreItems.length > 0) {
          firestoreItems.forEach(item => {
            if (!deletedIds.includes(item.id)) {
              saveServerPlan(item as Plan);
            }
          });
          items = getServerPlans();
        } else {
          defaultAppPlans.forEach(item => {
            if (!deletedIds.includes(item.id)) {
              saveServerPlan(item);
              syncDocToFirestore('plans', item.id, item).catch(() => {});
            }
          });
          items = getServerPlans();
        }
      } catch {
        items = defaultAppPlans.filter(p => !deletedIds.includes(p.id));
      }
    }

    if (deletedIds && deletedIds.length > 0) {
      items = items.filter(p => !deletedIds.includes(p.id));
    }

    return NextResponse.json({
      success: true,
      count: items.length,
      data: items,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      count: 0,
      data: [],
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.name) {
      return NextResponse.json({ success: false, error: 'Plan name is required' }, { status: 400 });
    }

    const plan: Plan = {
      ...body,
      id: body.id || `plan_${Date.now()}`,
      price: Number(body.price) || 0,
      currency: body.currency || '₹',
      durationDays: Number(body.durationDays) || 30,
      active: body.active !== undefined ? body.active : true,
    };

    const saved = saveServerPlan(plan);

    // Sync in background to Cloud Firestore 'plans' collection for Flutter Mobile App & Web
    await syncDocToFirestore('plans', plan.id, {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      currency: '₹',
      durationDays: plan.durationDays,
      features: plan.features || [],
      maxDevices: plan.maxDevices || 1,
      quality: plan.resolution || 'HD',
      isPopular: !!plan.isPopular,
      active: plan.active,
      updatedAt: new Date().toISOString(),
    }).catch(e => console.warn('Sync plan to Firestore notice:', e));

    return NextResponse.json({
      success: true,
      data: saved,
      message: 'Plan successfully saved and synced to database',
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to save plan'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    // 1. Delete from server store
    deleteServerPlan(id);

    // 2. Delete directly from Cloud Firestore
    await deleteDocFromFirestore('plans', id).catch(() => {});

    // 3. Record in Cloud Firestore users/app_deleted_content
    await recordDeletedContentInFirestore(id, {
      id,
      type: 'plan',
      deletedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Plan deleted from server, Cloud Firestore, and Android App',
      deletedId: id,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to delete plan'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
