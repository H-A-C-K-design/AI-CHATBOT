'use client';

// ============================================================
// Composer — Modern ChatGPT-Style Bottom Input Component
// Supports + Action Menu (Files/Photos, Library, Image Gen, Web Search),
// Live Attachment Previews, Drag & Drop, and Multi-AI Controls
// ============================================================
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AI_MODELS, AI_PERSONAS, getModelById, getPersonaById } from '@/lib/ai/models';
import { FileLibraryModal } from './file-library-modal';
import type { AIModelId, AIPersonaId, FileAttachment } from '@/types';

interface ComposerProps {
  onSend: (
    message: string,
    options: {
      model: AIModelId;
      persona: AIPersonaId;
      enableReasoning?: boolean;
      enableIntelligenceRAG?: boolean;
      attachments?: FileAttachment[];
    }
  ) => void;
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
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  
  // Dropdown states
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Advanced toggles
  const [enableIntelligenceRAG, setEnableIntelligenceRAG] = useState(false);
  const [enableReasoning, setEnableReasoning] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const personaDropdownRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

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
    if (!message) {
      textarea.style.height = '24px';
      return;
    }
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [message]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (plusMenuRef.current && !plusMenuRef.current.contains(target)) {
        setIsPlusMenuOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(target)) {
        setIsModelMenuOpen(false);
      }
      if (personaDropdownRef.current && !personaDropdownRef.current.contains(target)) {
        setIsPersonaMenuOpen(false);
      }
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(target)) {
        setIsToolsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Process File List (Images & Documents)
  const processFiles = useCallback((files: FileList | File[]) => {
    const newAttachments: Promise<FileAttachment>[] = Array.from(files).map((file) => {
      return new Promise<FileAttachment>((resolve) => {
        const id = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const isImage = file.type.startsWith('image/');

        if (isImage) {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id,
              name: file.name,
              size: file.size,
              type: file.type,
              dataUrl: reader.result as string,
            });
          };
          reader.readAsDataURL(file);
        } else {
          // Read text/code/doc files
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id,
              name: file.name,
              size: file.size,
              type: file.type || 'text/plain',
              textContent: typeof reader.result === 'string' ? reader.result : '',
            });
          };
          reader.readAsText(file);
        }
      });
    });

    Promise.all(newAttachments).then((resolved) => {
      setAttachments((prev) => [...prev, ...resolved]);
    });
  }, []);

  // File Input Change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
    setIsPlusMenuOpen(false);
  };

  // Remove Attachment
  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Paste handler (for screenshot images & snippets)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const imageFiles = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        processFiles(imageFiles);
      }
    }
  };

  // Select Model & Persona
  const handleSelectModel = useCallback(
    (newModel: AIModelId) => {
      setModel(newModel);
      onModelChange?.(newModel);
      setIsModelMenuOpen(false);
    },
    [onModelChange]
  );

  const handleSelectPersona = useCallback((newPersona: AIPersonaId) => {
    setPersona(newPersona);
    setIsPersonaMenuOpen(false);
  }, []);

  // Action Menu: Create Image
  const handleTriggerCreateImage = () => {
    setIsPlusMenuOpen(false);
    setPersona('creative-strategist');
    setMessage((prev) => prev ? `Create a high-detail image of: ${prev}` : 'Create a high-resolution, futuristic image of ');
    textareaRef.current?.focus();
  };

  // Action Menu: Web Search
  const handleTriggerWebSearch = () => {
    setIsPlusMenuOpen(false);
    setEnableIntelligenceRAG((prev) => !prev);
  };

  // Send Handler
  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if ((!trimmed && attachments.length === 0) || isLoading || disabled) return;

    onSend(trimmed, {
      model,
      persona,
      enableReasoning,
      enableIntelligenceRAG,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    setMessage('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, attachments, isLoading, disabled, model, persona, enableReasoning, enableIntelligenceRAG, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, []);

  const activeModelConfig = getModelById(model);
  const activePersonaConfig = getPersonaById(persona);

  return (
    <div className="chatgpt-composer-wrapper">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.ts,.js,.tsx,.jsx,.py,.json,.csv,.md,.html,.css,.sql,.yaml,.yml"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        id="composer-hidden-file-input"
      />

      {/* Main Composer Box */}
      <div
        className={`chatgpt-composer-box ${isDragOver ? 'composer-box-dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        {isDragOver && (
          <div className="composer-drag-overlay">
            <div className="composer-drag-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Drop photos & files to attach</span>
            </div>
          </div>
        )}

        {/* Attachment Preview Chips */}
        {attachments.length > 0 && (
          <div className="composer-attachments-row">
            {attachments.map((att) => (
              <div key={att.id} className="composer-attachment-card">
                {att.dataUrl ? (
                  <div className="attachment-thumb-wrap">
                    <img src={att.dataUrl} alt={att.name} className="attachment-thumb-img" />
                  </div>
                ) : (
                  <div className="attachment-doc-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                      <polyline points="13 2 13 9 20 9" />
                    </svg>
                  </div>
                )}
                <div className="attachment-info">
                  <span className="attachment-name" title={att.name}>{att.name}</span>
                  <span className="attachment-size">{(att.size / 1024).toFixed(1)} KB</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="attachment-remove-btn"
                  aria-label={`Remove ${att.name}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input Row */}
        <div className="chatgpt-input-row">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              enableIntelligenceRAG
                ? 'Ask NEXORA with live web & intelligence search...'
                : 'Ask NEXORA anything...'
            }
            className="chatgpt-composer-textarea"
            rows={1}
            disabled={disabled}
            aria-label="Ask NEXORA anything"
            id="chatgpt-composer-textarea"
          />
        </div>

        {/* Bottom Controls Bar */}
        <div className="chatgpt-composer-controls">
          {/* Left Controls: Plus Menu, AI Persona & Tools */}
          <div className="chatgpt-composer-left">
            {/* ➕ Plus Action Menu (Uploads, Library, Image, Search) */}
            <div className="chatgpt-dropdown-wrap" ref={plusMenuRef}>
              <button
                type="button"
                className={`composer-plus-btn ${isPlusMenuOpen ? 'plus-btn-active' : ''}`}
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                aria-expanded={isPlusMenuOpen}
                title="Add files, search web or visualize"
                id="btn-composer-plus-menu"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>

              {/* Plus Popover Menu (Matching User's Reference) */}
              {isPlusMenuOpen && (
                <div className="composer-plus-popover">
                  {/* Option 1: Add photos & files */}
                  <button
                    type="button"
                    className="plus-popover-item"
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                  >
                    <div className="plus-popover-icon plus-icon-paperclip">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </div>
                    <div className="plus-popover-text">
                      <span className="plus-popover-title">Add photos & files</span>
                      <span className="plus-popover-sub">Upload from computer</span>
                    </div>
                  </button>

                  {/* Option 2: Add from library */}
                  <button
                    type="button"
                    className="plus-popover-item"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      setIsLibraryModalOpen(true);
                    }}
                  >
                    <div className="plus-popover-icon plus-icon-library">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </div>
                    <div className="plus-popover-text">
                      <span className="plus-popover-title">Add from library</span>
                      <span className="plus-popover-sub">Browse and search your files</span>
                    </div>
                  </button>

                  {/* Option 3: Create image */}
                  <button
                    type="button"
                    className="plus-popover-item"
                    onClick={handleTriggerCreateImage}
                  >
                    <div className="plus-popover-icon plus-icon-image">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <div className="plus-popover-text">
                      <span className="plus-popover-title">Create image</span>
                      <span className="plus-popover-sub">Visualize anything</span>
                    </div>
                  </button>

                  {/* Option 4: Web search */}
                  <button
                    type="button"
                    className={`plus-popover-item ${enableIntelligenceRAG ? 'plus-popover-item-active' : ''}`}
                    onClick={handleTriggerWebSearch}
                  >
                    <div className="plus-popover-icon plus-icon-web">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </div>
                    <div className="plus-popover-text">
                      <span className="plus-popover-title">
                        Web search {enableIntelligenceRAG && <span className="plus-active-dot" />}
                      </span>
                      <span className="plus-popover-sub">Find real-time news and info</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* AI Persona Selector Dropdown */}
            <div className="chatgpt-dropdown-wrap" ref={personaDropdownRef}>
              <button
                type="button"
                className="chatgpt-control-pill"
                onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
                aria-expanded={isPersonaMenuOpen}
                title="Select AI Mode"
              >
                <span>{activePersonaConfig.icon}</span>
                <span className="chatgpt-pill-label">{activePersonaConfig.name}</span>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="chatgpt-dropdown-arrow">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              {isPersonaMenuOpen && (
                <div className="chatgpt-popover-menu chatgpt-popover-left">
                  <div className="chatgpt-popover-header">AI Persona Mode</div>
                  {AI_PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`chatgpt-popover-item ${persona === p.id ? 'popover-item-active' : ''}`}
                      onClick={() => handleSelectPersona(p.id)}
                    >
                      <span className="popover-item-icon">{p.icon}</span>
                      <div className="popover-item-content">
                        <span className="popover-item-title">{p.name}</span>
                        <span className="popover-item-desc">{p.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tools Dropdown (Live Intel & Deep Think) */}
            <div className="chatgpt-dropdown-wrap" ref={toolsDropdownRef}>
              <button
                type="button"
                className={`chatgpt-control-pill ${enableIntelligenceRAG || enableReasoning ? 'pill-active-accent' : ''}`}
                onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                aria-expanded={isToolsMenuOpen}
                title="Reasoning & Intel Tools"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                <span className="chatgpt-pill-label">Tools</span>
                {(enableIntelligenceRAG || enableReasoning) && (
                  <span className="chatgpt-active-badge">
                    {(enableIntelligenceRAG ? 1 : 0) + (enableReasoning ? 1 : 0)}
                  </span>
                )}
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="chatgpt-dropdown-arrow">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              {isToolsMenuOpen && (
                <div className="chatgpt-popover-menu chatgpt-popover-left chatgpt-tools-popover">
                  <div className="chatgpt-popover-header">Advanced Capabilities</div>
                  <button
                    type="button"
                    className={`chatgpt-toggle-row ${enableIntelligenceRAG ? 'toggle-row-active' : ''}`}
                    onClick={() => setEnableIntelligenceRAG(!enableIntelligenceRAG)}
                  >
                    <div className="toggle-row-text">
                      <span className="toggle-row-title">🌐 Live Web & Database Intel</span>
                      <span className="toggle-row-sub">Ground answers with real-time web intelligence</span>
                    </div>
                    <div className={`chatgpt-switch ${enableIntelligenceRAG ? 'switch-on' : ''}`}>
                      <div className="switch-knob" />
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`chatgpt-toggle-row ${enableReasoning ? 'toggle-row-active' : ''}`}
                    onClick={() => setEnableReasoning(!enableReasoning)}
                  >
                    <div className="toggle-row-text">
                      <span className="toggle-row-title">🧠 Deep Think / Reasoning</span>
                      <span className="toggle-row-sub">Step-by-step chain-of-thought analysis</span>
                    </div>
                    <div className={`chatgpt-switch ${enableReasoning ? 'switch-on' : ''}`}>
                      <div className="switch-knob" />
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: Model Selector & Send Button */}
          <div className="chatgpt-composer-right">
            {/* Model Selector Dropdown */}
            <div className="chatgpt-dropdown-wrap" ref={modelDropdownRef}>
              <button
                type="button"
                className="chatgpt-control-pill chatgpt-model-pill"
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                aria-expanded={isModelMenuOpen}
                title="Change AI Model"
              >
                <span className="chatgpt-model-name">{activeModelConfig.name}</span>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="chatgpt-dropdown-arrow">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              {isModelMenuOpen && (
                <div className="chatgpt-popover-menu chatgpt-popover-right chatgpt-model-popover">
                  <div className="chatgpt-popover-header">Model Selection</div>
                  {AI_MODELS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`chatgpt-popover-item ${model === m.id ? 'popover-item-active' : ''}`}
                      onClick={() => handleSelectModel(m.id)}
                    >
                      <div className="popover-item-content">
                        <div className="popover-model-header">
                          <span className="popover-item-title">{m.name}</span>
                          <span className="popover-model-badge">{m.badge}</span>
                        </div>
                        <span className="popover-item-desc">{m.description}</span>
                        <div className="popover-model-meta">
                          <span>By {m.provider}</span>
                          <span>{m.contextWindow}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Send / Stop Button */}
            {isLoading && onStop ? (
              <button
                onClick={onStop}
                className="chatgpt-send-btn chatgpt-stop-btn"
                type="button"
                aria-label="Stop generating"
                title="Stop generating"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="3" y="3" width="10" height="10" rx="1.5" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={(!message.trim() && attachments.length === 0) || isLoading || disabled}
                className="chatgpt-send-btn"
                type="button"
                aria-label="Send prompt"
                title="Send prompt (Enter)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="chatgpt-composer-disclaimer">
        <span>NEXORA AI can make mistakes. Verify important information.</span>
      </div>

      {/* Knowledge & File Library Modal */}
      <FileLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onSelectFiles={(files) => setAttachments((prev) => [...prev, ...files])}
      />
    </div>
  );
}
