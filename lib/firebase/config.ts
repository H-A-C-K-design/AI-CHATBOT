// ============================================================
// Firebase Client SDK — Singleton Initialization
// ============================================================
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

export function getClientApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return _app;
}

export function getClientAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getClientApp());
  }
  return _auth;
}

export const auth = new Proxy({} as Auth, {
  get(_, prop) {
    try {
      const instance = getClientAuth();
      const val = (instance as unknown as Record<string, unknown>)[prop as string];
      if (typeof val === 'function') {
        return val.bind(instance);
      }
      return val;
    } catch {
      return undefined;
    }
  },
});

export const db = new Proxy({} as Firestore, {
  get(_, prop) {
    try {
      if (!_db) {
        _db = getFirestore(getClientApp());
      }
      const val = (_db as unknown as Record<string, unknown>)[prop as string];
      if (typeof val === 'function') {
        return val.bind(_db);
      }
      return val;
    } catch {
      return undefined;
    }
  },
});

export default getClientApp;
