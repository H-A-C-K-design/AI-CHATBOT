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
  return (
    <div className="empty-state">
      <div className="empty-state-hero">
        <div className="empty-state-badge">
          <span className="badge-sparkle">✦</span>
          <span>Real-Time Multi-AI Platform</span>
        </div>
        <h1 className="empty-state-title">What can I help you build?</h1>
        <p className="empty-state-subtitle">
          Ask anything or start coding. Powered by Gemini 3.6 Flash, GPT-4o, and DeepSeek-R1.
        </p>
      </div>
    </div>
  );
}
