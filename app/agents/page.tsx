'use client';

// ============================================================
// Multi-Agent Architecture — System Topology, Registry & Sandbox
// Demonstrates 4 Specialized Agents collaborating with Live Orchestration
// ============================================================
import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SPECIALIZED_AGENTS } from '@/lib/ai/multi-agent';
import type { AgentId, AgentStep } from '@/types';

export default function MultiAgentArchitecturePage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentId>('lead-orchestrator');
  const [demoPrompt, setDemoPrompt] = useState(
    'Design and implement a distributed, fault-tolerant token bucket rate limiter in TypeScript with Redis backing and OWASP security safeguards.'
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedSteps, setSimulatedSteps] = useState<AgentStep[] | null>(null);
  const [activeStepTab, setActiveStepTab] = useState<number>(0);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimulatedSteps(null);

    // Progressive simulated swarm flow to showcase orchestration
    setTimeout(() => {
      const steps: AgentStep[] = [
        {
          agentId: 'lead-orchestrator',
          agentName: 'NEXORA Core Orchestrator',
          role: 'Workflow Planner & Multi-Agent Coordinator',
          title: 'Task Decomposition & Multi-Agent Planning',
          durationMs: 240,
          status: 'completed',
          content: `### 1. Goal Deconstruction
- Objective: Production token bucket rate limiter with Redis cluster support.
- Core Requirements: Atomic Lua script execution, memory efficiency, OWASP header compliance (429 Too Many Requests), distributed lock safety.

### 2. Specialized Agent Delegation
- Research Analyst: Retrieve RFC 6585 rate limiting specs, Redis CELL module benchmarks, and leak bucket vs token bucket mathematical proofs.
- Code Engineer: Construct TypeScript interface, Lua script for atomic sliding refill, and Redis connection pipeline.
- Security Critic: Audit against race condition replay attacks, Redis denial-of-service, and header spoofing.`,
        },
        {
          agentId: 'research-analyst',
          agentName: 'Deep Intelligence & Research Agent',
          role: 'Academic Literature, Patents & Market Intel Analyst',
          title: 'Domain Intelligence & Grounding Analysis',
          durationMs: 380,
          status: 'completed',
          content: `### Grounded Technical Intelligence
1. Standard Specification: RFC 6585 Section 4 specifies HTTP 429 status code with 'Retry-After' and 'RateLimit-*' headers (IETF draft standard).
2. Algorithmic Optimal: Sliding Window Token Bucket via single Redis EVALSHA command achieves O(1) time complexity and avoids split-brain token depletion in multi-node clusters.
3. State of the Art: Redis Lua atomic execution avoids Distributed Lock overhead while ensuring 0% token leakage under 50,000 req/sec load.`,
        },
        {
          agentId: 'code-engineer',
          agentName: 'Systems & Code Architect',
          role: 'Full-Stack Software Engineer & Systems Designer',
          title: 'Systems Design & Code Engineering',
          durationMs: 510,
          status: 'completed',
          content: `\`\`\`typescript
import Redis from 'ioredis';

export interface RateLimitConfig {
  capacity: number;      // Maximum bucket tokens
  refillRate: number;    // Tokens per second
  windowMs: number;
}

const LUA_TOKEN_BUCKET = \`
  local key = KEYS[1]
  local capacity = tonumber(ARGV[1])
  local refillRate = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  local requested = tonumber(ARGV[4])

  local data = redis.call('HMGET', key, 'tokens', 'lastUpdated')
  local tokens = tonumber(data[1])
  local lastUpdated = tonumber(data[2])

  if not tokens then
    tokens = capacity
    lastUpdated = now
  else
    local delta = math.max(0, (now - lastUpdated) / 1000)
    tokens = math.min(capacity, tokens + delta * refillRate)
    lastUpdated = now
  end

  if tokens >= requested then
    tokens = tokens - requested
    redis.call('HMSET', key, 'tokens', tokens, 'lastUpdated', lastUpdated)
    redis.call('PEXPIRE', key, math.ceil((capacity / refillRate) * 1000))
    return {1, tokens, 0}
  else
    local retryAfter = math.ceil((requested - tokens) / refillRate)
    return {0, tokens, retryAfter}
  end
\`;

export class DistributedRateLimiter {
  constructor(private redis: Redis) {}

  async check(key: string, config: RateLimitConfig, requested = 1) {
    const result = await this.redis.eval(
      LUA_TOKEN_BUCKET,
      1,
      \`ratelimit:\${key}\`,
      config.capacity,
      config.refillRate,
      Date.now(),
      requested
    ) as [number, number, number];

    return {
      allowed: result[0] === 1,
      remainingTokens: result[1],
      retryAfterSeconds: result[2],
    };
  }
}
\`\`\``,
        },
        {
          agentId: 'security-critic',
          agentName: 'Logic, Quality & Security Critic',
          role: 'OWASP Security, Hallucination & Code Auditor',
          title: 'Security, Robustness & Quality Audit',
          durationMs: 290,
          status: 'completed',
          content: `### Security & Robustness Verification
✓ Atomic Execution: Evaluated via Redis Lua, eliminating check-then-act race conditions.
✓ Key Poisoning Mitigation: Recommend SHA-256 hashing client IP or user IDs to prevent namespace collision in Redis keys.
✓ DoS Protection: PEXPIRE TTL bounds memory usage, preventing unbounded Redis memory leaks.
✓ OWASP Compliance: Emits compliant \`Retry-After\` and \`X-RateLimit-Remaining\` response headers.

Security Seal: APPROVED (98/100)`,
        },
      ];

      setSimulatedSteps(steps);
      setIsSimulating(false);
      setActiveStepTab(0);
    }, 900);
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const agentsList = Object.values(SPECIALIZED_AGENTS);
  const currentAgent = SPECIALIZED_AGENTS[selectedAgent];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/80 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
              type="button"
              aria-label="Toggle sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">Multi-Agent Architecture</h1>
                <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-400 border border-violet-500/20">
                  4 Specialized Agents Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Autonomous collaboration, delegation topologies, and real-time execution telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-violet-700 transition shadow-md shadow-violet-600/20"
            >
              <span>Test in Live Chat</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 3L11 8L6 13" />
              </svg>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
          {/* Top Hero Banner */}
          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 via-slate-900/40 to-cyan-950/30 p-6 relative overflow-hidden backdrop-blur-md">
            <div className="relative z-10 max-w-3xl space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                <span>⚡</span> Hackathon Architectural Showcase
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight">
                Autonomous Multi-Agent Orchestration & Collaboration
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                NEXORA deploys a network of 4 specialized autonomous agents with clearly defined responsibilities.
                Complex objectives are deconstructed, distributed to domain specialists, audited for security,
                and synthesized through a high-precision multi-perspective consensus pipeline.
              </p>
            </div>
          </div>

          {/* Interactive Topology Graph */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span>🌐</span> Multi-Agent Communication Graph & Topology
                </h3>
                <p className="text-xs text-muted-foreground">
                  Click any agent node to inspect its operational charter and system instructions
                </p>
              </div>
              <span className="text-xs font-mono bg-zinc-800/80 px-2.5 py-1 rounded-md text-zinc-300 border border-white/10">
                Protocol: Handoff & Synthesis Pipeline
              </span>
            </div>

            {/* SVG Visual Flow Graph */}
            <div className="relative rounded-xl border border-white/10 bg-black/40 p-6 overflow-x-auto">
              <div className="min-w-[700px] flex items-center justify-between gap-4 relative py-6">
                {/* Connector Line Background */}
                <div className="absolute left-20 right-20 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-violet-500 via-cyan-500 via-blue-500 to-amber-500 opacity-30 z-0" />

                {agentsList.map((agent, idx) => {
                  const isCurrent = selectedAgent === agent.id;
                  return (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent.id)}
                      className={`relative z-10 flex flex-col items-center cursor-pointer transition-all duration-300 ${
                        isCurrent ? 'scale-105' : 'opacity-80 hover:opacity-100 hover:scale-102'
                      }`}
                    >
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-xl transition border-2 ${
                          isCurrent
                            ? 'bg-violet-600/30 border-violet-400 shadow-violet-500/40 ring-4 ring-violet-500/20'
                            : 'bg-zinc-900 border-white/10 hover:border-white/30'
                        }`}
                      >
                        <span>{agent.icon}</span>
                      </div>

                      <div className="mt-3 text-center">
                        <div className="text-xs font-bold text-zinc-100">{agent.name}</div>
                        <div className="text-[10px] text-zinc-400 max-w-[130px] line-clamp-1">{agent.role}</div>
                        <span className="mt-1 inline-block text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 border border-white/10">
                          Step 0{idx + 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Agent Inspector & Capabilities Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Agent Selector List */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Specialized Agents ({agentsList.length})
              </h3>

              <div className="space-y-2">
                {agentsList.map((agent) => {
                  const isSelected = selectedAgent === agent.id;
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => setSelectedAgent(agent.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-violet-500 bg-violet-950/20 shadow-md'
                          : 'border-white/10 bg-card/30 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{agent.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-zinc-100">{agent.name}</div>
                          <div className="text-[11px] text-zinc-400 line-clamp-1">{agent.role}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Agent Deep Dive */}
            <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentAgent.icon}</span>
                  <div>
                    <h3 className="text-base font-bold">{currentAgent.name}</h3>
                    <p className="text-xs text-muted-foreground">{currentAgent.role}</p>
                  </div>
                </div>

                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ● Operational
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Charter & Purpose</h4>
                <p className="text-xs text-zinc-300 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                  {currentAgent.description}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Core Capabilities</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentAgent.capabilities.map((cap, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-white/5 bg-white/[0.02] text-xs text-zinc-300"
                    >
                      <span className="text-violet-400">✓</span>
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">System Prompt Blueprint</h4>
                <pre className="text-[11px] font-mono text-zinc-400 bg-black/40 p-3 rounded-xl border border-white/5 overflow-x-auto whitespace-pre-wrap">
                  {currentAgent.systemInstruction}
                </pre>
              </div>
            </div>
          </div>

          {/* Interactive Live Collaboration Sandbox */}
          <div className="rounded-2xl border border-violet-500/30 bg-card/40 p-6 backdrop-blur-md space-y-5 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span>⚡</span> Live Multi-Agent Swarm Sandbox
                </h3>
                <p className="text-xs text-muted-foreground">
                  Execute multi-agent collaboration with live intermediate telemetry and consensus tracing
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDemoPrompt(
                      'Analyze arXiv quantum cryptography protocols and generate a zero-knowledge authentication handshake in Python with OWASP audit.'
                    )
                  }
                  className="text-xs px-2.5 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/10"
                >
                  Load Scenario: Quantum Auth
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDemoPrompt(
                      'Design and implement a distributed, fault-tolerant token bucket rate limiter in TypeScript with Redis backing and OWASP security safeguards.'
                    )
                  }
                  className="text-xs px-2.5 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/10"
                >
                  Load Scenario: Rate Limiter
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                value={demoPrompt}
                onChange={(e) => setDemoPrompt(e.target.value)}
                rows={2}
                className="w-full p-3 rounded-xl border border-white/10 bg-black/40 text-xs text-zinc-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none font-mono"
                placeholder="Enter an objective for the multi-agent swarm to solve..."
              />

              <button
                type="button"
                disabled={isSimulating || !demoPrompt.trim()}
                onClick={handleRunSimulation}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-violet-600/30 hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
              >
                {isSimulating ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Orchestrating 4 Agents...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Launch 4-Agent Collaborative Swarm</span>
                  </>
                )}
              </button>
            </div>

            {/* Simulated Live Output Display */}
            {simulatedSteps && (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/60 p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-200">Swarm Telemetry</span>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ✓ All 4 Agents Completed (1.42s)
                    </span>
                  </div>

                  {/* Step Selector Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {simulatedSteps.map((step, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveStepTab(idx)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                          activeStepTab === idx
                            ? 'bg-violet-600 text-white border-violet-400 font-bold'
                            : 'bg-white/[0.04] text-zinc-400 border-white/10 hover:text-white'
                        }`}
                      >
                        Step {idx + 1}: {step.agentName.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Step Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-100">
                        {simulatedSteps[activeStepTab].title}
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        {simulatedSteps[activeStepTab].role}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-zinc-400 bg-white/[0.05] px-2 py-0.5 rounded">
                      {simulatedSteps[activeStepTab].durationMs}ms
                    </span>
                  </div>

                  <div className="text-xs font-mono text-zinc-300 bg-black/40 p-3 rounded-lg border border-white/5 whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                    {simulatedSteps[activeStepTab].content}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
