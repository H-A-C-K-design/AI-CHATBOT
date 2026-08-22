'use client';

// ============================================================
// Research Trend Chart & Visualizer Component
// Derived dynamically from real database records (No hardcoded graphs)
// ============================================================
import React from 'react';
import type { TrendRecord } from '@/types';

interface TrendChartProps {
  trends: TrendRecord[];
  onSelectTopic?: (topic: string) => void;
}

export function TrendChart({ trends, onSelectTopic }: TrendChartProps) {
  if (trends.length === 0) {
    return (
      <div className="intel-trend-empty">
        <p>No historical trend records found yet. Collect intelligence items to generate trend velocities.</p>
      </div>
    );
  }

  const maxCount = Math.max(...trends.map((t) => t.itemCount), 1);

  return (
    <div className="intel-trend-visualizer">
      <div className="intel-trend-header">
        <div>
          <h3 className="intel-trend-title">Topic Velocity &amp; Distribution</h3>
          <p className="intel-trend-subtitle">Calculated dynamically from verified stored publications, patents, and news</p>
        </div>
      </div>

      <div className="intel-trend-bars-list">
        {trends.map((trend) => {
          const barWidth = Math.max(12, Math.round((trend.itemCount / maxCount) * 100));

          const statusBadge = {
            emerging: 'intel-trend-emerging',
            growing: 'intel-trend-growing',
            stable: 'intel-trend-stable',
            declining: 'intel-trend-declining',
          }[trend.status];

          return (
            <div
              key={trend.id}
              className="intel-trend-row"
              onClick={() => onSelectTopic?.(trend.topic)}
              role="button"
              tabIndex={0}
            >
              <div className="intel-trend-left">
                <div className="intel-trend-topic-header">
                  <span className="intel-trend-topic-name">{trend.topic}</span>
                  <span className={`intel-trend-badge ${statusBadge}`}>
                    {trend.status.toUpperCase()}
                  </span>
                  <span className="intel-trend-rate">
                    {trend.growthRate >= 0 ? `+${trend.growthRate}%` : `${trend.growthRate}%`}
                  </span>
                </div>

                <div className="intel-trend-bar-wrapper">
                  <div
                    className={`intel-trend-bar ${
                      trend.status === 'emerging' || trend.status === 'growing'
                        ? 'intel-trend-bar-up'
                        : 'intel-trend-bar-neutral'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>

              <div className="intel-trend-breakdown">
                <span title="Research Publications" className="intel-tb-item">
                  📄 {trend.publicationCount}
                </span>
                <span title="Patents" className="intel-tb-item">
                  📜 {trend.patentCount}
                </span>
                <span title="News & Competitors" className="intel-tb-item">
                  📰 {trend.newsCount + trend.competitorCount}
                </span>
                <span className="intel-tb-total">
                  {trend.itemCount} items
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
