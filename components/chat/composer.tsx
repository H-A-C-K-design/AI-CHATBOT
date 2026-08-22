'use client';

// ============================================================
// Composer — Modern Multi-AI Chat Input with Model Selector
// ============================================================
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AI_MODELS, AI_PERSONAS, getModelById, getPersonaById } from '@/lib/ai/models';
import type { AIModelId, AIPersonaId } from '@/types';

interface ComposerProps {
  onSend: (message: string, options: {
    model: AIModelId;
    persona: AIPersonaId;
    enableReasoning?: boolean;
    enableIntelligenceRAG?: boolean;
    enableAgentMode?: boolean;
  }) => void;
  isLoading: boolean;
  onStop?: () => void;
  disabled?: boolean;
  selectedModel?: AIModelId;
  onModelChange?: (model: AIModelId) => void;
}

export function Composer({
  onSend,
  isLoading,
  onStop,
  disabled,
  selectedModel = 'gemini-3.5-flash',
  onModelChange,
}: ComposerProps) {
  const [message, setMessage] = useState('');
  const [model, setModel] = useState<AIModelId>(selectedModel);
  const [persona, setPersona] = useState<AIPersonaId>('general-assistant');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [enableIntelligenceRAG, setEnableIntelligenceRAG] = useState(false);
  const [enableReasoning, setEnableReasoning] = useState(false);
  const [enableAgentMode, setEnableAgentMode] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync external selectedModel
  useEffect(() => {
    if (selectedModel && selectedModel !== model) {
      setModel(selectedModel);
    }
  }, [selectedModel, model]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [message]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectModel = useCallback(
    (newModel: AIModelId) => {
      setModel(newModel);
      onModelChange?.(newModel);
      setIsModelMenuOpen(false);
    },
    [onModelChange]
  );

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || isLoading || disabled) return;

    onSend(trimmed, {
      model,
      persona,
      enableReasoning,
      enableIntelligenceRAG,
      enableAgentMode,
    });

    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, isLoading, disabled, model, persona, enableReasoning, enableIntelligenceRAG, enableAgentMode, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const activeModelConfig = getModelById(model);

  return (
    <div className="composer-wrapper">
      {/* Persona Quick Pills */}
      <div className="persona-pills-bar">
        {AI_PERSONAS.map((p) => {
          const isActive = persona === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className={`persona-pill ${isActive ? 'persona-pill-active' : ''}`}
              onClick={() => setPersona(p.id)}
              title={p.description}
            >
              <span className="persona-pill-icon">{p.icon}</span>
              <span className="persona-pill-label">{p.name}</span>
            </button>
          );
        })}
      </div>

      <div className="composer">
        {/* Top Control Bar: Model Selector Dropdown & Toggles */}
        <div className="composer-top-bar">
          <div className="model-dropdown-container" ref={dropdownRef}>
            <button
              type="button"
              className="model-select-btn"
              onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
              aria-expanded={isModelMenuOpen}
              aria-label="Select AI Model"
            >
              <div className="model-badge-icon">
                {activeModelConfig.iconType === 'gemini' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24Z" />
                  </svg>
                )}
                {activeModelConfig.iconType === 'openai' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
                {activeModelConfig.iconType === 'deepseek' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polygon points="2 17 12 22 22 17" />
                  </svg>
                )}
                {activeModelConfig.iconType === 'claude' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="4" y="4" width="16" height="16" rx="4" />
                  </svg>
                )}
                {activeModelConfig.iconType === 'router' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                )}
              </div>
              <span className="model-select-name">{activeModelConfig.name}</span>
              <span className="model-badge-tag">{activeModelConfig.badge}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                className={`model-select-chevron ${isModelMenuOpen ? 'chevron-rotated' : ''}`}
              >
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {/* Model Selection Dropdown Menu */}
            {isModelMenuOpen && (
              <div className="model-dropdown-menu">
                <div className="model-dropdown-header">Choose an AI Model</div>
                <div className="model-dropdown-list">
                  {AI_MODELS.map((m) => {
                    const isCurrent = m.id === model;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        className={`model-option-card ${isCurrent ? 'model-option-active' : ''}`}
                        onClick={() => handleSelectModel(m.id)}
                      >
                        <div className="model-option-top">
                          <span className="model-option-title">{m.name}</span>
                          <span className="model-option-badge">{m.badge}</span>
                        </div>
                        <p className="model-option-desc">{m.description}</p>
                        <div className="model-option-footer">
                          <span className="model-option-provider">By {m.provider}</span>
                          <span className="model-option-ctx">{m.contextWindow}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Feature Toggles */}
          <div className="composer-toggles">
            <button
              type="button"
              className={`toggle-pill toggle-pill-agent ${enableAgentMode ? 'toggle-pill-agent-active' : ''}`}
              onClick={() => setEnableAgentMode(!enableAgentMode)}
              title="Autonomous Cognitive Lifecycle: Understand → Plan/Reason → Collaborate → Use Tools → Manage Context"
            >
              <span className="pill-sparkle">⚡</span>
              <span>Agent Mode</span>
            </button>

            <button
              type="button"
              className={`toggle-pill ${enableIntelligenceRAG ? 'toggle-pill-active' : ''}`}
              onClick={() => setEnableIntelligenceRAG(!enableIntelligenceRAG)}
              title="Ground answers with Real-Time Database Intelligence & Patent Search"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <span>Live Intel</span>
            </button>

            <button
              type="button"
              className={`toggle-pill ${enableReasoning ? 'toggle-pill-active' : ''}`}
              onClick={() => setEnableReasoning(!enableReasoning)}
              title="Enable Deep Thinking & Step-by-step reasoning"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <span>Deep Think</span>
            </button>
          </div>
        </div>

        {/* Input Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask ${activeModelConfig.name} anything... (Type code, questions, or paste errors)`}
          className="composer-textarea"
          rows={1}
          disabled={disabled}
          aria-label="Message input"
          id="composer-textarea"
        />

        {/* Action Controls */}
        <div className="composer-actions">
          {isLoading && onStop ? (
            <button
              onClick={onStop}
              className="composer-btn composer-btn-stop"
              type="button"
              aria-label="Stop generating"
              title="Stop generating response"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
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
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 14V2M8 2L3 7M8 2L13 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="composer-footer-info">
        <span>Press <kbd>Enter</kbd> to send, <kbd>Shift</kbd> + <kbd>Enter</kbd> for new line</span>
        <span className="composer-active-tag">Powered by Real-Time Multi-AI</span>
      </div>
    </div>
  );
}
