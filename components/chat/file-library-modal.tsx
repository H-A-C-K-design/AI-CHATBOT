'use client';

// ============================================================
// File Library Modal — Browse and Search Knowledge & Workspace Files
// ============================================================
import React, { useState, useMemo } from 'react';
import type { FileAttachment } from '@/types';

interface FileLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFiles: (files: FileAttachment[]) => void;
}

interface LibraryItem {
  id: string;
  name: string;
  category: 'code' | 'docs' | 'data' | 'system';
  size: number;
  type: string;
  description: string;
  content: string;
}

const SAMPLE_LIBRARY: LibraryItem[] = [
  {
    id: 'lib-1',
    name: 'architecture_specs.md',
    category: 'docs',
    size: 4200,
    type: 'text/markdown',
    description: 'NEXORA AI system architecture, microservices, and latency specs',
    content: `# NEXORA AI Architecture Specifications
- Frontend: Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript
- AI Routing: Multi-Provider Gateway (Gemini 3.5/3.6, GPT-4o, DeepSeek R1)
- Autonomous Agent: Step-by-step tool execution engine with sandboxed inspection
- Database: Firebase Admin SDK, Firestore distributed sessions
- Streaming: Server-Sent Events (SSE) live token streaming with sub-25ms latency`,
  },
  {
    id: 'lib-2',
    name: 'api_schema.json',
    category: 'data',
    size: 2800,
    type: 'application/json',
    description: 'OpenAPI REST schemas for chat completions, intelligence feeds, and agents',
    content: `{
  "openapi": "3.1.0",
  "info": { "title": "Nexora Unified AI API", "version": "2.5.0" },
  "paths": {
    "/api/chat": { "post": { "summary": "Stream completions with reasoning & RAG" } },
    "/api/agent": { "post": { "summary": "Autonomous execution with system tools" } },
    "/api/intelligence/trends": { "get": { "summary": "Real-time AI market analytics" } }
  }
}`,
  },
  {
    id: 'lib-3',
    name: 'agent_engine.ts',
    category: 'code',
    size: 8500,
    type: 'text/typescript',
    description: 'Autonomous tool calling engine with system inspector and code executor',
    content: `// Nexora Agent Engine Core
export async function executeAutonomousStep(plan: ExecutionPlan, tools: ToolRegistry) {
  const result = await tools.dispatch(plan.currentTool, plan.arguments);
  return { status: 'success', data: result, nextStep: plan.resolveNext(result) };
}`,
  },
  {
    id: 'lib-4',
    name: 'competitor_benchmark.csv',
    category: 'data',
    size: 3600,
    type: 'text/csv',
    description: 'Benchmarking latency, cost per 1M tokens, and MMLU scores',
    content: `Model,Provider,TokensPerSec,MMLU_Score,PricePer1M_Input,PricePer1M_Output
Gemini 3.5 Flash,Google,145,86.4,$0.075,$0.30
GPT-4o,OpenAI,110,88.7,$2.50,$10.00
DeepSeek R1,DeepSeek,75,90.8,$0.55,$2.19
Claude 3.5 Sonnet,Anthropic,92,88.3,$3.00,$15.00`,
  },
  {
    id: 'lib-5',
    name: 'security_guidelines.md',
    category: 'docs',
    size: 3100,
    type: 'text/markdown',
    description: 'Production security checklist, anti-inspect protections, and rate limiting',
    content: `# Nexora Security Protocol
1. Anti-inspect protections active for dev tools detection
2. Token bucket rate limiting per IP / authenticated UID (60 req/min)
3. Strict sanitization with DOMPurify and rehype-sanitize
4. Encrypted localStorage keys for client-provided overrides`,
  },
];

export function FileLibraryModal({ isOpen, onClose, onSelectFiles }: FileLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'code' | 'docs' | 'data'>('all');

  const filteredItems = useMemo(() => {
    return SAMPLE_LIBRARY.filter((item) => {
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, categoryFilter]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const selectedFiles = SAMPLE_LIBRARY.filter((item) => selectedIds.includes(item.id)).map(
      (item) => ({
        id: `lib-${Date.now()}-${item.id}`,
        name: item.name,
        size: item.size,
        type: item.type,
        textContent: item.content,
      })
    );
    if (selectedFiles.length > 0) {
      onSelectFiles(selectedFiles);
    }
    setSelectedIds([]);
    onClose();
  };

  return (
    <div className="library-modal-overlay" onClick={onClose}>
      <div className="library-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="library-modal-header">
          <div className="library-header-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <div>
              <h2 className="library-modal-title">Knowledge & File Library</h2>
              <p className="library-modal-subtitle">Attach project documents, code schemas, and datasets to your prompt</p>
            </div>
          </div>
          <button onClick={onClose} className="library-close-btn" type="button" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="library-modal-search-row">
          <div className="library-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search library files & datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="library-search-input"
              autoFocus
            />
          </div>

          <div className="library-filter-pills">
            {(['all', 'docs', 'code', 'data'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                className={`library-filter-pill ${categoryFilter === cat ? 'filter-pill-active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === 'all' ? 'All Files' : cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* File List */}
        <div className="library-items-list">
          {filteredItems.length === 0 ? (
            <div className="library-empty">No files matching your search.</div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`library-item-card ${isSelected ? 'library-item-selected' : ''}`}
                  onClick={() => toggleSelect(item.id)}
                >
                  <div className="library-item-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      aria-label={`Select ${item.name}`}
                    />
                  </div>
                  <div className="library-item-icon">
                    {item.category === 'code' ? '💻' : item.category === 'data' ? '📊' : '📄'}
                  </div>
                  <div className="library-item-info">
                    <div className="library-item-name-row">
                      <span className="library-item-name">{item.name}</span>
                      <span className="library-item-badge">{(item.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <p className="library-item-desc">{item.description}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="library-modal-footer">
          <span className="library-selected-count">
            {selectedIds.length} {selectedIds.length === 1 ? 'file' : 'files'} selected
          </span>
          <div className="library-footer-actions">
            <button onClick={onClose} className="library-btn-cancel" type="button">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.length === 0}
              className="library-btn-attach"
              type="button"
            >
              Attach to Chat ({selectedIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
