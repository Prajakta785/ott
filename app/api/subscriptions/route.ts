import { NextRequest, NextResponse } from 'next/server';
import { syncDocToFirestore, fetchDocsFromFirestore } from '@/lib/firestore-admin-sync';
import { Subscription } from '@/lib/types';

export const dynamic = 'force-dynamic';

function cleanTenDigitPhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch all raw subscriptions from Cloud Firestore
    const rawSubs = await fetchDocsFromFirestore('subscriptions');
    
    // Filter out dummy/catalog docs like 'plans_catalog'
    const validSubs: Subscription[] = [];
    const knownPhones = new Set<string>();
    const knownUserIds = new Set<string>();

    for (const doc of rawSubs) {
      if (!doc || doc.id === 'plans_catalog' || (!doc.userId && !doc.userPhone && !doc.userName)) {
        continue;
      }

      const tenDigit = cleanTenDigitPhone(doc.userPhone || doc.phone || '');
      const formattedPhone = tenDigit ? `+91 ${tenDigit}` : (doc.userPhone || doc.phone || '');
      const startDate = doc.startDate || doc.createdAt || new Date().toISOString();
      const endDate = doc.endDate || doc.planExpiry || doc.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const isExpired = new Date(endDate).getTime() <= Date.now();
      
      const paymentId = doc.paymentId || doc.transactionId || '';
      const isRazorpay = paymentId.startsWith('pay_') || doc.paymentProvider === 'razorpay';
      const provider: 'razorpay' | 'stripe' | 'manual' = isRazorpay ? 'razorpay' : 'manual';
      const txnId = paymentId || `TXN_${(doc.id || '').replace(/\D/g, '').slice(-8) || Date.now().toString(36)}`;

      const sub: Subscription = {
        id: doc.id,
        userId: doc.userId || (tenDigit ? `user_${tenDigit}` : doc.id),
        userName: doc.userName || doc.name || (tenDigit ? `User ${tenDigit}` : 'Subscriber'),
        userPhone: formattedPhone,
        planId: doc.planId || 'plan_premium_2',
        planName: doc.planName || 'प्रीमियम प्लॅन (Premium Plan)',
        amount: Number(doc.amount || doc.price || 2),
        currency: doc.currency || '₹',
        startDate: startDate,
        endDate: endDate,
        status: isExpired ? 'expired' : (doc.status === 'expired' ? 'expired' : 'active'),
        paymentProvider: provider,
        transactionId: txnId,
      };

      validSubs.push(sub);
      if (tenDigit) knownPhones.add(tenDigit);
      if (sub.userId) knownUserIds.add(sub.userId);
    }

    // 2. Fetch users collection to catch active subscribers (e.g. granted by Admin or enrolled in App)
    try {
      const rawUsers = await fetchDocsFromFirestore('users');
      for (const u of rawUsers) {
        if (!u || u.id === 'app_plans_config' || u.id === 'app_deleted_content') continue;

        const tenDigit = cleanTenDigitPhone(u.phone || u.id || '');
        const isSubActive = u.subscriptionStatus === 'active' || u.isSubscribed === true;
        
        // If user has an active or expired VIP subscription not yet listed in subscriptions collection
        if (isSubActive || u.planExpiry) {
          const endDate = u.planExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
          const isExpired = new Date(endDate).getTime() <= Date.now();
          
          // Check if this user is already in validSubs
          const alreadyExists = (tenDigit && knownPhones.has(tenDigit)) || knownUserIds.has(u.id);
          
          if (!alreadyExists && (!isExpired || isSubActive)) {
            const subId = `sub_${tenDigit || u.id}`;
            const startDate = u.subscriptionStartDate || u.updatedAt || u.createdAt || new Date().toISOString();
            const formattedPhone = tenDigit ? `+91 ${tenDigit}` : (u.phone || '');
            const txnId = u.lastPaymentId || `ADM_${(tenDigit || u.id).slice(-6)}_${new Date().getFullYear()}`;
            const isRzp = (u.lastPaymentId && u.lastPaymentId.startsWith('pay_'));

            const syntheticSub: Subscription = {
              id: subId,
              userId: u.id || `user_${tenDigit}`,
              userName: u.name || (tenDigit ? `User ${tenDigit}` : 'VIP Subscriber'),
              userPhone: formattedPhone,
              planId: u.planId || 'plan_premium_2',
              planName: u.planName || 'प्रीमियम वार्षिक प्लॅन (Premium Annual Pass)',
              amount: Number(u.amount || 2),
              currency: '₹',
              startDate: startDate,
              endDate: endDate,
              status: isExpired ? 'expired' : 'active',
              paymentProvider: isRzp ? 'razorpay' : 'manual',
              transactionId: txnId,
            };

            validSubs.push(syntheticSub);
            if (tenDigit) knownPhones.add(tenDigit);
            if (u.id) knownUserIds.add(u.id);

            // Persist into Firestore subscriptions collection in background for full permanence
            syncDocToFirestore('subscriptions', subId, {
              ...syntheticSub,
              paymentId: txnId,
              createdAt: startDate,
              updatedAt: new Date().toISOString(),
            }).catch(() => {});
          }
        }
      }
    } catch (uErr) {
      console.warn('Subscriptions route user reconciliation notice:', uErr);
    }

    // Sort: newest start date first
    validSubs.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return NextResponse.json({
      success: true,
      count: validSubs.length,
      data: validSubs,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (err: any) {
    console.error('Error fetching subscriptions:', err);
    return NextResponse.json({
      success: false,
      count: 0,
      data: [],
      error: err?.message,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      userId,
      userName,
      userPhone,
      planId,
      planName,
      amount,
      currency = '₹',
      startDate = new Date().toISOString(),
      endDate,
      status = 'active',
      paymentProvider = 'manual',
      transactionId,
    } = body;

    const tenDigit = cleanTenDigitPhone(userPhone || userId || '');
    const cleanId = id || `sub_${tenDigit || Date.now()}`;
    const cleanTxnId = transactionId || (paymentProvider === 'razorpay' ? `pay_rzp_${Date.now()}` : `ADM_${Date.now()}`);

    const subDoc: Subscription = {
      id: cleanId,
      userId: userId || (tenDigit ? `user_${tenDigit}` : cleanId),
      userName: userName || (tenDigit ? `User ${tenDigit}` : 'Subscriber'),
      userPhone: tenDigit ? `+91 ${tenDigit}` : userPhone,
      planId: planId || 'plan_premium_2',
      planName: planName || 'प्रीमियम वार्षिक प्लॅन (Premium Annual Plan)',
      amount: Number(amount) || 2,
      currency,
      startDate,
      endDate: endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status,
      paymentProvider: paymentProvider === 'razorpay' ? 'razorpay' : 'manual',
      transactionId: cleanTxnId,
    };

    // 1. Sync subscription document to Cloud Firestore 'subscriptions'
    await syncDocToFirestore('subscriptions', cleanId, {
      ...subDoc,
      paymentId: cleanTxnId,
      createdAt: startDate,
      updatedAt: new Date().toISOString(),
    });

    // 2. Also keep user document in 'users' collection updated
    const targetUserId = subDoc.userId.startsWith('user_') ? subDoc.userId : `user_${tenDigit || subDoc.userId}`;
    await syncDocToFirestore('users', targetUserId, {
      id: targetUserId,
      phone: subDoc.userPhone,
      name: subDoc.userName,
      subscriptionStatus: status,
      isSubscribed: status === 'active',
      planId: subDoc.planId,
      planName: subDoc.planName,
      planExpiry: subDoc.endDate,
      lastPaymentId: cleanTxnId,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: subDoc,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err: any) {
    console.error('Error saving subscription:', err);
    return NextResponse.json({
      success: false,
      error: err?.message,
    });
  }
}
