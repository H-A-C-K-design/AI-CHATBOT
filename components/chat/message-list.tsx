'use client';

// ============================================================
// Message List Component
// ============================================================
import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import type { Message } from '@/types';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <div className="message-list" ref={containerRef}>
      <div className="message-list-inner">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Loading indicator while waiting for AI response */}
        {isLoading && (
          <div className="message-bubble message-assistant">
            <div className="message-avatar avatar-assistant">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
                <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                <circle cx="15" cy="10" r="1.5" fill="currentColor" />
                <path d="M9 15C9.5 16.5 10.5 17 12 17C13.5 17 14.5 16.5 15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="message-content-wrapper">
              <div className="message-role-label">NEXORA AI</div>
              <div className="message-content">
                <div className="thinking-indicator" role="status" aria-label="AI is thinking">
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
