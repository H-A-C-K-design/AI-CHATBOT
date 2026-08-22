'use client';

// ============================================================
// Projects Layout — Sidebar + Workspace Shell
// ============================================================
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/components/auth/auth-provider';

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <p>Loading Projects Workspace...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="chat-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="chat-main intel-main-wrapper">
        <header className="chat-header">
          <button
            onClick={() => setSidebarOpen(true)}
            className="sidebar-toggle-btn"
            type="button"
            aria-label="Open sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <div className="chat-header-brand-tag">
            <span className="brand-dot" />
            <span>NEXORA AI • Monitoring Projects</span>
          </div>

          <div className="chat-header-actions">
            <ThemeToggle />
          </div>
        </header>

        <div className="intel-scroll-container">
          {children}
        </div>
      </main>
    </div>
  );
}
