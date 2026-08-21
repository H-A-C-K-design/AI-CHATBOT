'use client';

// ============================================================
// Empty State Component (ChatGPT / WebAI Aesthetic)
// ============================================================
import React from 'react';

interface EmptyStateProps {
  onSuggestion?: (text: string) => void;
}

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  const suggestions = [
    {
      title: 'Code a Python script',
      desc: 'Build a fast web server with FastAPI',
      prompt: 'Write a modern Python FastAPI REST API with input validation and error handling.',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M16 18L22 12L16 6M8 6L2 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: 'Debug an issue',
      desc: 'Fix unexpected behavior & errors',
      prompt: 'Help me debug this issue: I have a React component with state that is not updating properly.',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: 'Explain architecture',
      desc: 'Microservices, serverless, or auth',
      prompt: 'Explain the difference between JWT authentication and Session-based authentication with practical code examples.',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2L2 7L12 12L22 7L12 2ZM2 17L12 22L22 17ZM2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: 'Refactor & optimize',
      desc: 'Improve performance & clean code',
      prompt: 'Show me best practices to optimize database queries and prevent N+1 queries.',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="empty-state">
      <div className="empty-state-header">
        <div className="empty-state-avatar">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="empty-state-title">What can I help with?</h2>
      </div>

      {onSuggestion && (
        <div className="empty-state-grid">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestion(item.prompt)}
              className="chatgpt-suggestion-card"
              type="button"
            >
              <div className="suggestion-card-icon">{item.icon}</div>
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
