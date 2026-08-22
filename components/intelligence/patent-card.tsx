'use client';

// ============================================================
// Patent Card Component
// Displays real patent records, assignees, technology and AI summaries
// ============================================================
import React from 'react';
import type { IntelligenceItem } from '@/types';

interface PatentCardProps {
  item: IntelligenceItem;
}

export function PatentCard({ item }: PatentCardProps) {
  const publishedDate = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  const relevancePct = Math.round((item.relevanceScore || 0) * 100);
  const patentId = item.metadata?.patentId || item.metadata?.applicationId || item.id;
  const assignee = item.organization || item.metadata?.assignee || 'Patent Applicant';

  return (
    <article className="intel-card intel-patent-card">
      <div className="intel-card-header">
        <div className="intel-card-meta">
          <span className="intel-badge intel-badge-patent">Patent</span>
          <span className="intel-patent-id">{patentId}</span>
          <span className="intel-dot-sep">•</span>
          <span className="intel-date">{publishedDate}</span>
        </div>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="intel-source-btn"
          title="Open verified patent record"
        >
          <span>Patent Source</span>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 3H3C2.44772 3 2 3.44772 2 4V13C2 13.5523 2.44772 14 3 14H12C12.5523 14 13 13.5523 13 13V10M10 2H14M14 2V6M14 2L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      <h3 className="intel-card-title">
        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
          {item.title}
        </a>
      </h3>

      <div className="intel-patent-assignee">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Assignee / Applicant: <strong>{assignee}</strong></span>
      </div>

      {/* Technology Class & Keywords */}
      <div className="intel-tags-row">
        {item.topics.map((t, idx) => (
          <span key={`tech-${idx}`} className="intel-tag intel-tag-patent-tech">
            {t}
          </span>
        ))}
        {item.keywords.map((k, idx) => (
          <span key={`kw-${idx}`} className="intel-tag intel-tag-kw">
            #{k}
          </span>
        ))}
      </div>

      {/* Relevance Score Bar */}
      <div className="intel-score-single">
        <div className="intel-score-header">
          <span className="intel-score-label">Relevance Score</span>
          <span className="intel-score-val">{relevancePct}%</span>
        </div>
        <div className="intel-score-track">
          <div
            className="intel-score-bar intel-bar-purple"
            style={{ width: `${relevancePct}%` }}
          />
        </div>
      </div>

      {/* AI Summary */}
      <div className="intel-summary-block">
        <span className="intel-summary-label">Patent Abstract / AI Summary:</span>
        <p className="intel-summary-text">{item.summary || item.description}</p>
      </div>

      {item.whyItMatters && (
        <div className="intel-matters-block">
          <span className="intel-matters-label">Commercial / Technical Significance:</span>
          <p className="intel-matters-text">{item.whyItMatters}</p>
        </div>
      )}
    </article>
  );
}
