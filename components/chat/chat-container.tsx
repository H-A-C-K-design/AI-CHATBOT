'use client';

// ============================================================
// Chat Container — Real-Time SSE Streaming Multi-AI Controller
// Supports Live Token Streaming, Thinking Blocks, Regenerate & Export
// ============================================================
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MessageList } from './message-list';
import { Composer } from './composer';
import { EmptyState } from './empty-state';
import { useAuth } from '@/components/auth/auth-provider';
import type { Message, AIModelId, AIPersonaId } from '@/types';

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
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModelId>('gemini-3.5-flash');
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentConvIdRef = useRef<string | null>(conversationId);

  // Sync messages when active conversation changes
  useEffect(() => {
    setMessages(initialMessages);
    currentConvIdRef.current = conversationId;
    setError(null);
    setStreamingMessageId(null);
  }, [conversationId, initialMessages]);

  const sendMessage = useCallback(
    async (
      content: string,
      options: {
        model?: AIModelId;
        persona?: AIPersonaId;
        enableReasoning?: boolean;
        enableIntelligenceRAG?: boolean;
      } = {}
    ) => {
      setError(null);
      setIsLoading(true);

      const chosenModel = options.model || selectedModel || 'gemini-3.5-flash';
      const chosenPersona = options.persona || 'general-assistant';

      // 1. Add Optimistic User Message
      const userMsgId = `temp-user-${Date.now()}`;
      const tempUserMessage: Message = {
        id: userMsgId,
        conversationId: currentConvIdRef.current || '',
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };

      // 2. Prepare Optimistic Assistant Message for Streaming
      const assistantMsgId = `temp-asst-${Date.now()}`;
      const tempAssistantMessage: Message = {
        id: assistantMsgId,
        conversationId: currentConvIdRef.current || '',
        role: 'assistant',
        content: '',
        modelUsed: chosenModel,
        personaUsed: chosenPersona,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMessage, tempAssistantMessage]);
      setStreamingMessageId(assistantMsgId);

      try {
        const token = await getToken();
        if (!token) {
          setError('Session expired. Please sign in again.');
          setIsLoading(false);
          setStreamingMessageId(null);
          setMessages((prev) => prev.filter((m) => m.id !== userMsgId && m.id !== assistantMsgId));
          return;
        }

        abortControllerRef.current = new AbortController();

        // Get any custom API keys stored locally by user in settings
        const customApiKey = typeof window !== 'undefined'
          ? localStorage.getItem(`nexora_api_key_${chosenModel}`) || localStorage.getItem('nexora_api_key_custom') || undefined
          : undefined;

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(customApiKey ? { 'x-custom-api-key': customApiKey } : {}),
          },
          body: JSON.stringify({
            conversationId: currentConvIdRef.current || undefined,
            message: content,
            model: chosenModel,
            persona: chosenPersona,
            stream: true,
            enableReasoning: options.enableReasoning,
            enableIntelligenceRAG: options.enableIntelligenceRAG,
            customApiKey,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorJson = await response.json().catch(() => ({}));
          const errorMsg = errorJson?.error?.message || `Request failed with status ${response.status}`;
          throw new Error(errorMsg);
        }

        if (!response.body) {
          throw new Error('Readable stream not supported by server.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';
        let fullThinking = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;

            const jsonStr = trimmed.replace(/^data:\s*/, '');
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.type === 'meta') {
                if (event.conversationId && !currentConvIdRef.current) {
                  currentConvIdRef.current = event.conversationId;
                  onConversationCreated(
                    event.conversationId,
                    event.title || content.substring(0, 60)
                  );
                }
                if (event.modelUsed) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId ? { ...m, modelUsed: event.modelUsed, personaUsed: event.personaUsed } : m
                    )
                  );
                }
              } else if (event.type === 'sources') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, sources: event.sources } : m
                  )
                );
              } else if (event.type === 'think') {
                fullThinking += event.content || '';
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, thinkingContent: fullThinking } : m
                  )
                );
              } else if (event.type === 'token') {
                const tokenContent = event.content || '';
                fullContent += tokenContent;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: fullContent } : m
                  )
                );
              } else if (event.type === 'done') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          id: event.messageId || m.id,
                          content: event.fullContent || fullContent,
                          thinkingContent: event.thinkingContent || fullThinking || undefined,
                          modelUsed: event.modelUsed || m.modelUsed,
                        }
                      : m
                  )
                );
              } else if (event.type === 'error') {
                throw new Error(event.message || 'Stream error occurred.');
              }
            } catch {
              // Ignore single malformed line
            }
          }
        }

        onNewMessage();
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // Stopped by user — keep whatever tokens arrived
          return;
        }

        const msg = (err as Error)?.message || 'Failed to stream response.';
        setError(msg);

        // If assistant had zero output, remove the empty bubble
        setMessages((prev) => {
          const target = prev.find((m) => m.id === assistantMsgId);
          if (!target || !target.content.trim()) {
            return prev.filter((m) => m.id !== userMsgId && m.id !== assistantMsgId);
          }
          return prev;
        });
      } finally {
        setIsLoading(false);
        setStreamingMessageId(null);
        abortControllerRef.current = null;
      }
    },
    [selectedModel, getToken, onConversationCreated, onNewMessage]
  );

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setStreamingMessageId(null);
  }, []);

  const handleSuggestion = useCallback(
    (prompt: string, opts?: { model?: AIModelId; persona?: AIPersonaId }) => {
      if (opts?.model) setSelectedModel(opts.model);
      sendMessage(prompt, opts);
    },
    [sendMessage]
  );

  const handleRegenerate = useCallback(
    (modelOverride?: AIModelId) => {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUserMsg) {
        // Remove the last assistant message
        setMessages((prev) => {
          const lastIdx = prev.findLastIndex((m) => m.role === 'assistant');
          if (lastIdx !== -1) {
            return prev.slice(0, lastIdx);
          }
          return prev;
        });

        sendMessage(lastUserMsg.content, {
          model: modelOverride || selectedModel,
        });
      }
    },
    [messages, selectedModel, sendMessage]
  );

  const handleEditMessage = useCallback(
    (messageIndex: number, newContent: string) => {
      // Remove all messages after this edited user message
      setMessages((prev) => prev.slice(0, messageIndex));
      sendMessage(newContent, { model: selectedModel });
    },
    [selectedModel, sendMessage]
  );

  const [copiedHistory, setCopiedHistory] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Export conversation in multiple formats
  const handleExport = useCallback(
    (format: 'md' | 'txt' | 'json') => {
      if (messages.length === 0) return;
      setShowExportMenu(false);

      if (format === 'json') {
        const jsonStr = JSON.stringify(
          {
            conversationId: currentConvIdRef.current,
            exportedAt: new Date().toISOString(),
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
              modelUsed: m.modelUsed,
              personaUsed: m.personaUsed,
              createdAt: m.createdAt,
            })),
          },
          null,
          2
        );
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexora-chat-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      if (format === 'txt') {
        let txt = `NEXORA AI — Conversation Transcript\nDate: ${new Date().toLocaleString()}\n\n`;
        messages.forEach((m) => {
          const sender = m.role === 'user' ? 'YOU' : `NEXORA AI (${m.modelUsed || 'Assistant'})`;
          txt += `[${sender}]\n${m.content}\n\n----------------------------------------\n\n`;
        });
        const blob = new Blob([txt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexora-chat-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      // Default: Markdown (.md)
      let md = `# Conversation Export — NEXORA AI\n\n`;
      md += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
      messages.forEach((m) => {
        const sender = m.role === 'user' ? '### 👤 You' : `### 🤖 NEXORA AI (${m.modelUsed || 'Assistant'})`;
        md += `${sender}\n\n${m.content}\n\n---\n\n`;
      });

      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexora-chat-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [messages]
  );

  const handleCopyHistory = useCallback(() => {
    if (messages.length === 0) return;
    let fullText = `NEXORA AI Conversation\n\n`;
    messages.forEach((m) => {
      const sender = m.role === 'user' ? 'You' : `NEXORA (${m.modelUsed || 'AI'})`;
      fullText += `${sender}:\n${m.content}\n\n`;
    });
    navigator.clipboard.writeText(fullText.trim());
    setCopiedHistory(true);
    setTimeout(() => setCopiedHistory(false), 2500);
  }, [messages]);

  return (
    <div className="chat-container">
      {/* Top Utility Bar if messages exist */}
      {messages.length > 0 && (
        <div className="chat-top-utility-bar">
          <div className="chat-utility-left">
            <span className="chat-msg-count">{messages.length} messages</span>
          </div>
          <div className="chat-utility-actions">
            <button
              type="button"
              className="utility-btn"
              onClick={handleCopyHistory}
              title="Copy entire chat history to clipboard"
            >
              {copiedHistory ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy History</span>
                </>
              )}
            </button>

            <div className="export-dropdown-wrap">
              <button
                type="button"
                className="utility-btn utility-btn-primary"
                onClick={() => setShowExportMenu(!showExportMenu)}
                title="Save & Download Chat History"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Save / Export</span>
              </button>

              {showExportMenu && (
                <div className="export-menu-dropdown">
                  <button
                    type="button"
                    className="export-menu-item"
                    onClick={() => handleExport('md')}
                  >
                    <span className="export-item-icon">📄</span>
                    <div className="export-item-text">
                      <span className="export-item-title">Markdown (.md)</span>
                      <span className="export-item-sub">Formatted headings & code</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="export-menu-item"
                    onClick={() => handleExport('txt')}
                  >
                    <span className="export-item-icon">📝</span>
                    <div className="export-item-text">
                      <span className="export-item-title">Plain Text (.txt)</span>
                      <span className="export-item-sub">Clean readable text transcript</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="export-menu-item"
                    onClick={() => handleExport('json')}
                  >
                    <span className="export-item-icon">💻</span>
                    <div className="export-item-text">
                      <span className="export-item-title">JSON Data (.json)</span>
                      <span className="export-item-sub">Structured message objects</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {messages.length === 0 && !isLoading ? (
        <EmptyState onSuggestion={handleSuggestion} />
      ) : (
        <MessageList
          messages={messages}
          isLoading={isLoading}
          streamingMessageId={streamingMessageId}
          onRegenerate={handleRegenerate}
          onEditMessage={handleEditMessage}
        />
      )}

      {/* Error Alert */}
      {error && (
        <div className="chat-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
          </svg>
          <span className="error-text-content">{error}</span>
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

      <Composer
        onSend={sendMessage}
        isLoading={isLoading}
        onStop={handleStop}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
    </div>
  );
}
