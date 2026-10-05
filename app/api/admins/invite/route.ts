import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    const { adminAuth, adminDb } = getFirebaseAdmin();

    if (adminAuth && adminDb) {
      // 1. Create Firebase Auth user
      const userRecord = await adminAuth.createUser({
        email,
        password: password || 'DefaultTempPassword123!',
        displayName: name,
      });

      // 2. Set Custom User Claims for RBAC
      await adminAuth.setCustomUserClaims(userRecord.uid, {
        adminRole: role,
        isAdmin: true,
      });

      // 3. Store metadata in Firestore admins collection
      await adminDb.collection('admins').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        name: name || email.split('@')[0],
        role,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, uid: userRecord.uid });
    }

    return NextResponse.json({
      success: true,
      mockMode: true,
      message: 'Admin registered in demo session.',
    });
  } catch (error: any) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
