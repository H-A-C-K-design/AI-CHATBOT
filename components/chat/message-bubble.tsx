'use client';

// ============================================================
// Message Bubble Component — ChatGPT & Multi-AI Experience
// Supports Thinking Process, TTS Audio, Model Badges & Regenerate
// ============================================================
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MarkdownRenderer } from './markdown-renderer';
import { AgentTaskViewer } from '@/components/agent/agent-task-viewer';
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

  const modelBadge = message.modelUsed || 'AI Assistant';

  return (
    <div className={`message-bubble ${isUser ? 'message-user' : 'message-assistant'}`}>
      {/* Avatar */}
      <div className={`message-avatar ${isUser ? 'avatar-user' : 'avatar-assistant'}`}>
        {isUser ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
            <path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <div className="assistant-avatar-glow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24Z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="message-content-wrapper">
        {/* Header with Model Badge & Persona */}
        <div className="message-header-bar">
          <span className="message-role-label">
            {isUser ? 'You' : 'NEXORA'}
          </span>
          {isAssistant && (
            <div className="message-meta-tags">
              <span className="message-model-badge">
                <span className="model-sparkle">✦</span> {modelBadge}
              </span>
              {message.personaUsed && (
                <span className="message-persona-tag">{message.personaUsed}</span>
              )}
            </div>
          )}
        </div>

        {/* Autonomous 5-Stage Agent Task Viewer */}
        {message.agentExecutionState && (
          <AgentTaskViewer
            executionState={message.agentExecutionState}
            isExecuting={isStreaming && !message.content}
          />
        )}

        {/* Collapsible Thinking / Reasoning Block */}
        {message.thinkingContent && (
          <div className="thinking-accordion">
            <button
              type="button"
              className="thinking-header-btn"
              onClick={() => setShowThinking(!showThinking)}
            >
              <div className="thinking-header-left">
                <span className="thinking-pulse-dot" />
                <span className="thinking-title">
                  {isStreaming && !message.content ? 'Thinking & reasoning...' : 'Reasoning Process'}
                </span>
                {message.reasoningDurationMs && (
                  <span className="thinking-time">
                    ({(message.reasoningDurationMs / 1000).toFixed(1)}s)
                  </span>
                )}
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                className={`thinking-chevron ${showThinking ? 'chevron-rotated' : ''}`}
              >
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {showThinking && (
              <div className="thinking-body">
                <p className="thinking-text">{message.thinkingContent}</p>
              </div>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div className="message-content">
          {isUser ? (
            isEditing ? (
              <div className="edit-message-box">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="edit-message-textarea"
                  rows={3}
                />
                <div className="edit-message-actions">
                  <button
                    type="button"
                    className="edit-btn-cancel"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="edit-btn-save"
                    onClick={handleConfirmEdit}
                  >
                    Send
                  </button>
                </div>
              </div>
            ) : (
              <p className="message-text-user">{message.content}</p>
            )
          ) : (
            <div className="message-text-assistant">
              {message.content ? (
                <MarkdownRenderer content={message.content} />
              ) : isStreaming ? (
                <div className="streaming-placeholder">
                  <span className="streaming-cursor-pulsing" />
                </div>
              ) : null}

              {/* Pulsating Cursor while streaming */}
              {isStreaming && message.content && (
                <span className="streaming-cursor">▊</span>
              )}
            </div>
          )}
        </div>

        {/* Sources & Citations if available */}
        {message.sources && message.sources.length > 0 && (
          <div className="sources-container">
            <div className="sources-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span>Verified Sources & Intel:</span>
            </div>
            <div className="sources-grid">
              {message.sources.map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-card"
                >
                  <span className="source-card-title">{s.title}</span>
                  <span className="source-card-meta">{s.sourceName} {s.type ? `• ${s.type}` : ''}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="message-actions-bar">
          {isUser && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="message-action-btn"
              type="button"
              title="Edit message"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Edit</span>
            </button>
          )}

          {isAssistant && !isStreaming && (
            <>
              {/* Copy Button */}
              <button
                onClick={handleCopyMessage}
                className="message-action-btn"
                type="button"
                aria-label={copied ? 'Copied' : 'Copy response'}
                title={copied ? 'Copied to clipboard!' : 'Copy response'}
              >
                {copied ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13.5 4.5L6 12L2.5 8.5" />
                    </svg>
                    <span className="action-label">Copied</span>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="5" y="5" width="9" height="9" rx="1.5" />
                      <path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" />
                    </svg>
                    <span className="action-label">Copy</span>
                  </>
                )}
              </button>

              {/* Text-to-Speech (Read Aloud) */}
              <button
                onClick={handleToggleSpeak}
                className={`message-action-btn ${isSpeaking ? 'message-action-active' : ''}`}
                type="button"
                title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
              >
                {isSpeaking ? (
                  <>
                    <div className="audio-equalizer">
                      <span className="eq-bar bar-1" />
                      <span className="eq-bar bar-2" />
                      <span className="eq-bar bar-3" />
                    </div>
                    <span className="action-label">Speaking...</span>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                    <span className="action-label">Read Aloud</span>
                  </>
                )}
              </button>

              {/* Regenerate Button */}
              {onRegenerate && (
                <button
                  onClick={() => onRegenerate()}
                  className="message-action-btn"
                  type="button"
                  title="Regenerate response"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6" />
                    <path d="M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  <span className="action-label">Regenerate</span>
                </button>
              )}

              {/* Feedback buttons */}
              <button
                onClick={() => setFeedback(feedback === 'liked' ? null : 'liked')}
                className={`message-action-btn ${feedback === 'liked' ? 'feedback-liked' : ''}`}
                type="button"
                title="Good response"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              </button>
              <button
                onClick={() => setFeedback(feedback === 'disliked' ? null : 'disliked')}
                className={`message-action-btn ${feedback === 'disliked' ? 'feedback-disliked' : ''}`}
                type="button"
                title="Poor response"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
