'use client';

// ============================================================
// Login Form Component — Email/Password + OAuth
// ============================================================
import React, { useState } from 'react';
import {
  signInWithGoogle,
  signInWithGitHub,
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
} from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { NexoraLogo } from '@/components/ui/nexora-logo';

export function LoginForm() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState<'email' | 'google' | 'github' | 'reset' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (mode === 'forgot') {
      setLoading('reset');
      try {
        await sendPasswordReset(email.trim());
        setSuccessMessage('Password reset link sent to your email.');
      } catch (err: unknown) {
        const error = err as { code?: string; message?: string };
        setError(error.message || 'Failed to send password reset email.');
      } finally {
        setLoading(null);
      }
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading('email');
    try {
      if (mode === 'signin') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password, displayName.trim() || undefined);
      }
      router.push('/chat');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Sign in instead.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setError('Email/Password is not enabled in your Firebase Console. Please enable it in Authentication > Sign-in method.');
      } else {
        setError(error.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading('google');
    setError(null);
    setSuccessMessage(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        router.push('/chat');
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        setError(null);
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email using a different sign-in provider.');
      } else if (error.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        setError(`Domain "${domain}" is not authorized in Firebase Console > Authentication > Settings > Authorized domains. Alternatively, sign in using Email & Password below.`);
      } else {
        setError('Unable to complete Google sign-in. Please try again or use email sign-in.');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleGitHubSignIn = async () => {
    setLoading('github');
    setError(null);
    setSuccessMessage(null);
    try {
      const user = await signInWithGitHub();
      if (user) {
        router.push('/chat');
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        setError(null);
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email using a different sign-in provider.');
      } else if (error.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        setError(`Domain "${domain}" is not authorized in Firebase Console > Authentication > Settings > Authorized domains. Alternatively, sign in using Email & Password below.`);
      } else {
        setError('Unable to complete GitHub sign-in. Please verify your OAuth settings.');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="login-form">
      {/* Logo & Branding */}
      <div className="login-header">
        <div className="login-logo">
          <NexoraLogo size={64} withBackground={true} glow={true} />
        </div>
        <h1 className="login-title">NEXORA AI</h1>
        <p className="login-subtitle">Your intelligent coding companion powered by AI</p>
      </div>

      {/* Mode Tabs */}
      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signin'}
          className={`auth-tab ${mode === 'signin' ? 'auth-tab-active' : ''}`}
          onClick={() => {
            setMode('signin');
            setError(null);
            setSuccessMessage(null);
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          className={`auth-tab ${mode === 'signup' ? 'auth-tab-active' : ''}`}
          onClick={() => {
            setMode('signup');
            setError(null);
            setSuccessMessage(null);
          }}
        >
          Create Account
        </button>
      </div>

      {/* Feedback alerts */}
      {error && (
        <div className="login-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="login-success" role="status">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 8.5L7 10.5L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Email / Password Form */}
      <form onSubmit={handleEmailAuth} className="email-auth-form">
        {mode === 'signup' && (
          <div className="form-group">
            <label htmlFor="auth-name" className="form-label">Name</label>
            <input
              id="auth-name"
              type="text"
              className="form-input"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="auth-email" className="form-label">Email Address</label>
          <input
            id="auth-email"
            type="email"
            required
            className="form-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        {mode !== 'forgot' && (
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="auth-password" className="form-label">Password</label>
              {mode === 'signin' && (
                <button
                  type="button"
                  className="form-link"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              id="auth-password"
              type="password"
              required
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading !== null}
          className="auth-submit-btn"
          id="btn-email-auth"
        >
          {loading === 'email' || loading === 'reset' ? (
            <span className="login-spinner" aria-hidden="true" />
          ) : mode === 'signin' ? (
            'Sign In with Email'
          ) : mode === 'signup' ? (
            'Create Account'
          ) : (
            'Send Reset Link'
          )}
        </button>

        {mode === 'forgot' && (
          <button
            type="button"
            className="back-to-signin-btn"
            onClick={() => {
              setMode('signin');
              setError(null);
              setSuccessMessage(null);
            }}
          >
            ← Back to Sign In
          </button>
        )}
      </form>

      {/* Divider */}
      <div className="login-divider">
        <span>or continue with</span>
      </div>

      {/* OAuth Buttons */}
      <div className="login-buttons">
        <button
          id="btn-google-signin"
          onClick={handleGoogleSignIn}
          disabled={loading !== null}
          className="login-btn login-btn-google"
          type="button"
          aria-label="Continue with Google"
        >
          {loading === 'google' ? (
            <span className="login-spinner" aria-hidden="true" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          <span>Google</span>
        </button>

        <button
          id="btn-github-signin"
          onClick={handleGitHubSignIn}
          disabled={loading !== null}
          className="login-btn login-btn-github"
          type="button"
          aria-label="Continue with GitHub"
        >
          {loading === 'github' ? (
            <span className="login-spinner" aria-hidden="true" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          )}
          <span>GitHub</span>
        </button>
      </div>
    </div>
  );
}
