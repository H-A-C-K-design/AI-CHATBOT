// ============================================================
// Firebase Client Auth Helpers
// ============================================================
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
  type NextOrObserver,
  type Unsubscribe,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in with Email and Password.
 */
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

/**
 * Create a new account with Email and Password.
 */
export async function signUpWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && result.user) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

/**
 * Send password reset email.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Sign in with Google OAuth popup, with auto-fallback to redirect if popup is blocked.
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      console.warn('[Auth] Popup blocked or closed, falling back to signInWithRedirect...');
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
}

/**
 * Sign in with GitHub OAuth popup, with auto-fallback to redirect if popup is blocked.
 */
export async function signInWithGitHub(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    return result.user;
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      console.warn('[Auth] Popup blocked or closed, falling back to signInWithRedirect...');
      await signInWithRedirect(auth, githubProvider);
      return null;
    }
    throw error;
  }
}

/**
 * Check if the user is returning from a redirect sign-in.
 */
export async function checkRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.error('[Auth] Redirect result error:', error);
    return null;
  }
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Listen to auth state changes.
 */
export function onAuthStateChanged(callback: NextOrObserver<User | null>): Unsubscribe {
  try {
    return firebaseOnAuthStateChanged(auth, callback);
  } catch {
    if (typeof callback === 'function') {
      callback(null);
    }
    return () => {};
  }
}

/**
 * Get the current user's ID token for server communication.
 */
export async function getIdToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}
