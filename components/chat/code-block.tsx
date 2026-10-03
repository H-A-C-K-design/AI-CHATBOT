'use client';

// ============================================================
// Code Block Component — Syntax Highlighting + Live Interactive Animation Sandbox
// ============================================================
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  language: string;
  children: string;
}

export function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [key, setKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const cleanLang = (language || '').toLowerCase().trim();

  // Detect if code is runnable as an interactive animation/preview
  const isPreviewable = useMemo(() => {
    const code = children || '';
    if (['html', 'htm', 'svg', 'xml'].includes(cleanLang)) return true;
    if (cleanLang === 'javascript' || cleanLang === 'js') {
      return (
        code.includes('canvas') ||
        code.includes('requestAnimationFrame') ||
        code.includes('document.createElement') ||
        code.includes('addEventListener')
      );
    }
    if (cleanLang === 'css') {
      return code.includes('@keyframes') || code.includes('animation') || code.includes('transform');
    }
    // General detection
    return (
      code.includes('<!DOCTYPE html>') ||
      code.includes('<canvas') ||
      code.includes('<svg') ||
      code.includes('requestAnimationFrame') ||
      (code.includes('<html') && code.includes('</html>'))
    );
  }, [cleanLang, children]);

  // Construct iframe document for the interactive animation sandbox
  const iframeSrcDoc = useMemo(() => {
    if (!isPreviewable) return '';
    const code = children.trim();

    if (code.startsWith('<svg') || cleanLang === 'svg') {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0d1117;
      color: #e6edf3;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
    }
    svg { max-width: 90vw; max-height: 85vh; filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.4)); }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
    }

    if (cleanLang === 'css') {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0d1117;
      color: #e6edf3;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
    }
    ${code}
  </style>
</head>
<body>
  <div class="animated-element">
    <div class="box"></div>
  </div>
</body>
</html>`;
    }

    if ((cleanLang === 'javascript' || cleanLang === 'js') && !code.includes('<html')) {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0d1117;
      color: #e6edf3;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
    }
    canvas { display: block; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
  </style>
</head>
<body>
  <script>
    try {
      ${code}
    } catch (err) {
      document.body.innerHTML = '<div style="color:#f87171;padding:20px;font-family:monospace;">Animation Error: ' + err.message + '</div>';
    }
  </script>
</body>
</html>`;
    }

    // Default HTML wrapper
    if (!code.toLowerCase().includes('<!doctype') && !code.toLowerCase().includes('<html')) {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    body {
      background: #0d1117;
      color: #e6edf3;
      margin: 0;
      padding: 16px;
      font-family: system-ui, -apple-system, sans-serif;
      overflow-x: hidden;
    }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
    }

    return code;
  }, [isPreviewable, children, cleanLang]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = children;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [children]);

  const toggleFullscreen = () => {
    if (!previewRef.current) return;
    if (!document.fullscreenElement) {
      previewRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const restartAnimation = () => {
    setKey((prev) => prev + 1);
  };

  const displayLanguage = language || 'text';

  return (
    <div className={`code-block-wrapper ${isFullscreen ? 'is-fullscreen' : ''}`}>
      <div className="code-block-header">
        <div className="code-block-header-left">
          {isPreviewable ? (
            <div className="code-preview-tabs">
              <button
                type="button"
                className={`code-tab-btn ${activeTab === 'code' ? 'active' : ''}`}
                onClick={() => setActiveTab('code')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                <span>Code ({displayLanguage})</span>
              </button>
              <button
                type="button"
                className={`code-tab-btn preview-tab-badge ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                <span className="live-dot" />
                <span>🎮 Live Animation &amp; Preview</span>
              </button>
            </div>
          ) : (
            <span className="code-block-language">{displayLanguage}</span>
          )}
        </div>

        <div className="code-block-actions">
          {isPreviewable && activeTab === 'preview' && (
            <>
              <button
                onClick={restartAnimation}
                className="code-block-action-btn"
                type="button"
                title="Restart Animation"
                aria-label="Restart Animation"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>Restart</span>
              </button>
              <button
                onClick={toggleFullscreen}
                className="code-block-action-btn"
                type="button"
                title="Fullscreen Preview"
                aria-label="Fullscreen Preview"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                <span>Fullscreen</span>
              </button>
            </>
          )}

          <button
            onClick={handleCopy}
            className="code-block-copy-btn"
            type="button"
            aria-label={copied ? 'Copied!' : 'Copy code'}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isPreviewable && activeTab === 'preview' ? (
        <div className="animation-sandbox-container" ref={previewRef}>
          <div className="sandbox-top-bar">
            <div className="sandbox-indicator">
              <span className="sandbox-status-pulse" />
              <span>Interactive Animation Sandbox Running</span>
            </div>
            <span className="sandbox-tip">Interact with mouse / keyboard</span>
          </div>
          <iframe
            key={key}
            srcDoc={iframeSrcDoc}
            title="Interactive Animation Sandbox"
            sandbox="allow-scripts allow-modals allow-pointer-lock"
            className="animation-sandbox-iframe"
          />
        </div>
      ) : (
        <SyntaxHighlighter
          language={language || 'text'}
          style={oneDark}
          customStyle={{
            margin: 0,
            borderRadius: '0 0 8px 8px',
            fontSize: '13px',
            lineHeight: '1.6',
            padding: '16px',
          }}
          showLineNumbers={children.split('\n').length > 3}
          wrapLongLines
        >
          {children}
        </SyntaxHighlighter>
      )}
    </div>
  );
}
