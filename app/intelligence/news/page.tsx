'use client';

// ============================================================
// Industry News Monitoring Page
// Real industry news and verified competitor developments
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { IntelligenceNav } from '@/components/intelligence/intelligence-nav';
import { NewsCard } from '@/components/intelligence/news-card';
import { EmptyState } from '@/components/intelligence/empty-state';
import type { IntelligenceItem } from '@/types';

export default function IndustryNewsPage() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';

  const [items, setItems] = useState<IntelligenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [minImpact, setMinImpact] = useState<number>(0);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (projectId) params.set('projectId', projectId);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedTopic) params.set('topic', selectedTopic);
      if (minImpact > 0) params.set('minImpact', String(minImpact));

      const res = await fetch(`/api/intelligence/news?${params.toString()}`, {
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
  }, [getToken, projectId, searchQuery, selectedTopic, minImpact]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const uniqueTopics = Array.from(
    new Set(items.flatMap((i) => i.topics || []).filter(Boolean))
  );

  return (
    <div className="intel-page-container">
      <IntelligenceNav onRefresh={fetchNews} />

      <div className="intel-subpage-header">
        <div>
          <h2 className="intel-subpage-title">Industry News &amp; Market Surveillance</h2>
          <p className="intel-subpage-desc">
            Verified tech industry reporting, product launches, and ecosystem developments.
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
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
            placeholder="Search verified news by headline or organization..."
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
            value={minImpact}
            onChange={(e) => setMinImpact(parseFloat(e.target.value))}
            className="intel-filter-select"
          >
            <option value="0">All Impact</option>
            <option value="0.75">High Impact (≥ 75%)</option>
            <option value="0.85">Critical Impact (≥ 85%)</option>
          </select>
        </div>
      </div>

      {/* News Feed */}
      {loading ? (
        <div className="intel-loading-container">
          <div className="app-loading-spinner" />
          <p>Loading verified news items...</p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No industry news items found"
          description={
            searchQuery || selectedTopic
              ? 'No news records match your filter criteria.'
              : 'No industry news collected yet. Click "Run Monitoring" to collect live developments.'
          }
          actionText=""
        />
      ) : (
        <div className="intel-cards-feed">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
