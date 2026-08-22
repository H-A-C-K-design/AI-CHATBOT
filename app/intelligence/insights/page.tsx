'use client';

// ============================================================
// AI Strategic Insights Page
// Synthesizes actionable strategic insights from real collected records
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { IntelligenceNav } from '@/components/intelligence/intelligence-nav';
import { InsightCard } from '@/components/intelligence/insight-card';
import { EmptyState } from '@/components/intelligence/empty-state';
import type { AIInsight } from '@/types';

export default function AIInsightsPage() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';

  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (projectId) params.set('projectId', projectId);

      const res = await fetch(`/api/intelligence/insights?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setInsights(data.insights || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [getToken, projectId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleGenerateInsights = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerateMsg('Analyzing real database records with AI reasoning engine...');

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/intelligence/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId: projectId || undefined }),
      });

      const data = await res.json();
      if (data.success) {
        setGenerateMsg(`Generated ${data.insights?.length || 0} strategic insight(s)!`);
        fetchInsights();
        setTimeout(() => setGenerateMsg(null), 4000);
      } else {
        setGenerateMsg(data.error || 'Failed to synthesize insights.');
        setTimeout(() => setGenerateMsg(null), 4000);
      }
    } catch (err) {
      setGenerateMsg((err as Error).message);
      setTimeout(() => setGenerateMsg(null), 4000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="intel-page-container">
      <IntelligenceNav onRefresh={fetchInsights} />

      <div className="intel-subpage-header">
        <div>
          <h2 className="intel-subpage-title">AI Strategic Insight Engine</h2>
          <p className="intel-subpage-desc">
            Evidence-backed actionable briefings synthesized from verified publications, patents, and competitor activity.
          </p>
        </div>

        <div className="intel-header-actions-row">
          {generateMsg && <span className="intel-run-status-badge">{generateMsg}</span>}
          <button
            onClick={handleGenerateInsights}
            disabled={isGenerating}
            className="intel-primary-btn"
            type="button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={isGenerating ? 'animate-spin' : ''}
              aria-hidden="true"
            >
              <path d="M8 2L10 6L14 7L11 10L12 14L8 12L4 14L5 10L2 7L6 6L8 2Z" fill="currentColor" />
            </svg>
            <span>{isGenerating ? 'Synthesizing...' : 'Synthesize Insights'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="intel-loading-container">
          <div className="app-loading-spinner" />
          <p>Loading strategic AI insights...</p>
        </div>
      ) : insights.length === 0 ? (
        <EmptyState
          title="No strategic insights generated yet"
          description="Click 'Synthesize Insights' to analyze your collected publications, patents, and competitor updates."
          actionText="Synthesize Insights Now"
          actionHref=""
          onActionClick={handleGenerateInsights}
        />
      ) : (
        <div className="intel-insights-feed">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
