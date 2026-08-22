'use client';

// ============================================================
// Competitor Card Component
// Displays real monitored competitor activity & verified developments
// Shows "Insufficient verified data" when no real items exist
// ============================================================
import React from 'react';

interface CompetitorData {
  name: string;
  projectNames?: string[];
  researchCount: number;
  patentCount: number;
  newsCount: number;
  latestItem?: {
    title: string;
    date: string;
    sourceUrl: string;
    type: string;
    summary: string;
  };
  items?: any[];
}

interface CompetitorCardProps {
  competitor: CompetitorData;
}

export function CompetitorCard({ competitor }: CompetitorCardProps) {
  const totalActivity =
    competitor.researchCount + competitor.patentCount + competitor.newsCount;

  const hasData = totalActivity > 0;

  return (
    <article className="intel-card intel-competitor-card">
      <div className="intel-card-header">
        <div className="intel-competitor-brand">
          <div className="intel-competitor-avatar">
            {competitor.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="intel-competitor-name">{competitor.name}</h3>
            {competitor.projectNames && competitor.projectNames.length > 0 && (
              <span className="intel-competitor-projects">
                Monitored in: {competitor.projectNames.join(', ')}
              </span>
            )}
          </div>
        </div>
        <span
          className={`intel-badge ${
            hasData ? 'intel-badge-active' : 'intel-badge-pending'
          }`}
        >
          {hasData ? 'Active Monitoring' : 'Pending Signals'}
        </span>
      </div>

      {/* Activity Breakdown Counters */}
      <div className="intel-competitor-stats">
        <div className="intel-comp-stat-col">
          <span className="intel-comp-stat-val">{competitor.researchCount}</span>
          <span className="intel-comp-stat-lbl">Research Papers</span>
        </div>
        <div className="intel-comp-stat-col">
          <span className="intel-comp-stat-val">{competitor.patentCount}</span>
          <span className="intel-comp-stat-lbl">Patents</span>
        </div>
        <div className="intel-comp-stat-col">
          <span className="intel-comp-stat-val">{competitor.newsCount}</span>
          <span className="intel-comp-stat-lbl">News / Updates</span>
        </div>
      </div>

      {/* Latest Verified Intelligence or Insufficient Verified Data Notice */}
      {hasData && competitor.latestItem ? (
        <div className="intel-competitor-latest">
          <div className="intel-latest-header">
            <span className="intel-latest-tag">Latest Intelligence:</span>
            <span className="intel-latest-date">
              {new Date(competitor.latestItem.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <h4 className="intel-latest-title">{competitor.latestItem.title}</h4>
          <p className="intel-latest-summary">{competitor.latestItem.summary}</p>
          <a
            href={competitor.latestItem.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="intel-source-link-inline"
          >
            <span>View Verified Source</span>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 3H3C2.44772 3 2 3.44772 2 4V13C2 13.5523 2.44772 14 3 14H12C12.5523 14 13 13.5523 13 13V10M10 2H14M14 2V6M14 2L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      ) : (
        <div className="intel-insufficient-data-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>Insufficient verified data for {competitor.name}. Run monitoring or trigger ingestion.</span>
        </div>
      )}
    </article>
  );
}
