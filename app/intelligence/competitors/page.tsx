'use client';

// ============================================================
// Competitor Watch Page
// Monitored competitor activity, patent tracking & news surveillance
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { IntelligenceNav } from '@/components/intelligence/intelligence-nav';
import { CompetitorCard } from '@/components/intelligence/competitor-card';
import { EmptyState } from '@/components/intelligence/empty-state';
import type { MonitoringProject } from '@/types';

export default function CompetitorWatchPage() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';

  const [competitors, setCompetitors] = useState<any[]>([]);
  const [projects, setProjects] = useState<MonitoringProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [selectedTargetProject, setSelectedTargetProject] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchCompetitors = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (projectId) params.set('projectId', projectId);

      const [compRes, projRes] = await Promise.all([
        fetch(`/api/intelligence/competitors?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/intelligence/projects', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const compData = await compRes.json();
      const projData = await projRes.json();

      if (compData.success) {
        setCompetitors(compData.competitors || []);
      }
      if (projData.success) {
        setProjects(projData.projects || []);
        if (projData.projects.length > 0 && !selectedTargetProject) {
          setSelectedTargetProject(projData.projects[0].id);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [getToken, projectId, selectedTargetProject]);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim() || !selectedTargetProject) return;

    setIsAdding(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/intelligence/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: selectedTargetProject,
          competitorName: newCompName.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewCompName('');
        setShowAddModal(false);
        fetchCompetitors();
      }
    } catch {
      // silent
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="intel-page-container">
      <IntelligenceNav onRefresh={fetchCompetitors} />

      <div className="intel-subpage-header">
        <div>
          <h2 className="intel-subpage-title">Competitor Watch &amp; Market Intelligence</h2>
          <p className="intel-subpage-desc">
            Monitor real-time research output, patent filings, and verified announcements from key competitors.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="intel-primary-btn"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>Add Competitor</span>
        </button>
      </div>

      {/* Add Competitor Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Competitor to Monitor</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="modal-close-btn"
                type="button"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCompetitor} className="modal-body">
              <div className="wizard-form-group">
                <label htmlFor="modal-comp-name">Competitor Name *</label>
                <input
                  id="modal-comp-name"
                  type="text"
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  placeholder="e.g. Anthropic, SentinelOne, Darktrace"
                  className="wizard-input"
                  autoFocus
                  required
                />
              </div>

              <div className="wizard-form-group">
                <label htmlFor="modal-comp-proj">Target Monitoring Project</label>
                <select
                  id="modal-comp-proj"
                  value={selectedTargetProject}
                  onChange={(e) => setSelectedTargetProject(e.target.value)}
                  className="wizard-select"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="wizard-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="wizard-submit-btn"
                >
                  {isAdding ? 'Adding...' : 'Add Competitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Competitors List */}
      {loading ? (
        <div className="intel-loading-container">
          <div className="app-loading-spinner" />
          <p>Loading competitor intelligence...</p>
        </div>
      ) : competitors.length === 0 ? (
        <EmptyState
          title="No competitors configured yet"
          description="Add competitor organizations to monitor their research publications, patent filings, and industry announcements."
          actionText="Add Monitored Competitor"
          actionHref=""
          onActionClick={() => setShowAddModal(true)}
        />
      ) : (
        <div className="intel-competitors-grid">
          {competitors.map((comp) => (
            <CompetitorCard key={comp.name} competitor={comp} />
          ))}
        </div>
      )}
    </div>
  );
}
