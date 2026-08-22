'use client';

// ============================================================
// Empty State Component — ChatGPT Aesthetic with Category Prompts
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
  const categories = [
    {
      title: 'Python & FastAPI Service',
      desc: 'Build a production REST API with authentication & typed validation',
      prompt: 'Write a production-ready Python FastAPI service with JWT authentication, Pydantic validation, structured logging, and PostgreSQL async connection.',
      model: 'gemini-3.6-flash' as AIModelId,
      persona: 'code-engineer' as AIPersonaId,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 18L22 12L16 6M8 6L2 12L8 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      tag: 'Code',
    },
    {
      title: 'Debug React & State Bugs',
      desc: 'Diagnose race conditions, re-render loops & memory leaks',
      prompt: 'Here is a React concurrency and state synchronization bug with useEffect. Help me diagnose why state updates are batched incorrectly and provide a clean fix.',
      model: 'gpt-4o' as AIModelId,
      persona: 'code-engineer' as AIPersonaId,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
          <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
        </svg>
      ),
      tag: 'Debug',
    },
    {
      title: 'Deep Algorithm Proof & Math',
      desc: 'Step-by-step reasoning on graph theory & dynamic programming',
      prompt: 'Solve the Minimum Spanning Tree with Dynamic Edge Updates problem. Provide step-by-step mathematical reasoning, time complexity proof, and optimized implementation.',
      model: 'deepseek-r1' as AIModelId,
      persona: 'general-assistant' as AIPersonaId,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ),
      tag: 'Reasoning',
    },
    {
      title: 'Patent & Tech Intelligence',
      desc: 'Analyze emerging AI patent filings and research paper citations',
      prompt: 'Summarize the latest trends in Autonomous Agent architectures and patent developments this month. Cite verified source links and key technical breakthroughs.',
      model: 'gemini-3.6-flash' as AIModelId,
      persona: 'intelligence-analyst' as AIPersonaId,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7L12 12L22 7L12 2ZM2 17L12 22L22 17ZM2 12L12 17L22 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      tag: 'Intelligence',
    },
    {
      title: 'AppSec & OWASP Audit',
      desc: 'Find XSS, SQLi, CSRF, and token vulnerabilities in code',
      prompt: 'Perform a comprehensive security audit of a Next.js API route that handles user authentication and session cookies. List potential attack vectors and hardened implementations.',
      model: 'claude-3-5-sonnet' as AIModelId,
      persona: 'security-critic' as AIPersonaId,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      tag: 'Security',
    },
    {
      title: 'System Architecture Design',
      desc: 'Design scalable microservices with Kafka, Redis, and DB caching',
      prompt: 'Design a high-throughput real-time messaging architecture capable of handling 500,000 concurrent WebSocket connections. Include message queue topologies and disaster recovery.',
      model: 'gemini-3.6-flash' as AIModelId,
      persona: 'code-engineer' as AIPersonaId,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="8" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="2" y="14" width="20" height="8" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="6" y1="6" x2="6.01" y2="6" strokeLinecap="round" />
          <line x1="6" y1="18" x2="6.01" y2="18" strokeLinecap="round" />
        </svg>
      ),
      tag: 'Architecture',
    },
  ];

  return (
    <div className="empty-state">
      <div className="empty-state-hero">
        <div className="empty-state-badge">
          <span className="badge-sparkle">✦</span> Real-Time Multi-AI Engine
        </div>
        <h2 className="empty-state-title">What would you like to build today?</h2>
        <p className="empty-state-subtitle">
          Chat with Google Gemini 3.6 Flash, OpenAI GPT-4o, DeepSeek-R1, or specialized AI Personas with real-time streaming.
        </p>
      </div>

      {onSuggestion && (
        <div className="empty-state-grid">
          {categories.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestion(item.prompt, { model: item.model, persona: item.persona })}
              className="chatgpt-suggestion-card"
              type="button"
            >
              <div className="suggestion-card-top">
                <div className="suggestion-card-icon">{item.icon}</div>
                <span className="suggestion-card-tag">{item.tag}</span>
              </div>
              <div className="suggestion-card-content">
                <span className="suggestion-card-title">{item.title}</span>
                <span className="suggestion-card-desc">{item.desc}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
