'use client';

// ============================================================
// Single Intelligence Report Detail Viewer
// Professional executive layout with verified source citations
// ============================================================
import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import type { IntelligenceReport } from '@/types';

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getToken } = useAuth();

  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) return;

        const res = await fetch(`/api/intelligence/reports/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setReport(data.report);
        } else {
          setError(data.error || 'Report not found.');
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [id, getToken]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="intel-page-container">
        <div className="intel-loading-container">
          <div className="app-loading-spinner" />
          <p>Loading executive briefing...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="intel-page-container">
        <div className="intel-error-container">
          <p>{error || 'Report not found.'}</p>
          <Link href="/reports" className="intel-primary-btn">
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="intel-page-container report-detail-page">
      {/* Detail Toolbar */}
      <div className="report-detail-toolbar no-print">
        <Link href="/reports" className="wizard-back-link">
          ← Back to Reports
        </Link>
        <button onClick={handlePrint} className="intel-secondary-btn" type="button">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 6V2H12V6M4 12H12M4 14H12V10H4V14ZM13 7.5A.5.5 0 1 1 12 7.5A.5.5 0 0 1 13 7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Report Document Sheet */}
      <article className="report-document-sheet">
        {/* Document Header */}
        <header className="report-doc-header">
          <div className="report-doc-badge">NEXORA AI EXECUTIVE INTELLIGENCE</div>
          <h1 className="report-doc-title">{report.title}</h1>
          <div className="report-doc-meta">
            <span><strong>Project:</strong> {report.projectName || 'Active Intelligence Workspace'}</span>
            <span className="intel-dot-sep">•</span>
            <span><strong>Period:</strong> {report.period}</span>
            <span className="intel-dot-sep">•</span>
            <span><strong>Generated:</strong> {new Date(report.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}</span>
          </div>
        </header>

        {/* 1. Executive Summary */}
        <section className="report-doc-section">
          <h2 className="report-section-heading">1. Executive Summary</h2>
          <div className="report-section-body">
            <p className="report-lead-text">{report.executiveSummary}</p>
          </div>
        </section>

        {/* 2. Key Research Developments */}
        {report.keyResearchDevelopments && report.keyResearchDevelopments.length > 0 && (
          <section className="report-doc-section">
            <h2 className="report-section-heading">2. Key Research Developments</h2>
            <ul className="report-bullet-list">
              {report.keyResearchDevelopments.map((dev, idx) => (
                <li key={idx} className="report-bullet-item">{dev}</li>
              ))}
            </ul>
          </section>
        )}

        {/* 3. Patent Developments */}
        {report.patentDevelopments && report.patentDevelopments.length > 0 && (
          <section className="report-doc-section">
            <h2 className="report-section-heading">3. Patent &amp; Intellectual Property Developments</h2>
            <ul className="report-bullet-list">
              {report.patentDevelopments.map((p, idx) => (
                <li key={idx} className="report-bullet-item">{p}</li>
              ))}
            </ul>
          </section>
        )}

        {/* 4. Competitor Activity */}
        {report.competitorActivity && report.competitorActivity.length > 0 && (
          <section className="report-doc-section">
            <h2 className="report-section-heading">4. Monitored Competitor Activity</h2>
            <ul className="report-bullet-list">
              {report.competitorActivity.map((c, idx) => (
                <li key={idx} className="report-bullet-item">{c}</li>
              ))}
            </ul>
          </section>
        )}

        {/* 5. Industry News & Announcements */}
        {report.industryNews && report.industryNews.length > 0 && (
          <section className="report-doc-section">
            <h2 className="report-section-heading">5. Industry News &amp; Market Announcements</h2>
            <ul className="report-bullet-list">
              {report.industryNews.map((n, idx) => (
                <li key={idx} className="report-bullet-item">{n}</li>
              ))}
            </ul>
          </section>
        )}

        {/* 6. Emerging Trends */}
        {report.emergingTrends && report.emergingTrends.length > 0 && (
          <section className="report-doc-section">
            <h2 className="report-section-heading">6. Emerging Technology Trends</h2>
            <ul className="report-bullet-list">
              {report.emergingTrends.map((t, idx) => (
                <li key={idx} className="report-bullet-item">{t}</li>
              ))}
            </ul>
          </section>
        )}

        {/* 7. Risks & Opportunities Matrix */}
        <section className="report-doc-section">
          <h2 className="report-section-heading">7. Strategic Risk &amp; Opportunity Assessment</h2>
          <div className="report-matrix-grid">
            <div className="report-matrix-col report-matrix-opp">
              <h3>Strategic Opportunities</h3>
              <ul>
                {report.opportunities?.map((opp, idx) => (
                  <li key={idx}>{opp}</li>
                ))}
              </ul>
            </div>
            <div className="report-matrix-col report-matrix-risk">
              <h3>Identified Risks</h3>
              <ul>
                {report.risks?.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 8. Recommended Actions */}
        {report.recommendedActions && report.recommendedActions.length > 0 && (
          <section className="report-doc-section">
            <h2 className="report-section-heading">8. Recommended Action Items</h2>
            <div className="report-actions-box">
              <ol className="report-numbered-list">
                {report.recommendedActions.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* 9. Verified Sources */}
        {report.sources && report.sources.length > 0 && (
          <section className="report-doc-section report-sources-section">
            <h2 className="report-section-heading">9. Audit Trail &amp; Verified Sources</h2>
            <div className="report-sources-table-wrapper">
              <table className="report-sources-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Document / Headline</th>
                    <th>Source Repository</th>
                    <th>Verified Link</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sources.map((src, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td className="font-medium">{src.title}</td>
                      <td>{src.sourceName}</td>
                      <td>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="report-table-link"
                        >
                          Open Source ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
