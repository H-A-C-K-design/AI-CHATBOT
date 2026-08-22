'use client';

// ============================================================
// Intelligence Empty State Component
// Zero-Mock Data Policy — Clear onboarding guidance
// ============================================================
import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onActionClick?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = 'No intelligence collected yet',
  description = 'Create a monitoring project to begin collecting verified research publications, patent filings, competitor developments, and industry news.',
  actionText = 'Create Monitoring Project',
  actionHref = '/projects/new',
  onActionClick,
  icon,
}: EmptyStateProps) {
  return (
    <div className="intel-empty-state">
      <div className="intel-empty-icon">
        {icon || (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <h3 className="intel-empty-title">{title}</h3>
      <p className="intel-empty-desc">{description}</p>
      {actionText && (
        <div className="intel-empty-action">
          {actionHref ? (
            <Link href={actionHref} className="intel-primary-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{actionText}</span>
            </Link>
          ) : (
            <button onClick={onActionClick} className="intel-primary-btn" type="button">
              <span>{actionText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
