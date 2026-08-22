// ============================================================
// Login Page
// ============================================================
import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — NEXORA AI',
  description: 'Sign in to NEXORA AI, your intelligent coding companion powered by AI.',
};

export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-container">
        <LoginForm />
      </div>

      {/* Background decoration */}
      <div className="login-bg" aria-hidden="true">
        <div className="login-bg-gradient" />
        <div className="login-bg-grid" />
      </div>
    </main>
  );
}
