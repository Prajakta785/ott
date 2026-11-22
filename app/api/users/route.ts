import { NextRequest, NextResponse } from 'next/server';
import { syncDocToFirestore, deleteDocFromFirestore, fetchDocsFromFirestore } from '@/lib/firestore-admin-sync';
import { User } from '@/lib/types';

export const dynamic = 'force-dynamic';

function normalizeFirestoreUser(doc: any): User | null {
  if (!doc) return null;
  // Exclude only dummy mock templates
  const idStr = String(doc.id || '');
  if (idStr.startsWith('app_') || idStr.startsWith('perm_') || idStr.startsWith('user_admin') || doc.id === 'usr-003' || doc.name === 'Liam Gallagher' || String(doc.phone || '').includes('7700 900123')) {
    return null;
  }

  // Extract phone number from any potential field (phone, mobile, phoneNumber, number, contact) or from doc ID
  let rawPhone = String(doc.phone || doc.mobile || doc.phoneNumber || doc.number || doc.contact || '').trim();
  if (!rawPhone && doc.id) {
    const match = String(doc.id).match(/\d{10}/);
    if (match) rawPhone = match[0];
  }
  const digits = rawPhone.replace(/\D/g, '');
  const tenDigit = digits.length >= 10 ? digits.slice(-10) : digits;
  const formattedPhone = tenDigit ? `+91 ${tenDigit}` : (rawPhone || '—');

  // Extract name or fallback to "User <tenDigit>" or "User"
  const rawName = String(doc.name || doc.displayName || doc.fullName || '').trim();
  const name = rawName || (tenDigit ? `User ${tenDigit}` : `User ${doc.id || ''}`);

  // Determine session liveness & logout state
  const lastLoginTime = doc.lastLogin || (Array.isArray(doc.devices) && doc.devices.length > 0 ? doc.devices[0].lastLogin : null) || doc.loginTime || doc.createdAt || null;
  const lastLogoutTime = doc.lastLogout || null;
  const lastHeartbeatTime = doc.lastHeartbeat || doc.lastActive || null;

  const loginMs = lastLoginTime ? new Date(lastLoginTime).getTime() : 0;
  const logoutMs = lastLogoutTime ? new Date(lastLogoutTime).getTime() : 0;
  const heartbeatMs = lastHeartbeatTime ? new Date(lastHeartbeatTime).getTime() : 0;
  const isLoggedOutByTimestamp = logoutMs > 0 && loginMs > 0 && logoutMs >= loginMs;

  // If app is closed/cleared, heartbeat stops. After 90s without ping, mark as logged out
  const latestActivityMs = Math.max(heartbeatMs, loginMs);
  const isHeartbeatStale = latestActivityMs > 0 && (Date.now() - latestActivityMs > 90_000);

  // Strict check: only explicitly active sessions are considered active
  const isExplicitlyLoggedOut = doc.sessionStatus === 'logged_out' || doc.isLoggedIn === false || isLoggedOutByTimestamp || isHeartbeatStale;
  const isCurrentlyActive = (doc.sessionStatus === 'active' || doc.isLoggedIn === true) && !isExplicitlyLoggedOut;

  const sessionStatus: 'active' | 'logged_out' = isCurrentlyActive ? 'active' : 'logged_out';
  const isLoggedIn = isCurrentlyActive;

  // Devices: preserve known device even when logged out (with isLoggedIn status)
  let devices: any[] = [];
  if (Array.isArray(doc.devices) && doc.devices.length > 0) {
    devices = doc.devices.map((d: any) => ({ ...d, isLoggedIn: isCurrentlyActive }));
  } else {
    devices = [
      {
        deviceId: `android_${tenDigit || doc.id}`,
        platform: 'android',
        deviceName: 'Android Mobile App',
        lastLogin: lastLoginTime || new Date().toISOString(),
        isLoggedIn: isCurrentlyActive,
      }
    ];
  }

  // Logout timestamp: if logged out, ensure we have a valid logout timestamp
  let lastLogout = doc.lastLogout || null;
  if (!isCurrentlyActive && !lastLogout) {
    lastLogout = lastLoginTime || doc.createdAt || new Date().toISOString();
  } else if (isCurrentlyActive) {
    lastLogout = null;
  }

  const isPlanExpired = doc.planExpiry ? new Date(doc.planExpiry).getTime() <= Date.now() : false;
  const isSubActive = (doc.subscriptionStatus === 'active' || doc.isSubscribed === true) && !isPlanExpired;
  const subStatus: 'active' | 'free' | 'expired' = isSubActive
    ? 'active'
    : (doc.subscriptionStatus === 'expired' || isPlanExpired)
    ? 'expired'
    : 'free';

  return {
    id: doc.id || (tenDigit ? `user_${tenDigit}` : `user_${Date.now()}`),
    phone: formattedPhone,
    name: name,
    email: doc.email || '',
    photoUrl: doc.photoUrl || doc.photoURL || `https://api.dicebear.com/7.x/avataaars/png?seed=${tenDigit || doc.id || 'user'}`,
    district: doc.district || '',
    taluka: doc.taluka || '',
    createdAt: doc.createdAt || doc.created_at || new Date().toISOString(),
    subscriptionStatus: subStatus,
    planId: subStatus === 'active' ? (doc.planId || 'vip-annual') : (doc.planId || 'free'),
    planName: doc.planName || (subStatus === 'active' ? 'VIP Annual Pass' : (subStatus === 'expired' ? 'प्लॅन संपला (Plan Expired)' : 'विना-सबस्क्रिप्शन (मोफत)')),
    planExpiry: doc.planExpiry || doc.expiryDate || (subStatus === 'active' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : undefined),
    devices: devices,
    watchlist: Array.isArray(doc.watchlist) ? doc.watchlist : [],
    continueWatching: doc.continueWatching && typeof doc.continueWatching === 'object' ? doc.continueWatching : {},
    isLoggedIn: isLoggedIn,
    sessionStatus: sessionStatus,
    lastLogin: lastLoginTime || new Date().toISOString(),
    loginTime: doc.loginTime || lastLoginTime || new Date().toISOString(),
    lastLogout: lastLogout || undefined,
    lastHeartbeat: lastHeartbeatTime || undefined,
    lastActive: doc.lastActive || undefined,
  };
}

