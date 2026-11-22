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

    const price = Number(body.price) || 0;
    let targetId = body.id || `plan_${Date.now()}`;
    if (targetId.startsWith('plan_premium_') || targetId === 'plan_premium_399') {
      targetId = `plan_premium_${price}`;
    }

    const oldId = body.oldId || (body.id && body.id !== targetId ? body.id : null);
    if (oldId && oldId !== targetId) {
      deleteServerPlan(oldId);
      await deleteDocFromFirestore('plans', oldId).catch(() => {});
    }

    // Also proactively clean up legacy plan_premium_399 if targetId is different
    if (targetId !== 'plan_premium_399') {
      deleteServerPlan('plan_premium_399');
      await deleteDocFromFirestore('plans', 'plan_premium_399').catch(() => {});
    }

    const plan: Plan = {
      ...body,
      id: targetId,
      slug: body.slug || `premium-annual-plan-${price}`,
      price: price,
      currency: body.currency || '₹',
      durationDays: Number(body.durationDays) || 30,
      active: body.active !== undefined ? body.active : true,
    };

    const saved = saveServerPlan(plan);

    const planPayload = {
      id: plan.id,
      name: plan.name,
      slug: plan.slug || plan.name.toLowerCase().replace(/\s+/g, '-'),
      price: plan.price,
      currency: '₹',
      durationDays: plan.durationDays,
      billingCycle: plan.billingCycle || (plan.durationDays >= 365 ? 'yearly' : (plan.durationDays >= 90 ? 'quarterly' : 'monthly')),
      features: plan.features || [],
      maxDevices: plan.maxDevices || 1,
      quality: plan.resolution || '1080p Full HD',
      resolution: plan.resolution || '1080p Full HD',
      isPopular: !!plan.isPopular,
      active: plan.active,
      updatedAt: new Date().toISOString(),
    };

    // 1. Sync directly to Cloud Firestore 'plans' collection
    await syncDocToFirestore('plans', plan.id, planPayload).catch(e => console.warn('Sync plan to Firestore notice:', e));

    // 2. ALSO update 'users/app_plans_config' so Flutter Mobile App gets real-time price updates immediately!
    const allServerPlans = getServerPlans();
    const plansListForApp = (allServerPlans && allServerPlans.length > 0 ? allServerPlans : [plan]).map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug || p.name.toLowerCase().replace(/\s+/g, '-'),
      price: Number(p.price) || 0,
      currency: '₹',
      durationDays: Number(p.durationDays) || 30,
      billingCycle: p.billingCycle || (p.durationDays >= 365 ? 'yearly' : 'monthly'),
      resolution: p.resolution || '1080p Full HD',
      quality: p.resolution || '1080p Full HD',
      maxDevices: Number(p.maxDevices) || 2,
      isPopular: !!p.isPopular,
      active: p.active !== false,
      features: Array.isArray(p.features) ? p.features : [],
    }));

    await syncDocToFirestore('users', 'app_plans_config', {
      plans: plansListForApp,
      updatedAt: new Date().toISOString(),
    }).catch(e => console.warn('Sync app_plans_config notice:', e));

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

    // 4. Update 'users/app_plans_config' so mobile app removes deleted plan
    const remainingPlans = getServerPlans().filter(p => p.id !== id);
    await syncDocToFirestore('users', 'app_plans_config', {
      plans: remainingPlans,
      updatedAt: new Date().toISOString(),
    }).catch(() => {});

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
