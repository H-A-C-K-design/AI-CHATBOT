'use client';

// ============================================================
// Settings Page
// ============================================================
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { signOut } from '@/lib/firebase/auth';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch {
      // Silent fail
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  // Determine auth provider
  const provider = user.providerData?.[0]?.providerId || 'Unknown';
  const providerName =
    provider === 'google.com'
      ? 'Google'
      : provider === 'github.com'
        ? 'GitHub'
        : provider;

  return (
    <main className="settings-page">
      <div className="settings-container">
        <button
          onClick={() => router.push('/chat')}
          className="settings-back-btn"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Back to chat</span>
        </button>

        <h1 className="settings-title">Settings</h1>

        {/* Profile Section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Profile</h2>
          <div className="settings-card">
            <div className="settings-profile">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="settings-avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="settings-avatar-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              <div className="settings-profile-info">
                <h3 className="settings-profile-name">{user.displayName || 'User'}</h3>
                <p className="settings-profile-email">{user.email}</p>
              </div>
            </div>

            <div className="settings-field">
              <span className="settings-field-label">Authentication provider</span>
              <span className="settings-field-value settings-provider-badge">
                {providerName}
              </span>
            </div>

            <div className="settings-field">
              <span className="settings-field-label">Account ID</span>
              <span className="settings-field-value settings-uid">{user.uid}</span>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Appearance</h2>
          <div className="settings-card">
            <div className="settings-field settings-field-row">
              <div>
                <span className="settings-field-label">Theme</span>
                <span className="settings-field-description">Switch between dark and light mode</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Account</h2>
          <div className="settings-card">
            <button
              onClick={handleSignOut}
              className="settings-signout-btn"
              type="button"
              id="btn-signout"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 2H3.5C2.67 2 2 2.67 2 3.5V12.5C2 13.33 2.67 14 3.5 14H6M6 8H14M14 8L11 5M14 8L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
