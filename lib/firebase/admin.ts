// ============================================================
// Firebase Admin SDK — Server-only Initialization
// ============================================================
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin SDK credentials are not configured. ' +
      'Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in .env.local.'
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

let _adminApp: App | null = null;
let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;

export function getAdminAppInstance(): App {
  if (!_adminApp) {
    _adminApp = getAdminApp();
  }
  return _adminApp;
}

export const adminAuth = new Proxy({} as Auth, {
  get(_, prop) {
    if (!_adminAuth) {
      _adminAuth = getAuth(getAdminAppInstance());
    }
    const val = (_adminAuth as unknown as Record<string, unknown>)[prop as string];
    if (typeof val === 'function') {
      return val.bind(_adminAuth);
    }
    return val;
  },
});

export const adminDb = new Proxy({} as Firestore, {
  get(_, prop) {
    if (!_adminDb) {
      _adminDb = getFirestore(getAdminAppInstance());
    }
    const val = (_adminDb as unknown as Record<string, unknown>)[prop as string];
    if (typeof val === 'function') {
      return val.bind(_adminDb);
    }
    return val;
  },
});

export default getAdminAppInstance;
