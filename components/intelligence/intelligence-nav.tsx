'use client';

// ============================================================
// Intelligence Top Bar & Sub-Navigation Header
// Project Filter Selector + Live Monitoring Trigger Action
// ============================================================
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useProjectSession } from '@/lib/context/project-context';
import type { MonitoringProject } from '@/types';

interface IntelligenceNavProps {
  onRefresh?: () => void;
  activeProjectId?: string;
  onSelectProject?: (projectId: string) => void;
}

export function IntelligenceNav({
  activeProjectId: propActiveProjectId,
  onSelectProject,
  onRefresh,
}: IntelligenceNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const { projects, activeProjectId: sessionActiveProjectId, setActiveProjectId } = useProjectSession();

  const currentProjectId = propActiveProjectId || searchParams.get('projectId') || sessionActiveProjectId || '';
  const [isRunningSync, setIsRunningSync] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setActiveProjectId(val || null);
    if (onSelectProject) {
      onSelectProject(val);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (val) {
        params.set('projectId', val);
      } else {
        params.delete('projectId');
      }
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const handleRunSync = async () => {
    const targetProject = currentProjectId ? projects.find((p) => p.id === currentProjectId) : projects[0];
    if (!targetProject) {
      router.push('/projects/new');
      return;
    }

    try {
      setIsRunningSync(true);
      setSyncStatus(`Syncing real data for "${targetProject.name}"...`);
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`/api/intelligence/projects/${targetProject.id}/run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatus(`✓ Collected ${data.result?.newItemsSaved || 0} new records!`);
        onRefresh?.();
      } else {
        setSyncStatus(data.error || 'Sync completed.');
      }
    } catch (err) {
      setSyncStatus((err as Error).message);
    } finally {
      setIsRunningSync(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const navLinks = [
    { href: '/intelligence', label: 'Overview' },
    { href: '/intelligence/research-analyzer', label: 'Paper Analyzer 📄🔬' },
    { href: '/intelligence/research', label: 'Research Trends' },
    { href: '/intelligence/patents', label: 'Patent Watch' },
    { href: '/intelligence/competitors', label: 'Competitor Watch' },
    { href: '/intelligence/news', label: 'Industry News' },
    { href: '/intelligence/trends', label: 'Trend Engine' },
    { href: '/intelligence/insights', label: 'AI Insights' },
    { href: '/intelligence/alerts', label: 'Alerts' },
  ];

  return (
    <div className="intel-nav-wrapper">
      {syncStatus && (
        <div className="intel-toast-banner" role="status">
          {isRunningSync ? <span className="spinner-mini" /> : <span>✓</span>}
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="intel-top-bar">
        <div className="intel-top-left">
          <h1 className="intel-workspace-title">Research &amp; Competitive Intelligence</h1>
          <div className="intel-project-picker">
            <label htmlFor="intel-project-select" className="sr-only">
              Filter by Monitoring Project
            </label>
            <select
              id="intel-project-select"
              value={currentProjectId}
              onChange={handleProjectChange}
              className="intel-select"
            >
              <option value="">All Monitored Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.industry})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="intel-top-right">
          {projects.length > 0 && (
            <button
              onClick={handleRunSync}
              disabled={isRunningSync}
              className="intel-sync-btn"
              type="button"
              title="Run real-time intelligence collection across arXiv, USPTO & News"
            >
              {isRunningSync ? (
                <>
                  <span className="spinner-mini" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <span className="btn-sparkle">⚡</span>
                  <span>Run Live Sync</span>
                </>
              )}
            </button>
          )}

          <Link href="/projects/new" className="intel-create-proj-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>New Project</span>
          </Link>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <nav className="intel-sub-tabs" aria-label="Intelligence subroutes">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const hrefWithQuery = currentProjectId ? `${link.href}?projectId=${currentProjectId}` : link.href;

          return (
            <Link
              key={link.href}
              href={hrefWithQuery}
              className={`intel-tab-link ${isActive ? 'intel-tab-link-active' : ''}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
