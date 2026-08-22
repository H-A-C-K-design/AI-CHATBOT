'use client';

// ============================================================
// Intelligence Overview Dashboard
// Displays verified database statistics, activity, trends & alerts
// Strict No-Mock Policy — Pure Real Database State
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { IntelligenceNav } from '@/components/intelligence/intelligence-nav';
import { MetricCard } from '@/components/intelligence/metric-card';
import { ResearchCard } from '@/components/intelligence/research-card';
import { PatentCard } from '@/components/intelligence/patent-card';
import { NewsCard } from '@/components/intelligence/news-card';
import { AlertCard } from '@/components/intelligence/alert-card';
import { TrendChart } from '@/components/intelligence/trend-chart';
import { EmptyState } from '@/components/intelligence/empty-state';
import type { IntelligenceOverviewStats } from '@/types';

export default function IntelligenceOverviewPage() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<IntelligenceOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isQuickStarting, setIsQuickStarting] = useState(false);
  const [quickStartMsg, setQuickStartMsg] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/intelligence/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load intelligence data.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleQuickStart = async () => {
    try {
      setIsQuickStarting(true);
      setQuickStartMsg('Creating Generative AI & Autonomous Systems project...');
      const token = await getToken();
      if (!token) throw new Error('You must be signed in.');

      // 1. Create project
      const createRes = await fetch('/api/intelligence/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'Generative AI & Autonomous Agent Systems',
          industry: 'Artificial Intelligence & Deep Learning',
          description: 'Continuous surveillance of large language models, agentic frameworks, multi-agent swarms, and patented neural architectures.',
          researchTopics: [
            'Large Language Models',
            'Autonomous Agents',
            'Reasoning & Inference',
            'Transformer Architecture',
          ],
          keywords: [
            'agentic workflows',
            'mixture of experts',
            'deepseek r1',
            'gemini flash',
            'chain of thought',
          ],
          competitors: [
            'OpenAI',
            'Anthropic',
            'Google DeepMind',
            'Meta AI',
          ],
          patentKeywords: [
            'neural network',
            'attention mechanism',
            'reinforcement learning',
            'distributed inference',
          ],
          frequency: 'daily',
          priorityThreshold: 0.75,
          notificationPreferences: {
            email: true,
            inApp: true,
            priorityThreshold: 'high',
          },
        }),
      });

      const createData = await createRes.json();
      if (!createData.success) {
        throw new Error(createData.error || 'Failed to create starter project.');
      }

      const projectId = createData.project?.id;
      setQuickStartMsg('Querying real arXiv, OpenAlex, USPTO & tech news feeds...');

      // 2. Run initial monitoring ingestion
      if (projectId) {
        const runRes = await fetch(`/api/intelligence/projects/${projectId}/run`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const runData = await runRes.json();
        const count = runData.result?.newItemsSaved || 0;
        setQuickStartMsg(`Ingested ${count} verified records! Loading dashboard...`);
      }

      // 3. Reload dashboard
      await fetchOverview();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsQuickStarting(false);
      setTimeout(() => setQuickStartMsg(null), 4000);
    }
  };

  const handleAlertStatus = async (alertId: string, status: 'read' | 'archived') => {
    try {
      const token = await getToken();
      if (!token) return;

      await fetch('/api/intelligence/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ alertId, status }),
      });
      fetchOverview();
    } catch {
      // silent
    }
  };

  const hasProjects = stats && stats.projects.total > 0;
  const hasItems = stats && stats.activity.totalItems > 0;

  return (
    <div className="intel-page-container">
      <IntelligenceNav onRefresh={fetchOverview} />

      {quickStartMsg && (
        <div className="intel-toast-banner" role="status">
          <span className="spinner-mini" />
          <span>{quickStartMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="intel-loading-container">
          <div className="app-loading-spinner" />
          <p>Loading verified intelligence from database...</p>
        </div>
      ) : error ? (
        <div className="intel-error-container">
          <p>{error}</p>
          <button onClick={fetchOverview} className="intel-primary-btn" type="button">
            Retry
          </button>
        </div>
      ) : !hasProjects ? (
        <EmptyState
          title="Your Intelligence Workspace"
          description="No monitoring projects configured yet. Deploy an instant AI monitoring project with real live data, or configure a custom project with the 7-step wizard."
          actionText="Create Custom Project (Wizard)"
          actionHref="/projects/new"
          onQuickStart={handleQuickStart}
          isQuickStarting={isQuickStarting}
        />
      ) : (
        <div className="intel-dashboard-grid">
          {/* Section 1: Top Metrics Grid */}
          <section className="intel-metrics-grid" aria-label="Key Intelligence Metrics">
            <MetricCard
              label="Active Projects"
              value={stats.projects.active}
              subtext={`${stats.projects.total} total configured`}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              }
            />

            <MetricCard
              label="Research Publications"
              value={stats.activity.researchCount}
              subtext="Verified arXiv &amp; OpenAlex"
              trend="up"
              change={stats.activity.researchCount > 0 ? 'Verified' : undefined}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              }
            />

            <MetricCard
              label="Patents Tracked"
              value={stats.activity.patentCount}
              subtext="USPTO &amp; Global Filings"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />

            <MetricCard
              label="Competitor &amp; News"
              value={stats.activity.competitorCount + stats.activity.newsCount}
              subtext="Verified Announcements"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              }
            />

            <MetricCard
              label="Active Alerts"
              value={stats.alerts.totalUnread}
              subtext={`${stats.alerts.criticalCount} Critical Priority`}
              trend={stats.alerts.totalUnread > 0 ? 'down' : 'neutral'}
              change={stats.alerts.totalUnread > 0 ? 'Requires Action' : undefined}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
          </section>

          {/* Section 2: Trends & Alerts Row */}
          <div className="intel-dashboard-split-row">
            {/* Historical Trends */}
            <div className="intel-dashboard-card intel-trends-panel">
              <div className="intel-panel-header">
                <h2>Emerging Research &amp; Technology Trends</h2>
              </div>
              <TrendChart trends={stats.topTrends} />
            </div>

            {/* High Priority Alerts */}
            <div className="intel-dashboard-card intel-alerts-panel">
              <div className="intel-panel-header">
                <h2>High Priority Alerts</h2>
                <span className="intel-alerts-count">{stats.highPriorityAlerts.length} Active</span>
              </div>

              {stats.highPriorityAlerts.length === 0 ? (
                <div className="intel-empty-panel">
                  <p>No high-priority alerts triggered. Threshold scoring engine is active.</p>
                </div>
              ) : (
                <div className="intel-alerts-stack">
                  {stats.highPriorityAlerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onMarkStatus={handleAlertStatus}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Recent Verified Intelligence Stream */}
          <section className="intel-recent-stream" aria-label="Recent Intelligence Records">
            <div className="intel-stream-header">
              <h2>Recent Verified Intelligence Stream</h2>
              <p>Latest publications, patent disclosures, and competitor announcements</p>
            </div>

            {!hasItems ? (
              <EmptyState
                title="No intelligence items collected yet"
                description="Create a monitoring project to start tracking publications from arXiv, OpenAlex, USPTO, and industry sources."
                actionText=""
              />
            ) : (
              <div className="intel-cards-feed">
                {stats.recentItems.map((item) => {
                  if (item.type === 'patent') {
                    return <PatentCard key={item.id} item={item} />;
                  }
                  if (item.type === 'research') {
                    return <ResearchCard key={item.id} item={item} />;
                  }
                  return <NewsCard key={item.id} item={item} />;
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
