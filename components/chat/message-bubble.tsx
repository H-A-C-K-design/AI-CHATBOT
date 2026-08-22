'use client';

// ============================================================
// Message Bubble Component — ChatGPT-Style Pure Conversational Flow
// Direct conversation stream without heavy cards or unnecessary borders
// ============================================================
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MarkdownRenderer } from './markdown-renderer';
import { NexoraLogo } from '@/components/ui/nexora-logo';
import type { Message, AIModelId } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: (modelOverride?: AIModelId) => void;
  onEditMessage?: (newContent: string) => void;
}

export function MessageBubble({
  message,
  isStreaming = false,
  onRegenerate,
  onEditMessage,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(null);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Auto-expand thinking drawer during streaming if thinking tokens arrive
  useEffect(() => {
    if (message.thinkingContent && isStreaming) {
      setShowThinking(true);
    }
  }, [message.thinkingContent, isStreaming]);

  // Clean up speech synthesis
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent fail
    }
  }, [message.content]);

  const handleToggleSpeak = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = message.content.replace(/```[\s\S]*?```/g, 'Code block omitted.');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, message.content]);

  const handleConfirmEdit = useCallback(() => {
    if (editContent.trim() && editContent !== message.content) {
      onEditMessage?.(editContent.trim());
    }
    setIsEditing(false);
  }, [editContent, message.content, onEditMessage]);

  // ──────────────────────────────────────────────────────────
  // USER MESSAGE VIEW (Compact Right-Aligned Bubble)
  // ──────────────────────────────────────────────────────────
  if (isUser) {
    return (
      <div className="chat-msg-row chat-msg-row-user">
        <div className="chat-user-bubble-container">
          {isEditing ? (
            <div className="chat-edit-box">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="chat-edit-textarea"
                rows={3}
                autoFocus
              />
              <div className="chat-edit-actions">
                <button
                  type="button"
                  className="chat-edit-btn-cancel"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="chat-edit-btn-send"
                  onClick={handleConfirmEdit}
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="chat-user-bubble">
              {/* Attached Images and Files */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="chat-msg-attachments-container">
                  {message.attachments.map((att) => (
                    att.dataUrl ? (
                      <div key={att.id} className="chat-msg-attachment-img-wrap">
                        <img src={att.dataUrl} alt={att.name} className="chat-msg-attachment-img" />
                      </div>
                    ) : (
                      <div key={att.id} className="chat-msg-attachment-file-chip">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                          <polyline points="13 2 13 9 20 9" />
                        </svg>
                        <span className="msg-attachment-name">{att.name}</span>
                        <span className="msg-attachment-size">({(att.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    )
                  ))}
                </div>
              )}
              {message.content && <p className="chat-user-text">{message.content}</p>}
            </div>
          )}

          {/* Edit Action on Hover */}
          {!isEditing && onEditMessage && (
            <div className="chat-user-hover-actions">
              <button
                onClick={() => setIsEditing(true)}
                className="chat-hover-btn"
                type="button"
                aria-label="Edit message"
                title="Edit message"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // ASSISTANT MESSAGE VIEW (Natural Left-Aligned Conversation Flow)
  // ──────────────────────────────────────────────────────────
  return (
    <div className="chat-msg-row chat-msg-row-assistant">
      <NexoraLogo size={28} withBackground={true} glow={false} />

      <div className="chat-assistant-content-wrapper">
        {/* Assistant Header */}
        <div className="chat-assistant-header">
          <span className="chat-assistant-name">NEXORA</span>
          {message.modelUsed && (
            <span className="chat-assistant-model-badge">{message.modelUsed}</span>
          )}
        </div>

        {/* Collapsible Reasoning Process */}
        {message.thinkingContent && (
          <div className="chat-thinking-block">
            <button
              type="button"
              className="chat-thinking-toggle"
              onClick={() => setShowThinking(!showThinking)}
              aria-expanded={showThinking}
            >
              <div className="chat-thinking-left">
                <span className="chat-thinking-dot" />
                <span className="chat-thinking-title">
                  {isStreaming && !message.content ? 'Reasoning...' : 'Thought process'}
                </span>
                {message.reasoningDurationMs && (
                  <span className="chat-thinking-duration">
                    ({(message.reasoningDurationMs / 1000).toFixed(1)}s)
                  </span>
                )}
              </div>
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                className={`chat-thinking-chevron ${showThinking ? 'chevron-rotated' : ''}`}
              >
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {showThinking && (
              <div className="chat-thinking-body">
                <p className="chat-thinking-text">{message.thinkingContent}</p>
              </div>
            )}
          </div>
        )}

        {/* Markdown Content Flow */}
        <div className="chat-assistant-body">
          {message.content ? (
            <MarkdownRenderer content={message.content} />
          ) : isStreaming ? (
            <div className="chat-streaming-dot-pulse">
              <span className="chat-streaming-pulse" />
            </div>
          ) : null}

          {isStreaming && message.content && (
            <span className="chat-cursor-blink">▊</span>
          )}
        </div>

        {/* Sources & Citations if available */}
        {message.sources && message.sources.length > 0 && (
          <div className="chat-sources-block">
            <div className="chat-sources-header">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span>Sources & References:</span>
            </div>
            <div className="chat-sources-list">
              {message.sources.map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chat-source-item"
                >
                  <span className="chat-source-title">{s.title}</span>
                  <span className="chat-source-meta">{s.sourceName}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions Bar */}
        {!isStreaming && (
          <div className="chat-actions-row">
            {/* Copy */}
            <button
              onClick={handleCopyMessage}
              className="chat-action-btn"
              type="button"
              title={copied ? 'Copied to clipboard!' : 'Copy'}
              aria-label="Copy response"
            >
              {copied ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13.5 4.5L6 12L2.5 8.5" />
                  </svg>
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="5" y="5" width="9" height="9" rx="1.5" />
                    <path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" />
                  </svg>
                </>
              )}
            </button>

            {/* Read aloud TTS */}
            <button
              onClick={handleToggleSpeak}
              className={`chat-action-btn ${isSpeaking ? 'chat-action-active' : ''}`}
              type="button"
              title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
            >
              {isSpeaking ? (
                <>
                  <div className="chat-eq-bars">
                    <span className="chat-eq-bar b1" />
                    <span className="chat-eq-bar b2" />
                    <span className="chat-eq-bar b3" />
                  </div>
                  <span>Speaking</span>
                </>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>

            {/* Regenerate / Retry */}
            {onRegenerate && (
              <button
                onClick={() => onRegenerate()}
                className="chat-action-btn"
                type="button"
                title="Regenerate response"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
            )}

            {/* Thumbs up */}
            <button
              onClick={() => setFeedback(feedback === 'liked' ? null : 'liked')}
              className={`chat-action-btn ${feedback === 'liked' ? 'chat-liked' : ''}`}
              type="button"
              title="Good response"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
            </button>

            {/* Thumbs down */}
            <button
              onClick={() => setFeedback(feedback === 'disliked' ? null : 'disliked')}
              className={`chat-action-btn ${feedback === 'disliked' ? 'chat-disliked' : ''}`}
              type="button"
              title="Bad response"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
