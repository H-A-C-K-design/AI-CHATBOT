'use client';

// ============================================================
// Chat Conversation Page — Specific Conversation
// ============================================================
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChatContainer } from '@/components/chat/chat-container';
import { useAuth } from '@/components/auth/auth-provider';
import type { Message } from '@/types';

interface ConversationPageProps {
  onConversationCreated?: (id: string, title: string) => void;
  onNewMessage?: () => void;
}

export default function ConversationPage(props: ConversationPageProps) {
  const params = useParams();
  const conversationId = params?.id as string;
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleConversationCreated = props.onConversationCreated || (() => {});
  const handleNewMessage = props.onNewMessage || (() => {});

  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch(`/api/conversations/${conversationId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (data.success) {
          setMessages(data.messages);
        } else {
          setError(data.error?.message || 'Failed to load messages.');
        }
      } catch {
        setError('Failed to load conversation.');
      } finally {
        setLoading(false);
      }
    }

    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId, getToken]);

  if (loading) {
    return (
      <div className="chat-container">
        <div className="chat-loading">
          <div className="app-loading-spinner" />
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-container">
        <div className="chat-error-full">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ChatContainer
      conversationId={conversationId}
      initialMessages={messages}
      onConversationCreated={handleConversationCreated}
      onNewMessage={handleNewMessage}
    />
  );
}