// GET: Fetch all registered users directly from Cloud Firestore with Admin credentials
export async function GET() {
  try {
    const rawUsers = await fetchDocsFromFirestore('users');
    console.log('GET /api/users: rawUsers count from Firestore:', rawUsers?.length || 0);

    // STRICT DEDUPLICATION: Map by 10-digit phone number so no user number is ever shown twice
    const userMap = new Map<string, User>();

    for (const raw of rawUsers || []) {
      const normalized = normalizeFirestoreUser(raw);
      if (!normalized) continue;

      const digits = normalized.phone.replace(/\D/g, '');
      const phoneKey = digits.length >= 10 ? digits.slice(-10) : normalized.id;

      const existing = userMap.get(phoneKey);
      if (!existing) {
        userMap.set(phoneKey, normalized);
      } else {
        // Merge records: prefer non-placeholder name, active subscription, latest login
        const pickName = (normalized.name && !normalized.name.startsWith('User '))
          ? normalized.name
          : existing.name;

        const isSubActive = (normalized.subscriptionStatus === 'active' || existing.subscriptionStatus === 'active');
        const activeSubRec = normalized.subscriptionStatus === 'active' ? normalized : existing;
        
        // If either record explicitly logged out recently, consider the latest event
        const normTime = new Date(normalized.lastLogin || normalized.createdAt || 0).getTime();
        const existTime = new Date(existing.lastLogin || existing.createdAt || 0).getTime();
        const primary = normTime >= existTime ? normalized : existing;
        const secondary = normTime >= existTime ? existing : normalized;

        const isLoggedOut = primary.sessionStatus === 'logged_out' || !primary.isLoggedIn;

        const merged: User = {
          ...secondary,
          ...primary,
          id: `user_${phoneKey}`,
          phone: `+91 ${phoneKey}`,
          name: pickName,
          photoUrl: primary.photoUrl || secondary.photoUrl,
          subscriptionStatus: isSubActive ? 'active' : 'free',
          planId: isSubActive ? (activeSubRec.planId || 'vip-annual') : 'free',
          planName: isSubActive ? (activeSubRec.planName || 'VIP Annual Pass') : 'विना-सबस्क्रिप्शन (मोफत)',
          planExpiry: isSubActive ? (activeSubRec.planExpiry || undefined) : undefined,
          isLoggedIn: !isLoggedOut,
          sessionStatus: isLoggedOut ? 'logged_out' : 'active',
          devices: isLoggedOut ? [] : ((primary.devices && primary.devices.length > 0) ? primary.devices : secondary.devices),
          lastLogin: primary.lastLogin || secondary.lastLogin,
          lastLogout: isLoggedOut ? (primary.lastLogout || secondary.lastLogout || primary.lastLogin) : undefined,
          lastHeartbeat: primary.lastHeartbeat || secondary.lastHeartbeat,
          lastActive: primary.lastActive || secondary.lastActive,
          createdAt: secondary.createdAt && new Date(secondary.createdAt) < new Date(primary.createdAt) ? secondary.createdAt : primary.createdAt,
        };
        userMap.set(phoneKey, merged);
      }
    }

    const rawList = Array.from(userMap.values());

    // Sort newest activity / registration first
    rawList.sort((a, b) => {
      const timeA = new Date(a.lastLogin || a.createdAt || 0).getTime();
      const timeB = new Date(b.lastLogin || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    const users = rawList.map(u => {
      const uDigits = u.phone.replace(/\D/g, '').slice(-10);
      const isLoggedOutExplicit = u.sessionStatus === 'logged_out' || u.isLoggedIn === false;
      const logoutTime = u.lastLogout ? new Date(u.lastLogout).getTime() : 0;
      const loginTime = u.lastLogin ? new Date(u.lastLogin).getTime() : (u.loginTime ? new Date(u.loginTime).getTime() : 0);
      const hasLoggedOutAfterLogin = logoutTime > 0 && loginTime > 0 && logoutTime > loginTime;
      const hbTime = u.lastHeartbeat ? new Date(u.lastHeartbeat).getTime() : (u.lastActive ? new Date(u.lastActive).getTime() : 0);
      const isHeartbeatStale = (hbTime > 0 && Date.now() - hbTime > 90_000) || (hbTime === 0 && loginTime > 0 && Date.now() - loginTime > 90_000);

      const isUserActive = !isLoggedOutExplicit && !hasLoggedOutAfterLogin && !isHeartbeatStale && (u.sessionStatus === 'active' || u.isLoggedIn === true);

      if (isUserActive) {
        return {
          ...u,
          isLoggedIn: true,
          sessionStatus: 'active' as const,
          devices: (Array.isArray(u.devices) && u.devices.length > 0) ? u.devices : [
            {
              deviceId: `android_${uDigits || u.id}`,
              platform: 'android',
              deviceName: 'Android Mobile App',
              lastLogin: u.lastLogin || new Date().toISOString(),
              isLoggedIn: true,
            }
          ],
          lastLogout: undefined,
        };
      } else {
        return {
          ...u,
          isLoggedIn: false,
          sessionStatus: 'logged_out' as const,
          devices: [],
          lastLogout: u.lastLogout || u.lastLogin || u.createdAt || new Date().toISOString(),
        };
      }
    });

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    console.error('GET /api/users error:', err);
    return NextResponse.json({ success: true, users: [], count: 0, error: err?.message || 'Failed to fetch users' });
  }
}

// POST: Register, sync, login or logout user from Android App or Web Admin
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPhone = String(body.phone || body.mobile || body.id || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;

    if (!cleanPhone && !body.id) {
      return NextResponse.json({ success: false, error: 'Mobile number or User ID is required' }, { status: 400 });
    }

    const userId = `user_${cleanPhone || body.id}`;
    const nowIso = new Date().toISOString();

    // Handle LOGOUT action explicitly
    if (body.action === 'logout' || body.sessionStatus === 'logged_out') {
      const logoutPayload = {
        id: userId,
        phone: cleanPhone ? `+91 ${cleanPhone}` : (body.phone || ''),
        isLoggedIn: false,
        sessionStatus: 'logged_out',
        lastLogout: nowIso,
        devices: [],
        updatedAt: nowIso,
      };
      const synced = await syncDocToFirestore('users', userId, logoutPayload);
      return NextResponse.json({
        success: synced,
        message: 'User logged out successfully',
        user: logoutPayload,
      }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Handle ACTIVATE action explicitly (from Admin Panel "सक्रिय करा")
    // Preserves existing name, email, subscription status, etc.
    if (body.action === 'activate') {
      const activatePayload: any = {
        id: userId,
        phone: cleanPhone ? `+91 ${cleanPhone}` : (body.phone || ''),
        isLoggedIn: true,
        sessionStatus: 'active',
        lastLogin: nowIso,
        loginTime: nowIso,
        lastLogout: null,
        lastHeartbeat: nowIso,
        lastActive: nowIso,
        devices: [
          {
            deviceId: `android_${cleanPhone || Date.now()}`,
            platform: 'android',
            deviceName: body.deviceName || 'Android Mobile App',
            lastLogin: nowIso,
            isLoggedIn: true,
          }
        ],
        updatedAt: nowIso,
      };
      if (body.name) activatePayload.name = body.name;

      const synced = await syncDocToFirestore('users', userId, activatePayload);


      return NextResponse.json({
        success: synced,
        message: 'User activated successfully',
        user: activatePayload,
      }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Handle UPDATE_SUBSCRIPTION action explicitly (from Admin Panel or User Subscribe)
    if (body.action === 'update_subscription') {
      const isSub = body.subscriptionStatus === 'active';
      const days = Number(body.durationDays) || 365;
      const expiry = isSub ? (body.planExpiry || new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()) : null;
      const subPayload: any = {
        id: userId,
        phone: cleanPhone ? `+91 ${cleanPhone}` : (body.phone || ''),
        subscriptionStatus: isSub ? 'active' : 'free',
        planId: isSub ? (body.planId || (days <= 31 ? 'vip-monthly' : days <= 95 ? 'vip-quarterly' : 'vip-annual')) : 'free',
        planName: isSub ? (body.planName || (days === 28 ? 'VIP Monthly Pass (२८ दिवस)' : days === 84 ? 'VIP Quarterly Pass (८४ दिवस)' : `VIP Pass (${days} दिवस)`)) : 'विना-सबस्क्रिप्शन (मोफत)',
        planExpiry: expiry,
        durationDays: isSub ? days : 0,
        updatedAt: nowIso,
      };
      if (body.name) subPayload.name = body.name;

      const synced = await syncDocToFirestore('users', userId, subPayload);
      return NextResponse.json({
        success: synced,
        message: isSub ? `सबस्क्रिप्शन ${days} दिवसांसाठी सक्रिय केले` : 'सबस्क्रिप्शन रद्द केले',
        user: subPayload,
      }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Normal Login or Activation
    const userPayload: User = {
      id: userId,
      phone: cleanPhone ? `+91 ${cleanPhone}` : body.phone || '',
      name: body.name || `User ${cleanPhone || userId}`,
      email: body.email || '',
      photoUrl: body.photoUrl || `https://api.dicebear.com/7.x/avataaars/png?seed=${cleanPhone || userId}`,
      district: body.district || '',
      taluka: body.taluka || '',
      createdAt: body.createdAt || nowIso,
      subscriptionStatus: body.subscriptionStatus || 'active',
      planId: body.planId || 'free-tier',
      planName: body.planName || 'Standard Access',
      planExpiry: body.planExpiry || '2026-12-31T23:59:59Z',
      devices: Array.isArray(body.devices) && body.devices.length > 0 ? body.devices : [
        {
          deviceId: `android_${cleanPhone || Date.now()}`,
          platform: 'android',
          deviceName: body.deviceName || 'Android Mobile App',
          lastLogin: nowIso,
          isLoggedIn: true,
        }
      ],
      watchlist: Array.isArray(body.watchlist) ? body.watchlist : [],
      continueWatching: body.continueWatching && typeof body.continueWatching === 'object' ? body.continueWatching : {},
      isLoggedIn: true,
      sessionStatus: 'active',
      lastLogin: nowIso,
      loginTime: body.loginTime || nowIso,
    };

    const synced = await syncDocToFirestore('users', userId, userPayload);


    return NextResponse.json({
      success: synced,
      message: synced ? 'User registered and synced successfully in Cloud Firestore' : 'Failed to sync to Firestore',
      user: userPayload,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    console.error('POST /api/users error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to save user' });
  }
}

// DELETE: Delete a user by ID
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const deleted = await deleteDocFromFirestore('users', userId);

    // Also clean up any possible duplicate variation if phone digits exist
    const digits = userId.replace(/\D/g, '');
    if (digits.length >= 10) {
      const ten = digits.slice(-10);
      deleteDocFromFirestore('users', `user_+91 ${ten}`).catch(() => {});
      deleteDocFromFirestore('users', `user_${ten}`).catch(() => {});
    }

    return NextResponse.json({
      success: deleted,
      message: deleted ? `User ${userId} deleted successfully from Firestore` : 'Failed to delete user'
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    console.error('DELETE /api/users error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to delete user' });
  }
}
