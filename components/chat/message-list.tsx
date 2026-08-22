'use client';

// ============================================================
// Message List Component
// ============================================================
import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
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
              <Image
                src="/logo.png"
                alt="NEXORA AI"
                width={24}
                height={24}
                className="message-avatar-img"
              />
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
