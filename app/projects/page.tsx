'use client';

// ============================================================
// Projects Management Page
// Configure, view, run, and delete user monitoring projects
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useProjectSession } from '@/lib/context/project-context';
import { EmptyState } from '@/components/intelligence/empty-state';
import type { MonitoringProject } from '@/types';

export default function ProjectsPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { createAndActivateProject, deleteProjectAndSync } = useProjectSession();

  const [projects, setProjects] = useState<MonitoringProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleRunProject = async (projectId: string) => {
    setRunningId(projectId);
    setStatusMsg('Running autonomous collection & AI scoring...');

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`/api/intelligence/projects/${projectId}/run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Finished! Collected ${data.result?.newItemsSaved || 0} new item(s).`);
        fetchProjects();
        setTimeout(() => setStatusMsg(null), 4000);
      } else {
        setStatusMsg(data.error || 'Monitoring encountered an issue.');
        setTimeout(() => setStatusMsg(null), 4000);
      }
    } catch (err) {
      setStatusMsg((err as Error).message);
      setTimeout(() => setStatusMsg(null), 4000);
    } finally {
      setRunningId(null);
    }
  };

  const handleToggleStatus = async (project: MonitoringProject) => {
    const nextStatus = project.status === 'active' ? 'paused' : 'active';
    try {
      const token = await getToken();
      if (!token) return;

      await fetch(`/api/intelligence/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchProjects();
    } catch {
      // silent
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this monitoring project and its collected intelligence?')) {
      return;
    }
    try {
      await deleteProjectAndSync(projectId);
      fetchProjects();
    } catch {
      // silent
    }
  };

  const handleQuickStart = async () => {
    try {
      setLoading(true);
      setStatusMsg('Deploying Generative AI & Autonomous Systems monitoring project...');

      const newProj = await createAndActivateProject({
        name: 'Generative AI & Autonomous Agent Systems',
        industry: 'Artificial Intelligence & Deep Learning',
        description: 'Continuous surveillance of large language models, agentic frameworks, multi-agent swarms, and patented neural architectures.',
        researchTopics: [
          'Large Language Models',
          'Autonomous Agents',
          'Reasoning & Inference',
          'Transformer Architecture',
        ],
        keywords: [
          'agentic workflows',
          'mixture of experts',
          'deepseek r1',
          'gemini flash',
          'chain of thought',
        ],
        competitors: [
          'OpenAI',
          'Anthropic',
          'Google DeepMind',
          'Meta AI',
        ],
        patentKeywords: [
          'neural network',
          'attention mechanism',
          'reinforcement learning',
          'distributed inference',
        ],
        frequency: 'daily',
        priorityThreshold: 0.75,
        notificationPreferences: {
          email: true,
          inApp: true,
          priorityThreshold: 'high',
        },
      });

      await fetchProjects();
      setStatusMsg(`✓ Project "${newProj.name}" active and saved in session!`);
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      setStatusMsg((err as Error).message);
      setTimeout(() => setStatusMsg(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="intel-page-container">
      <div className="intel-subpage-header">
        <div>
          <h1 className="intel-subpage-title">Monitoring Projects</h1>
          <p className="intel-subpage-desc">
            Manage your autonomous intelligence tracking jobs, keyword parameters, and source schedules.
          </p>
        </div>

        <div className="intel-header-actions-row">
          {statusMsg && <span className="intel-run-status-badge">{statusMsg}</span>}
          <Link href="/projects/new" className="intel-primary-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>Create Monitoring Project</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="intel-loading-container">
          <div className="app-loading-spinner" />
          <p>Loading monitoring projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No monitoring projects configured"
          description="Deploy an instant AI monitoring project with real live data, or configure a custom project with the 7-step wizard."
          actionText="Create Project with Wizard"
          actionHref="/projects/new"
          onQuickStart={handleQuickStart}
        />
      ) : (
        <div className="projects-grid">
          {projects.map((proj) => (
            <div key={proj.id} className="project-card">
              <div className="project-card-header">
                <div>
                  <div className="project-status-row">
                    <span
                      className={`project-status-dot ${
                        proj.status === 'active' ? 'dot-active' : 'dot-paused'
                      }`}
                    />
                    <span className="project-status-label capitalize">
                      {proj.status}
                    </span>
                    <span className="intel-dot-sep">•</span>
                    <span className="project-frequency capitalize">
                      {proj.frequency} Scan
                    </span>
                  </div>
                  <h2 className="project-card-name">{proj.name}</h2>
                </div>

                <span className="project-industry-badge">{proj.industry}</span>
              </div>

              {proj.description && (
                <p className="project-card-desc">{proj.description}</p>
              )}

              {/* Parameter Tags */}
              <div className="project-meta-sections">
                {proj.researchTopics && proj.researchTopics.length > 0 && (
                  <div className="proj-meta-group">
                    <span className="proj-meta-label">Research Topics:</span>
                    <div className="proj-tags-list">
                      {proj.researchTopics.map((t) => (
                        <span key={t} className="proj-tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {proj.keywords && proj.keywords.length > 0 && (
                  <div className="proj-meta-group">
                    <span className="proj-meta-label">Keywords:</span>
                    <div className="proj-tags-list">
                      {proj.keywords.map((k) => (
                        <span key={k} className="proj-tag">
                          #{k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {proj.competitors && proj.competitors.length > 0 && (
                  <div className="proj-meta-group">
                    <span className="proj-meta-label">Monitored Competitors:</span>
                    <div className="proj-tags-list">
                      {proj.competitors.map((c) => (
                        <span key={c} className="proj-tag proj-tag-comp">
                          🏢 {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="project-card-footer">
                <div className="project-last-run">
                  <span>Last run: </span>
                  <strong>
                    {proj.lastRunAt
                      ? new Date(proj.lastRunAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never'}
                  </strong>
                </div>

                <div className="project-actions-row">
                  <button
                    onClick={() => handleRunProject(proj.id)}
                    disabled={runningId === proj.id}
                    className="proj-action-btn proj-btn-run"
                    type="button"
                    title="Trigger monitoring run"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      className={runningId === proj.id ? 'animate-spin' : ''}
                      aria-hidden="true"
                    >
                      <path d="M14 8A6 6 0 1 1 8 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>{runningId === proj.id ? 'Running...' : 'Run Now'}</span>
                  </button>

                  <Link
                    href={`/intelligence?projectId=${proj.id}`}
                    className="proj-action-btn proj-btn-view"
                  >
                    View Intel
                  </Link>

                  <button
                    onClick={() => handleToggleStatus(proj)}
                    className="proj-action-btn proj-btn-toggle"
                    type="button"
                  >
                    {proj.status === 'active' ? 'Pause' : 'Resume'}
                  </button>

                  <button
                    onClick={() => handleDelete(proj.id)}
                    className="proj-action-btn proj-btn-delete"
                    type="button"
                    title="Delete project"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 4H13M5.5 4V3C5.5 2.448 5.948 2 6.5 2H9.5C10.052 2 10.5 2.448 10.5 3V4M6 7V12M10 7V12M4 4L4.5 13C4.5 13.552 4.948 14 5.5 14H10.5C11.052 14 11.5 13.552 11.5 13L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
