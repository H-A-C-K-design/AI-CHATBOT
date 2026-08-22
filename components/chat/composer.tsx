'use client';

// ============================================================
// Composer — Message Input Component
// ============================================================
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { AgentMode } from '@/types';

interface ComposerProps {
  onSend: (message: string, agentMode?: AgentMode) => void;
  isLoading: boolean;
  onStop?: () => void;
  disabled?: boolean;
}

export function Composer({ onSend, isLoading, onStop, disabled }: ComposerProps) {
  const [message, setMessage] = useState('');
  const [agentMode] = useState<AgentMode>('swarm');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [message]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed, agentMode);
    setMessage('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, agentMode, isLoading, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="composer-wrapper">
      <div className="composer">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          className="composer-textarea"
          rows={1}
          disabled={disabled}
          aria-label="Message input"
          id="composer-textarea"
        />
        <div className="composer-actions">
          {isLoading && onStop ? (
            <button
              onClick={onStop}
              className="composer-btn composer-btn-stop"
              type="button"
              aria-label="Stop generating"
              title="Stop generating"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <rect x="3" y="3" width="10" height="10" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!message.trim() || isLoading || disabled}
              className="composer-btn composer-btn-send"
              type="button"
              aria-label="Send message"
              title="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 14V2M8 2L3 7M8 2L13 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <p className="composer-hint">
        Press Enter to send, Shift + Enter for new line
      </p>
    </div>
  );
}
