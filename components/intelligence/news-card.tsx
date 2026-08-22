'use client';

// ============================================================
// Industry News Card Component
// Displays verified market & competitor news with impact scores
// ============================================================
import React from 'react';
import type { IntelligenceItem } from '@/types';

interface NewsCardProps {
  item: IntelligenceItem;
}

export function NewsCard({ item }: NewsCardProps) {
  const publishedDate = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  const impactPct = Math.round((item.impactScore || 0) * 100);

  return (
    <article className="intel-card intel-news-card">
      <div className="intel-card-header">
        <div className="intel-card-meta">
          <span className="intel-badge intel-badge-news">Industry News</span>
          <span className="intel-source-name">{item.sourceName}</span>
          <span className="intel-dot-sep">•</span>
          <span className="intel-date">{publishedDate}</span>
        </div>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="intel-source-btn"
          title="Open original verified news article"
        >
          <span>Read Article</span>
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
        {item.organization && <span className="intel-org">{item.organization}</span>}
        {item.organization && item.topics.length > 0 && <span className="intel-dot-sep">•</span>}
        {item.topics.length > 0 && (
          <span className="intel-topic-badge">{item.topics[0]}</span>
        )}
      </div>

      {/* Impact Score Bar */}
      <div className="intel-score-single">
        <div className="intel-score-header">
          <span className="intel-score-label">Impact Score</span>
          <span className="intel-score-val">{impactPct}%</span>
        </div>
        <div className="intel-score-track">
          <div
            className="intel-score-bar intel-bar-indigo"
            style={{ width: `${impactPct}%` }}
          />
        </div>
      </div>

      {/* AI Summary */}
      <div className="intel-summary-block">
        <span className="intel-summary-label">AI Summary:</span>
        <p className="intel-summary-text">{item.summary || item.description}</p>
      </div>

      {item.whyItMatters && (
        <div className="intel-matters-block">
          <span className="intel-matters-label">Strategic Implication:</span>
          <p className="intel-matters-text">{item.whyItMatters}</p>
        </div>
      )}
    </article>
  );
}
