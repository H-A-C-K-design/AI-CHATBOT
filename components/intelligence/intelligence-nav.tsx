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
  activeProjectId,
  onSelectProject,
}: IntelligenceNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();

  const [projects, setProjects] = useState<MonitoringProject[]>([]);
  const [selectedProj, setSelectedProj] = useState<string>(activeProjectId || searchParams.get('projectId') || '');

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
