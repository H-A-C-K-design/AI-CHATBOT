'use client';

// ============================================================
// Empty State Component — Spacious, Ultra-Clean ChatGPT Aesthetic
// ============================================================
import React from 'react';
import type { AIModelId, AIPersonaId } from '@/types';

interface EmptyStateProps {
  onSuggestion?: (
    prompt: string,
    options?: { model?: AIModelId; persona?: AIPersonaId }
  ) => void;
}

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  const suggestions = [
    {
      title: 'Python & FastAPI Service',
      desc: 'Build a production REST API with authentication & typed validation',
      prompt: 'Write a production-ready Python FastAPI service with JWT authentication, Pydantic validation, structured logging, and PostgreSQL async connection.',
      model: 'gemini-3.6-flash' as AIModelId,
      persona: 'code-engineer' as AIPersonaId,
      tag: 'Code',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      title: 'Debug React & State Bugs',
      desc: 'Diagnose race conditions, re-render loops & memory leaks',
      prompt: 'Here is a React concurrency and state synchronization bug with useEffect. Help me diagnose why state updates are batched incorrectly and provide a clean fix.',
      model: 'gpt-4o' as AIModelId,
      persona: 'code-engineer' as AIPersonaId,
      tag: 'Debug',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
    {
      title: 'Deep Algorithm & Math Proof',
      desc: 'Step-by-step reasoning on graph theory & dynamic programming',
      prompt: 'Solve the Minimum Spanning Tree with Dynamic Edge Updates problem. Provide step-by-step mathematical reasoning, time complexity proof, and optimized implementation.',
      model: 'deepseek-r1' as AIModelId,
      persona: 'general-assistant' as AIPersonaId,
      tag: 'Reasoning',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ),
    },
    {
      title: 'Patent & Tech Intelligence',
      desc: 'Analyze emerging AI patent filings and research paper citations',
      prompt: 'Summarize the latest trends in Autonomous Agent architectures and patent developments this month. Cite verified source links and key technical breakthroughs.',
      model: 'gemini-3.6-flash' as AIModelId,
      persona: 'intelligence-analyst' as AIPersonaId,
      tag: 'Intelligence',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
    {
      title: 'AppSec & OWASP Audit',
      desc: 'Find XSS, SQLi, CSRF, and token vulnerabilities in code',
      prompt: 'Perform a comprehensive security audit of a Next.js API route that handles user authentication and session cookies. List potential attack vectors and hardened implementations.',
      model: 'claude-3-5-sonnet' as AIModelId,
      persona: 'security-critic' as AIPersonaId,
      tag: 'Security',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      title: 'System Architecture Design',
      desc: 'Design scalable microservices with Kafka, Redis, and DB caching',
      prompt: 'Design a high-throughput real-time messaging architecture capable of handling 500,000 concurrent WebSocket connections. Include message queue topologies and disaster recovery.',
      model: 'gemini-3.6-flash' as AIModelId,
      persona: 'code-engineer' as AIPersonaId,
      tag: 'Architecture',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      ),
    },
  ];

  return (
    <div className="empty-state">
      <div className="empty-state-hero">
        <div className="empty-state-badge">
          <span className="badge-sparkle">✦</span>
          <span>Real-Time Multi-AI Platform</span>
        </div>
        <h1 className="empty-state-title">What can I help you build?</h1>
        <p className="empty-state-subtitle">
          Select a prompt or ask anything. Switch between Gemini 3.6 Flash, GPT-4o, DeepSeek-R1, and AI personas.
        </p>
      </div>

      {onSuggestion && (
        <div className="empty-state-grid">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestion(item.prompt, { model: item.model, persona: item.persona })}
              className="chatgpt-suggestion-card"
              type="button"
            >
              <div className="suggestion-card-header">
                <div className="suggestion-card-icon">{item.icon}</div>
                <span className="suggestion-card-tag">{item.tag}</span>
              </div>
              <div className="suggestion-card-body">
                <h3 className="suggestion-card-title">{item.title}</h3>
                <p className="suggestion-card-desc">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
