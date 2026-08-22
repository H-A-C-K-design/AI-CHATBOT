'use client';

// ============================================================
// Research & Technology Trend Detection Engine
// Calculated dynamically from real stored records (No fake graphs)
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { IntelligenceNav } from '@/components/intelligence/intelligence-nav';
import { TrendChart } from '@/components/intelligence/trend-chart';
import { EmptyState } from '@/components/intelligence/empty-state';
import type { TrendRecord } from '@/types';

export default function ResearchTrendsPage() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId') || '';

  const [trends, setTrends] = useState<TrendRecord[]>([]);
  const [breakdown, setBreakdown] = useState<{
    emerging: TrendRecord[];
    growing: TrendRecord[];
    stable: TrendRecord[];
    declining: TrendRecord[];
  }>({ emerging: [], growing: [], stable: [], declining: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'emerging' | 'growing' | 'stable' | 'declining'>('all');

  const fetchTrends = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (projectId) params.set('projectId', projectId);

      const res = await fetch(`/api/intelligence/trends?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTrends(data.trends || []);
        if (data.breakdown) {
          setBreakdown(data.breakdown);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [getToken, projectId]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const handleSelectTopic = (topic: string) => {
    router.push(`/intelligence/research?topic=${encodeURIComponent(topic)}`);
  };

  const displayedTrends =
    activeTab === 'all'
      ? trends
      : breakdown[activeTab] || [];

  return (
    <div className="intel-page-container">
      <IntelligenceNav onRefresh={fetchTrends} />

      <div className="intel-subpage-header">
        <div>
          <h2 className="intel-subpage-title">Research Trend Detection Engine</h2>
          <p className="intel-subpage-desc">
            Algorithmic velocity tracking computed from real database publications, patent filings, and news volume over time.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="intel-loading-container">
          <div className="app-loading-spinner" />
          <p>Calculating trend velocity from historical records...</p>
        </div>
      ) : trends.length === 0 ? (
        <EmptyState
          title="No historical trend records found"
          description="Trend curves and velocities require intelligence records. Create a monitoring project to begin tracking topics."
          actionText=""
        />
      ) : (
        <div className="intel-trends-layout">
          {/* Main Visualizer Bar Chart */}
          <div className="intel-dashboard-card mb-6">
            <TrendChart trends={trends} onSelectTopic={handleSelectTopic} />
          </div>

          {/* Velocity Categories Filter Tabs */}
          <div className="intel-trend-categories-bar">
            <button
              onClick={() => setActiveTab('all')}
              className={`trend-cat-tab ${activeTab === 'all' ? 'trend-cat-active' : ''}`}
              type="button"
            >
              All Topics ({trends.length})
            </button>
            <button
              onClick={() => setActiveTab('emerging')}
              className={`trend-cat-tab ${activeTab === 'emerging' ? 'trend-cat-active' : ''}`}
              type="button"
            >
              Emerging Topics ({breakdown.emerging.length})
            </button>
            <button
              onClick={() => setActiveTab('growing')}
              className={`trend-cat-tab ${activeTab === 'growing' ? 'trend-cat-active' : ''}`}
              type="button"
            >
              High Growth ({breakdown.growing.length})
            </button>
            <button
              onClick={() => setActiveTab('stable')}
              className={`trend-cat-tab ${activeTab === 'stable' ? 'trend-cat-active' : ''}`}
              type="button"
            >
              Stable Topics ({breakdown.stable.length})
            </button>
            <button
              onClick={() => setActiveTab('declining')}
              className={`trend-cat-tab ${activeTab === 'declining' ? 'trend-cat-active' : ''}`}
              type="button"
            >
              Declining ({breakdown.declining.length})
            </button>
          </div>

          {/* Category Cards Grid */}
          <div className="intel-trend-grid">
            {displayedTrends.map((trend) => (
              <div
                key={trend.id}
                className="intel-trend-card"
                onClick={() => handleSelectTopic(trend.topic)}
                role="button"
                tabIndex={0}
              >
                <div className="intel-trend-card-top">
                  <span className={`intel-trend-badge intel-trend-${trend.status}`}>
                    {trend.status.toUpperCase()}
                  </span>
                  <span className="intel-trend-rate-big">
                    {trend.growthRate >= 0 ? `+${trend.growthRate}%` : `${trend.growthRate}%`}
                  </span>
                </div>

                <h3 className="intel-trend-card-name">{trend.topic}</h3>
                <p className="intel-trend-card-category">{trend.category} Category</p>

                <div className="intel-trend-card-metrics">
                  <div className="trend-metric-pill">
                    <span>📄 {trend.publicationCount} Papers</span>
                  </div>
                  <div className="trend-metric-pill">
                    <span>📜 {trend.patentCount} Patents</span>
                  </div>
                  <div className="trend-metric-pill">
                    <span>📰 {trend.newsCount} News</span>
                  </div>
                </div>

                <div className="intel-trend-card-footer">
                  <span>Click to view related intelligence items →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
