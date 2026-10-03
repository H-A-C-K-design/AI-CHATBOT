'use client';

// ============================================================
// Code Block Component — Syntax Highlighting + Live Interactive Animation Sandbox
// ============================================================
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  language: string;
  children: string;
}

export function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const cleanLang = (language || '').toLowerCase().trim();

  // Detect if code is runnable as an interactive animation/preview
  const isPreviewable = useMemo(() => {
    const code = children || '';
    if (['html', 'htm', 'svg', 'xml'].includes(cleanLang)) return true;
    if (cleanLang === 'javascript' || cleanLang === 'js' || cleanLang === 'typescript' || cleanLang === 'ts') {
      return (
        code.includes('canvas') ||
        code.includes('requestAnimationFrame') ||
        code.includes('document.createElement') ||
        code.includes('addEventListener') ||
        code.includes('THREE') ||
        code.includes('gsap') ||
        code.includes('ctx.') ||
        code.includes('getContext') ||
        code.includes('particles') ||
        code.includes('animate')
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

  // Auto-default to live interactive preview if animation or HTML
  const shouldDefaultPreview = useMemo(() => {
    const code = children || '';
    return (
      cleanLang === 'html' ||
      cleanLang === 'htm' ||
      cleanLang === 'svg' ||
      code.includes('<canvas') ||
      code.includes('requestAnimationFrame') ||
      code.includes('<!DOCTYPE html>') ||
      (isPreviewable && (cleanLang === 'js' || cleanLang === 'javascript'))
    );
  }, [cleanLang, children, isPreviewable]);

  const [activeTab, setActiveTab] = useState<'code' | 'preview'>(shouldDefaultPreview ? 'preview' : 'code');
  const [key, setKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const blockWrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync tab if code changes to an interactive preview
  useEffect(() => {
    if (shouldDefaultPreview) {
      setActiveTab('preview');
    }
  }, [shouldDefaultPreview]);

  // Listen to native browser fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);

      // Notify iframe to resize its canvas/renderer
      setTimeout(() => {
        try {
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.dispatchEvent(new Event('resize'));
          }
        } catch {
          // Cross-origin safe ignore
        }
      }, 100);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Construct iframe document for the interactive animation sandbox
  const iframeSrcDoc = useMemo(() => {
    if (!isPreviewable) return '';
    const code = children.trim();

    // 1. SVG rendering
    if (code.startsWith('<svg') || cleanLang === 'svg') {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: #080c14;
      color: #e6edf3;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
    }
    svg { max-width: 90vw; max-height: 85vh; filter: drop-shadow(0 0 24px rgba(56, 189, 248, 0.45)); }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
    }

    // 2. CSS Animation Playground
    if (cleanLang === 'css') {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: radial-gradient(circle at center, #0f172a 0%, #030712 100%);
      color: #e6edf3;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .preview-stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
    }
    ${code}
  </style>
</head>
<body>
  <div class="preview-stage">
    <div class="animated-element box glowing-box circle particle spinner pulse-element"></div>
  </div>
</body>
</html>`;
    }

    // 3. JavaScript / Canvas / 3D Animation Sandbox
    if ((cleanLang === 'javascript' || cleanLang === 'js' || cleanLang === 'typescript' || cleanLang === 'ts') && !code.includes('<html')) {
      const needsThree = code.includes('THREE') || code.includes('Scene') || code.includes('PerspectiveCamera');
      const needsGSAP = code.includes('gsap') || code.includes('TweenMax') || code.includes('TimelineMax');
      const needsAnime = code.includes('anime(');

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: #060911;
      color: #e6edf3;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      position: relative;
    }
    canvas {
      display: block;
      width: 100vw;
      height: 100vh;
      position: absolute;
      top: 0;
      left: 0;
    }
    #error-overlay {
      display: none;
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: rgba(239, 68, 68, 0.9);
      color: white;
      padding: 12px 18px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
  </style>
  ${needsThree ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>' : ''}
  ${needsGSAP ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>' : ''}
  ${needsAnime ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>' : ''}
</head>
<body>
  <canvas id="canvas"></canvas>
  <div id="error-overlay"></div>

  <script>
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      const errBox = document.getElementById('error-overlay');
      if (errBox) {
        errBox.style.display = 'block';
        errBox.textContent = 'Animation Runtime Notice: ' + msg + ' (line ' + lineNo + ')';
      }
      return false;
    };

    // Scaffolding aliases
    const canvas = document.getElementById('canvas');
    window.canvas = canvas;
    window.simCanvas = canvas;
    window.c = canvas;
    window.myCanvas = canvas;

    function autoResizeCanvas() {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    }
    window.addEventListener('resize', autoResizeCanvas);
    autoResizeCanvas();

    try {
      ${code}
    } catch (err) {
      const errBox = document.getElementById('error-overlay');
      if (errBox) {
        errBox.style.display = 'block';
        errBox.textContent = 'Animation Init Notice: ' + err.message;
      }
    }
  </script>
</body>
</html>`;
    }

    // 4. Complete HTML5 application
    if (code.toLowerCase().includes('<!doctype') || code.toLowerCase().includes('<html')) {
      // Inject auto-resizing and full-bleed viewport style if missing
      let enrichedCode = code;
      const injection = `
<style>
  html, body {
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    background: #05070e !important;
  }
</style>
<script>
  window.addEventListener('resize', () => {
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(c => {
      if (!c.getAttribute('data-fixed-size')) {
        c.width = window.innerWidth;
        c.height = window.innerHeight;
      }
    });
  });
</script>
`;
      if (enrichedCode.includes('</head>')) {
        enrichedCode = enrichedCode.replace('</head>', `${injection}</head>`);
      } else if (enrichedCode.includes('<body>')) {
        enrichedCode = enrichedCode.replace('<body>', `<head>${injection}</head><body>`);
      }
      return enrichedCode;
    }

    // 5. Default HTML wrapper for loose snippets
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: #080c14;
      color: #e6edf3;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
    }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
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
    const target = blockWrapperRef.current;
    if (!target) return;

    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {
          setIsFullscreen((prev) => !prev);
        });
      } else if ((target as any).webkitRequestFullscreen) {
        (target as any).webkitRequestFullscreen();
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const restartAnimation = () => {
    setKey((prev) => prev + 1);
  };

  const displayLanguage = language || 'text';

  return (
    <div className={`code-block-wrapper ${isFullscreen ? 'is-fullscreen' : ''}`} ref={blockWrapperRef}>
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
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Preview'}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Preview'}
              >
                {isFullscreen ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    <span>Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                    <span>Fullscreen</span>
                  </>
                )}
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
        <div className="animation-sandbox-container">
          <div className="sandbox-top-bar">
            <div className="sandbox-indicator">
              <span className="sandbox-status-pulse" />
              <span>Interactive 60FPS Live Animation Sandbox</span>
            </div>
            <div className="sandbox-controls-right">
              <span className="sandbox-tip">Interact with mouse / touch</span>
              {isFullscreen && (
                <button
                  type="button"
                  className="sandbox-exit-fs-btn"
                  onClick={toggleFullscreen}
                >
                  ✕ Exit Fullscreen
                </button>
              )}
            </div>
          </div>
          <iframe
            ref={iframeRef}
            key={key}
            srcDoc={iframeSrcDoc}
            title="Interactive Animation Sandbox"
            sandbox="allow-scripts allow-modals allow-pointer-lock allow-same-origin allow-forms"
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
