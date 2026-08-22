'use client';

// ============================================================
// Chat History & Sessions Hub
// Comprehensive Session Management, Search, Pinning & Export
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import type { Conversation, AIModelId, AIPersonaId } from '@/types';

export default function ChatHistoryPage() {
  const router = useRouter();
  const { user, getToken } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New Session Form State
  const [newTitle, setNewTitle] = useState('');
  const [newModel, setNewModel] = useState<AIModelId>('gemini-3.5-flash');
  const [newPersona, setNewPersona] = useState<AIPersonaId>('general-assistant');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [initialPrompt, setInitialPrompt] = useState('');

  // Fetch all user conversations/sessions
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Create a new named history session and navigate into it
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsCreating(true);
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          model: newModel,
          persona: newPersona,
          tags: newTags,
        }),
      });

      const data = await res.json();
      if (data.success && data.conversation) {
        const newSession = data.conversation;
        setShowCreateModal(false);
        setNewTitle('');
        setNewTags([]);
        router.push(`/chat/${newSession.id}`);
      }
    } catch {
      // silent
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle Pin on a session
  const handleTogglePin = async (conv: Conversation) => {
    const nextPinned = !conv.isPinned;
    try {
      const token = await getToken();
      if (!token) return;

      await fetch(`/api/conversations/${conv.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPinned: nextPinned }),
      });

      setConversations((prev) =>
        prev
          .map((c) => (c.id === conv.id ? { ...c, isPinned: nextPinned } : c))
          .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          })
      );
    } catch {
      // silent
    }
  };

  // Delete a session
  const handleDeleteSession = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the session "${title}" and all its history?`)) {
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // silent
    }
  };

  // Export single conversation
  const handleExportSession = async (conv: Conversation, format: 'md' | 'json' | 'txt') => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`/api/conversations/${conv.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const messages = data.messages || [];

      if (format === 'json') {
        const jsonStr = JSON.stringify({ session: conv, messages }, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session-${conv.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      if (format === 'txt') {
        let txt = `NEXORA AI — History Session: ${conv.title}\nDate: ${new Date(conv.updatedAt).toLocaleString()}\n\n`;
        messages.forEach((m: { role: string; content: string; modelUsed?: string }) => {
          const sender = m.role === 'user' ? 'YOU' : `NEXORA AI (${m.modelUsed || conv.model || 'AI'})`;
          txt += `[${sender}]\n${m.content}\n\n----------------------------------------\n\n`;
        });
        const blob = new Blob([txt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session-${conv.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      // Markdown
      let md = `# Session: ${conv.title}\n\n`;
      md += `*Model: ${conv.model || 'Multi-AI'} • Persona: ${conv.persona || 'Assistant'} • Last Active: ${new Date(conv.updatedAt).toLocaleString()}*\n\n---\n\n`;
      messages.forEach((m: { role: string; content: string; modelUsed?: string }) => {
        const sender = m.role === 'user' ? '### 👤 You' : `### 🤖 NEXORA AI (${m.modelUsed || conv.model || 'Assistant'})`;
        md += `${sender}\n\n${m.content}\n\n---\n\n`;
      });
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${conv.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  };

  // Add tag handler
  const handleAddTag = () => {
    const val = tagInput.trim();
    if (val && !newTags.includes(val)) {
      setNewTags([...newTags, val]);
      setTagInput('');
    }
  };

  // Filtered list
  const filteredSessions = conversations.filter((c) => {
    const matchesQuery =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.lastMessageSnippet && c.lastMessageSnippet.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesQuery) return false;
    if (filterTag === 'pinned') return c.isPinned;
    if (filterTag === 'agent') return c.title.includes('[Agent]') || c.persona?.includes('agent');
    return true;
  });

  const totalPinned = conversations.filter((c) => c.isPinned).length;

  return (
    <div className="intel-page-container">
      {/* Top Header */}
      <div className="intel-subpage-header">
        <div>
          <div className="history-hub-breadcrumb">
            <Link href="/chat" className="wizard-back-link">
              ← Back to Chat
            </Link>
          </div>
          <h1 className="intel-subpage-title">Chat History &amp; Sessions Hub</h1>
          <p className="intel-subpage-desc">
            Manage your persistent conversation sessions, pinned workspaces, cognitive agent traces, and exported transcripts.
          </p>
        </div>

        <div className="intel-header-actions-row">
          <button
            onClick={() => setShowCreateModal(true)}
            className="intel-quickstart-btn"
            type="button"
          >
            <span className="btn-sparkle">➕</span>
            <span>Create New Session</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="intel-metrics-grid">
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Total Saved Sessions</span>
            <span className="metric-card-icon">💬</span>
          </div>
          <span className="metric-card-val">{conversations.length}</span>
          <span className="metric-card-sub">Active &amp; Persisted in Cloud</span>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Pinned Workspaces</span>
            <span className="metric-card-icon">⭐</span>
          </div>
          <span className="metric-card-val">{totalPinned}</span>
          <span className="metric-card-sub">Quick Access at Top</span>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Cognitive Agent Runs</span>
            <span className="metric-card-icon">⚡</span>
          </div>
          <span className="metric-card-val">
            {conversations.filter((c) => c.title.includes('[Agent]')).length}
          </span>
          <span className="metric-card-sub">5-Stage Autonomous Workflows</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
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
            placeholder="Search sessions by title, prompt keywords or messages..."
            className="intel-filter-input"
          />
        </div>

        <div className="intel-filter-dropdowns">
          <button
            type="button"
            onClick={() => setFilterTag('all')}
            className={`intel-tab-link ${filterTag === 'all' ? 'intel-tab-link-active' : ''}`}
          >
            All Sessions ({conversations.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTag('pinned')}
            className={`intel-tab-link ${filterTag === 'pinned' ? 'intel-tab-link-active' : ''}`}
          >
            ⭐ Pinned ({totalPinned})
          </button>
          <button
            type="button"
            onClick={() => setFilterTag('agent')}
            className={`intel-tab-link ${filterTag === 'agent' ? 'intel-tab-link-active' : ''}`}
          >
            ⚡ Agent Runs
          </button>
        </div>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="intel-loading-container">
          <div className="app-loading-spinner" />
          <p>Loading your saved chat sessions...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="intel-empty-state">
          <div className="intel-empty-icon-wrap">
            <div className="intel-empty-icon-glow">💬</div>
          </div>
          <h3 className="intel-empty-title">
            {searchQuery ? 'No matching sessions found' : 'No Chat Sessions Saved Yet'}
          </h3>
          <p className="intel-empty-desc">
            {searchQuery
              ? 'Try adjusting your search keywords or clear filters.'
              : 'Start a new conversation in Chat or create a named workspace session above. All messages and reasoning traces will be automatically saved.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="intel-quickstart-btn"
            type="button"
          >
            <span>➕ Create First Session</span>
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredSessions.map((conv) => (
            <div key={conv.id} className="project-card history-session-card">
              <div className="project-card-header">
                <div className="session-title-wrap">
                  <div className="session-badges-row">
                    <button
                      type="button"
                      onClick={() => handleTogglePin(conv)}
                      className={`session-pin-btn ${conv.isPinned ? 'pin-active' : ''}`}
                      title={conv.isPinned ? 'Unpin session' : 'Pin session to top'}
                    >
                      {conv.isPinned ? '⭐ Pinned' : '☆ Pin'}
                    </button>
                    <span className="project-industry-badge">{conv.model || 'Multi-AI'}</span>
                    {conv.persona && <span className="proj-tag">{conv.persona}</span>}
                  </div>
                  <h2 className="project-card-name session-card-title">{conv.title}</h2>
                </div>
              </div>

              {conv.lastMessageSnippet ? (
                <p className="session-snippet-text">"{conv.lastMessageSnippet}"</p>
              ) : (
                <p className="session-snippet-placeholder">Active chat session ready for prompts.</p>
              )}

              {/* Card Footer Actions */}
              <div className="project-card-footer">
                <div className="project-last-run">
                  <span>Updated: </span>
                  <strong>
                    {new Date(conv.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                </div>

                <div className="project-actions-row">
                  <Link href={`/chat/${conv.id}`} className="proj-action-btn proj-btn-run">
                    <span>▶ Resume</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleExportSession(conv, 'md')}
                    className="proj-action-btn proj-btn-view"
                    title="Export as Markdown"
                  >
                    📥 Export
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteSession(conv.id, conv.title)}
                    className="proj-action-btn proj-btn-delete"
                    title="Delete session"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create New History Session */}
      {showCreateModal && (
        <div className="history-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="history-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <h2 className="history-modal-title">Create New History Session</h2>
              <button
                type="button"
                className="history-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="history-modal-form">
              <div className="wizard-form-group">
                <label htmlFor="session-name">Session Title / Topic *</label>
                <input
                  id="session-name"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed System Architecture & Caching"
                  className="wizard-input"
                  required
                  autoFocus
                />
              </div>

              <div className="wizard-form-group">
                <label htmlFor="session-model">Preferred AI Model</label>
                <select
                  id="session-model"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value as AIModelId)}
                  className="wizard-input"
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Fast &amp; Smart)</option>
                  <option value="gemini-3.6-flash">Gemini 3.6 Flash (Thinking)</option>
                  <option value="gpt-4o">GPT-4o (Omni Intelligence)</option>
                  <option value="deepseek-r1">DeepSeek R1 (Deep Reasoning)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (Speed &amp; Efficiency)</option>
                </select>
              </div>

              <div className="wizard-form-group">
                <label htmlFor="session-persona">AI Persona &amp; Specialization</label>
                <select
                  id="session-persona"
                  value={newPersona}
                  onChange={(e) => setNewPersona(e.target.value as AIPersonaId)}
                  className="wizard-input"
                >
                  <option value="general-assistant">General Assistant</option>
                  <option value="code-engineer">Code Engineer &amp; Architect</option>
                  <option value="intelligence-analyst">Intelligence &amp; Patent Analyst</option>
                  <option value="security-critic">AppSec &amp; Security Critic</option>
                  <option value="creative-strategist">Creative Strategist</option>
                </select>
              </div>

              <div className="history-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="intel-secondary-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim()}
                  className="intel-quickstart-btn"
                >
                  {isCreating ? 'Creating & Launching...' : 'Launch Session →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
