'use client';

// ============================================================
// Auth Context Provider with Guest Mode Support
// ============================================================
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, getIdToken, checkRedirectResult, signOut as firebaseSignOut } from '@/lib/firebase/auth';
import type { User } from 'firebase/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  getToken: () => Promise<string | null>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

const GUEST_SESSION_KEY = 'feedforge_guest_session';

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
  getToken: async () => null,
  loginAsGuest: () => {},
  logout: async () => {},
});

function createGuestUser(customUid?: string): User {
  const uid = customUid || 'guest-' + Math.random().toString(36).substring(2, 8);
  return {
    uid,
    email: 'guest@feedforge.ai',
    displayName: 'Guest Explorer',
    photoURL: null,
    emailVerified: true,
    isAnonymous: true,
    getIdToken: async () => `guest-token-${uid}`,
  } as unknown as User;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check for stored guest session
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(GUEST_SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.uid) {
            setUser(createGuestUser(parsed.uid));
            setLoading(false);
          }
        }
      } catch {
        // ignore
      }
    }

    // 2. Check if returning from OAuth redirect flow
    checkRedirectResult().then((redirectUser) => {
      if (redirectUser) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(GUEST_SESSION_KEY);
        }
        setUser(redirectUser);
      }
    });

    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(GUEST_SESSION_KEY);
        }
        setUser(firebaseUser);
      } else {
        // If no Firebase user, check if we still have an active guest session
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(GUEST_SESSION_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.uid) {
              setUser(createGuestUser(parsed.uid));
              setLoading(false);
              return;
            }
          }
        }
        setUser(null);
      }
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, []);

  const loginAsGuest = useCallback(() => {
    const guest = createGuestUser();
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify({ uid: guest.uid, createdAt: Date.now() }));
    }
    setUser(guest);
    setLoading(false);
    setError(null);
  }, []);

  const logout = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_SESSION_KEY);
    }
    try {
      await firebaseSignOut();
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!user) return 'guest-token-default';
    try {
      const token = await user.getIdToken();
      return token || `guest-token-${user.uid}`;
    } catch {
      return `guest-token-${user.uid}`;
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, error, getToken, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
