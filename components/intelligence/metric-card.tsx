'use client';

// ============================================================
// Intelligence Metric Card Component
// Glass-style summary metric with icons and status
// ============================================================
import React from 'react';

interface MetricCardProps {
  label: string;
  value: number | string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  subtext?: string;
}

export function MetricCard({
  label,
  value,
  change,
  trend = 'neutral',
  icon,
  subtext,
}: MetricCardProps) {
  return (
    <div className="intel-metric-card">
      <div className="intel-metric-header">
        <span className="intel-metric-label">{label}</span>
        {icon && <div className="intel-metric-icon">{icon}</div>}
      </div>
      <div className="intel-metric-body">
        <span className="intel-metric-value">{value}</span>
        {change && (
          <span className={`intel-metric-change intel-change-${trend}`}>
            {change}
          </span>
        )}
      </div>
      {subtext && <span className="intel-metric-subtext">{subtext}</span>}
    </div>
  );
}
