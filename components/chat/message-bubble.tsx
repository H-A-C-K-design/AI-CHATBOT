'use client';

// ============================================================
// Message Bubble Component
// ============================================================
import React, { useState, useCallback } from 'react';
import { MarkdownRenderer } from './markdown-renderer';
import { AgentFlowVisualizer } from './agent-flow-visualizer';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent fail for copy
    }
  }, [message.content]);

  return (
    <div className={`message-bubble ${isUser ? 'message-user' : 'message-assistant'}`}>
      {/* Avatar */}
      <div className={`message-avatar ${isUser ? 'avatar-user' : 'avatar-assistant'}`}>
        {isUser ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
            <path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
            <circle cx="9" cy="10" r="1.5" fill="currentColor" />
            <circle cx="15" cy="10" r="1.5" fill="currentColor" />
            <path d="M9 15C9.5 16.5 10.5 17 12 17C13.5 17 14.5 16.5 15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="message-content-wrapper">
        <div className="message-role-label flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{isUser ? 'You' : 'NEXORA AI'}</span>
            {isAssistant && message.agentSteps && message.agentSteps.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-normal px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                <span>⚡</span> Multi-Agent Orchestrated
              </span>
            )}
          </div>
        </div>

        {/* Multi-Agent Execution Flow Card */}
        {isAssistant && message.agentSteps && (
          <AgentFlowVisualizer steps={message.agentSteps} />
        )}

        <div className="message-content">
          {isUser ? (
            <p className="message-text-user">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {/* Actions */}
        {isAssistant && (
          <div className="message-actions">
            <button
              onClick={handleCopyMessage}
              className="message-action-btn"
              type="button"
              aria-label={copied ? 'Copied' : 'Copy response'}
              title={copied ? 'Copied!' : 'Copy response'}
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
