'use client';

// ============================================================
// AI Insight Card Component
// Actionable Strategic Intelligence with Clear Fact vs AI Interpretation
// ============================================================
import React from 'react';
import type { AIInsight } from '@/types';

interface InsightCardProps {
  insight: AIInsight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const confidencePct = Math.round((insight.confidenceScore || 0) * 100);

  return (
    <article className="intel-card intel-insight-card">
      <div className="intel-card-header">
        <div className="intel-card-meta">
          <span className="intel-badge intel-badge-insight">AI Strategic Insight</span>
          <span className="intel-dot-sep">•</span>
          <span className="intel-date">
            {new Date(insight.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="intel-confidence-badge" title="AI Reasoning Confidence">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2L10 6L14 7L11 10L12 14L8 12L4 14L5 10L2 7L6 6L8 2Z" fill="currentColor" />
          </svg>
          <span>{confidencePct}% Confidence</span>
        </div>
      </div>

      <h3 className="intel-card-title intel-insight-title">{insight.title}</h3>

      {/* 1. Verified What Happened */}
      <div className="intel-insight-section intel-section-fact">
        <div className="intel-section-title">
          <span className="intel-section-tag intel-tag-verified">Verified Finding</span>
          <span>What Happened?</span>
        </div>
        <p className="intel-section-desc">{insight.whatHappened}</p>
      </div>

      {/* 2. Strategic Interpretation */}
      <div className="intel-insight-section intel-section-interpretation">
        <div className="intel-section-title">
          <span className="intel-section-tag intel-tag-ai">AI Analysis</span>
          <span>Why It Matters</span>
        </div>
        <p className="intel-section-desc">{insight.whyItMatters}</p>
      </div>

      {/* 3. Opportunities & Risks Grid */}
      <div className="intel-opp-risk-grid">
        <div className="intel-opp-box">
          <div className="intel-opp-header">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>Potential Opportunity</span>
          </div>
          <p>{insight.potentialOpportunity}</p>
        </div>

        <div className="intel-risk-box">
          <div className="intel-risk-header">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 5V9M8 12H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span>Potential Risk</span>
          </div>
          <p>{insight.potentialRisk}</p>
        </div>
      </div>

      {/* 4. Recommended Action */}
      <div className="intel-action-box">
        <div className="intel-action-header">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 8L7 11L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Recommended Action</span>
        </div>
        <p>{insight.recommendedAction}</p>
      </div>

      {/* 5. Supporting Sources */}
      {insight.supportingSources && insight.supportingSources.length > 0 && (
        <div className="intel-sources-footer">
          <span className="intel-sources-label">Supporting Verified Sources:</span>
          <div className="intel-sources-list">
            {insight.supportingSources.map((src, idx) => (
              <a
                key={`src-${idx}`}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="intel-source-chip"
              >
                <span>{src.title}</span>
                <span className="intel-source-chip-name">({src.sourceName})</span>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 3H3C2.44772 3 2 3.44772 2 4V13C2 13.5523 2.44772 14 3 14H12C12.5523 14 13 13.5523 13 13V10M10 2H14M14 2V6M14 2L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
