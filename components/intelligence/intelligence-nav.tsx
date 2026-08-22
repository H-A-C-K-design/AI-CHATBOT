'use client';

// ============================================================
// Intelligence Top Bar & Sub-Navigation Header
// Project Filter Selector + Live Monitoring Trigger Action
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import type { MonitoringProject } from '@/types';

interface IntelligenceNavProps {
  onRefresh?: () => void;
  activeProjectId?: string;
  onSelectProject?: (projectId: string) => void;
}

export function IntelligenceNav({
  onRefresh,
  activeProjectId,
  onSelectProject,
}: IntelligenceNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();

  const [projects, setProjects] = useState<MonitoringProject[]>([]);
  const [selectedProj, setSelectedProj] = useState<string>(activeProjectId || searchParams.get('projectId') || '');
  const [isRunning, setIsRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  // Fetch user projects for the dropdown
  const fetchProjects = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/intelligence/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch {
      // silent
    }
  }, [getToken]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedProj(val);
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

  const handleRunMonitoring = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setRunMessage('Collecting real sources & analyzing with AI...');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated. Please sign in.');

      let targetId = selectedProj;
      if (!targetId && projects.length > 0) {
        targetId = projects[0].id;
      }

      if (!targetId) {
        setRunMessage('No active project found. Create a monitoring project first.');
        router.push('/projects/new');
        return;
      }

      const res = await fetch(`/api/intelligence/projects/${targetId}/run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      const data = await res.json();
      if (data.success) {
        setRunMessage(`Monitoring completed! Collected ${data.result?.newItemsSaved || 0} new item(s).`);
        onRefresh?.();
        setTimeout(() => setRunMessage(null), 4000);
      } else {
        setRunMessage(`Monitoring note: ${data.error || 'Check active sources'}`);
        setTimeout(() => setRunMessage(null), 4000);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setRunMessage('Monitoring request timed out. Please try again.');
      } else {
        setRunMessage(`Status: ${(err as Error).message}`);
      }
      setTimeout(() => setRunMessage(null), 4000);
    } finally {
      clearTimeout(timeout);
      setIsRunning(false);
    }
  };

  const navLinks = [
    { href: '/intelligence', label: 'Overview' },
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
              value={selectedProj}
              onChange={handleProjectChange}
              className="intel-select"
            >
              <option value="">All Monitored Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.industry})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="intel-top-right">
          {runMessage && (
            <span className="intel-run-status-badge">
              {isRunning && <span className="intel-run-spinner" />}
              {runMessage}
            </span>
          )}

          <button
            onClick={handleRunMonitoring}
            disabled={isRunning || projects.length === 0}
            className="intel-run-btn"
            type="button"
            title="Trigger autonomous source collection and AI analysis"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={isRunning ? 'animate-spin' : ''}
              aria-hidden="true"
            >
              <path d="M14 8A6 6 0 1 1 8 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>{isRunning ? 'Monitoring...' : 'Run Monitoring'}</span>
          </button>

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
          const hrefWithQuery = selectedProj ? `${link.href}?projectId=${selectedProj}` : link.href;

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
