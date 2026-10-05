import { NextRequest, NextResponse } from 'next/server';
import { syncDocToFirestore, deleteDocFromFirestore, fetchDocsFromFirestore } from '@/lib/firestore-admin-sync';
import { User } from '@/lib/types';

export const dynamic = 'force-dynamic';

function normalizeFirestoreUser(doc: any): User | null {
  if (!doc) return null;
  // Exclude only dummy mock templates
  if (doc.id === 'usr-003' || doc.name === 'Liam Gallagher' || String(doc.phone || '').includes('7700 900123')) {
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
  const loginTimestamp = lastLoginTime ? new Date(lastLoginTime).getTime() : 0;
  const now = Date.now();
  const hoursSinceLogin = loginTimestamp > 0 ? (now - loginTimestamp) / (1000 * 60 * 60) : 999;

  // Explicit logout checks or expired sessions (> 12 hours)
  const isExplicitlyLoggedOut = doc.sessionStatus === 'logged_out' || doc.isLoggedIn === false;
  const isSessionExpired = hoursSinceLogin > 12;
  const isCurrentlyActive = !isExplicitlyLoggedOut && !isSessionExpired && (loginTimestamp > 0);

  const sessionStatus: 'active' | 'logged_out' = isCurrentlyActive ? 'active' : 'logged_out';
  const isLoggedIn = isCurrentlyActive;

  // Active devices: only keep if user is currently active
  let devices: any[] = [];
  if (isCurrentlyActive) {
    if (Array.isArray(doc.devices) && doc.devices.length > 0) {
      devices = doc.devices;
    } else {
      devices = [
        {
          deviceId: `android_${tenDigit || doc.id || 'dev'}`,
          platform: 'android',
          deviceName: 'Android Mobile App',
          lastLogin: lastLoginTime || new Date().toISOString(),
          isLoggedIn: true,
        }
      ];
    }
  }

  // Logout timestamp: if logged out, ensure we have a valid logout timestamp
  let lastLogout = doc.lastLogout || null;
  if (!isCurrentlyActive && !lastLogout) {
    lastLogout = lastLoginTime || doc.createdAt || new Date().toISOString();
  } else if (isCurrentlyActive) {
    lastLogout = null;
  }

  return {
    id: doc.id || (tenDigit ? `user_${tenDigit}` : `user_${Date.now()}`),
    phone: formattedPhone,
    name: name,
    email: doc.email || '',
    photoUrl: doc.photoUrl || doc.photoURL || `https://api.dicebear.com/7.x/avataaars/png?seed=${tenDigit || doc.id || 'user'}`,
    district: doc.district || '',
    taluka: doc.taluka || '',
    createdAt: doc.createdAt || doc.created_at || new Date().toISOString(),
    subscriptionStatus: doc.subscriptionStatus || doc.status || 'active',
    planId: doc.planId || 'vip-annual',
    planName: doc.planName || (doc.subscriptionStatus === 'active' ? 'VIP Annual Pass' : 'Standard Access'),
    planExpiry: doc.planExpiry || doc.expiryDate || '2027-12-31T23:59:59Z',
    devices: devices,
    watchlist: Array.isArray(doc.watchlist) ? doc.watchlist : [],
    continueWatching: doc.continueWatching && typeof doc.continueWatching === 'object' ? doc.continueWatching : {},
    isLoggedIn: isLoggedIn,
    sessionStatus: sessionStatus,
    lastLogin: lastLoginTime || new Date().toISOString(),
    loginTime: doc.loginTime || lastLoginTime || new Date().toISOString(),
    lastLogout: lastLogout || undefined,
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

        const isSubActive = normalized.subscriptionStatus === 'active' || existing.subscriptionStatus === 'active';
        
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
          subscriptionStatus: isSubActive ? 'active' : primary.subscriptionStatus,
          isLoggedIn: !isLoggedOut,
          sessionStatus: isLoggedOut ? 'logged_out' : 'active',
          devices: isLoggedOut ? [] : ((primary.devices && primary.devices.length > 0) ? primary.devices : secondary.devices),
          lastLogin: primary.lastLogin || secondary.lastLogin,
          lastLogout: isLoggedOut ? (primary.lastLogout || secondary.lastLogout || primary.lastLogin) : undefined,
          createdAt: secondary.createdAt && new Date(secondary.createdAt) < new Date(primary.createdAt) ? secondary.createdAt : primary.createdAt,
        };
        userMap.set(phoneKey, merged);
      }
    }

    const users = Array.from(userMap.values());

    // Sort newest activity / registration first
    users.sort((a, b) => {
      const timeA = new Date(a.lastLogin || a.createdAt || 0).getTime();
      const timeB = new Date(b.lastLogin || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch users' }, { status: 500 });
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

    // Handle LOGOUT action explicitly
    if (body.action === 'logout' || body.sessionStatus === 'logged_out') {
      const logoutPayload = {
        id: userId,
        phone: cleanPhone ? `+91 ${cleanPhone}` : (body.phone || ''),
        isLoggedIn: false,
        sessionStatus: 'logged_out',
        lastLogout: new Date().toISOString(),
        devices: [],
        updatedAt: new Date().toISOString(),
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

    // Normal Login or Sync
    const nowIso = new Date().toISOString();
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
    return NextResponse.json({ success: false, error: err?.message || 'Failed to save user' }, { status: 500 });
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
    return NextResponse.json({ success: false, error: err?.message || 'Failed to delete user' }, { status: 500 });
  }
}
