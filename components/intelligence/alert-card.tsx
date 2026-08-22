'use client';

// ============================================================
// Alert Card Component
// Displays real high-priority alerts with status actions
// ============================================================
import React from 'react';
import type { IntelligenceAlert } from '@/types';

interface AlertCardProps {
  alert: IntelligenceAlert;
  onMarkStatus: (alertId: string, status: 'read' | 'archived') => void;
}

export function AlertCard({ alert, onMarkStatus }: AlertCardProps) {
  const priorityClass = {
    critical: 'intel-alert-critical',
    high: 'intel-alert-high',
    medium: 'intel-alert-medium',
    low: 'intel-alert-low',
  }[alert.priority] || 'intel-alert-medium';

  const typeLabel = {
    high_impact_research: 'High-Impact Research',
    new_patent: 'New Patent',
    competitor_activity: 'Competitor Activity',
    industry_news: 'Important News',
    emerging_trend: 'Emerging Trend',
    major_activity_change: 'Activity Surge',
    keyword_match: 'Keyword Match',
  }[alert.type] || 'Intelligence Alert';

  return (
    <article className={`intel-card intel-alert-card ${priorityClass} ${alert.status === 'read' ? 'intel-alert-read' : ''}`}>
      <div className="intel-card-header">
        <div className="intel-alert-meta">
          <span className={`intel-priority-badge intel-priority-${alert.priority}`}>
            {alert.priority.toUpperCase()}
          </span>
          <span className="intel-alert-type">{typeLabel}</span>
          <span className="intel-dot-sep">•</span>
          <span className="intel-date">
            {new Date(alert.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <div className="intel-alert-actions">
          {alert.sourceUrl && (
            <a
              href={alert.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="intel-source-btn"
              title="Open verified source"
            >
              <span>Source</span>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 3H3C2.44772 3 2 3.44772 2 4V13C2 13.5523 2.44772 14 3 14H12C12.5523 14 13 13.5523 13 13V10M10 2H14M14 2V6M14 2L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}
          {alert.status === 'unread' && (
            <button
              onClick={() => onMarkStatus(alert.id, 'read')}
              className="intel-alert-btn"
              type="button"
              title="Mark as read"
            >
              Mark Read
            </button>
          )}
          {alert.status !== 'archived' && (
            <button
              onClick={() => onMarkStatus(alert.id, 'archived')}
              className="intel-alert-btn"
              type="button"
              title="Archive alert"
            >
              Archive
            </button>
          )}
        </div>
      </div>

      <h3 className="intel-card-title intel-alert-title">{alert.title}</h3>
      <p className="intel-alert-reason">{alert.reason}</p>

      {alert.sourceName && (
        <div className="intel-alert-source-footer">
          <span>Source: <strong>{alert.sourceName}</strong></span>
        </div>
      )}
    </article>
  );
}
