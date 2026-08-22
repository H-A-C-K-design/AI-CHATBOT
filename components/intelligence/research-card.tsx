'use client';

// ============================================================
// Research Card Component
// Displays real academic & research records with verified sources
// ============================================================
import React from 'react';
import type { IntelligenceItem } from '@/types';

interface ResearchCardProps {
  item: IntelligenceItem;
}

export function ResearchCard({ item }: ResearchCardProps) {
  const publishedDate = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  const relevancePct = Math.round((item.relevanceScore || 0) * 100);
  const impactPct = Math.round((item.impactScore || 0) * 100);

  return (
    <article className="intel-card intel-research-card">
      <div className="intel-card-header">
        <div className="intel-card-meta">
          <span className="intel-badge intel-badge-research">Research</span>
          <span className="intel-source-name">{item.sourceName}</span>
          <span className="intel-dot-sep">•</span>
          <span className="intel-date">{publishedDate}</span>
        </div>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="intel-source-btn"
          title="Open original verified publication"
        >
          <span>Source</span>
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

      <div className="intel-authors-org">
        {item.author && <span className="intel-author">By {item.author}</span>}
        {item.author && item.organization && <span className="intel-dot-sep">•</span>}
        {item.organization && <span className="intel-org">{item.organization}</span>}
      </div>

      {/* Topics & Keywords */}
      <div className="intel-tags-row">
        {item.topics.map((t, idx) => (
          <span key={`topic-${idx}`} className="intel-tag intel-tag-topic">
            {t}
          </span>
        ))}
        {item.keywords.slice(0, 2).map((k, idx) => (
          <span key={`kw-${idx}`} className="intel-tag intel-tag-kw">
            #{k}
          </span>
        ))}
      </div>

      {/* Scores */}
      <div className="intel-scores-row">
        <div className="intel-score-item">
          <div className="intel-score-header">
            <span className="intel-score-label">Relevance</span>
            <span className="intel-score-val">{relevancePct}%</span>
          </div>
          <div className="intel-score-track">
            <div
              className="intel-score-bar intel-bar-emerald"
              style={{ width: `${relevancePct}%` }}
            />
          </div>
        </div>

        <div className="intel-score-item">
          <div className="intel-score-header">
            <span className="intel-score-label">Impact</span>
            <span className="intel-score-val">{impactPct}%</span>
          </div>
          <div className="intel-score-track">
            <div
              className="intel-score-bar intel-bar-indigo"
              style={{ width: `${impactPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="intel-summary-block">
        <span className="intel-summary-label">AI Summary:</span>
        <p className="intel-summary-text">{item.summary || item.description}</p>
      </div>

      {/* Why It Matters */}
      {item.whyItMatters && (
        <div className="intel-matters-block">
          <span className="intel-matters-label">Why It Matters:</span>
          <p className="intel-matters-text">{item.whyItMatters}</p>
        </div>
      )}
    </article>
  );
}
