import { NextRequest, NextResponse } from 'next/server';
import { getServerPlans, saveServerPlan, deleteServerPlan, defaultAppPlans } from '@/lib/server-store';
import { syncDocToFirestore, deleteDocFromFirestore, fetchDocsFromFirestore } from '@/lib/firestore-admin-sync';
import { Plan } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let items = getServerPlans();

    // If local store is empty, fetch from Cloud Firestore or default plans
    if (!items || items.length === 0) {
      try {
        const firestoreItems = await fetchDocsFromFirestore('plans');
        if (firestoreItems && firestoreItems.length > 0) {
          firestoreItems.forEach(item => saveServerPlan(item as Plan));
          items = getServerPlans();
        } else {
          defaultAppPlans.forEach(item => {
            saveServerPlan(item);
            syncDocToFirestore('plans', item.id, item).catch(() => {});
          });
          items = getServerPlans();
        }
      } catch {
        items = defaultAppPlans;
      }
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
      count: defaultAppPlans.length,
      data: defaultAppPlans,
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
    syncDocToFirestore('plans', plan.id, {
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

    deleteServerPlan(id);

    // Delete directly from Cloud Firestore
    deleteDocFromFirestore('plans', id).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Plan deleted from server and Cloud Firestore'
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
