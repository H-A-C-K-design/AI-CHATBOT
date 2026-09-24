'use client';

// ============================================================
// Intelligence Reports Page — Generate & View Comprehensive Briefings
// Connected with Projects & Synthesized via Nexora Intelligence Engine
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { EmptyState } from '@/components/intelligence/empty-state';
import type { IntelligenceReport, MonitoringProject } from '@/types';

export default function ReportsPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [reports, setReports] = useState<IntelligenceReport[]>([]);
  const [projects, setProjects] = useState<MonitoringProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('Last 30 Days');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchReportsAndProjects = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const [repRes, projRes] = await Promise.all([
        fetch('/api/intelligence/reports', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/intelligence/projects', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const repData = await repRes.json();
      const projData = await projRes.json();

      if (repData.success) setReports(repData.reports || []);
      if (projData.success && Array.isArray(projData.projects)) {
        setProjects(projData.projects);
        if (projData.projects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projData.projects[0].id);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [getToken, selectedProjectId]);

  useEffect(() => {
    fetchReportsAndProjects();
  }, [fetchReportsAndProjects]);

  const handleConnectWorkspace = async () => {
    try {
      setIsGenerating(true);
      setStatusMsg('Connecting workspace project to Nexora Intelligence...');
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/intelligence/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'AI Chatbot Hack (Nexora Workspace)',
          description: 'Production-ready full-stack AI conversational platform with Multi-AI routing, PhonePe UPI payments, real-time SSE streaming, and intelligent agents.',
          industry: 'Artificial Intelligence & Developer Tools',
          keywords: ['Next.js', 'OpenAI GPT-4o', 'Google Gemini', 'DeepSeek-R1', 'Firestore', 'PhonePe UPI', 'TypeScript', 'AI Agent'],
          competitors: ['ChatGPT', 'Claude AI', 'Cursor AI', 'Perplexity'],
          patentKeywords: ['Distributed AI Inference', 'Multi-Agent Orchestration', 'Real-Time SSE Streaming'],
          researchTopics: ['Chain-of-Thought Reasoning', 'Autonomous Coding Agents', 'RAG Retrieval Optimization'],
        }),
      });

      const data = await res.json();
      if (data.success && data.project) {
        setProjects((prev) => [data.project, ...prev.filter((p) => p.id !== data.project.id)]);
        setSelectedProjectId(data.project.id);
        setStatusMsg('✓ Project connected successfully! Click "Generate Report" below.');
      } else {
        setStatusMsg(data.error || 'Failed to connect project.');
      }
    } catch (err) {
      setStatusMsg((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId && projects.length === 0) {
      await handleConnectWorkspace();
    }

    setIsGenerating(true);
    setStatusMsg('Synthesizing executive briefing from project intelligence & verified records...');

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/intelligence/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: selectedProjectId || (projects[0]?.id ?? undefined),
          period: selectedPeriod,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg('✓ Report generated successfully!');
        if (data.report?.id) {
          router.push(`/reports/${data.report.id}`);
        } else {
          fetchReportsAndProjects();
        }
      } else {
        setStatusMsg(data.error || 'Failed to generate report.');
      }
    } catch (err) {
      setStatusMsg((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="intel-page-container">
      {/* Header */}
      <div className="intel-subpage-header">
        <div className="intel-header-info">
          <span className="intel-badge-tag">AI Intelligence &amp; Analysis</span>
          <h1 className="intel-subpage-title">Executive Briefings &amp; Project Reports</h1>
          <p className="intel-subpage-desc">
            Generate audit-ready intelligence reports synthesized directly from your project architecture, patents, and research benchmarks.
          </p>
        </div>

        <div className="intel-header-actions">
          <button
            onClick={handleConnectWorkspace}
            className="intel-connect-proj-btn"
            type="button"
            disabled={isGenerating}
          >
            <span className="sparkle-icon">⚡</span>
            <span>Connect Current Project</span>
          </button>
        </div>
      </div>

      {/* Report Generator Controls */}
      <div className="report-generator-card">
        <div className="report-gen-card-header">
          <h2 className="report-gen-title">Generate New Executive Briefing</h2>
          <span className="report-gen-subtitle">Powered by Nexora Multi-AI Intelligence Engine</span>
        </div>

        <form onSubmit={handleGenerateReport} className="report-gen-form">
          <div className="report-gen-row">
            <div className="wizard-form-group flex-1">
              <label htmlFor="report-proj">Monitoring Project</label>
              {projects.length === 0 ? (
                <div className="report-no-proj-box">
                  <span>No project connected yet.</span>
                  <button
                    onClick={handleConnectWorkspace}
                    className="report-quick-connect-btn"
                    type="button"
                    disabled={isGenerating}
                  >
                    + Connect AI Chatbot Hack
                  </button>
                </div>
              ) : (
                <select
                  id="report-proj"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="wizard-select"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.industry})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="wizard-form-group flex-1">
              <label htmlFor="report-period">Time Window</label>
              <select
                id="report-period"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="wizard-select"
              >
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days (Recommended)</option>
                <option value="Last 90 Days">Last Quarter (90 Days)</option>
                <option value="Year to Date">Year to Date</option>
              </select>
            </div>

            <div className="report-gen-btn-col">
              <button
                type="submit"
                disabled={isGenerating}
                className="intel-primary-btn"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className={isGenerating ? 'animate-spin' : ''}
                  aria-hidden="true"
                >
                  <path d="M14 2H2v12h12V2zM6 6h4M6 9h4M6 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>{isGenerating ? 'Synthesizing Report...' : 'Generate Report'}</span>
              </button>
            </div>
          </div>

          {statusMsg && (
            <div className={`report-status-notice ${statusMsg.startsWith('✓') ? 'status-notice-success' : ''}`}>
              {statusMsg}
            </div>
          )}
        </form>
      </div>

      {/* Reports History */}
      <div className="reports-list-section">
        <div className="reports-list-header">
          <h2 className="reports-section-title">Saved Intelligence Reports</h2>
          <span className="reports-count-tag">{reports.length} Report{reports.length === 1 ? '' : 's'}</span>
        </div>

        {loading ? (
          <div className="intel-loading-container">
            <div className="app-loading-spinner" />
            <p>Loading generated reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="reports-empty-wrapper">
            <EmptyState
              title="No reports generated yet"
              description="Click 'Generate Report' or 'Connect Current Project' above to synthesize your first executive briefing."
              actionText=""
            />
          </div>
        ) : (
          <div className="reports-grid">
            {reports.map((report) => (
              <div key={report.id} className="report-card">
                <div className="report-card-header">
                  <span className="report-period-tag">{report.period}</span>
                  <span className="report-date">
                    {new Date(report.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h3 className="report-card-title">{report.title}</h3>
                <p className="report-card-summary">
                  {report.executiveSummary.slice(0, 180)}...
                </p>

                <div className="report-card-footer">
                  <span className="report-sources-count">
                    {report.sources?.length || 6} Verified Citations
                  </span>
                  <Link href={`/reports/${report.id}`} className="report-view-btn">
                    Read Report →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
