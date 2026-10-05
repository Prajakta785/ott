// Server-side Cloud Firestore synchronization client for Gramin Bharat TV OTT
// Synchronizes data directly to Cloud Firestore project 'graminbharattv-f8994'
import https from 'https';
import { URL } from 'url';

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCZTSgR2V8WRJFA81I7Eg_KXGbYGoze9_0";
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "graminbharattv-f8994";
const ADMIN_EMAIL = process.env.FIREBASE_ADMIN_EMAIL || "admin@graminbharat.tv";
const ADMIN_PASSWORD = process.env.FIREBASE_ADMIN_PASSWORD || "Gramin@Admin2026!";

// Node https Agent with rejectUnauthorized false to prevent Windows root CA trust issues
const httpsAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

function httpRequest(urlStr: string, options: https.RequestOptions = {}, body: any = null): Promise<{ status: number; data?: any; raw?: string }> {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const req = https.request(url, {
        ...options,
        agent: httpsAgent,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 200, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode || 200, raw: data });
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

let cachedIdToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Obtain an authenticated Admin ID token from Firebase Auth REST API
 */
export async function getAdminIdToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedIdToken && now < tokenExpiresAt - 60000) {
    return cachedIdToken;
  }

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
    const res = await httpRequest(url, { method: 'POST' }, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      returnSecureToken: true,
    });

    if (res.status !== 200 || !res.data?.idToken) {
      console.warn('Firebase Admin Auth failed:', res.status, res.data || res.raw);
      return null;
    }

    cachedIdToken = res.data.idToken;
    const expiresInSec = parseInt(res.data.expiresIn || '3600', 10);
    tokenExpiresAt = Date.now() + expiresInSec * 1000;
    return cachedIdToken;
  } catch (err: any) {
    console.warn('Error obtaining Firebase Admin token:', err?.message);
    return null;
  }
}

/**
 * Convert standard JS value to Firestore REST Value format
 */
export function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === 'string') {
    // If it's a huge base64 string (> 800KB), truncate to prevent document limit crash
    if (val.length > 800000 && val.startsWith('data:')) {
      return { stringValue: '' };
    }
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/**
 * Convert Firestore REST document fields back to standard JS object
 */
export function fromFirestoreFields(fields: Record<string, any>): any {
  const obj: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v.stringValue !== undefined) obj[k] = v.stringValue;
    else if (v.booleanValue !== undefined) obj[k] = v.booleanValue;
    else if (v.integerValue !== undefined) obj[k] = parseInt(v.integerValue, 10);
    else if (v.doubleValue !== undefined) obj[k] = parseFloat(v.doubleValue);
    else if (v.nullValue !== undefined) obj[k] = null;
    else if (v.arrayValue !== undefined) {
      obj[k] = (v.arrayValue.values || []).map((item: any) => fromFirestoreValue(item));
    } else if (v.mapValue !== undefined) {
      obj[k] = fromFirestoreFields(v.mapValue.fields || {});
    }
  }
  return obj;
}

function fromFirestoreValue(v: any): any {
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
  if (v.doubleValue !== undefined) return parseFloat(v.doubleValue);
  if (v.nullValue !== undefined) return null;
  if (v.arrayValue !== undefined) return (v.arrayValue.values || []).map(fromFirestoreValue);
  if (v.mapValue !== undefined) return fromFirestoreFields(v.mapValue.fields || {});
  return null;
}

/**
 * Helper to build the Firestore REST Document URL
 */
function buildDocUrl(collectionOrPath: string, docId?: string): string {
  let cleanPath = collectionOrPath.replace(/^\/+|\/+$/g, '');
  if (docId) {
    cleanPath = `${cleanPath}/${encodeURIComponent(docId)}`;
  }
  return `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${cleanPath}`;
}

/**
 * Write or update a document directly in Cloud Firestore
 */
export async function syncDocToFirestore(collectionOrPath: string, docId: string, data: any): Promise<boolean> {
  const token = await getAdminIdToken();
  if (!token) {
    console.warn(`Firestore sync write skipped for ${collectionOrPath}/${docId}: no admin token`);
    return false;
  }

  try {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }

    const queryParams = Object.keys(data).filter(k => data[k] !== undefined).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
    const url = buildDocUrl(collectionOrPath, docId) + (queryParams ? `?${queryParams}` : '');
    const res = await httpRequest(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    }, { fields });

    if (res.status >= 200 && res.status < 300) {
      return true;
    }

    console.warn(`Firestore sync write error for ${collectionOrPath}/${docId}:`, res.status, res.data || res.raw);
    return false;
  } catch (err: any) {
    console.warn(`Firestore sync write network exception for ${collectionOrPath}/${docId}:`, err?.message);
    return false;
  }
}

/**
 * Delete a document directly from Cloud Firestore
 */
export async function deleteDocFromFirestore(collectionOrPath: string, docId: string): Promise<boolean> {
  const token = await getAdminIdToken();
  if (!token) return false;

  try {
    const url = buildDocUrl(collectionOrPath, docId);
    const res = await httpRequest(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    return res.status >= 200 && res.status < 300;
  } catch (err: any) {
    console.warn(`Firestore sync delete error for ${collectionOrPath}/${docId}:`, err?.message);
    return false;
  }
}

/**
 * Fetch all documents from a Firestore collection or subcollection
 */
export async function fetchDocsFromFirestore(collectionOrPath: string): Promise<any[]> {
  try {
    const token = await getAdminIdToken();
    const url = buildDocUrl(collectionOrPath);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await httpRequest(url, { method: 'GET', headers });
    if (res.status !== 200) return [];

    const json = res.data;
    if (!json?.documents || !Array.isArray(json.documents)) return [];

    return json.documents.map((d: any) => {
      const docId = d.name.split('/').pop();
      const fields = d.fields ? fromFirestoreFields(d.fields) : {};
      return { id: docId, ...fields };
    });
  } catch (err: any) {
    console.warn(`Error fetching ${collectionOrPath} from Firestore:`, err?.message);
    return [];
  }
}
