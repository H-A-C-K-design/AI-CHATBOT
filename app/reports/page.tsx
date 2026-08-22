'use client';

// ============================================================
// Intelligence Reports Page — Generate & View Comprehensive Briefings
// Derived strictly from actual stored database records
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
      if (projData.success) {
        setProjects(projData.projects || []);
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

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    setIsGenerating(true);
    setStatusMsg('Synthesizing executive briefing from real database records...');

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
          projectId: selectedProjectId,
          period: selectedPeriod,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg('Report generated successfully!');
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
      <div className="intel-subpage-header">
        <div>
          <h1 className="intel-subpage-title">Intelligence &amp; Executive Briefings</h1>
          <p className="intel-subpage-desc">
            Generate audit-ready intelligence reports synthesized directly from verified database records.
          </p>
        </div>
      </div>

      {/* Report Generator Controls */}
      <div className="report-generator-card">
        <h2 className="report-gen-title">Generate New Executive Briefing</h2>
        <form onSubmit={handleGenerateReport} className="report-gen-form">
          <div className="report-gen-row">
            <div className="wizard-form-group flex-1">
              <label htmlFor="report-proj">Monitoring Project</label>
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
                disabled={isGenerating || projects.length === 0}
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
                <span>{isGenerating ? 'Generating...' : 'Generate Report'}</span>
              </button>
            </div>
          </div>

          {statusMsg && <div className="report-status-notice">{statusMsg}</div>}
        </form>
      </div>

      {/* Reports History */}
      <div className="reports-list-section">
        <h2 className="reports-section-title">Saved Intelligence Reports</h2>

        {loading ? (
          <div className="intel-loading-container">
            <div className="app-loading-spinner" />
            <p>Loading generated reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            title="No reports generated yet"
            description="Select a monitoring project above and click 'Generate Report' to create your first comprehensive briefing."
            actionText=""
          />
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
                <p className="report-card-summary">{report.executiveSummary.slice(0, 180)}...</p>

                <div className="report-card-footer">
                  <span className="report-sources-count">
                    {report.sources?.length || 0} Verified Sources
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
