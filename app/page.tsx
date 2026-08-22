'use client';

// ============================================================
// NEXORA AI — Official Landing & Home Page
// ============================================================
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/auth/auth-provider';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { CodeBlock } from '@/components/chat/code-block';

export default function HomePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'python' | 'typescript' | 'sql'>('python');

  const codeSamples = {
    python: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Nexora API Service", version="2.0.0")

class ChatPrompt(BaseModel):
    conversation_id: str
    message: str
    temperature: float = 0.7

@app.post("/v1/chat/completions")
async def generate_response(prompt: ChatPrompt):
    # Process with Nexora AI workflow engine
    response = await process_n8n_agent(prompt)
    return {"status": "success", "data": response}`,
    typescript: `import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/session';
import { sendToN8n } from '@/lib/n8n/client';

export async function POST(req: NextRequest) {
  const token = await authenticateRequest(req);
  const { message, conversationId } = await req.json();
  
  const aiResult = await sendToN8n({
    conversationId,
    message,
    history: []
  });
  
  return NextResponse.json({ success: true, aiResult });
}`,
    sql: `-- User Conversations Analytics
SELECT 
    c.id AS conversation_id,
    c.title,
    COUNT(m.id) AS total_messages,
    MAX(m.created_at) AS last_activity
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.user_id = :auth_user_id
GROUP BY c.id, c.title
ORDER BY last_activity DESC
LIMIT 20;`,
  };

  return (
    <div className="landing-page">
      {/* Navigation Header */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-brand">
            <div className="landing-brand-icon">
              <Image
                src="/logo.png"
                alt="NEXORA AI Logo"
                width={32}
                height={32}
                className="brand-logo-img"
                priority
              />
            </div>
            <span className="landing-brand-name">NEXORA AI</span>
          </Link>

          <nav className="landing-nav-links">
            <Link href="/agents" className="landing-nav-link text-violet-400 font-semibold flex items-center gap-1">
              <span>⚡</span> Multi-Agent
            </Link>
            <Link href="/intelligence" className="landing-nav-link">Intelligence</Link>
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#multi-agent" className="landing-nav-link">Agents</a>
            <a href="#code-demo" className="landing-nav-link">Capabilities</a>
          </nav>

          <div className="landing-nav-actions">
            <ThemeToggle />
            {user ? (
              <>
                <Link href="/intelligence" className="landing-btn-ghost">
                  Intelligence
                </Link>
                <Link href="/chat" className="landing-btn-primary">
                  Open Chat
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="landing-btn-ghost">
                  Sign In
                </Link>
                <Link href="/login" className="landing-btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          <span>Nexora AI 2.0 • Autonomous Coding &amp; Reasoning</span>
        </div>

        <h1 className="hero-headline">
          Supercharge your coding with <span className="hero-gradient-text">NEXORA AI</span>
        </h1>

        <p className="hero-subtext">
          The next-generation AI assistant built for developers and creators. Generate full-stack code,
          debug complex systems, automate workflows, and retain conversational context seamlessly.
        </p>

        <div className="hero-ctas">
          <Link href={user ? '/chat' : '/login'} className="hero-cta-primary">
            <span>{user ? 'Go to Chat' : 'Start Free with Nexora'}</span>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <a href="#features" className="hero-cta-secondary">
            Explore Features
          </a>
        </div>

        {/* Hero Interactive UI Preview */}
        <div className="hero-preview-wrapper">
          <div className="hero-preview-window">
            <div className="preview-window-bar">
              <div className="window-dots">
                <span className="window-dot dot-red" />
                <span className="window-dot dot-yellow" />
                <span className="window-dot dot-green" />
              </div>
              <span className="window-title">nexora-ai / chat / session-prod</span>
              <div className="window-badge">Active Session</div>
            </div>

            <div className="preview-chat-body">
              {/* User message */}
              <div className="preview-message preview-user">
                <div className="preview-user-bubble">
                  Create a secure Python authentication middleware with JWT validation and rate limiting.
                </div>
              </div>

              {/* AI message */}
              <div className="preview-message preview-ai">
                <div className="preview-ai-avatar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="preview-ai-content">
                  <p className="preview-ai-intro">
                    Here is a production-ready asynchronous authentication middleware using <strong>PyJWT</strong> and a sliding-window rate limiter:
                  </p>
                  <div className="preview-code-block">
                    <CodeBlock language="python">
{`from fastapi import Request, HTTPException
import jwt
from datetime import datetime, timezone

SECRET_KEY = "your-production-secret-key"
ALGORITHM = "HS256"

async def authenticate_jwt(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = auth_header.split("Bearer ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")`}
                    </CodeBlock>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="landing-section">
        <div className="section-header">
          <h2 className="section-title">Engineered for Developers &amp; Power Users</h2>
          <p className="section-subtitle">
            Experience an AI system engineered for accuracy, speed, and real persistent workflows.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon icon-emerald">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M16 18L22 12L16 6M8 6L2 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="feature-title">Smart Code Synthesis</h3>
            <p className="feature-desc">
              Generate production-ready code with complete type safety, comprehensive error handling, and idiomatic best practices across all modern languages.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon icon-indigo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="feature-title">OpenAI GPT-4o Engine</h3>
            <p className="feature-desc">
              Direct connection to OpenAI state-of-the-art models for lightning-fast reasoning, context awareness, and instant code generation.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon icon-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 22S4 18 4 12V5L12 2L20 5V12C20 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="feature-title">Firebase Auth &amp; Isolation</h3>
            <p className="feature-desc">
              Authenticate with Google, GitHub, or Email/Password. Strict user-scoped Firestore security rules guarantee your chat history is completely private.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon icon-amber">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="feature-title">Persistent Chat Trees</h3>
            <p className="feature-desc">
              Search previous conversations, rename chat sessions, and pick up right where you left off. Every message is saved to your Cloud Firestore.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon icon-purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M9 9H15M9 13H15M9 17H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="feature-title">Safe Markdown &amp; Copy</h3>
            <p className="feature-desc">
              High-speed Prism syntax highlighting with sanitization preventing XSS attacks. Copy code snippets with a single click.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon icon-rose">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="feature-title">Rate Limiting &amp; Defense</h3>
            <p className="feature-desc">
              Built-in sliding-window rate limiters, request payload validation with Zod v4, and comprehensive defensive headers.
            </p>
          </div>
        </div>
      </section>

      {/* Multi-Agent Architecture Showcase */}
      <section id="multi-agent" className="landing-section">
        <div className="section-header">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 mb-3">
            <span>⚡</span> Multi-Agent Architecture
          </span>
          <h2 className="section-title">4 Specialized Autonomous Agents</h2>
          <p className="section-subtitle">
            Harnessing structured inter-agent handoffs, automated delegation, and security consensus verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto my-6 px-4">
          <div className="p-5 rounded-2xl border border-violet-500/30 bg-violet-950/10 backdrop-blur-md space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center border border-violet-500/30">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <h3 className="font-bold text-sm text-violet-300">Lead Orchestrator</h3>
            <p className="text-xs text-muted-foreground">
              Deconstructs user queries, identifies required domains, plans the collaborative pipeline, and synthesizes the final response.
            </p>
            <div className="text-[11px] font-mono text-violet-400/80 bg-violet-500/10 px-2 py-1 rounded">
              Topology &amp; Handoff
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 backdrop-blur-md space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
            <h3 className="font-bold text-sm text-emerald-300">Research Analyst</h3>
            <p className="text-xs text-muted-foreground">
              Analyzes papers, patents, arXiv, competitive intelligence, trends, and provides factual citation grounding.
            </p>
            <div className="text-[11px] font-mono text-emerald-400/80 bg-emerald-500/10 px-2 py-1 rounded">
              arXiv &amp; Patent Intel
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-blue-500/30 bg-blue-950/10 backdrop-blur-md space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-500/30">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <h3 className="font-bold text-sm text-blue-300">Code Engineer</h3>
            <p className="text-xs text-muted-foreground">
              Writes production-grade code, handles debugging, type safety, algorithms, and distributed systems architecture.
            </p>
            <div className="text-[11px] font-mono text-blue-400/80 bg-blue-500/10 px-2 py-1 rounded">
              Type-Safe Architecture
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10 backdrop-blur-md space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <h3 className="font-bold text-sm text-amber-300">Security Critic</h3>
            <p className="text-xs text-muted-foreground">
              Audits outputs for OWASP flaws, hallucinations, rate limits, edge cases, and issues security seals.
            </p>
            <div className="text-[11px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-1 rounded">
              OWASP &amp; Logic Audit
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-lg shadow-violet-600/20 transition"
          >
            <span>Explore Multi-Agent Interactive Topology &amp; Sandbox</span>
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3L11 8L6 13" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Code Capabilities Demo */}
      <section id="code-demo" className="landing-section">
        <div className="section-header">
          <h2 className="section-title">Built for Real-World Development</h2>
          <p className="section-subtitle">
            From backend APIs to complex SQL transformations and modern frontend components.
          </p>
        </div>

        <div className="code-demo-container">
          <div className="code-demo-tabs">
            <button
              onClick={() => setActiveTab('python')}
              className={`demo-tab ${activeTab === 'python' ? 'demo-tab-active' : ''}`}
              type="button"
            >
              Python FastAPI
            </button>
            <button
              onClick={() => setActiveTab('typescript')}
              className={`demo-tab ${activeTab === 'typescript' ? 'demo-tab-active' : ''}`}
              type="button"
            >
              Next.js API Route
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`demo-tab ${activeTab === 'sql' ? 'demo-tab-active' : ''}`}
              type="button"
            >
              PostgreSQL Analytics
            </button>
          </div>

          <div className="code-demo-viewer">
            <CodeBlock language={activeTab === 'sql' ? 'sql' : activeTab}>
              {codeSamples[activeTab]}
            </CodeBlock>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="landing-cta-banner">
        <div className="cta-banner-inner">
          <h2 className="cta-title">Ready to build with Nexora AI?</h2>
          <p className="cta-subtitle">
            Sign in with your email or social account to start generating code and automating your workflow today.
          </p>
          <div className="cta-actions">
            <Link href={user ? '/chat' : '/login'} className="hero-cta-primary">
              <span>{user ? 'Enter Workspace' : 'Get Started for Free'}</span>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-left">
            <div className="footer-brand-wrap">
              <Image
                src="/logo.png"
                alt="NEXORA AI"
                width={24}
                height={24}
                className="footer-logo-img"
              />
              <span className="footer-logo">NEXORA AI</span>
            </div>
            <span className="footer-copy">© {new Date().getFullYear()} Nexora AI. All rights reserved.</span>
          </div>
          <div className="footer-links">
            <Link href="/login" className="footer-link">Sign In</Link>
            <Link href="/chat" className="footer-link">Chat</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
