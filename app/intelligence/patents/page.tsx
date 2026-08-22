'use client';

// ============================================================
// Patent Watch Page
// Real patent filings from USPTO & global patent indexes
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { IntelligenceNav } from '@/components/intelligence/intelligence-nav';
import { PatentCard } from '@/components/intelligence/patent-card';
import { EmptyState } from '@/components/intelligence/empty-state';
import type { IntelligenceItem } from '@/types';

export default function PatentWatchPage() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';

  const [items, setItems] = useState<IntelligenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');

  const fetchPatents = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (projectId) params.set('projectId', projectId);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedAssignee) params.set('assignee', selectedAssignee);

      const res = await fetch(`/api/intelligence/patents?${params.toString()}`, {
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
  }, [getToken, projectId, searchQuery, selectedAssignee]);

  useEffect(() => {
    fetchPatents();
  }, [fetchPatents]);

  const uniqueAssignees = Array.from(
    new Set(items.map((i) => i.organization).filter(Boolean))
  ) as string[];

  return (
    <div className="intel-page-container">
      <IntelligenceNav onRefresh={fetchPatents} />

      <div className="intel-subpage-header">
        <div>
          <h2 className="intel-subpage-title">Patent Watch &amp; IP Intelligence</h2>
          <p className="intel-subpage-desc">
            Monitor patent disclosures, assignee filings, and technology claims across USPTO and international patent registers.
          </p>
        </div>
      </div>

      {/* Filters */}
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
            placeholder="Search patents by ID, title or technology classification..."
            className="intel-filter-input"
          />
        </div>

        <div className="intel-filter-dropdowns">
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="intel-filter-select"
          >
            <option value="">All Assignees / Applicants</option>
            {uniqueAssignees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Feed */}
      {loading ? (
        <div className="intel-loading-container">
          <div className="app-loading-spinner" />
          <p>Fetching patent filings from USPTO and patent repositories...</p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No patent records found"
          description={
            searchQuery || selectedAssignee
              ? 'No patent records match your filter. Try adjusting your query.'
              : 'No patent items recorded yet. Click "Run Monitoring" to index patent keywords from USPTO.'
          }
          actionText=""
        />
      ) : (
        <div className="intel-cards-feed">
          {items.map((item) => (
            <PatentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
