'use client';

// ============================================================
// Research Publications Monitoring Page
// Real research records from arXiv & OpenAlex with verified URLs
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { IntelligenceNav } from '@/components/intelligence/intelligence-nav';
import { ResearchCard } from '@/components/intelligence/research-card';
import { EmptyState } from '@/components/intelligence/empty-state';
import type { IntelligenceItem } from '@/types';

export default function ResearchMonitoringPage() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';

  const [items, setItems] = useState<IntelligenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [minRelevance, setMinRelevance] = useState<number>(0);

  const fetchResearch = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (projectId) params.set('projectId', projectId);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedTopic) params.set('topic', selectedTopic);
      if (minRelevance > 0) params.set('minRelevance', String(minRelevance));

      const res = await fetch(`/api/intelligence/research?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [getToken, projectId, searchQuery, selectedTopic, minRelevance]);

  useEffect(() => {
    fetchResearch();
  }, [fetchResearch]);

  // Extract unique topics from items
  const uniqueTopics = Array.from(
    new Set(items.flatMap((i) => i.topics || []).filter(Boolean))
  );

  return (
    <div className="intel-page-container">
      <IntelligenceNav onRefresh={fetchResearch} />

      <div className="intel-subpage-header">
        <div>
          <h2 className="intel-subpage-title">Research Publications Monitoring</h2>
          <p className="intel-subpage-desc">
            Continuous surveillance of academic preprints, conference papers, and peer-reviewed journals.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="intel-filters-toolbar">
        <div className="intel-search-box">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search research publications by title, abstract or author..."
            className="intel-filter-input"
          />
        </div>

        <div className="intel-filter-dropdowns">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="intel-filter-select"
          >
            <option value="">All Topics</option>
            {uniqueTopics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={minRelevance}
            onChange={(e) => setMinRelevance(parseFloat(e.target.value))}
            className="intel-filter-select"
          >
            <option value="0">All Relevance</option>
            <option value="0.7">High Relevance (≥ 70%)</option>
            <option value="0.85">Very High Relevance (≥ 85%)</option>
          </select>
        </div>
      </div>

      {/* Items Feed */}
      {loading ? (
        <div className="intel-loading-container">
          <div className="app-loading-spinner" />
          <p>Fetching research publications...</p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No research publications found"
          description={
            searchQuery || selectedTopic
              ? 'No publications match your filter criteria. Try adjusting your search query.'
              : 'No research records collected yet. Active monitoring projects will automatically track arXiv and OpenAlex.'
          }
          actionText=""
        />
      ) : (
        <div className="intel-cards-feed">
          {items.map((item) => (
            <ResearchCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
