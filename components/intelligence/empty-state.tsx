'use client';

// ============================================================
// Intelligence Empty State Component
// Responsive Onboarding + Instant 1-Click Starter with Live Data
// ============================================================
import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onActionClick?: () => void;
  onQuickStart?: () => void;
  isQuickStarting?: boolean;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = 'Your Intelligence Workspace',
  description = 'No monitoring projects yet. Create your first monitoring project to begin collecting research publications, patent filings, competitor developments, and industry intelligence.',
  actionText = 'Create Monitoring Project',
  actionHref = '/projects/new',
  onActionClick,
  onQuickStart,
  isQuickStarting = false,
  icon,
}: EmptyStateProps) {
  return (
    <div className="intel-empty-state">
      <div className="intel-empty-icon-wrap">
        <div className="intel-empty-icon-glow">
          {icon || (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      <h3 className="intel-empty-title">{title}</h3>
      <p className="intel-empty-desc">{description}</p>

      {/* Feature Highlights Matrix */}
      <div className="intel-empty-features-pills">
        <div className="empty-feat-pill">
          <span className="feat-icon">📄</span>
          <span>arXiv &amp; OpenAlex Preprints</span>
        </div>
        <div className="empty-feat-pill">
          <span className="feat-icon">⚖️</span>
          <span>USPTO &amp; Global Patents</span>
        </div>
        <div className="empty-feat-pill">
          <span className="feat-icon">🏢</span>
          <span>Competitor Surveillance</span>
        </div>
        <div className="empty-feat-pill">
          <span className="feat-icon">🤖</span>
          <span>Autonomous AI Scoring</span>
        </div>
      </div>

      {/* Dual Actions */}
      <div className="intel-empty-action-group">
        {onQuickStart && (
          <button
            onClick={onQuickStart}
            disabled={isQuickStarting}
            className="intel-quickstart-btn"
            type="button"
          >
            {isQuickStarting ? (
              <>
                <span className="spinner-mini" />
                <span>Deploying &amp; Querying Real Sources...</span>
              </>
            ) : (
              <>
                <span className="btn-sparkle">⚡</span>
                <span>Quick-Start: Deploy AI Monitoring with Live Data</span>
              </>
            )}
          </button>
        )}

        {actionText && (
          actionHref ? (
            <Link href={actionHref} className="intel-secondary-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{actionText}</span>
            </Link>
          ) : (
            <button onClick={onActionClick} className="intel-secondary-btn" type="button">
              <span>{actionText}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}
