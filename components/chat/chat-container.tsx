'use client';

// ============================================================
// Chat Container — Main chat area with messages + composer
// ============================================================
import React, { useState, useCallback, useRef } from 'react';
import { MessageList } from './message-list';
import { Composer } from './composer';
import { EmptyState } from './empty-state';
import { useAuth } from '@/components/auth/auth-provider';
import type { Message, ChatResponse, ApiError } from '@/types';

interface ChatContainerProps {
  conversationId: string | null;
  initialMessages: Message[];
  onConversationCreated: (id: string, title: string) => void;
  onNewMessage: () => void;
}

export function ChatContainer({
  conversationId,
  initialMessages,
  onConversationCreated,
  onNewMessage,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentConvIdRef = useRef<string | null>(conversationId);

  // Update messages when conversation changes
  React.useEffect(() => {
    setMessages(initialMessages);
    currentConvIdRef.current = conversationId;
    setError(null);
  }, [conversationId, initialMessages]);

  const sendMessage = useCallback(async (content: string, agentMode: import('@/types').AgentMode = 'swarm') => {
    setError(null);
    setIsLoading(true);

    // Add optimistic user message
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: currentConvIdRef.current || '',
      role: 'user',
      content,
      agentMode,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const token = await getToken();
      if (!token) {
        setError('Session expired. Please sign in again.');
        setIsLoading(false);
        return;
      }

      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: currentConvIdRef.current || undefined,
          message: content,
          agentMode,
        }),
        signal: abortControllerRef.current.signal,
      });

      const rawText = await response.text();
      let data: ChatResponse | ApiError;
      try {
        data = JSON.parse(rawText);
      } catch {
        if (response.status === 401) {
          setError('Your session expired. Please refresh the page or sign in again.');
        } else {
          setError(rawText || `Server returned error (${response.status})`);
        }
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
        return;
      }

      if (!data.success) {
        const apiError = data as ApiError;
        if (response.status === 401) {
          setError('Authentication expired. Please refresh the page or sign in again.');
        } else {
          setError(apiError.error?.message || 'Failed to generate response.');
        }
        // Remove the optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
        return;
      }

      const chatResponse = data as ChatResponse;

      // If this was a new conversation, update the reference
      if (!currentConvIdRef.current) {
        currentConvIdRef.current = chatResponse.conversationId;
        onConversationCreated(
          chatResponse.conversationId,
          chatResponse.title || content.substring(0, 100)
        );
      }

      // Add the real assistant message
      setMessages((prev) => [...prev, chatResponse.message]);
      onNewMessage();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled — not an error
        return;
      }
      const msg = (err as Error)?.message || 'Failed to send message. Please try again.';
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [getToken, onConversationCreated, onNewMessage]);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  const handleSuggestion = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);

  return (
    <div className="chat-container">
      {messages.length === 0 && !isLoading ? (
        <EmptyState onSuggestion={handleSuggestion} />
      ) : (
        <MessageList messages={messages} isLoading={isLoading} />
      )}

      {/* Error display */}
      {error && (
        <div className="chat-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
          </svg>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="chat-error-dismiss"
            type="button"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <Composer onSend={sendMessage} isLoading={isLoading} onStop={handleStop} />
    </div>
  );
}
