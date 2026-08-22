'use client';

// ============================================================
// Message List Component — Smooth Auto-Scroll & Streaming
// ============================================================
import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import type { Message, AIModelId } from '@/types';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  streamingMessageId?: string | null;
  onRegenerate?: (modelOverride?: AIModelId) => void;
  onEditMessage?: (index: number, newContent: string) => void;
}

export function MessageList({
  messages,
  isLoading,
  streamingMessageId,
  onRegenerate,
  onEditMessage,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  // Detect user scroll position
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    userScrolledUp.current = scrollHeight - scrollTop - clientHeight > 100;
  };

  // Auto-scroll when new messages or stream tokens arrive, unless user intentionally scrolled up
  useEffect(() => {
    if (!userScrolledUp.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, streamingMessageId]);

  return (
    <div className="message-list" ref={containerRef} onScroll={handleScroll}>
      <div className="message-list-inner">
        {messages.map((message, index) => {
          const isStreaming = message.id === streamingMessageId;
          return (
            <MessageBubble
              key={message.id || index}
              message={message}
              isStreaming={isStreaming}
              onRegenerate={
                index === messages.length - 1 && message.role === 'assistant'
                  ? onRegenerate
                  : undefined
              }
              onEditMessage={
                message.role === 'user'
                  ? (newContent) => onEditMessage?.(index, newContent)
                  : undefined
              }
            />
          );
        })}

        {/* Loading Spinner while waiting for stream start */}
        {isLoading && !streamingMessageId && (
          <div className="message-bubble message-assistant">
            <div className="message-avatar avatar-assistant">
              <div className="assistant-avatar-glow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24Z" />
                </svg>
              </div>
            </div>
            <div className="message-content-wrapper">
              <div className="message-header-bar">
                <span className="message-role-label">NEXORA AI</span>
                <span className="message-model-badge">Connecting stream...</span>
              </div>
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

        {/* Generous bottom spacer so text is never covered or pressed against the composer */}
        <div ref={bottomRef} className="message-list-bottom-spacer" />
      </div>
    </div>
  );
}
